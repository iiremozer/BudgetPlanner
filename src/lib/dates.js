import { dayKey } from './savings.js';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Turns a "2026-03-10" key back into a local Date. */
export function dateFromDayKey(key) {
  if (typeof key !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

/** Day heading: "Today", "Yesterday", or "Saturday, March 7". */
export function formatDayLabel(key, now = new Date()) {
  const date = dateFromDayKey(key);
  if (!date) return '';

  const today = dayKey(now);
  const yesterday = new Date(now instanceof Date ? now.getTime() : new Date(now).getTime());
  yesterday.setDate(yesterday.getDate() - 1);

  if (key === today) return 'Today';
  if (key === dayKey(yesterday)) return 'Yesterday';

  const base = `${MONTHS[date.getMonth()]} ${date.getDate()}`;
  return date.getFullYear() === new Date(now).getFullYear()
    ? `${WEEKDAYS[date.getDay()]}, ${base}`
    : `${base}, ${date.getFullYear()}`;
}

/** Row timestamp: "09:05". */
export function formatTime(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
