import Link from "next/link";
import { notFound } from "next/navigation";
import { ForumReplyForm } from "@/components/ForumReplyForm";
import { moderateForumPost, moderateForumThread } from "@/lib/actions";
import { isInnkeeper } from "@/lib/admin";
import { getSessionUser } from "@/lib/auth";
import { formatBoardTime, forumById, forumPath, topicPath, visibleForumPosts } from "@/lib/forum";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStore();
  const thread = store.threads.find((item) => item.slug === slug);
  return { title: thread?.title || "Topic" };
}

export default async function ForumTopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [store, user, innkeeper] = await Promise.all([getStore(), getSessionUser(), isInnkeeper()]);
  const thread = store.threads.find((item) => item.slug === slug);
  if (!thread || (thread.hiddenAt && !innkeeper)) {
    notFound();
  }
  const forum = forumById(thread.forumId);
  const posts = visibleForumPosts(thread, innkeeper);
  const linkedEvent = thread.eventSlug
    ? store.events.find((item) => item.slug === thread.eventSlug && item.status === "published")
    : undefined;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <p className="text-sm uppercase tracking-[0.28em] text-[var(--gold)]">
        <Link href="/board">Forums</Link>
        <span className="mx-2 text-[var(--muted)]">/</span>
        <Link href={forumPath(forum.id)}>{forum.name}</Link>
      </p>
      <h1 className="tavern-title mt-2 text-3xl">{thread.title}</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Started by {thread.authorName}
        {thread.createdAt ? ` · ${formatBoardTime(thread.createdAt)}` : ""}
        {thread.lockedAt ? " · Locked" : ""}
        {innkeeper && thread.hiddenAt ? " · Hidden" : ""}
      </p>
      {linkedEvent ? (
        <p className="mt-3 text-sm">
          This topic is for{" "}
          <Link href={`/events/${linkedEvent.slug}`}>{linkedEvent.title}</Link>
          {linkedEvent.kind === "calendar" ? " on the calendar." : "."}
        </p>
      ) : null}
      {innkeeper ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <form action={moderateForumThread.bind(null, thread.slug, thread.lockedAt ? "unlocked" : "locked")}>
            <button className="rounded border border-[var(--line)] px-3 py-1 text-sm" type="submit">
              {thread.lockedAt ? "Unlock" : "Lock"}
            </button>
          </form>
          <form action={moderateForumThread.bind(null, thread.slug, thread.hiddenAt ? "shown" : "hidden")}>
            <button className="rounded border border-[var(--line)] px-3 py-1 text-sm" type="submit">
              {thread.hiddenAt ? "Show" : "Hide"}
            </button>
          </form>
        </div>
      ) : null}
      <ol className="mt-8 space-y-4">
        {posts.map((post, index) => (
          <li key={post.id} className="forum-post">
            <div className="forum-post-meta">
              <p className="text-[var(--gold)]">{post.authorName}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">#{index + 1}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{formatBoardTime(post.createdAt)}</p>
              {innkeeper && post.hiddenAt ? <p className="mt-2 text-xs text-[var(--muted)]">Hidden</p> : null}
            </div>
            <div className="forum-post-body">
              <p className={`whitespace-pre-wrap ${post.hiddenAt ? "text-[var(--muted)]" : ""}`}>{post.body}</p>
              {innkeeper ? (
                <form action={moderateForumPost.bind(null, thread.slug, post.id, post.hiddenAt ? "shown" : "hidden")} className="mt-4">
                  <button className="text-sm text-[var(--muted)]" type="submit">
                    {post.hiddenAt ? "Show post" : "Hide post"}
                  </button>
                </form>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      <section className="mt-10">
        {thread.lockedAt ? (
          <p className="text-[var(--muted)]">This topic is locked.</p>
        ) : user ? (
          <ForumReplyForm slug={thread.slug} />
        ) : (
          <p className="text-[var(--muted)]">
            <Link href={`/account/login?next=${encodeURIComponent(topicPath(thread.slug))}`}>Sign in</Link> to reply.
          </p>
        )}
      </section>
    </main>
  );
}
