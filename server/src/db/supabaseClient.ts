import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { localDb, DatabaseSchema } from './acidEngine.js';

export const DEFAULT_SUPABASE_URL = 'https://zjqkcyrsqkzkvztgrcnx.supabase.co';

export const POSTGRES_SQL_SCHEMA = `-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. SESSIONS TABLE: Tracks full multi-turn conversations
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

-- 2. MEMORIES TABLE: Persistent context entities & preferences
create table if not exists public.memories (
  id text primary key,
  content text not null,
  category text default 'preference',
  created_at text default now()::text,
  updated_at text default now()::text
);

-- 3. SETTINGS TABLE: User preferences, active theme, and voice configuration
create table if not exists public.settings (
  id text primary key default 'default_user',
  config jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default now()
);

-- 4. FEEDBACKS TABLE: User ratings and experiential reviews
create table if not exists public.feedbacks (
  id text primary key,
  rating integer not null check (rating >= 1 and rating <= 5),
  category text default 'general',
  comments text default '',
  user_name text default 'Anonymous Sovereign User',
  created_at text default now()::text
);

-- 5. KNOWLEDGE TABLE: Injected custom domain lore and rules
create table if not exists public.knowledge (
  id text primary key,
  title text not null,
  keywords text[] default '{}',
  summary text not null,
  category text default 'custom',
  language text default 'en',
  created_at text default now()::text
);

-- Performance Indexes
create index if not exists idx_sessions_created_at on public.sessions(created_at desc);
create index if not exists idx_memories_category on public.memories(category);
create index if not exists idx_knowledge_keywords on public.knowledge using gin(keywords);

-- Enable Row Level Security (RLS)
alter table public.sessions enable row level security;
alter table public.memories enable row level security;
alter table public.settings enable row level security;
alter table public.feedbacks enable row level security;
alter table public.knowledge enable row level security;

-- Open Access Sovereign Policies
create policy "Public sessions access" on public.sessions for all using (true) with check (true);
create policy "Public memories access" on public.memories for all using (true) with check (true);
create policy "Public settings access" on public.settings for all using (true) with check (true);
create policy "Public feedbacks access" on public.feedbacks for all using (true) with check (true);
create policy "Public knowledge access" on public.knowledge for all using (true) with check (true);
`;

export function getSupabaseInstance(customUrl?: string, customKey?: string): SupabaseClient | null {
  const url = customUrl || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = customKey || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  try {
    return createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  } catch (err) {
    console.error('Failed to instantiate Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    const client = createClient(url, key);
    // Ping sessions table
    const { data, error } = await client.from('sessions').select('id').limit(1);
    if (error) {
      // If table doesn't exist yet, it's still reachable
      if (error.code === '42P01') {
        return { success: true, message: 'Connected to Supabase! (Tables need creation using SQL Schema)' };
      }
      return { success: false, message: `Supabase Error: ${error.message}` };
    }
    return { success: true, message: 'Successfully connected and verified Supabase tables!' };
  } catch (err: any) {
    return { success: false, message: `Connection failed: ${err.message || String(err)}` };
  }
}

export async function syncLocalToSupabase(url?: string, key?: string): Promise<{
  success: boolean;
  syncedCounts: { sessions: number; memories: number; settings: number; feedbacks: number; knowledge: number };
  errors: string[];
}> {
  const client = getSupabaseInstance(url, key);
  if (!client) {
    throw new Error('Supabase client could not be initialized. Please provide a valid Supabase Anon Key.');
  }

  const db: DatabaseSchema = await localDb.readDatabase();
  const errors: string[] = [];
  const syncedCounts = {
    sessions: 0,
    memories: 0,
    settings: 0,
    feedbacks: 0,
    knowledge: 0
  };

  // Sync sessions
  if (db.sessions.length > 0) {
    const { error } = await client.from('sessions').upsert(db.sessions, { onConflict: 'id' });
    if (error) errors.push(`Sessions sync error: ${error.message}`);
    else syncedCounts.sessions = db.sessions.length;
  }

  // Sync memories
  if (db.memories.length > 0) {
    const { error } = await client.from('memories').upsert(db.memories, { onConflict: 'id' });
    if (error) errors.push(`Memories sync error: ${error.message}`);
    else syncedCounts.memories = db.memories.length;
  }

  // Sync settings
  if (db.settings.length > 0) {
    const { error } = await client.from('settings').upsert(db.settings, { onConflict: 'id' });
    if (error) errors.push(`Settings sync error: ${error.message}`);
    else syncedCounts.settings = db.settings.length;
  }

  // Sync feedbacks
  if (db.feedbacks.length > 0) {
    const { error } = await client.from('feedbacks').upsert(db.feedbacks, { onConflict: 'id' });
    if (error) errors.push(`Feedbacks sync error: ${error.message}`);
    else syncedCounts.feedbacks = db.feedbacks.length;
  }

  // Sync knowledge
  if (db.knowledge.length > 0) {
    const { error } = await client.from('knowledge').upsert(db.knowledge, { onConflict: 'id' });
    if (error) errors.push(`Knowledge sync error: ${error.message}`);
    else syncedCounts.knowledge = db.knowledge.length;
  }

  return {
    success: errors.length === 0,
    syncedCounts,
    errors
  };
}
