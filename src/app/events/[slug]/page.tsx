import { notFound } from "next/navigation";
import { BracketBoard } from "@/components/BracketBoard";
import { EventManage } from "@/components/EventManage";
import { SignupPanel } from "@/components/SignupPanel";
import { getSessionUser } from "@/lib/auth";
import { canManageEvent } from "@/lib/event-access";
import { signupSpotsLabel } from "@/lib/signup-form";
import { getStore } from "@/lib/store";

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ key?: string }>;
}) {
  const { slug } = await params;
  const { key = "" } = await searchParams;
  const store = await getStore();
  const event = store.events.find((item) => item.slug === slug && item.kind === "calendar");
  if (!event) {
    notFound();
  }
  const user = await getSessionUser();
  const canEdit = await canManageEvent(event, key);
  const canView = event.status === "published" || canEdit;
  if (!canView) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-[100rem] space-y-8 px-4 py-12 md:px-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          {event.cancelledAt ? "cancelled" : event.status} · {event.game} · {event.region || "All regions"} ·{" "}
          {event.signupMode === "invite" ? "Invite only" : "Open sign-up"}
          {event.signupCap > 0 ? ` · ${signupSpotsLabel(event.signups.length, event.signupCap)}` : ""}
        </p>
        <h1 className="tavern-title mt-2 text-4xl">{event.title}</h1>
        <p className="mt-3 max-w-3xl text-[var(--muted)]">{event.description}</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {event.format} · {event.location} · {event.startsAt ? new Date(event.startsAt).toLocaleString() : "TBA"}
        </p>
      </div>

      {event.cancelledAt ? (
        <p className="tavern-frame p-4 text-[var(--muted)]">This event was cancelled by the host.</p>
      ) : null}

      {event.status === "published" && !event.cancelledAt ? (
        <SignupPanel
          slug={event.slug}
          signupMode={event.signupMode}
          defaultName={user?.displayName || ""}
          fields={event.signupFields}
          signupCap={event.signupCap}
          signupCount={event.signups.length}
        />
      ) : null}

      {event.signups.length > 0 ? (
        <section className="tavern-frame p-5">
          <h2 className="tavern-title text-xl">On the list ({signupSpotsLabel(event.signups.length, event.signupCap)})</h2>
          <ul className="mt-3 columns-1 gap-8 sm:columns-2">
            {event.signups.map((signup) => (
              <li key={signup.id} className="mb-1 text-sm">
                {signup.name}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {canEdit ? <EventManage event={event} editKey={key || event.editKey} /> : null}

      <div>
        <BracketBoard
          slug={event.slug}
          editKey={canEdit ? key || event.editKey : ""}
          canEdit={canEdit}
          whiteboard={event.whiteboard}
          teams={event.teams}
          rounds={event.rounds}
          title={event.title}
        />
      </div>
    </main>
  );
}
