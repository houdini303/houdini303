// Deterministická barva linky — musí sedět s proxy/src/normalize.ts (lineColor),
// aby byl vůz stejně barevný na mapě i v budoucích seznamech.
const GOLDEN = 137.508;

export function lineColor(line: string): string {
  const n = Number(line.replace(/\D/g, '')) || 0;
  const hue = Math.round((n * GOLDEN) % 360);
  return `hsl(${hue}, 70%, 55%)`;
}

// Barva podle zpoždění (hero hodnota) — zelená včas, oranžová/červená zpoždění.
export function delayColor(delaySec: number | null): string {
  if (delaySec == null) return 'var(--muted)';
  if (delaySec <= 60) return 'var(--ok)'; // do 1 min = včas
  if (delaySec <= 180) return 'var(--warn)'; // 1–3 min
  return 'var(--err)'; // 3+ min
}
