import Link from "next/link";
import { notFound } from "next/navigation";
import { isInnkeeper } from "@/lib/admin";
import { getSessionUser } from "@/lib/auth";
import { publicName, publicText } from "@/lib/conduct";
import {
  formatBoardTime,
  forumById,
  forumPath,
  isForumId,
  lastVisiblePost,
  replyCount,
  threadsInForum,
  topicPath,
} from "@/lib/forum";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ forumId: string }> }) {
  const { forumId } = await params;
  return { title: isForumId(forumId) ? forumById(forumId).name : "Forum" };
}

export default async function ForumCategoryPage({
  params,
}: {
  params: Promise<{ forumId: string }>;
}) {
  const { forumId } = await params;
  if (!isForumId(forumId)) {
    notFound();
  }
  const forum = forumById(forumId);
  const [store, user, innkeeper] = await Promise.all([getStore(), getSessionUser(), isInnkeeper()]);
  const topics = threadsInForum(store.threads, forum.id, innkeeper);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <p className="text-sm uppercase tracking-[0.28em] text-[var(--gold)]">
        <Link href="/board">Forums</Link>
        <span className="mx-2 text-[var(--muted)]">/</span>
        {forum.name}
      </p>
      <div className="mt-3 mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="tavern-title text-3xl">{forum.name}</h1>
          <p className="mt-2 text-[var(--muted)]">{forum.blurb}</p>
        </div>
        {user ? (
          <Link href={`${forumPath(forum.id)}/new`} className="tavern-btn no-underline">
            New topic
          </Link>
        ) : (
          <Link href={`/account/login?next=${encodeURIComponent(`${forumPath(forum.id)}/new`)}`} className="tavern-btn no-underline">
            Sign in to post
          </Link>
        )}
      </div>
      {topics.length === 0 ? (
        <p className="text-[var(--muted)]">No topics yet. Start one.</p>
      ) : (
        <div className="overflow-hidden rounded-sm border border-[var(--line)]">
          <div className="forum-topic-head">
            <span>Topic</span>
            <span>Author</span>
            <span>Replies</span>
            <span>Last post</span>
          </div>
          <ul>
            {topics.map((thread) => {
              const last = lastVisiblePost(thread, innkeeper);
              const replies = replyCount(thread);
              return (
                <li key={thread.id} className="forum-topic-row">
                  <div>
                    <Link href={topicPath(thread.slug)} className="text-[var(--foreground)]">
                      {publicText(thread.title, innkeeper)}
                    </Link>
                    {thread.eventSlug ? <span className="ml-2 text-xs text-[var(--gold)]">Event</span> : null}
                    {thread.lockedAt ? <span className="ml-2 text-xs text-[var(--muted)]">Locked</span> : null}
                    {innkeeper && thread.hiddenAt ? <span className="ml-2 text-xs text-[var(--muted)]">Hidden</span> : null}
                    <p className="mt-1 text-sm text-[var(--muted)] md:hidden">
                      {publicName(thread.authorName, innkeeper)}
                      {` · ${replies} ${replies === 1 ? "reply" : "replies"}`}
                      {last ? ` · ${formatBoardTime(last.createdAt)}` : ""}
                    </p>
                  </div>
                  <p className="hidden text-sm text-[var(--muted)] md:block">{publicName(thread.authorName, innkeeper)}</p>
                  <p className="hidden text-sm text-[var(--muted)] md:block">{replies}</p>
                  <p className="hidden text-sm text-[var(--muted)] md:block">
                    {last ? (
                      <>
                        {publicName(last.authorName, innkeeper)}
                        <span className="mt-1 block">{formatBoardTime(last.createdAt)}</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </main>
  );
}
