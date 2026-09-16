CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  password_hash text NOT NULL,
  password_salt text NOT NULL,
  upload_token_hash text NOT NULL DEFAULT '',
  is_hub boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  data jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS matches (
  match_id text PRIMARY KEY,
  timestamp bigint NOT NULL DEFAULT 0,
  confirmed boolean NOT NULL DEFAULT false,
  data jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS players (
  name text PRIMARY KEY,
  points double precision NOT NULL DEFAULT 1500,
  data jsonb NOT NULL
);
