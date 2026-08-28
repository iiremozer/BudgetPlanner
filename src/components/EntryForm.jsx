import { useState } from 'react';
import { parseAmount, formatMoney, CURRENCIES } from '../lib/money.js';
import { PRESETS, presetAmount } from '../lib/presets.js';

export default function EntryForm({ currency, goals, onAdd }) {
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [goalId, setGoalId] = useState('');
  const [picked, setPicked] = useState(null);
  const [error, setError] = useState('');

  const symbol = CURRENCIES[currency].symbol;
  const parsed = parseAmount(amount);
  const ready = parsed !== null && parsed > 0;

  function choose(preset) {
    const next = picked === preset.id ? null : preset.id;
    setPicked(next);
    setError('');
    if (next) {
      setNote(preset.label);
      setAmount(formatMoney(presetAmount(preset, currency), currency, { showSymbol: false }));
    } else {
      setNote('');
      setAmount('');
    }
  }

  function submit() {
    if (parsed === null) {
      setError('Enter the amount as a number, like 5 or 4.50.');
      return;
    }
    if (parsed <= 0) {
      setError('The amount needs to be more than zero.');
      return;
    }
    const preset = PRESETS.find((p) => p.id === picked);
    onAdd({
      amount: parsed,
      note: note.trim(),
      emoji: preset ? preset.emoji : null,
      goalId: goalId === '' ? null : goalId,
    });
    setNote('');
    setAmount('');
    setPicked(null);
    setError('');
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2 className="card-title">What did you skip?</h2>
      </div>

      <div className="stack">
        <div className="tiles">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="tile"
              aria-pressed={picked === preset.id}
              onClick={() => choose(preset)}
            >
              <span className="tile-emoji" aria-hidden="true">
                {preset.emoji}
              </span>
              <span className="tile-label">{preset.label}</span>
            </button>
          ))}
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

        <div>
          <label className="field-label" htmlFor="note">
            Note (optional)
          </label>
          <input
            id="note"
            className="control"
            type="text"
            placeholder="Made it at home instead"
            value={note}
            maxLength={80}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {error ? <p className="error">{error}</p> : null}

        <button type="button" className="btn" onClick={submit} disabled={!ready}>
          {ready ? `Save ${formatMoney(parsed, currency)}` : 'Save'}
        </button>
      </div>
    </section>
  );
}
