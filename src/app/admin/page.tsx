import { adminLogin, adminLogout, moderateEvent } from "@/lib/actions";
import { isAdmin, isAdminConfigured } from "@/lib/admin";
import { getStore } from "@/lib/store";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const admin = await isAdmin();
  const configured = isAdminConfigured();
  const store = await getStore();
  const pending = store.events.filter((event) => event.status === "pending");
  const published = store.events.filter((event) => event.status === "published");

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
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
