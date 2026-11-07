# Design Kit

A design library for AI coding agents. Type `/design` and what you want; the router picks the one right skill or recipe from the library, says why in a line, and starts it. Recipes run one step at a time and resume with `/design next`.

It bundles 37 skills: the router, Emil Kowalski's motion and polish skills, Hallmark, wondelai's UX design set (typography, Refactoring UI, heuristics, microinteractions, iOS HIG and more), two color skills, UX writing, landing-page copy and conversion, SwiftUI Pro, Stop Slop and fix-writing. Credits, versions and licenses are in [THIRD_PARTY.md](THIRD_PARTY.md).

The router also routes to skills that ship as their own plugins. Install the ones you want alongside this kit:

| Plugin | Claude Code | Codex |
|---|---|---|
| Impeccable | `claude plugin marketplace add pbakaus/impeccable` then `claude plugin install impeccable@impeccable` | `codex plugin marketplace add pbakaus/impeccable` then `codex plugin add impeccable@impeccable` |
| Interface Design | `claude plugin marketplace add Dammyjay93/interface-design` then `claude plugin install interface-design@interface-design` | copy its skills |
| Humanizer | `claude plugin marketplace add blader/humanizer` then `claude plugin install humanizer@humanizer` | copy its skill |
| Sepia | `claude plugin marketplace add Nanako0129/sepia` then `claude plugin install sepia@sepia` | copy its skills |

## Install

**Claude Code on a computer (Mac, Windows, Linux)**

```sh
claude plugin marketplace add AtlasScope/agent-kit
claude plugin install design-kit@agent-kit
```

Update later with `claude plugin marketplace update agent-kit` and `claude plugin update design-kit@agent-kit`.

**Codex on a computer**

```sh
codex plugin marketplace add AtlasScope/agent-kit
codex plugin add design-kit@agent-kit
```

Update with `codex plugin marketplace upgrade design-kit`.

**Cloud Claude Code sessions (claude.ai/code)**

Cloud sessions only get what the repo declares. Add this to the repo's `.claude/settings.json`, merged with anything already there:

```json
{
  "extraKnownMarketplaces": {
    "agent-kit": { "source": { "source": "github", "repo": "AtlasScope/agent-kit" } },
    "impeccable": { "source": { "source": "github", "repo": "pbakaus/impeccable" } }
  },
  "enabledPlugins": {
    "design-kit@agent-kit": true,
    "impeccable@impeccable": true
  }
}
```

**claude.ai chats and Projects**

Build one zip that holds the whole library as a single skill, then upload it once per account at Settings > Capabilities > Skills (code execution must be on):

```sh
scripts/build-claude-ai-zips.sh
```

The zip is `dist/claude-ai/design-kit.zip`. Its own instructions (`claude-ai/SKILL.md`) pick the right specialist and read it from inside the bundle. To upload single skills instead, name them: `scripts/build-claude-ai-zips.sh oklch-skill ux-writing`.

Skills uploaded there run in claude.ai's sandbox: they advise and write, but cannot reach your repos.

**Another Claude account**

Plugins install per computer, not per account, so a second account on a computer that already has the kit sees it in Claude Code. For that account's claude.ai chats, upload the zips as above while signed in to it. Cloud sessions follow the repo, whichever account opens them.

**Hermes Agent**

```sh
hermes skills install AtlasScope/agent-kit/kits/design-kit/plugins/design-kit/skills/<name> --category design
```

## Updating the library

The router's references are generated from the Design Skills Field Guide:

```sh
node scripts/build_references.cjs <guide.html> plugins/design-kit/skills/design/references --public
```

Third-party skills change only by re-reading the new upstream version and committing it with its new commit in THIRD_PARTY.md.
