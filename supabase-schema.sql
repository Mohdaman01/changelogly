-- ============================================================
-- Changelogly — Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── workspaces ─────────────────────────────────────────────
create table workspaces (
  id          uuid primary key default uuid_generate_v4(),
  clerk_user_id text unique not null,
  name        text not null,
  slug        text unique not null,           -- used for subdomain: slug.changelogly.com
  plan        text not null default 'free',   -- free | starter | pro | team
  stripe_customer_id    text,
  stripe_subscription_id text,
  github_access_token   text,                 -- encrypted GitHub OAuth token
  custom_domain text,
  logo_url    text,
  brand_color text default '#6366f1',
  created_at  timestamptz default now()
);

-- ─── projects ───────────────────────────────────────────────
create table projects (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid references workspaces(id) on delete cascade,
  name          text not null,
  description   text,
  github_repo   text,                         -- "owner/repo"
  gitlab_repo   text,
  slug          text not null,                -- project slug for URL
  is_public     boolean default true,
  show_branding boolean default true,         -- hide on pro+
  created_at    timestamptz default now(),
  unique(workspace_id, slug)
);

-- ─── changelogs ─────────────────────────────────────────────
create table changelogs (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid references projects(id) on delete cascade,
  workspace_id  uuid references workspaces(id) on delete cascade,
  title         text not null,
  version       text,                         -- e.g. "v2.1.0"
  content_md    text not null,                -- markdown content
  content_html  text,                         -- pre-rendered HTML
  tone          text default 'user-friendly', -- technical | marketing | user-friendly
  status        text default 'draft',         -- draft | published
  published_at  timestamptz,
  from_commit   text,
  to_commit     text,
  tags          text[] default '{}',
  generation_tokens int default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── changelog_subscribers ──────────────────────────────────
create table changelog_subscribers (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid references projects(id) on delete cascade,
  email       text not null,
  confirmed   boolean default false,
  token       text unique default encode(gen_random_bytes(32), 'hex'),
  created_at  timestamptz default now(),
  unique(project_id, email)
);

-- ─── team_members ───────────────────────────────────────────
create table team_members (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid references workspaces(id) on delete cascade,
  clerk_user_id text not null,
  role          text default 'editor',        -- owner | editor | viewer
  invited_email text,
  accepted      boolean default false,
  created_at    timestamptz default now(),
  unique(workspace_id, clerk_user_id)
);

-- ─── generation_usage ───────────────────────────────────────
create table generation_usage (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid references workspaces(id) on delete cascade,
  project_id    uuid references projects(id) on delete cascade,
  changelog_id  uuid references changelogs(id) on delete set null,
  tokens_used   int default 0,
  created_at    timestamptz default now()
);

-- ─── Row Level Security ─────────────────────────────────────
alter table workspaces enable row level security;
alter table projects enable row level security;
alter table changelogs enable row level security;
alter table changelog_subscribers enable row level security;
alter table team_members enable row level security;
alter table generation_usage enable row level security;

-- Service role bypasses RLS (used by API routes with service key)
-- Client-side queries use anon key + these policies

create policy "workspace owner access"
  on workspaces for all
  using (auth.jwt() ->> 'sub' = clerk_user_id);

create policy "project workspace access"
  on projects for all
  using (
    workspace_id in (
      select id from workspaces where clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

create policy "public changelogs are readable"
  on changelogs for select
  using (status = 'published');

create policy "changelog workspace access"
  on changelogs for all
  using (
    workspace_id in (
      select id from workspaces where clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

-- ─── Indexes ────────────────────────────────────────────────
create index on projects(workspace_id);
create index on changelogs(project_id);
create index on changelogs(workspace_id);
create index on changelogs(status, published_at desc);
create index on changelog_subscribers(project_id);
create index on generation_usage(workspace_id, created_at desc);
