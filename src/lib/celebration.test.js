import { describe, it, expect } from 'vitest';
import { pendingCelebration, topCategory, goalSummary, shareText } from './celebration.js';

const at = (y, m, d) => new Date(y, m - 1, d, 12).toISOString();
const goal = (id, target) => ({ id, name: 'Japan', emoji: '🛫', target, createdAt: at(2026, 1, 1) });
const entry = (id, amount, when, goalId = 'g1', emoji = '☕', by = 'Irem') => ({
  id,
  amount,
  at: when,
  goalId,
  emoji,
  by,
});

describe('pendingCelebration', () => {
  it('tamamlanan hedefi verir', () => {
    const goals = [goal('g1', 1000)];
    const entries = [entry('e1', 1000, at(2026, 1, 2))];
    expect(pendingCelebration(goals, entries, {}).id).toBe('g1');
  });

  it('kutlanmışı tekrar vermez', () => {
    const goals = [goal('g1', 1000)];
    const entries = [entry('e1', 1000, at(2026, 1, 2))];
    expect(pendingCelebration(goals, entries, { g1: at(2026, 1, 3) })).toBeNull();
  });

  it('tamamlanmamış hedefi vermez', () => {
    const goals = [goal('g1', 5000)];
    expect(pendingCelebration(goals, [entry('e1', 1000, at(2026, 1, 2))], {})).toBeNull();
  });

  it('hedef tutarı olmayanı hiç saymaz', () => {
    const goals = [goal('g1', 0)];
    expect(pendingCelebration(goals, [entry('e1', 99999, at(2026, 1, 2))], {})).toBeNull();
  });

  it('hedef yoksa null', () => {
    expect(pendingCelebration([], [], {})).toBeNull();
  });
});

describe('topCategory', () => {
  it('en sık kalıbı bulur', () => {
    const entries = [
      entry('a', 100, at(2026, 1, 1), 'g1', '☕'),
      entry('b', 100, at(2026, 1, 2), 'g1', '☕'),
      entry('c', 100, at(2026, 1, 3), 'g1', '🚕'),
    ];
    expect(topCategory(entries, 'g1')).toEqual({ emoji: '☕', count: 2, label: 'Coffee' });
  });

  it('başka hedefin kayıtlarını saymaz', () => {
    const entries = [entry('a', 100, at(2026, 1, 1), 'g2', '☕')];
    expect(topCategory(entries, 'g1')).toBeNull();
  });

  it('simgesiz kayıtlarda null', () => {
    const entries = [entry('a', 100, at(2026, 1, 1), 'g1', null)];
    expect(topCategory(entries, 'g1')).toBeNull();
  });
});

describe('goalSummary', () => {
  const entries = [
    entry('a', 400, at(2026, 1, 1), 'g1', '☕', 'Irem'),
    entry('b', 400, at(2026, 1, 8), 'g1', '☕', 'Batuhan'),
    entry('c', 200, at(2026, 1, 15), 'g1', '🚕', 'Irem'),
  ];

  it('toplam ve sayıyı verir', () => {
    const s = goalSummary(goal('g1', 1000), entries, 'Irem');
    expect(s.saved).toBe(1000);
    expect(s.count).toBe(3);
  });

  it('süreyi gün olarak hesaplar', () => {
    expect(goalSummary(goal('g1', 1000), entries, 'Irem').days).toBe(14);
  });

  it('tek kayıtta süre bir gündür', () => {
    const one = [entry('a', 1000, at(2026, 1, 1))];
    expect(goalSummary(goal('g1', 1000), one, 'Irem').days).toBe(1);
  });

  it('katkı sahiplerini işaretler', () => {
    const s = goalSummary(goal('g1', 1000), entries, 'Irem');
    const me = s.contributors.find((c) => c.name === 'Irem');
    expect(me.isMe).toBe(true);
    expect(me.total).toBe(600);
  });

  it('en sık kalıbı taşır', () => {
    expect(goalSummary(goal('g1', 1000), entries, 'Irem').category.label).toBe('Coffee');
  });
});

describe('shareText', () => {
  const entries = [
    entry('a', 500, at(2026, 1, 1), 'g1', '☕'),
    entry('b', 500, at(2026, 1, 11), 'g1', '☕'),
  ];

  it('hedefi ve tutarı yazar', () => {
    const text = shareText(goal('g1', 1000), goalSummary(goal('g1', 1000), entries, 'Irem'), 'GBP');
    expect(text).toContain('Japan');
    expect(text).toContain('£10.00');
    expect(text).toContain('10 days');
  });

  it('kalıbı sayıyla anar', () => {
    const text = shareText(goal('g1', 1000), goalSummary(goal('g1', 1000), entries, 'Irem'), 'GBP');
    expect(text).toContain('2 × coffee');
  });

  it('kimsenin adını paylaşmaz', () => {
    const text = shareText(goal('g1', 1000), goalSummary(goal('g1', 1000), entries, 'Irem'), 'GBP');
    expect(text).not.toContain('Irem');
  });
});
