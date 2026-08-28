// İki cihazın defterini birleştirir.
//
// Kayıtlar yalnızca eklenir, hiç değişmez — bu yüzden birleştirme
// kimliklerin birleşimidir ve gerçek bir çakışma doğmaz. Silme işlemi
// tek istisna: silinen kimlik "deleted" listesinde tutulmazsa, karşı
// cihaz onu bir sonraki eşitlemede geri diriltir.

function indexById(items = []) {
  const map = new Map();
  for (const item of items) {
    if (item && typeof item.id === 'string') map.set(item.id, item);
  }
  return map;
}

function unionIds(a = [], b = []) {
  return [...new Set([...a, ...b].filter((id) => typeof id === 'string' && id))];
}

function timeOf(value) {
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** İki hedefin aynısından hangisi daha yeniyse o kazanır. */
function pickNewer(local, remote) {
  if (!local) return remote;
  if (!remote) return local;
  const l = timeOf(local.updatedAt ?? local.createdAt);
  const r = timeOf(remote.updatedAt ?? remote.createdAt);
  return r > l ? remote : local;
}

export function emptyDeleted() {
  return { entries: [], goals: [] };
}

/**
 * Yerel ve uzak defteri birleştirir. Sıra önemsizdir:
 * merge(a, b) ile merge(b, a) aynı içeriği verir.
 */
export function mergeState(local, remote) {
  if (!remote || typeof remote !== 'object') return local;
  if (!local || typeof local !== 'object') return remote;

  const deleted = {
    entries: unionIds(local.deleted?.entries, remote.deleted?.entries),
    goals: unionIds(local.deleted?.goals, remote.deleted?.goals),
  };
  const goneEntries = new Set(deleted.entries);
  const goneGoals = new Set(deleted.goals);

  const entryMap = new Map([...indexById(remote.entries), ...indexById(local.entries)]);
  const entries = [...entryMap.values()]
    .filter((e) => !goneEntries.has(e.id))
    .sort((a, b) => timeOf(a.at) - timeOf(b.at));

  const localGoals = indexById(local.goals);
  const remoteGoals = indexById(remote.goals);
  const goalIds = unionIds([...localGoals.keys()], [...remoteGoals.keys()]);
  const goals = goalIds
    .filter((id) => !goneGoals.has(id))
    .map((id) => pickNewer(localGoals.get(id), remoteGoals.get(id)))
    .sort((a, b) => timeOf(a.createdAt) - timeOf(b.createdAt));

  const currency =
    timeOf(remote.currencyAt) > timeOf(local.currencyAt) ? remote.currency : local.currency;

  return {
    ...local,
    currency: currency ?? local.currency,
    currencyAt: timeOf(remote.currencyAt) > timeOf(local.currencyAt)
      ? remote.currencyAt
      : local.currencyAt,
    goals,
    entries,
    deleted,
  };
}

/** Silinen kimliği tombstone listesine ekler. */
export function markDeleted(deleted, kind, id) {
  const base = {
    entries: [...(deleted?.entries ?? [])],
    goals: [...(deleted?.goals ?? [])],
  };
  if (typeof id === 'string' && id && !base[kind].includes(id)) base[kind].push(id);
  return base;
}

/** Uzak sunucuya gönderilecek kısım — cihaza özel alanlar dışarıda kalır. */
export function shareable(state) {
  return {
    currency: state?.currency,
    currencyAt: state?.currencyAt ?? null,
    goals: state?.goals ?? [],
    entries: state?.entries ?? [],
    deleted: state?.deleted ?? emptyDeleted(),
  };
}
