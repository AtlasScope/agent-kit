import Link from "next/link";
import { notFound } from "next/navigation";
import { authEnabled } from "@/lib/site";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata = { title: "Sign in", robots: { index: false } };

// Why an account helps, beside the sign-in form, which signs people in or creates an account (the install page's
// "Create a free account" and "Sign in" both land here). Everything in the library works without one.
export default function SignInPage() {
  if (!authEnabled()) notFound();
  return (
    <main className="page signin">
      <div className="signin__why">
        <h1>Keep the prompts you use</h1>
        <p className="lead ink2">Sign in, or make a free account with the same form. An account is optional. Everything in the library can be read and copied without one.</p>
        <ul className="signin__list">
          <li><span><strong>Star</strong> any prompt or skill to find it again later.</span></li>
          <li><span><strong>Group them</strong> into named collections.</span></li>
          <li><span><strong>Share a collection</strong> with a link. One that holds skills gets a single install command for all of them.</span></li>
        </ul>
        <p className="note">What an account stores is listed on the <Link className="lic" href="/privacy">privacy page</Link>.</p>
      </div>
      <div className="signin__form"><SignInForm /></div>
    </main>
  );
}
