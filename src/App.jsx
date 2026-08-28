import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Masthead from './components/Masthead.jsx';
import EntryForm from './components/EntryForm.jsx';
import GoalList from './components/GoalList.jsx';
import Ledger from './components/Ledger.jsx';
import MemberCard from './components/MemberCard.jsx';
import { loadState, saveState, makeId } from './lib/storage.js';
import { totalSaved, currentStreak } from './lib/savings.js';
import { formatMoney } from './lib/money.js';
import { markDeleted, shareableGoal, mergeGoalBook } from './lib/sync.js';
import { moveGoal, normalizeOrders } from './lib/goals.js';
import { readBook, writeBook, isRemoteConfigured } from './lib/remote.js';

const BURST_MS = 1050;
const SYNC_DEBOUNCE_MS = 1200;

function statusText(status, lastSync) {
  if (status === 'syncing') return 'Syncing…';
  if (status === 'error') return 'Offline — will retry';
  if (lastSync) {
    return `Last synced ${lastSync.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }
  return 'Not synced yet';
}

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

  const sharedCodes = state.goals
    .filter((g) => g.share?.code)
    .map((g) => `${g.id}:${g.share.code}`)
    .join(',');

  const sync = useCallback(async () => {
    if (!isRemoteConfigured() || inFlight.current) return;
    const shared = stateRef.current.goals.filter((g) => g.share?.code);
    if (shared.length === 0) return;

    inFlight.current = true;
    setStatus('syncing');
    try {
      for (const goal of shared) {
        const code = goal.share.code;
        const remote = await readBook(code);
        // Birleştirmeyi burada yapıyoruz: setState güncelleyicisi sonradan
        // çalıştığı için sonucu oradan okumak güvenilir değil.
        const merged = mergeGoalBook(stateRef.current, remote, goal.id);
        stateRef.current = merged;
        setState(merged);
        await writeBook(code, shareableGoal(merged, goal.id));
      }
      setStatus('idle');
      setLastSync(new Date());
    } catch {
      setStatus('error');
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    if (!sharedCodes) return undefined;
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(sync, SYNC_DEBOUNCE_MS);
    return () => clearTimeout(syncTimer.current);
  }, [sharedCodes, sync, state.entries, state.goals]);

  useEffect(() => {
    if (!sharedCodes) return undefined;
    const onFocus = () => sync();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [sharedCodes, sync]);

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

  function reassignEntry(id, goalId) {
    setState((prev) => ({
      ...prev,
      entries: prev.entries.map((e) => (e.id === id ? { ...e, goalId } : e)),
    }));
  }

  function addGoal({ name, target, emoji, plan, share }) {
    const now = new Date().toISOString();
    const goal = {
      id: makeId('g'),
      name,
      target,
      emoji,
      plan: plan ?? null,
      share: share ?? null,
      createdAt: now,
      updatedAt: now,
    };
    setState((prev) => ({ ...prev, goals: normalizeOrders([...prev.goals, goal]) }));
  }

  function removeGoal(id) {
    setState((prev) => ({
      ...prev,
      goals: normalizeOrders(prev.goals.filter((g) => g.id !== id)),
      entries: prev.entries.map((e) => (e.goalId === id ? { ...e, goalId: null } : e)),
      deleted: markDeleted(prev.deleted, 'goals', id),
    }));
  }

  function reorderGoal(id, direction) {
    setState((prev) => ({ ...prev, goals: moveGoal(prev.goals, id, direction) }));
  }

  function shareGoal(id, code) {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === id ? { ...g, share: { code } } : g)),
    }));
  }

  function unshareGoal(id) {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === id ? { ...g, share: null } : g)),
    }));
  }

  async function joinGoal(code) {
    setStatus('syncing');
    try {
      const remote = await readBook(code);
      if (!remote || !remote.goal) {
        setStatus('error');
        return;
      }
      const goalId = remote.goal.id;
      const merged = mergeGoalBook(stateRef.current, remote, goalId);
      const withShare = {
        ...merged,
        goals: normalizeOrders(
          merged.goals.map((g) => (g.id === goalId ? { ...g, share: { code } } : g))
        ),
      };
      stateRef.current = withShare;
      setState(withShare);
      await writeBook(code, shareableGoal(withShare, goalId));
      setStatus('idle');
      setLastSync(new Date());
    } catch {
      setStatus('error');
    }
  }

  const sharedCount = state.goals.filter((g) => g.share?.code).length;

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

      <EntryForm
        currency={state.currency}
        goals={state.goals}
        entries={state.entries}
        onAdd={addEntry}
      />

      <GoalList
        goals={state.goals}
        entries={state.entries}
        currency={state.currency}
        memberName={state.member?.name}
        syncStatus={statusText(status, lastSync)}
        onAdd={addGoal}
        onRemove={removeGoal}
        onMove={reorderGoal}
        onShare={shareGoal}
        onUnshare={unshareGoal}
        onJoin={joinGoal}
      />

      <Ledger
        entries={state.entries}
        goals={state.goals}
        currency={state.currency}
        lastId={burst?.id}
        onRemove={removeEntry}
        onReassign={reassignEntry}
      />

      <MemberCard
        member={state.member}
        onSetName={(name) =>
          setState((prev) => ({
            ...prev,
            member: { id: prev.member?.id ?? makeId('m'), name },
          }))
        }
      />

      <p className="footnote">
        {sharedCount > 0
          ? `${sharedCount} shared ${sharedCount === 1 ? 'goal' : 'goals'} · everything else stays on this device`
          : 'Saved on this device only'}
      </p>

      {burst ? (
        <div className="burst" aria-hidden="true">
          <div className="burst-pill">+{formatMoney(burst.amount, state.currency)}</div>
        </div>
      ) : null}
    </div>
  );
}
