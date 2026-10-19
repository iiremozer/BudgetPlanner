// Defter kodu. Şifre yerine geçtiği için tahmin edilemez olmalı.
// Karıştırılabilecek harfler (O/0, I/1) alfabede yok.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 12;

export function makeBookCode(random) {
  const pick = typeof random === 'function' ? random : defaultRandom;
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += ALPHABET[Math.floor(pick() * ALPHABET.length) % ALPHABET.length];
  }
  return code;
}

function defaultRandom() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] / 2 ** 32;
  }
  return Math.random();
}

/** Kullanıcının yazdığı kodu temizler. Geçersizse null. */
export function normalizeCode(input) {
  if (typeof input !== 'string') return null;
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return /^[A-Z0-9]{8,24}$/.test(cleaned) ? cleaned : null;
}

/** Okunması kolay olsun diye dörderli gruplar. */
export function formatCode(code) {
  if (typeof code !== 'string') return '';
  return code.replace(/(.{4})(?=.)/g, '$1 ');
}

/**
 * Kodu gönderirken kullanılan davet metni. Kimsenin adını taşımaz.
 *
 * Kod kendi satırında, yanında kelime olmadan ve boşluksuz duruyor: mesaj
 * uygulamalarında çift dokunuş bütün kodu seçiyor, satırı basılı tutmak da
 * yalnızca kodu veriyor. Ekranda dörderli gruplanmış hali okunaklı, ama
 * mesajın içinde o boşluklar kopyalamayı zorlaştırıyordu.
 */
export function inviteText(goalName, code) {
  const name = typeof goalName === 'string' && goalName.trim() ? goalName.trim() : 'a goal';
  return [
    `Let's save for ${name} together in Our Savings Book.`,
    '',
    String(code ?? '').toUpperCase(),
    '',
    'Open the app, go to Goals, tap "Join a shared goal" and paste that code.',
  ].join('\n');
}
