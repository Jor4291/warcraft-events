import Link from "next/link";
import { CreateBracketForm } from "@/components/CreateBracketForm";
import { getStore } from "@/lib/store";

export const metadata = { title: "Bracket" };

export default async function BracketIndexPage() {
  const store = await getStore();
  const boards = store.events
    .filter((event) => event.kind === "bracket" && event.status === "published")
    .slice(0, 12);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-10 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div>
          <h1 className="tavern-title text-3xl">Bracket</h1>
          <p className="mt-2 mb-6 max-w-xl text-[var(--muted)]">
            Impromptu single-elim boards for pickup nights. Calendar events keep their own bracket on the
            event page.
          </p>
          <CreateBracketForm />
        </div>
        <aside className="tavern-frame p-5">
          <h2 className="tavern-title text-xl">Recent boards</h2>
          {boards.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--muted)]">No pickup brackets yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {boards.map((board) => (
                <li key={board.id}>
                  <Link href={`/bracket/${board.slug}`}>{board.title}</Link>
                  <p className="text-sm text-[var(--muted)]">{board.teams.length} names</p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </main>
  );
}
