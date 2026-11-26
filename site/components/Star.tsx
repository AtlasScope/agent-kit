"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthGate } from "./auth/AuthGate";
import { signInHref } from "./AuthNav";
import { StarIcon, type StarProps } from "./StarIcon";
import { saveIntent } from "@/lib/intent";

const authOn = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

// A star for one prompt or skill. Signed out, it links to sign-in and comes back here, and the star is remembered
// (lib/intent.ts) so it is added once they are signed in. Signed in, it adds to or
// removes from Starred once Clerk has loaded, and stays greyed out until then.
// `preview` shows the signed-out star where Clerk isn't set up (the install page's sample-data copy), so the journey can
// be seen and tested there.
export function Star({ preview, ...props }: StarProps & { preview?: boolean }) {
  const { parts, signedInHint } = useAuthGate();
  const pathname = usePathname();
  if (!authOn && !preview) return null;
  if (parts) return <parts.Star {...props} />;
  const cls = `star${props.label ? " star--label" : ""}`;
  const inner = <><StarIcon on={false} />{props.label && <span>Star</span>}</>;
  if (signedInHint) return <button className={cls} type="button" aria-label={`Star ${props.title}`} disabled>{inner}</button>;
  return <Link className={cls} href={signInHref(pathname)} onClick={() => saveIntent(props.kind, props.refId)} aria-label={`Star ${props.title}`} title="Sign in to star">{inner}</Link>;
}
