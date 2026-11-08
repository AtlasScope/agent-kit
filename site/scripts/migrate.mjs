#!/usr/bin/env node
// Applies db/schema.sql to DATABASE_URL. Run: vercel env pull .env.local && node --env-file=.env.local scripts/migrate.mjs
import fs from "node:fs";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL is not set. Pull it with `vercel env pull .env.local` first."); process.exit(1); }
const sql = neon(url);
const text = fs.readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8").replace(/--.*$/gm, "");
for (const stmt of text.split(";").map((s) => s.trim()).filter(Boolean)) await sql.query(stmt);
console.log("Schema applied.");
