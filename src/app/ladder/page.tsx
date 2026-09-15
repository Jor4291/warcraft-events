import Link from "next/link";
import { getStore } from "@/lib/store";

export const metadata = { title: "Forever ladder" };

export default async function LadderPage() {
  const store = await getStore();
  const pending = store.matches.filter((match) => !match.confirmed).length;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--gold)]">
            WoW:Forever Arena Ranked Duels
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Official board is recomputed here from confirmed <code>matchId</code> uploads. A match
            counts when two different reporters send it, or when the Arena Master hub reports it.
          </p>
        </div>
        <Link
          href="/ladder/upload"
          className="rounded border border-[var(--gold)] px-4 py-2 text-sm no-underline hover:bg-[var(--gold)] hover:text-[#1a120c]"
        >
          Upload ARDU1
        </Link>
      </div>
      <p className="mb-4 text-sm text-[var(--muted)]">
        {store.matches.length} stored matches · {pending} pending confirmation · {store.players.length} players
      </p>
      <div className="overflow-x-auto rounded-lg border border-[var(--line)]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-[#1b140f] text-[var(--gold)]">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Spec</th>
              <th className="px-4 py-3">Record</th>
              <th className="px-4 py-3">Rating</th>
            </tr>
          </thead>
          <tbody>
            {store.players.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-[var(--muted)]" colSpan={5}>
                  No confirmed matches yet.
                </td>
              </tr>
            ) : (
              store.players.map((player, index) => (
                <tr key={player.name} className="border-t border-[var(--line)]">
                  <td className="px-4 py-2">{index + 1}</td>
                  <td className="px-4 py-2">{player.name}</td>
                  <td className="px-4 py-2 text-[var(--muted)]">
                    {player.spec || player.className || "—"}
                  </td>
                  <td className="px-4 py-2">
                    {player.wins}-{player.losses}
                  </td>
                  <td className="px-4 py-2 text-[var(--gold)]">{player.points.toFixed(0)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
