import { describe, it, expect } from 'vitest';
import { iconForEmoji, FALLBACK_ICON } from './icons.js';
import { ICON_NAMES } from '../components/Icon.jsx';
import { PRESETS } from './presets.js';

describe('iconForEmoji', () => {
  it('bilinen simgeyi ikona çevirir', () => {
    expect(iconForEmoji('☕')).toBe('coffee');
    expect(iconForEmoji('🏖️')).toBe('beach');
  });

  it('bilinmeyen simgede yedeğe düşer', () => {
    expect(iconForEmoji('🦕')).toBe(FALLBACK_ICON);
    expect(iconForEmoji(undefined)).toBe(FALLBACK_ICON);
  });

  it('her hazır kalıbın çizilmiş bir ikonu vardır', () => {
    for (const preset of PRESETS) {
      const name = iconForEmoji(preset.emoji);
      expect(name).not.toBe(FALLBACK_ICON);
      expect(ICON_NAMES).toContain(name);
    }
  });

  it('her hedef simgesinin çizilmiş bir ikonu vardır', () => {
    for (const emoji of ['🎯', '🏖️', '🏠', '🚗', '📚', '🎁', '🛫', '🪴']) {
      expect(ICON_NAMES).toContain(iconForEmoji(emoji));
    }
  });
});
