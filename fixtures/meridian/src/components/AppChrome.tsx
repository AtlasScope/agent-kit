"use client";

import { useEffect, useState, type ReactNode } from "react";
import { GlobalRail } from "./GlobalRail";
import { CommandPalette } from "./CommandPalette";
import { ToastProvider } from "./Toast";

export function AppChrome({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <ToastProvider>
      <div className="shell">
        <GlobalRail onOpenPalette={() => setPaletteOpen(true)} />
        <div className="main">{children}</div>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </ToastProvider>
  );
}
