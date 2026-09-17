import type { ForumPost, ForumThread } from "./types";

export const FORUM_TITLE_MAX = 100;
export const FORUM_BODY_MAX = 4000;

export const FORUMS = [
  { id: "general", name: "General Discussion", blurb: "Talk in the tavern." },
  { id: "events", name: "Events", blurb: "Nights on the calendar, sign-ups, and after-action chatter." },
  { id: "arena", name: "Arena Ranked Duels", blurb: "Ladder talk, disputes, and looking for a set." },
  { id: "lfg", name: "Looking for Group", blurb: "Yard 1v1s, pickup brackets, and extra bodies." },
] as const;

export type ForumId = (typeof FORUMS)[number]["id"];

export function isForumId(value: string): value is ForumId {
  return FORUMS.some((forum) => forum.id === value);
}

export function forumById(id: string) {
  return FORUMS.find((forum) => forum.id === id) ?? FORUMS[0];
}

export function topicPath(slug: string) {
  return `/board/t/${slug}`;
}

export function forumPath(id: string) {
  return `/board/c/${id}`;
}

export function normalizeForumPost(post: Partial<ForumPost> | ForumPost): ForumPost {
  return {
    id: String(post.id || ""),
    authorId: String(post.authorId || ""),
    authorName: String(post.authorName || "Unknown"),
    body: String(post.body || ""),
    createdAt: String(post.createdAt || ""),
    hiddenAt: String(post.hiddenAt || ""),
  };
}

export function normalizeForumThread(thread: Partial<ForumThread> | ForumThread): ForumThread {
  const posts = (thread.posts ?? []).map(normalizeForumPost).filter((post) => post.id);
  const forumId = isForumId(String(thread.forumId || "")) ? String(thread.forumId) : "general";
  return {
    id: String(thread.id || ""),
    slug: String(thread.slug || ""),
    forumId,
    eventSlug: String(thread.eventSlug || ""),
    title: String(thread.title || "Untitled"),
    authorId: String(thread.authorId || ""),
    authorName: String(thread.authorName || "Unknown"),
    createdAt: String(thread.createdAt || ""),
    updatedAt: String(thread.updatedAt || thread.createdAt || ""),
    lockedAt: String(thread.lockedAt || ""),
    hiddenAt: String(thread.hiddenAt || ""),
    posts,
  };
}

export function visibleForumThreads(threads: ForumThread[], innkeeper: boolean) {
  return threads
    .filter((thread) => thread.id && thread.slug && (innkeeper || !thread.hiddenAt))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.createdAt.localeCompare(a.createdAt));
}

export function visibleForumPosts(thread: ForumThread, innkeeper: boolean) {
  return thread.posts.filter((post) => innkeeper || !post.hiddenAt);
}

export function threadsInForum(threads: ForumThread[], forumId: string, innkeeper: boolean) {
  return visibleForumThreads(threads, innkeeper).filter((thread) => thread.forumId === forumId);
}

export function clipForumTitle(value: string) {
  return value.trim().slice(0, FORUM_TITLE_MAX);
}

export function clipForumBody(value: string) {
  return value.trim().slice(0, FORUM_BODY_MAX);
}

export function formatBoardTime(iso: string) {
  if (!iso) {
    return "";
  }
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function replyCount(thread: ForumThread) {
  return thread.posts.slice(1).filter((post) => !post.hiddenAt).length;
}

export function lastVisiblePost(thread: ForumThread, innkeeper: boolean) {
  const posts = visibleForumPosts(thread, innkeeper);
  return posts[posts.length - 1];
}

export function forumSummary(threads: ForumThread[], forumId: string, innkeeper: boolean) {
  const list = threadsInForum(threads, forumId, innkeeper);
  const latest = list[0];
  const posts = list.reduce((count, thread) => count + visibleForumPosts(thread, false).length, 0);
  return { topics: list.length, posts, latest };
}

export function threadForEvent(threads: ForumThread[], event: { slug: string; threadSlug?: string }) {
  if (event.threadSlug) {
    const match = threads.find((thread) => thread.slug === event.threadSlug);
    if (match) {
      return match;
    }
  }
  return threads.find((thread) => thread.eventSlug === event.slug);
}

export function eventDiscussionBody(title: string, description: string) {
  const details = description.trim();
  return [
    `This topic is for ${title}. Sign up and see the roster on the event page.`,
    details ? `\n${details}` : "",
  ]
    .join("")
    .trim();
}
