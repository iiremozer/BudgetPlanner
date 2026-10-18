// Hangi bildirimin ne zaman kurulacağına karar veren saf katman.
// Bildirim göndermek native tarafın işi; buradaki tek iş karar vermek,
// böylece test edilebiliyor.
//
// Önemli sınır: yerel bildirimler yalnızca bu cihazdaki durumu bilir.
// "Eşin hedefe para ekledi" bildirimi sunucudan itilmek zorunda, bu yüzden
// burada yok — onu ancak push altyapısı kurulunca ekleyebiliriz.

import { formatMoney } from './money.js';
import { pendingAmount, daysWaiting, shouldPrompt } from './transfers.js';
import { totalSaved } from './savings.js';
import { dayKey } from './savings.js';

export const NOTIFICATION_IDS = {
  transfer: 1,
  weekly: 2,
};

export function defaultNotificationSettings() {
  return { transfers: false, weekly: false };
}

export function cleanNotificationSettings(raw) {
  const base = defaultNotificationSettings();
  if (!raw || typeof raw !== 'object') return base;
  return {
    transfers: raw.transfers === true,
    weekly: raw.weekly === true,
  };
}

/** Bir sonraki belirli gün ve saat. Bugün o gün ve saat geçmişse haftaya atar. */
export function nextWeekday(now, weekday, hour) {
  const base = now instanceof Date ? new Date(now.getTime()) : new Date(now);
  if (Number.isNaN(base.getTime())) return null;

  const target = new Date(base.getTime());
  target.setHours(hour, 0, 0, 0);

  let delta = (weekday - target.getDay() + 7) % 7;
  if (delta === 0 && target.getTime() <= base.getTime()) delta = 7;
  target.setDate(target.getDate() + delta);
  return target;
}

/** Bu haftaki (son yedi gün) kayıtların toplamı. */
export function thisWeekTotal(entries = [], now = new Date()) {
  const end = now instanceof Date ? now : new Date(now);
  const cutoff = new Date(end.getTime());
  cutoff.setDate(cutoff.getDate() - 6);
  const from = dayKey(cutoff);

  return totalSaved(entries.filter((e) => {
    const key = dayKey(e?.at);
    return key && key >= from;
  }));
}

/**
 * Kurulacak bildirimlerin listesi. Her çağrıda baştan hesaplanır;
 * native taraf önce hepsini iptal edip bunları kurar.
 */
export function planNotifications(state, now = new Date()) {
  const settings = cleanNotificationSettings(state?.notifications);
  const entries = state?.entries ?? [];
  const transfers = state?.transfers ?? [];
  const currency = state?.currency ?? 'GBP';
  const plan = [];

  if (settings.transfers && shouldPrompt(entries, transfers, now)) {
    const pending = pendingAmount(entries, transfers);
    const days = daysWaiting(entries, transfers, now);
    plan.push({
      id: NOTIFICATION_IDS.transfer,
      title: 'Still in your current account',
      body: `${formatMoney(pending, currency)} has been waiting ${days} days. Move it across when you get a minute.`,
      at: nextWeekday(now, 0, 18),
    });
  }

  if (settings.weekly) {
    const week = thisWeekTotal(entries, now);
    plan.push({
      id: NOTIFICATION_IDS.weekly,
      title: 'Your week',
      body:
        week > 0
          ? `You put ${formatMoney(week, currency)} aside this week. Nice.`
          : 'Nothing logged this week. One skipped coffee is a start.',
      at: nextWeekday(now, 0, 18),
    });
  }

  return plan;
}
