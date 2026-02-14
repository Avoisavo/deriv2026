export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function toSlug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

export function stableSortByTimeDesc(items, key = "timestamp") {
  return [...items].sort((a, b) => {
    const ta = Date.parse(a[key] ?? 0);
    const tb = Date.parse(b[key] ?? 0);
    return tb - ta;
  });
}

export function dedupeArray(values) {
  return [...new Set(values.filter(Boolean))];
}
