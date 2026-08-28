import { useState } from 'react';
import { parseAmount, formatMoney, CURRENCIES } from '../lib/money.js';

const QUICK = [1, 3, 5, 10];

export default function EntryForm({ currency, goals, onAdd }) {
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [goalId, setGoalId] = useState('');
  const [error, setError] = useState('');

  const symbol = CURRENCIES[currency].symbol;
  const parsed = parseAmount(amount);
  const ready = parsed !== null && parsed > 0;

  function submit() {
    if (parsed === null) {
      setError('Enter the amount as a number, like 5 or 4.50.');
      return;
    }
    if (parsed <= 0) {
      setError('The amount needs to be more than zero.');
      return;
    }
    onAdd({ amount: parsed, note: note.trim(), goalId: goalId === '' ? null : goalId });
    setNote('');
    setAmount('');
    setError('');
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2 className="card-title">Log a win</h2>
      </div>

      <div className="stack">
        <div>
          <label className="field-label" htmlFor="note">
            What you skipped
          </label>
          <input
            id="note"
            className="control"
            type="text"
            placeholder="Skipped a coffee"
            value={note}
            maxLength={80}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="two-up">
          <div>
            <label className="field-label" htmlFor="amount">
              Amount saved
            </label>
            <input
              id="amount"
              className="control control-amount"
              type="text"
              inputMode="decimal"
              placeholder={`${symbol}0.00`}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (error) setError('');
              }}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="goal">
              Goal
            </label>
            <select
              id="goal"
              className="control"
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
            >
              <option value="">General pot</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.emoji} {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="chips">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              className="chip"
              aria-pressed={parsed === q * 100}
              onClick={() => {
                setAmount(String(q));
                setError('');
              }}
            >
              {formatMoney(q * 100, currency)}
            </button>
          ))}
        </div>

        {error ? <p className="error">{error}</p> : null}

        <button type="button" className="btn" onClick={submit} disabled={!ready}>
          Add to the book
        </button>
      </div>
    </section>
  );
}
