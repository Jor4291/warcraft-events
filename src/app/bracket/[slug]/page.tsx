import { notFound } from "next/navigation";
import { BracketBoard } from "@/components/BracketBoard";
import { isInnkeeper } from "@/lib/admin";
import { publicBracketRounds, publicName, publicText } from "@/lib/conduct";
import { canManageEvent } from "@/lib/event-access";
import { getStore } from "@/lib/store";

export default async function StandaloneBracketPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStore();
  const event = store.events.find((item) => item.slug === slug && item.kind === "bracket");
  if (!event || event.status !== "published") {
    notFound();
  }
  const [canEdit, innkeeper] = await Promise.all([canManageEvent(event), isInnkeeper()]);
  const showRaw = innkeeper || canEdit;

  return (
    <main className="mx-auto w-full max-w-[100rem] px-4 py-12 md:px-8">
      <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Standalone bracket</p>
      <h1 className="tavern-title mt-2 text-4xl">{publicText(event.title, innkeeper)}</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Pickup board — not listed on the calendar. {event.teams.length} challengers.
      </p>
      <div className="mt-10">
        <BracketBoard
          slug={event.slug}
          editKey=""
          canEdit={canEdit}
          whiteboard={publicText(event.whiteboard, showRaw)}
          teams={showRaw ? event.teams : event.teams.map((team) => publicName(team))}
          rounds={publicBracketRounds(event.rounds, showRaw)}
          title={publicText(event.title, innkeeper)}
        />
      </div>
    </main>
  );
}
