import { requestIp, isLoopbackIp } from "./client-ip";
import { conductBlock, conductBlockName } from "./conduct";
import { applyConductStrike, ipNeedsRemember, IP_BAN_MESSAGE, isIpBanned, rememberUserIp } from "./ip-ban-model";
import { getStore, updateStore } from "./store";

export { CONDUCT_STRIKES_TO_BAN, IP_BAN_MESSAGE, ipBanActive } from "./ip-ban-model";

async function refuseChecked(blocked: string) {
  const ip = await requestIp();
  const store = await getStore();
  if (ip && isIpBanned(store, ip)) {
    return IP_BAN_MESSAGE;
  }
  if (!blocked) {
    return "";
  }
  if (!ip || isLoopbackIp(ip)) {
    return blocked;
  }
  let banned = false;
  await updateStore((data) => {
    banned = applyConductStrike(data, ip, new Date().toISOString()).banned;
  });
  return banned ? IP_BAN_MESSAGE : blocked;
}

export async function refuseWrite(...parts: string[]) {
  return refuseChecked(parts.length ? conductBlock(...parts) : "");
}

export async function refuseSignupName(name: string) {
  return refuseChecked(conductBlockName(name));
}

export async function noteUserIp(userId: string, force = false) {
  const ip = await requestIp();
  if (!ip || isLoopbackIp(ip)) {
    return;
  }
  const store = await getStore();
  const current = store.users.find((item) => item.id === userId);
  if (!current || (!force && !ipNeedsRemember(current, ip))) {
    return;
  }
  const now = new Date().toISOString();
  await updateStore((data) => {
    const user = data.users.find((item) => item.id === userId);
    if (user) {
      rememberUserIp(user, ip, now);
    }
  });
}
