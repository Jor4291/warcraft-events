import { canonicalPlayerName, canonicalizeMatchId, characterName, namesEqual } from "./player-name";
import type { LadderMatch, LadderPlayer, StoreData } from "./types";

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
    const key = canonicalPlayerName(name);
    if (!key) {
      return null;
    }
    const existing = byName.get(key);
    if (existing) {
      if (!existing.className && className) existing.className = className;
      if (!existing.spec && spec) existing.spec = spec;
      if (!existing.race && race) existing.race = race;
      if (!existing.guild && guild) existing.guild = guild;
      return existing;
    }
    const created: LadderPlayer = {
      name: characterName(name),
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
    if (namesEqual(match.winner, match.loser)) {
      continue;
    }
    const winner = ensure(match.winner, match.winnerClass, match.winnerSpec);
    const loser = ensure(match.loser, match.loserClass, match.loserSpec);
    if (!winner || !loser) {
      continue;
    }
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
  const byName = new Map(players.map((player) => [canonicalPlayerName(player.name), player]));
  for (const identity of identities) {
    const dest = byName.get(canonicalPlayerName(identity.name));
    if (!dest) {
      continue;
    }
    if (identity.className) dest.className = identity.className;
    if (identity.spec) dest.spec = identity.spec;
    if (identity.race) dest.race = identity.race;
    if (identity.guild) dest.guild = identity.guild;
  }
}

export function uniqueReporterCount(reports: { reporter: string }[]) {
  return new Set(reports.map((report) => canonicalPlayerName(report.reporter) || report.reporter.toLowerCase())).size;
}

export function shouldConfirm(reports: { reporter: string; hub: boolean }[]) {
  if (reports.some((report) => report.hub)) {
    return true;
  }
  return uniqueReporterCount(reports) >= 2;
}

export function awaitingInnkeeper(match: Pick<LadderMatch, "confirmed" | "deniedAt" | "reports">) {
  return !match.confirmed && !match.deniedAt && uniqueReporterCount(match.reports) < 2 && !match.reports.some((report) => report.hub);
}

function mergeReports(into: { reporter: string; hub: boolean; exportedAt: number }[], extra: { reporter: string; hub: boolean; exportedAt: number }[]) {
  for (const report of extra) {
    const reporter = characterName(report.reporter) || report.reporter;
    const already = into.some((item) => namesEqual(item.reporter, reporter));
    if (!already) {
      into.push({ ...report, reporter });
    }
  }
}

export function mergeLadderMatches(matches: LadderMatch[]): LadderMatch[] {
  const byId = new Map<string, LadderMatch>();
  for (const match of matches) {
    const winner = characterName(match.winner) || match.winner;
    const loser = characterName(match.loser) || match.loser;
    const matchId = canonicalizeMatchId(match.matchId);
    const reports = match.reports.map((report) => ({
      ...report,
      reporter: characterName(report.reporter) || report.reporter,
    }));
    const existing = byId.get(matchId);
    const deniedAt = existing?.deniedAt || match.deniedAt || "";
    if (!existing) {
      const reportsReady = reports;
      const confirmed = shouldConfirm(reportsReady);
      byId.set(matchId, {
        ...match,
        matchId,
        winner,
        loser,
        reports: reportsReady,
        confirmed,
        deniedAt: confirmed ? "" : deniedAt,
      });
      continue;
    }
    mergeReports(existing.reports, reports);
    existing.confirmed = shouldConfirm(existing.reports);
    existing.deniedAt = existing.confirmed ? "" : existing.deniedAt || deniedAt;
    if (!existing.winnerClass && match.winnerClass) existing.winnerClass = match.winnerClass;
    if (!existing.loserClass && match.loserClass) existing.loserClass = match.loserClass;
    if (!existing.winnerSpec && match.winnerSpec) existing.winnerSpec = match.winnerSpec;
    if (!existing.loserSpec && match.loserSpec) existing.loserSpec = match.loserSpec;
    if (match.timestamp && (!existing.timestamp || match.timestamp < existing.timestamp)) {
      existing.timestamp = match.timestamp;
    }
  }
  return [...byId.values()].sort((a, b) => a.timestamp - b.timestamp || a.matchId.localeCompare(b.matchId));
}

export function normalizeLadderIdentities(data: StoreData): StoreData {
  const matches = mergeLadderMatches(data.matches);
  const players = recomputeLadder(matches);
  applyPlayerIdentity(players, data.players);
  return { ...data, matches, players };
}

export function ladderIdentitiesChanged(before: StoreData, after: StoreData) {
  if (before.players.length !== after.players.length || before.matches.length !== after.matches.length) {
    return true;
  }
  const beforeKeys = before.players.map((player) => player.name).sort().join("\n");
  const afterKeys = after.players.map((player) => player.name).sort().join("\n");
  if (beforeKeys !== afterKeys) {
    return true;
  }
  const beforeIds = before.matches.map((match) => match.matchId).sort().join("\n");
  const afterIds = after.matches.map((match) => match.matchId).sort().join("\n");
  return beforeIds !== afterIds;
}
