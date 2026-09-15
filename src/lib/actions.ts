"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin, loginAdmin, logoutAdmin } from "./admin";
import { applyWinner, buildSingleElim } from "./brackets";
import { ingestArdu1 } from "./ard";
import { getStore, updateStore } from "./store";

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "event"}-${randomBytes(3).toString("hex")}`;
}

export async function submitEvent(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  if (!title) {
    return { error: "Title is required." };
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
      format: String(formData.get("format") || "").trim(),
      startsAt: String(formData.get("startsAt") || new Date().toISOString()),
      endsAt: String(formData.get("endsAt") || ""),
      region: String(formData.get("region") || "").trim(),
      location: String(formData.get("location") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      contact: String(formData.get("contact") || "").trim(),
      status: "pending",
      editKey,
      whiteboard: "",
      teams: [],
      rounds: [],
      createdAt: new Date().toISOString(),
    });
  });
  revalidatePath("/events");
  revalidatePath("/");
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
  const store = await getStore();
  const event = store.events.find((item) => item.slug === slug);
  if (!event) {
    return { error: "Event not found." };
  }
  const admin = await isAdmin();
  if (!admin && event.editKey !== editKey) {
    return { error: "Edit key required." };
  }
  const teams = teamsText
    .split(/\r?\n|,/)
    .map((line) => line.trim())
    .filter(Boolean);
  await updateStore((data) => {
    const target = data.events.find((item) => item.slug === slug);
    if (!target) {
      return;
    }
    target.whiteboard = whiteboard;
    target.teams = teams;
    target.rounds = buildSingleElim(teams);
  });
  revalidatePath(`/events/${slug}`);
  return { ok: true };
}

export async function setMatchWinner(slug: string, editKey: string, matchId: string, winner: string) {
  const store = await getStore();
  const event = store.events.find((item) => item.slug === slug);
  if (!event) {
    return { error: "Event not found." };
  }
  const admin = await isAdmin();
  if (!admin && event.editKey !== editKey) {
    return { error: "Edit key required." };
  }
  await updateStore((data) => {
    const target = data.events.find((item) => item.slug === slug);
    if (!target) {
      return;
    }
    target.rounds = applyWinner(target.rounds, matchId, winner);
  });
  revalidatePath(`/events/${slug}`);
  return { ok: true };
}

export async function uploadLadderJson(jsonText: string) {
  const parsed = JSON.parse(jsonText) as unknown;
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
