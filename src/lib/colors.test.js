import { describe, it, expect } from 'vitest';
import { PALETTE, SLATE, colorOf, isColorId, colorForEmoji, DEFAULT_COLOR } from './colors.js';

describe('palet', () => {
  it('kimlikler benzersizdir', () => {
    const ids = PALETTE.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('her renkte dört ton vardır', () => {
    for (const c of [...PALETTE, SLATE]) {
      for (const key of ['light', 'base', 'dark', 'tint']) {
        expect(c[key]).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it('genel kavanozun rengi palette değildir', () => {
    expect(isColorId(SLATE.id)).toBe(false);
  });
});

describe('colorOf', () => {
  it('kimliğe göre bulur', () => {
    expect(colorOf('ocean').name).toBe('Ocean');
  });

  it('bilinmeyen kimlikte varsayılana düşer', () => {
    expect(colorOf('neon').id).toBe(DEFAULT_COLOR);
    expect(colorOf(undefined).id).toBe(DEFAULT_COLOR);
  });
});

describe('colorForEmoji', () => {
  it('bilinen simgeye renk atar', () => {
    expect(colorForEmoji('🏖️')).toBe('ocean');
    expect(colorForEmoji('🪴')).toBe('green');
  });

  it('her eşleşme palette vardır', () => {
    for (const emoji of ['🎯', '🏖️', '🏠', '🚗', '📚', '🎁', '🛫', '🪴']) {
      expect(isColorId(colorForEmoji(emoji))).toBe(true);
    }
  });

  it('bilinmeyen simgede varsayılanı verir', () => {
    expect(colorForEmoji('🦕')).toBe(DEFAULT_COLOR);
  });
});
