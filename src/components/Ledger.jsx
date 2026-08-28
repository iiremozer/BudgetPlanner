import { groupEntriesByDay } from '../lib/savings.js';
import { formatMoney } from '../lib/money.js';
import { formatDayLabel, formatTime } from '../lib/dates.js';

export default function Ledger({ entries, goals, currency, lastId, onRemove }) {
  const days = groupEntriesByDay(entries);
  const goalById = new Map(goals.map((g) => [g.id, g]));

  return (
    <section className="section">
      <div className="section-head">
        <h2 className="section-title">Defter</h2>
        <span className="section-note">{entries.length} kayıt</span>
      </div>

      {days.length === 0 ? (
        <p className="empty">
          Sayfa henüz boş.
          <br />
          Bugün almadığın bir şeyi yukarıya yaz, ilk satır senin olsun.
        </p>
      ) : (
        days.map((group) => (
          <div key={group.day}>
            <div className="day-head">
              <span>{formatDayLabel(group.day)}</span>
              <span className="day-total">{formatMoney(group.total, currency)}</span>
            </div>

            {group.entries.map((entry) => {
              const goal = entry.goalId ? goalById.get(entry.goalId) : null;
              return (
                <div
                  key={entry.id}
                  className={`row${entry.id === lastId ? ' row-new' : ''}`}
                >
                  <span className="row-time">{formatTime(entry.at)}</span>
                  <span className="row-note">
                    {entry.note || 'Kayıt'}
                    {goal ? (
                      <span className="row-goal">
                        {goal.emoji} {goal.name}
                      </span>
                    ) : null}
                  </span>
                  <span className="row-amount">+{formatMoney(entry.amount, currency)}</span>
                  <button
                    type="button"
                    className="row-remove"
                    aria-label="Kaydı sil"
                    onClick={() => onRemove(entry.id)}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        ))
      )}
    </section>
  );
}
