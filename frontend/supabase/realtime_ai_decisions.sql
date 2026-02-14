-- Run this in Supabase SQL Editor to create the table and enable Realtime.
-- Then in Supabase Dashboard: Database → Replication → add "realtime_ai_decisions" to the publication.

create table if not exists public.realtime_ai_decisions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  prompt text not null default '',
  consequences text not null default '',
  solution text not null default '',
  outcome text not null default ''
);

alter table public.realtime_ai_decisions enable row level security;

-- Allow anon to read (for Realtime subscription) and insert (for testing).
create policy "Allow anon read and insert"
  on public.realtime_ai_decisions
  for all
  to anon
  using (true)
  with check (true);

-- Enable Realtime: In Supabase Dashboard go to Database → Replication →
-- add "realtime_ai_decisions" to the supabase_realtime publication.
