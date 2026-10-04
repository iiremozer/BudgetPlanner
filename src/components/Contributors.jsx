import { formatMoney } from '../lib/money.js';
import { contributorTotals, newFromOthers, latestFromOthers } from '../lib/contributions.js';
import { formatTime } from '../lib/dates.js';
import { dayKey } from '../lib/savings.js';

function whenLabel(at, now = new Date()) {
  const when = new Date(at);
  if (Number.isNaN(when.getTime())) return '';
  if (dayKey(when) === dayKey(now)) return `at ${formatTime(when)}`;
  const yesterday = new Date(now.getTime());
  yesterday.setDate(yesterday.getDate() - 1);
  if (dayKey(when) === dayKey(yesterday)) return 'yesterday';
  const days = Math.floor((now - when) / 86400000);
  return days < 7 ? `${days} days ago` : 'a while ago';
}

export default function Contributors({ entries, goalId, currency, myName, seenAt, tone }) {
  const totals = contributorTotals(entries, goalId);
  if (totals.length === 0) return null;

  const fresh = newFromOthers(entries, goalId, myName, seenAt);
  const latest = latestFromOthers(entries, goalId, myName);
  const me = (myName ?? '').trim();
  const grand = totals.reduce((sum, t) => sum + t.total, 0);

  return (
    <div className="contrib">
      {fresh.length > 0 ? (
        <p className="contrib-new" style={{ background: tone?.tint, color: tone?.dark }}>
          {fresh.length === 1
            ? `${fresh[0].by || 'Someone'} added ${formatMoney(fresh[0].amount, currency)}`
            : `${fresh.length} new wins from ${[...new Set(fresh.map((e) => e.by || 'Someone'))].join(' and ')}`}
          <span className="contrib-when"> {whenLabel(fresh[0].at)}</span>
        </p>
      ) : latest ? (
        <p className="contrib-last">
          {latest.by || 'Someone'} last added {formatMoney(latest.amount, currency)}{' '}
          {whenLabel(latest.at)}
        </p>
      ) : null}

      <div className="contrib-bar" aria-hidden="true">
        {totals.map((t, i) => (
          <span
            key={t.name}
            className="contrib-slice"
            style={{
              width: `${grand === 0 ? 0 : (t.total / grand) * 100}%`,
              background: i === 0 ? tone?.base : tone?.light,
              opacity: 1 - i * 0.18,
            }}
          />
        ))}
      </div>

      <ul className="contrib-list">
        {totals.map((t) => (
          <li key={t.name}>
            <span className="contrib-name">{t.name === me && me ? 'You' : t.name}</span>
            <span className="contrib-total">{formatMoney(t.total, currency)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
