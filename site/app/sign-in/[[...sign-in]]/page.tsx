import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { notFound } from "next/navigation";
import { authEnabled } from "@/lib/site";

export const metadata = { title: "Sign in", robots: { index: false } };

// Why an account helps, beside the sign-in form. Everything in the library works without one.
export default function SignInPage() {
  if (!authEnabled()) notFound();
  return (
    <main className="page signin">
      <div className="signin__why">
        <h1>Sign in to keep what you use</h1>
        <p className="lead ink2">An account is optional. Everything in the library can be read and copied without one.</p>
        <ul>
          <li><strong>Star</strong> any prompt or skill to find it again later.</li>
          <li><strong>Group them</strong> into named collections.</li>
          <li><strong>Share a collection</strong> with a link. One that holds skills gets a single install command for all of them.</li>
        </ul>
        <p className="note">What an account stores is listed on the <Link className="lic" href="/privacy">privacy page</Link>.</p>
      </div>
      <div className="signin__form"><SignIn withSignUp /></div>
    </main>
  );
}
