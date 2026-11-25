import type { Viewport } from "next";
import { notFound } from "next/navigation";
import { InstallRoute } from "@/components/InstallRoute";
import { fixturesEnabled } from "../store";
import "../../../(stage)/install/install.css";

export const metadata = { title: "Install (sample account offer)", robots: { index: false } };
export const viewport: Viewport = { themeColor: "#020302", colorScheme: "dark" };
export const dynamic = "force-dynamic";

// The install page with the account offer turned on, for previews, local review and the smoke test, where Clerk isn't
// set up. Without the view from orbit (that lives in the homepage's layout), and its sign-in links lead to a 404 here.
// Serves only where the other sample-data pages do (store.ts).
export default function InstallFixture() {
  if (!fixturesEnabled()) notFound();
  return <InstallRoute account />;
}
