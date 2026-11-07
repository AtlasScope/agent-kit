export function nextId(prefix: string, existing: string[]): string {
  const max = existing.reduce((acc, id) => {
    const n = Number(id.slice(prefix.length + 1));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `${prefix}-${max + 1}`;
}

export function normaliseId(raw: string): string {
  return raw.trim().toUpperCase();
}
