import { useState } from 'react';
import { formatMoney, parseAmount } from '../lib/money.js';
import { goalProgress } from '../lib/savings.js';
import { PERIOD_IDS, PERIODS, periodsNeeded, finishDate, ratePerWeek, weeksAtRate } from '../lib/pace.js';
import Jar from './Jar.jsx';

const EMOJIS = ['🎯', '🏖️', '🏠', '🚗', '📚', '🎁', '🛫', '🪴'];

function planLine(goal, progress, entries, currency) {
  if (goal.plan) {
    const periods = periodsNeeded(progress.remaining, goal.plan.perPeriod);
    if (periods === 0) return null;
    if (periods !== null) {
      const end = finishDate(progress.remaining, goal.plan.perPeriod, goal.plan.period);
      const unit = PERIODS[goal.plan.period].label.toLowerCase();
      const plural = periods === 1 ? unit : `${unit}s`;
      return `${formatMoney(goal.plan.perPeriod, currency)} ${PERIODS[goal.plan.period].adverb} · ${periods} ${plural} left${
        end ? ` · ${end.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}` : ''
      }`;
    }
  }

  const rate = ratePerWeek(entries, goal.id);
  const weeks = weeksAtRate(progress.remaining, rate);
  if (weeks === null || weeks === 0) return null;
  return `At your pace, about ${weeks} ${weeks === 1 ? 'week' : 'weeks'} to go`;
}

export default function GoalList({ goals, entries, currency, onAdd, onRemove }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [hasTarget, setHasTarget] = useState(true);
  const [target, setTarget] = useState('');
  const [perPeriod, setPerPeriod] = useState('');
  const [period, setPeriod] = useState('week');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
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
            end ? ` · done by ${end.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}` : ''
          }`;
        })()
      : null;

  function reset() {
    setName('');
    setTarget('');
    setPerPeriod('');
    setPeriod('week');
    setHasTarget(true);
    setEmoji(EMOJIS[0]);
    setError('');
    setOpen(false);
  }

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Give the goal a name.');
      return;
    }
    if (hasTarget && (targetValue === null || targetValue <= 0)) {
      setError('Enter a target amount, or switch to open-ended.');
      return;
    }
    onAdd({
      name: trimmed,
      target: hasTarget ? targetValue : 0,
      emoji,
      plan: hasTarget && perValue ? { perPeriod: perValue, period } : null,
    });
    reset();
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2 className="card-title">Goals</h2>
        {goals.length > 0 ? <span className="card-note">{goals.length}</span> : null}
      </div>

      {goals.length === 0 && !open ? (
        <p className="hint" style={{ marginBottom: 14 }}>
          Nothing to aim at yet. Add something you are saving for and watch the jar fill.
        </p>
      ) : null}

      {goals.map((goal) => {
        const p = goalProgress(goal, entries);
        const line = planLine(goal, p, entries, currency);
        return (
          <article key={goal.id} className={`goal${p.complete ? ' goal-done' : ''}`}>
            <Jar ratio={p.ratio} emoji={goal.emoji} complete={p.complete} />

            <div className="goal-body">
              <div className="goal-name">{goal.name}</div>
              <div className="goal-figure">
                <strong>{formatMoney(p.saved, currency)}</strong>
                {p.target > 0 ? ` of ${formatMoney(p.target, currency)}` : ' saved'}
              </div>

              {p.complete ? (
                <div className="goal-tag">Reached</div>
              ) : line ? (
                <div className="goal-pace">{line}</div>
              ) : p.target > 0 ? (
                <div className="goal-pace">{formatMoney(p.remaining, currency)} to go</div>
              ) : (
                <div className="goal-pace">Open-ended</div>
              )}

              <button type="button" className="link" onClick={() => onRemove(goal.id)}>
                Remove
              </button>
            </div>
          </article>
        );
      })}

      {open ? (
        <div className="stack" style={{ marginTop: goals.length ? 18 : 0 }}>
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

          <div className="segmented" role="group" aria-label="Goal type">
            <button
              type="button"
              className="segment"
              aria-pressed={hasTarget}
              onClick={() => setHasTarget(true)}
            >
              I have a target
            </button>
            <button
              type="button"
              className="segment"
              aria-pressed={!hasTarget}
              onClick={() => setHasTarget(false)}
            >
              Just saving
            </button>
          </div>

          {hasTarget ? (
            <>
              <div>
                <label className="field-label" htmlFor="goal-target">
                  Target amount
                </label>
                <input
                  id="goal-target"
                  className="control control-amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="1000"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="goal-per">
                  Put aside (optional)
                </label>
                <div className="two-up">
                  <input
                    id="goal-per"
                    className="control control-amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="50"
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
          <button type="button" className="btn btn-ghost" onClick={reset}>
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn btn-ghost"
          style={{ marginTop: goals.length ? 18 : 0 }}
          onClick={() => setOpen(true)}
        >
          New goal
        </button>
      )}
    </section>
  );
}
