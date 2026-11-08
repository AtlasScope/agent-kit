# Agent Kit site

The landing page for Agent Kit. For now it is one static file, `index.html`, with the hero only: the install command in six agent tabs (Any agent, Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot; the last pick is remembered in the browser), and a `/design` run that types itself out (it stays still under reduced motion and without script).

Open `index.html` in a browser to preview it. It needs no build step; fonts load from Google Fonts.

The figures in the hero (60 skills, 238 prompts) come from the repo. Update them when a kit or the prompt library changes.

The `npx skills` commands (Any agent, Cursor, Gemini CLI, GitHub Copilot) have not been test-run against this repo yet. Run each once before launch; the Claude Code and Codex commands are the ones in the root README.
