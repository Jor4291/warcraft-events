import Link from "next/link";
import { LadderBoard } from "@/components/LadderBoard";
import { LadderSetupLinks } from "@/components/UploaderDownloadLink";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Arena Leaderboard" };

export default async function LadderPage() {
  const store = await getStore();
  const pending = store.matches.filter((match) => !match.confirmed).length;
  const matches = store.matches
    .filter((match) => match.confirmed)
    .map((match) => ({
      matchId: match.matchId,
      timestamp: match.timestamp,
      winner: match.winner,
      loser: match.loser,
      winnerClass: match.winnerClass,
      loserClass: match.loserClass,
      winnerDelta: match.winnerDelta,
      loserDelta: match.loserDelta,
    }));

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="tavern-title text-3xl">Arena Leaderboard</h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Official WoW:Forever Arena Ranked Duels board, recomputed from confirmed <code>matchId</code>{" "}
            logs. A match counts when two different reporters send it, or when the Arena Master hub reports it.
          </p>
        </div>
        <Link href="/ladder/upload" className="tavern-btn no-underline">
          Submit a duel log
        </Link>
      </div>
      <div className="mb-6">
        <LadderSetupLinks />
      </div>
      <LadderBoard
        players={store.players}
        matches={matches}
        storedMatches={store.matches.length}
        pending={pending}
      />
    </main>
  );
}
