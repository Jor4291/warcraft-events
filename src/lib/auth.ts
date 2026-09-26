import { createHash, createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { isLoopbackIp, requestIp } from "./client-ip";
import { emailBlock, splitEmail } from "./email";
import { CONDUCT_MESSAGE } from "./conduct";
import { refuseWrite, noteUserIp } from "./ip-ban";
import { rememberUserIp } from "./ip-ban-model";
import { sendConfirmCode } from "./mail";
import { restrictionMessage, restrictionOf } from "./moderation";
import { canonicalPlayerName } from "./player-name";
import { getStore, updateStore } from "./store";
import type { PublicUser, UserRecord } from "./types";

const CODE_MS = 20 * 60 * 1000;
const RESEND_WAIT_MS = 60 * 1000;

const COOKIE = "we_user";

function secret() {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "warcraft-events-dev";
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

function verifyPassword(password: string, hash: string, salt: string) {
  const next = scryptSync(password, salt, 64);
  const prev = Buffer.from(hash, "hex");
  return next.length === prev.length && timingSafeEqual(next, prev);
}

function tokenFor(userId: string) {
  const hmac = createHmac("sha256", secret()).update(userId).digest("hex");
  return `${userId}.${hmac}`;
}

function publicUser(user: UserRecord): PublicUser {
  const isHub = Boolean(user.isHub);
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    isHub,
    isInnkeeper: isHubAccount(user.displayName, isHub),
    hasUploadToken: Boolean(user.uploadTokenHash),
    emailVerified: !user.emailVerifyRequired,
    restriction: restrictionOf(user.sanctions),
  };
}

function hashVerifyCode(code: string) {
  return createHash("sha256").update(`${secret()}:${code}`).digest("hex");
}

function makeVerifyCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function stampVerifyCode(user: UserRecord, now = new Date()) {
  const code = makeVerifyCode();
  user.emailVerifyRequired = true;
  user.emailVerifyHash = hashVerifyCode(code);
  user.emailVerifyExpiresAt = new Date(now.getTime() + CODE_MS).toISOString();
  user.emailVerifySentAt = now.toISOString();
  return code;
}

export function confirmPath(next = "/account") {
  const dest = next.startsWith("/") ? next : "/account";
  return dest === "/account/confirm" ? dest : `/account/confirm?next=${encodeURIComponent(dest)}`;
}

export function afterAuthPath(user: PublicUser, next = "/account") {
  const dest = next.startsWith("/") ? next : "/account";
  return user.emailVerified || user.isInnkeeper ? dest : confirmPath(dest);
}

export async function getSessionUser(): Promise<PublicUser | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value || "";
  const [userId, hmac] = raw.split(".");
  if (!userId || !hmac || tokenFor(userId) !== raw) {
    return null;
  }
  const store = await getStore();
  const user = store.users.find((item) => item.id === userId);
  return user ? publicUser(user) : null;
}

