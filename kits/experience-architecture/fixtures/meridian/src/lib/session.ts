export const SESSION_COOKIE = "meridian_session";
export const SESSION_VALUE = "demo";
export const LAST_WORKSPACE_COOKIE = "meridian_ws";

export function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const hit = document.cookie.split("; ").find((c) => c.startsWith(name + "="));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : undefined;
}

export function writeCookie(name: string, value: string, maxAgeDays = 30) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeDays * 86400}; samesite=lax`;
}

export function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}
