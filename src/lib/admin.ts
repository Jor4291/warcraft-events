import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getSessionUser, isHubAccount } from "./auth";

const COOKIE = "we_admin";

function password() {
  return process.env.ADMIN_PASSWORD || "";
}

function hmacSecret() {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "warcraft-events-dev";
}

function tokenFor(value: string) {
  return createHmac("sha256", hmacSecret()).update(value).digest("hex");
}

function tokensMatch(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isAdminConfigured() {
  return password().length > 0;
}

export async function isAdmin() {
  const expected = password();
  if (!expected) {
    return false;
  }
  const jar = await cookies();
  const got = jar.get(COOKIE)?.value || "";
  if (!got) {
    return false;
  }
  return tokensMatch(got, tokenFor(expected));
}

export async function isInnkeeper() {
  if (await isAdmin()) {
    return true;
  }
  const user = await getSessionUser();
  return Boolean(user && isHubAccount(user.displayName, user.isHub));
}

export async function loginAdmin(candidate: string) {
  const expected = password();
  if (!expected || !tokensMatch(tokenFor(candidate), tokenFor(expected))) {
    return false;
  }
  const jar = await cookies();
  jar.set(COOKIE, tokenFor(expected), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return true;
}

export async function logoutAdmin() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
