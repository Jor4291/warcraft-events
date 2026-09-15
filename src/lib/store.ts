import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { emptyStore } from "./seed";
import type { StoreData } from "./types";

const storePath = path.join(process.cwd(), "data", "store.json");

let memory: StoreData | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function clone(data: StoreData): StoreData {
  return JSON.parse(JSON.stringify(data)) as StoreData;
}

async function readStore(): Promise<StoreData> {
  if (memory) {
    return clone(memory);
  }
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as StoreData;
    memory = {
      events: parsed.events ?? [],
      matches: parsed.matches ?? [],
      players: parsed.players ?? [],
    };
    return clone(memory);
  } catch {
    memory = emptyStore();
    await persist(memory).catch(() => undefined);
    return clone(memory);
  }
}

async function persist(data: StoreData) {
  memory = clone(data);
  try {
    await mkdir(path.dirname(storePath), { recursive: true });
    await writeFile(storePath, JSON.stringify(data, null, 2), "utf8");
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
