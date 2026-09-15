import type { BracketRound } from "./types";

function nextPowerOfTwo(value: number) {
  let size = 1;
  while (size < value) {
    size *= 2;
  }
  return Math.max(size, 2);
}

export function buildSingleElim(teams: string[]): BracketRound[] {
  const named = teams.map((team) => team.trim()).filter(Boolean);
  if (named.length < 2) {
    return [];
  }
  const size = nextPowerOfTwo(named.length);
  const seeded = named.slice();
  while (seeded.length < size) {
    seeded.push("");
  }

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
      if (playerA && !playerB) {
        winner = playerA;
      } else if (playerB && !playerA) {
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
    const name =
      players.length === 2 ? "Final" : players.length === 4 ? "Semifinals" : `Round ${round}`;
    rounds.push({ name, matches });
    players = next;
    round += 1;
  }
  return rounds;
}

export function applyWinner(rounds: BracketRound[], matchId: string, winner: string) {
  const next = rounds.map((round) => ({
    ...round,
    matches: round.matches.map((match) => ({ ...match })),
  }));

  for (let r = 0; r < next.length; r += 1) {
    const matchIndex = next[r].matches.findIndex((match) => match.id === matchId);
    if (matchIndex === -1) {
      continue;
    }
    next[r].matches[matchIndex].winner = winner;
    const parent = next[r + 1];
    if (parent) {
      const slot = Math.floor(matchIndex / 2);
      const side = matchIndex % 2 === 0 ? "playerA" : "playerB";
      parent.matches[slot][side] = winner;
      if (parent.matches[slot].winner && parent.matches[slot].winner !== winner) {
        parent.matches[slot].winner = "";
      }
    }
    break;
  }
  return next;
}
