import { applyWinner, buildSingleElim } from "./brackets";
import type { EventRecord, EventSignup, StoreData } from "./types";

function daysFromNow(days: number, hour = 18) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function event(
  partial: Omit<EventRecord, "createdAt" | "status" | "rounds" | "kind" | "ownerId" | "signupMode" | "inviteCode" | "signups" | "cancelledAt"> & {
    status?: EventRecord["status"];
    kind?: EventRecord["kind"];
    ownerId?: string;
    signupMode?: EventRecord["signupMode"];
    inviteCode?: string;
    signups?: EventSignup[];
  },
): EventRecord {
  return {
    ...partial,
    status: partial.status ?? "published",
    kind: partial.kind ?? "calendar",
    ownerId: partial.ownerId ?? "",
    signupMode: partial.signupMode ?? "open",
    inviteCode: partial.inviteCode ?? "SEEDOPEN",
    signups: partial.signups ?? [],
    cancelledAt: "",
    rounds: buildSingleElim(partial.teams),
    createdAt: new Date().toISOString(),
  };
}

function signup(id: string, name: string): EventSignup {
  return { id, name, userId: "", createdAt: new Date().toISOString() };
}

function inProgressPickup(record: EventRecord, winners: Array<[string, string]>) {
  let rounds = record.rounds;
  for (const [matchId, winner] of winners) {
    rounds = applyWinner(rounds, matchId, winner);
  }
  return { ...record, rounds };
}

export function placeholderEvents(): EventRecord[] {
  const pickup = inProgressPickup(
    event({
      id: "seed-goldshire-pickup",
      slug: "goldshire-pickup-bracket",
      title: "Goldshire Pickup Bracket",
      game: "WoW:Forever",
      format: "Single elimination",
      startsAt: daysFromNow(0, 21),
      endsAt: "",
      region: "NA",
      location: "Goldshire yard",
      description: "Standalone bracket — not listed on the calendar.",
      contact: "Sgtpepper",
      editKey: "seed-pickup-key",
      kind: "bracket",
      whiteboard: "First to tap the well. Loser buys the next round.",
      teams: ["Sgtpepper", "Testytestydu", "Dueltest", "Testduel", "Roktar", "Mira", "Bren", "Syla"],
    }),
    [
      ["r1-m1", "Sgtpepper"],
      ["r1-m2", "Testduel"],
      ["r1-m3", "Mira"],
    ],
  );

  return [
    event({
      id: "seed-forever-cup",
      slug: "forever-arena-cup",
      title: "WoW:Forever Arena Cup",
      game: "WoW:Forever",
      format: "1v1 single elimination",
      startsAt: daysFromNow(7, 19),
      endsAt: daysFromNow(7, 23),
      region: "NA",
      location: "Goldshire, the Lion's Pride Inn",
      description:
        "Season kickoff for Arena Ranked Duels. Bring the addon, plant your flag, and climb the tavern board.",
      contact: "Sgtpepper",
      editKey: "seed-edit-key",
      whiteboard: "Bo3 finals. Addon required for rated. Hub: Sgtpepper. Losers buy the next round.",
      teams: [
        "Sgtpepper",
        "Testytestydu",
        "Dueltest",
        "Testduel",
        "Duelytest",
        "Dueltester",
        "Ironforge Kid",
        "Stormwind Blade",
      ],
      signups: [
        signup("seed-cup-s1", "Sgtpepper"),
        signup("seed-cup-s2", "Testytestydu"),
        signup("seed-cup-s3", "Dueltest"),
        signup("seed-cup-s4", "Testduel"),
      ],
    }),
    event({
      id: "seed-brawl",
      slug: "thursday-tavern-brawl",
      title: "Thursday Tavern Brawl",
      game: "WoW:Forever",
      format: "Skirmish night",
      startsAt: daysFromNow(2, 20),
      endsAt: daysFromNow(2, 22),
      region: "NA",
      location: "Orgrimmar, The Broken Tusk",
      description: "Casual 1v1s, no rating required. Winner of the last bout names the next challenger.",
      contact: "Innkeeper",
      editKey: "seed-brawl-key",
      whiteboard: "House rules: no pets in the taproom.",
      teams: ["Roktar", "Mira", "Bren", "Syla"],
      signups: [signup("seed-brawl-s1", "Roktar"), signup("seed-brawl-s2", "Mira"), signup("seed-brawl-s3", "Bren")],
    }),
    event({
      id: "seed-weekend-raid",
      slug: "weekend-raid-night",
      title: "Weekend Raid Night",
      game: "WoW:Forever",
      format: "10-man raid",
      startsAt: daysFromNow(4, 20),
      endsAt: daysFromNow(4, 23),
      region: "NA",
      location: "Discord + in-game",
      description: "Progression night. Sign up on the parchment, bring consumables, be on time.",
      contact: "Raid lead",
      editKey: "seed-raid-key",
      whiteboard: "Invites 15 minutes before pull.",
      teams: [],
      signups: [
        signup("seed-raid-s1", "Sgtpepper"),
        signup("seed-raid-s2", "Aldric"),
        signup("seed-raid-s3", "Petra"),
        signup("seed-raid-s4", "Nils"),
        signup("seed-raid-s5", "Yara"),
      ],
    }),
    event({
      id: "seed-eu",
      slug: "eu-duel-gathering",
      title: "EU Duel Gathering",
      game: "WoW:Forever",
      format: "Open world duels",
      startsAt: daysFromNow(11, 15),
      endsAt: daysFromNow(11, 18),
      region: "EU",
      location: "Stormwind gates",
      description: "Afternoon gathering for EU realms. Rated if both players have the addon.",
      contact: "EU hosts",
      editKey: "seed-eu-key",
      whiteboard: "",
      teams: ["Aldric", "Petra", "Nils", "Yara", "Tomas", "Inga"],
      signups: [signup("seed-eu-s1", "Aldric"), signup("seed-eu-s2", "Petra")],
    }),
    pickup,
  ];
}

export const emptyStore = (): StoreData => ({
  events: placeholderEvents(),
  matches: [],
  players: [],
  users: [],
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

export function withPlaceholderEvents(data: StoreData): StoreData {
  const events = uniqueEvents(data.events);
  const ids = new Set(events.map((item) => item.id));
  const slugs = new Set(events.map((item) => item.slug));
  const extra = placeholderEvents().filter((item) => !ids.has(item.id) && !slugs.has(item.slug));
  if (extra.length === 0) {
    return events === data.events ? data : { ...data, events };
  }
  return { ...data, events: [...events, ...extra] };
}
