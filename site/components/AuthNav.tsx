"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthGate } from "./auth/AuthGate";

// The header's account controls. Until Clerk is needed this is a plain link to /sign-in that brings the
// visitor back here; a signed-in visitor gets the Starred link and account menu once Clerk loads. On the sign-in
// page the form is right below, so the header shows nothing there.
export function AuthNav() {
  const { parts } = useAuthGate();
  const pathname = usePathname();
  if (pathname.startsWith("/sign-in")) return null;
  if (parts) return <parts.AuthNav />;
  return <Link className="btn btn--sm auth-out" href={signInHref(pathname)}>Sign in</Link>;
}

export const signInHref = (back: string) => (back.startsWith("/sign-in") ? "/sign-in" : `/sign-in?redirect_url=${encodeURIComponent(back)}`);
