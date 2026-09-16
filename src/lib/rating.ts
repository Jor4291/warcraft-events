import type { LadderMatch, LadderPlayer } from "./types";

const START = 1500;
const K = 24;

function expected(a: number, b: number) {
  return 1 / (1 + 10 ** ((b - a) / 400));
}

export function recomputeLadder(matches: LadderMatch[]): LadderPlayer[] {
  const confirmed = matches
    .filter((match) => match.confirmed)
    .slice()
    .sort((a, b) => a.timestamp - b.timestamp || a.matchId.localeCompare(b.matchId));

  const byName = new Map<string, LadderPlayer>();

  const ensure = (name: string, className = "", spec = "", race = "", guild = "") => {
    const key = name;
    const existing = byName.get(key);
    if (existing) {
      if (!existing.className && className) existing.className = className;
      if (!existing.spec && spec) existing.spec = spec;
      if (!existing.race && race) existing.race = race;
      if (!existing.guild && guild) existing.guild = guild;
      return existing;
    }
    const created: LadderPlayer = {
      name,
      className,
      spec,
      race,
      guild,
      points: START,
      peak: START,
      wins: 0,
      losses: 0,
      games: 0,
    };
    byName.set(key, created);
    return created;
  };

  for (const match of confirmed) {
    const winner = ensure(match.winner, match.winnerClass, match.winnerSpec);
    const loser = ensure(match.loser, match.loserClass, match.loserSpec);
    const p = expected(winner.points, loser.points);
    const delta = K * (1 - p);
    winner.points += delta;
    loser.points -= delta;
    winner.peak = Math.max(winner.peak, winner.points);
    winner.wins += 1;
    loser.losses += 1;
    winner.games += 1;
    loser.games += 1;
  }

  return [...byName.values()].sort((a, b) => b.points - a.points || b.wins - a.wins);
}

export function applyPlayerIdentity(
  players: LadderPlayer[],
  identities: Array<{ name: string; className?: string; spec?: string; race?: string; guild?: string }>,
) {
  const byName = new Map(players.map((player) => [player.name.toLowerCase(), player]));
  for (const identity of identities) {
    const dest = byName.get(identity.name.toLowerCase());
    if (!dest) {
      continue;
    }
    if (identity.className) dest.className = identity.className;
    if (identity.spec) dest.spec = identity.spec;
    if (identity.race) dest.race = identity.race;
    if (identity.guild) dest.guild = identity.guild;
  }
}

export function shouldConfirm(reports: { reporter: string; hub: boolean }[]) {
  if (reports.some((report) => report.hub)) {
    return true;
  }
  const unique = new Set(reports.map((report) => report.reporter.toLowerCase()));
  return unique.size >= 2;
}
