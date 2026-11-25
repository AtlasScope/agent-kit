import type { Metadata } from "next";
import { DocPage } from "@/components/DocPage";
import { CopyButton } from "@/components/CopyButton";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Use Agent Kit from your agent (MCP server)",
  description: "Add Agent Kit’s read-only MCP server to Claude Code, Codex, Cursor or ChatGPT to search and fetch every prompt and skill from inside your agent.",
  alternates: { canonical: "/mcp-setup" },
};

const url = `${SITE.url}/mcp`;
const CLIENTS: [string, string, string][] = [
  ["Claude Code", "Run once in a terminal.", `claude mcp add --transport http agent-kit ${url}`],
  ["Codex", "Add to `~/.codex/config.toml`.", `[mcp_servers.agent-kit]\nurl = "${url}"`],
  ["Cursor", "Add to `.cursor/mcp.json` in a project, or `~/.cursor/mcp.json` for every project.", JSON.stringify({ mcpServers: { "agent-kit": { url } } }, null, 2)],
  ["ChatGPT", "In Settings, Apps and connectors, turn on developer mode, create a connector and paste this URL. No sign-in is needed.", url],
  ["Any other agent", "Any client that supports remote MCP servers over Streamable HTTP can use the URL. For a client that only runs local servers, use `mcp-remote`.", `npx -y mcp-remote ${url}`],
];
const TOOLS: [string, string][] = [
  ["find", "Search prompts and skills with a task in plain words."],
  ["get_prompt", "One prompt in full, with why it exists, what it returns and when to skip it."],
  ["get_skill", "A skill’s SKILL.md, its author credit, license and install commands."],
  ["list_area", "Every prompt in one area, or the list of areas."],
  ["fix", "The problems the library has starting points for, and the prompts for each."],
];

const slug = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const ticks = (how: string) => how.split("`").map((t, i) => (i % 2 ? <code key={i} translate="no">{t}</code> : t));

export default function McpSetup() {
  return (
    <DocPage
      path="/mcp-setup"
      crumb="MCP server"
      title="Use Agent Kit from your agent"
      lead="Add one URL and your agent can search the library and pull any prompt or skill into the conversation, without cloning the repo or installing a plugin."
      intro={<div className="mcp-url"><div className="cmdline glass"><code tabIndex={0} translate="no">{url}</code><CopyButton className="btn btn--sm btn--brand" text={url} /></div></div>}
      sections={[
        ...CLIENTS.map(([label, how, cfg]) => ({
          id: slug(label), title: label,
          body: <>
            <p>{ticks(how)}</p>
            <div className="block">
              <div className="block__head"><span>{label}</span><CopyButton text={cfg} /></div>
              <pre>{cfg}</pre>
            </div>
          </>,
        })),
        {
          id: "tools", title: "Tools",
          body: <dl className="facts">{TOOLS.flatMap(([name, d]) => [<dt key={name + "t"}><code translate="no">{name}</code></dt>, <dd key={name + "d"}>{d}</dd>])}</dl>,
        },
        {
          id: "limits", title: "Limits",
          body: <p>The server is read-only and returns text. It never runs code on your machine. Each visitor gets a per-minute rate limit, and the server has a daily cap shared by everyone; past either, calls get a short error until the limit resets (the daily cap resets at 00:00 UTC). Every prompt and skill is also on this website and on GitHub.</p>,
        },
      ]}
    />
  );
}
