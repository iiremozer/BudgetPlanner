import { describe, it, expect } from 'vitest';
import { nextMilestone, milestoneProgress } from './milestones.js';

describe('nextMilestone', () => {
  it('sıfırdan ilk eşiği verir', () => {
    expect(nextMilestone(0)).toBe(2500);
  });

  it('eşiğin altındayken o eşiği hedefler', () => {
    expect(nextMilestone(2000)).toBe(2500);
  });

  it('eşik tam dolunca bir üste geçer', () => {
    expect(nextMilestone(2500)).toBe(5000);
    expect(nextMilestone(5000)).toBe(10000);
  });

  it('basamakları sırayla tırmanır', () => {
    expect(nextMilestone(6000)).toBe(10000);
    expect(nextMilestone(30000)).toBe(50000);
    expect(nextMilestone(120000)).toBe(250000);
  });

  it('en üst basamakta takılır', () => {
    expect(nextMilestone(999999999)).toBe(100000000);
  });

  it('bozuk girdide ilk eşiği verir', () => {
    expect(nextMilestone(NaN)).toBe(2500);
    expect(nextMilestone(-500)).toBe(2500);
  });
});

describe('milestoneProgress', () => {
  it('oranı eşiğe göre hesaplar', () => {
    const p = milestoneProgress(1250);
    expect(p.target).toBe(2500);
    expect(p.ratio).toBe(0.5);
    expect(p.remaining).toBe(1250);
  });

  it('eşik geçilince oran yeniden düşer', () => {
    const before = milestoneProgress(2400);
    const after = milestoneProgress(2600);
    expect(before.ratio).toBeGreaterThan(0.9);
    expect(after.ratio).toBeLessThan(0.6);
    expect(after.target).toBe(5000);
  });

  it('boş kavanozda sıfırdır', () => {
    expect(milestoneProgress(0).ratio).toBe(0);
  });
});
