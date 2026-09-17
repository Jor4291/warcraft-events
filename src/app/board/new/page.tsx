import Link from "next/link";
import { ForumThreadForm } from "@/components/ForumThreadForm";
import { LoginForm } from "@/components/LoginForm";
import { getSessionUser } from "@/lib/auth";
import { isForumId } from "@/lib/forum";

export const dynamic = "force-dynamic";
export const metadata = { title: "New topic" };

export default async function NewBoardThreadPage({
  searchParams,
}: {
  searchParams: Promise<{ forum?: string }>;
}) {
  const { forum = "general" } = await searchParams;
  const forumId = isForumId(forum) ? forum : "general";
  const user = await getSessionUser();

  if (!user) {
    return (
      <LoginForm
        next={`/board/new?forum=${forumId}`}
        intro="Sign in to post a topic. Anyone can read it; only tavern accounts can post."
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <p className="text-sm uppercase tracking-[0.28em] text-[var(--gold)]">
        <Link href="/board">Forums</Link>
      </p>
      <h1 className="tavern-title mt-2 text-3xl">New topic</h1>
      <p className="mt-2 mb-8 text-[var(--muted)]">
        Pick a forum, write a first post, and people can reply underneath.
      </p>
      <ForumThreadForm forumId={forumId} />
    </main>
  );
}
