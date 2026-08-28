import { describe, it, expect } from 'vitest';
import { PRESETS, getPreset, presetAmount } from './presets.js';
import { CURRENCY_CODES } from './money.js';

describe('PRESETS', () => {
  it('her kalıbın kimliği benzersizdir', () => {
    const ids = PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('her kalıpta emoji ve etiket vardır', () => {
    for (const p of PRESETS) {
      expect(p.emoji.length).toBeGreaterThan(0);
      expect(p.label.trim().length).toBeGreaterThan(0);
    }
  });

  it('her kalıp desteklenen tüm para birimleri için tutar taşır', () => {
    for (const p of PRESETS) {
      for (const code of CURRENCY_CODES) {
        expect(presetAmount(p, code)).toBeGreaterThan(0);
      }
    }
  });
});

describe('getPreset', () => {
  it('kimliğe göre bulur', () => {
    expect(getPreset('coffee').label).toBe('Coffee');
  });

  it('bilinmeyen kimlikte null verir', () => {
    expect(getPreset('yacht')).toBeNull();
  });
});

describe('presetAmount', () => {
  it('para birimine göre farklı tutar verir', () => {
    const coffee = getPreset('coffee');
    expect(presetAmount(coffee, 'GBP')).toBe(400);
    expect(presetAmount(coffee, 'TRY')).toBe(15000);
  });

  it('bilinmeyen para biriminde varsayılana düşer', () => {
    expect(presetAmount(getPreset('coffee'), 'JPY')).toBe(400);
  });

  it('bozuk girdide sıfır verir', () => {
    expect(presetAmount(null, 'GBP')).toBe(0);
    expect(presetAmount({}, 'GBP')).toBe(0);
  });
});
