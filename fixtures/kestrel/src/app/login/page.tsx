"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"frontdesk" | "clinician">("frontdesk");
  const [busy, setBusy] = useState(false);

  function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    document.cookie = "kestrel_session=demo; path=/; max-age=43200; samesite=lax";
    document.cookie = `kestrel_role=${role}; path=/; max-age=43200; samesite=lax`;
    router.push("/schedule");
    router.refresh();
  }

  return (
    <div className="center-page">
      <form className="card login-card" onSubmit={signIn}>
        <div className="brand">
          <span className="brand-mark" aria-hidden>K</span>
          Kestrel
        </div>
        <h1>Sign in</h1>
        <p className="muted">Demo build. Pick who you are working as today.</p>
        <fieldset className="role-pick">
          <legend>Working as</legend>
          <label><input type="radio" name="role" checked={role === "frontdesk"} onChange={() => setRole("frontdesk")} /> Front desk</label>
          <label><input type="radio" name="role" checked={role === "clinician"} onChange={() => setRole("clinician")} /> Clinician</label>
        </fieldset>
        <button type="submit" className="btn primary" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}
