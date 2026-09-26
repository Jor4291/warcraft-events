import Link from "next/link";
import { LadderPreview } from "@/components/LadderPreview";
import { publicText } from "@/lib/conduct";
import { compareByNextStart, formatEventWhen, isUpcomingStart } from "@/lib/event-when";
import { signupSpotsLabel } from "@/lib/signup-form";
import { getStore } from "@/lib/store";
import type { EventRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const store = await getStore();
  const listed = store.events.filter(
    (event) => event.status === "published" && event.kind === "calendar" && !event.cancelledAt,
  );
  const upcoming = listed.filter((event) => isUpcomingStart(event.startsAt)).sort(compareByNextStart).slice(0, 4);
  const past = listed.filter((event) => !isUpcomingStart(event.startsAt)).sort(compareByNextStart).slice(0, 4);
  const confirmedMatches = store.matches.filter((match) => match.confirmed).length;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <section className="tavern-frame mb-12 p-8 md:p-10">
        <p className="text-sm uppercase tracking-[0.28em] text-[var(--gold)]">The Lion&apos;s Pride · WarcraftEvents.com</p>
        <h1 className="tavern-title mt-3 max-w-3xl text-4xl leading-[1.15] md:text-5xl">
          <span className="block">Pull up a stool.</span>
          <span className="block">Check the board.</span>
          <span className="block">Settle it in the yard.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">
          <span className="block">Host an event.</span>
          <span className="block">Grind the ranked ladder.</span>
          <span className="block">Find something happening soon on the calendar.</span>
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/events/submit" className="tavern-btn no-underline">
            Book Event
          </Link>
          <Link href="/events" className="tavern-btn-ghost no-underline">
            Calendar
          </Link>
          <Link href="/ladder" className="tavern-btn-ghost no-underline">
            Arena Rankings
          </Link>
        </div>
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        <section className="tavern-frame p-6">
          <BoardHead title="Tonight's board" href="/events" link="Full calendar" />
          {upcoming.length === 0 ? (
            <p className="text-[var(--muted)]">The hearth is quiet.</p>
          ) : (
            <BoardList events={upcoming} />
          )}
          {past.length > 0 ? (
            <div className="mt-8">
              <BoardHead title="Past events" as="h3" />
              <BoardList events={past} />
            </div>
          ) : null}
        </section>

        <LadderPreview players={store.players} confirmedMatches={confirmedMatches} />
      </div>
    </main>
  );
}

function BoardHead({
  title,
  href,
  link,
  as: Tag = "h2",
}: {
  title: string;
  href?: string;
  link?: string;
  as?: "h2" | "h3";
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3 border-b border-[var(--gold-dim)] pb-3">
      <Tag className="tavern-title text-2xl text-[var(--gold-bright)]">{title}</Tag>
      {href && link ? (
        <Link href={href} className="mb-0.5 shrink-0 text-sm">
          {link}
        </Link>
      ) : null}
    </div>
  );
}

function BoardList({ events }: { events: EventRecord[] }) {
  return (
    <ul className="space-y-4">
      {events.map((event) => (
        <li key={event.id} className="border-b border-[var(--line)] pb-4 last:border-0">
          <Link href={`/events/${event.slug}`} className="text-lg text-[var(--foreground)]">
            {publicText(event.title)}
          </Link>
          <p className="text-sm text-[var(--muted)]">
            {event.game} · {formatEventWhen(event.startsAt)} · {event.region || "All regions"}
            {event.signupCap > 0 || event.signups.length > 0 ? ` · ${signupSpotsLabel(event)}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
