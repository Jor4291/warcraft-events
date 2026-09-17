import Link from "next/link";
import { notFound } from "next/navigation";
import { ForumThreadForm } from "@/components/ForumThreadForm";
import { LoginForm } from "@/components/LoginForm";
import { getSessionUser } from "@/lib/auth";
import { forumById, forumPath, isForumId } from "@/lib/forum";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ forumId: string }> }) {
  const { forumId } = await params;
  return { title: isForumId(forumId) ? `New topic · ${forumById(forumId).name}` : "New topic" };
}

export default async function NewForumTopicPage({
  params,
}: {
  params: Promise<{ forumId: string }>;
}) {
  const { forumId } = await params;
  if (!isForumId(forumId)) {
    notFound();
  }
  const forum = forumById(forumId);
  const user = await getSessionUser();
  const next = `${forumPath(forum.id)}/new`;

  if (!user) {
    return (
      <LoginForm
        next={next}
        intro={`Sign in to post a topic in ${forum.name}. Anyone can read it; only tavern accounts can post.`}
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <p className="text-sm uppercase tracking-[0.28em] text-[var(--gold)]">
        <Link href="/board">Forums</Link>
        <span className="mx-2 text-[var(--muted)]">/</span>
        <Link href={forumPath(forum.id)}>{forum.name}</Link>
      </p>
      <h1 className="tavern-title mt-2 text-3xl">New topic</h1>
      <p className="mt-2 mb-8 text-[var(--muted)]">
        Post a topic in {forum.name}. You can move it to another forum if this isn&apos;t the right board.
      </p>
      <ForumThreadForm forumId={forum.id} />
    </main>
  );
}
