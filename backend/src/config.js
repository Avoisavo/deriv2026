import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, "..");
export const DATA_DIR = path.resolve(ROOT_DIR, "data");
export const DATASET_FILE = path.resolve(DATA_DIR, "spritzel_dataset_enriched.json");
export const HOT_LAYER_FILE = path.resolve(DATA_DIR, "spritzel_hot_layer_enriched.json");
export const RAW_FILE = path.resolve(DATA_DIR, "spritzezl_raw.json");

export const PORT = Number(process.env.PORT ?? 4000);
