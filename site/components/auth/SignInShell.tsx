import Link from "next/link";

// The sign-in page's frame, shared by /sign-in (with Clerk's form) and the sample-data preview at
// /account/fixture/sign-in (with a stand-in, since Clerk isn't set up there). Always dark, like the homepage and
// /install it continues from: a short heading, the form in a glass card on the floor's light, and a way to carry on
// without an account. Clerk's one form signs in or creates an account.
export function SignInShell({ back, children }: { back: string; children: React.ReactNode }) {
  return (
    <main className="quiet signin">
      <div className="signin__in">
        <h1>Make Agent Kit yours</h1>
        <p className="signin__lede">Free. Your starred prompts and skills, on any computer.</p>
        <div className="signin__card">{children}</div>
        <p className="signin__out"><Link href={back}>Continue without an account</Link></p>
        <p className="signin__note">What an account stores is on the <Link href="/privacy">privacy page</Link>.</p>
      </div>
    </main>
  );
}

// Where "Continue without an account" goes: back where they came from (Clerk's redirect_url), if it is a page on this
// site, else the library.
export const backFrom = (url?: string | string[]) => {
  const u = Array.isArray(url) ? url[0] : url;
  return u && u.startsWith("/") && !u.startsWith("//") && !u.startsWith("/sign-in") ? u : "/prompts";
};
