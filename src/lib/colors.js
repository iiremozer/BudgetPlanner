// Her kavanozun kendi rengi olsun diye küçük bir palet. Renkler kart
// zemininde okunaklı kalacak kadar doygun, yan yana durunca yormayacak
// kadar da yumuşak seçildi.

export const PALETTE = [
  { id: 'amber',  name: 'Amber',  light: '#f0bc55', base: '#e0a42e', dark: '#c08415', tint: '#fbf2df' },
  { id: 'coral',  name: 'Coral',  light: '#ee8a72', base: '#e0705a', dark: '#b94e3a', tint: '#fceeea' },
  { id: 'rose',   name: 'Rose',   light: '#de7ba4', base: '#cc5c8b', dark: '#a63e6c', tint: '#fbecf2' },
  { id: 'violet', name: 'Violet', light: '#9a8bd8', base: '#7c6bc4', dark: '#5b4ca0', tint: '#efedfa' },
  { id: 'ocean',  name: 'Ocean',  light: '#5d9dc4', base: '#3e7fa8', dark: '#2a6288', tint: '#e9f2f8' },
  { id: 'teal',   name: 'Teal',   light: '#4fb3a3', base: '#2f9c8f', dark: '#1d7a6e', tint: '#e6f5f2' },
  { id: 'green',  name: 'Green',  light: '#7cb868', base: '#5c9e4b', dark: '#427936', tint: '#eef6ea' },
  { id: 'clay',   name: 'Clay',   light: '#c79055', base: '#b0763f', dark: '#8d5b2a', tint: '#f8f0e6' },
];

export const SLATE = {
  id: 'slate',
  name: 'Slate',
  light: '#8fa0ae',
  base: '#6f8394',
  dark: '#536576',
  tint: '#eef1f4',
};

export const DEFAULT_COLOR = 'amber';

export function isColorId(id) {
  return PALETTE.some((c) => c.id === id);
}

export function colorOf(id) {
  return PALETTE.find((c) => c.id === id) ?? PALETTE.find((c) => c.id === DEFAULT_COLOR);
}

// Simge seçilince renk kendiliğinden gelsin; kullanıcı isterse değiştirir.
const BY_EMOJI = {
  '🎯': 'amber',
  '🏖️': 'ocean',
  '🏠': 'clay',
  '🚗': 'coral',
  '📚': 'violet',
  '🎁': 'rose',
  '🛫': 'teal',
  '🪴': 'green',
};

export function colorForEmoji(emoji) {
  return BY_EMOJI[emoji] ?? DEFAULT_COLOR;
}
