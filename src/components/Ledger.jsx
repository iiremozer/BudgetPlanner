import { useState } from 'react';
import { groupEntriesByDay } from '../lib/savings.js';
import { formatMoney } from '../lib/money.js';
import { formatDayLabel, formatTime } from '../lib/dates.js';

const PAGE = 6;

export default function Ledger({ entries, goals, currency, lastId, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const goalById = new Map(goals.map((g) => [g.id, g]));

  const days = groupEntriesByDay(entries);
  let shown = 0;
  const visible = [];
  for (const group of days) {
    if (!expanded && shown >= PAGE) break;
    const slice = expanded ? group.entries : group.entries.slice(0, PAGE - shown);
    shown += slice.length;
    visible.push({ ...group, entries: slice });
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2 className="card-title">Recent wins</h2>
        {entries.length > 0 ? <span className="card-note">{entries.length}</span> : null}
      </div>

      {entries.length === 0 ? (
        <p className="empty">Nothing logged yet. Add the first win above.</p>
      ) : (
        <>
          {visible.map((group) => (
            <div key={group.day}>
              <p className="day-label">{formatDayLabel(group.day)}</p>
              {group.entries.map((entry) => {
                const goal = entry.goalId ? goalById.get(entry.goalId) : null;
                return (
                  <div key={entry.id} className={`row${entry.id === lastId ? ' row-new' : ''}`}>
                    <span className="row-emoji" aria-hidden="true">
                      {entry.emoji || '💰'}
                    </span>
                    <div className="row-body">
                      <div className="row-note">{entry.note || 'Saved'}</div>
                      <div className="row-sub">
                        {formatTime(entry.at)}
                        {entry.by ? ` · ${entry.by}` : ''}
                        {goal ? ` · ${goal.emoji} ${goal.name}` : ''}
                      </div>
                    </div>
                    <span className="row-amount">+{formatMoney(entry.amount, currency)}</span>
                    <button
                      type="button"
                      className="row-remove"
                      aria-label="Delete entry"
                      onClick={() => onRemove(entry.id)}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          ))}

          {entries.length > PAGE ? (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ marginTop: 14 }}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? 'Show less' : `Show all ${entries.length}`}
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}
