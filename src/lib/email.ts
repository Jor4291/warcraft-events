import { resolveMx } from "node:dns/promises";
import { CONDUCT_MESSAGE, isBlocked, isBlockedName } from "./conduct";

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}$/i;

const DISPOSABLE = new Set([
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "10minutemail.com",
  "guerrillamail.com",
  "trashmail.com",
  "yopmail.com",
  "throwaway.email",
  "sharklasers.com",
  "getnada.com",
  "mailnesia.com",
  "guerrillamailblock.com",
  "grr.la",
]);

export function splitEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at < 1) {
    return { local: "", domain: "" };
  }
  return { local: normalized.slice(0, at), domain: normalized.slice(at + 1) };
}

export async function emailBlock(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!EMAIL_RE.test(normalized)) {
    return "That email does not look like a real address.";
  }
  const { local, domain } = splitEmail(normalized);
  if (!local || !domain || domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) {
    return "That email does not look like a real address.";
  }
  if (isBlocked(local) || isBlocked(domain) || isBlockedName(domain) || isBlocked(domain.replace(/\./g, ""))) {
    return CONDUCT_MESSAGE;
  }
  if (DISPOSABLE.has(domain)) {
    return "Use a lasting email, not a throwaway.";
  }
  try {
    const records = await resolveMx(domain);
    if (!records.length) {
      return "That email domain does not accept mail.";
    }
  } catch {
    return "That email domain does not accept mail.";
  }
  return "";
}
