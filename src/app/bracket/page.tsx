import Link from "next/link";
import { CreateBracketForm } from "@/components/CreateBracketForm";
import { ScratchBracketTool } from "@/components/ScratchBracketTool";
import { getSessionUser } from "@/lib/auth";
import { publicText } from "@/lib/conduct";
import { getStore } from "@/lib/store";

export const metadata = { title: "Scratch bracket" };

export default async function BracketIndexPage() {
  const [store, user] = await Promise.all([getStore(), getSessionUser()]);
  const boards = store.events
    .filter((event) => event.kind === "bracket" && event.status === "published")
    .slice(0, 12);

  return (
    <main className="mx-auto w-full max-w-[100rem] px-4 py-12 md:px-8">
      <div className="mb-10 max-w-3xl">
        <h1 className="tavern-title text-3xl">Scratch bracket</h1>
        <p className="mt-2 text-[var(--muted)]">
          Paste names, pick winners, run a pickup night. This board is throwaway — nothing is stored on the site
          or hung on the calendar. Event listings keep their own bracket on the event page.
        </p>
      </div>

      <ScratchBracketTool />

      <section className="mt-14 grid gap-10 border-t border-[var(--line)] pt-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div>
          <h2 className="tavern-title text-2xl">Lasting pickup board</h2>
          <p className="mt-2 mb-6 max-w-xl text-[var(--muted)]">
            Sign in to hang a board on your account so you can come back and pick winners later. Still not a
            calendar event.
          </p>
          {user ? (
            <CreateBracketForm />
          ) : (
            <div className="tavern-frame p-6">
              <p className="text-[var(--muted)]">
                Use the scratch board above anytime. A lasting board needs a tavern account.
              </p>
              <p className="mt-4">
                <Link href={`/account/login?next=${encodeURIComponent("/bracket")}`}>Sign in</Link>
                {" · "}
                <Link href="/account/register">Register</Link>
              </p>
            </div>
          )}
        </div>
        <aside className="tavern-frame p-5">
          <h2 className="tavern-title text-xl">Saved boards</h2>
          {boards.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--muted)]">No lasting pickup brackets yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {boards.map((board) => (
                <li key={board.id}>
                  <Link href={`/bracket/${board.slug}`}>{publicText(board.title)}</Link>
                  <p className="text-sm text-[var(--muted)]">{board.teams.length} names</p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </section>
    </main>
  );
}
