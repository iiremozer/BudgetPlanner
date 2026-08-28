// Tüm tutarlar tam sayı olarak "kuruş" (minor unit) cinsinden saklanır.
// Böylece 0.1 + 0.2 gibi ondalık hataları hiç oluşmaz.

export const CURRENCIES = {
  GBP: { code: 'GBP', symbol: '£', label: 'Pound', decimalSep: '.', groupSep: ',' },
  TRY: { code: 'TRY', symbol: '₺', label: 'Turkish lira', decimalSep: ',', groupSep: '.' },
  EUR: { code: 'EUR', symbol: '€', label: 'Euro', decimalSep: ',', groupSep: '.' },
  USD: { code: 'USD', symbol: '$', label: 'US dollar', decimalSep: '.', groupSep: ',' },
};

export const CURRENCY_CODES = Object.keys(CURRENCIES);

export const DEFAULT_CURRENCY = 'GBP';

export function isCurrencyCode(code) {
  return Object.prototype.hasOwnProperty.call(CURRENCIES, code);
}

function currencyOf(code) {
  return CURRENCIES[isCurrencyCode(code) ? code : DEFAULT_CURRENCY];
}

/**
 * Kuruş cinsinden tam sayıyı okunur paraya çevirir. 1234 -> "£12.34"
 */
export function formatMoney(minorUnits, code = DEFAULT_CURRENCY, { showSymbol = true } = {}) {
  const cur = currencyOf(code);
  const safe = Number.isFinite(minorUnits) ? Math.round(minorUnits) : 0;
  const negative = safe < 0;
  const abs = Math.abs(safe);

  const whole = Math.floor(abs / 100);
  const cents = abs % 100;

  const groupedWhole = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, cur.groupSep);
  const body = `${groupedWhole}${cur.decimalSep}${String(cents).padStart(2, '0')}`;

  return `${negative ? '−' : ''}${showSymbol ? cur.symbol : ''}${body}`;
}

/**
 * Kullanıcının yazdığı metni kuruşa çevirir. Geçersizse null döner.
 * "5" -> 500 · "5,50" -> 550 · "£12.34" -> 1234 · "1.234,56" -> 123456
 */
export function parseAmount(input) {
  if (typeof input === 'number') {
    return Number.isFinite(input) && input >= 0 ? Math.round(input * 100) : null;
  }
  if (typeof input !== 'string') return null;

  let text = input.trim();
  if (text === '') return null;

  // Para simgelerini ve boşlukları at
  text = text.replace(/[£₺€$\s\u00a0]/g, '');
  if (text === '') return null;
  if (!/^[0-9.,]+$/.test(text)) return null;

  const lastComma = text.lastIndexOf(',');
  const lastDot = text.lastIndexOf('.');

  let decimalIndex = -1;
  if (lastComma !== -1 && lastDot !== -1) {
    // İkisi de varsa sondaki ondalık ayracıdır
    decimalIndex = Math.max(lastComma, lastDot);
  } else if (lastComma !== -1 || lastDot !== -1) {
    const only = Math.max(lastComma, lastDot);
    const after = text.length - only - 1;
    const occurrences = text.split(text[only]).length - 1;
    // "1,234" gibi tek ayraç + tam 3 hane binlik ayracıdır
    decimalIndex = occurrences === 1 && after !== 3 ? only : -1;
    if (occurrences > 1) decimalIndex = -1;
  }

  let wholePart;
  let fracPart = '';
  if (decimalIndex === -1) {
    wholePart = text.replace(/[.,]/g, '');
  } else {
    wholePart = text.slice(0, decimalIndex).replace(/[.,]/g, '');
    fracPart = text.slice(decimalIndex + 1).replace(/[.,]/g, '');
  }

  if (wholePart === '' && fracPart === '') return null;
  if (!/^\d*$/.test(wholePart) || !/^\d*$/.test(fracPart)) return null;

  const whole = wholePart === '' ? 0 : Number(wholePart);
  const cents = Math.round(Number(`0.${fracPart === '' ? '0' : fracPart}`) * 100);

  const total = whole * 100 + cents;
  return Number.isSafeInteger(total) ? total : null;
}
