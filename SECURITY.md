# Security

## Report a problem privately

Use the **Report a vulnerability** button on this repository's [Security tab](https://github.com/AtlasScope/agent-kit/security). Please don't open a public issue for a security problem.

Examples of what to report:

- a skill or prompt that tells an agent to send data somewhere, run a hidden command, or skip an approval it should ask for;
- a script in a skill folder that makes network calls or installs hooks it doesn't mention;
- a problem in the website at atlasscope.dev, its MCP endpoint or its accounts.

## What a skill can and can't do

A skill is written instructions. It runs with whatever permissions you've already given your coding agent: if your agent can edit files or run commands, a skill can ask it to. Agent Kit's own commands run only when you type them, and the database prompts default to read-only, but your agent's permission settings are what actually enforce that. Review what an agent proposes before approving changes to production systems.

Third-party skills are copied at a pinned commit and read in full before they're added (see each kit's `THIRD_PARTY.md`). They don't update on their own.
