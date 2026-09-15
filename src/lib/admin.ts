import { createHmac } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "we_admin";

function secret() {
  return process.env.ADMIN_PASSWORD || "";
}

function tokenFor(password: string) {
  return createHmac("sha256", "warcraft-events-admin").update(password).digest("hex");
}

export function isAdminConfigured() {
  return secret().length > 0;
}

export async function isAdmin() {
  const password = secret();
  if (!password) {
    return false;
  }
  const jar = await cookies();
  return jar.get(COOKIE)?.value === tokenFor(password);
}

export async function loginAdmin(password: string) {
  if (!secret() || password !== secret()) {
    return false;
  }
  const jar = await cookies();
  jar.set(COOKIE, tokenFor(password), {
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
