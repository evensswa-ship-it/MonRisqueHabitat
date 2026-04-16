export function normalizeAddress(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
