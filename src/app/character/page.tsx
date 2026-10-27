import { CharacterCreator } from "@/components/CharacterCreator";

export const metadata = { title: "Character creator" };

export default function CharacterPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8">
      <div className="mb-8 max-w-3xl">
        <h1 className="tavern-title text-3xl">Character creator</h1>
        <p className="mt-2 text-[var(--muted)]">
          Pick a race and class for WoW: Forever. Racial notes follow Blizzard&apos;s beta development notes through
          October 26, 2026. Nothing is saved. Unofficial, and subject to change before launch on November 4.
        </p>
      </div>
      <CharacterCreator />
    </main>
  );
}
