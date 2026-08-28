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
      setError('Hedefe bir ad ver.');
      return;
    }
    const parsed = target.trim() === '' ? 0 : parseAmount(target);
    if (parsed === null) {
      setError('Hedef tutarı sayı olmalı, boş da bırakabilirsin.');
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
    <section className="section">
      <div className="section-head">
        <h2 className="section-title">Hedefler</h2>
        <span className="section-note">{goals.length} hesap</span>
      </div>

      {goals.length === 0 && !open ? (
        <p className="hint">
          Henüz hedef yok. Uğruna biriktirdiğin bir şey ekle, ilerlemesi burada dolsun.
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
              <span className="goal-numbers">
                {formatMoney(p.saved, currency)}
                {p.target > 0 ? ` / ${formatMoney(p.target, currency)}` : ''}
              </span>
            </div>

            {p.target > 0 ? (
              <div
                className="goal-bar"
                role="progressbar"
                aria-valuenow={p.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${goal.name} ilerlemesi`}
              >
                <div className="goal-fill" style={{ width: `${p.ratio * 100}%` }} />
              </div>
            ) : null}

            <div className="goal-foot">
              {p.complete ? (
                <span className="goal-done-mark">Tamamlandı</span>
              ) : (
                <span className="goal-percent">
                  {p.target > 0
                    ? `%${p.percent} · ${formatMoney(p.remaining, currency)} kaldı`
                    : 'Açık uçlu hesap'}
                </span>
              )}
              <button type="button" className="link-btn" onClick={() => onRemove(goal.id)}>
                Kaldır
              </button>
            </div>
          </article>
        );
      })}

      {open ? (
        <div className="form" style={{ marginTop: 14 }}>
          <div className="field">
            <label className="field-label" htmlFor="goal-name">
              Hedefin adı
            </label>
            <input
              id="goal-name"
              className="control"
              type="text"
              placeholder="Yaz tatili"
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="goal-target">
              Hedef tutar (isteğe bağlı)
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

          <div className="field">
            <span className="field-label">Simge</span>
            <div className="quick">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  className="quick-chip"
                  aria-pressed={emoji === e}
                  style={emoji === e ? { background: 'var(--paper-shade)' } : undefined}
                  onClick={() => setEmoji(e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {error ? <p className="error">{error}</p> : null}

          <button type="button" className="press" onClick={submit}>
            Hedefi aç
          </button>
          <button type="button" className="press press-quiet" onClick={() => setOpen(false)}>
            Vazgeç
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="press press-quiet"
          style={{ marginTop: 14 }}
          onClick={() => setOpen(true)}
        >
          + Yeni hedef
        </button>
      )}
    </section>
  );
}
