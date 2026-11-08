import type { Metadata } from "next";
import { Crumbs } from "@/components/Crumbs";
import { CopyButton } from "@/components/CopyButton";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Use Agent Kit from your agent (MCP server)",
  description: "Add Agent Kit's read-only MCP server to Claude Code, Codex, Cursor or ChatGPT to search and fetch every prompt and skill from inside your agent.",
  alternates: { canonical: "/mcp-setup" },
};

const url = `${SITE.url}/mcp`;
const CLIENTS: [string, string, string][] = [
  ["Claude Code", "Run once in a terminal.", `claude mcp add --transport http agent-kit ${url}`],
  ["Codex", "Add to ~/.codex/config.toml.", `[mcp_servers.agent-kit]\nurl = "${url}"`],
  ["Cursor", "Add to .cursor/mcp.json in a project, or ~/.cursor/mcp.json for every project.", JSON.stringify({ mcpServers: { "agent-kit": { url } } }, null, 2)],
  ["ChatGPT", "In Settings, Apps and connectors, turn on developer mode, create a connector and paste this URL. No sign-in is needed.", url],
  ["Any other agent", "Any client that supports remote MCP servers over Streamable HTTP can use the URL. For a client that only runs local servers, use mcp-remote.", `npx -y mcp-remote ${url}`],
];
const TOOLS: [string, string][] = [
  ["find", "Search prompts and skills with a task in plain words."],
  ["get_prompt", "One prompt in full, with why it exists, what it returns and when to skip it."],
  ["get_skill", "A skill's SKILL.md, its author credit, license and install commands."],
  ["list_area", "Every prompt in one area, or the list of areas."],
  ["fix", "The problems the library has starting points for, and the prompts for each."],
];

export default function McpSetup() {
  return (
    <main className="page">
      <div className="page-head">
        <Crumbs items={[["MCP server", "/mcp-setup"]]} />
        <h1>Use Agent Kit from your agent</h1>
        <p className="lead">Add one URL and your agent can search the library and pull any prompt or skill into the conversation, without cloning the repo or installing a plugin.</p>
      </div>

      <div className="cmdline"><code>{url}</code><CopyButton text={url} /></div>

      {CLIENTS.map(([label, how, cfg]) => (
        <section className="section" key={label}>
          <h2>{label}</h2>
          <p className="note">{how}</p>
          <div className="block">
            <div className="block__head"><span>{label}</span><CopyButton text={cfg} /></div>
            <pre>{cfg}</pre>
          </div>
        </section>
      ))}

      <section className="section">
        <h2>Tools</h2>
        <dl className="facts">
          {TOOLS.flatMap(([name, d]) => [<dt key={name + "t"}><code>{name}</code></dt>, <dd key={name + "d"}>{d}</dd>])}
        </dl>
      </section>

      <section className="section">
        <h2>Limits</h2>
        <p className="note">The server is read-only and returns text. It never runs code on your machine. Each visitor gets a per-minute rate limit, and the server has a daily cap shared by everyone; past either, calls get a short error until the limit resets (the daily cap resets at 00:00 UTC). Every prompt and skill is also on this website and on GitHub.</p>
      </section>
    </main>
  );
}
