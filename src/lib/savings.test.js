import { describe, it, expect } from 'vitest';
import {
  totalSaved,
  savedForGoal,
  goalProgress,
  currentStreak,
  dayKey,
  groupEntriesByDay,
  sortEntriesByDate,
} from './savings.js';

// Yerel saatle kurulan tarihler, testin saat diliminden bağımsız çalışsın diye.
const day = (y, m, d, h = 12) => new Date(y, m - 1, d, h, 0, 0);
const entry = (id, amount, at, goalId = null) => ({
  id,
  amount,
  at: at.toISOString(),
  goalId,
  note: '',
});

describe('totalSaved', () => {
  it('boş defterde sıfırdır', () => {
    expect(totalSaved([])).toBe(0);
    expect(totalSaved()).toBe(0);
  });

  it('tutarları toplar', () => {
    const entries = [
      entry('a', 500, day(2026, 1, 1)),
      entry('b', 250, day(2026, 1, 2)),
    ];
    expect(totalSaved(entries)).toBe(750);
  });

  it('bozuk tutarları yok sayar', () => {
    const entries = [entry('a', 500, day(2026, 1, 1)), { id: 'b', amount: 'çok' }];
    expect(totalSaved(entries)).toBe(500);
  });
});

describe('savedForGoal', () => {
  it('yalnızca o hedefe yazılanları toplar', () => {
    const entries = [
      entry('a', 500, day(2026, 1, 1), 'g1'),
      entry('b', 300, day(2026, 1, 1), 'g2'),
      entry('c', 200, day(2026, 1, 1), 'g1'),
      entry('d', 100, day(2026, 1, 1), null),
    ];
    expect(savedForGoal(entries, 'g1')).toBe(700);
    expect(savedForGoal(entries, 'g2')).toBe(300);
    expect(savedForGoal(entries, null)).toBe(100);
  });
});

describe('goalProgress', () => {
  const goal = { id: 'g1', name: 'Tatil', target: 10000 };

  it('yarı yolda oranı ve kalanı verir', () => {
    const entries = [entry('a', 5000, day(2026, 1, 1), 'g1')];
    const p = goalProgress(goal, entries);
    expect(p.saved).toBe(5000);
    expect(p.remaining).toBe(5000);
    expect(p.percent).toBe(50);
    expect(p.complete).toBe(false);
  });

  it('hedef aşılsa da oran 1 ile sınırlıdır', () => {
    const entries = [entry('a', 15000, day(2026, 1, 1), 'g1')];
    const p = goalProgress(goal, entries);
    expect(p.ratio).toBe(1);
    expect(p.remaining).toBe(0);
    expect(p.complete).toBe(true);
  });

  it('hedef tutarı yoksa sıfıra bölmez', () => {
    const p = goalProgress({ id: 'g9', name: 'Açık uçlu', target: 0 }, []);
    expect(p.ratio).toBe(0);
    expect(p.complete).toBe(false);
  });
});

describe('currentStreak', () => {
  it('kayıt yoksa sıfırdır', () => {
    expect(currentStreak([], day(2026, 3, 10))).toBe(0);
  });

  it('üst üste günleri sayar', () => {
    const entries = [
      entry('a', 100, day(2026, 3, 10)),
      entry('b', 100, day(2026, 3, 9)),
      entry('c', 100, day(2026, 3, 8)),
    ];
    expect(currentStreak(entries, day(2026, 3, 10))).toBe(3);
  });

  it('aynı gün birden çok kayıt seriyi şişirmez', () => {
    const entries = [
      entry('a', 100, day(2026, 3, 10, 9)),
      entry('b', 100, day(2026, 3, 10, 18)),
    ];
    expect(currentStreak(entries, day(2026, 3, 10, 22))).toBe(1);
  });

  it('bugün henüz kayıt yoksa dünden sayar', () => {
    const entries = [
      entry('a', 100, day(2026, 3, 9)),
      entry('b', 100, day(2026, 3, 8)),
    ];
    expect(currentStreak(entries, day(2026, 3, 10))).toBe(2);
  });

  it('iki gün boşluk seriyi sıfırlar', () => {
    const entries = [entry('a', 100, day(2026, 3, 7))];
    expect(currentStreak(entries, day(2026, 3, 10))).toBe(0);
  });

  it('eski bir seri bugünkü seriyi etkilemez', () => {
    const entries = [
      entry('a', 100, day(2026, 3, 10)),
      entry('b', 100, day(2026, 2, 1)),
      entry('c', 100, day(2026, 1, 31)),
    ];
    expect(currentStreak(entries, day(2026, 3, 10))).toBe(1);
  });

  it('ay sınırını doğru geçer', () => {
    const entries = [
      entry('a', 100, day(2026, 3, 1)),
      entry('b', 100, day(2026, 2, 28)),
    ];
    expect(currentStreak(entries, day(2026, 3, 1))).toBe(2);
  });
});

describe('dayKey', () => {
  it('yerel tarihi anahtara çevirir', () => {
    expect(dayKey(day(2026, 3, 5))).toBe('2026-03-05');
  });

  it('geçersiz tarihte null verir', () => {
    expect(dayKey('bir zaman')).toBeNull();
  });
});

describe('sıralama ve gruplama', () => {
  const entries = [
    entry('a', 100, day(2026, 3, 8)),
    entry('b', 200, day(2026, 3, 10, 9)),
    entry('c', 300, day(2026, 3, 10, 20)),
  ];

  it('yeniden eskiye sıralar', () => {
    expect(sortEntriesByDate(entries).map((e) => e.id)).toEqual(['c', 'b', 'a']);
  });

  it('girdi dizisini bozmaz', () => {
    const before = entries.map((e) => e.id);
    sortEntriesByDate(entries);
    expect(entries.map((e) => e.id)).toEqual(before);
  });

  it('günlere göre gruplar ve gün toplamını verir', () => {
    const groups = groupEntriesByDay(entries);
    expect(groups).toHaveLength(2);
    expect(groups[0].day).toBe('2026-03-10');
    expect(groups[0].total).toBe(500);
    expect(groups[1].day).toBe('2026-03-08');
    expect(groups[1].total).toBe(100);
  });
});
