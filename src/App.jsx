import { useEffect, useMemo, useRef, useState } from 'react';
import Masthead from './components/Masthead.jsx';
import EntryForm from './components/EntryForm.jsx';
import GoalList from './components/GoalList.jsx';
import Ledger from './components/Ledger.jsx';
import { loadState, saveState, makeId } from './lib/storage.js';
import { totalSaved, currentStreak } from './lib/savings.js';
import { formatMoney } from './lib/money.js';

const BURST_MS = 1050;

export default function App() {
  const [state, setState] = useState(() => loadState());
  const [burst, setBurst] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const total = useMemo(() => totalSaved(state.entries), [state.entries]);
  const streak = useMemo(() => currentStreak(state.entries), [state.entries]);

  function addEntry({ amount, note, goalId, emoji }) {
    const entry = {
      id: makeId('e'),
      amount,
      note,
      goalId,
      emoji: emoji ?? null,
      at: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, entries: [...prev.entries, entry] }));
    setBurst(entry);
    if (navigator.vibrate) navigator.vibrate(18);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setBurst(null), BURST_MS);
  }

  function removeEntry(id) {
    setState((prev) => ({ ...prev, entries: prev.entries.filter((e) => e.id !== id) }));
  }

  function addGoal({ name, target, emoji, plan }) {
    const goal = {
      id: makeId('g'),
      name,
      target,
      emoji,
      plan: plan ?? null,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, goals: [...prev.goals, goal] }));
  }

  function removeGoal(id) {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
      entries: prev.entries.map((e) => (e.goalId === id ? { ...e, goalId: null } : e)),
    }));
  }

  return (
    <div className="app">
      <Masthead
        currency={state.currency}
        onCurrencyChange={(currency) => setState((prev) => ({ ...prev, currency }))}
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

      <p className="footnote">Saved on this device only</p>

      {burst ? (
        <div className="burst" aria-hidden="true">
          <div className="burst-pill">+{formatMoney(burst.amount, state.currency)}</div>
        </div>
      ) : null}
    </div>
  );
}
