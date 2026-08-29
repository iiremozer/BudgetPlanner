import { formatMoney } from '../lib/money.js';
import { currentStreak } from '../lib/savings.js';
import { longestStreak, last7Days, bestDay, activeDays, averageWin } from '../lib/stats.js';
import { formatDayLabel } from '../lib/dates.js';

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function StreakTab({ entries, currency, children }) {
  const streak = currentStreak(entries);
  const best = longestStreak(entries);
  const week = last7Days(entries);
  const top = bestDay(entries);

  return (
    <>
      <section className="hero">
        <p className="hero-label">Current streak</p>
        <p className="hero-amount">
          {streak}
          <span className="hero-unit">{streak === 1 ? ' day' : ' days'}</span>
        </p>
        <div className="hero-meta">
          <span className="pill">Best {best} {best === 1 ? 'day' : 'days'}</span>
          <span className="pill">{activeDays(entries)} active days</span>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">This week</h2>
          <span className="card-note">{week.filter((d) => d.hit).length} of 7</span>
        </div>

        <div className="week">
          {week.map((d) => (
            <div key={d.day} className="week-day">
              <div className={`week-dot${d.hit ? ' week-dot-on' : ''}`}>
                {d.hit ? '✓' : ''}
              </div>
              <span className="week-letter">{LETTERS[d.weekday]}</span>
            </div>
          ))}
        </div>

        <p className="hint" style={{ marginTop: 14 }}>
          {streak > 0
            ? 'A day counts when you log at least one win. Miss a day and the streak restarts.'
            : 'Log a win today to start a streak.'}
        </p>
      </section>

      {children}

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">Numbers</h2>
        </div>

        <dl className="stats">
          <div className="stat">
            <dt>Wins logged</dt>
            <dd>{entries.length}</dd>
          </div>
          <div className="stat">
            <dt>Average win</dt>
            <dd>{formatMoney(averageWin(entries), currency)}</dd>
          </div>
          <div className="stat">
            <dt>Best day</dt>
            <dd>{top ? formatMoney(top.total, currency) : '—'}</dd>
          </div>
          <div className="stat">
            <dt>That was</dt>
            <dd className="stat-soft">{top ? formatDayLabel(top.day) : '—'}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
