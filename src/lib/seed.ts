import type { StoreData } from "./types";

export const emptyStore = (): StoreData => ({
  events: [
    {
      id: "seed-forever-cup",
      slug: "forever-arena-cup",
      title: "WoW:Forever Arena Cup",
      game: "WoW:Forever",
      format: "1v1 rated duels",
      startsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      endsAt: new Date(Date.now() + 8 * 86400000).toISOString(),
      region: "NA",
      location: "Open world / duel flag",
      description:
        "Season kickoff for Arena Ranked Duels. Bring the addon, queue rated, and climb the WarcraftEvents ladder.",
      contact: "Sgtpepper",
      status: "published",
      editKey: "seed-edit-key",
      whiteboard: "Bo3 finals. Addon required for rated. Hub: Sgtpepper.",
      teams: ["Sgtpepper", "Challenger A", "Challenger B", "Challenger C"],
      rounds: [],
      createdAt: new Date().toISOString(),
    },
  ],
  matches: [],
  players: [],
});
