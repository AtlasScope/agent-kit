import type { Metadata } from "next";
import Link from "next/link";
import { DocPage } from "@/components/DocPage";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Agent Kit stores, where, and how to remove it.",
  alternates: { canonical: "/privacy" },
};

// Draft written from what the site's code stores (db/schema.sql, lib/mcp-guard.ts, the browser storage
// in InstallRail and GuideProgress). It has not been reviewed; keep the notice until it has.
export default function Privacy() {
  return (
    <DocPage
      path="/privacy"
      title="Privacy"
      lead="You can read and copy everything on this site without an account. This page lists what is stored when you do more than that, and where."
      notice={<><strong>Draft, 10 Nov 2026.</strong> Written from what the site stores today. It has not been reviewed yet, so don’t rely on it as a final policy.</>}
      sections={[
        {
          id: "reading", title: "Reading the site",
          body: <>
            <p>The site is hosted on Vercel. Like any web host, Vercel keeps request logs, which include your IP address, the page you asked for and the time. There are no ads and no tracking scripts, and the site does not run page analytics today. If that changes, this page will say so first.</p>
            <p>The sign-in service, Clerk, loads only on the sign-in and account pages and for visitors who are already signed in. It sets cookies that keep you signed in. Other pages check one of those cookies in your browser to decide whether to load it; that check sends nothing anywhere.</p>
          </>,
        },
        {
          id: "browser", title: "In your browser",
          body: <>
            <p>Two things are kept in your own browser’s local storage and never sent to us: the agent you last picked on the homepage, and which steps of the <Link href="/start">first-app guide</Link> and lessons you have finished. Clearing your browsing data removes both.</p>
          </>,
        },
        {
          id: "accounts", title: "If you sign in",
          body: <>
            <p>Accounts are optional and are handled by Clerk, which stores your sign-in details: your email address, and your name and picture if your sign-in provider shares them.</p>
            <p>Your collections are stored in a Neon Postgres database: each collection’s name, whether it is shared, when it was made and changed, and the ids of the prompts and skills in it, linked to your Clerk account id. A collection is private unless you share it; a shared collection has a public page anyone with the link can open.</p>
          </>,
        },
        {
          id: "mcp", title: "The MCP server",
          body: <>
            <p>The read-only MCP server counts calls per day in total, to enforce a daily limit. It does not record who made them. To limit how often one visitor can call it, it holds your IP address in memory for about a minute and does not save it.</p>
          </>,
        },
        {
          id: "control", title: "Removing your data",
          body: <>
            <p>You can rename or delete any collection, and remove items from it, on your Collections page. Deleting a collection removes its items with it.</p>
            <p>A way to export everything and delete your whole account in one place is planned. Until it exists, ask us and we will do it by hand.</p>
          </>,
        },
        {
          id: "sharing", title: "Who we share it with",
          body: <>
            <p>Only the services that run the site: Vercel for hosting, Clerk for accounts and Neon for the database. We don’t sell or rent your data, and we don’t share it with advertisers.</p>
          </>,
        },
      ]}
    />
  );
}
