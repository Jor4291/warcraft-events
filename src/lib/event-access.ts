import { isInnkeeper } from "./admin";
import { getSessionUser } from "./auth";
import type { EventRecord } from "./types";

export async function isEventOwner(event: EventRecord) {
  if (await isInnkeeper()) {
    return true;
  }
  const user = await getSessionUser();
  return Boolean(user && event.ownerId && user.id === event.ownerId);
}

export async function canManageEvent(event: EventRecord) {
  if (await isEventOwner(event)) {
    return true;
  }
  const user = await getSessionUser();
  return Boolean(user && event.coHosts.some((host) => host.userId === user.id));
}

export function eventForHostClient(event: EventRecord): EventRecord {
  return { ...event, editKey: "" };
}
