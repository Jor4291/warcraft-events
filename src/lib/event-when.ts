export const TAVERN_TZ = "America/Chicago";

const NAIVE_LOCAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/;

function tzOffsetMs(utcMs: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value || "0");
  const asUtc = Date.UTC(read("year"), read("month") - 1, read("day"), read("hour"), read("minute"), read("second"));
  return asUtc - utcMs;
}

function wallTimeMs(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
) {
  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  let utc = wallAsUtc;
  for (let i = 0; i < 2; i += 1) {
    utc = wallAsUtc - tzOffsetMs(utc, timeZone);
  }
  return utc;
}

export function eventStartMs(iso: string) {
  if (!iso) {
    return Number.NaN;
  }
  const naive = iso.match(NAIVE_LOCAL);
  if (naive) {
    return wallTimeMs(
      Number(naive[1]),
      Number(naive[2]),
      Number(naive[3]),
      Number(naive[4]),
      Number(naive[5]),
      Number(naive[6] || 0),
      TAVERN_TZ,
    );
  }
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? Number.NaN : ms;
}

export function calendarDay(value: string | number | Date, timeZone = TAVERN_TZ) {
  const ms =
    typeof value === "number" ? value : value instanceof Date ? value.getTime() : eventStartMs(value);
  if (Number.isNaN(ms)) {
    return "";
  }
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
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

export function formatEventWhen(
  iso: string,
  options: Intl.DateTimeFormatOptions = {},
  timeZone = TAVERN_TZ,
) {
  if (!iso) {
    return "TBA";
  }
  const ms = eventStartMs(iso);
  if (Number.isNaN(ms)) {
    return iso;
  }
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    ...options,
  });
}

export function toDatetimeLocalValue(iso: string) {
  if (!iso) {
    return "";
  }
  const naive = iso.match(NAIVE_LOCAL);
  if (naive) {
    return `${naive[1]}-${naive[2]}-${naive[3]}T${naive[4]}:${naive[5]}`;
  }
  const ms = eventStartMs(iso);
  if (Number.isNaN(ms)) {
    return iso.length >= 16 ? iso.slice(0, 16) : iso;
  }
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TAVERN_TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(ms));
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "00";
  return `${read("year")}-${read("month")}-${read("day")}T${read("hour")}:${read("minute")}`;
}
