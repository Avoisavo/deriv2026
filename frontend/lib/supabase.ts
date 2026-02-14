import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Browser Supabase client; null if env vars are missing (realtime POC disabled). */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        realtime: {
          logLevel: process.env.NODE_ENV === "development" ? "info" : "warn",
          logger: (kind, msg, data) => {
            if (process.env.NODE_ENV === "development") {
              console.log(`[Realtime ${kind}]`, msg, data ?? "");
            }
          },
        },
      })
    : null;

/** Table name for real-time AI decisions POC (prompt, consequences, solution, outcome). */
export const REALTIME_DECISIONS_TABLE = "realtime_ai_decisions";

/** Table name for event-style realtime (event_id, title, summary, evidence). */
export const REALTIME_EVENTS_TABLE = "realtime_events";
