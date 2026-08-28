// Bir hedefi ritme çeviren hesaplar. "£1,000" soyut, "haftada £50, 20 hafta"
// somut — asıl işe yarayan çeviri bu.

export const PERIODS = {
  week: { id: 'week', label: 'Week', adverb: 'a week', days: 7, perWeek: 1 },
  fortnight: { id: 'fortnight', label: 'Fortnight', adverb: 'a fortnight', days: 14, perWeek: 0.5 },
  month: { id: 'month', label: 'Month', adverb: 'a month', days: 30.44, perWeek: 7 / 30.44 },
};

export const PERIOD_IDS = ['week', 'fortnight', 'month'];

export const DEFAULT_PERIOD = 'week';

export function isPeriod(id) {
  return Object.prototype.hasOwnProperty.call(PERIODS, id);
}

export function periodOf(id) {
  return PERIODS[isPeriod(id) ? id : DEFAULT_PERIOD];
}

/** Kalan tutarı verilen dönemlik katkıyla kapatmak kaç dönem sürer. */
export function periodsNeeded(remaining, perPeriod) {
  if (!Number.isFinite(remaining) || !Number.isFinite(perPeriod) || perPeriod <= 0) return null;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / perPeriod);
}

/** Bu tempoda hedefe ulaşılacak tarih. */
export function finishDate(remaining, perPeriod, periodId, from = new Date()) {
  const periods = periodsNeeded(remaining, perPeriod);
  if (periods === null) return null;
  const start = from instanceof Date ? from : new Date(from);
  if (Number.isNaN(start.getTime())) return null;
  const days = Math.round(periods * periodOf(periodId).days);
  const end = new Date(start.getTime());
  end.setDate(end.getDate() + days);
  return end;
}

/** Gerçekte haftada ne kadar birikmiş. İlk kayıttan bugüne bakar. */
export function ratePerWeek(entries = [], goalId, now = new Date()) {
  const mine = entries.filter(
    (e) => e?.goalId === goalId && Number.isFinite(e?.amount) && !Number.isNaN(new Date(e?.at).getTime())
  );
  if (mine.length === 0) return 0;

  const total = mine.reduce((sum, e) => sum + e.amount, 0);
  const first = Math.min(...mine.map((e) => new Date(e.at).getTime()));
  const end = (now instanceof Date ? now : new Date(now)).getTime();

  const weeks = Math.max(1, (end - first) / (7 * 24 * 60 * 60 * 1000));
  return total / weeks;
}

/** Mevcut tempoyla kalan yol kaç hafta sürer. */
export function weeksAtRate(remaining, rate) {
  if (!Number.isFinite(remaining) || !Number.isFinite(rate) || rate <= 0) return null;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / rate);
}
