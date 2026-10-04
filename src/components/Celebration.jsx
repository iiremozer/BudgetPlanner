import { useState } from 'react';
import { formatMoney } from '../lib/money.js';
import { goalSummary, shareText } from '../lib/celebration.js';
import { colorOf } from '../lib/colors.js';
import Jar from './Jar.jsx';

const CONFETTI = Array.from({ length: 14 }, (_, i) => i);

export default function Celebration({ goal, entries, currency, myName, onClose }) {
  const [shared, setShared] = useState(false);
  const tone = colorOf(goal.color);
  const summary = goalSummary(goal, entries, myName);

  async function share() {
    const text = shareText(goal, summary, currency);
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // Paylaşımdan vazgeçilmesi hata değil; sessizce geçiyoruz.
    }
  }

  return (
    <div className="celebrate" style={{ '--tone': tone.base, '--tone-tint': tone.tint }}>
      <div className="confetti" aria-hidden="true">
        {CONFETTI.map((i) => (
          <span
            key={i}
            className="confetti-bit"
            style={{
              left: `${(i * 7.3) % 100}%`,
              background: i % 3 === 0 ? tone.base : i % 3 === 1 ? tone.light : '#2f8f6f',
              animationDelay: `${(i % 7) * 0.12}s`,
            }}
          />
        ))}
      </div>

      <div className="celebrate-inner">
        <p className="celebrate-kicker">Goal reached</p>
        <h2 className="celebrate-title">{goal.name}</h2>

        <Jar ratio={1} emoji={goal.emoji} complete id={`celebrate-${goal.id}`} color={tone} size={116} />

        <p className="celebrate-amount">{formatMoney(summary.saved, currency)}</p>
        <p className="celebrate-line">
          saved in {summary.days} {summary.days === 1 ? 'day' : 'days'}, across {summary.count}{' '}
          {summary.count === 1 ? 'skipped spend' : 'skipped spends'}
        </p>

        {summary.category && summary.category.count > 1 ? (
          <p className="celebrate-fact">
            <span className="celebrate-fact-emoji">{summary.category.emoji}</span>
            {summary.category.count} × {summary.category.label.toLowerCase()} you didn't buy
          </p>
        ) : null}

        {summary.contributors.length > 1 ? (
          <ul className="celebrate-people">
            {summary.contributors.map((c) => (
              <li key={c.name}>
                <span>{c.isMe ? 'You' : c.name}</span>
                <strong>{formatMoney(c.total, currency)}</strong>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="celebrate-actions">
          <button type="button" className="btn" onClick={share}>
            {shared ? 'Copied' : 'Share this'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
