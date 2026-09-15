import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { BracketBoard } from "@/components/BracketBoard";
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
  const event = store.events.find((item) => item.slug === slug);
  if (!event) {
    notFound();
  }
  const admin = await isAdmin();
  const canView = event.status === "published" || admin || event.editKey === key;
  if (!canView) {
    notFound();
  }
  const canEdit = admin || event.editKey === key;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <p className="text-sm uppercase tracking-wide text-[var(--muted)]">
        {event.status} · {event.game} · {event.region || "All regions"}
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--gold)]">{event.title}</h1>
      <p className="mt-3 max-w-3xl text-[var(--muted)]">{event.description}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {event.format} · {event.location} · {event.startsAt ? new Date(event.startsAt).toLocaleString() : "TBA"}
      </p>
      <div className="mt-10">
        <BracketBoard
          slug={event.slug}
          editKey={key}
          canEdit={canEdit}
          whiteboard={event.whiteboard}
          teams={event.teams}
          rounds={event.rounds}
        />
      </div>
    </main>
  );
}
