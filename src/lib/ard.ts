import { recomputeLadder, shouldConfirm } from "./rating";
import { updateStore } from "./store";
import type { LadderMatch, MatchReport } from "./types";

type IncomingMatch = {
  matchId?: string;
  timestamp?: number;
  winner?: string;
  loser?: string;
  winnerClass?: string;
  winnerSpec?: string;
  loserClass?: string;
  loserSpec?: string;
  bracket?: string;
  seasonId?: number;
  winnerDelta?: number;
  loserDelta?: number;
  expectedWinner?: number;
};

type IncomingPayload = {
  format?: string;
  reporter?: string;
  reporterIsHub?: boolean;
  exportedAt?: number;
  matches?: IncomingMatch[];
};

function asMatch(raw: IncomingMatch): Omit<LadderMatch, "confirmed" | "reports"> | null {
  if (!raw.matchId || !raw.winner || !raw.loser) {
    return null;
  }
  return {
    matchId: String(raw.matchId),
    timestamp: Number(raw.timestamp) || 0,
    winner: String(raw.winner),
    loser: String(raw.loser),
    winnerClass: String(raw.winnerClass || ""),
    winnerSpec: String(raw.winnerSpec || ""),
    loserClass: String(raw.loserClass || ""),
    loserSpec: String(raw.loserSpec || ""),
    bracket: String(raw.bracket || "unknown"),
    seasonId: Number(raw.seasonId) || 1,
    winnerDelta: Number(raw.winnerDelta) || 0,
    loserDelta: Number(raw.loserDelta) || 0,
    expectedWinner: Number(raw.expectedWinner) || 0.5,
  };
}

export async function ingestArdu1(body: unknown) {
  const payload = body as IncomingPayload;
  if (!payload || payload.format !== "ARDU1" || !Array.isArray(payload.matches)) {
    throw new Error("Expected ARDU1 JSON with a matches array.");
  }

  const reporter = String(payload.reporter || "unknown");
  const hub = Boolean(payload.reporterIsHub);
  const exportedAt = Number(payload.exportedAt) || Math.floor(Date.now() / 1000);
  const report: MatchReport = { reporter, hub, exportedAt };

  let inserted = 0;
  let merged = 0;
  let confirmed = 0;

  const store = await updateStore((data) => {
    for (const raw of payload.matches || []) {
      const incoming = asMatch(raw);
      if (!incoming) {
        continue;
      }
      const existing = data.matches.find((match) => match.matchId === incoming.matchId);
      if (!existing) {
        const next: LadderMatch = {
          ...incoming,
          reports: [report],
          confirmed: shouldConfirm([report]),
        };
        data.matches.push(next);
        inserted += 1;
        if (next.confirmed) {
          confirmed += 1;
        }
        continue;
      }
      merged += 1;
      const already = existing.reports.some(
        (item) => item.reporter.toLowerCase() === reporter.toLowerCase(),
      );
      if (!already) {
        existing.reports.push(report);
      }
      existing.confirmed = shouldConfirm(existing.reports);
      if (existing.confirmed) {
        confirmed += 1;
      }
      if (!existing.winnerClass && incoming.winnerClass) {
        existing.winnerClass = incoming.winnerClass;
      }
      if (!existing.loserClass && incoming.loserClass) {
        existing.loserClass = incoming.loserClass;
      }
    }
    data.players = recomputeLadder(data.matches);
  });

  return {
    ok: true,
    reporter,
    inserted,
    merged,
    confirmedNow: confirmed,
    matchCount: store.matches.length,
    playerCount: store.players.length,
  };
}
