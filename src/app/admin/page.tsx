import { adminLogin } from "@/lib/actions";
import { isAdmin, isAdminConfigured, isInnkeeper } from "@/lib/admin";
import { InnkeeperDesk, type InnkeeperDeskId } from "@/components/InnkeeperDesk";
import type { DeskPerson } from "@/components/InnkeeperPeople";
import { getSessionUser, isHubAccount } from "@/lib/auth";
import { activeSanction, normalizeSanctions } from "@/lib/moderation";
import { isBlocked, isBlockedName } from "@/lib/conduct";
import { awaitingInnkeeper } from "@/lib/rating";
import { getStore } from "@/lib/store";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Innkeeper" };

function byStart(a: { startsAt: string }, b: { startsAt: string }) {
  return a.startsAt.localeCompare(b.startsAt);
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ desk?: string; error?: string; user?: string }>;
}) {
  const { desk: deskParam, error, user: focusPersonId = "" } = await searchParams;
  const [innkeeper, passwordSession, user] = await Promise.all([isInnkeeper(), isAdmin(), getSessionUser()]);
  const configured = isAdminConfigured();

  if (!innkeeper) {
    return (
      <main className="mx-auto w-full max-w-md px-6 py-12">
        <h1 className="tavern-title text-3xl">Innkeeper</h1>
        <p className="mt-3 text-[var(--muted)]">
          This desk is locked. Only the innkeeper can confirm duels, hang nights, and moderate the board.
        </p>
        {configured ? (
          <form action={adminLogin} className="tavern-frame mt-8 space-y-4 p-6">
            <p className="text-sm text-[var(--muted)]">Desk password. This is not your tavern account.</p>
            {error === "1" ? <p className="text-sm text-[#e07a7a]">That password did not match.</p> : null}
            <input type="password" name="password" placeholder="Innkeeper password" className="tavern-input" />
            <button className="tavern-btn" type="submit">
              Log in
            </button>
          </form>
        ) : null}
        <p className="mt-6 text-sm text-[var(--muted)]">
          {user ? (
            "This tavern account is not the innkeeper."
          ) : (
            <>
              Or{" "}
              <Link href={`/account/login?next=${encodeURIComponent("/admin")}`}>sign in</Link> with the innkeeper
              account.
            </>
          )}
        </p>
      </main>
    );
  }

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

  const people: DeskPerson[] = store.users
    .map((account) => {
      const posts = store.threads.flatMap((thread) =>
        thread.posts.filter((post) => post.authorId === account.id),
      );
      const sanctions = normalizeSanctions(account.sanctions);
      const restriction = activeSanction(sanctions);
      return {
        id: account.id,
        displayName: account.displayName,
        email: account.email,
        createdAt: account.createdAt,
        innkeeper: isHubAccount(account.displayName, account.isHub),
        restriction,
        needsRename: isBlocked(account.displayName) || isBlockedName(account.displayName) || isBlocked(account.email),
        ips: account.ips ?? [],
        history: sanctions.filter((sanction) => sanction.id !== restriction?.id),
        topics: store.threads.filter((thread) => thread.authorId === account.id).length,
        posts: posts.length,
        hiddenPosts: posts.filter((post) => post.hiddenAt).length,
        events: store.events.filter((event) => event.ownerId === account.id).length,
        lastPostAt: posts.reduce((latest, post) => (post.createdAt > latest ? post.createdAt : latest), ""),
      };
    })
    .sort((a, b) => (b.lastPostAt || b.createdAt).localeCompare(a.lastPostAt || a.createdAt));

  let desk: InnkeeperDeskId = "arena";
  if (deskParam === "events" || deskParam === "arena" || deskParam === "people") {
    desk = deskParam;
  } else if (focusPersonId) {
    desk = "people";
  } else if (pendingEvents.length > 0 && pendingDuels.length === 0) {
    desk = "events";
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <h1 className="tavern-title text-3xl">Innkeeper</h1>
      <InnkeeperDesk
        desk={desk}
        passwordSession={passwordSession}
        pendingDuels={pendingDuels}
        deniedDuels={deniedDuels}
        pendingEvents={pendingEvents}
        liveEvents={liveEvents}
        cancelledEvents={cancelledEvents}
        rejectedEvents={rejectedEvents}
        people={people}
        focusPersonId={focusPersonId}
        ipBans={store.ipBans}
      />
    </main>
  );
}
