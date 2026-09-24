import Link from "next/link";
import { redirect } from "next/navigation";
import { UploaderTokenPanel } from "@/components/UploaderTokenPanel";
import { logoutAccount } from "@/lib/actions";
import { getSessionUser } from "@/lib/auth";
import { describeRestriction, restrictionMessage } from "@/lib/moderation";
import { nightsForUser } from "@/lib/notices";
import { signupSpotsLabel } from "@/lib/signup-form";
import { getStore } from "@/lib/store";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/account/login");
  }
  const store = await getStore();
  const mine = store.events.filter(
    (event) => event.ownerId === user.id || event.coHosts.some((host) => host.userId === user.id),
  );
  const nights = nightsForUser(user.id, store.events);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="tavern-title text-3xl">{user.displayName}</h1>
          <p className="mt-2 text-[var(--muted)]">{user.email}</p>
        </div>
        <form action={logoutAccount}>
          <button type="submit" className="tavern-btn-ghost">
            Sign out
          </button>
        </form>
      </div>
      <div className="space-y-6">
      {user.restriction ? (
        <section className="tavern-frame border-l-2 border-[#e07a7a] p-5">
          <h2 className="tavern-title text-xl">{describeRestriction(user.restriction)}</h2>
          <p className="mt-2 text-[var(--muted)]">{restrictionMessage(user.restriction)}</p>
        </section>
      ) : null}
      <UploaderTokenPanel
        displayName={user.displayName}
        hasToken={user.hasUploadToken}
        isHub={user.isHub}
      />
      <section className="tavern-frame p-5">
        <h2 className="tavern-title text-xl">Nights you&apos;re on</h2>
        {nights.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">
            You haven&apos;t signed up yet. <Link href="/events">Open the calendar</Link> and join a listing.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {nights.map((night) => (
              <li key={night.eventId} className="border-b border-[var(--line)] pb-3 last:border-0">
                <Link href={`/events/${night.slug}`}>{night.title}</Link>
                <p className="text-sm text-[var(--muted)]">
                  {night.cancelled ? "Cancelled" : night.waitlisted ? "Waitlist" : night.checkedIn ? "Checked in" : "Signed up"}
                  {night.startsAt ? ` · ${new Date(night.startsAt).toLocaleString()}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="tavern-frame p-5">
        <h2 className="tavern-title text-xl">Your boards</h2>
        {mine.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">
            Nothing booked yet. <Link href="/events/submit">Book an event</Link> or{" "}
            <Link href="/bracket">hang a lasting pickup bracket</Link>.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {mine.map((event) => (
              <li key={event.id} className="border-b border-[var(--line)] pb-3 last:border-0">
                <Link href={event.kind === "bracket" ? `/bracket/${event.slug}` : `/events/${event.slug}`}>
                  {event.title}
                </Link>
                <p className="text-sm text-[var(--muted)]">
                  {event.kind === "bracket"
                    ? "Standalone bracket"
                    : event.cancelledAt
                      ? "Cancelled event"
                      : event.ownerId === user.id
                        ? "Calendar event"
                        : "Co-host"}
                  {event.kind === "calendar" && event.signupMode === "invite" && event.ownerId === user.id
                    ? ` · code ${event.inviteCode}`
                    : ""}
                  {event.kind === "calendar" ? ` · ${signupSpotsLabel(event)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
      </div>
    </main>
  );
}
