-- Agent Kit account data (Neon Postgres). Apply with `npm run db:migrate`; every statement is safe to rerun.
-- user_id is the Clerk user id. Prompts are stored by library id (A01), skills by folder name, so renamed titles keep working.

create extension if not exists pgcrypto;

create table if not exists collections (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  name        text not null check (char_length(name) between 1 and 80),
  is_starred  boolean not null default false,
  is_public   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (not (is_starred and is_public))
);
create index if not exists collections_user_idx on collections (user_id, created_at);
-- One built-in Starred collection per person.
create unique index if not exists collections_one_starred on collections (user_id) where is_starred;

create table if not exists collection_items (
  collection_id uuid not null references collections (id) on delete cascade,
  kind          text not null check (kind in ('prompt', 'skill')),
  ref           text not null check (char_length(ref) between 1 and 120),
  added_at      timestamptz not null default now(),
  primary key (collection_id, kind, ref)
);

-- Public MCP server: calls per UTC day, for the daily cap and alerts.
create table if not exists mcp_usage (
  day    date primary key,
  calls  integer not null default 0
);
