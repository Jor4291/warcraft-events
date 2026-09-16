import { emptyStore } from "./seed";
import { getSql } from "./db";
import type { EventRecord, LadderMatch, LadderPlayer, StoreData, UserRecord } from "./types";

let schemaPromise: Promise<void> | null = null;

function isConcurrentCreateError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("already exists") ||
    message.includes("pg_type_typname_nsp_index") ||
    message.includes("duplicate key")
  );
}

async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const sql = getSql();
      const create = async (run: Promise<unknown>) => {
        try {
          await run;
        } catch (error) {
          if (!isConcurrentCreateError(error)) {
            throw error;
          }
        }
      };
      await create(sql`
        CREATE TABLE IF NOT EXISTS users (
          id text PRIMARY KEY,
          email text NOT NULL UNIQUE,
          display_name text NOT NULL,
          password_hash text NOT NULL,
          password_salt text NOT NULL,
          upload_token_hash text NOT NULL DEFAULT '',
          is_hub boolean NOT NULL DEFAULT false,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `);
      await create(sql`
        CREATE TABLE IF NOT EXISTS events (
          id text PRIMARY KEY,
          slug text NOT NULL UNIQUE,
          data jsonb NOT NULL
        )
      `);
      await create(sql`
        CREATE TABLE IF NOT EXISTS matches (
          match_id text PRIMARY KEY,
          timestamp bigint NOT NULL DEFAULT 0,
          confirmed boolean NOT NULL DEFAULT false,
          data jsonb NOT NULL
        )
      `);
      await create(sql`
        CREATE TABLE IF NOT EXISTS players (
          name text PRIMARY KEY,
          points double precision NOT NULL DEFAULT 1500,
          data jsonb NOT NULL
        )
      `);
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
}

function asUser(row: Record<string, unknown>): UserRecord {
  return {
    id: String(row.id),
    email: String(row.email),
    displayName: String(row.display_name),
    passwordHash: String(row.password_hash),
    passwordSalt: String(row.password_salt),
    uploadTokenHash: String(row.upload_token_hash || ""),
    isHub: Boolean(row.is_hub),
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export async function readPostgres(): Promise<StoreData> {
  await ensureSchema();
  const sql = getSql();
  const [users, events, matches, players] = await Promise.all([
    sql`SELECT id, email, display_name, password_hash, password_salt, upload_token_hash, is_hub, created_at FROM users ORDER BY created_at DESC`,
    sql`SELECT data FROM events`,
    sql`SELECT data FROM matches ORDER BY timestamp ASC`,
    sql`SELECT data FROM players ORDER BY points DESC`,
  ]);

  const data: StoreData = {
    users: users.map((row) => asUser(row as Record<string, unknown>)),
    events: events.map((row) => row.data as EventRecord),
    matches: matches.map((row) => row.data as LadderMatch),
    players: players.map((row) => row.data as LadderPlayer),
  };

  if (data.users.length === 0 && data.events.length === 0 && data.matches.length === 0) {
    const seeded = emptyStore();
    await writePostgres(seeded);
    return seeded;
  }

  return data;
}

export async function writePostgres(data: StoreData) {
  await ensureSchema();
  const sql = getSql();
  const queries = [
    sql`TRUNCATE users, events, matches, players`,
    ...data.users.map(
      (user) =>
        sql`INSERT INTO users (id, email, display_name, password_hash, password_salt, upload_token_hash, is_hub, created_at)
            VALUES (${user.id}, ${user.email}, ${user.displayName}, ${user.passwordHash}, ${user.passwordSalt}, ${user.uploadTokenHash}, ${user.isHub}, ${user.createdAt})`,
    ),
    ...data.events.map(
      (event) => sql`INSERT INTO events (id, slug, data) VALUES (${event.id}, ${event.slug}, ${event})`,
    ),
    ...data.matches.map(
      (match) =>
        sql`INSERT INTO matches (match_id, timestamp, confirmed, data) VALUES (${match.matchId}, ${match.timestamp}, ${match.confirmed}, ${match})`,
    ),
    ...data.players.map(
      (player) => sql`INSERT INTO players (name, points, data) VALUES (${player.name}, ${player.points}, ${player})`,
    ),
  ];
  await sql.transaction(queries);
}
