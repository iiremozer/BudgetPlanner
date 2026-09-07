import { describe, it, expect } from 'vitest';
import {
  totalTransferred,
  pendingAmount,
  lastTransferAt,
  oldestPendingAt,
  shouldPrompt,
  daysWaiting,
} from './transfers.js';

const day = (y, m, d, h = 12) => new Date(y, m - 1, d, h, 0, 0);
const entry = (id, amount, at) => ({ id, amount, at: at.toISOString(), goalId: null });
const transfer = (id, amount, at) => ({ id, amount, at: at.toISOString() });

describe('totalTransferred', () => {
  it('aktarım yoksa sıfırdır', () => {
    expect(totalTransferred([])).toBe(0);
  });

  it('aktarımları toplar', () => {
    expect(totalTransferred([transfer('t1', 1000, day(2026, 1, 1)), transfer('t2', 500, day(2026, 1, 8))])).toBe(1500);
  });

  it('bozuk tutarı yok sayar', () => {
    expect(totalTransferred([transfer('t1', 1000, day(2026, 1, 1)), { id: 't2', amount: 'çok' }])).toBe(1000);
  });
});

describe('pendingAmount', () => {
  it('hiç aktarılmadıysa tamamı bekler', () => {
    expect(pendingAmount([entry('e1', 2600, day(2026, 1, 1))], [])).toBe(2600);
  });

  it('aktarılan düşülür', () => {
    const entries = [entry('e1', 2600, day(2026, 1, 1))];
    expect(pendingAmount(entries, [transfer('t1', 1000, day(2026, 1, 2))])).toBe(1600);
  });

  it('fazla aktarım eksiye düşmez', () => {
    const entries = [entry('e1', 1000, day(2026, 1, 1))];
    expect(pendingAmount(entries, [transfer('t1', 5000, day(2026, 1, 2))])).toBe(0);
  });
});

describe('lastTransferAt', () => {
  it('aktarım yoksa null', () => {
    expect(lastTransferAt([])).toBeNull();
  });

  it('en yeni aktarımı verir', () => {
    const list = [transfer('t1', 100, day(2026, 1, 1)), transfer('t2', 100, day(2026, 3, 1))];
    expect(lastTransferAt(list).getMonth()).toBe(2);
  });
});

describe('oldestPendingAt', () => {
  it('hiç aktarım yoksa ilk kaydı verir', () => {
    const entries = [entry('e1', 100, day(2026, 1, 5)), entry('e2', 100, day(2026, 1, 2))];
    expect(oldestPendingAt(entries, []).getDate()).toBe(2);
  });

  it('son aktarımdan sonraki ilk kaydı verir', () => {
    const entries = [entry('e1', 100, day(2026, 1, 2)), entry('e2', 100, day(2026, 2, 10))];
    const transfers = [transfer('t1', 100, day(2026, 1, 20))];
    expect(oldestPendingAt(entries, transfers).getMonth()).toBe(1);
  });

  it('bekleyen kayıt yoksa null', () => {
    const entries = [entry('e1', 100, day(2026, 1, 2))];
    const transfers = [transfer('t1', 100, day(2026, 1, 20))];
    expect(oldestPendingAt(entries, transfers)).toBeNull();
  });
});

describe('shouldPrompt', () => {
  it('bekleyen para yoksa sormaz', () => {
    const entries = [entry('e1', 1000, day(2026, 1, 1))];
    const transfers = [transfer('t1', 1000, day(2026, 1, 2))];
    expect(shouldPrompt(entries, transfers, day(2026, 3, 1))).toBe(false);
  });

  it('bir haftadan yeni kayıtlarda sormaz', () => {
    const entries = [entry('e1', 1000, day(2026, 3, 8))];
    expect(shouldPrompt(entries, [], day(2026, 3, 10))).toBe(false);
  });

  it('bir haftayı geçince sorar', () => {
    const entries = [entry('e1', 1000, day(2026, 3, 1))];
    expect(shouldPrompt(entries, [], day(2026, 3, 10))).toBe(true);
  });

  it('hiç kayıt yoksa sormaz', () => {
    expect(shouldPrompt([], [], day(2026, 3, 10))).toBe(false);
  });
});

describe('daysWaiting', () => {
  it('bekleyen yoksa sıfır', () => {
    expect(daysWaiting([], [], day(2026, 3, 10))).toBe(0);
  });

  it('gün sayısını verir', () => {
    const entries = [entry('e1', 1000, day(2026, 3, 1, 12))];
    expect(daysWaiting(entries, [], day(2026, 3, 10, 12))).toBe(9);
  });
});
