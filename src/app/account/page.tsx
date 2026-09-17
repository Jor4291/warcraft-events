import Link from "next/link";
import { redirect } from "next/navigation";
import { UploaderTokenPanel } from "@/components/UploaderTokenPanel";
import { logoutAccount } from "@/lib/actions";
import { getSessionUser } from "@/lib/auth";
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
      <UploaderTokenPanel
        displayName={user.displayName}
        hasToken={user.hasUploadToken}
        isHub={user.isHub}
      />
      <section className="tavern-frame p-5">
        <h2 className="tavern-title text-xl">Your boards</h2>
        {mine.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">
            Nothing booked yet. <Link href="/events/submit">Book an event</Link> or{" "}
            <Link href="/bracket">hang a pickup bracket</Link>.
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