async function setSession(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE, tokenFor(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function registerUser(email: string, password: string, displayName: string) {
  const normalized = email.trim().toLowerCase();
  const name = displayName.trim();
  if (!normalized || !normalized.includes("@")) {
    return { error: "A valid email is required." };
  }
  if (name.length < 2) {
    return { error: "Display name is required." };
  }
  const { local, domain } = splitEmail(normalized);
  const mail = await emailBlock(normalized);
  if (mail === CONDUCT_MESSAGE) {
    return { error: (await refuseWrite(name, local, domain, domain.replace(/\./g, ""))) || mail };
  }
  if (mail) {
    return { error: mail };
  }
  const blocked = await refuseWrite(name, local, domain, domain.replace(/\./g, ""));
  if (blocked) {
    return { error: blocked };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  const store = await getStore();
  if (store.users.some((user) => user.email === normalized)) {
    return { error: "That email is already registered." };
  }
  const id = randomBytes(8).toString("hex");
  const { hash, salt } = hashPassword(password);
  const now = new Date().toISOString();
  const ip = await requestIp();
  let created = false;
  let issuedCode = "";
  try {
    await updateStore((data) => {
      if (data.users.some((user) => user.email === normalized)) {
        return data;
      }
      created = true;
      const account: UserRecord = {
        id,
        email: normalized,
        displayName: name,
        passwordHash: hash,
        passwordSalt: salt,
        uploadTokenHash: "",
        isHub: false,
        notifications: [],
        seenSoonIds: [],
        sanctions: [],
        ips: [],
        emailVerifyRequired: true,
        emailVerifiedAt: "",
        emailVerifyHash: "",
        emailVerifyExpiresAt: "",
        emailVerifySentAt: "",
        createdAt: now,
      };
      if (ip && !isLoopbackIp(ip)) {
        rememberUserIp(account, ip, now);
      }
      const code = stampVerifyCode(account, new Date(now));
      issuedCode = code;
      data.users.push(account);
    });
  } catch (error) {
    console.error("Failed to register user", error);
    return { error: "Could not create the account. Try again." };
  }
  if (!created) {
    return { error: "That email is already registered." };
  }
  if (issuedCode) {
    const mailed = await sendConfirmCode(normalized, issuedCode);
    if ("error" in mailed && mailed.error) {
      console.error("Confirm mail failed after register");
    }
  }
  await setSession(id);
  return { ok: true as const };
}

export async function loginUser(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const store = await getStore();
  const user = store.users.find((item) => item.email === normalized);
  if (!user || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
    return { error: "Email or password is incorrect." };
  }
  await noteUserIp(user.id, true);
  const restriction = restrictionOf(user.sanctions);
  if (restriction && restriction.kind === "ban") {
    return { error: restrictionMessage(restriction) };
  }
  const door = await refuseWrite();
  if (door) {
    return { error: door };
  }
  await setSession(user.id);
  return { ok: true as const };
}

export async function confirmMailbox(rawCode: string) {
  const session = await getSessionUser();
  if (!session) {
    return { error: "Sign in to confirm this mailbox." };
  }
  if (session.emailVerified) {
    return { ok: true as const };
  }
  const code = rawCode.replace(/\D/g, "");
  if (code.length !== 6) {
    return { error: "Enter the 6-digit code from the mail." };
  }
  const now = Date.now();
  const expected = hashVerifyCode(code);
  let matched = false;
  await updateStore((data) => {
    const user = data.users.find((item) => item.id === session.id);
    if (!user || !user.emailVerifyRequired) {
      matched = true;
      return;
    }
    if (!user.emailVerifyHash || !user.emailVerifyExpiresAt) {
      return;
    }
    if (new Date(user.emailVerifyExpiresAt).getTime() < now) {
      return;
    }
    const prev = Buffer.from(user.emailVerifyHash, "hex");
    const next = Buffer.from(expected, "hex");
    if (prev.length !== next.length || !timingSafeEqual(prev, next)) {
      return;
    }
    user.emailVerifyRequired = false;
    user.emailVerifiedAt = new Date().toISOString();
    user.emailVerifyHash = "";
    user.emailVerifyExpiresAt = "";
    user.emailVerifySentAt = "";
    matched = true;
  });
  if (!matched) {
    return { error: "That code is wrong or has gone cold. Request a new one." };
  }
  return { ok: true as const };
}

export async function resendMailboxCode() {
  const session = await getSessionUser();
  if (!session) {
    return { error: "Sign in to send a new code." };
  }
  if (session.emailVerified) {
    return { ok: true as const };
  }
  let code = "";
  let error = "";
  await updateStore((data) => {
    const user = data.users.find((item) => item.id === session.id);
    if (!user) {
      error = "Account not found.";
      return;
    }
    if (!user.emailVerifyRequired) {
      return;
    }
    const sent = user.emailVerifySentAt ? new Date(user.emailVerifySentAt).getTime() : 0;
    if (sent && Date.now() - sent < RESEND_WAIT_MS) {
      error = "Wait a minute before asking for another code.";
      return;
    }
    code = stampVerifyCode(user);
  });
  if (error) {
    return { error };
  }
  if (!code) {
    return { ok: true as const };
  }
  return sendConfirmCode(session.email, code);
}

export async function logoutUser() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export function hashUploadToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function hubNameList() {
  return (process.env.HUB_NAMES || "Sgtpepper")
    .split(",")
    .map((name) => canonicalPlayerName(name) || name.trim().toLowerCase())
    .filter(Boolean);
}

export function isHubAccount(displayName: string, isHubFlag: boolean) {
  if (isHubFlag) {
    return true;
  }
  return hubNameList().includes(canonicalPlayerName(displayName) || displayName.trim().toLowerCase());
}

export async function getUserByUploadToken(token: string) {
  const raw = token.trim();
  if (!raw.startsWith("weu_")) {
    return null;
  }
  const hash = hashUploadToken(raw);
  const store = await getStore();
  const user = store.users.find((item) => item.uploadTokenHash && item.uploadTokenHash === hash);
  return user ? publicUser(user) : null;
}
