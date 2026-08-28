import { DEFAULT_CURRENCY, isCurrencyCode } from './money.js';

// Tek dokunuşla kayıt için hazır kalıplar. Tutarlar kuruş cinsinden,
// her para birimi için ayrı verilir — kur çevirmek yerine yerel bir
// fiyat tahmini kullanmak daha doğru sonuç verir.
export const PRESETS = [
  { id: 'coffee', emoji: '☕', label: 'Coffee', amounts: { GBP: 400, EUR: 400, USD: 500, TRY: 15000 } },
  { id: 'takeaway', emoji: '🍔', label: 'Takeaway', amounts: { GBP: 1200, EUR: 1300, USD: 1500, TRY: 45000 } },
  { id: 'delivery', emoji: '📦', label: 'Delivery', amounts: { GBP: 800, EUR: 900, USD: 1000, TRY: 35000 } },
  { id: 'taxi', emoji: '🚕', label: 'Taxi', amounts: { GBP: 1000, EUR: 1100, USD: 1400, TRY: 30000 } },
  { id: 'drinks', emoji: '🍺', label: 'Drinks', amounts: { GBP: 600, EUR: 700, USD: 800, TRY: 35000 } },
  { id: 'snack', emoji: '🍫', label: 'Snack', amounts: { GBP: 200, EUR: 200, USD: 250, TRY: 8000 } },
  { id: 'impulse', emoji: '🛍️', label: 'Impulse buy', amounts: { GBP: 1500, EUR: 1700, USD: 2000, TRY: 80000 } },
  { id: 'subscription', emoji: '📺', label: 'Subscription', amounts: { GBP: 1000, EUR: 1100, USD: 1200, TRY: 30000 } },
];

export function getPreset(id) {
  return PRESETS.find((p) => p.id === id) ?? null;
}

/** Bir kalıbın seçili para birimindeki varsayılan tutarı. */
export function presetAmount(preset, currency = DEFAULT_CURRENCY) {
  if (!preset || typeof preset.amounts !== 'object') return 0;
  const code = isCurrencyCode(currency) ? currency : DEFAULT_CURRENCY;
  const value = preset.amounts[code];
  return Number.isFinite(value) && value > 0 ? value : 0;
}
