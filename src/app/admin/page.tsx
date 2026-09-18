import { adminLogin } from "@/lib/actions";
import { isAdmin, isAdminConfigured } from "@/lib/admin";
import { InnkeeperDesk, type InnkeeperDeskId } from "@/components/InnkeeperDesk";
import { awaitingInnkeeper } from "@/lib/rating";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Innkeeper" };

function byStart(a: { startsAt: string }, b: { startsAt: string }) {
  return a.startsAt.localeCompare(b.startsAt);
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ desk?: string; error?: string }>;
}) {
  const { desk: deskParam, error } = await searchParams;
  const admin = await isAdmin();
  const configured = isAdminConfigured();
  const store = await getStore();
  const pendingEvents = store.events.filter((event) => event.status === "pending").sort(byStart);
  const liveEvents = store.events
    .filter((event) => event.status === "published" && !event.cancelledAt)
    .sort(byStart);
  const cancelledEvents = store.events
    .filter((event) => event.status === "published" && Boolean(event.cancelledAt))
    .sort((a, b) => (b.cancelledAt || "").localeCompare(a.cancelledAt || ""));
  const rejectedEvents = store.events.filter((event) => event.status === "rejected").sort(byStart);
  const pendingDuels = store.matches
    .filter(awaitingInnkeeper)
    .sort((a, b) => b.timestamp - a.timestamp || a.matchId.localeCompare(b.matchId));
  const deniedDuels = store.matches
    .filter((match) => Boolean(match.deniedAt) && !match.confirmed)
    .sort((a, b) => (b.deniedAt || "").localeCompare(a.deniedAt || ""))
    .slice(0, 20);

  let desk: InnkeeperDeskId = "arena";
  if (deskParam === "events" || deskParam === "arena") {
    desk = deskParam;
  } else if (pendingEvents.length > 0 && pendingDuels.length === 0) {
    desk = "events";
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="tavern-title text-3xl">Innkeeper</h1>
      {!configured ? (
        <p className="mt-4 text-[var(--muted)]">
          Set <code>ADMIN_PASSWORD</code> in <code>.env.local</code> (and in Vercel env) to enable moderation.
        </p>
      ) : null}
      {admin ? (
        <InnkeeperDesk
          desk={desk}
          pendingDuels={pendingDuels}
          deniedDuels={deniedDuels}
          pendingEvents={pendingEvents}
          liveEvents={liveEvents}
          cancelledEvents={cancelledEvents}
          rejectedEvents={rejectedEvents}
        />
      ) : configured ? (
        <form action={adminLogin} className="tavern-frame mt-8 max-w-sm space-y-4 p-6">
          <p className="text-sm text-[var(--muted)]">Password for the desk. This is not your tavern account.</p>
          {error === "1" ? <p className="text-sm text-[#e07a7a]">That password did not match.</p> : null}
          <input type="password" name="password" placeholder="Innkeeper password" className="tavern-input" />
          <button className="tavern-btn" type="submit">
            Log in
          </button>
        </form>
      ) : null}
    </main>
  );
}
