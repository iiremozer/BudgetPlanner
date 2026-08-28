import { useEffect, useState } from 'react';
import { parseAmount, formatMoney, CURRENCIES } from '../lib/money.js';
import { PRESETS, presetAmount } from '../lib/presets.js';
import { sortGoals, primaryGoal } from '../lib/goals.js';
import { iconForEmoji } from '../lib/icons.js';
import { colorOf } from '../lib/colors.js';
import Icon from './Icon.jsx';

export default function EntryForm({ currency, goals, entries, generalName, onAdd }) {
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [goalId, setGoalId] = useState(null);
  const [picked, setPicked] = useState(null);
  const [error, setError] = useState('');
  const [touchedGoal, setTouchedGoal] = useState(false);

  const ordered = sortGoals(goals);
  const suggested = primaryGoal(goals, entries);

  // Kullanıcı elle seçmediyse öncelik sırasındaki hedefe yaz.
  useEffect(() => {
    if (!touchedGoal) setGoalId(suggested ? suggested.id : null);
  }, [suggested?.id, touchedGoal]);

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
    onAdd({ amount: parsed, note: note.trim(), emoji: preset ? preset.emoji : null, goalId });
    setNote('');
    setAmount('');
    setPicked(null);
    setError('');
    setTouchedGoal(false);
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
              <span className="tile-icon">
                <Icon name={iconForEmoji(preset.emoji)} size={22} />
              </span>
              <span className="tile-label">{preset.label}</span>
            </button>
          ))}
        </div>

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
          <span className="field-label">Goes to</span>
          <div className="chips">
            {ordered.map((goal) => (
              <button
                key={goal.id}
                type="button"
                className="chip"
                aria-pressed={goalId === goal.id}
                onClick={() => {
                  setGoalId(goal.id);
                  setTouchedGoal(true);
                }}
                style={{ '--tone': colorOf(goal.color).base }}
              >
                <Icon name={iconForEmoji(goal.emoji)} size={16} />
                {goal.name}
              </button>
            ))}
            <button
              type="button"
              className="chip"
              aria-pressed={goalId === null}
              onClick={() => {
                setGoalId(null);
                setTouchedGoal(true);
              }}
            >
              <Icon name="coins" size={16} />
              {generalName}
            </button>
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
