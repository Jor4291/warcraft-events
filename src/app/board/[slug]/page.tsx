import { notFound, redirect } from "next/navigation";
import { forumPath, isForumId, topicPath } from "@/lib/forum";
import { getStore } from "@/lib/store";

export default async function LegacyBoardSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (isForumId(slug)) {
    redirect(forumPath(slug));
  }
  const store = await getStore();
  const thread = store.threads.find((item) => item.slug === slug);
  if (thread) {
    redirect(topicPath(thread.slug));
  }
  notFound();
}
