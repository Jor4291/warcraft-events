import type { EventLink } from "./types";

export const MAX_EVENT_LINKS = 6;
const MAX_LABEL = 40;
const MAX_URL = 400;

const KNOWN_HOSTS: { match: RegExp; label: string }[] = [
  { match: /(^|\.)discord\.(gg|com)$/, label: "Discord" },
  { match: /(^|\.)twitch\.tv$/, label: "Twitch" },
  { match: /(^|\.)(youtube\.com|youtu\.be)$/, label: "YouTube" },
  { match: /(^|\.)x\.com$/, label: "X" },
  { match: /(^|\.)twitter\.com$/, label: "Twitter" },
  { match: /(^|\.)challonge\.com$/, label: "Challonge" },
  { match: /(^|\.)docs\.google\.com$/, label: "Google Doc" },
  { match: /(^|\.)warcraftlogs\.com$/, label: "Warcraft Logs" },
  { match: /(^|\.)curseforge\.com$/, label: "CurseForge" },
];

export function eventLinkUrl(raw: string) {
  const trimmed = raw.trim().slice(0, MAX_URL);
  if (!trimmed) {
    return "";
  }
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "";
    }
    return url.href;
  } catch {
    return "";
  }
}

export function suggestLinkLabel(raw: string) {
  const href = eventLinkUrl(raw);
  if (!href) {
    return "";
  }
  const host = new URL(href).hostname.toLowerCase();
  const known = KNOWN_HOSTS.find((entry) => entry.match.test(host));
  if (known) {
    return known.label;
  }
  return host.replace(/^www\./, "");
}

export function normalizeEventLinks(raw: unknown): EventLink[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const links: EventLink[] = [];
  for (const item of raw) {
    if (links.length >= MAX_EVENT_LINKS) {
      break;
    }
    if (!item || typeof item !== "object") {
      continue;
    }
    const row = item as Partial<EventLink>;
    const url = eventLinkUrl(String(row.url || ""));
    if (!url || links.some((link) => link.url === url)) {
      continue;
    }
    const label = String(row.label || "").trim().slice(0, MAX_LABEL) || suggestLinkLabel(url);
    links.push({ label, url });
  }
  return links;
}

export function parseEventLinksJson(value: FormDataEntryValue | null): EventLink[] {
  try {
    return normalizeEventLinks(JSON.parse(String(value || "[]")));
  } catch {
    return [];
  }
}
