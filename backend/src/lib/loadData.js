import fs from "node:fs/promises";
import { DATASET_FILE, HOT_LAYER_FILE, RAW_FILE } from "../config.js";

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

export async function loadSourceData() {
  const [dataset, hotLayer, raw] = await Promise.all([
    readJson(DATASET_FILE),
    readJson(HOT_LAYER_FILE),
    readJson(RAW_FILE),
  ]);

  return { dataset, hotLayer, raw };
}
