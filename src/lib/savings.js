// Arayüzden tamamen bağımsız hesap katmanı. CI'daki testler burayı ölçer.

/** Bir tarihi yerel saate göre "YYYY-AA-GG" anahtarına çevirir. */
export function dayKey(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(date, delta) {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + delta);
  return next;
}

export function totalSaved(entries = []) {
  return entries.reduce((sum, e) => sum + (Number.isFinite(e?.amount) ? e.amount : 0), 0);
}

export function savedForGoal(entries = [], goalId) {
  return totalSaved(entries.filter((e) => e?.goalId === goalId));
}

/**
 * Bir hedefin durumu. ratio 0 ile 1 arasında sınırlıdır,
 * hedef aşılsa bile çubuk taşmaz ama complete true olur.
 */
export function goalProgress(goal, entries = []) {
  const target = Number.isFinite(goal?.target) && goal.target > 0 ? goal.target : 0;
  const saved = savedForGoal(entries, goal?.id);
  const remaining = Math.max(0, target - saved);
  const ratio = target === 0 ? 0 : Math.min(1, saved / target);
  return {
    saved,
    target,
    remaining,
    ratio,
    percent: Math.round(ratio * 100),
    complete: target > 0 && saved >= target,
  };
}

/**
 * Üst üste kaç gün kayıt girildiği. Bugün henüz kayıt yoksa dün
 * baz alınır, böylece gün içinde seri kırılmış gibi görünmez.
 */
export function currentStreak(entries = [], now = new Date()) {
  const days = new Set();
  for (const entry of entries) {
    const key = dayKey(entry?.at);
    if (key) days.add(key);
  }
  if (days.size === 0) return 0;

  const today = dayKey(now);
  let cursor = now instanceof Date ? new Date(now.getTime()) : new Date(now);

  if (!days.has(today)) {
    cursor = addDays(cursor, -1);
    if (!days.has(dayKey(cursor))) return 0;
  }

  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Kayıtları yeniden eskiye sıralar. Girdi dizisini değiştirmez. */
export function sortEntriesByDate(entries = []) {
  return [...entries].sort((a, b) => new Date(b?.at).getTime() - new Date(a?.at).getTime());
}

/** Aynı güne düşen kayıtları gruplar, defter sayfası bu sırayla dizilir. */
export function groupEntriesByDay(entries = []) {
  const groups = new Map();
  for (const entry of sortEntriesByDate(entries)) {
    const key = dayKey(entry?.at);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  }
  return [...groups.entries()].map(([day, items]) => ({
    day,
    entries: items,
    total: totalSaved(items),
  }));
}
