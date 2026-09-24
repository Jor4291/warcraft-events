import type { IpBanRecord, StoreData } from "./types";

export const IP_BAN_MESSAGE = "This door is closed. The innkeeper will not take more from this place.";
export const CONDUCT_STRIKES_TO_BAN = 2;

export function normalizeIpBans(raw: unknown): IpBanRecord[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const rows: IpBanRecord[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const row = item as Partial<IpBanRecord>;
    const ip = String(row.ip || "").trim();
    if (!ip || rows.some((entry) => entry.ip === ip)) {
      continue;
    }
    rows.push({
      ip,
      strikes: Number.isFinite(row.strikes) ? Math.max(0, Number(row.strikes)) : 0,
      bannedAt: String(row.bannedAt || ""),
      liftedAt: String(row.liftedAt || ""),
      lastAt: String(row.lastAt || ""),
      reason: String(row.reason || "").slice(0, 120),
      by: String(row.by || ""),
    });
  }
  return rows;
}

export function ipBanActive(row: IpBanRecord) {
  return Boolean(row.bannedAt && !row.liftedAt);
}

export function isIpBanned(data: Pick<StoreData, "ipBans">, ip: string) {
  if (!ip) {
    return false;
  }
  return data.ipBans.some((row) => row.ip === ip && ipBanActive(row));
}

export function applyConductStrike(data: StoreData, ip: string, now: string) {
  let row = data.ipBans.find((item) => item.ip === ip);
  if (!row) {
    row = { ip, strikes: 0, bannedAt: "", liftedAt: "", lastAt: now, reason: "", by: "" };
    data.ipBans.unshift(row);
  }
  if (row.liftedAt) {
    row.strikes = 0;
    row.bannedAt = "";
    row.liftedAt = "";
  }
  row.strikes += 1;
  row.lastAt = now;
  row.reason = row.reason || "Blocked wording";
  if (row.strikes >= CONDUCT_STRIKES_TO_BAN && !row.bannedAt) {
    row.bannedAt = now;
    row.by = row.by || "auto";
    return { banned: true };
  }
  return { banned: ipBanActive(row) };
}
