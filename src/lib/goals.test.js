import { describe, it, expect } from 'vitest';
import { sortGoals, normalizeOrders, moveGoal, primaryGoal, uniqueGoalName } from './goals.js';

const goal = (id, order, createdAt = '2026-01-01T00:00:00Z', target = 10000) => ({
  id,
  name: id,
  order,
  target,
  createdAt,
});
const entry = (amount, goalId) => ({ id: `e-${goalId}-${amount}`, amount, goalId, at: '2026-01-02T00:00:00Z' });

describe('sortGoals', () => {
  it('sıra numarasına göre dizer', () => {
    const goals = [goal('c', 2), goal('a', 0), goal('b', 1)];
    expect(sortGoals(goals).map((g) => g.id)).toEqual(['a', 'b', 'c']);
  });

  it('sıra numarası olmayanları sona atar', () => {
    const goals = [{ id: 'x', name: 'x', createdAt: '2026-01-01T00:00:00Z' }, goal('a', 0)];
    expect(sortGoals(goals).map((g) => g.id)).toEqual(['a', 'x']);
  });

  it('eşitlikte eski hedef önde gelir', () => {
    const goals = [goal('yeni', 0, '2026-05-01T00:00:00Z'), goal('eski', 0, '2026-01-01T00:00:00Z')];
    expect(sortGoals(goals).map((g) => g.id)).toEqual(['eski', 'yeni']);
  });

  it('girdi dizisini bozmaz', () => {
    const goals = [goal('c', 2), goal('a', 0)];
    sortGoals(goals);
    expect(goals.map((g) => g.id)).toEqual(['c', 'a']);
  });
});

describe('normalizeOrders', () => {
  it('sıraları sıfırdan başlatır', () => {
    const out = normalizeOrders([goal('b', 5), goal('a', 2)]);
    expect(out.map((g) => [g.id, g.order])).toEqual([['a', 0], ['b', 1]]);
  });
});

describe('moveGoal', () => {
  const goals = [goal('a', 0), goal('b', 1), goal('c', 2)];

  it('yukarı taşır', () => {
    expect(moveGoal(goals, 'c', 'up').map((g) => g.id)).toEqual(['a', 'c', 'b']);
  });

  it('aşağı taşır', () => {
    expect(moveGoal(goals, 'a', 'down').map((g) => g.id)).toEqual(['b', 'a', 'c']);
  });

  it('en üstteki yukarı gitmez', () => {
    expect(moveGoal(goals, 'a', 'up').map((g) => g.id)).toEqual(['a', 'b', 'c']);
  });

  it('en alttaki aşağı gitmez', () => {
    expect(moveGoal(goals, 'c', 'down').map((g) => g.id)).toEqual(['a', 'b', 'c']);
  });

  it('bilinmeyen hedefte sırayı korur', () => {
    expect(moveGoal(goals, 'yok', 'up').map((g) => g.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('primaryGoal', () => {
  it('sırada en öndeki hedefi verir', () => {
    expect(primaryGoal([goal('a', 0), goal('b', 1)], []).id).toBe('a');
  });

  it('tamamlanmış hedefi atlar', () => {
    const goals = [goal('a', 0), goal('b', 1)];
    const entries = [entry(10000, 'a')];
    expect(primaryGoal(goals, entries).id).toBe('b');
  });

  it('hepsi tamamlanmışsa yine en öndekini verir', () => {
    const goals = [goal('a', 0), goal('b', 1)];
    const entries = [entry(10000, 'a'), entry(10000, 'b')];
    expect(primaryGoal(goals, entries).id).toBe('a');
  });

  it('hedef yoksa null verir', () => {
    expect(primaryGoal([], [])).toBeNull();
  });

  it('açık uçlu hedef hiç tamamlanmaz', () => {
    const goals = [goal('acik', 0, '2026-01-01T00:00:00Z', 0)];
    expect(primaryGoal(goals, [entry(999999, 'acik')]).id).toBe('acik');
  });
});

describe('uniqueGoalName', () => {
  it('boş listede temel adı verir', () => {
    expect(uniqueGoalName('Savings', [])).toBe('Savings');
  });

  it('ad doluysa numaralandırır', () => {
    expect(uniqueGoalName('Savings', [{ name: 'Savings' }])).toBe('Savings 2');
  });

  it('boşluğu atlayarak devam eder', () => {
    const goals = [{ name: 'Savings' }, { name: 'Savings 2' }];
    expect(uniqueGoalName('Savings', goals)).toBe('Savings 3');
  });

  it('büyük küçük harf farkını yok sayar', () => {
    expect(uniqueGoalName('Savings', [{ name: 'savings' }])).toBe('Savings 2');
  });

  it('bozuk kayıtları atlar', () => {
    expect(uniqueGoalName('Savings', [null, { name: 42 }])).toBe('Savings');
  });
});
