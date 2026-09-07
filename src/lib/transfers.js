// Uygulamanın en büyük zaafı, biriktirdiğini söylediğin paranın hâlâ
// vadesiz hesapta durması. Bu katman "yazdığın" ile "gerçekten aktardığın"
// arasındaki farkı takip eder.

import { totalSaved } from './savings.js';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function totalTransferred(transfers = []) {
  return transfers.reduce((sum, t) => sum + (Number.isFinite(t?.amount) ? t.amount : 0), 0);
}

/** Yazılmış ama henüz aktarılmamış tutar. */
export function pendingAmount(entries = [], transfers = []) {
  return Math.max(0, totalSaved(entries) - totalTransferred(transfers));
}

/** Son aktarımın zamanı. Hiç aktarım yoksa null. */
export function lastTransferAt(transfers = []) {
  const times = transfers
    .map((t) => new Date(t?.at).getTime())
    .filter((t) => !Number.isNaN(t));
  return times.length === 0 ? null : new Date(Math.max(...times));
}

/** Bekleyen tutarın en eski kaydının zamanı — "ne zamandır bekliyor" için. */
export function oldestPendingAt(entries = [], transfers = []) {
  const last = lastTransferAt(transfers);
  const times = entries
    .map((e) => new Date(e?.at).getTime())
    .filter((t) => !Number.isNaN(t) && (!last || t > last.getTime()));
  return times.length === 0 ? null : new Date(Math.min(...times));
}

/**
 * Aktarma hatırlatması gösterilsin mi. Bekleyen para varsa ve en eski
 * bekleyen kayıt bir haftayı geçtiyse gösterir — her gün dürtmez.
 */
export function shouldPrompt(entries = [], transfers = [], now = new Date()) {
  if (pendingAmount(entries, transfers) <= 0) return false;
  const oldest = oldestPendingAt(entries, transfers);
  if (!oldest) return false;
  const end = now instanceof Date ? now.getTime() : new Date(now).getTime();
  return end - oldest.getTime() >= WEEK_MS;
}

/** Kaç gündür bekliyor. */
export function daysWaiting(entries = [], transfers = [], now = new Date()) {
  const oldest = oldestPendingAt(entries, transfers);
  if (!oldest) return 0;
  const end = now instanceof Date ? now.getTime() : new Date(now).getTime();
  return Math.max(0, Math.floor((end - oldest.getTime()) / (24 * 60 * 60 * 1000)));
}
