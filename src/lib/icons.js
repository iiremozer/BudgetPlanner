// Depoda hâlâ emoji saklıyoruz (eski kayıtlar bozulmasın diye), ama ekranda
// kendi ikon setimizi çiziyoruz. Bu eşleme ikisini birbirine bağlar.

const BY_EMOJI = {
  '🎯': 'target',
  '🏖️': 'beach',
  '🏠': 'house',
  '🚗': 'car',
  '📚': 'books',
  '🎁': 'gift',
  '🛫': 'plane',
  '🪴': 'plant',
  '☕': 'coffee',
  '🍔': 'burger',
  '📦': 'box',
  '🚕': 'taxi',
  '🍺': 'beer',
  '🍫': 'snack',
  '🛍️': 'bag',
  '📺': 'screen',
  '💰': 'coins',
};

export const FALLBACK_ICON = 'coins';

export function iconForEmoji(emoji) {
  return BY_EMOJI[emoji] ?? FALLBACK_ICON;
}
