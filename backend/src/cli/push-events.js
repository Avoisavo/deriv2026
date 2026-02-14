import { loadEnvFile, getEnv } from "../pipeline/env.js";
import { ENV_FILE } from "../pipeline/paths.js";
import { runEventPush } from "../pipeline/push-events.js";

function getArgValue(argv, key, fallback = "") {
  const prefix = `--${key}=`;
  const match = argv.find((arg) => arg.startsWith(prefix));
  if (!match) return fallback;
  return match.slice(prefix.length);
}

async function main() {
  const argv = process.argv.slice(2);
  const env = await loadEnvFile(ENV_FILE);

  const inputFile = getArgValue(argv, "file", "data/truman_events_from_ai_crawl.json");
  const table = getArgValue(argv, "table", "truman_events");
  const batchSize = Number(getArgValue(argv, "batch", "200")) || 200;

  const result = await runEventPush({
    inputFile,
    table,
    batchSize,
    supabaseUrl: getEnv(env, "SUPABASE_URL"),
    serviceRoleKey: getEnv(env, "SUPABASE_SERVICE_ROLE_KEY"),
    onBatch: ({ batchIndex, totalBatches, rowCount }) => {
      process.stdout.write(`Upserted batch ${batchIndex}/${totalBatches} (${rowCount} rows)\n`);
    },
  });

  process.stdout.write(
    `Done. Upserted ${result.pushedCount} events from ${result.inputFile} into table ${result.table}\n`
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
