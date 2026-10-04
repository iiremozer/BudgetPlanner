// Paylaşılan hedeflerde kimin ne kadar koyduğu ve en son ne olduğu.
// Uygulamanın tek kendiliğinden tetikleyicisi bu: karşı taraf bir şey
// eklediğinde dönüp bakmak için bir sebep oluşuyor.

const UNNAMED = 'Someone';

function nameOf(entry) {
  const by = typeof entry?.by === 'string' ? entry.by.trim() : '';
  return by || UNNAMED;
}

function forGoal(entries = [], goalId) {
  return entries.filter((e) => e?.goalId === goalId && Number.isFinite(e?.amount));
}

/** Kişi başına toplam, çoktan aza. */
export function contributorTotals(entries = [], goalId) {
  const totals = new Map();
  for (const entry of forGoal(entries, goalId)) {
    const name = nameOf(entry);
    totals.set(name, (totals.get(name) ?? 0) + entry.amount);
  }
  return [...totals.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

/** Bu hedefe birden fazla kişi katkı yaptı mı. */
export function hasOtherContributors(entries = [], goalId, myName) {
  const mine = (myName ?? '').trim();
  return forGoal(entries, goalId).some((e) => nameOf(e) !== (mine || UNNAMED));
}

/** Son görülme anından beri başkalarının eklediği kayıtlar, yeniden eskiye. */
export function newFromOthers(entries = [], goalId, myName, since) {
  const mine = (myName ?? '').trim() || UNNAMED;
  const cutoff = since ? new Date(since).getTime() : 0;
  const safeCutoff = Number.isNaN(cutoff) ? 0 : cutoff;

  return forGoal(entries, goalId)
    .filter((e) => nameOf(e) !== mine)
    .filter((e) => {
      const at = new Date(e.at).getTime();
      return !Number.isNaN(at) && at > safeCutoff;
    })
    .sort((a, b) => new Date(b.at) - new Date(a.at));
}

/** Başkasının en son eklediği kayıt. Yoksa null. */
export function latestFromOthers(entries = [], goalId, myName) {
  const mine = (myName ?? '').trim() || UNNAMED;
  const theirs = forGoal(entries, goalId)
    .filter((e) => nameOf(e) !== mine)
    .sort((a, b) => new Date(b.at) - new Date(a.at));
  return theirs[0] ?? null;
}
