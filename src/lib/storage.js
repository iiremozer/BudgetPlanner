import { DEFAULT_CURRENCY, isCurrencyCode } from './money.js';
import { isPeriod, DEFAULT_PERIOD } from './pace.js';
import { emptyDeleted } from './sync.js';

export const STORAGE_KEY = 'ortak-birikim-defteri:v1';

export function makeId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function defaultState() {
  return {
    version: 2,
    currency: DEFAULT_CURRENCY,
    currencyAt: null,
    goals: [],
    entries: [],
    deleted: emptyDeleted(),
    member: null,
  };
}

/** Bu cihazın defterdeki kimliği. Ad ortak deftere yazılır, kimlik cihazda kalır. */
function cleanMember(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = typeof raw.id === 'string' && raw.id ? raw.id : null;
  const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, 24) : '';
  return id && name ? { id, name } : null;
}

/** Bir hedefin paylaşım kodu. Kodu bilen herkes o hedefe erişir. */
function cleanShare(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const code = typeof raw.code === 'string' ? raw.code.trim().toUpperCase() : '';
  return /^[A-Z0-9]{8,24}$/.test(code) ? { code } : null;
}

function cleanGoal(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = typeof raw.id === 'string' && raw.id ? raw.id : null;
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!id || !name) return null;
  const target = Number.isFinite(raw.target) ? Math.max(0, Math.round(raw.target)) : 0;

  let plan = null;
  const rawPlan = raw.plan;
  if (rawPlan && typeof rawPlan === 'object' && Number.isFinite(rawPlan.perPeriod) && rawPlan.perPeriod > 0) {
    plan = {
      perPeriod: Math.round(rawPlan.perPeriod),
      period: isPeriod(rawPlan.period) ? rawPlan.period : DEFAULT_PERIOD,
    };
  }

  return {
    id,
    name,
    emoji: typeof raw.emoji === 'string' && raw.emoji ? raw.emoji : '🎯',
    target,
    plan,
    order: Number.isFinite(raw.order) ? Math.max(0, Math.round(raw.order)) : null,
    share: cleanShare(raw.share),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date(0).toISOString(),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
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
    by: typeof raw.by === 'string' ? raw.by.trim().slice(0, 24) : '',
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

  const deleted = {
    entries: Array.isArray(raw.deleted?.entries)
      ? raw.deleted.entries.filter((id) => typeof id === 'string' && id)
      : [],
    goals: Array.isArray(raw.deleted?.goals)
      ? raw.deleted.goals.filter((id) => typeof id === 'string' && id)
      : [],
  };

  return {
    version: 2,
    currency,
    currencyAt: typeof raw.currencyAt === 'string' ? raw.currencyAt : null,
    goals,
    entries,
    deleted,
    member: cleanMember(raw.member),
  };
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
