import { isAdmin } from "./admin";
import { getSessionUser } from "./auth";
import type { EventRecord } from "./types";

export async function canManageEvent(event: EventRecord, editKey = "") {
  if (await isAdmin()) {
    return true;
  }
  if (editKey && event.editKey === editKey) {
    return true;
  }
  const user = await getSessionUser();
  return Boolean(user && event.ownerId && user.id === event.ownerId);
}
