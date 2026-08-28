import { describe, it, expect } from 'vitest';
import {
  PERIOD_IDS,
  isPeriod,
  periodOf,
  periodsNeeded,
  finishDate,
  ratePerWeek,
  weeksAtRate,
} from './pace.js';

const day = (y, m, d, h = 12) => new Date(y, m - 1, d, h, 0, 0);
const entry = (id, amount, at, goalId) => ({ id, amount, at: at.toISOString(), goalId });

describe('dönemler', () => {
  it('üç dönem tanımlı', () => {
    expect(PERIOD_IDS).toEqual(['week', 'fortnight', 'month']);
    expect(isPeriod('week')).toBe(true);
    expect(isPeriod('decade')).toBe(false);
  });

  it('bilinmeyen dönem haftaya düşer', () => {
    expect(periodOf('decade').id).toBe('week');
  });
});

describe('periodsNeeded', () => {
  it('tam bölünende doğru sayıyı verir', () => {
    expect(periodsNeeded(100000, 5000)).toBe(20);
  });

  it('artan kısmı yukarı yuvarlar', () => {
    expect(periodsNeeded(100000, 3000)).toBe(34);
  });

  it('hedef zaten dolmuşsa sıfırdır', () => {
    expect(periodsNeeded(0, 5000)).toBe(0);
    expect(periodsNeeded(-500, 5000)).toBe(0);
  });

  it('katkı yoksa null verir', () => {
    expect(periodsNeeded(100000, 0)).toBeNull();
    expect(periodsNeeded(100000, -10)).toBeNull();
    expect(periodsNeeded(100000, NaN)).toBeNull();
  });
});

describe('finishDate', () => {
  it('haftalık tempoda bitiş tarihini verir', () => {
    const end = finishDate(100000, 5000, 'week', day(2026, 1, 1));
    expect(end.getFullYear()).toBe(2026);
    expect(end.getMonth()).toBe(4); // 20 hafta = 140 gün → Mayıs
    expect(end.getDate()).toBe(21);
  });

  it('aylık tempo haftalıktan uzun sürer', () => {
    const weekly = finishDate(100000, 5000, 'week', day(2026, 1, 1));
    const monthly = finishDate(100000, 5000, 'month', day(2026, 1, 1));
    expect(monthly.getTime()).toBeGreaterThan(weekly.getTime());
  });

  it('katkı yoksa null verir', () => {
    expect(finishDate(100000, 0, 'week', day(2026, 1, 1))).toBeNull();
  });

  it('bozuk başlangıç tarihinde null verir', () => {
    expect(finishDate(100000, 5000, 'week', 'bir ara')).toBeNull();
  });
});

describe('ratePerWeek', () => {
  it('kayıt yoksa sıfırdır', () => {
    expect(ratePerWeek([], 'g1', day(2026, 3, 1))).toBe(0);
  });

  it('iki haftada 100 birikmişse haftalık 50 olur', () => {
    const entries = [
      entry('a', 5000, day(2026, 1, 1), 'g1'),
      entry('b', 5000, day(2026, 1, 8), 'g1'),
    ];
    expect(Math.round(ratePerWeek(entries, 'g1', day(2026, 1, 15)))).toBe(5000);
  });

  it('ilk hafta içinde bölme şişmez', () => {
    const entries = [entry('a', 5000, day(2026, 1, 1), 'g1')];
    expect(ratePerWeek(entries, 'g1', day(2026, 1, 2))).toBe(5000);
  });

  it('başka hedefin kayıtlarını saymaz', () => {
    const entries = [entry('a', 5000, day(2026, 1, 1), 'g2')];
    expect(ratePerWeek(entries, 'g1', day(2026, 1, 8))).toBe(0);
  });
});

describe('weeksAtRate', () => {
  it('tempoya göre kalan haftayı verir', () => {
    expect(weeksAtRate(100000, 5000)).toBe(20);
  });

  it('tempo yoksa null verir', () => {
    expect(weeksAtRate(100000, 0)).toBeNull();
  });

  it('kalan yoksa sıfırdır', () => {
    expect(weeksAtRate(0, 5000)).toBe(0);
  });
});
