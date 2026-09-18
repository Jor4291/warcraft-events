import type { EventRecord, StoreData } from "./types";

const KEEP_SEED_IDS = new Set(["seed-brawl"]);

const DEMO_SLUGS = new Set([
  "notice-bell-test-53f18b",
  "wow-forever-arena-cup-copy-06c34f",
  "yard-1v1s-aa4e35",
  "impromptu-bracket-50b4c4",
  "impromptu-bracket-c74945",
  "goldshire-invite-night-0cfeed",
]);

export function isPlaceholderEvent(event: EventRecord) {
  if (KEEP_SEED_IDS.has(event.id)) {
    return false;
  }
  if (event.id.startsWith("seed-")) {
    return true;
  }
  return DEMO_SLUGS.has(event.slug);
}

export const emptyStore = (): StoreData => ({
  events: [],
  matches: [],
  players: [],
  users: [],
  threads: [],
});

export function uniqueEvents(events: EventRecord[]): EventRecord[] {
  const byId = new Map<string, EventRecord>();
  for (const event of events) {
    if (!event.id || byId.has(event.id)) {
      continue;
    }
    byId.set(event.id, event);
  }
  const bySlug = new Map<string, EventRecord>();
  for (const event of byId.values()) {
    if (!event.slug || bySlug.has(event.slug)) {
      continue;
    }
    bySlug.set(event.slug, event);
  }
  return [...bySlug.values()];
}

export function withoutPlaceholderEvents(data: StoreData): StoreData {
  const events = uniqueEvents(data.events).filter((event) => !isPlaceholderEvent(event));
  const keepSlugs = new Set(events.map((event) => event.slug));
  const threads = data.threads.filter((thread) => !thread.eventSlug || keepSlugs.has(thread.eventSlug));
  if (events.length === data.events.length && threads.length === data.threads.length) {
    return events === data.events && threads === data.threads ? data : { ...data, events, threads };
  }
  return { ...data, events, threads };
}
