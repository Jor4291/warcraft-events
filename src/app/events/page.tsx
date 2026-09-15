import Link from "next/link";
import { getStore } from "@/lib/store";

export const metadata = { title: "Calendar" };

export default async function EventsPage() {
  const store = await getStore();
  const events = store.events
    .filter((event) => event.status === "published")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--gold)]">Event calendar</h1>
          <p className="mt-2 text-[var(--muted)]">Published community events. Submissions are reviewed before they go live.</p>
        </div>
        <Link
          href="/events/submit"
          className="rounded border border-[var(--gold)] px-4 py-2 text-sm no-underline hover:bg-[var(--gold)] hover:text-[#1a120c]"
        >
          Submit an event
        </Link>
      </div>
      {events.length === 0 ? (
        <p className="text-[var(--muted)]">Nothing on the calendar yet.</p>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="block rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 no-underline hover:border-[var(--gold-dim)]"
            >
              <h2 className="text-xl text-[var(--gold)]">{event.title}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {event.game} · {event.format || "Open format"} · {event.region || "All regions"} ·{" "}
                {new Date(event.startsAt).toLocaleString()}
              </p>
              <p className="mt-2 text-[var(--foreground)]">{event.description}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
