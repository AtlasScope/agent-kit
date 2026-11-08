# Clerk for sign-in, Neon Postgres for account data

Sign-in uses Clerk (GitHub, Google and email code, no passwords) and collections and notes live in Neon Postgres, both added through the Vercel Marketplace. We picked Clerk over Supabase Auth, WorkOS and Better Auth for the least setup and built-in MCP client sign-in, accepting a per-user price above 50,000 monthly retained users; Neon keeps the database billed through Vercel with a free tier that fits early use.
