import { describe, it, expect } from 'vitest';
import { mergeState, markDeleted, shareable, emptyDeleted } from './sync.js';

const entry = (id, at, by = 'A') => ({ id, amount: 500, at, by, goalId: null, note: '' });
const goal = (id, name, createdAt, updatedAt = createdAt) => ({
  id,
  name,
  target: 10000,
  emoji: '🎯',
  createdAt,
  updatedAt,
});

const base = (over = {}) => ({
  currency: 'GBP',
  currencyAt: '2026-01-01T00:00:00.000Z',
  goals: [],
  entries: [],
  deleted: emptyDeleted(),
  ...over,
});

describe('mergeState', () => {
  it('iki cihazın kayıtlarını birleştirir', () => {
    const local = base({ entries: [entry('a', '2026-01-01T10:00:00Z')] });
    const remote = base({ entries: [entry('b', '2026-01-02T10:00:00Z', 'B')] });
    const merged = mergeState(local, remote);
    expect(merged.entries.map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('aynı kaydı iki kez saymaz', () => {
    const shared = entry('a', '2026-01-01T10:00:00Z');
    const merged = mergeState(base({ entries: [shared] }), base({ entries: [shared] }));
    expect(merged.entries).toHaveLength(1);
  });

  it('kayıtları tarihe göre sıralar', () => {
    const local = base({ entries: [entry('c', '2026-01-03T10:00:00Z')] });
    const remote = base({
      entries: [entry('a', '2026-01-01T10:00:00Z'), entry('b', '2026-01-02T10:00:00Z')],
    });
    expect(mergeState(local, remote).entries.map((e) => e.id)).toEqual(['a', 'b', 'c']);
  });

  it('sıradan bağımsızdır', () => {
    const local = base({ entries: [entry('a', '2026-01-01T10:00:00Z')] });
    const remote = base({ entries: [entry('b', '2026-01-02T10:00:00Z')] });
    const one = mergeState(local, remote).entries.map((e) => e.id);
    const two = mergeState(remote, local).entries.map((e) => e.id);
    expect(one).toEqual(two);
  });

  it('silinen kaydı geri diriltmez', () => {
    const gone = entry('a', '2026-01-01T10:00:00Z');
    const local = base({ entries: [], deleted: { entries: ['a'], goals: [] } });
    const remote = base({ entries: [gone] });
    expect(mergeState(local, remote).entries).toHaveLength(0);
  });

  it('karşı taraf sildiyse bizde de silinir', () => {
    const gone = entry('a', '2026-01-01T10:00:00Z');
    const local = base({ entries: [gone] });
    const remote = base({ entries: [], deleted: { entries: ['a'], goals: [] } });
    const merged = mergeState(local, remote);
    expect(merged.entries).toHaveLength(0);
    expect(merged.deleted.entries).toEqual(['a']);
  });

  it('hedeflerde daha yeni sürüm kazanır', () => {
    const local = base({ goals: [goal('g1', 'Eski ad', '2026-01-01T00:00:00Z')] });
    const remote = base({
      goals: [goal('g1', 'Yeni ad', '2026-01-01T00:00:00Z', '2026-02-01T00:00:00Z')],
    });
    expect(mergeState(local, remote).goals[0].name).toBe('Yeni ad');
  });

  it('yerel değişiklik daha yeniyse korunur', () => {
    const local = base({
      goals: [goal('g1', 'Yerel', '2026-01-01T00:00:00Z', '2026-03-01T00:00:00Z')],
    });
    const remote = base({
      goals: [goal('g1', 'Uzak', '2026-01-01T00:00:00Z', '2026-02-01T00:00:00Z')],
    });
    expect(mergeState(local, remote).goals[0].name).toBe('Yerel');
  });

  it('para birimini en son değiştiren kazanır', () => {
    const local = base({ currency: 'GBP', currencyAt: '2026-01-01T00:00:00Z' });
    const remote = base({ currency: 'TRY', currencyAt: '2026-02-01T00:00:00Z' });
    expect(mergeState(local, remote).currency).toBe('TRY');
  });

  it('uzak defter yoksa yereli döndürür', () => {
    const local = base({ entries: [entry('a', '2026-01-01T10:00:00Z')] });
    expect(mergeState(local, null)).toBe(local);
    expect(mergeState(local, 'çöp')).toBe(local);
  });

  it('yerel defter boşsa uzağı alır', () => {
    const remote = base({ entries: [entry('a', '2026-01-01T10:00:00Z')] });
    expect(mergeState(null, remote)).toBe(remote);
  });

  it('cihaza özel alanları bozmaz', () => {
    const local = { ...base(), member: { id: 'm1', name: 'İrem' } };
    const merged = mergeState(local, base());
    expect(merged.member).toEqual({ id: 'm1', name: 'İrem' });
  });
});

describe('markDeleted', () => {
  it('kimliği listeye ekler', () => {
    expect(markDeleted(emptyDeleted(), 'entries', 'a').entries).toEqual(['a']);
  });

  it('aynı kimliği iki kez eklemez', () => {
    const once = markDeleted(emptyDeleted(), 'goals', 'g1');
    expect(markDeleted(once, 'goals', 'g1').goals).toEqual(['g1']);
  });

  it('girdi nesnesini değiştirmez', () => {
    const original = emptyDeleted();
    markDeleted(original, 'entries', 'a');
    expect(original.entries).toEqual([]);
  });
});

describe('shareable', () => {
  it('cihaza özel alanları dışarıda bırakır', () => {
    const state = { ...base(), member: { id: 'm1', name: 'İrem' }, book: { code: 'ABC' } };
    const out = shareable(state);
    expect(out.member).toBeUndefined();
    expect(out.book).toBeUndefined();
    expect(out.currency).toBe('GBP');
  });
});
