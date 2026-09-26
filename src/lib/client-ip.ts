import { headers } from "next/headers";

const IP_HEADERS = [
  "x-forwarded-for",
  "x-vercel-forwarded-for",
  "x-vercel-proxied-for",
  "x-real-ip",
  "cf-connecting-ip",
  "true-client-ip",
];

export function normalizeIp(raw: string) {
  let value = raw.split(",")[0]?.trim() || "";
  if (!value) {
    return "";
  }
  if (value.toLowerCase().startsWith("for=")) {
    value = value.slice(4).trim();
  }
  if (value.startsWith("\"") && value.endsWith("\"") && value.length > 1) {
    value = value.slice(1, -1);
  }
  if (value.startsWith("[")) {
    const end = value.indexOf("]");
    if (end > 1) {
      value = value.slice(1, end);
    }
  }
  if (value.startsWith("::ffff:")) {
    value = value.slice(7);
  }
  return value;
}

export function isLoopbackIp(ip: string) {
  return ip === "127.0.0.1" || ip === "::1" || ip === "localhost";
}

export async function requestTimeZone() {
  const list = await headers();
  const zone = (list.get("x-vercel-ip-timezone") || "").trim();
  if (zone.includes("/")) {
    return zone;
  }
  return "America/Chicago";
}

export async function requestIp() {
  const list = await headers();
  for (const name of IP_HEADERS) {
    const ip = normalizeIp(list.get(name) || "");
    if (ip) {
      return ip;
    }
  }
  const forwarded = list.get("forwarded") || "";
  if (forwarded) {
    const match = forwarded.match(/for=\s*"?\[?([^";\]]+)/i);
    if (match?.[1]) {
      return normalizeIp(match[1]);
    }
  }
  return "";
}
