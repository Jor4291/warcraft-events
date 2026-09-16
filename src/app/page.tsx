import Link from "next/link";
import { LadderPreview } from "@/components/LadderPreview";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

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
    .filter((event) => event.status === "published" && event.kind === "calendar" && !event.cancelledAt)
    .slice(0, 4);
  const confirmedMatches = store.matches.filter((match) => match.confirmed).length;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <section className="tavern-frame mb-12 p-8 md:p-10">
        <p className="text-sm uppercase tracking-[0.28em] text-[var(--gold)]">The Lion&apos;s Pride · WarcraftEvents.com</p>
        <h1 className="tavern-title mt-3 max-w-3xl text-4xl leading-tight md:text-5xl">
          Pull up a stool. Check the board. Settle it in the yard.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">
          Book a night, hang a pickup bracket, or climb the Arena Ranked Duels board. Open events take
          sign-ups from the calendar; private ones stay behind a door code.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/events/submit" className="tavern-btn no-underline">
            Book Event
          </Link>
          <Link href="/events" className="tavern-btn-ghost no-underline">
            Calendar
          </Link>
          <Link href="/bracket" className="tavern-btn-ghost no-underline">
            Bracket
          </Link>
        </div>
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        <section className="tavern-frame p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="tavern-title text-xl">Tonight&apos;s board</h2>
            <Link href="/events">Full calendar</Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-[var(--muted)]">The hearth is quiet.</p>
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

        <LadderPreview players={store.players} confirmedMatches={confirmedMatches} />
      </div>
    </main>
  );
}
