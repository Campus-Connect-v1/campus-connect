/**
 * How a position is aged on the map.
 *
 * A location with no decay lies: someone who was on campus at 9am is not still
 * there at 6pm, and a map that draws them identically either way teaches people
 * to distrust all of it. Markers fade as they age and drop off entirely past a
 * day, which is also roughly how long a location stays useful.
 */
export const STALE_AFTER_MS = 15 * 60 * 1000;
export const DROP_AFTER_MS = 24 * 60 * 60 * 1000;

export function ageOf(lastSeen?: string | null): number {
  if (!lastSeen) return Number.POSITIVE_INFINITY;
  const at = new Date(lastSeen).getTime();
  return Number.isFinite(at) ? Date.now() - at : Number.POSITIVE_INFINITY;
}

/** "now", "12m", "3h", "2d" — the compact form the map labels use. */
export function since(lastSeen?: string | null): string | null {
  const age = ageOf(lastSeen);
  if (!Number.isFinite(age)) return null;

  const minutes = Math.round(age / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

/**
 * Marker opacity for a given age: solid while fresh, down to 0.45 at a day old.
 * Floored rather than fading to nothing, because an invisible marker that still
 * accepts taps is worse than a faint one.
 */
export function freshnessOpacity(lastSeen?: string | null): number {
  const age = ageOf(lastSeen);
  if (!Number.isFinite(age)) return 0.45;
  if (age <= STALE_AFTER_MS) return 1;

  const span = DROP_AFTER_MS - STALE_AFTER_MS;
  const decayed = 1 - (age - STALE_AFTER_MS) / span;
  return Math.max(0.45, Math.min(1, decayed));
}

export function isTooOld(lastSeen?: string | null): boolean {
  return ageOf(lastSeen) > DROP_AFTER_MS;
}

/** Halo radius in metres for a coarse position. */
export const PRECISION_RADIUS: Record<string, number> = {
  exact: 0,
  area: 400,
  city: 3000,
};
