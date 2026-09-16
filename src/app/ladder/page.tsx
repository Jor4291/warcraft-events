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
            Official WoW:Forever Arena Ranked Duels board. A fight counts when both players send it, or when
            the Arena Master reports it.{" "}
            <Link href="/ladder/setup">How to send your duels</Link>.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/ladder/setup" className="tavern-btn no-underline">
            How to send duels
          </Link>
          <Link href="/ladder/upload" className="tavern-btn-ghost no-underline">
            Paste a log
          </Link>
        </div>
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
