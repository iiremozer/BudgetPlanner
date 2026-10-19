import { useRef, useState } from 'react';
import { formatMoney, parseAmount } from '../lib/money.js';

// Kartlar arasındaki boşluk (styles.css: .goal + .goal.goal-tinted margin-top).
const GOAL_GAP = 10;
// Sürüklerken ekranın kenarına bu kadar yaklaşınca sayfa kayar.
const EDGE_PX = 90;
const EDGE_STEP = 10;
import { goalProgress, savedForGoal } from '../lib/savings.js';
import { milestoneProgress } from '../lib/milestones.js';
import {
  PALETTE,
  SLATE,
  colorOf,
  colorForEmoji,
  tintFor,
  nextColor,
  isHexColor,
} from '../lib/colors.js';
import { PERIOD_IDS, PERIODS, periodsNeeded, finishDate, ratePerWeek, weeksAtRate } from '../lib/pace.js';
import { sortGoals, uniqueGoalName } from '../lib/goals.js';
import { formatCode, makeBookCode, normalizeCode, inviteText } from '../lib/code.js';
import { shareText } from '../lib/native.js';
import Jar from './Jar.jsx';
import Contributors from './Contributors.jsx';
import GoalEditor from './GoalEditor.jsx';
import Icon from './Icon.jsx';
import { newFromOthers } from '../lib/contributions.js';

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
  onMoveTop,
  onShare,
  onUnshare,
  onDeleteShared,
  onJoin,
  onSyncNow,
  seen,
  theme,
  onEdit,
  generalName,
  onRenameGeneral,
}) {
  const [openShare, setOpenShare] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [copied, setCopied] = useState(null);
  const [editing, setEditing] = useState(null);
  const [stopping, setStopping] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [sorting, setSorting] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [ownIcon, setOwnIcon] = useState(false);

  // Sürükleme: kartın DOM düğümlerini tutuyoruz ki komşunun ortasını ne zaman
  // geçtiğimizi ölçebilelim. Taşıma, zaten var olan tek adımlık onMove ile
  // yapılıyor; böylece sıralama mantığı tek yerde kalıyor.
  const cardRefs = useRef(new Map());
  const drag = useRef(null);

  function setCardRef(id, node) {
    if (node) cardRefs.current.set(id, node);
    else cardRefs.current.delete(id);
  }

  function dragStart(e, id) {
    if (!sorting) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const node = cardRefs.current.get(id);
    if (!node) return;
    try {
      node.setPointerCapture(e.pointerId);
    } catch {
      // Yakalama desteklenmiyorsa olaylar yine de bu düğüme geliyor.
    }
    drag.current = { id, pointerId: e.pointerId, startY: e.clientY, order: [] };
    setDragId(id);
  }

  function dragMove(e, order) {
    const d = drag.current;
    if (!d || e.pointerId !== d.pointerId) return;
    const node = cardRefs.current.get(d.id);
    if (!node) return;

    const dy = e.clientY - d.startY;
    node.style.transform = `translateY(${dy}px)`;

    // Liste ekrana sığmıyorsa kenara yaklaşınca sayfayı kaydırıyoruz,
    // yoksa alttaki hedefi yukarı taşımak mümkün olmuyor.
    const view = typeof window === 'undefined' ? 0 : window.innerHeight;
    if (view) {
      if (e.clientY < EDGE_PX) window.scrollBy(0, -EDGE_STEP);
      else if (e.clientY > view - EDGE_PX) window.scrollBy(0, EDGE_STEP);
    }

    const index = order.indexOf(d.id);
    const rect = node.getBoundingClientRect();

    const above = index > 0 ? cardRefs.current.get(order[index - 1]) : null;
    if (above) {
      const r = above.getBoundingClientRect();
      if (rect.top < r.top + r.height / 2) {
        // Kart yukarıdakinin yarısını geçti: yer değiştir ve başlangıcı
        // kaydır ki kart parmağın altında kalsın.
        d.startY -= r.height + GOAL_GAP;
        node.style.transform = `translateY(${e.clientY - d.startY}px)`;
        onMove(d.id, 'up');
        return;
      }
    }

    const below = index > -1 && index < order.length - 1 ? cardRefs.current.get(order[index + 1]) : null;
    if (below) {
      const r = below.getBoundingClientRect();
      if (rect.bottom > r.bottom - r.height / 2) {
        d.startY += r.height + GOAL_GAP;
        node.style.transform = `translateY(${e.clientY - d.startY}px)`;
        onMove(d.id, 'down');
      }
    }
  }

  function dragEnd(e) {
    const d = drag.current;
    if (!d || (e && e.pointerId !== d.pointerId)) return;
    const node = cardRefs.current.get(d.id);
    if (node) node.style.transform = '';
    drag.current = null;
    setDragId(null);
  }
  const [renaming, setRenaming] = useState(false);
  const [generalDraft, setGeneralDraft] = useState(generalName);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [hasTarget, setHasTarget] = useState(true);
  const [target, setTarget] = useState('');
  const [perPeriod, setPerPeriod] = useState('');
  const [period, setPeriod] = useState('week');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  // null = henüz seçilmedi: o zaman paletten kullanılmamış bir renk öneriyoruz,
  // böylece arka arkaya kurulan hedefler birbirinin aynısı olmuyor.
  const [color, setColor] = useState(null);
  const [shareOnCreate, setShareOnCreate] = useState(false);
  const [error, setError] = useState('');

  const suggestedColor = nextColor(goals.map((g) => g.color));
  const activeColor = color ?? suggestedColor;

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
    setColor(null);
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
      color: activeColor,
      plan: hasTarget && perValue ? { perPeriod: perValue, period } : null,
      share: shareOnCreate ? { code: makeBookCode() } : null,
    });
    reset();
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2 className="card-title">Goals</h2>
        {goals.length > 1 ? (
          <button type="button" className="link" onClick={() => setSorting(!sorting)}>
            {sorting ? 'Done' : 'Reorder'}
          </button>
        ) : (
          <span className="card-note">{goals.length + 1}</span>
        )}
      </div>

      {goals.length === 0 && !open ? (
        <p className="hint" style={{ marginBottom: 14 }}>
          Nothing to aim at yet. Add something you are saving for and watch the jar fill.
        </p>
      ) : null}

      {sorting && goals.length > 1 ? (
        <p className="hint" style={{ marginBottom: 10 }}>
          Hold a goal and drag it, or use the arrows.
        </p>
      ) : null}

      {sortGoals(goals).map((goal, index, list) => {
        const order = list.map((g) => g.id);
        const p = goalProgress(goal, entries);
        const line = planLine(goal, p, entries, currency);
        const tone = colorOf(goal.color);
        return (
          <article
            key={goal.id}
            ref={(node) => setCardRef(goal.id, node)}
            className={`goal goal-tinted goal-rank-${Math.min(index, 3)}${
              p.complete ? ' goal-done' : ''
            }${sorting ? ' goal-sortable' : ''}${dragId === goal.id ? ' goal-dragging' : ''}`}
            onPointerDown={(e) => dragStart(e, goal.id)}
            onPointerMove={(e) => dragMove(e, order)}
            onPointerUp={dragEnd}
            onPointerCancel={dragEnd}
            style={{ '--tone': tone.base, '--tone-tint': tintFor(tone, theme) }}
          >
            <Jar
              ratio={p.ratio}
              emoji={goal.emoji}
              complete={p.complete}
              id={goal.id}
              color={tone}
            />

            <div className="goal-body">
              <div className="goal-name">
                {goal.name}
                {index === 0 ? <span className="goal-badge">Priority</span> : null}
                {goal.share ? (
                  (() => {
                    const fresh = newFromOthers(entries, goal.id, memberName, seen?.[goal.id]);
                    return fresh.length > 0 ? (
                      <span className="goal-badge goal-badge-new">
                        {fresh.length} new
                      </span>
                    ) : (
                      <span className="goal-badge goal-badge-shared">Shared</span>
                    );
                  })()
                ) : null}
              </div>
              <div className="goal-figure">
                <strong className="goal-amount">{formatMoney(p.saved, currency)}</strong>
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

              {goal.share ? (
                <Contributors
                  entries={entries}
                  goalId={goal.id}
                  currency={currency}
                  myName={memberName}
                  seenAt={seen?.[goal.id]}
                  tone={{ ...tone, tint: tintFor(tone, theme) }}
                />
              ) : null}

              <div className="goal-actions">
                {sorting ? (
                  <>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Move to top"
                      disabled={index === 0}
                      onClick={() => onMoveTop(goal.id)}
                    >
                      ⤒
                    </button>
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
                  </>
                ) : null}
                {sorting ? null : (
                <>
                <button
                  type="button"
                  className={`icon-btn${goal.share ? ' icon-btn-on' : ''}`}
                  aria-label={goal.share ? 'Sharing options' : 'Share this goal'}
                  aria-pressed={openShare === goal.id}
                  onClick={() => setOpenShare(openShare === goal.id ? null : goal.id)}
                >
                  <Icon name="people" size={17} />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Edit goal"
                  aria-pressed={editing === goal.id}
                  onClick={() => setEditing(editing === goal.id ? null : goal.id)}
                >
                  <Icon name="pencil" size={17} />
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn-danger"
                  aria-label="Remove goal"
                  aria-pressed={removing === goal.id}
                  onClick={() => setRemoving(removing === goal.id ? null : goal.id)}
                >
                  <Icon name="trash" size={17} />
                </button>
                </>
                )}
              </div>

              {/* Silme tek dokunuşla olmuyor artık: çöp kutusu kalemin yanında
                  duruyor ve kaybolan şey hedefin adı, tutarı ve rengi. Paranın
                  nereye gittiğini de söylüyoruz, çünkü kayıtlar silinmiyor. */}
              {removing === goal.id ? (
                <div className="confirm-box">
                  <p className="share-question">Remove {goal.name}?</p>
                  <p className="hint">
                    {p.saved > 0
                      ? `The ${formatMoney(p.saved, currency)} you logged moves to ${generalName}. Nothing is lost.`
                      : 'Nothing has been logged against it yet.'}
                  </p>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      onRemove(goal.id);
                      setRemoving(null);
                    }}
                  >
                    Remove goal
                  </button>
                  <button type="button" className="link" onClick={() => setRemoving(null)}>
                    Cancel
                  </button>
                </div>
              ) : null}

              {editing === goal.id ? (
                <GoalEditor
                  goal={goal}
                  currency={currency}
                  onSave={(changes) => {
                    onEdit(goal.id, changes);
                    setEditing(null);
                  }}
                  onCancel={() => setEditing(null)}
                />
              ) : null}

              {openShare === goal.id ? (
                goal.share ? (
                  <div className="share-panel">
                    {stopping === goal.id ? (
                      <>
                        <p className="share-question">Stop sharing {goal.name}?</p>
                        <button
                          type="button"
                          className="choice"
                          onClick={() => {
                            onUnshare(goal.id);
                            setStopping(null);
                            setOpenShare(null);
                          }}
                        >
                          <span className="choice-title">Just on this phone</span>
                          <span className="choice-note">The other person carries on.</span>
                        </button>
                        <button
                          type="button"
                          className="choice choice-danger"
                          onClick={() => {
                            onDeleteShared(goal.id);
                            setStopping(null);
                            setOpenShare(null);
                          }}
                        >
                          <span className="choice-title">For both of us</span>
                          <span className="choice-note">
                            Deletes the shared copy. Each of you keeps what is already saved.
                          </span>
                        </button>
                        <button type="button" className="link" onClick={() => setStopping(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
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

                        <button
                          type="button"
                          className="btn"
                          onClick={() => shareText(inviteText(goal.name, goal.share.code))}
                        >
                          Send code
                        </button>

                        <div className="sync-row">
                          <span className="sync-status">{syncStatus}</span>
                          <button type="button" className="link" onClick={onSyncNow}>
                            Sync now
                          </button>
                        </div>

                        <button
                          type="button"
                          className="link"
                          onClick={() => setStopping(goal.id)}
                        >
                          Stop sharing
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="share-panel">
                    <p className="hint">
                      Only this goal and its entries leave your phone. Anyone with the code can
                      open it.
                    </p>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => onShare(goal.id, makeBookCode())}
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

      {(() => {
        const generalTotal = savedForGoal(entries, null);
        const p = milestoneProgress(generalTotal);
        return (
          <article
            className={`goal goal-tinted${goals.length ? ' goal-general' : ''}`}
            style={{ '--tone': SLATE.base, '--tone-tint': tintFor(SLATE, theme) }}
          >
            <Jar ratio={p.ratio} emoji="💰" id="general" color={SLATE} />

            <div className="goal-body">
              {renaming ? (
                <div className="stack">
                  <input
                    className="control"
                    type="text"
                    value={generalDraft}
                    maxLength={40}
                    onChange={(e) => setGeneralDraft(e.target.value)}
                  />
                  <div className="share-foot">
                    <button
                      type="button"
                      className="link"
                      onClick={() => {
                        setGeneralDraft(generalName);
                        setRenaming(false);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        onRenameGeneral(generalDraft);
                        setRenaming(false);
                      }}
                    >
                      Save name
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="goal-name">
                    {generalName}
                    <span className="goal-badge">Everything else</span>
                  </div>
                  <div className="goal-figure">
                    <strong className="goal-amount">{formatMoney(p.saved, currency)}</strong> saved
                  </div>
                  <div className="goal-pace">
                    Next milestone {formatMoney(p.target, currency)} ·{' '}
                    {formatMoney(p.remaining, currency)} to go
                  </div>
                  <div className="goal-actions">
                    <button
                      type="button"
                      className="link"
                      onClick={() => {
                        setGeneralDraft(generalName);
                        setRenaming(true);
                      }}
                    >
                      Rename
                    </button>
                  </div>
                </>
              )}
            </div>
          </article>
        );
      })()}

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
            <div className="icon-row">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  className="chip chip-icon"
                  aria-pressed={emoji === e}
                  onClick={() => {
                    setEmoji(e);
                    setColor(colorForEmoji(e));
                  }}
                >
                  {e}
                </button>
              ))}
              {/* Kendi simgesi: telefon klavyesindeki emoji tuşundan ne
                  gelirse onu alıyoruz, listeyle sınırlı değil. */}
              <button
                type="button"
                className={`chip chip-icon chip-more${
                  EMOJIS.includes(emoji) ? '' : ' chip-icon-custom'
                }`}
                aria-label="Use your own icon"
                aria-pressed={!EMOJIS.includes(emoji)}
                onClick={() => setOwnIcon(!ownIcon)}
              >
                {EMOJIS.includes(emoji) ? '+' : emoji}
              </button>
            </div>
            {ownIcon ? (
              <input
                className="control"
                style={{ marginTop: 8 }}
                type="text"
                inputMode="text"
                maxLength={8}
                placeholder="Paste any emoji"
                value={EMOJIS.includes(emoji) ? '' : emoji}
                onChange={(e) => {
                  const value = [...e.target.value.trim()].slice(0, 4).join('');
                  if (value) setEmoji(value);
                }}
              />
            ) : null}
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
                  aria-pressed={activeColor === c.id}
                  style={{ background: c.base }}
                  onClick={() => setColor(c.id)}
                />
              ))}
              {/* Kendi rengi: telefonun kendi renk seçicisi açılıyor. */}
              <label
                className={`swatch swatch-custom${isHexColor(activeColor) ? ' is-on' : ''}`}
                style={isHexColor(activeColor) ? { background: activeColor } : undefined}
                aria-label="Pick your own colour"
              >
                <input
                  type="color"
                  value={isHexColor(activeColor) ? activeColor : colorOf(activeColor).base}
                  onChange={(e) => setColor(e.target.value.toLowerCase())}
                />
              </label>
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
