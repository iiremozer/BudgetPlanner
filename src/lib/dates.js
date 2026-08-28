import { dayKey } from './savings.js';

const AYLAR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

/** "2026-03-10" anahtarını yerel bir Date nesnesine çevirir. */
export function dateFromDayKey(key) {
  if (typeof key !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

/** Defter sayfasındaki gün başlığı: "Bugün", "Dün" ya da "10 Mart, Salı". */
export function formatDayLabel(key, now = new Date()) {
  const date = dateFromDayKey(key);
  if (!date) return '';

  const today = dayKey(now);
  const yesterday = new Date(now instanceof Date ? now.getTime() : new Date(now).getTime());
  yesterday.setDate(yesterday.getDate() - 1);

  if (key === today) return 'Bugün';
  if (key === dayKey(yesterday)) return 'Dün';

  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  const base = `${date.getDate()} ${AYLAR[date.getMonth()]}`;
  return sameYear
    ? `${base}, ${GUNLER[date.getDay()]}`
    : `${base} ${date.getFullYear()}`;
}

/** Kayıt satırındaki saat: "09:05". */
export function formatTime(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
