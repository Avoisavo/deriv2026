-- Create table matching event structure (event_id, source_key, domain, title, summary, evidence).
-- Run in Supabase SQL Editor. Then: Database → Replication → add "realtime_events" to the publication.

create table if not exists public.realtime_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_id text not null,
  source_key text not null default '',
  domain text not null default '',
  title text not null default '',
  summary text not null default '',
  evidence text[] not null default '{}'
);

-- Optional: unique constraint on event_id if it should be a business key
-- alter table public.realtime_events add constraint realtime_events_event_id_key unique (event_id);

alter table public.realtime_events enable row level security;

create policy "Allow anon read and insert"
  on public.realtime_events
  for all
  to anon
  using (true)
  with check (true);

-- Enable Realtime: Database → Replication → add "realtime_events" to supabase_realtime.
