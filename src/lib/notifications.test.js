import { describe, it, expect } from 'vitest';
import {
  planNotifications,
  nextWeekday,
  thisWeekTotal,
  cleanNotificationSettings,
  defaultNotificationSettings,
  NOTIFICATION_IDS,
} from './notifications.js';

const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h, 0, 0);
const entry = (id, amount, when) => ({ id, amount, at: when.toISOString(), goalId: null });

describe('cleanNotificationSettings', () => {
  it('varsayılan olarak ikisi de kapalıdır', () => {
    expect(defaultNotificationSettings()).toEqual({ transfers: false, weekly: false });
    expect(cleanNotificationSettings(undefined)).toEqual({ transfers: false, weekly: false });
  });

  it('yalnızca gerçek true değerini açar', () => {
    expect(cleanNotificationSettings({ transfers: true, weekly: 'evet' })).toEqual({
      transfers: true,
      weekly: false,
    });
  });

  it('bozuk girdide varsayılana düşer', () => {
    expect(cleanNotificationSettings('çöp')).toEqual({ transfers: false, weekly: false });
  });
});

describe('nextWeekday', () => {
  it('haftanın ilerisindeki günü bulur', () => {
    // 2026-03-10 Salı; bir sonraki Pazar 15'i.
    const next = nextWeekday(at(2026, 3, 10), 0, 18);
    expect(next.getDate()).toBe(15);
    expect(next.getHours()).toBe(18);
  });

  it('bugün o günse ve saat geçmediyse bugünü verir', () => {
    const next = nextWeekday(at(2026, 3, 15, 9), 0, 18);
    expect(next.getDate()).toBe(15);
  });

  it('bugün o günse ama saat geçtiyse haftaya atar', () => {
    const next = nextWeekday(at(2026, 3, 15, 20), 0, 18);
    expect(next.getDate()).toBe(22);
  });

  it('bozuk tarihte null verir', () => {
    expect(nextWeekday('bir ara', 0, 18)).toBeNull();
  });
});

describe('thisWeekTotal', () => {
  it('son yedi günü toplar', () => {
    const entries = [
      entry('a', 500, at(2026, 3, 10)),
      entry('b', 300, at(2026, 3, 8)),
      entry('c', 999, at(2026, 2, 1)),
    ];
    expect(thisWeekTotal(entries, at(2026, 3, 10))).toBe(800);
  });

  it('kayıt yoksa sıfırdır', () => {
    expect(thisWeekTotal([], at(2026, 3, 10))).toBe(0);
  });
});

describe('planNotifications', () => {
  const old = at(2026, 3, 1);
  const now = at(2026, 3, 12);

  it('ayarlar kapalıyken hiçbir şey kurmaz', () => {
    const state = { entries: [entry('a', 2600, old)], transfers: [], currency: 'GBP' };
    expect(planNotifications(state, now)).toEqual([]);
  });

  it('bekleyen para bir haftayı geçtiyse aktarım hatırlatması kurar', () => {
    const state = {
      entries: [entry('a', 2600, old)],
      transfers: [],
      currency: 'GBP',
      notifications: { transfers: true },
    };
    const plan = planNotifications(state, now);
    expect(plan).toHaveLength(1);
    expect(plan[0].id).toBe(NOTIFICATION_IDS.transfer);
    expect(plan[0].body).toContain('£26.00');
    expect(plan[0].body).toContain('11 days');
  });

  it('para yeni yazıldıysa aktarım hatırlatması kurmaz', () => {
    const state = {
      entries: [entry('a', 2600, at(2026, 3, 11))],
      transfers: [],
      currency: 'GBP',
      notifications: { transfers: true },
    };
    expect(planNotifications(state, now)).toEqual([]);
  });

  it('her şey aktarıldıysa hatırlatma kurmaz', () => {
    const state = {
      entries: [entry('a', 2600, old)],
      transfers: [{ id: 't1', amount: 2600, at: at(2026, 3, 2).toISOString() }],
      currency: 'GBP',
      notifications: { transfers: true },
    };
    expect(planNotifications(state, now)).toEqual([]);
  });

  it('haftalık özet kuruluyken tutarı yazar', () => {
    const state = {
      entries: [entry('a', 1500, at(2026, 3, 10))],
      transfers: [],
      currency: 'GBP',
      notifications: { weekly: true },
    };
    const plan = planNotifications(state, now);
    expect(plan).toHaveLength(1);
    expect(plan[0].id).toBe(NOTIFICATION_IDS.weekly);
    expect(plan[0].body).toContain('£15.00');
  });

  it('boş haftada suçlayıcı değil, davetkâr konuşur', () => {
    const state = { entries: [], transfers: [], currency: 'GBP', notifications: { weekly: true } };
    expect(planNotifications(state, now)[0].body).toContain('start');
  });

  it('para birimini kullanır', () => {
    const state = {
      entries: [entry('a', 15000, at(2026, 3, 10))],
      transfers: [],
      currency: 'TRY',
      notifications: { weekly: true },
    };
    expect(planNotifications(state, now)[0].body).toContain('₺150,00');
  });

  it('iki ayar birden açıkken ikisini de kurar', () => {
    const state = {
      entries: [entry('a', 2600, old)],
      transfers: [],
      currency: 'GBP',
      notifications: { transfers: true, weekly: true },
    };
    expect(planNotifications(state, now).map((n) => n.id)).toEqual([
      NOTIFICATION_IDS.transfer,
      NOTIFICATION_IDS.weekly,
    ]);
  });

  it('her bildirimin geleceğe dönük bir zamanı vardır', () => {
    const state = {
      entries: [entry('a', 2600, old)],
      transfers: [],
      currency: 'GBP',
      notifications: { transfers: true, weekly: true },
    };
    for (const item of planNotifications(state, now)) {
      expect(item.at.getTime()).toBeGreaterThan(now.getTime());
    }
  });
});
