import { useEffect, useMemo, useRef, useState } from 'react';
import Cover from './components/Cover.jsx';
import EntryForm from './components/EntryForm.jsx';
import GoalList from './components/GoalList.jsx';
import Ledger from './components/Ledger.jsx';
import Stamp from './components/Stamp.jsx';
import { loadState, saveState, makeId } from './lib/storage.js';
import { totalSaved, currentStreak } from './lib/savings.js';
import { formatMoney } from './lib/money.js';

const STAMP_MS = 1150;

export default function App() {
  const [state, setState] = useState(() => loadState());
  const [stamp, setStamp] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const total = useMemo(() => totalSaved(state.entries), [state.entries]);
  const streak = useMemo(() => currentStreak(state.entries), [state.entries]);

  function addEntry({ amount, note, goalId }) {
    const entry = {
      id: makeId('e'),
      amount,
      note,
      goalId,
      at: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, entries: [...prev.entries, entry] }));
    setStamp(entry);
    if (navigator.vibrate) navigator.vibrate(18);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStamp(null), STAMP_MS);
  }

  function removeEntry(id) {
    setState((prev) => ({ ...prev, entries: prev.entries.filter((e) => e.id !== id) }));
  }

  function addGoal({ name, target, emoji }) {
    const goal = { id: makeId('g'), name, target, emoji, createdAt: new Date().toISOString() };
    setState((prev) => ({ ...prev, goals: [...prev.goals, goal] }));
  }

  function removeGoal(id) {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
      entries: prev.entries.map((e) => (e.goalId === id ? { ...e, goalId: null } : e)),
    }));
  }

  function setCurrency(currency) {
    setState((prev) => ({ ...prev, currency }));
  }

  return (
    <div className="book">
      <Cover currency={state.currency} onCurrencyChange={setCurrency} />

      <main className="page">
        <div className="total">
          <p className="total-label">Toplam Birikim</p>
          <p className="total-amount">{formatMoney(total, state.currency)}</p>
          <div className="total-meta">
            <span className={`badge${streak > 0 ? ' badge-hot' : ''}`}>
              {streak > 0 ? `${streak} gün üst üste` : 'Seri bekliyor'}
            </span>
            <span className="badge">{state.entries.length} kazanç</span>
          </div>
        </div>

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
          lastId={stamp?.id}
          onRemove={removeEntry}
        />
      </main>

      <footer className="colophon">Bu defter yalnızca bu cihazda tutulur</footer>

      {stamp ? (
        <Stamp amount={stamp.amount} currency={state.currency} at={stamp.at} />
      ) : null}
    </div>
  );
}
