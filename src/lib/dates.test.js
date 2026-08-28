import { describe, it, expect } from 'vitest';
import { dateFromDayKey, formatDayLabel, formatTime } from './dates.js';

const day = (y, m, d, h = 12, min = 0) => new Date(y, m - 1, d, h, min, 0);

describe('dateFromDayKey', () => {
  it('anahtarı yerel tarihe çevirir', () => {
    const d = dateFromDayKey('2026-03-10');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(10);
  });

  it('bozuk anahtarda null verir', () => {
    expect(dateFromDayKey('10/03/2026')).toBeNull();
    expect(dateFromDayKey('')).toBeNull();
    expect(dateFromDayKey(null)).toBeNull();
  });
});

describe('formatDayLabel', () => {
  const now = day(2026, 3, 10);

  it('bugünü ve dünü adlandırır', () => {
    expect(formatDayLabel('2026-03-10', now)).toBe('Today');
    expect(formatDayLabel('2026-03-09', now)).toBe('Yesterday');
  });

  it('aynı yıl içinde gün adını ekler', () => {
    expect(formatDayLabel('2026-03-07', now)).toBe('Saturday, March 7');
  });

  it('geçmiş yıllarda yılı yazar', () => {
    expect(formatDayLabel('2025-12-24', now)).toBe('December 24, 2025');
  });

  it('ay sınırında dünü doğru bulur', () => {
    expect(formatDayLabel('2026-02-28', day(2026, 3, 1))).toBe('Yesterday');
  });

  it('bozuk anahtarda boş döner', () => {
    expect(formatDayLabel('tomorrow', now)).toBe('');
  });
});

describe('formatTime', () => {
  it('saati iki haneli yazar', () => {
    expect(formatTime(day(2026, 3, 10, 9, 5))).toBe('09:05');
    expect(formatTime(day(2026, 3, 10, 21, 40))).toBe('21:40');
  });

  it('geçersiz tarihte boş döner', () => {
    expect(formatTime('hiçbir zaman')).toBe('');
  });
});
