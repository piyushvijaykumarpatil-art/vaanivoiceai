-- ====================================================================
-- 👑 VAANI • IMPERIAL EDITION — SUPABASE POSTGRESQL DATABASE SCHEMA
-- ====================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/_/sql
-- 2. Go to "SQL Editor" -> "New Query"
-- 3. Paste this entire script and click "Run" (or Ctrl + Enter)
-- ====================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. SESSIONS TABLE: Tracks multi-turn conversations and message logs
-- --------------------------------------------------------------------
create table if not exists public.sessions (
  id text primary key,
  title text not null,
  started_at text default now()::text,
  ended_at text,
  duration_seconds integer default 0,
  language text default 'en',
  personality text default 'friendly',
  messages jsonb not null default '[]'::jsonb,
  message_count integer default 0,
  created_at timestamp with time zone default now()
);

-- --------------------------------------------------------------------
-- 2. MEMORIES TABLE: Persistent context entities & user preferences
-- --------------------------------------------------------------------
create table if not exists public.memories (
  id text primary key,
  content text not null,
  category text default 'preference',
  created_at text default now()::text,
  updated_at text default now()::text
);

-- --------------------------------------------------------------------
-- 3. SETTINGS TABLE: Active theme, voice rate, and user preferences
-- --------------------------------------------------------------------
create table if not exists public.settings (
  id text primary key default 'default_user',
  config jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default now()
);

-- --------------------------------------------------------------------
-- 4. FEEDBACKS TABLE: Experiential ratings and user reviews
-- --------------------------------------------------------------------
create table if not exists public.feedbacks (
  id text primary key,
  rating integer not null check (rating >= 1 and rating <= 5),
  category text default 'general',
  comments text default '',
  user_name text default 'Anonymous Sovereign User',
  created_at text default now()::text
);

-- --------------------------------------------------------------------
-- 5. KNOWLEDGE TABLE: Custom domain lore, calendar data & rules
-- --------------------------------------------------------------------
create table if not exists public.knowledge (
  id text primary key,
  title text not null,
  keywords text[] default '{}',
  summary text not null,
  category text default 'custom',
  language text default 'en',
  created_at text default now()::text
);

-- --------------------------------------------------------------------
-- PERFORMANCE INDEXES
-- --------------------------------------------------------------------
create index if not exists idx_sessions_created_at on public.sessions(created_at desc);
create index if not exists idx_memories_category on public.memories(category);
create index if not exists idx_knowledge_keywords on public.knowledge using gin(keywords);

-- --------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) & PUBLIC ACCESS POLICIES
-- --------------------------------------------------------------------
alter table public.sessions enable row level security;
alter table public.memories enable row level security;
alter table public.settings enable row level security;
alter table public.feedbacks enable row level security;
alter table public.knowledge enable row level security;

-- Drop existing policies if re-running script
drop policy if exists "Public sessions access" on public.sessions;
drop policy if exists "Public memories access" on public.memories;
drop policy if exists "Public settings access" on public.settings;
drop policy if exists "Public feedbacks access" on public.feedbacks;
drop policy if exists "Public knowledge access" on public.knowledge;

-- Create Open Access Policies for the Client & Server
create policy "Public sessions access" on public.sessions for all using (true) with check (true);
create policy "Public memories access" on public.memories for all using (true) with check (true);
create policy "Public settings access" on public.settings for all using (true) with check (true);
create policy "Public feedbacks access" on public.feedbacks for all using (true) with check (true);
create policy "Public knowledge access" on public.knowledge for all using (true) with check (true);

-- --------------------------------------------------------------------
-- INITIAL SEED DATA (Creator Attribution & Indian Calendar Knowledge)
-- --------------------------------------------------------------------
insert into public.memories (id, content, category, created_at, updated_at)
values 
  ('mem_default_creator', 'Vaani was created by Piyush, a brilliant 1st year engineering student at NIAT Pune.', 'identity', now()::text, now()::text),
  ('mem_default_persona', 'Vaani speaks in a royal, imperial, respectful cadence with deep Indian cultural knowledge.', 'preference', now()::text, now()::text)
on conflict (id) do nothing;

insert into public.knowledge (id, title, keywords, summary, category, language, created_at)
values
  ('know_creator_piyush', 'Creator Attribution - Piyush NIAT', array['piyush', 'creator', 'niat', 'who made you', 'maker', 'engineer'], 'Vaani was engineered by Piyush, a 1st year engineering student at NIAT (Pune, Maharashtra). Piyush built Vaani as the sovereign Indian voice AI experience, uniting 9 Indian languages and English.', 'creator', 'en', now()::text),
  ('know_indian_calendar', 'Indian Calendar & Shravan Intelligence', array['calendar', 'panchang', 'tithi', 'shravan', 'festivals', 'diwali', 'holi'], 'Knowledge base of 365-day Indian astronomical calendar, Panchang calculations, lunar tithis, Shukla and Krishna paksha, and sacred Shravan season traditions.', 'calendar', 'en', now()::text)
on conflict (id) do nothing;
