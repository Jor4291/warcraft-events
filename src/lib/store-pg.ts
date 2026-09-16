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

function deleteMissing(sql: ReturnType<typeof getSql>, table: "users" | "events" | "matches" | "players", ids: string[]) {
  if (ids.length === 0) {
    if (table === "users") return sql`DELETE FROM users`;
    if (table === "events") return sql`DELETE FROM events`;
    if (table === "matches") return sql`DELETE FROM matches`;
    return sql`DELETE FROM players`;
  }
  if (table === "users") return sql`DELETE FROM users WHERE NOT (id = ANY(${ids}))`;
  if (table === "events") return sql`DELETE FROM events WHERE NOT (id = ANY(${ids}))`;
  if (table === "matches") return sql`DELETE FROM matches WHERE NOT (match_id = ANY(${ids}))`;
  return sql`DELETE FROM players WHERE NOT (name = ANY(${ids}))`;
}

export async function writePostgres(data: StoreData) {
  await ensureSchema();
  const sql = getSql();
  const queries = [
    ...data.users.map(
      (user) =>
        sql`INSERT INTO users (id, email, display_name, password_hash, password_salt, upload_token_hash, is_hub, created_at)
            VALUES (${user.id}, ${user.email}, ${user.displayName}, ${user.passwordHash}, ${user.passwordSalt}, ${user.uploadTokenHash}, ${user.isHub}, ${user.createdAt})
            ON CONFLICT (id) DO UPDATE SET
              email = EXCLUDED.email,
              display_name = EXCLUDED.display_name,
              password_hash = EXCLUDED.password_hash,
              password_salt = EXCLUDED.password_salt,
              upload_token_hash = EXCLUDED.upload_token_hash,
              is_hub = EXCLUDED.is_hub,
              created_at = EXCLUDED.created_at`,
    ),
    ...data.events.map(
      (event) =>
        sql`INSERT INTO events (id, slug, data) VALUES (${event.id}, ${event.slug}, ${event})
            ON CONFLICT (id) DO UPDATE SET slug = EXCLUDED.slug, data = EXCLUDED.data`,
    ),
    ...data.matches.map(
      (match) =>
        sql`INSERT INTO matches (match_id, timestamp, confirmed, data) VALUES (${match.matchId}, ${match.timestamp}, ${match.confirmed}, ${match})
            ON CONFLICT (match_id) DO UPDATE SET timestamp = EXCLUDED.timestamp, confirmed = EXCLUDED.confirmed, data = EXCLUDED.data`,
    ),
    ...data.players.map(
      (player) =>
        sql`INSERT INTO players (name, points, data) VALUES (${player.name}, ${player.points}, ${player})
            ON CONFLICT (name) DO UPDATE SET points = EXCLUDED.points, data = EXCLUDED.data`,
    ),
    deleteMissing(sql, "users", data.users.map((user) => user.id)),
    deleteMissing(sql, "events", data.events.map((event) => event.id)),
    deleteMissing(sql, "matches", data.matches.map((match) => match.matchId)),
    deleteMissing(sql, "players", data.players.map((player) => player.name)),
  ];
  await sql.transaction(queries);
}
