"use client";
import { useAuthGate } from "./AuthGate";

// Clerk's sign-in form. AuthGate always loads Clerk on /sign-in, so this waits only for that one chunk.
export function SignInForm() {
  const { parts } = useAuthGate();
  return parts ? <parts.SignIn withSignUp /> : <p className="note" role="status">Loading sign-in…</p>;
}
