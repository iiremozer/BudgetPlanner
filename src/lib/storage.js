import { DEFAULT_CURRENCY, isCurrencyCode } from './money.js';

export const STORAGE_KEY = 'ortak-birikim-defteri:v1';

export function makeId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function defaultState() {
  return {
    version: 1,
    currency: DEFAULT_CURRENCY,
    goals: [],
    entries: [],
  };
}

function cleanGoal(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = typeof raw.id === 'string' && raw.id ? raw.id : null;
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!id || !name) return null;
  const target = Number.isFinite(raw.target) ? Math.max(0, Math.round(raw.target)) : 0;
  return {
    id,
    name,
    emoji: typeof raw.emoji === 'string' && raw.emoji ? raw.emoji : '🎯',
    target,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date(0).toISOString(),
  };
}

function cleanEntry(raw, goalIds) {
  if (!raw || typeof raw !== 'object') return null;
  const id = typeof raw.id === 'string' && raw.id ? raw.id : null;
  const amount = Number.isFinite(raw.amount) ? Math.round(raw.amount) : null;
  if (!id || amount === null || amount <= 0) return null;
  const at = typeof raw.at === 'string' && !Number.isNaN(new Date(raw.at).getTime())
    ? raw.at
    : null;
  if (!at) return null;
  const goalId = typeof raw.goalId === 'string' && goalIds.has(raw.goalId) ? raw.goalId : null;
  return {
    id,
    amount,
    at,
    goalId,
    emoji: typeof raw.emoji === 'string' && raw.emoji ? raw.emoji : null,
    note: typeof raw.note === 'string' ? raw.note.trim() : '',
  };
}

/** Dışarıdan gelen her veriyi güvenli hale getirir; bozuk kayıtlar sessizce düşer. */
export function normalizeState(raw) {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;

  const currency = isCurrencyCode(raw.currency) ? raw.currency : base.currency;
  const goals = Array.isArray(raw.goals) ? raw.goals.map(cleanGoal).filter(Boolean) : [];
  const goalIds = new Set(goals.map((g) => g.id));
  const entries = Array.isArray(raw.entries)
    ? raw.entries.map((e) => cleanEntry(e, goalIds)).filter(Boolean)
    : [];

  return { version: 1, currency, goals, entries };
}

function resolveStore(store) {
  if (store) return store;
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) return globalThis.localStorage;
  return null;
}

export function loadState(store) {
  const target = resolveStore(store);
  if (!target) return defaultState();
  try {
    const raw = target.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return normalizeState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

export function saveState(state, store) {
  const target = resolveStore(store);
  if (!target) return false;
  try {
    target.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)));
    return true;
  } catch {
    return false;
  }
}
