import { useState } from 'react';
import { parseAmount, formatMoney } from '../lib/money.js';
import { PALETTE, colorForEmoji } from '../lib/colors.js';
import { PERIOD_IDS, PERIODS, periodsNeeded, finishDate } from '../lib/pace.js';

const EMOJIS = ['🎯', '🏖️', '🏠', '🚗', '📚', '🎁', '🛫', '🪴'];

export default function GoalEditor({ goal, currency, onSave, onCancel }) {
  const [name, setName] = useState(goal.name);
  const [hasTarget, setHasTarget] = useState(goal.target > 0);
  const [target, setTarget] = useState(
    goal.target > 0 ? formatMoney(goal.target, currency, { showSymbol: false }) : ''
  );
  const [perPeriod, setPerPeriod] = useState(
    goal.plan ? formatMoney(goal.plan.perPeriod, currency, { showSymbol: false }) : ''
  );
  const [period, setPeriod] = useState(goal.plan?.period ?? 'week');
  const [emoji, setEmoji] = useState(goal.emoji);
  const [color, setColor] = useState(goal.color);
  const [error, setError] = useState('');

  const targetValue = hasTarget ? parseAmount(target) : 0;
  const perValue = parseAmount(perPeriod);

  const preview =
    hasTarget && targetValue && perValue
      ? (() => {
          const n = periodsNeeded(targetValue, perValue);
          const end = finishDate(targetValue, perValue, period);
          const unit = PERIODS[period].label.toLowerCase();
          return `${n} ${n === 1 ? unit : `${unit}s`}${
            end ? ` · ${end.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}` : ''
          }`;
        })()
      : null;

  function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Give the goal a name.');
      return;
    }
    if (hasTarget && (targetValue === null || targetValue <= 0)) {
      setError('Enter a target amount, or switch to just saving.');
      return;
    }
    onSave({
      name: trimmed,
      target: hasTarget ? targetValue : 0,
      emoji,
      color,
      plan: hasTarget && perValue ? { perPeriod: perValue, period } : null,
    });
  }

  return (
    <div className="edit-panel stack">
      <div>
        <label className="field-label" htmlFor={`name-${goal.id}`}>
          Name
        </label>
        <input
          id={`name-${goal.id}`}
          className="control"
          type="text"
          value={name}
          maxLength={40}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
        />
      </div>

      <div className="segmented">
        <button type="button" className="segment" aria-pressed={hasTarget} onClick={() => setHasTarget(true)}>
          I have a target
        </button>
        <button type="button" className="segment" aria-pressed={!hasTarget} onClick={() => setHasTarget(false)}>
          Just saving
        </button>
      </div>

      {hasTarget ? (
        <>
          <div>
            <label className="field-label" htmlFor={`target-${goal.id}`}>
              Target amount
            </label>
            <input
              id={`target-${goal.id}`}
              className="control control-amount"
              type="text"
              inputMode="decimal"
              value={target}
              onChange={(e) => {
                setTarget(e.target.value);
                setError('');
              }}
            />
          </div>

          <div>
            <label className="field-label" htmlFor={`per-${goal.id}`}>
              Put aside (optional)
            </label>
            <div className="two-up">
              <input
                id={`per-${goal.id}`}
                className="control control-amount"
                type="text"
                inputMode="decimal"
                value={perPeriod}
                onChange={(e) => setPerPeriod(e.target.value)}
              />
              <select
                className="control"
                aria-label="How often"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                {PERIOD_IDS.map((id) => (
                  <option key={id} value={id}>
                    {PERIODS[id].adverb}
                  </option>
                ))}
              </select>
            </div>
            {preview ? <p className="preview">{preview}</p> : null}
          </div>
        </>
      ) : null}

      <div>
        <span className="field-label">Icon</span>
        <div className="chips">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              className="chip"
              aria-pressed={emoji === e}
              onClick={() => {
                setEmoji(e);
                setColor(colorForEmoji(e));
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="field-label">Colour</span>
        <div className="swatches">
          {PALETTE.map((c) => (
            <button
              key={c.id}
              type="button"
              className="swatch"
              aria-label={c.name}
              aria-pressed={color === c.id}
              style={{ background: c.base }}
              onClick={() => setColor(c.id)}
            />
          ))}
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <button type="button" className="btn" onClick={save}>
        Save changes
      </button>
      <button type="button" className="btn btn-ghost" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
