import { UploaderGuide } from "@/components/UploaderGuide";
import { getSessionUser } from "@/lib/auth";

export const metadata = { title: "How to send duels" };

export default async function LadderSetupPage() {
  const user = await getSessionUser();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <p className="text-sm uppercase tracking-[0.28em] text-[var(--gold)]">Arena Ranked Duels</p>
      <h1 className="tavern-title mt-2 text-3xl">How to send duels</h1>
      <p className="mt-3 max-w-2xl text-lg text-[var(--muted)]">
        The addon tracks your rated 1v1s in game. A small Windows app sends them to the tavern board. Follow
        these steps once; after that, play, reload, and you&apos;re on the ladder.
      </p>
      <div className="mt-8">
        <UploaderGuide signedIn={Boolean(user)} />
      </div>
    </main>
  );
}
