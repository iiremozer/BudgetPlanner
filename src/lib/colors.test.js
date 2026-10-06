import { describe, it, expect } from 'vitest';
import {
  PALETTE,
  SLATE,
  colorOf,
  isColorId,
  colorForEmoji,
  DEFAULT_COLOR,
  ACCENTS,
  accentOf,
  isAccentId,
  DEFAULT_ACCENT,
  THEMES,
  isTheme,
  resolveTheme,
  tintFor,
} from './colors.js';

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

describe('vurgu renkleri', () => {
  it('kimlikler benzersiz ve tonları tam', () => {
    const ids = ACCENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of ACCENTS) {
      expect(a.base).toMatch(/^#[0-9a-f]{6}$/i);
      expect(a.soft).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('bilinmeyen vurgu varsayılana düşer', () => {
    expect(accentOf('neon').id).toBe(DEFAULT_ACCENT);
    expect(isAccentId('pine')).toBe(true);
    expect(isAccentId('neon')).toBe(false);
  });
});

describe('tema', () => {
  it('üç seçenek vardır', () => {
    expect(THEMES).toEqual(['system', 'light', 'dark']);
    expect(isTheme('dark')).toBe(true);
    expect(isTheme('sepia')).toBe(false);
  });

  it('açık ve koyu seçimi cihaz tercihini ezer', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('sistem seçildiyse cihaza uyar', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });

  it('her renkte iki zemin tonu vardır', () => {
    for (const c of [...PALETTE, SLATE]) {
      expect(tintFor(c, 'light')).toBe(c.tint);
      expect(tintFor(c, 'dark')).toBe(c.tintDark);
    }
  });
});
