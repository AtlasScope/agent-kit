"use client";

import { useToast } from "@/components/Toast";

export function SaveBar({ label = "Save changes", message = "Saved" }: { label?: string; message?: string }) {
  const toast = useToast();
  return (
    <div className="row" style={{ marginTop: 16 }}>
      <button className="btn btn-primary" onClick={() => toast(message)}>
        {label}
      </button>
    </div>
  );
}
