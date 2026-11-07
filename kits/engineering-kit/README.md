# Engineering Kit

Engineering skills for AI coding agents, picked for a solo operator who wants agents to use judgment and only interview, test-first or write reports when asked. Every command here runs only when you type it. Four helper skills (`grilling`, `codebase-design`, `domain-modeling`, `writing-for-agents`) stay reachable so the commands can call them, with descriptions narrowed so they do not start on their own.

It is the engineering sibling of [design-kit](../design-kit). Credits, versions and licenses are in [THIRD_PARTY.md](THIRD_PARTY.md).

## Commands

| Command | What it does |
|---|---|
| `/engineer` | Describe what is going on and get one starting move: an investigation prompt to paste, the skill to run, or a thinking prompt. It suggests and stops; it runs nothing until you say go. Catalog from the Agent Engineering Field Guide. |
| `/diagnosing-bugs` | Hard bugs and performance regressions: build a loop that goes red, minimise, rank hypotheses, instrument, fix with a regression test, clean up. |
| `/tdd` | Test-first work in vertical slices, with the seams agreed before any test is written. |
| `/improve-codebase-architecture` | Scans recent hot spots for shallow modules, writes a before/after HTML report to the temp folder, then interviews you on the one you pick. |
| `/grill-me` | Rounds of numbered questions, each with a recommended answer, until a plan has no open branches. |
| `/grill-with-docs` | The same interview, writing `GLOSSARY.md` terms and ADRs as decisions settle. |
| `/research` | A background agent answers a question from primary sources and saves a cited Markdown note. |
| `/retro` | Reviews a session and suggests changes to the agent's environment: navigation, automated checks, steering files, tool cost. |
| `/wizard` | Writes a bash script that walks you through steps only a human can do (dashboards, secrets, cutovers). |
| `/to-questionnaire` | Turns a decision you cannot answer alone into a questionnaire for the person who can. |
| `/wait-what` | Asks the agent to re-pitch its last message in plain language. |

## Pairs well with

Trail of Bits publishes security skills one plugin at a time. These fit a TypeScript, Postgres and GitHub Actions stack:

```sh
claude plugin marketplace add trailofbits/skills
claude plugin install insecure-defaults@trailofbits
claude plugin install supply-chain-risk-auditor@trailofbits
claude plugin install agentic-actions-auditor@trailofbits
claude plugin install sharp-edges@trailofbits
claude plugin install differential-review@trailofbits
claude plugin install variant-analysis@trailofbits
claude plugin install property-based-testing@trailofbits
claude plugin install dimensional-analysis@trailofbits
claude plugin install spec-to-code-compliance@trailofbits
claude plugin install audit-context-building@trailofbits
claude plugin install goal-prompt@trailofbits
```

## Install

**Claude Code on a computer**

```sh
claude plugin marketplace add AtlasScope/agent-kit
claude plugin install engineering-kit@agent-kit
```

Update with `claude plugin marketplace update agent-kit` and `claude plugin update engineering-kit@agent-kit`. Remove with `claude plugin uninstall engineering-kit@agent-kit`.

**Codex on a computer**

```sh
codex plugin marketplace add AtlasScope/agent-kit
codex plugin add engineering-kit@agent-kit
```

**Cloud Claude Code sessions**

Add this to the repo's `.claude/settings.json`, merged with anything already there:

```json
{
  "extraKnownMarketplaces": {
    "agent-kit": { "source": { "source": "github", "repo": "AtlasScope/agent-kit" } }
  },
  "enabledPlugins": { "engineering-kit@agent-kit": true }
}
```

## Rebuilding the /engineer catalog

The router's references are generated from the field guide's JSON catalog. When the guide changes, run `node scripts/build_references.cjs <guide.html> plugins/engineering-kit/skills/engineer/references` and land the result through a PR. The script leaves out per-project notes and private commands.

## Updating a vendored skill

Nothing here updates on its own. To take a newer upstream version, read the new files in full, copy them over, keep the changes listed in THIRD_PARTY.md, and update the commit hash there.
