import type { IpBanRecord, StoreData, UserIpSighting, UserRecord } from "./types";

const IP_HISTORY = 8;

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

export function normalizeUserIps(raw: unknown): UserIpSighting[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const rows: UserIpSighting[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const row = item as Partial<UserIpSighting>;
    const ip = String(row.ip || "").trim();
    if (!ip || rows.some((entry) => entry.ip === ip)) {
      continue;
    }
    rows.push({
      ip,
      lastAt: String(row.lastAt || ""),
      seen: Number.isFinite(row.seen) ? Math.max(1, Number(row.seen)) : 1,
    });
  }
  return rows.slice(0, IP_HISTORY);
}

const IP_REFRESH_MS = 6 * 60 * 60 * 1000;

export function ipNeedsRemember(user: UserRecord, ip: string, now = Date.now()) {
  if (!ip) {
    return false;
  }
  const existing = user.ips?.find((row) => row.ip === ip);
  if (!existing) {
    return true;
  }
  const last = Date.parse(existing.lastAt);
  return !Number.isFinite(last) || now - last >= IP_REFRESH_MS;
}

export function rememberUserIp(user: UserRecord, ip: string, now: string) {
  if (!ip) {
    return;
  }
  if (!user.ips) {
    user.ips = [];
  }
  const existing = user.ips.find((row) => row.ip === ip);
  if (existing) {
    existing.lastAt = now;
    existing.seen += 1;
    return;
  }
  user.ips.unshift({ ip, lastAt: now, seen: 1 });
  if (user.ips.length > IP_HISTORY) {
    user.ips.length = IP_HISTORY;
  }
}

export function closeIp(data: StoreData, ip: string, now: string, by: string, reason: string) {
  if (!ip) {
    return;
  }
  const row = data.ipBans.find((item) => item.ip === ip);
  if (!row) {
    data.ipBans.unshift({
      ip,
      strikes: CONDUCT_STRIKES_TO_BAN,
      bannedAt: now,
      liftedAt: "",
      lastAt: now,
      reason,
      by,
    });
    return;
  }
  row.bannedAt = now;
  row.liftedAt = "";
  row.lastAt = now;
  row.reason = reason || row.reason;
  row.by = by;
  row.strikes = Math.max(row.strikes, CONDUCT_STRIKES_TO_BAN);
}

export function closeUserDoors(data: StoreData, user: UserRecord, now: string, by: string) {
  for (const sight of user.ips) {
    closeIp(data, sight.ip, now, by, "Closed with the account");
  }
}
