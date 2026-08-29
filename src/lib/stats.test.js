import { describe, it, expect } from 'vitest';
import { longestStreak, last7Days, bestDay, activeDays, averageWin } from './stats.js';

const day = (y, m, d, h = 12) => new Date(y, m - 1, d, h, 0, 0);
const entry = (id, amount, at) => ({ id, amount, at: at.toISOString(), goalId: null });

describe('longestStreak', () => {
  it('kayıt yoksa sıfırdır', () => {
    expect(longestStreak([])).toBe(0);
  });

  it('tek gün birdir', () => {
    expect(longestStreak([entry('a', 100, day(2026, 3, 10))])).toBe(1);
  });

  it('en uzun kesintisiz diziyi bulur', () => {
    const entries = [
      entry('a', 100, day(2026, 3, 1)),
      entry('b', 100, day(2026, 3, 2)),
      entry('c', 100, day(2026, 3, 3)),
      entry('d', 100, day(2026, 3, 8)),
    ];
    expect(longestStreak(entries)).toBe(3);
  });

  it('güncel seri kısa olsa da rekoru korur', () => {
    const entries = [
      entry('a', 100, day(2026, 1, 1)),
      entry('b', 100, day(2026, 1, 2)),
      entry('c', 100, day(2026, 1, 3)),
      entry('d', 100, day(2026, 1, 4)),
      entry('e', 100, day(2026, 3, 10)),
    ];
    expect(longestStreak(entries)).toBe(4);
  });

  it('aynı günün iki kaydı seriyi şişirmez', () => {
    const entries = [entry('a', 100, day(2026, 3, 10, 9)), entry('b', 100, day(2026, 3, 10, 18))];
    expect(longestStreak(entries)).toBe(1);
  });

  it('ay sınırını geçer', () => {
    const entries = [entry('a', 100, day(2026, 2, 28)), entry('b', 100, day(2026, 3, 1))];
    expect(longestStreak(entries)).toBe(2);
  });
});

describe('last7Days', () => {
  it('her zaman yedi gün verir', () => {
    expect(last7Days([], day(2026, 3, 10))).toHaveLength(7);
  });

  it('son gün bugündür', () => {
    const week = last7Days([], day(2026, 3, 10));
    expect(week[6].day).toBe('2026-03-10');
    expect(week[0].day).toBe('2026-03-04');
  });

  it('kayıt olan günü işaretler', () => {
    const week = last7Days([entry('a', 500, day(2026, 3, 9))], day(2026, 3, 10));
    expect(week[5].hit).toBe(true);
    expect(week[5].total).toBe(500);
    expect(week[6].hit).toBe(false);
  });

  it('aynı günün kayıtlarını toplar', () => {
    const entries = [entry('a', 500, day(2026, 3, 10, 9)), entry('b', 300, day(2026, 3, 10, 18))];
    expect(last7Days(entries, day(2026, 3, 10, 22))[6].total).toBe(800);
  });
});

describe('bestDay', () => {
  it('kayıt yoksa null', () => {
    expect(bestDay([])).toBeNull();
  });

  it('en yüksek günü verir', () => {
    const entries = [
      entry('a', 500, day(2026, 3, 1)),
      entry('b', 300, day(2026, 3, 2)),
      entry('c', 400, day(2026, 3, 2)),
    ];
    expect(bestDay(entries)).toEqual({ day: '2026-03-02', total: 700 });
  });
});

describe('activeDays', () => {
  it('benzersiz günleri sayar', () => {
    const entries = [
      entry('a', 100, day(2026, 3, 1, 9)),
      entry('b', 100, day(2026, 3, 1, 20)),
      entry('c', 100, day(2026, 3, 2)),
    ];
    expect(activeDays(entries)).toBe(2);
  });
});

describe('averageWin', () => {
  it('kayıt yoksa sıfır', () => {
    expect(averageWin([])).toBe(0);
  });

  it('ortalamayı yuvarlar', () => {
    const entries = [entry('a', 500, day(2026, 3, 1)), entry('b', 300, day(2026, 3, 2))];
    expect(averageWin(entries)).toBe(400);
  });
});
