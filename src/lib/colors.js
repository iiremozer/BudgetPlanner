// Her kavanozun kendi rengi olsun diye küçük bir palet. Renkler kart
// zemininde okunaklı kalacak kadar doygun, yan yana durunca yormayacak
// kadar da yumuşak seçildi.

export const PALETTE = [
  { id: 'amber',  name: 'Amber',  light: '#f0bc55', base: '#e0a42e', dark: '#c08415', tint: '#fbf2df', tintDark: '#352c18' },
  { id: 'coral',  name: 'Coral',  light: '#ee8a72', base: '#e0705a', dark: '#b94e3a', tint: '#fceeea', tintDark: '#38231d' },
  { id: 'rose',   name: 'Rose',   light: '#de7ba4', base: '#cc5c8b', dark: '#a63e6c', tint: '#fbecf2', tintDark: '#351f2a' },
  { id: 'violet', name: 'Violet', light: '#9a8bd8', base: '#7c6bc4', dark: '#5b4ca0', tint: '#efedfa', tintDark: '#262240' },
  { id: 'ocean',  name: 'Ocean',  light: '#5d9dc4', base: '#3e7fa8', dark: '#2a6288', tint: '#e9f2f8', tintDark: '#1b2c38' },
  { id: 'teal',   name: 'Teal',   light: '#4fb3a3', base: '#2f9c8f', dark: '#1d7a6e', tint: '#e6f5f2', tintDark: '#16302d' },
  { id: 'green',  name: 'Green',  light: '#7cb868', base: '#5c9e4b', dark: '#427936', tint: '#eef6ea', tintDark: '#1f2e1b' },
  { id: 'clay',   name: 'Clay',   light: '#c79055', base: '#b0763f', dark: '#8d5b2a', tint: '#f8f0e6', tintDark: '#33261a' },
];

export const SLATE = {
  id: 'slate',
  name: 'Slate',
  light: '#8fa0ae',
  base: '#6f8394',
  dark: '#536576',
  tint: '#eef1f4',
  tintDark: '#22282e',
};

// Uygulamanın ana rengi, üç role ayrılmış durumda:
//   base    — açık temada geniş yüzey (üst blok, düğmeler), üstünde beyaz yazı
//   soft    — koyu temada doygun vurgu: düğme zemini, seçili sekme, önemli sayı
//   surface — koyu temada geniş yüzey. Zeminden açık ve rengi belli olacak
//             kadar tonlu; base'i koyu temada kullanmak her şeyi çamura çeviriyor.
export const ACCENTS = [
  { id: 'pine',  name: 'Pine',  base: '#1e3a34', soft: '#7cc4af', surface: '#1b3a33' },
  { id: 'navy',  name: 'Navy',  base: '#1f3350', soft: '#8ab4ea', surface: '#1d3151' },
  { id: 'plum',  name: 'Plum',  base: '#452a46', soft: '#d09dd4', surface: '#3d2740' },
  { id: 'ember', name: 'Ember', base: '#5a2f23', soft: '#ec9e85', surface: '#4a2a20' },
  { id: 'ink',   name: 'Ink',   base: '#262a30', soft: '#b6c2cf', surface: '#262c34' },
  { id: 'olive', name: 'Olive', base: '#3a3f22', soft: '#c3cd83', surface: '#343a20' },
];

/** Bir vurgu renginin o temadaki rolleri. */
export function accentRoles(accent, theme) {
  const dark = theme === 'dark';
  return {
    // Geniş yüzey ve üstündeki yazı
    surface: dark ? accent.surface : accent.base,
    onSurface: '#ffffff',
    // Dokunulabilir öğeler: koyu temada parlak zemin + koyu yazı okunaklı olan
    fill: dark ? accent.soft : accent.base,
    onFill: dark ? '#10151a' : '#ffffff',
    // Vurgu metni ve kenarlıklar
    bright: dark ? accent.soft : accent.base,
  };
}

export const DEFAULT_ACCENT = 'pine';

export function isAccentId(id) {
  return ACCENTS.some((a) => a.id === id);
}

export function accentOf(id) {
  return ACCENTS.find((a) => a.id === id) ?? ACCENTS.find((a) => a.id === DEFAULT_ACCENT);
}

export const THEMES = ['system', 'light', 'dark'];

export function isTheme(value) {
  return THEMES.includes(value);
}

/** Seçime ve cihaz tercihine bakarak hangi tema uygulanacak. */
export function resolveTheme(choice, prefersDark = false) {
  if (choice === 'light' || choice === 'dark') return choice;
  return prefersDark ? 'dark' : 'light';
}

/** Bir hedef renginin o temadaki zemin tonu. */
export function tintFor(color, theme) {
  return theme === 'dark' ? color.tintDark : color.tint;
}

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
