"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface DraftStore {
  get: (key: string) => string;
  set: (key: string, value: string) => void;
  clear: (key: string) => void;
}

const DraftContext = createContext<DraftStore | null>(null);

export function DraftProvider({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const set = useCallback((key: string, value: string) => {
    setDrafts((d) => ({ ...d, [key]: value }));
  }, []);
  const clear = useCallback((key: string) => {
    setDrafts((d) => {
      const next = { ...d };
      delete next[key];
      return next;
    });
  }, []);
  const store = useMemo<DraftStore>(() => ({ get: (k) => drafts[k] ?? "", set, clear }), [drafts, set, clear]);
  return <DraftContext.Provider value={store}>{children}</DraftContext.Provider>;
}

export function useDraft(key: string): [string, (v: string) => void, () => void] {
  const store = useContext(DraftContext);
  if (!store) throw new Error("useDraft must be used inside DraftProvider");
  return [store.get(key), (v: string) => store.set(key, v), () => store.clear(key)];
}
