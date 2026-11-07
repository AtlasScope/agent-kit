"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface DraftCtx {
  draft: string;
  setDraft: (value: string) => void;
}

const Ctx = createContext<DraftCtx | null>(null);

export function NoteDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState("");
  return <Ctx.Provider value={{ draft, setDraft }}>{children}</Ctx.Provider>;
}

export function useNoteDraft() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useNoteDraft must be used inside NoteDraftProvider");
  return v;
}
