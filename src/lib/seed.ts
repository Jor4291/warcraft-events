import { buildSingleElim } from "./brackets";
import type { EventRecord, StoreData } from "./types";

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
  },
): EventRecord {
  return {
    ...partial,
    status: partial.status ?? "published",
    kind: partial.kind ?? "calendar",
    ownerId: partial.ownerId ?? "",
    signupMode: partial.signupMode ?? "open",
    inviteCode: partial.inviteCode ?? "SEEDOPEN",
    signups: [],
    cancelledAt: "",
    rounds: buildSingleElim(partial.teams),
    createdAt: new Date().toISOString(),
  };
}

export const emptyStore = (): StoreData => ({
  events: [
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
    }),
    event({
      id: "seed-raid",
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
    }),
  ],
  matches: [],
  players: [],
  users: [],
});
