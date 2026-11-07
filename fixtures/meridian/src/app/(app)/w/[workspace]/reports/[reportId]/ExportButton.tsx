"use client";

import { useToast } from "@/components/Toast";

export function ExportButton({ name }: { name: string }) {
  const toast = useToast();
  return (
    <button className="btn" onClick={() => toast(`${name} export queued (demo)`)}>
      Export CSV
    </button>
  );
}
