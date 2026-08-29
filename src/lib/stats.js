// Seri sekmesinin beslendiği hesaplar. Hepsi saf: girdi kayıtlar, çıktı sayı.

import { dayKey, totalSaved } from './savings.js';

function daySet(entries = []) {
  const days = new Set();
  for (const entry of entries) {
    const key = dayKey(entry?.at);
    if (key) days.add(key);
  }
  return days;
}

function addDays(date, delta) {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + delta);
  return next;
}

/** Şimdiye kadarki en uzun kesintisiz gün serisi. */
export function longestStreak(entries = []) {
  const days = [...daySet(entries)].sort();
  if (days.length === 0) return 0;

  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i += 1) {
    const prev = new Date(`${days[i - 1]}T00:00:00`);
    const curr = new Date(`${days[i]}T00:00:00`);
    const gap = Math.round((curr - prev) / 86400000);
    run = gap === 1 ? run + 1 : 1;
    if (run > best) best = run;
  }
  return best;
}

/** Son yedi gün: her gün için kayıt var mı ve ne kadar birikmiş. */
export function last7Days(entries = [], now = new Date()) {
  const end = now instanceof Date ? now : new Date(now);
  const buckets = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = addDays(end, -i);
    const key = dayKey(date);
    const dayEntries = entries.filter((e) => dayKey(e?.at) === key);
    buckets.push({
      day: key,
      weekday: date.getDay(),
      total: totalSaved(dayEntries),
      hit: dayEntries.length > 0,
    });
  }
  return buckets;
}

/** En çok biriktirilen gün. Kayıt yoksa null. */
export function bestDay(entries = []) {
  const totals = new Map();
  for (const entry of entries) {
    const key = dayKey(entry?.at);
    if (!key) continue;
    totals.set(key, (totals.get(key) ?? 0) + (Number.isFinite(entry.amount) ? entry.amount : 0));
  }
  if (totals.size === 0) return null;

  let best = null;
  for (const [day, total] of totals) {
    if (!best || total > best.total) best = { day, total };
  }
  return best;
}

/** Kayıt girilen toplam gün sayısı. */
export function activeDays(entries = []) {
  return daySet(entries).size;
}

/** Kayıt başına ortalama tutar. */
export function averageWin(entries = []) {
  const valid = entries.filter((e) => Number.isFinite(e?.amount));
  if (valid.length === 0) return 0;
  return Math.round(totalSaved(valid) / valid.length);
}
