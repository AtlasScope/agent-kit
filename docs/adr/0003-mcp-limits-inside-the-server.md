# The public MCP server enforces its own cutoff

The public MCP server has a firewall rate limit, a daily call cap and an off switch inside the app, and Vercel spend management is used for alerts only. Vercel's automatic pause at the spend limit stops every project on the team, including unrelated apps, so the hard cutoff has to live in this server instead.
