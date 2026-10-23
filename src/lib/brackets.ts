import type { BracketRound } from "./types";

function nextPowerOfTwo(value: number) {
  let size = 1;
  while (size < value) {
    size *= 2;
  }
  return Math.max(size, 2);
}

function standardSeedOrder(size: number) {
  let seeds = [1, 2];
  while (seeds.length < size) {
    const next: number[] = [];
    const sum = seeds.length * 2 + 1;
    for (const seed of seeds) {
      next.push(seed, sum - seed);
    }
    seeds = next;
  }
  return seeds;
}

function roundLabel(playersInRound: number) {
  if (playersInRound <= 2) {
    return "Grand Final";
  }
  if (playersInRound === 4) {
    return "Semifinals";
  }
  if (playersInRound === 8) {
    return "Quarterfinals";
  }
  return `Round of ${playersInRound}`;
}

function copyRounds(rounds: BracketRound[]): BracketRound[] {
  return rounds.map((round) => ({
    ...round,
    matches: round.matches.map((match) => ({ ...match })),
  }));
}

function parentOf(matchIndex: number) {
  return {
    slot: Math.floor(matchIndex / 2),
    side: (matchIndex % 2 === 0 ? "playerA" : "playerB") as "playerA" | "playerB",
  };
}

function writeForward(rounds: BracketRound[], roundIndex: number, matchIndex: number, name: string) {
  const parent = rounds[roundIndex + 1];
  if (!parent) {
    return;
  }
  const { slot, side } = parentOf(matchIndex);
  const match = parent.matches[slot];
  if (!match) {
    return;
  }
  match[side] = name;
  if (match.winner && match.winner !== match.playerA && match.winner !== match.playerB) {
    match.winner = "";
  }
  writeForward(rounds, roundIndex + 1, slot, match.winner);
}

export function shuffleNames(names: string[]) {
  const next = names.map((name) => name.trim()).filter(Boolean);
  for (let i = next.length - 1; i > 0; i -= 1) {
    const bytes = new Uint32Array(1);
    if (typeof globalThis.crypto?.getRandomValues === "function") {
      globalThis.crypto.getRandomValues(bytes);
    } else {
      bytes[0] = Math.floor(Math.random() * 0xffffffff);
    }
    const j = bytes[0] % (i + 1);
    const swap = next[i];
    next[i] = next[j];
    next[j] = swap;
  }
  return next;
}

export function buildSingleElim(teams: string[]): BracketRound[] {
  const named = teams.map((team) => team.trim()).filter(Boolean);
  if (named.length < 2) {
    return [];
  }
  const size = nextPowerOfTwo(named.length);
  const order = standardSeedOrder(size);
  const seeded = order.map((seed) => named[seed - 1] || "");

  const rounds: BracketRound[] = [];
  let players = seeded;
  let round = 1;
  while (players.length > 1) {
    const matches = [];
    const next: string[] = [];
    for (let i = 0; i < players.length; i += 2) {
      const playerA = players[i] || "";
      const playerB = players[i + 1] || "";
      let winner = "";
      // Only first-round empty slots are real byes. Later empties are waiting on a prior match.
      if (round === 1 && playerA && !playerB) {
        winner = playerA;
      } else if (round === 1 && playerB && !playerA) {
        winner = playerB;
      }
      matches.push({
        id: `r${round}-m${i / 2 + 1}`,
        playerA,
        playerB,
        winner,
      });
      next.push(winner);
    }
    rounds.push({ name: roundLabel(players.length), matches });
    players = next;
    round += 1;
  }
  return rounds;
}

export function repairRounds(rounds: BracketRound[]): BracketRound[] {
  if (!Array.isArray(rounds) || rounds.length === 0) {
    return Array.isArray(rounds) ? rounds : [];
  }
  const next = copyRounds(rounds);
  for (let r = 1; r < next.length; r += 1) {
    for (let i = 0; i < next[r].matches.length; i += 1) {
      const match = next[r].matches[i];
      if (!match.playerA || !match.playerB) {
        match.winner = "";
      }
      if (match.winner && match.winner !== match.playerA && match.winner !== match.playerB) {
        match.winner = "";
      }
      writeForward(next, r, i, match.winner);
    }
  }
  return next;
}

export function applyWinner(rounds: BracketRound[], matchId: string, winner: string) {
  const next = repairRounds(copyRounds(rounds));

  for (let r = 0; r < next.length; r += 1) {
    const matchIndex = next[r].matches.findIndex((match) => match.id === matchId);
    if (matchIndex === -1) {
      continue;
    }
    const match = next[r].matches[matchIndex];
    if (winner !== match.playerA && winner !== match.playerB) {
      return next;
    }
    const bye = Boolean(match.playerA) !== Boolean(match.playerB);
    const chosen = !bye && match.winner === winner ? "" : winner;
    match.winner = chosen;
    writeForward(next, r, matchIndex, chosen);
    break;
  }
  return next;
}
