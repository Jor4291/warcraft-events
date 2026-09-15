import Link from "next/link";
import { getStore } from "@/lib/store";

function formatWhen(iso: string) {
  if (!iso) {
    return "TBA";
  }
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function HomePage() {
  const store = await getStore();
  const upcoming = store.events
    .filter((event) => event.status === "published")
    .slice(0, 4);
  const top = store.players.slice(0, 8);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <section className="mb-12 max-w-3xl">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--gold)]">WarcraftEvents.com</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight text-[var(--gold)] md:text-5xl">
          Community events and the Forever duel ladder.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">
          Anyone can submit a raid night, arena cup, or open-world event. Organizers get a live
          bracket board. WoW:Forever Arena Ranked Duels uploads become the official season ladder.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/events/submit"
            className="rounded border border-[var(--gold)] bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[#1a120c] no-underline hover:bg-[#f0d9a0]"
          >
            Submit an event
          </Link>
          <Link
            href="/ladder/upload"
            className="rounded border border-[var(--gold-dim)] px-4 py-2 text-sm text-[var(--gold)] no-underline hover:border-[var(--gold)]"
          >
            Upload ARDU1 log
          </Link>
        </div>
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--gold)]">Upcoming</h2>
            <Link href="/events">Full calendar</Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-[var(--muted)]">No published events yet.</p>
          ) : (
            <ul className="space-y-4">
              {upcoming.map((event) => (
                <li key={event.id} className="border-b border-[var(--line)] pb-4 last:border-0">
                  <Link href={`/events/${event.slug}`} className="text-lg text-[var(--foreground)]">
                    {event.title}
                  </Link>
                  <p className="text-sm text-[var(--muted)]">
                    {event.game} · {formatWhen(event.startsAt)} · {event.region || "All regions"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--gold)]">
              Forever ladder
            </h2>
            <Link href="/ladder">Full board</Link>
          </div>
          {top.length === 0 ? (
            <p className="text-[var(--muted)]">
              No confirmed rated matches yet. Paste an <code>/ard upload</code> log to seed the season.
            </p>
          ) : (
            <ol className="space-y-2 text-sm">
              {top.map((player, index) => (
                <li key={player.name} className="flex justify-between gap-4">
                  <span>
                    {index + 1}. {player.name}
                    <span className="text-[var(--muted)]">
                      {" "}
                      {player.spec || player.className}
                    </span>
                  </span>
                  <span className="text-[var(--gold)]">{player.points.toFixed(0)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}
