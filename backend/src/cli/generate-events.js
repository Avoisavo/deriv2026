import path from "node:path";
import { loadEnvFile, getEnv } from "../pipeline/env.js";
import { ENV_FILE, ROOT } from "../pipeline/paths.js";
import {
  runEventExtraction,
  DEFAULT_OUTPUT_FILE,
  DEFAULT_INPUT_FILES,
} from "../pipeline/extract-events.js";

function getArgValue(argv, key, fallback = "") {
  const prefix = `--${key}=`;
  const match = argv.find((arg) => arg.startsWith(prefix));
  if (!match) return fallback;
  return match.slice(prefix.length);
}

async function main() {
  const argv = process.argv.slice(2);
  const env = await loadEnvFile(ENV_FILE);

  const apiKey = getEnv(env, "GROQ_API_KEY");
  const model = getArgValue(argv, "model", getEnv(env, "GROQ_MODEL", "llama-3.3-70b-versatile"));
  const outputArg = getArgValue(argv, "output", DEFAULT_OUTPUT_FILE);
  const outputFile = path.isAbsolute(outputArg) ? outputArg : path.resolve(ROOT, outputArg);
  const maxEventsPerSource = Math.max(4, Number(getArgValue(argv, "max-events", "8")) || 8);

  const result = await runEventExtraction({
    apiKey,
    model,
    inputFiles: DEFAULT_INPUT_FILES,
    outputFile,
    maxEventsPerSource,
  });

  process.stdout.write(`Wrote ${result.eventCount} events to ${result.outputFile}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
