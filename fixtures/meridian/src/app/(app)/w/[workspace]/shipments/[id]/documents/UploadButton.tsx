"use client";

import { useToast } from "@/components/Toast";

export function UploadButton() {
  const toast = useToast();
  return (
    <label className="btn">
      Upload
      <input
        type="file"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) toast(`${f.name} attached (demo, not stored)`);
        }}
      />
    </label>
  );
}
