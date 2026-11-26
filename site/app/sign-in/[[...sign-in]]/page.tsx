import type { Viewport } from "next";
import { notFound } from "next/navigation";
import { authEnabled } from "@/lib/site";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignInShell, backFrom } from "@/components/auth/SignInShell";

export const metadata = { title: "Sign in", robots: { index: false } };
// Always dark, so the browser's own bar matches it in both themes.
export const viewport: Viewport = { themeColor: "#020302", colorScheme: "dark" };

// Sign in or create an account (the install page's "Create a free account" lands here). Everything in the library
// works without one.
export default async function SignInPage({ searchParams }: { searchParams: Promise<{ redirect_url?: string | string[] }> }) {
  if (!authEnabled()) notFound();
  const { redirect_url } = await searchParams;
  return <SignInShell back={backFrom(redirect_url)}><SignInForm /></SignInShell>;
}
