// Hedeflerin sırası ve önceliği. En üstteki hedef "birincil" sayılır:
// yeni kayıtlar varsayılan olarak ona yazılır.

import { goalProgress } from './savings.js';

function keyOf(goal, index) {
  return Number.isFinite(goal?.order) ? goal.order : 1000 + index;
}

/** Önceliğe göre sıralar. Eşitlikte eski hedef önde gelir. */
export function sortGoals(goals = []) {
  return [...goals]
    .map((goal, index) => ({ goal, index }))
    .sort((a, b) => {
      const diff = keyOf(a.goal, a.index) - keyOf(b.goal, b.index);
      if (diff !== 0) return diff;
      return new Date(a.goal?.createdAt ?? 0) - new Date(b.goal?.createdAt ?? 0);
    })
    .map(({ goal }) => goal);
}

/** Verilen dizilime göre sıra numaralarını 0,1,2… olarak yazar. Yeniden sıralamaz. */
export function withOrders(goals = []) {
  return goals.map((goal, index) => ({ ...goal, order: index }));
}

/** Önce önceliğe göre sıralar, sonra sıra numaralarını tazeler. */
export function normalizeOrders(goals = []) {
  return withOrders(sortGoals(goals));
}

/** Bir hedefi listede yukarı ya da aşağı taşır. */
export function moveGoal(goals = [], id, direction) {
  const sorted = sortGoals(goals);
  const from = sorted.findIndex((g) => g?.id === id);
  if (from === -1) return withOrders(sorted);

  const to = direction === 'up' ? from - 1 : from + 1;
  if (to < 0 || to >= sorted.length) return withOrders(sorted);

  const next = [...sorted];
  [next[from], next[to]] = [next[to], next[from]];
  // Yeniden sıralamadan numaralandır, yoksa taşıma geri alınır.
  return withOrders(next);
}

/**
 * Yeni kaydın varsayılan gideceği hedef: sırada en öndeki tamamlanmamış hedef.
 * Hepsi tamamlanmışsa en öndeki hedef.
 */
export function primaryGoal(goals = [], entries = []) {
  const sorted = sortGoals(goals);
  if (sorted.length === 0) return null;
  return sorted.find((goal) => !goalProgress(goal, entries).complete) ?? sorted[0];
}
