# Enable Realtime for tables

Your app subscribes to **INSERT** events. Supabase only sends those if the table is in the `supabase_realtime` publication.

## Option A: Dashboard (recommended)

1. Open [Supabase Dashboard](https://app.supabase.com) and select your project.
2. In the left sidebar go to **Database** → **Replication** (or **Publications** in some versions).
3. Find the publication **`supabase_realtime`**.
4. Click it (or "Edit" / "Manage").
5. Under "Tables in publication" or "Add tables", turn **ON**:
   - **`realtime_events`**
   - **`realtime_ai_decisions`** (if you use that table too)
6. Save.

## Option B: SQL Editor

1. In the Dashboard go to **SQL Editor**.
2. Run:

```sql
-- Add realtime_events (event_id, title, summary, evidence)
alter publication supabase_realtime add table public.realtime_events;

-- Optional: if you also use realtime_ai_decisions (prompt, consequences, solution, outcome)
alter publication supabase_realtime add table public.realtime_ai_decisions;
```

If you get "table is already in the publication", the table is already enabled; ignore that error.

## Realtime must be enabled for the project

If you see **`Subscription status: CLOSED`** or **`TIMED_OUT`**:

1. In the Dashboard go to **Project Settings** (gear icon) → **API** (or **Database**).
2. Ensure **Realtime** is enabled for your project (some projects have a Realtime toggle or it’s on by default).
3. In **Database** → **Replication**, confirm **`realtime_events`** is listed under the **`supabase_realtime`** publication (toggle ON).
4. In **Table Editor**, open **`realtime_events`** and confirm the table exists and has columns: `event_id`, `title`, `summary`, `evidence`.

## After adding

1. Refresh your app tab (or restart `npm run dev`).
2. Open **/prediction** and check the browser console: you should see `[Realtime] Subscription status: SUBSCRIBED`.
3. Insert a row into `realtime_events` (e.g. from **Table Editor** or SQL); the overlay should open.
