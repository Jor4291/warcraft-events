import type { SanctionKind, UserRestriction, UserSanction } from "./types";

export const SANCTION_REASON_MAX = 280;

export const SANCTIONS = [
  {
    kind: "mute",
    name: "Mute",
    blurb: "Off the boards. They can still read, sign up for nights, and run the events they already host.",
  },
  {
    kind: "timeout",
    name: "Timeout",
    blurb: "Off the boards and cannot book anything new. Sign-ups and their existing boards keep working.",
  },
  {
    kind: "ban",
    name: "Ban",
    blurb: "Locked out of the tavern. No sign-in, no posting, no hosting, no sign-ups.",
  },
] as const satisfies readonly { kind: SanctionKind; name: string; blurb: string }[];

export const SANCTION_LENGTHS = [
  { id: "1h", name: "1 hour", hours: 1 },
  { id: "12h", name: "12 hours", hours: 12 },
  { id: "1d", name: "1 day", hours: 24 },
  { id: "3d", name: "3 days", hours: 72 },
  { id: "7d", name: "7 days", hours: 24 * 7 },
  { id: "30d", name: "30 days", hours: 24 * 30 },
  { id: "open", name: "Until lifted", hours: 0 },
] as const;

export function isSanctionKind(value: string): value is SanctionKind {
  return SANCTIONS.some((sanction) => sanction.kind === value);
}

export function sanctionName(kind: SanctionKind) {
  return SANCTIONS.find((sanction) => sanction.kind === kind)?.name ?? "Restriction";
}

export function sanctionExpiry(lengthId: string, from = Date.now()) {
  const length = SANCTION_LENGTHS.find((option) => option.id === lengthId);
  if (!length || length.hours === 0) {
    return "";
  }
  return new Date(from + length.hours * 60 * 60 * 1000).toISOString();
}

export function normalizeSanction(sanction: Partial<UserSanction>): UserSanction | null {
  const kind = String(sanction.kind || "");
  const id = String(sanction.id || "");
  if (!id || !isSanctionKind(kind)) {
    return null;
  }
  return {
    id,
    kind,
    reason: String(sanction.reason || "").slice(0, SANCTION_REASON_MAX),
    by: String(sanction.by || ""),
    createdAt: String(sanction.createdAt || ""),
    expiresAt: String(sanction.expiresAt || ""),
    liftedAt: String(sanction.liftedAt || ""),
  };
}

export function normalizeSanctions(sanctions: UserSanction[] | undefined): UserSanction[] {
  return (sanctions ?? [])
    .map(normalizeSanction)
    .filter((sanction): sanction is UserSanction => Boolean(sanction))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function sanctionInForce(sanction: UserSanction, now = Date.now()) {
  if (sanction.liftedAt) {
    return false;
  }
  if (!sanction.expiresAt) {
    return true;
  }
  const expires = new Date(sanction.expiresAt).getTime();
  return Number.isNaN(expires) || expires > now;
}

export function activeSanction(sanctions: UserSanction[] | undefined, now = Date.now()) {
  return normalizeSanctions(sanctions).find((sanction) => sanctionInForce(sanction, now)) ?? null;
}

export function restrictionOf(sanctions: UserSanction[] | undefined, now = Date.now()): UserRestriction | null {
  const active = activeSanction(sanctions, now);
  return active ? { kind: active.kind, reason: active.reason, expiresAt: active.expiresAt } : null;
}

export function formatSanctionUntil(iso: string) {
  if (!iso) {
    return "lifted";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "lifted";
  }
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function describeRestriction(restriction: UserRestriction) {
  if (restriction.kind === "ban") {
    return "Banned";
  }
  return `${sanctionName(restriction.kind)} until ${formatSanctionUntil(restriction.expiresAt)}`;
}

export function restrictionMessage(restriction: UserRestriction) {
  const until = restriction.expiresAt ? ` until ${formatSanctionUntil(restriction.expiresAt)}` : "";
  const reason = restriction.reason ? ` Reason: ${restriction.reason}` : "";
  if (restriction.kind === "ban") {
    return `The innkeeper has barred this account from the tavern.${reason}`;
  }
  if (restriction.kind === "timeout") {
    return `You are in a timeout${until} — no posting and nothing new on the calendar.${reason}`;
  }
  return `You are muted on the boards${until}.${reason}`;
}

type Restricted = { restriction: UserRestriction | null };

/** Muted, timed out, and banned accounts all lose the boards. */
export function boardBlock(user: Restricted) {
  return user.restriction ? restrictionMessage(user.restriction) : "";
}

/** Timeouts and bans stop new listings; a mute is only about talking. */
export function hostBlock(user: Restricted) {
  const restriction = user.restriction;
  return restriction && restriction.kind !== "mute" ? restrictionMessage(restriction) : "";
}

/** Only a ban reaches boards they already host, or nights they want to join. */
export function banBlock(user: Restricted) {
  const restriction = user.restriction;
  return restriction && restriction.kind === "ban" ? restrictionMessage(restriction) : "";
}
