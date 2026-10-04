import { describe, it, expect } from 'vitest';
import {
  contributorTotals,
  hasOtherContributors,
  newFromOthers,
  latestFromOthers,
} from './contributions.js';

const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h, 0, 0).toISOString();
const entry = (id, amount, by, when, goalId = 'g1') => ({ id, amount, by, at: when, goalId });

const sample = [
  entry('a', 1000, 'Irem', at(2026, 3, 1)),
  entry('b', 2000, 'Batuhan', at(2026, 3, 2)),
  entry('c', 500, 'Irem', at(2026, 3, 3)),
  entry('d', 9999, 'Irem', at(2026, 3, 4), 'g2'),
];

describe('contributorTotals', () => {
  it('kişi başına toplar', () => {
    expect(contributorTotals(sample, 'g1')).toEqual([
      { name: 'Batuhan', total: 2000 },
      { name: 'Irem', total: 1500 },
    ]);
  });

  it('başka hedefin kayıtlarını katmaz', () => {
    expect(contributorTotals(sample, 'g2')).toEqual([{ name: 'Irem', total: 9999 }]);
  });

  it('adsız kayıtları tek başlıkta toplar', () => {
    const entries = [entry('a', 100, '', at(2026, 3, 1)), entry('b', 200, undefined, at(2026, 3, 2))];
    expect(contributorTotals(entries, 'g1')).toEqual([{ name: 'Someone', total: 300 }]);
  });

  it('kayıt yoksa boş liste', () => {
    expect(contributorTotals([], 'g1')).toEqual([]);
  });
});

describe('hasOtherContributors', () => {
  it('tek kişi varsa false', () => {
    const entries = [entry('a', 100, 'Irem', at(2026, 3, 1))];
    expect(hasOtherContributors(entries, 'g1', 'Irem')).toBe(false);
  });

  it('başkası varsa true', () => {
    expect(hasOtherContributors(sample, 'g1', 'Irem')).toBe(true);
  });
});

describe('newFromOthers', () => {
  it('son görülmeden sonrakileri verir', () => {
    const out = newFromOthers(sample, 'g1', 'Irem', at(2026, 3, 1));
    expect(out.map((e) => e.id)).toEqual(['b']);
  });

  it('kendi kayıtlarını saymaz', () => {
    const out = newFromOthers(sample, 'g1', 'Batuhan', at(2026, 2, 1));
    expect(out.map((e) => e.id)).toEqual(['c', 'a']);
  });

  it('son görülme yoksa hepsini verir', () => {
    expect(newFromOthers(sample, 'g1', 'Irem', null)).toHaveLength(1);
  });

  it('her şey görülmüşse boş verir', () => {
    expect(newFromOthers(sample, 'g1', 'Irem', at(2026, 4, 1))).toEqual([]);
  });

  it('yeniden eskiye sıralar', () => {
    const entries = [
      entry('x', 100, 'Batuhan', at(2026, 3, 1)),
      entry('y', 100, 'Batuhan', at(2026, 3, 5)),
    ];
    expect(newFromOthers(entries, 'g1', 'Irem', null).map((e) => e.id)).toEqual(['y', 'x']);
  });
});

describe('latestFromOthers', () => {
  it('başkasının en son kaydını verir', () => {
    expect(latestFromOthers(sample, 'g1', 'Irem').id).toBe('b');
  });

  it('başkası yoksa null', () => {
    const entries = [entry('a', 100, 'Irem', at(2026, 3, 1))];
    expect(latestFromOthers(entries, 'g1', 'Irem')).toBeNull();
  });
});
