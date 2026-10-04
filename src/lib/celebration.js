// Hedef dolduğunda ne olacağı. Kavanozun dolması uygulamanın duygusal
// karşılığı — orada hiçbir şey olmazsa bütün emek sessizce biter.

import { goalProgress } from './savings.js';
import { contributorTotals } from './contributions.js';
import { PRESETS } from './presets.js';
import { formatMoney } from './money.js';

const LABEL_BY_EMOJI = new Map(PRESETS.map((p) => [p.emoji, p.label]));

/** Tamamlanmış ama henüz kutlanmamış ilk hedef. Yoksa null. */
export function pendingCelebration(goals = [], entries = [], celebrated = {}) {
  for (const goal of goals) {
    if (!goal?.id) continue;
    if (celebrated[goal.id]) continue;
    if (goalProgress(goal, entries).complete) return goal;
  }
  return null;
}

/** Hedefe yazılmış kayıtların en çok hangi kalıptan geldiği. */
export function topCategory(entries = [], goalId) {
  const counts = new Map();
  for (const entry of entries) {
    if (entry?.goalId !== goalId) continue;
    const emoji = typeof entry.emoji === 'string' && entry.emoji ? entry.emoji : null;
    if (!emoji) continue;
    counts.set(emoji, (counts.get(emoji) ?? 0) + 1);
  }
  let best = null;
  for (const [emoji, count] of counts) {
    if (!best || count > best.count) {
      best = { emoji, count, label: LABEL_BY_EMOJI.get(emoji) ?? 'wins' };
    }
  }
  return best;
}

/** Hedef için kutlama ekranını besleyen özet. */
export function goalSummary(goal, entries = [], myName) {
  const progress = goalProgress(goal, entries);
  const mine = entries.filter((e) => e?.goalId === goal?.id);

  const times = mine
    .map((e) => new Date(e.at).getTime())
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b);

  const days =
    times.length > 1 ? Math.max(1, Math.round((times.at(-1) - times[0]) / 86400000)) : 1;

  return {
    saved: progress.saved,
    target: progress.target,
    count: mine.length,
    days,
    perWeek: Math.round((progress.saved / Math.max(1, days)) * 7),
    category: topCategory(entries, goal?.id),
    contributors: contributorTotals(entries, goal?.id).map((c) => ({
      ...c,
      isMe: Boolean(myName) && c.name === myName,
    })),
  };
}

/** Paylaşılacak metin. Tutar dışında kimseyi ilgilendirecek veri taşımaz. */
export function shareText(goal, summary, currency) {
  const lines = [
    `${goal.emoji ?? '🎯'} ${goal.name} — reached!`,
    `${formatMoney(summary.saved, currency)} saved in ${summary.days} ${
      summary.days === 1 ? 'day' : 'days'
    }, one skipped spend at a time.`,
  ];

  if (summary.category && summary.category.count > 1) {
    lines.push(
      `${summary.category.count} × ${summary.category.label.toLowerCase()} skipped along the way.`
    );
  }

  return lines.join('\n');
}
