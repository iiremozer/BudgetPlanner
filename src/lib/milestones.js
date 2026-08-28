// Hedef tutarı olmayan kavanozlar için bir dolum ölçüsü gerekiyor.
// Bir sonraki yuvarlak eşiği hedef sayarız: kavanoz dolar, eşik geçilince
// bir üst basamağa geçer. Böylece açık uçlu birikimin de görünür bir ilerlemesi olur.

const STEPS = [
  25, 50, 100, 250, 500, 1000, 2500, 5000, 10000,
  25000, 50000, 100000, 250000, 500000, 1000000,
];

/** Verilen tutarın üstündeki ilk eşik, kuruş cinsinden. */
export function nextMilestone(minorUnits) {
  const amount = Number.isFinite(minorUnits) ? Math.max(0, minorUnits) : 0;
  for (const step of STEPS) {
    if (amount < step * 100) return step * 100;
  }
  return STEPS[STEPS.length - 1] * 100;
}

/** Açık uçlu kavanozun doluluk oranı ve hedeflediği eşik. */
export function milestoneProgress(minorUnits) {
  const saved = Number.isFinite(minorUnits) ? Math.max(0, minorUnits) : 0;
  const target = nextMilestone(saved);
  return {
    saved,
    target,
    remaining: Math.max(0, target - saved),
    ratio: target === 0 ? 0 : Math.min(1, saved / target),
  };
}
