"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isInnkeeper, loginAdmin, logoutAdmin } from "./admin";
import { getSessionUser, hashUploadToken, hubNameList, isHubAccount, loginUser, logoutUser, registerUser } from "./auth";
import { applyWinner, buildSingleElim } from "./brackets";
import { ingestArdu1 } from "./ard";
import { applyPlayerIdentity, recomputeLadder, shouldConfirm } from "./rating";
import { canManageEvent, isEventOwner } from "./event-access";
import { makeNotice, nightsForUser, pushNotice, soonNightIds } from "./notices";
import { clipForumBody, clipForumTitle, eventDiscussionBody, FORUM_BODY_MAX, FORUM_TITLE_MAX, forumPath, isForumId, topicPath } from "./forum";
import { conductBlock } from "./conduct";
import {
  banBlock,
  boardBlock,
  hostBlock,
  isSanctionKind,
  normalizeSanctions,
  sanctionExpiry,
  sanctionInForce,
  SANCTION_REASON_MAX,
} from "./moderation";
import { canonicalPlayerName } from "./player-name";
import { getStore, updateStore } from "./store";
import type { EventRecord, ForumThread, SignupMode } from "./types";
import {
  collectSignupAnswers,
  confirmedSignups,
  eventIsFull,
  parseSignupCap,
  parseSignupFieldsJson,
} from "./signup-form";
import { parseEventLinksJson } from "./event-links";

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "event"}-${randomBytes(3).toString("hex")}`;
}

function makeTopic(input: {
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  forumId: string;
  eventSlug?: string;
}): ForumThread {
  const now = new Date().toISOString();
  return {
    id: randomBytes(6).toString("hex"),
    slug: slugify(input.title).replace(/^event-/, "thread-"),
    forumId: isForumId(input.forumId) ? input.forumId : "general",
    eventSlug: input.eventSlug || "",
    title: clipForumTitle(input.title),
    authorId: input.authorId,
    authorName: input.authorName,
    createdAt: now,
    updatedAt: now,
    lockedAt: "",
    hiddenAt: "",
    posts: [
      {
        id: randomBytes(6).toString("hex"),
        authorId: input.authorId,
        authorName: input.authorName,
        body: clipForumBody(input.body),
        createdAt: now,
        hiddenAt: "",
      },
    ],
  };
}

function parseTeams(teamsText: string) {
  return teamsText
    .split(/\r?\n|,/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function signupModeOf(value: FormDataEntryValue | null): SignupMode {
  return String(value || "") === "invite" ? "invite" : "open";
}

function revalidateEvent(event: EventRecord) {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/account");
  revalidatePath(`/events/${event.slug}`);
  if (event.kind === "bracket") {
    revalidatePath("/bracket");
    revalidatePath(`/bracket/${event.slug}`);
  }
}

async function findManageable(slug: string) {
  const store = await getStore();
  const event = store.events.find((item) => item.slug === slug);
  if (!event) {
    return { error: "Event not found." };
  }
  if (!(await canManageEvent(event))) {
    return { error: "You cannot edit this board." };
  }
  const user = await getSessionUser();
  const barred = user ? banBlock(user) : "";
  if (barred) {
    return { error: barred };
  }
  return { event };
}

async function findOwned(slug: string) {
  const found = await findManageable(slug);
  if ("error" in found) {
    return found;
  }
  if (!(await isEventOwner(found.event))) {
    return { error: "Only the host can change co-hosts." as const };
  }
  return found;
}

function revalidateBoard(slug?: string, forumId?: string, eventSlug?: string) {
  revalidatePath("/board");
  if (forumId) {
    revalidatePath(forumPath(forumId));
  }
  if (slug) {
    revalidatePath(topicPath(slug));
    revalidatePath(`/board/${slug}`);
  }
  if (eventSlug) {
    revalidatePath(`/events/${eventSlug}`);
  }
}

function checkboxOn(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function eventCopyBlock(formData: FormData, fallbackContact = "") {
  const fields = parseSignupFieldsJson(formData.get("signupFieldsJson"));
  const links = parseEventLinksJson(formData.get("linksJson"));
  return conductBlock(
    String(formData.get("title") || ""),
    String(formData.get("description") || ""),
    String(formData.get("contact") || fallbackContact),
    String(formData.get("location") || ""),
    String(formData.get("format") || ""),
    String(formData.get("game") || ""),
    ...fields.map((field) => field.label),
    ...fields.flatMap((field) => field.options),
    ...links.map((link) => link.label),
  );
}

function promoteNextWaitlisted(event: EventRecord) {
  if (eventIsFull(event)) {
    return undefined;
  }
  const next = event.signups.find((signup) => signup.waitlisted);
  if (!next) {
    return undefined;
  }
  next.waitlisted = false;
  return next;
}

export async function registerAccount(formData: FormData) {
  const result = await registerUser(
    String(formData.get("email") || ""),
    String(formData.get("password") || ""),
    String(formData.get("displayName") || ""),
  );
  if ("error" in result && result.error) {
    return { error: result.error };
  }
  redirect("/account");
}

export async function loginAccount(formData: FormData) {
  const result = await loginUser(String(formData.get("email") || ""), String(formData.get("password") || ""));
  if ("error" in result && result.error) {
    return { error: result.error };
  }
  const next = String(formData.get("next") || "/account");
  redirect(next.startsWith("/") ? next : "/account");
}

export async function logoutAccount() {
  await logoutUser();
  redirect("/");
}

export async function generateUploadToken() {
  const user = await getSessionUser();
  if (!user) {
    return { error: "Sign in to create an uploader key." };
  }
  const token = `weu_${randomBytes(24).toString("hex")}`;
  const isHub = hubNameList().includes(canonicalPlayerName(user.displayName) || user.displayName.trim().toLowerCase());
  await updateStore((data) => {
    const target = data.users.find((item) => item.id === user.id);
    if (!target) {
      return;
    }
    target.uploadTokenHash = hashUploadToken(token);
    target.isHub = isHub;
  });
  revalidatePath("/account");
  return { token, isHub };
}

export async function submitEvent(formData: FormData) {
  const user = await getSessionUser();
  if (!user) {
    return { error: "Sign in to book an event." };
  }
  const barred = hostBlock(user);
  if (barred) {
    return { error: barred };
  }
  const title = String(formData.get("title") || "").trim();
  if (!title) {
    return { error: "Title is required." };
  }
  const description = String(formData.get("description") || "").trim();
  const blocked = eventCopyBlock(formData, user.displayName);
  if (blocked) {
    return { error: blocked };
  }
  const id = randomBytes(6).toString("hex");
  const editKey = randomBytes(8).toString("hex");
  const inviteCode = randomBytes(4).toString("hex").toUpperCase();
  const slug = slugify(title);
  const mode = signupModeOf(formData.get("signupMode"));
  const topic = makeTopic({
    title,
    body: eventDiscussionBody(title, description),
    authorId: user.id,
    authorName: user.displayName,
    forumId: "events",
    eventSlug: slug,
  });
  await updateStore((data) => {
    data.events.unshift({
      id,
      slug,
      title,
      game: String(formData.get("game") || "WoW:Forever").trim(),
      format: String(formData.get("format") || "").trim(),
      startsAt: String(formData.get("startsAt") || ""),
      endsAt: String(formData.get("endsAt") || ""),
      region: String(formData.get("region") || "").trim(),
      location: String(formData.get("location") || "").trim(),
      description,
      links: parseEventLinksJson(formData.get("linksJson")),
      contact: String(formData.get("contact") || user.displayName).trim(),
      status: "published",
      kind: "calendar",
      ownerId: user.id,
      signupMode: mode,
      inviteCode,
      signupCap: parseSignupCap(formData.get("signupCap")),
      signupFields: parseSignupFieldsJson(formData.get("signupFieldsJson")),
      waitlistEnabled: checkboxOn(formData, "waitlistEnabled"),
      rosterPublic: checkboxOn(formData, "rosterPublic"),
      coHosts: [],
      signups: [],
      cancelledAt: "",
      editKey,
      whiteboard: "",
      teams: [],
      rounds: [],
      threadSlug: topic.slug,
      createdAt: new Date().toISOString(),
    });
    data.threads.unshift(topic);
  });
  revalidatePath("/events");
  revalidatePath("/");
  revalidatePath("/account");
  revalidateBoard(topic.slug, topic.forumId, slug);
  return { slug, inviteCode, signupMode: mode };
}

export async function updateEvent(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const found = await findManageable(slug);
  if ("error" in found) {
    return found;
  }
  const title = String(formData.get("title") || "").trim();
  if (!title) {
    return { error: "Title is required." };
  }
  const blocked = eventCopyBlock(formData);
  if (blocked) {
    return { error: blocked };
  }
  await updateStore((data) => {
    const target = data.events.find((item) => item.slug === slug);
    if (!target) {
      return;
    }
    target.title = title;
    target.game = String(formData.get("game") || target.game).trim();
    target.format = String(formData.get("format") || "").trim();
    target.startsAt = String(formData.get("startsAt") || "");
    target.endsAt = String(formData.get("endsAt") || "");
    target.region = String(formData.get("region") || "").trim();
    target.location = String(formData.get("location") || "").trim();
    target.description = String(formData.get("description") || "").trim();
    target.links = parseEventLinksJson(formData.get("linksJson"));
    target.contact = String(formData.get("contact") || "").trim();
    target.signupMode = signupModeOf(formData.get("signupMode"));
    target.signupCap = parseSignupCap(formData.get("signupCap"));
    target.signupFields = parseSignupFieldsJson(formData.get("signupFieldsJson"));
    target.waitlistEnabled = checkboxOn(formData, "waitlistEnabled");
    target.rosterPublic = checkboxOn(formData, "rosterPublic");
  });
  revalidateEvent(found.event);
  return { ok: true as const };
}

export async function cancelEvent(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const found = await findManageable(slug);
  if ("error" in found) {
    return found;
  }
  await updateStore((data) => {
    const target = data.events.find((item) => item.slug === slug);
    if (!target) {
      return;
    }
    target.cancelledAt = new Date().toISOString();
    const notified = new Set<string>();
    for (const signup of target.signups) {
      if (!signup.userId || notified.has(signup.userId)) {
        continue;
      }
      notified.add(signup.userId);
      pushNotice(data.users, signup.userId, makeNotice("cancelled", target));
    }
  });
  revalidateEvent(found.event);
  return { ok: true as const };
}

export async function rsvpEvent(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const name = String(formData.get("name") || "").trim();
  const inviteCode = String(formData.get("inviteCode") || "").trim().toUpperCase();
  if (!name) {
    return { error: "A character or player name is required." };
  }
  const nameBlocked = conductBlock(name);
  if (nameBlocked) {
    return { error: nameBlocked };
  }
  const user = await getSessionUser();
  const barred = user ? banBlock(user) : "";
  if (barred) {
    return { error: barred };
  }
  const store = await getStore();
  const event = store.events.find((item) => item.slug === slug);
  if (!event || event.status !== "published" || event.kind !== "calendar") {
    return { error: "Event not found." };
  }
  if (event.cancelledAt) {
    return { error: "This event was cancelled." };
  }
  if (event.signupMode === "invite" && inviteCode !== event.inviteCode) {
    return { error: "That invite code does not match." };
  }
  const collected = collectSignupAnswers(event.signupFields, formData);
  if (collected.error) {
    return { error: collected.error };
  }
  let error = "";
  let waitlisted = false;
  await updateStore((data) => {
    const target = data.events.find((item) => item.slug === slug);
    if (!target) {
      error = "Event not found.";
      return;
    }
    if (target.signups.some((signup) => signup.name.toLowerCase() === name.toLowerCase())) {
      error = "That name is already on the list.";
      return;
    }
    waitlisted = eventIsFull(target);
    if (waitlisted && !target.waitlistEnabled) {
      error = "The event sign-ups are filled.";
      return;
    }
    target.signups.push({
      id: randomBytes(4).toString("hex"),
      name,
      userId: user?.id || "",
      createdAt: new Date().toISOString(),
      answers: collected.answers,
      waitlisted,
      checkedIn: false,
    });
    if (user) {
      pushNotice(data.users, user.id, makeNotice(waitlisted ? "waitlist" : "signup", target));
    }
  });
  if (error) {
    return { error };
  }
  revalidatePath("/", "layout");
  revalidatePath("/account");
  revalidatePath(`/events/${slug}`);
  return { ok: true as const, waitlisted };
}

export async function removeSignup(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const signupId = String(formData.get("signupId") || "");
  const found = await findManageable(slug);
  if ("error" in found) {
    return found;
  }
  await updateStore((data) => {
    const target = data.events.find((item) => item.slug === slug);
    if (!target) {
      return;
    }
    const removed = target.signups.find((signup) => signup.id === signupId);
    target.signups = target.signups.filter((signup) => signup.id !== signupId);
    if (removed?.userId) {
      pushNotice(data.users, removed.userId, makeNotice("removed", target));
    }
    if (removed && !removed.waitlisted) {
      const promoted = promoteNextWaitlisted(target);
      if (promoted?.userId) {
        pushNotice(data.users, promoted.userId, makeNotice("promoted", target));
      }
    }
  });
  revalidatePath("/", "layout");
  revalidatePath("/account");
  revalidatePath(`/events/${slug}`);
  return { ok: true as const };
}

export async function leaveEvent(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const signupId = String(formData.get("signupId") || "");
  const user = await getSessionUser();
  if (!user) {
    return { error: "Sign in to leave this event." };
  }
  const store = await getStore();
  const event = store.events.find((item) => item.slug === slug && item.kind === "calendar");
  if (!event) {
    return { error: "Event not found." };
  }
  const mine = event.signups.find((signup) => signup.id === signupId && signup.userId === user.id);
  if (!mine) {
    return { error: "You are not on this list." };
  }
  await updateStore((data) => {
    const target = data.events.find((item) => item.slug === slug);
    if (!target) {
      return;
    }
    const removed = target.signups.find((signup) => signup.id === signupId && signup.userId === user.id);
    target.signups = target.signups.filter((signup) => signup.id !== signupId);
    if (removed && !removed.waitlisted) {
      const promoted = promoteNextWaitlisted(target);
      if (promoted?.userId) {
        pushNotice(data.users, promoted.userId, makeNotice("promoted", target));
      }
    }
  });
  revalidatePath("/", "layout");
  revalidatePath("/account");
  revalidatePath(`/events/${slug}`);
  return { ok: true as const };
}

export async function markNoticesRead() {
  const user = await getSessionUser();
  if (!user) {
    return { ok: true as const };
  }
  const now = new Date().toISOString();
  await updateStore((data) => {
    const target = data.users.find((item) => item.id === user.id);
    if (!target) {
      return;
    }
    for (const notice of target.notifications) {
      if (!notice.readAt) {
        notice.readAt = now;
      }
    }
    const soonIds = soonNightIds(nightsForUser(user.id, data.events));
    target.seenSoonIds = [...new Set([...target.seenSoonIds, ...soonIds])];
  });
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function promoteWaitlist(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const signupId = String(formData.get("signupId") || "");
  const found = await findManageable(slug);
  if ("error" in found) {
    return found;
  }
  let error = "";
  await updateStore((data) => {
    const target = data.events.find((item) => item.slug === slug);
    const signup = target?.signups.find((item) => item.id === signupId);
    if (!target || !signup) {
      error = "Sign-up not found.";
      return;
    }
    if (!signup.waitlisted) {
      return;
    }
    if (eventIsFull(target)) {
      error = "The roster is still full. Raise the cap or remove someone first.";
      return;
    }
    signup.waitlisted = false;
    if (signup.userId) {
      pushNotice(data.users, signup.userId, makeNotice("promoted", target));
    }
  });
  if (error) {
    return { error };
  }
  revalidatePath("/", "layout");
  revalidatePath("/account");
  revalidatePath(`/events/${slug}`);
  return { ok: true as const };
}

export async function toggleCheckIn(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const signupId = String(formData.get("signupId") || "");
  const found = await findManageable(slug);
  if ("error" in found) {
    return found;
  }
  await updateStore((data) => {
    const signup = data.events.find((item) => item.slug === slug)?.signups.find((item) => item.id === signupId);
    if (signup && !signup.waitlisted) {
      signup.checkedIn = !signup.checkedIn;
    }
  });
  revalidatePath(`/events/${slug}`);
  return { ok: true as const };
}

export async function addCoHost(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const query = String(formData.get("email") || "").trim();
  const found = await findOwned(slug);
  if ("error" in found) {
    return found;
  }
  if (!query) {
    return { error: "Enter their account email or display name." };
  }
  const store = await getStore();
  const byEmail = store.users.find((user) => user.email.toLowerCase() === query.toLowerCase());
  const byName = store.users.filter((user) => user.displayName.toLowerCase() === query.toLowerCase());
  const user = byEmail || (byName.length === 1 ? byName[0] : undefined);
  if (!user) {
    if (byName.length > 1) {
      return { error: "Several accounts share that name. Use their email." };
    }
    return { error: "No account with that email or name. They need to register first." };
  }
  if (user.id === found.event.ownerId) {
    return { error: "That's already the host." };
  }
  if (found.event.coHosts.some((host) => host.userId === user.id)) {
    return { error: "They're already a co-host." };
  }
  await updateStore((data) => {
    const target = data.events.find((item) => item.slug === slug);
    if (!target || target.coHosts.some((host) => host.userId === user.id)) {
      return;
    }
    target.coHosts.push({
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
    });
  });
  revalidateEvent(found.event);
  return { ok: true as const };
}

export async function removeCoHost(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const userId = String(formData.get("userId") || "");
  const found = await findOwned(slug);
  if ("error" in found) {
    return found;
  }
  await updateStore((data) => {
    const target = data.events.find((item) => item.slug === slug);
    if (target) {
      target.coHosts = target.coHosts.filter((host) => host.userId !== userId);
    }
  });
  revalidateEvent(found.event);
  return { ok: true as const };
}

export async function sendSignupsToBracket(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const found = await findManageable(slug);
  if ("error" in found) {
    return found;
  }
  const teams = confirmedSignups(found.event).map((signup) => signup.name);
  if (teams.length < 2) {
    return { error: "Add at least two names on the roster." };
  }
  await updateStore((data) => {
    const target = data.events.find((item) => item.slug === slug);
    if (!target) {
      return;
    }
    target.teams = teams;
    target.rounds = buildSingleElim(teams);
  });
  revalidateEvent(found.event);
  return { ok: true as const };
}

export async function duplicateEvent(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const found = await findManageable(slug);
  if ("error" in found) {
    return found;
  }
  const source = found.event;
  const user = await getSessionUser();
  const barred = user ? hostBlock(user) : "";
  if (barred) {
    return { error: barred };
  }
  const id = randomBytes(6).toString("hex");
  const nextEditKey = randomBytes(8).toString("hex");
  const inviteCode = randomBytes(4).toString("hex").toUpperCase();
  const nextSlug = slugify(`${source.title} copy`);
  const userName = user?.displayName || source.contact || "Host";
  const topic = makeTopic({
    title: `${source.title} (copy)`,
    body: eventDiscussionBody(`${source.title} (copy)`, source.description),
    authorId: user?.id || source.ownerId,
    authorName: userName,
    forumId: "events",
    eventSlug: nextSlug,
  });
  await updateStore((data) => {
    data.events.unshift({
      id,
      slug: nextSlug,
      title: `${source.title} (copy)`,
      game: source.game,
      format: source.format,
      startsAt: source.startsAt,
      endsAt: source.endsAt,
      region: source.region,
      location: source.location,
      description: source.description,
      links: source.links,
      contact: source.contact,
      status: "published",
      kind: source.kind,
      ownerId: user?.id || source.ownerId,
      signupMode: source.signupMode,
      inviteCode,
      signupCap: source.signupCap,
      signupFields: source.signupFields,
      waitlistEnabled: source.waitlistEnabled,
      rosterPublic: source.rosterPublic,
      coHosts: [],
      signups: [],
      cancelledAt: "",
      editKey: nextEditKey,
      whiteboard: "",
      teams: [],
      rounds: [],
      threadSlug: topic.slug,
      createdAt: new Date().toISOString(),
    });
    data.threads.unshift(topic);
  });
  revalidatePath("/events");
  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath(`/events/${nextSlug}`);
  revalidateBoard(topic.slug, topic.forumId, nextSlug);
  return { slug: nextSlug, inviteCode };
}

export async function createStandaloneBracket(formData: FormData) {
  const user = await getSessionUser();
  if (!user) {
    return { error: "Sign in to hang a bracket." };
  }
  const barred = hostBlock(user);
  if (barred) {
    return { error: barred };
  }
  const title = String(formData.get("title") || "").trim() || "Impromptu bracket";
  const teams = parseTeams(String(formData.get("teams") || ""));
  if (teams.length < 2) {
    return { error: "Add at least two names." };
  }
  const blocked = conductBlock(title, ...teams);
  if (blocked) {
    return { error: blocked };
  }
  const id = randomBytes(6).toString("hex");
  const editKey = randomBytes(8).toString("hex");
  const slug = slugify(title);
  await updateStore((data) => {
    data.events.unshift({
      id,
      slug,
      title,
      game: String(formData.get("game") || "WoW:Forever").trim(),
      format: "Single elimination",
      startsAt: new Date().toISOString(),
      endsAt: "",
      region: "",
      location: "",
      description: "Standalone bracket — not listed on the calendar.",
      links: [],
      contact: user.displayName,
      status: "published",
      kind: "bracket",
      ownerId: user.id,
      signupMode: "open",
      inviteCode: "",
      signupCap: 0,
      signupFields: [],
      waitlistEnabled: true,
      rosterPublic: true,
      coHosts: [],
      signups: [],
      cancelledAt: "",
      editKey,
      whiteboard: "",
      teams,
      rounds: buildSingleElim(teams),
      threadSlug: "",
      createdAt: new Date().toISOString(),
    });
  });
  revalidatePath("/bracket");
  revalidatePath("/account");
  return { slug };
}

export async function moderateEvent(id: string, status: "published" | "rejected") {
  if (!(await isInnkeeper())) {
    return;
  }
  await updateStore((data) => {
    const event = data.events.find((item) => item.id === id);
    if (event) {
      event.status = status;
    }
  });
  revalidatePath("/events");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function saveWhiteboard(slug: string, editKey: string, whiteboard: string, teamsText: string) {
  const found = await findManageable(slug);
  if ("error" in found) {
    return found;
  }
  const teams = parseTeams(teamsText);
  const blocked = conductBlock(whiteboard, ...teams);
  if (blocked) {
    return { error: blocked };
  }
  await updateStore((data) => {
    const target = data.events.find((item) => item.slug === slug);
    if (!target) {
      return;
    }
    target.whiteboard = whiteboard;
    target.teams = teams;
    target.rounds = buildSingleElim(teams);
  });
  revalidateEvent(found.event);
  return { ok: true as const };
}

export async function setMatchWinner(slug: string, editKey: string, matchId: string, winner: string) {
  const found = await findManageable(slug);
  if ("error" in found) {
    return found;
  }
  await updateStore((data) => {
    const target = data.events.find((item) => item.slug === slug);
    if (!target) {
      return;
    }
    target.rounds = applyWinner(target.rounds, matchId, winner);
  });
  revalidateEvent(found.event);
  return { ok: true as const };
}

export async function uploadLadderJson(jsonText: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(
      "That doesn't look like a duel log. In game, type /ard upload, copy everything it prints, and paste it here.",
    );
  }
  const result = await ingestArdu1(parsed);
  revalidatePath("/ladder");
  revalidatePath("/");
  return result;
}

export async function adminLogin(formData: FormData) {
  const password = String(formData.get("password") || "");
  const ok = await loginAdmin(password);
  if (!ok) {
    redirect("/admin?error=1");
  }
  redirect("/admin");
}

export async function adminLogout() {
  await logoutAdmin();
  redirect("/admin");
}

export async function moderateLadderMatch(matchId: string, decision: "approved" | "denied") {
  if (!(await isInnkeeper())) {
    return;
  }
  await updateStore((data) => {
    const match = data.matches.find((item) => item.matchId === matchId);
    if (!match || match.confirmed) {
      return;
    }
    if (decision === "approved") {
      const exportedAt = Math.floor(Date.now() / 1000);
      if (!match.reports.some((report) => report.hub)) {
        match.reports.push({ reporter: "Innkeeper", hub: true, exportedAt });
      }
      match.deniedAt = "";
      match.confirmed = shouldConfirm(match.reports);
      const previousPlayers = data.players;
      data.players = recomputeLadder(data.matches);
      applyPlayerIdentity(data.players, previousPlayers);
      return;
    }
    match.deniedAt = new Date().toISOString();
    match.confirmed = false;
  });
  revalidatePath("/admin");
  revalidatePath("/ladder");
  revalidatePath("/");
}

export async function createForumThread(formData: FormData) {
  const user = await getSessionUser();
  if (!user) {
    return { error: "Sign in to start a topic." };
  }
  const barred = boardBlock(user);
  if (barred) {
    return { error: barred };
  }
  const title = clipForumTitle(String(formData.get("title") || ""));
  const body = clipForumBody(String(formData.get("body") || ""));
  const forumId = String(formData.get("forumId") || "general");
  if (!title) {
    return { error: "Give the topic a title." };
  }
  if (!body) {
    return { error: "Write a first post." };
  }
  if (title.length > FORUM_TITLE_MAX || body.length > FORUM_BODY_MAX) {
    return { error: "That post is too long." };
  }
  const blocked = conductBlock(title, body);
  if (blocked) {
    return { error: blocked };
  }
  const topic = makeTopic({
    title,
    body,
    authorId: user.id,
    authorName: user.displayName,
    forumId,
  });
  await updateStore((data) => {
    data.threads.unshift(topic);
  });
  revalidateBoard(topic.slug, topic.forumId);
  redirect(topicPath(topic.slug));
}

export async function replyToForumThread(formData: FormData) {
  const user = await getSessionUser();
  if (!user) {
    return { error: "Sign in to reply." };
  }
  const barred = boardBlock(user);
  if (barred) {
    return { error: barred };
  }
  const slug = String(formData.get("slug") || "");
  const body = clipForumBody(String(formData.get("body") || ""));
  if (!slug) {
    return { error: "Thread not found." };
  }
  if (!body) {
    return { error: "Write a reply." };
  }
  const blocked = conductBlock(body);
  if (blocked) {
    return { error: blocked };
  }
  const store = await getStore();
  const thread = store.threads.find((item) => item.slug === slug);
  if (!thread || thread.hiddenAt) {
    return { error: "Topic not found." };
  }
  if (thread.lockedAt) {
    return { error: "This topic is locked." };
  }
  const now = new Date().toISOString();
  await updateStore((data) => {
    const target = data.threads.find((item) => item.slug === slug);
    if (!target || target.lockedAt || target.hiddenAt) {
      return;
    }
    target.posts.push({
      id: randomBytes(6).toString("hex"),
      authorId: user.id,
      authorName: user.displayName,
      body,
      createdAt: now,
      hiddenAt: "",
    });
    target.updatedAt = now;
  });
  revalidateBoard(slug, thread.forumId, thread.eventSlug);
  redirect(topicPath(slug));
}

export async function moderateForumThread(slug: string, decision: "locked" | "unlocked" | "hidden" | "shown") {
  if (!(await isInnkeeper())) {
    return;
  }
  let forumId = "";
  let eventSlug = "";
  await updateStore((data) => {
    const thread = data.threads.find((item) => item.slug === slug);
    if (!thread) {
      return;
    }
    forumId = thread.forumId;
    eventSlug = thread.eventSlug;
    const now = new Date().toISOString();
    if (decision === "locked") {
      thread.lockedAt = now;
    }
    if (decision === "unlocked") {
      thread.lockedAt = "";
    }
    if (decision === "hidden") {
      thread.hiddenAt = now;
    }
    if (decision === "shown") {
      thread.hiddenAt = "";
    }
  });
  revalidateBoard(slug, forumId, eventSlug);
}

export async function moderateForumPost(slug: string, postId: string, decision: "hidden" | "shown") {
  if (!(await isInnkeeper())) {
    return;
  }
  let forumId = "";
  let eventSlug = "";
  await updateStore((data) => {
    const thread = data.threads.find((item) => item.slug === slug);
    const post = thread?.posts.find((item) => item.id === postId);
    if (!thread || !post) {
      return;
    }
    forumId = thread.forumId;
    eventSlug = thread.eventSlug;
    post.hiddenAt = decision === "hidden" ? new Date().toISOString() : "";
  });
  revalidateBoard(slug, forumId, eventSlug);
}

export async function sanctionUser(formData: FormData) {
  if (!(await isInnkeeper())) {
    return { error: "Only the innkeeper can do that." };
  }
  const userId = String(formData.get("userId") || "");
  const kind = String(formData.get("kind") || "");
  if (!isSanctionKind(kind)) {
    return { error: "Pick a mute, a timeout, or a ban." };
  }
  const reason = String(formData.get("reason") || "").trim().slice(0, SANCTION_REASON_MAX);
  const expiresAt = sanctionExpiry(kind === "ban" ? "open" : String(formData.get("length") || "open"));
  const purge = checkboxOn(formData, "purgePosts");
  const by = (await getSessionUser())?.displayName || "The innkeeper";
  const now = new Date().toISOString();
  let error = "";
  let hidden = 0;
  await updateStore((data) => {
    const target = data.users.find((item) => item.id === userId);
    if (!target) {
      error = "That account is gone.";
      return;
    }
    if (isHubAccount(target.displayName, target.isHub)) {
      error = "Innkeeper accounts cannot be restricted.";
      return;
    }
    target.sanctions = [
      { id: randomBytes(6).toString("hex"), kind, reason, by, createdAt: now, expiresAt, liftedAt: "" },
      ...normalizeSanctions(target.sanctions).map((sanction) =>
        sanctionInForce(sanction) ? { ...sanction, liftedAt: now } : sanction,
      ),
    ];
    if (!purge) {
      return;
    }
    for (const thread of data.threads) {
      if (thread.authorId === userId && !thread.hiddenAt) {
        thread.hiddenAt = now;
      }
      for (const post of thread.posts) {
        if (post.authorId === userId && !post.hiddenAt) {
          post.hiddenAt = now;
          hidden += 1;
        }
      }
    }
  });
  if (error) {
    return { error };
  }
  revalidatePath("/admin");
  revalidatePath("/account");
  revalidateBoard();
  return { ok: true as const, hidden };
}

export async function liftSanction(userId: string) {
  if (!(await isInnkeeper())) {
    return;
  }
  const now = new Date().toISOString();
  await updateStore((data) => {
    const target = data.users.find((item) => item.id === userId);
    if (!target) {
      return;
    }
    target.sanctions = normalizeSanctions(target.sanctions).map((sanction) =>
      sanctionInForce(sanction) ? { ...sanction, liftedAt: now } : sanction,
    );
  });
  revalidatePath("/admin");
  revalidatePath("/account");
  revalidateBoard();
}

export async function renameAccount(formData: FormData) {
  if (!(await isInnkeeper())) {
    return { error: "Only the innkeeper can do that." };
  }
  const userId = String(formData.get("userId") || "");
  const name = String(formData.get("displayName") || "").trim();
  if (name.length < 2) {
    return { error: "Give them a name that can stand on the board." };
  }
  const blocked = conductBlock(name);
  if (blocked) {
    return { error: blocked };
  }
  const scrubRoster = checkboxOn(formData, "scrubRoster");
  let error = "";
  await updateStore((data) => {
    const target = data.users.find((item) => item.id === userId);
    if (!target) {
      error = "That account is gone.";
      return;
    }
    if (isHubAccount(target.displayName, target.isHub)) {
      error = "Innkeeper accounts keep their names.";
      return;
    }
    const previous = target.displayName;
    target.displayName = name;
    for (const event of data.events) {
      if (event.contact === previous) {
        event.contact = name;
      }
      for (const host of event.coHosts) {
        if (host.userId === userId) {
          host.displayName = name;
        }
      }
      if (scrubRoster) {
        for (const signup of event.signups) {
          if (signup.userId === userId || signup.name === previous) {
            signup.name = name;
          }
        }
      }
    }
    for (const thread of data.threads) {
      if (thread.authorId === userId) {
        thread.authorName = name;
      }
      for (const post of thread.posts) {
        if (post.authorId === userId) {
          post.authorName = name;
        }
      }
    }
  });
  if (error) {
    return { error };
  }
  revalidatePath("/", "layout");
  revalidatePath("/admin");
  revalidatePath("/account");
  revalidateBoard();
  return { ok: true as const };
}

export async function openEventDiscussion(formData: FormData) {
  const user = await getSessionUser();
  if (!user) {
    return { error: "Sign in to start a discussion." };
  }
  const barred = boardBlock(user);
  if (barred) {
    return { error: barred };
  }
  const slug = String(formData.get("slug") || "");
  const store = await getStore();
  const event = store.events.find((item) => item.slug === slug && item.kind === "calendar");
  if (!event || event.status !== "published") {
    return { error: "Event not found." };
  }
  const existing = store.threads.find((item) => item.slug === event.threadSlug || item.eventSlug === event.slug);
  if (existing && !existing.hiddenAt) {
    redirect(topicPath(existing.slug));
  }
  const topic = makeTopic({
    title: event.title,
    body: eventDiscussionBody(event.title, event.description),
    authorId: user.id,
    authorName: user.displayName,
    forumId: "events",
    eventSlug: event.slug,
  });
  await updateStore((data) => {
    const target = data.events.find((item) => item.slug === slug);
    if (target) {
      target.threadSlug = topic.slug;
    }
    data.threads.unshift(topic);
  });
  revalidateBoard(topic.slug, topic.forumId, event.slug);
  redirect(topicPath(topic.slug));
}
