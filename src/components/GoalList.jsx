import { useState } from 'react';
import { formatMoney, parseAmount } from '../lib/money.js';
import { goalProgress } from '../lib/savings.js';
import { PERIOD_IDS, PERIODS, periodsNeeded, finishDate, ratePerWeek, weeksAtRate } from '../lib/pace.js';
import { sortGoals, uniqueGoalName } from '../lib/goals.js';
import { formatCode, makeBookCode, normalizeCode } from '../lib/code.js';
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

export default function GoalList({
  goals,
  entries,
  currency,
  memberName,
  syncStatus,
  onAdd,
  onRemove,
  onMove,
  onShare,
  onUnshare,
  onJoin,
}) {
  const [openShare, setOpenShare] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [copied, setCopied] = useState(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [hasTarget, setHasTarget] = useState(true);
  const [target, setTarget] = useState('');
  const [perPeriod, setPerPeriod] = useState('');
  const [period, setPeriod] = useState('week');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [shareOnCreate, setShareOnCreate] = useState(false);
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
    setShareOnCreate(false);
    setError('');
    setOpen(false);
  }

  function submit() {
    const trimmed = name.trim();
    // Hedefsiz birikimde ad zorunlu değil; adsız kalırsa kendimiz veririz.
    const finalName = trimmed || (hasTarget ? '' : uniqueGoalName('Savings', goals));
    if (!finalName) {
      setError('Give the goal a name.');
      return;
    }
    if (hasTarget && (targetValue === null || targetValue <= 0)) {
      setError('Enter a target amount, or switch to just saving.');
      return;
    }
    onAdd({
      name: finalName,
      target: hasTarget ? targetValue : 0,
      emoji,
      plan: hasTarget && perValue ? { perPeriod: perValue, period } : null,
      share: shareOnCreate ? { code: makeBookCode() } : null,
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

      {sortGoals(goals).map((goal, index, list) => {
        const p = goalProgress(goal, entries);
        const line = planLine(goal, p, entries, currency);
        return (
          <article key={goal.id} className={`goal${p.complete ? ' goal-done' : ''}`}>
            <Jar ratio={p.ratio} emoji={goal.emoji} complete={p.complete} />

            <div className="goal-body">
              <div className="goal-name">
                {goal.name}
                {index === 0 ? <span className="goal-badge">Priority</span> : null}
                {goal.share ? (
                  <span className="goal-badge goal-badge-shared">Shared</span>
                ) : null}
              </div>
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

              <div className="goal-actions">
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Move up"
                  disabled={index === 0}
                  onClick={() => onMove(goal.id, 'up')}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Move down"
                  disabled={index === list.length - 1}
                  onClick={() => onMove(goal.id, 'down')}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={`share-btn${goal.share ? ' share-btn-on' : ''}`}
                  onClick={() => setOpenShare(openShare === goal.id ? null : goal.id)}
                >
                  {goal.share ? '👥 Shared' : '👥 Share'}
                </button>
                <button type="button" className="link" onClick={() => onRemove(goal.id)}>
                  Remove
                </button>
              </div>

              {openShare === goal.id ? (
                goal.share ? (
                  <div className="share-panel">
                    <button
                      type="button"
                      className="code-box"
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(goal.share.code);
                          setCopied(goal.id);
                          setTimeout(() => setCopied(null), 1600);
                        }
                      }}
                    >
                      <span className="code-value">{formatCode(goal.share.code)}</span>
                      <span className="code-hint">
                        {copied === goal.id ? 'Copied' : 'Tap to copy'}
                      </span>
                    </button>
                    <p className="hint">
                      Only this goal is shared. Your other goals, the general pot and everything
                      else stay on your phone. Anyone with the code can open this goal, so share it
                      carefully.
                    </p>
                    <p className="sync-status">{syncStatus}</p>
                    <button type="button" className="link" onClick={() => onUnshare(goal.id)}>
                      Stop sharing
                    </button>
                  </div>
                ) : (
                  <div className="share-panel">
                    <p className="hint">
                      Share just this goal with someone. Only this goal and its entries leave your
                      phone.
                    </p>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        onShare(goal.id, makeBookCode());
                      }}
                    >
                      Create a share code
                    </button>
                  </div>
                )
              ) : null}
            </div>
          </article>
        );
      })}

      {joining ? (
        <div className="stack" style={{ marginTop: goals.length ? 18 : 0 }}>
          <p className="hint">Enter the code someone shared with you.</p>
          <input
            className="control code-input"
            type="text"
            autoCapitalize="characters"
            placeholder="ABCD EFGH 2345"
            value={joinCode}
            onChange={(e) => {
              setJoinCode(e.target.value);
              setJoinError('');
            }}
          />
          {joinError ? <p className="error">{joinError}</p> : null}
          <button
            type="button"
            className="btn"
            onClick={() => {
              const code = normalizeCode(joinCode);
              if (!code) {
                setJoinError('That code does not look right.');
                return;
              }
              onJoin(code);
              setJoining(false);
              setJoinCode('');
            }}
          >
            Join goal
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setJoining(false)}>
            Cancel
          </button>
        </div>
      ) : open ? (
        <div className="stack" style={{ marginTop: goals.length ? 18 : 0 }}>
          <div>
            <label className="field-label" htmlFor="goal-name">
              {hasTarget ? 'Name' : 'Name (optional)'}
            </label>
            <input
              id="goal-name"
              className="control"
              type="text"
              placeholder={hasTarget ? 'Summer trip' : 'Savings'}
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
            <span className="field-label">Who is it for</span>
            <div className="segmented">
              <button
                type="button"
                className="segment"
                aria-pressed={!shareOnCreate}
                onClick={() => setShareOnCreate(false)}
              >
                Just me
              </button>
              <button
                type="button"
                className="segment"
                aria-pressed={shareOnCreate}
                onClick={() => setShareOnCreate(true)}
              >
                Shared
              </button>
            </div>
            {shareOnCreate ? (
              <p className="preview">
                You will get a code to send. Only this goal leaves your phone.
              </p>
            ) : null}
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
          <button type="button" className="btn btn-ghost" onClick={reset}>
            Cancel
          </button>
        </div>
      ) : (
        <div className="stack" style={{ marginTop: goals.length ? 18 : 0 }}>
          <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)}>
            New goal
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setJoining(true)}>
            Join a shared goal
          </button>
        </div>
      )}
    </section>
  );
}
