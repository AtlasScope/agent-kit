"use client";

import { useState } from "react";
import { SESSION_COOKIE, SESSION_VALUE, writeCookie } from "@/lib/session";

function destinationFor(next: string | undefined): string {
  if (next && next.startsWith("/w/")) return next;
  return "/workspaces";
}

export function LoginForm({ next, reason }: { next?: string; reason?: string }) {
  const [email, setEmail] = useState("dana@meridian-demo.example");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    writeCookie(SESSION_COOKIE, SESSION_VALUE, 7);
    window.location.assign(destinationFor(next));
  };

  return (
    <form className="card card-pad login-card stack" onSubmit={submit}>
      <div>
        <div className="rail-logo" style={{ marginBottom: 12 }}>
          M
        </div>
        <h1>Sign in to Meridian</h1>
        <p className="page-sub">Shipments, carriers and freight spend for your whole operation.</p>
      </div>
      {reason === "signed-out" ? <div className="note">You have been signed out.</div> : null}
      <div className="field">
        <label htmlFor="email">Work email</label>
        <input id="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Any value works in the demo"
          autoComplete="current-password"
        />
      </div>
      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <p className="small muted">Single sign-on is configured by your organization owner under Organization settings.</p>
    </form>
  );
}
