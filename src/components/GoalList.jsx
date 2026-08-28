import { useState } from 'react';
import { formatMoney, parseAmount } from '../lib/money.js';
import { goalProgress } from '../lib/savings.js';

const EMOJIS = ['🎯', '🏖️', '🏠', '🚗', '📚', '🎁', '🛫', '🪴'];

export default function GoalList({ goals, entries, currency, onAdd, onRemove }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [error, setError] = useState('');

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Give the goal a name.');
      return;
    }
    const parsed = target.trim() === '' ? 0 : parseAmount(target);
    if (parsed === null) {
      setError('The target must be a number, or leave it empty.');
      return;
    }
    onAdd({ name: trimmed, target: parsed, emoji });
    setName('');
    setTarget('');
    setEmoji(EMOJIS[0]);
    setError('');
    setOpen(false);
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2 className="card-title">Goals</h2>
        {goals.length > 0 ? <span className="card-note">{goals.length}</span> : null}
      </div>

      {goals.length === 0 && !open ? (
        <p className="hint" style={{ marginBottom: 14 }}>
          Nothing to aim at yet. Add something you are saving for and watch it fill.
        </p>
      ) : null}

      {goals.map((goal) => {
        const p = goalProgress(goal, entries);
        return (
          <article key={goal.id} className={`goal${p.complete ? ' goal-done' : ''}`}>
            <div className="goal-top">
              <span className="goal-emoji" aria-hidden="true">
                {goal.emoji}
              </span>
              <span className="goal-name">{goal.name}</span>
              <span className="goal-figure">
                {formatMoney(p.saved, currency)}
                {p.target > 0 ? ` / ${formatMoney(p.target, currency)}` : ''}
              </span>
            </div>

            {p.target > 0 ? (
              <div
                className="goal-track"
                role="progressbar"
                aria-valuenow={p.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${goal.name} progress`}
              >
                <div className="goal-fill" style={{ width: `${p.ratio * 100}%` }} />
              </div>
            ) : null}

            <div className="goal-foot">
              {p.complete ? (
                <span className="goal-done-tag">Reached</span>
              ) : (
                <span>
                  {p.target > 0
                    ? `${p.percent}% · ${formatMoney(p.remaining, currency)} to go`
                    : 'Open-ended'}
                </span>
              )}
              <button type="button" className="link" onClick={() => onRemove(goal.id)}>
                Remove
              </button>
            </div>
          </article>
        );
      })}

      {open ? (
        <div className="stack" style={{ marginTop: goals.length ? 16 : 0 }}>
          <div>
            <label className="field-label" htmlFor="goal-name">
              Name
            </label>
            <input
              id="goal-name"
              className="control"
              type="text"
              placeholder="Summer trip"
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="goal-target">
              Target amount (optional)
            </label>
            <input
              id="goal-target"
              className="control control-amount"
              type="text"
              inputMode="decimal"
              placeholder="1500"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </div>

          <div>
            <span className="field-label">Icon</span>
            <div className="chips">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  className="chip"
                  aria-pressed={emoji === e}
                  onClick={() => setEmoji(e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {error ? <p className="error">{error}</p> : null}

          <button type="button" className="btn" onClick={submit}>
            Create goal
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn btn-ghost"
          style={{ marginTop: goals.length ? 16 : 0 }}
          onClick={() => setOpen(true)}
        >
          New goal
        </button>
      )}
    </section>
  );
}
