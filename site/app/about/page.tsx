import type { Metadata } from "next";
import Link from "next/link";
import { DocPage } from "@/components/DocPage";
import { counts, kits } from "@/lib/content";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Agent Kit",
  description: "Who makes Agent Kit, what it is, how to contribute, and the words the site uses.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <DocPage
      path="/about"
      title="About Agent Kit"
      lead={<>Agent Kit is a free, open library of skills and prompts for AI coding agents. It is made by AtlasScope, and it is AtlasScope&apos;s first product.</>}
      sections={[
        {
          id: "what", title: "What it is",
          body: <>
            <p>{counts.skills} skills and {counts.prompts} prompts, written so that a plain request to a coding agent gets a better result than the request alone would. Each skill and prompt is written for a specific job and says what it returns.</p>
            <p>You can use it three ways: install the {kits.length} <Link href="/kits">kits</Link> as plugins, read and copy anything on this site without an account, or <Link href="/mcp-setup">connect your agent</Link> to the read-only MCP server so it can search the library itself.</p>
          </>,
        },
        {
          id: "who", title: "Who makes it",
          body: <>
            <p>AtlasScope makes tools for working with AI coding agents. It writes Agent Kit&apos;s own skills, the routers that pick a skill from a plain request, the prompt library and this site.</p>
            <p>{counts.borrowed} of the {counts.skills} skills come from other authors. They are copied at a pinned commit, read in full before they are added, and keep their authors&apos; licenses. Each skill page names its author, and <a href={`${SITE.repo}/blob/main/CREDITS.md`}>the credits</a> list every one.</p>
          </>,
        },
        {
          id: "contribute", title: "How to contribute",
          body: <>
            <p>Everything is in one public repository on <a href={SITE.repo}>GitHub</a>. A new prompt or skill has to do a job nothing in the library already does; a clearer version of an existing entry is more welcome than a near-duplicate.</p>
            <p><a href={`${SITE.repo}/blob/main/CONTRIBUTING.md`}>The contributing guide</a> has the checks and the rules. To report a security problem privately, use <a href={`${SITE.repo}/security`}>the repository&apos;s Security tab</a>.</p>
          </>,
        },
        {
          id: "words", title: "The words we use",
          body: (
            <dl className="doc__terms">
              <dt>Prompt</dt><dd>A single piece of text you paste into an agent, with notes on why it exists, what it returns and when to skip it.</dd>
              <dt>Skill</dt><dd>A folder with a SKILL.md that an agent loads to do one kind of job.</dd>
              <dt>Kit</dt><dd>One installable plugin that groups related skills, such as design-kit or engineering-kit.</dd>
              <dt>Collection</dt><dd>A named list of prompts and skills saved by one person, private unless they share it.</dd>
            </dl>
          ),
        },
      ]}
    />
  );
}
