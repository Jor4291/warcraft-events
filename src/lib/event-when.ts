export const TAVERN_TZ = "America/Chicago";

export function calendarDay(value: string | number | Date, timeZone = TAVERN_TZ) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function startsTonight(iso: string, now = Date.now(), timeZone = TAVERN_TZ) {
  const start = eventStartMs(iso);
  if (Number.isNaN(start) || start <= now) {
    return false;
  }
  const today = calendarDay(now, timeZone);
  const night = calendarDay(iso, timeZone);
  return Boolean(today && night && today === night);
}

export function soonSeenKey(eventId: string, startsAt: string, timeZone = TAVERN_TZ) {
  const day = calendarDay(startsAt, timeZone);
  return day ? `${eventId}:${day}` : eventId;
}

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
