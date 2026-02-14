import path from "node:path";
import { loadEnvFile, getEnv } from "../pipeline/env.js";
import { ENV_FILE, ROOT } from "../pipeline/paths.js";
import { runEventExtraction, DEFAULT_OUTPUT_FILE } from "../pipeline/extract-events.js";
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

  const model = getArgValue(argv, "model", getEnv(env, "GROQ_MODEL", "llama-3.3-70b-versatile"));
  const outputArg = getArgValue(argv, "output", DEFAULT_OUTPUT_FILE);
  const outputFile = path.isAbsolute(outputArg) ? outputArg : path.resolve(ROOT, outputArg);
  const maxEventsPerSource = Math.max(4, Number(getArgValue(argv, "max-events", "8")) || 8);

  const extractResult = await runEventExtraction({
    apiKey: getEnv(env, "GROQ_API_KEY"),
    model,
    outputFile,
    maxEventsPerSource,
  });

  process.stdout.write(`Extraction complete: ${extractResult.eventCount} events at ${extractResult.outputFile}\n`);

  const pushResult = await runEventPush({
    inputFile: extractResult.outputFile,
    table: getArgValue(argv, "table", "truman_events"),
    batchSize: Number(getArgValue(argv, "batch", "200")) || 200,
    supabaseUrl: getEnv(env, "SUPABASE_URL"),
    serviceRoleKey: getEnv(env, "SUPABASE_SERVICE_ROLE_KEY"),
    onBatch: ({ batchIndex, totalBatches, rowCount }) => {
      process.stdout.write(`Upserted batch ${batchIndex}/${totalBatches} (${rowCount} rows)\n`);
    },
  });

  process.stdout.write(
    `Pipeline complete: pushed ${pushResult.pushedCount} rows to ${pushResult.table}\n`
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
