import type { Viewport } from "next";
import { notFound } from "next/navigation";
import { SignInShell, backFrom } from "@/components/auth/SignInShell";
import { fixturesEnabled } from "../store";

export const metadata = { title: "Sign in (sample)", robots: { index: false } };
export const viewport: Viewport = { themeColor: "#020302", colorScheme: "dark" };
export const dynamic = "force-dynamic";

// The sign-in page's frame with a stand-in for Clerk's form, for previews and local review where Clerk isn't set up.
// The stand-in only shows where the form sits and roughly how big it is; it signs nobody in.
export default async function SignInFixture({ searchParams }: { searchParams: Promise<{ redirect_url?: string }> }) {
  if (!fixturesEnabled()) notFound();
  const { redirect_url } = await searchParams;
  return (
    <SignInShell back={backFrom(redirect_url ?? "/install")}>
      <div className="signin__sample" aria-label="Sample sign-in form">
        <p className="signin__sampleh">Sign in or create an account</p>
        <span className="signin__samplebtn">Continue with GitHub</span>
        <span className="signin__samplediv">or</span>
        <span className="signin__samplein">Email address</span>
        <span className="signin__samplego">Continue</span>
      </div>
    </SignInShell>
  );
}
