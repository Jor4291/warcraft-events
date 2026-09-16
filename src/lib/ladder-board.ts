import { classToken, formatClassName } from "./display";
import type { LadderMatch, LadderPlayer } from "./types";

export type GroupBy = "overall" | "class" | "race" | "guild";
export type SortKey = "rating" | "winRate" | "peak" | "name";

export type BoardRow = {
  key: string;
  kind: "player" | "group";
  name: string;
  className: string;
  race: string;
  guild: string;
  wins: number;
  losses: number;
  games: number;
  points: number;
  peak: number;
  winRate: number;
  memberCount?: number;
};

export type BoardMatch = Pick<
  LadderMatch,
  "matchId" | "timestamp" | "winner" | "loser" | "winnerClass" | "loserClass" | "winnerDelta" | "loserDelta"
>;

function winRate(wins: number, games: number) {
  return games > 0 ? wins / games : 0;
}

export function formatWinRate(rate: number, games: number) {
  if (games === 0) {
    return "—";
  }
  return `${(rate * 100).toFixed(1)}%`;
}

export function namesEqual(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function groupValue(player: LadderPlayer, groupBy: Exclude<GroupBy, "overall">) {
  if (groupBy === "class") {
    return formatClassName(player.className) || "Unknown";
  }
  if (groupBy === "race") {
    return player.race.trim() || "Unknown";
  }
  return player.guild.trim() || "(no guild)";
}

function sortRows(rows: BoardRow[], sort: SortKey) {
  rows.sort((a, b) => {
    if (sort === "name") {
      return a.name.localeCompare(b.name);
    }
    if (sort === "winRate" && a.winRate !== b.winRate) {
      return b.winRate - a.winRate;
    }
    if (sort === "peak" && a.peak !== b.peak) {
      return b.peak - a.peak;
    }
    if (sort === "rating" && a.points !== b.points) {
      return b.points - a.points;
    }
    if (a.winRate !== b.winRate) {
      return b.winRate - a.winRate;
    }
    if (a.wins !== b.wins) {
      return b.wins - a.wins;
    }
    if (a.games !== b.games) {
      return b.games - a.games;
    }
    return a.name.localeCompare(b.name);
  });
}

function playerRow(player: LadderPlayer): BoardRow {
  return {
    key: player.name,
    kind: "player",
    name: player.name,
    className: player.className,
    race: player.race,
    guild: player.guild,
    wins: player.wins,
    losses: player.losses,
    games: player.games,
    points: player.points,
    peak: player.peak,
    winRate: winRate(player.wins, player.games),
  };
}

export function classesOnBoard(players: LadderPlayer[]) {
  const counts = new Map<string, number>();
  for (const player of players) {
    const token = classToken(player.className);
    if (!token) {
      continue;
    }
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([token, count]) => ({ token, count }));
}

export function buildBoardRows(
  players: LadderPlayer[],
  options: { search: string; classFilter: string; groupBy: GroupBy; sort: SortKey },
) {
  const search = options.search.trim().toLowerCase();
  const classFilter = classToken(options.classFilter);
  let source = players;
  if (classFilter && options.groupBy === "overall") {
    source = source.filter((player) => classToken(player.className) === classFilter);
  }

  let rows: BoardRow[];
  if (options.groupBy === "overall") {
    rows = source.map(playerRow);
  } else {
    const buckets = new Map<string, BoardRow>();
    for (const player of source) {
      const name = groupValue(player, options.groupBy);
      const existing = buckets.get(name);
      if (!existing) {
        buckets.set(name, {
          key: `${options.groupBy}:${name}`,
          kind: "group",
          name,
          className: options.groupBy === "class" ? player.className : "",
          race: options.groupBy === "race" ? name : "",
          guild: options.groupBy === "guild" ? name : "",
          wins: player.wins,
          losses: player.losses,
          games: player.games,
          points: player.points,
          peak: player.peak,
          winRate: 0,
          memberCount: 1,
        });
        continue;
      }
      existing.wins += player.wins;
      existing.losses += player.losses;
      existing.games += player.games;
      existing.points += player.points;
      existing.peak = Math.max(existing.peak, player.peak);
      existing.memberCount = (existing.memberCount || 1) + 1;
    }
    rows = [...buckets.values()].map((row) => {
      const members = row.memberCount || 1;
      return {
        ...row,
        points: row.points / members,
        winRate: winRate(row.wins, row.games),
      };
    });
  }

  if (search) {
    rows = rows.filter((row) => {
      const hay = [row.name, row.className, row.race, row.guild].join(" ").toLowerCase();
      return hay.includes(search);
    });
  }

  sortRows(rows, options.sort);
  return rows;
}

export function matchesForPlayer(matches: BoardMatch[], name: string) {
  return matches
    .filter((match) => namesEqual(match.winner, name) || namesEqual(match.loser, name))
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp || a.matchId.localeCompare(b.matchId));
}

export function recentMatches(matches: BoardMatch[], limit = 20) {
  return matches
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp || a.matchId.localeCompare(b.matchId))
    .slice(0, limit);
}

export function playerForm(matches: BoardMatch[], name: string, length = 5) {
  const recent = matchesForPlayer(matches, name).slice(0, length);
  if (recent.length === 0) {
    return "—";
  }
  return recent
    .map((match) => (namesEqual(match.winner, name) ? "W" : "L"))
    .join("");
}

export function playerStreak(matches: BoardMatch[], name: string) {
  const recent = matchesForPlayer(matches, name);
  if (recent.length === 0) {
    return "—";
  }
  const firstWin = namesEqual(recent[0].winner, name);
  let count = 0;
  for (const match of recent) {
    const won = namesEqual(match.winner, name);
    if (won !== firstWin) {
      break;
    }
    count += 1;
  }
  return `${count}${firstWin ? "W" : "L"}`;
}

export function formatMatchTime(timestamp: number) {
  if (!timestamp) {
    return "";
  }
  const ms = timestamp < 1e12 ? timestamp * 1000 : timestamp;
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDelta(delta: number) {
  const rounded = delta.toFixed(1);
  if (delta > 0) {
    return `+${rounded}`;
  }
  return rounded;
}
