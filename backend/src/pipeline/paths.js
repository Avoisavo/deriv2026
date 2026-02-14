import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT = path.resolve(__dirname, "../..");
export const DATA_DIR = path.resolve(ROOT, "data");
export const ENV_FILE = path.resolve(ROOT, ".env");

export function resolveFromRoot(maybeRelativePath) {
  return path.resolve(ROOT, maybeRelativePath);
}
