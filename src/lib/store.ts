import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { emptyStore } from "./seed";
import type { EventRecord, StoreData, UserRecord } from "./types";

const storePath = path.join(process.cwd(), "data", "store.json");

let memory: StoreData | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function clone(data: StoreData): StoreData {
  return JSON.parse(JSON.stringify(data)) as StoreData;
}

function normalizeEvent(event: EventRecord): EventRecord {
  return {
    ...event,
    kind: event.kind ?? "calendar",
    ownerId: event.ownerId ?? "",
    signupMode: event.signupMode === "invite" ? "invite" : "open",
    inviteCode: event.inviteCode ?? "",
    signups: event.signups ?? [],
    cancelledAt: event.cancelledAt ?? "",
    teams: event.teams ?? [],
    rounds: event.rounds ?? [],
    whiteboard: event.whiteboard ?? "",
  };
}

function normalizeUser(user: UserRecord): UserRecord {
  return {
    ...user,
    uploadTokenHash: user.uploadTokenHash ?? "",
    isHub: Boolean(user.isHub),
  };
}

function normalize(data: Partial<StoreData> | StoreData): StoreData {
  return {
    events: (data.events ?? []).map(normalizeEvent),
    matches: data.matches ?? [],
    players: data.players ?? [],
    users: (data.users ?? []).map(normalizeUser),
  };
}

async function readStore(): Promise<StoreData> {
  try {
    const raw = await readFile(storePath, "utf8");
    memory = normalize(JSON.parse(raw) as Partial<StoreData>);
    return clone(memory);
  } catch {
    if (!memory) {
      memory = emptyStore();
      await persist(memory).catch(() => undefined);
    }
    return clone(memory);
  }
}

async function persist(data: StoreData) {
  memory = clone(normalize(data));
  try {
    await mkdir(path.dirname(storePath), { recursive: true });
    await writeFile(storePath, JSON.stringify(memory, null, 2), "utf8");
  } catch {
    // Read-only hosts (Vercel) keep the in-memory copy for this instance only.
  }
}

export async function getStore(): Promise<StoreData> {
  return readStore();
}

export async function updateStore(
  mutator: (data: StoreData) => StoreData | void,
): Promise<StoreData> {
  const run = writeQueue.then(async () => {
    const current = await readStore();
    const next = mutator(current) ?? current;
    await persist(next);
    return clone(next);
  });
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
