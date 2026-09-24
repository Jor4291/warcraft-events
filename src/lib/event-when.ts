export function eventStartMs(iso: string) {
  if (!iso) {
    return Number.NaN;
  }
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? Number.NaN : ms;
}

export function isUpcomingStart(iso: string, now = Date.now()) {
  const ms = eventStartMs(iso);
  return Number.isNaN(ms) || ms >= now;
}

export function compareByNextStart(
  a: { startsAt: string },
  b: { startsAt: string },
  now = Date.now(),
) {
  const aMs = eventStartMs(a.startsAt);
  const bMs = eventStartMs(b.startsAt);
  const aUpcoming = Number.isNaN(aMs) || aMs >= now;
  const bUpcoming = Number.isNaN(bMs) || bMs >= now;
  if (aUpcoming !== bUpcoming) {
    return aUpcoming ? -1 : 1;
  }
  if (Number.isNaN(aMs) !== Number.isNaN(bMs)) {
    return Number.isNaN(aMs) ? 1 : -1;
  }
  if (!Number.isNaN(aMs) && aMs !== bMs) {
    return aUpcoming ? aMs - bMs : bMs - aMs;
  }
  return 0;
}
