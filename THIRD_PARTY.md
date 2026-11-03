# Third-party skills

Every skill below was reviewed before it was added: its instructions read for hidden or risky directions, and any scripts checked for network calls and hooks. Each is copied unchanged from the version named, except where noted. Each skill folder keeps its upstream LICENSE. Nothing here updates on its own: an update means re-reading the new upstream version and committing it.

| Skill | Source | Commit or folder hash | License |
|---|---|---|---|
| `animate-expo` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | `6874701c790c` | MIT |
| `animate` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | `a92e36f28d74` | MIT |
| `animation-performance` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | `59c4651915a4` | MIT |
| `animation-vocabulary` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | `d49565744427` | MIT |
| `apple-design` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | `cd509ae729c8` | MIT |
| `ask-sonner` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | `aeca3dba0eb0` | MIT |
| `break-ui` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | `f2a3441d4cf1` | MIT |
| `color-expert` | [meodai/skill.color-expert](https://github.com/meodai/skill.color-expert) | `5bf7c7704d56` | CC-BY-4.0 |
| `copywriting` | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | `88c79f6528a9` | MIT |
| `cro` | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | `88c79f6528a9` | MIT |
| `design-everyday-things` | [wondelai/skills](https://github.com/wondelai/skills) | `d8d5d75f83da` | MIT |
| `emil-design-eng` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | `db7a20dc1d8a` | MIT |
| `find-animation-opportunities` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | `e6443880f38e` | MIT |
| `hallmark` | [Nutlope/hallmark](https://github.com/Nutlope/hallmark) | `9bef0978c144` | MIT |
| `hooked-ux` | [wondelai/skills](https://github.com/wondelai/skills) | `d8d5d75f83da` | MIT |
| `improve-animations` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | `cf1f7aabac34` | MIT |
| `improve-retention` | [wondelai/skills](https://github.com/wondelai/skills) | `d8d5d75f83da` | MIT |
| `ios-hig-design` | [wondelai/skills](https://github.com/wondelai/skills) | `d8d5d75f83da` | MIT |
| `lean-ux` | [wondelai/skills](https://github.com/wondelai/skills) | `d8d5d75f83da` | MIT |
| `microinteractions` | [wondelai/skills](https://github.com/wondelai/skills) | `d8d5d75f83da` | MIT |
| `mobile-native` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | `fdad6e6e91d8` | MIT |
| `oklch-skill` | [jakubkrehel/oklch-skill](https://github.com/jakubkrehel/oklch-skill) | `0e81f040e16d` | MIT |
| `pick-ui-library` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | `370e19776f0a` | MIT |
| `product-marketing` | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | `88c79f6528a9` | MIT |
| `prototype` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | `34cd3a303aef` | MIT |
| `refactoring-ui` | [wondelai/skills](https://github.com/wondelai/skills) | `d8d5d75f83da` | MIT |
| `review-animations` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | `0e0d3cb3e07c` | MIT |
| `steve-jobs-design-review` | [wondelai/skills](https://github.com/wondelai/skills) | `d8d5d75f83da` | MIT |
| `stop-slop` | [hardikpandya/stop-slop](https://github.com/hardikpandya/stop-slop) | `8da1f030185b` (checked 2026-11-03) | MIT |
| `swiftui-pro` | [twostraws/SwiftUI-Agent-Skill](https://github.com/twostraws/SwiftUI-Agent-Skill) | `f2920b639952` | MIT |
| `top-design` | [wondelai/skills](https://github.com/wondelai/skills) | `d8d5d75f83da` | MIT |
| `ux-heuristics` | [wondelai/skills](https://github.com/wondelai/skills) | `d8d5d75f83da` | MIT |
| `ux-writing` | [content-designer/ux-writing-skill](https://github.com/content-designer/ux-writing-skill) | `98cacde4ba2d` | MIT |
| `web-typography` | [wondelai/skills](https://github.com/wondelai/skills) | `d8d5d75f83da` | MIT |
| `write-swift` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | `bdefda3891d3` | MIT |

Changes from upstream: `steve-jobs-design-review`, `ux-heuristics` and `swiftui-pro` add `disable-model-invocation: true` so these reviews run only when asked. Repository READMEs, evals, demo videos and build files were left out; each skill folder is otherwise as published.

`design` (the router) and `fix-writing` are original to this repo and MIT licensed.

Scripts that ship with a skill: Hallmark includes Node scripts for linting and screenshots. Its image script calls Together's API only when `TOGETHER_API_KEY` is set and the user asked for generated images, and its edit-time hook is installed only if someone runs `install-hook.mjs` by hand. No other skill here runs code.
