import Link from "next/link";
import { isInnkeeper } from "@/lib/admin";
import { publicName, publicText } from "@/lib/conduct";
import { formatBoardTime, FORUMS, forumPath, forumSummary, topicPath } from "@/lib/forum";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Forums" };

export default async function BoardPage() {
  const [store, innkeeper] = await Promise.all([getStore(), isInnkeeper()]);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-[var(--gold)]">Corkboard</p>
          <h1 className="tavern-title mt-2 text-3xl">Forums</h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Topics and replies, split like the old boards. Event nights can hang a discussion next to the calendar listing.
          </p>
        </div>
        <Link href="/board/new" className="tavern-btn no-underline">
          New topic
        </Link>
      </div>
      <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-sm border border-[var(--line)]">
        {FORUMS.map((forum) => {
          const summary = forumSummary(store.threads, forum.id, innkeeper);
          const latest = summary.latest;
          return (
            <li key={forum.id} className="forum-row">
              <div>
                <Link href={forumPath(forum.id)} className="text-lg text-[var(--gold)]">
                  {forum.name}
                </Link>
                <p className="mt-1 text-sm text-[var(--muted)]">{forum.blurb}</p>
              </div>
              <p className="text-sm text-[var(--muted)]">
                {summary.topics} {summary.topics === 1 ? "topic" : "topics"}
                {` · ${summary.posts} ${summary.posts === 1 ? "post" : "posts"}`}
              </p>
              <p className="text-sm text-[var(--muted)] md:text-right">
                {latest ? (
                  <>
                    <Link href={topicPath(latest.slug)}>{publicText(latest.title, innkeeper)}</Link>
                    <span className="mt-1 block">
                      {publicName(latest.authorName, innkeeper)}
                      {latest.updatedAt ? ` · ${formatBoardTime(latest.updatedAt)}` : ""}
                    </span>
                  </>
                ) : (
                  "No topics yet"
                )}
              </p>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
