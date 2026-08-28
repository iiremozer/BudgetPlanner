import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Masthead from './components/Masthead.jsx';
import EntryForm from './components/EntryForm.jsx';
import GoalList from './components/GoalList.jsx';
import Ledger from './components/Ledger.jsx';
import SharedBook from './components/SharedBook.jsx';
import { loadState, saveState, makeId } from './lib/storage.js';
import { totalSaved, currentStreak } from './lib/savings.js';
import { formatMoney } from './lib/money.js';
import { mergeState, markDeleted, shareable } from './lib/sync.js';
import { readBook, writeBook, isRemoteConfigured } from './lib/remote.js';

const BURST_MS = 1050;
const SYNC_DEBOUNCE_MS = 1200;

export default function App() {
  const [state, setState] = useState(() => loadState());
  const [burst, setBurst] = useState(null);
  const [status, setStatus] = useState('idle');
  const [lastSync, setLastSync] = useState(null);

  const stateRef = useRef(state);
  const burstTimer = useRef(null);
  const syncTimer = useRef(null);
  const inFlight = useRef(false);

  useEffect(() => {
    stateRef.current = state;
    saveState(state);
  }, [state]);

  useEffect(() => () => {
    clearTimeout(burstTimer.current);
    clearTimeout(syncTimer.current);
  }, []);

  const code = state.book?.code ?? null;

  const sync = useCallback(async () => {
    if (!code || !isRemoteConfigured() || inFlight.current) return;
    inFlight.current = true;
    setStatus('syncing');
    try {
      const remote = await readBook(code);
      // Birleştirmeyi burada yapıyoruz: setState güncelleyicisi sonradan
      // çalıştığı için sonucu oradan okumak güvenilir değil.
      const merged = mergeState(stateRef.current, remote);
      stateRef.current = merged;
      setState(merged);
      await writeBook(code, shareable(merged));
      setStatus('idle');
      setLastSync(new Date());
    } catch {
      setStatus('error');
    } finally {
      inFlight.current = false;
    }
  }, [code]);

  // Değişiklikten kısa süre sonra ve sekmeye dönünce eşitle.
  useEffect(() => {
    if (!code) return undefined;
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(sync, SYNC_DEBOUNCE_MS);
    return () => clearTimeout(syncTimer.current);
  }, [code, sync, state.entries, state.goals, state.currency, state.deleted]);

  useEffect(() => {
    if (!code) return undefined;
    const onFocus = () => sync();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [code, sync]);

  const total = useMemo(() => totalSaved(state.entries), [state.entries]);
  const streak = useMemo(() => currentStreak(state.entries), [state.entries]);

  function addEntry({ amount, note, goalId, emoji }) {
    const entry = {
      id: makeId('e'),
      amount,
      note,
      goalId,
      emoji: emoji ?? null,
      by: state.member?.name ?? '',
      at: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, entries: [...prev.entries, entry] }));
    setBurst(entry);
    if (navigator.vibrate) navigator.vibrate(18);
    clearTimeout(burstTimer.current);
    burstTimer.current = setTimeout(() => setBurst(null), BURST_MS);
  }

  function removeEntry(id) {
    setState((prev) => ({
      ...prev,
      entries: prev.entries.filter((e) => e.id !== id),
      deleted: markDeleted(prev.deleted, 'entries', id),
    }));
  }

  function addGoal({ name, target, emoji, plan }) {
    const now = new Date().toISOString();
    const goal = { id: makeId('g'), name, target, emoji, plan: plan ?? null, createdAt: now, updatedAt: now };
    setState((prev) => ({ ...prev, goals: [...prev.goals, goal] }));
  }

  function removeGoal(id) {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
      entries: prev.entries.map((e) => (e.goalId === id ? { ...e, goalId: null } : e)),
      deleted: markDeleted(prev.deleted, 'goals', id),
    }));
  }

  return (
    <div className="app">
      <Masthead
        currency={state.currency}
        onCurrencyChange={(currency) =>
          setState((prev) => ({ ...prev, currency, currencyAt: new Date().toISOString() }))
        }
      />

      <section className="hero">
        <p className="hero-label">Total saved</p>
        <p className={`hero-amount${burst ? ' is-bumped' : ''}`}>
          {formatMoney(total, state.currency)}
        </p>
        <div className="hero-meta">
          <span className={`pill${streak > 0 ? ' pill-live' : ''}`}>
            {streak > 0 ? `${streak} day streak` : 'No streak yet'}
          </span>
          <span className="pill">
            {state.entries.length} {state.entries.length === 1 ? 'win' : 'wins'}
          </span>
        </div>
      </section>

      <EntryForm currency={state.currency} goals={state.goals} onAdd={addEntry} />

      <GoalList
        goals={state.goals}
        entries={state.entries}
        currency={state.currency}
        onAdd={addGoal}
        onRemove={removeGoal}
      />

      <Ledger
        entries={state.entries}
        goals={state.goals}
        currency={state.currency}
        lastId={burst?.id}
        onRemove={removeEntry}
      />

      <SharedBook
        member={state.member}
        book={state.book}
        status={status}
        lastSync={lastSync}
        onSetName={(name) =>
          setState((prev) => ({ ...prev, member: { id: makeId('m'), name } }))
        }
        onJoin={(bookCode) => setState((prev) => ({ ...prev, book: { code: bookCode } }))}
        onLeave={() => setState((prev) => ({ ...prev, book: null }))}
        onSyncNow={sync}
      />

      <p className="footnote">
        {state.book ? 'Shared book · synced' : 'Saved on this device only'}
      </p>

      {burst ? (
        <div className="burst" aria-hidden="true">
          <div className="burst-pill">+{formatMoney(burst.amount, state.currency)}</div>
        </div>
      ) : null}
    </div>
  );
}
