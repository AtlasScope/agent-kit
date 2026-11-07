"use client";

import { useRouter } from "next/navigation";
import type { Role } from "@/lib/types";

export function RoleSwitcher({ role }: { role: Role }) {
  const router = useRouter();
  function choose(next: Role) {
    document.cookie = `kestrel_role=${next}; path=/; max-age=43200; samesite=lax`;
    router.refresh();
  }
  return (
    <div className="segmented" role="radiogroup" aria-label="Working as">
      <button
        type="button"
        role="radio"
        aria-checked={role === "frontdesk"}
        className={role === "frontdesk" ? "seg active" : "seg"}
        onClick={() => choose("frontdesk")}
      >
        Front desk
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={role === "clinician"}
        className={role === "clinician" ? "seg active" : "seg"}
        onClick={() => choose("clinician")}
      >
        Clinician
      </button>
    </div>
  );
}
