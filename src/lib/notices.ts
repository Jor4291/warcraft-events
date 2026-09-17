import type { EventRecord, EventSignup, PlayerNotice, PlayerNoticeKind, UserRecord } from "./types";

const NOTICE_CAP = 40;
const SOON_MS = 24 * 60 * 60 * 1000;
const STORED_KINDS: PlayerNoticeKind[] = ["signup", "waitlist", "promoted", "cancelled", "removed"];

export type PlayerNight = {
  eventId: string;
  slug: string;
  title: string;
  startsAt: string;
  waitlisted: boolean;
  checkedIn: boolean;
  cancelled: boolean;
};

export type PlayerInbox = {
  unread: number;
  notices: PlayerNotice[];
  nights: PlayerNight[];
};

export function emptyInbox(): PlayerInbox {
  return { unread: 0, notices: [], nights: [] };
}

export function normalizeNotice(raw: unknown): PlayerNotice | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const row = raw as Partial<PlayerNotice>;
  const kind = STORED_KINDS.includes(row.kind as PlayerNoticeKind) ? (row.kind as PlayerNoticeKind) : null;
  const eventSlug = String(row.eventSlug || "").trim();
  if (!kind || !eventSlug) {
    return null;
  }
  return {
    id: String(row.id || "").trim() || `notice-${eventSlug}`,
    kind,
    eventId: String(row.eventId || "").trim(),
    eventSlug,
    eventTitle: String(row.eventTitle || "").trim() || "Event",
    createdAt: String(row.createdAt || "").trim() || new Date().toISOString(),
    readAt: String(row.readAt || "").trim(),
  };
}

export function normalizeSeenSoonIds(raw: unknown) {
  if (!Array.isArray(raw)) {
    return [];
  }
  const ids: string[] = [];
  for (const value of raw) {
    const id = String(value || "").trim();
    if (id && !ids.includes(id)) {
      ids.push(id);
    }
  }
  return ids.slice(0, 80);
}

export function makeNotice(kind: Exclude<PlayerNoticeKind, "starts_soon">, event: Pick<EventRecord, "id" | "slug" | "title">): PlayerNotice {
  return {
    id: globalThis.crypto.randomUUID(),
    kind,
    eventId: event.id,
    eventSlug: event.slug,
    eventTitle: event.title,
    createdAt: new Date().toISOString(),
    readAt: "",
  };
}

export function pushNotice(users: UserRecord[], userId: string, notice: PlayerNotice) {
  if (!userId) {
    return;
  }
  const user = users.find((item) => item.id === userId);
  if (!user) {
    return;
  }
  user.notifications = [notice, ...user.notifications.filter((item) => item.id !== notice.id)].slice(0, NOTICE_CAP);
}

export function signupForUser(event: Pick<EventRecord, "signups">, userId: string): EventSignup | undefined {
  if (!userId) {
    return undefined;
  }
  return event.signups.find((signup) => signup.userId === userId);
}

export function waitlistPlace(event: Pick<EventRecord, "signups">, signupId: string) {
  const waiting = event.signups.filter((signup) => signup.waitlisted);
  const index = waiting.findIndex((signup) => signup.id === signupId);
  return index === -1 ? 0 : index + 1;
}

export function nightsForUser(userId: string, events: EventRecord[]): PlayerNight[] {
  if (!userId) {
    return [];
  }
  const nights: PlayerNight[] = [];
  for (const event of events) {
    if (event.kind !== "calendar" || event.status !== "published") {
      continue;
    }
    const signup = signupForUser(event, userId);
    if (!signup) {
      continue;
    }
    nights.push({
      eventId: event.id,
      slug: event.slug,
      title: event.title,
      startsAt: event.startsAt,
      waitlisted: signup.waitlisted,
      checkedIn: signup.checkedIn,
      cancelled: Boolean(event.cancelledAt),
    });
  }
  return nights.sort((a, b) => {
    if (a.cancelled !== b.cancelled) {
      return a.cancelled ? 1 : -1;
    }
    return (a.startsAt || "").localeCompare(b.startsAt || "");
  });
}

export function soonNightIds(nights: PlayerNight[]) {
  return nights.filter((night) => !night.cancelled && !night.waitlisted && startsSoon(night.startsAt)).map((night) => night.eventId);
}

export function playerInbox(user: UserRecord, events: EventRecord[]): PlayerInbox {
  const nights = nightsForUser(user.id, events);
  const soonIds = soonNightIds(nights);
  const soon = nights
    .filter((night) => soonIds.includes(night.eventId))
    .map((night) => {
      const seen = user.seenSoonIds.includes(night.eventId);
      return {
        id: `soon-${night.eventId}`,
        kind: "starts_soon" as const,
        eventId: night.eventId,
        eventSlug: night.slug,
        eventTitle: night.title,
        createdAt: night.startsAt,
        readAt: seen ? new Date().toISOString() : "",
      };
    });
  const notices = [...soon, ...user.notifications];
  return {
    unread: notices.filter((notice) => !notice.readAt).length,
    notices: notices.slice(0, 12),
    nights,
  };
}

export function noticeCopy(notice: PlayerNotice) {
  switch (notice.kind) {
    case "signup":
      return `You're on the list for ${notice.eventTitle}.`;
    case "waitlist":
      return `You're on the waitlist for ${notice.eventTitle}.`;
    case "promoted":
      return `You got a seat at ${notice.eventTitle}.`;
    case "cancelled":
      return `${notice.eventTitle} was cancelled.`;
    case "removed":
      return `You were removed from ${notice.eventTitle}.`;
    case "starts_soon":
      return `${notice.eventTitle} starts tonight.`;
    default:
      return notice.eventTitle;
  }
}

function startsSoon(iso: string) {
  if (!iso) {
    return false;
  }
  const start = new Date(iso).getTime();
  if (!Number.isFinite(start)) {
    return false;
  }
  const delta = start - Date.now();
  return delta > 0 && delta <= SOON_MS;
}
