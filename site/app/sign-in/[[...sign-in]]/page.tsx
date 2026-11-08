import { SignIn } from "@clerk/nextjs";
import { notFound } from "next/navigation";
import { authEnabled } from "@/lib/site";

export const metadata = { title: "Sign in", robots: { index: false } };

export default function SignInPage() {
  if (!authEnabled()) notFound();
  return <main className="page" style={{ justifyItems: "center" }}><SignIn withSignUp /></main>;
}
