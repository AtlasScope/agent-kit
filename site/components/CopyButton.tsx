"use client";
import { useState } from "react";

export function CopyButton({ text, label = "Copy", className = "copy" }: { text: string; label?: string; className?: string }) {
  const [state, setState] = useState(label);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setState("Copied"); }
        catch { setState("Select and copy"); }
        setTimeout(() => setState(label), 1600);
      }}
    >
      {state}
    </button>
  );
}
