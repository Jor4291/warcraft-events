"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin, loginAdmin, logoutAdmin } from "./admin";
import { getSessionUser, hashUploadToken, hubNameList, loginUser, logoutUser, registerUser } from "./auth";
import { applyWinner, buildSingleElim } from "./brackets";
import { ingestArdu1 } from "./ard";
import { canManageEvent } from "./event-access";
import { canonicalPlayerName } from "./player-name";
import { getStore, updateStore } from "./store";
import type { EventRecord, SignupMode } from "./types";

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "event"}-${randomBytes(3).toString("hex")}`;
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
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/account");
  revalidatePath(`/events/${event.slug}`);
  if (event.kind === "bracket") {
    revalidatePath("/bracket");
    revalidatePath(`/bracket/${event.slug}`);
  }
}

async function findManageable(slug: string, editKey: string) {
  const store = await getStore();
  const event = store.events.find((item) => item.slug === slug);
  if (!event) {
    return { error: "Event not found." as const };
  }
  if (!(await canManageEvent(event, editKey))) {
    return { error: "You cannot edit this board." as const };
  }
  return { event };
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
  const title = String(formData.get("title") || "").trim();
  if (!title) {
    return { error: "Title is required." };
  }
  const id = randomBytes(6).toString("hex");
  const editKey = randomBytes(8).toString("hex");
  const inviteCode = randomBytes(4).toString("hex").toUpperCase();
  const slug = slugify(title);
  const mode = signupModeOf(formData.get("signupMode"));
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
      description: String(formData.get("description") || "").trim(),
      contact: String(formData.get("contact") || user.displayName).trim(),
      status: "published",
      kind: "calendar",
      ownerId: user.id,
      signupMode: mode,
      inviteCode,
      signups: [],
      cancelledAt: "",
      editKey,
      whiteboard: "",
      teams: [],
      rounds: [],
      createdAt: new Date().toISOString(),
    });
  });
  revalidatePath("/events");
  revalidatePath("/");
  revalidatePath("/account");
  return { slug, editKey, inviteCode, signupMode: mode };
}

export async function updateEvent(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const editKey = String(formData.get("editKey") || "");
  const found = await findManageable(slug, editKey);
  if ("error" in found) {
    return found;
  }
  const title = String(formData.get("title") || "").trim();
  if (!title) {
    return { error: "Title is required." };
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
    target.contact = String(formData.get("contact") || "").trim();
    target.signupMode = signupModeOf(formData.get("signupMode"));
  });
  revalidateEvent(found.event);
  return { ok: true as const };
}

export async function cancelEvent(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const editKey = String(formData.get("editKey") || "");
  const found = await findManageable(slug, editKey);
  if ("error" in found) {
    return found;
  }
  await updateStore((data) => {
    const target = data.events.find((item) => item.slug === slug);
    if (target) {
      target.cancelledAt = new Date().toISOString();
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
  const user = await getSessionUser();
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
  if (event.signups.some((signup) => signup.name.toLowerCase() === name.toLowerCase())) {
    return { error: "That name is already on the list." };
  }
  await updateStore((data) => {
    const target = data.events.find((item) => item.slug === slug);
    if (!target) {
      return;
    }
    target.signups.push({
      id: randomBytes(4).toString("hex"),
      name,
      userId: user?.id || "",
      createdAt: new Date().toISOString(),
    });
  });
  revalidatePath(`/events/${slug}`);
  return { ok: true as const };
}

export async function removeSignup(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const signupId = String(formData.get("signupId") || "");
  const editKey = String(formData.get("editKey") || "");
  const found = await findManageable(slug, editKey);
  if ("error" in found) {
    return found;
  }
  await updateStore((data) => {
    const target = data.events.find((item) => item.slug === slug);
    if (target) {
      target.signups = target.signups.filter((signup) => signup.id !== signupId);
    }
  });
  revalidatePath(`/events/${slug}`);
  return { ok: true as const };
}

export async function createStandaloneBracket(formData: FormData) {
  const title = String(formData.get("title") || "").trim() || "Impromptu bracket";
  const teams = parseTeams(String(formData.get("teams") || ""));
  if (teams.length < 2) {
    return { error: "Add at least two names." };
  }
  const user = await getSessionUser();
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
      contact: user?.displayName || "",
      status: "published",
      kind: "bracket",
      ownerId: user?.id || "",
      signupMode: "open",
      inviteCode: "",
      signups: [],
      cancelledAt: "",
      editKey,
      whiteboard: "",
      teams,
      rounds: buildSingleElim(teams),
      createdAt: new Date().toISOString(),
    });
  });
  revalidatePath("/bracket");
  revalidatePath("/account");
  return { slug, editKey };
}

export async function moderateEvent(id: string, status: "published" | "rejected") {
  if (!(await isAdmin())) {
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
  const found = await findManageable(slug, editKey);
  if ("error" in found) {
    return found;
  }
  const teams = parseTeams(teamsText);
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
  const found = await findManageable(slug, editKey);
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
}
