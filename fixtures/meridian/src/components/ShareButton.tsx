"use client";

import { useToast } from "./Toast";

export function ShareButton({ code }: { code: string }) {
  const toast = useToast();
  return (
    <button
      className="btn"
      onClick={async () => {
        const url = `${window.location.origin}/share/${code}`;
        try {
          await navigator.clipboard.writeText(url);
          toast("Share link copied");
        } catch {
          toast(url);
        }
      }}
    >
      Copy share link
    </button>
  );
}
