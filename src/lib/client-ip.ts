import { headers } from "next/headers";

const IP_HEADERS = ["x-forwarded-for", "x-real-ip", "x-vercel-forwarded-for", "cf-connecting-ip"];

export function normalizeIp(raw: string) {
  const value = raw.split(",")[0]?.trim() || "";
  if (!value) {
    return "";
  }
  if (value.startsWith("::ffff:")) {
    return value.slice(7);
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
  return "";
}
