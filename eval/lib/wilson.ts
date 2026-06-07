export function wilsonScoreLowerBound(passes: number, total: number, z = 1.96): number {
  if (total === 0) {
    return 0;
  }

  const phat = passes / total;
  const z2 = z * z;
  const denominator = 1 + z2 / total;
  const center = phat + z2 / (2 * total);
  const margin = z * Math.sqrt((phat * (1 - phat) + z2 / (4 * total)) / total);

  return Math.max(0, (center - margin) / denominator);
}

export function passesWilsonGate(
  passes: number,
  total: number,
  floor: number
): boolean {
  return wilsonScoreLowerBound(passes, total) >= floor;
}
