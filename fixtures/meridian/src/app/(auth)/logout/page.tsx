"use client";

import Link from "next/link";
import { useEffect } from "react";
import { clearCookie, LAST_WORKSPACE_COOKIE, SESSION_COOKIE } from "@/lib/session";

export default function LogoutPage() {
  useEffect(() => {
    clearCookie(SESSION_COOKIE);
    clearCookie(LAST_WORKSPACE_COOKIE);
  }, []);
  return (
    <div className="card card-pad login-card stack">
      <h1>Signed out</h1>
      <p className="muted">Your session on this device has ended.</p>
      <Link className="btn btn-primary" href="/login?reason=signed-out">
        Sign in again
      </Link>
    </div>
  );
}
