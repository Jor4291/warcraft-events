import { readFile } from "fs/promises";
import path from "path";
import { hasDatabase } from "../src/lib/db";
import { writePostgres } from "../src/lib/store-pg";
import type { StoreData } from "../src/lib/types";

async function main() {
  if (!hasDatabase()) {
    throw new Error("Set DATABASE_URL in .env.local first.");
  }
  const file = path.join(process.cwd(), "data", "store.json");
  const raw = await readFile(file, "utf8");
  const data = JSON.parse(raw) as StoreData;
  data.threads = data.threads ?? [];
  await writePostgres(data);
  console.log(
    `Migrated ${data.users.length} users, ${data.events.length} events, ${data.matches.length} matches, ${data.players.length} players, ${(data.threads ?? []).length} threads.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
