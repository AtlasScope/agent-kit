import "server-only";
import type { CollectionData } from "@/components/CollectionsView";

// Sample collections for looking at the signed-in pages without Clerk or the database. Real accounts never
// read this. It serves only in local development, on Vercel preview deployments, or with ACCOUNT_FIXTURES=1,
// and every other host gets a 404. The store lives in server memory, so it resets when the server restarts.
export const fixturesEnabled = () =>
  process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview" || process.env.ACCOUNT_FIXTURES === "1";

const seed = (): CollectionData[] => [
  { id: "00000000-0000-4000-8000-000000000001", name: "Starred", is_starred: true, is_public: false, items: [
    { kind: "prompt", ref: "A01" }, { kind: "skill", ref: "diagnosing-bugs" }, { kind: "prompt", ref: "RC11" }, { kind: "prompt", ref: "S06" },
    // RC11 saved a second time under another spelling, as an older client could: it shows, counts and removes as one.
    { kind: "prompt", ref: "rc11" },
  ] },
  { id: "00000000-0000-4000-8000-000000000002", name: "Design reviews", is_starred: false, is_public: true, items: [
    { kind: "skill", ref: "refactoring-ui" }, { kind: "skill", ref: "ux-heuristics" }, { kind: "prompt", ref: "UI042" },
    { kind: "prompt", ref: "MO06" }, { kind: "skill", ref: "improve-animations" },
  ] },
  { id: "00000000-0000-4000-8000-000000000003", name: "Before a launch", is_starred: false, is_public: false, items: [
    { kind: "prompt", ref: "X03" }, { kind: "prompt", ref: "RDBR01" }, { kind: "skill", ref: "grilling" },
  ] },
  { id: "00000000-0000-4000-8000-000000000004", name: "Database week", is_starred: false, is_public: false, items: [] },
];

const g = globalThis as unknown as { __accountFixture?: CollectionData[] };
export const store = () => (g.__accountFixture ??= seed());
export const reset = () => { g.__accountFixture = seed(); };
export const SAMPLE_PATH = "/account/fixture";
// Creating or renaming a collection to exactly this name returns an error, so the failure message can be reviewed.
export const FAIL_NAME = "Show an error";
