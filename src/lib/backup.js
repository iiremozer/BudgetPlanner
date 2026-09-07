// Verinin tek kopyası tarayıcının deposunda duruyor. iOS, ana ekrana
// eklenmemiş sitelerin verisini yedi gün kullanılmazsa silebiliyor —
// yani defterin kaybolabilir. Dışa aktarma bunun tek gerçek çaresi.

import { normalizeState, defaultState } from './storage.js';
import { mergeState } from './sync.js';

export const BACKUP_FORMAT = 'our-savings-book/backup';
export const BACKUP_VERSION = 1;

/** Kaydedilecek dosyanın içeriği. */
export function toBackup(state, now = new Date()) {
  const clean = normalizeState(state);
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: (now instanceof Date ? now : new Date(now)).toISOString(),
    counts: { goals: clean.goals.length, entries: clean.entries.length },
    state: clean,
  };
}

/** Dosyadan okunan içeriği deftere çevirir. Tanınmazsa null. */
export function fromBackup(raw) {
  let parsed = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== 'object') return null;
  if (parsed.format !== BACKUP_FORMAT) return null;
  if (!parsed.state || typeof parsed.state !== 'object') return null;
  return normalizeState(parsed.state);
}

/**
 * Yedeği mevcut deftere ekler. Kayıtlar yalnızca eklendiği için
 * birleştirme güvenli: hiçbir şey kaybolmaz, hiçbir şey iki kez sayılmaz.
 */
export function mergeBackup(current, backupState) {
  if (!backupState) return current;
  return normalizeState(mergeState(normalizeState(current), backupState));
}

/** Yedeği mevcut defterin yerine koyar. */
export function replaceWithBackup(backupState) {
  return backupState ? normalizeState(backupState) : defaultState();
}

export function backupFilename(now = new Date()) {
  const d = now instanceof Date ? now : new Date(now);
  const pad = (n) => String(n).padStart(2, '0');
  return `savings-book-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}
