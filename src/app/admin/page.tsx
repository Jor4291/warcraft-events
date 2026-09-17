import { adminLogin, adminLogout, moderateEvent, moderateLadderMatch } from "@/lib/actions";
import { isAdmin, isAdminConfigured } from "@/lib/admin";
import { formatClassName } from "@/lib/display";
import { formatMatchTime } from "@/lib/ladder-board";
import { awaitingInnkeeper } from "@/lib/rating";
import { getStore } from "@/lib/store";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const admin = await isAdmin();
  const configured = isAdminConfigured();
  const store = await getStore();
  const pending = store.events.filter((event) => event.status === "pending");
  const published = store.events.filter((event) => event.status === "published");
  const pendingDuels = store.matches
    .filter(awaitingInnkeeper)
    .sort((a, b) => b.timestamp - a.timestamp || a.matchId.localeCompare(b.matchId));
  const deniedDuels = store.matches
    .filter((match) => Boolean(match.deniedAt) && !match.confirmed)
    .sort((a, b) => (b.deniedAt || "").localeCompare(a.deniedAt || ""))
    .slice(0, 20);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <h1 className="tavern-title text-3xl">Innkeeper</h1>
      {!configured ? (
        <p className="mt-4 text-[var(--muted)]">
          Set <code>ADMIN_PASSWORD</code> in <code>.env.local</code> (and in Vercel env) to enable moderation.
        </p>
      ) : null}
      {admin ? (
        <div className="mt-8 space-y-8">
          <form action={adminLogout}>
            <button className="text-sm text-[var(--muted)]" type="submit">
              Log out
            </button>
          </form>
          <section>
            <h2 className="mb-3 text-lg text-[var(--gold)]">Pending duel reports ({pendingDuels.length})</h2>
            <p className="mb-3 text-sm text-[var(--muted)]">
              These fights have one report. Confirm them to count on the ladder, or deny them if they look
              wrong. Two-player reports still count on their own, even after a deny.
            </p>
            {pendingDuels.length === 0 ? (
              <p className="text-[var(--muted)]">No single reports waiting.</p>
            ) : (
              <ul className="space-y-4">
                {pendingDuels.map((match) => (
                  <li key={match.matchId} className="tavern-frame p-4">
                    <p className="text-lg">
                      {match.winner} beat {match.loser}
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      Reported by {match.reports.map((report) => report.reporter).join(", ") || "unknown"}
                      {match.timestamp ? ` · ${formatMatchTime(match.timestamp)}` : ""}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {formatClassName(match.winnerClass) || "Unknown"} vs {formatClassName(match.loserClass) || "Unknown"}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <form action={moderateLadderMatch.bind(null, match.matchId, "approved")}>
                        <button className="tavern-btn text-sm" type="submit">
                          Confirm
                        </button>
                      </form>
                      <form action={moderateLadderMatch.bind(null, match.matchId, "denied")}>
                        <button className="rounded border border-[var(--line)] px-3 py-1 text-sm" type="submit">
                          Deny
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {deniedDuels.length > 0 ? (
            <section>
              <h2 className="mb-3 text-lg text-[var(--gold)]">Denied reports</h2>
              <p className="mb-3 text-sm text-[var(--muted)]">
                These stay off the ladder unless you confirm them, or a second player sends the same fight.
              </p>
              <ul className="space-y-4">
                {deniedDuels.map((match) => (
                  <li key={match.matchId} className="tavern-frame p-4">
                    <p className="text-lg">
                      {match.winner} beat {match.loser}
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      Reported by {match.reports.map((report) => report.reporter).join(", ") || "unknown"}
                      {match.timestamp ? ` · ${formatMatchTime(match.timestamp)}` : ""}
                    </p>
                    <form action={moderateLadderMatch.bind(null, match.matchId, "approved")} className="mt-3">
                      <button className="tavern-btn text-sm" type="submit">
                        Confirm
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <section>
            <h2 className="mb-3 text-lg text-[var(--gold)]">Pending submissions</h2>
            {pending.length === 0 ? (
              <p className="text-[var(--muted)]">Queue is clear.</p>
            ) : (
              <ul className="space-y-4">
                {pending.map((event) => (
                  <li key={event.id} className="tavern-frame p-4">
                    <p className="text-lg">{event.title}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {event.game} · {event.contact} · {event.startsAt}
                    </p>
                    <p className="mt-2 text-sm">{event.description}</p>
                    <div className="mt-3 flex gap-2">
                      <form action={moderateEvent.bind(null, event.id, "published")}>
                        <button className="tavern-btn text-sm" type="submit">
                          Publish
                        </button>
                      </form>
                      <form action={moderateEvent.bind(null, event.id, "rejected")}>
                        <button className="rounded border border-[var(--line)] px-3 py-1 text-sm" type="submit">
                          Reject
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className="mb-3 text-lg text-[var(--gold)]">Live ({published.length})</h2>
            <ul className="space-y-2 text-sm">
              {published.map((event) => (
                <li key={event.id}>
                  <a href={`/events/${event.slug}`}>{event.title}</a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : (
        <form action={adminLogin} className="mt-8 max-w-sm space-y-3">
          <input
            type="password"
            name="password"
            placeholder="Admin password"
            className="tavern-input"
          />
          <button className="tavern-btn" type="submit">
            Log in
          </button>
        </form>
      )}
    </main>
  );
}
