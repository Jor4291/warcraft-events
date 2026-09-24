import { requestIp, isLoopbackIp } from "./client-ip";
import { conductBlock } from "./conduct";
import { applyConductStrike, IP_BAN_MESSAGE, isIpBanned } from "./ip-ban-model";
import { getStore, updateStore } from "./store";

export { CONDUCT_STRIKES_TO_BAN, IP_BAN_MESSAGE, ipBanActive } from "./ip-ban-model";

export async function refuseWrite(...parts: string[]) {
  const ip = await requestIp();
  const store = await getStore();
  if (ip && isIpBanned(store, ip)) {
    return IP_BAN_MESSAGE;
  }
  if (!parts.length) {
    return "";
  }
  const blocked = conductBlock(...parts);
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
