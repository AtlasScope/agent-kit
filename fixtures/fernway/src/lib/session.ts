const KEY = 'fernway.session';

export interface Session {
  name: string;
  signedInAt: number;
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function signIn(name: string) {
  localStorage.setItem(KEY, JSON.stringify({ name, signedInAt: Date.now() }));
}

export function signOut() {
  localStorage.removeItem(KEY);
}
