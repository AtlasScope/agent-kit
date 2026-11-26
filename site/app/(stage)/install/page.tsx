import type { Metadata, Viewport } from "next";
import { InstallRoute } from "@/components/InstallRoute";
import { KITS, authEnabled } from "@/lib/site";
import { counts } from "@/lib/content";
import "./install.css";

export const metadata: Metadata = {
  title: "Install",
  description: `Install Agent Kit in Claude Code, Codex, Cursor or any coding agent: ${KITS.length} kits and ${counts.skills} skills, with one message you paste into your agent.`,
  alternates: { canonical: "/install" },
};

// Always dark, so the browser's own bar matches it in both themes.
export const viewport: Viewport = { themeColor: "#020302", colorScheme: "dark" };

export default function Install() {
  // The dev server shows the account button without sign-in keys, so the page reviews as it looks live. Its sign-in
  // link only works where accounts are set up.
  return <InstallRoute account={authEnabled() || process.env.NODE_ENV === "development"} />;
}
