import Link from "next/link";
import { EventExplorer } from "@/components/EventExplorer";
import { stripEventCopy } from "@/lib/event-copy";
import { compareByNextStart } from "@/lib/event-when";
import { confirmedSignups, waitlistedSignups } from "@/lib/signup-form";
import { getStore } from "@/lib/store";

export const metadata = { title: "Calendar" };

export default async function EventsPage() {
  const store = await getStore();
  const events = store.events
    .filter((event) => event.status === "published" && event.kind === "calendar" && !event.cancelledAt)
    .sort(compareByNextStart)
    .map((event) => ({
      slug: event.slug,
      title: event.title,
      game: event.game,
      format: event.format,
      startsAt: event.startsAt,
      region: event.region,
      location: event.location,
      description: stripEventCopy(event.description),
      signupCount: confirmedSignups(event).length,
      waitlistCount: waitlistedSignups(event).length,
      signupCap: event.signupCap,
    }));

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="tavern-title text-3xl">Calendar</h1>
          <p className="mt-2 text-[var(--muted)]">
            Open a listing to sign up. Hosts can edit or cancel from the event page after they sign in.
          </p>
        </div>
        <Link href="/events/submit" className="tavern-btn no-underline">
          Book Event
        </Link>
      </div>
      <EventExplorer events={events} />
    </main>
  );
}
