import { describe, it, expect } from 'vitest';
import {
  toBackup,
  fromBackup,
  mergeBackup,
  replaceWithBackup,
  backupFilename,
  BACKUP_FORMAT,
} from './backup.js';
import { defaultState } from './storage.js';

const entry = (id, amount, at) => ({ id, amount, at, goalId: null, note: '' });
const sample = () => ({
  currency: 'TRY',
  generalName: 'Günlük',
  goals: [
    {
      id: 'g1',
      name: 'Japan',
      emoji: '🛫',
      color: 'teal',
      target: 300000,
      order: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  entries: [entry('e1', 2600, '2026-01-02T10:00:00.000Z')],
  deleted: { entries: [], goals: [] },
});

describe('toBackup', () => {
  it('tanınabilir bir zarf üretir', () => {
    const b = toBackup(sample(), new Date('2026-03-10T12:00:00Z'));
    expect(b.format).toBe(BACKUP_FORMAT);
    expect(b.version).toBe(1);
    expect(b.exportedAt).toBe('2026-03-10T12:00:00.000Z');
  });

  it('sayıları özetler', () => {
    expect(toBackup(sample()).counts).toEqual({ goals: 1, entries: 1 });
  });

  it('bozuk defteri de güvenli hale getirir', () => {
    expect(toBackup({ goals: 'çöp', entries: null }).state.goals).toEqual([]);
  });
});

describe('fromBackup', () => {
  it('kendi ürettiğimiz dosyayı okur', () => {
    const text = JSON.stringify(toBackup(sample()));
    const restored = fromBackup(text);
    expect(restored.currency).toBe('TRY');
    expect(restored.goals[0].name).toBe('Japan');
    expect(restored.entries).toHaveLength(1);
  });

  it('nesne olarak da kabul eder', () => {
    expect(fromBackup(toBackup(sample())).generalName).toBe('Günlük');
  });

  it('bozuk metinde null verir', () => {
    expect(fromBackup('{bu json değil')).toBeNull();
  });

  it('yabancı dosyayı reddeder', () => {
    expect(fromBackup(JSON.stringify({ format: 'başka-uygulama', state: {} }))).toBeNull();
    expect(fromBackup(JSON.stringify({ hello: 'world' }))).toBeNull();
    expect(fromBackup(null)).toBeNull();
  });

  it('defter alanı eksikse reddeder', () => {
    expect(fromBackup(JSON.stringify({ format: 'our-savings-book/backup' }))).toBeNull();
  });
});

describe('mergeBackup', () => {
  it('eksik kayıtları geri getirir', () => {
    const current = { ...defaultState(), entries: [entry('e2', 500, '2026-02-01T10:00:00.000Z')] };
    const merged = mergeBackup(current, fromBackup(toBackup(sample())));
    expect(merged.entries.map((e) => e.id).sort()).toEqual(['e1', 'e2']);
  });

  it('aynı kaydı iki kez saymaz', () => {
    const state = sample();
    const merged = mergeBackup(state, fromBackup(toBackup(state)));
    expect(merged.entries).toHaveLength(1);
  });

  it('yedek yoksa defteri bırakır', () => {
    const current = defaultState();
    expect(mergeBackup(current, null)).toBe(current);
  });
});

describe('replaceWithBackup', () => {
  it('yedeği olduğu gibi koyar', () => {
    const restored = replaceWithBackup(fromBackup(toBackup(sample())));
    expect(restored.goals).toHaveLength(1);
    expect(restored.currency).toBe('TRY');
  });

  it('yedek yoksa boş defter verir', () => {
    expect(replaceWithBackup(null)).toEqual(defaultState());
  });
});

describe('backupFilename', () => {
  it('tarihli ad üretir', () => {
    expect(backupFilename(new Date(2026, 2, 5))).toBe('savings-book-2026-03-05.json');
  });
});
