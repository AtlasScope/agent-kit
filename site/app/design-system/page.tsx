import type { Metadata } from "next";
import { CopyButton } from "@/components/CopyButton";
import "./ds.css";
import { CodeWithFloat } from "./Float";

// The design-system contract as a page: every token and primitive page lanes may use, rendered with the real CSS.
// Not for visitors: noindex, and app/sitemap.ts lists routes explicitly, so it stays out of the sitemap.
export const metadata: Metadata = {
  title: "Design system",
  description: "Tokens and primitives for the AtlasScope site.",
  robots: { index: false, follow: false },
};

const surfaces = ["canvas", "surface", "raised", "sunken", "overlay"];
const text = ["fg", "fg-2", "fg-3", "fg-4"];
const lines = ["line", "line-2", "edge"];
const roles = ["primary", "primary-hover", "fill", "fill-2", "signal", "focus", "warm", "warm-soft", "danger"];
const hues = ["inv", "db", "think", "ecmd", "dcmd", "recipe"];
const types = ["display", "h1", "h2", "h3", "lead", "body", "sm", "xs", "micro"];
const space = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24];
const radii = ["xs", "sm", "md", "lg", "xl", "pill"];
const shadows = ["1", "2", "3"];

function Swatches({ names, prefix = "--c-" }: { names: string[]; prefix?: string }) {
  return (
    <ul className="ds-swatches">
      {names.map((n) => (
        <li key={n}><span className="ds-chip" style={{ background: `var(${prefix}${n})` }} /><code>{prefix}{n}</code></li>
      ))}
    </ul>
  );
}

export default function DesignSystem() {
  return (
    <main className="page ds">
      <header className="page-head">
        <h1>Design system</h1>
        <p className="lead">The tokens and primitives every interior page uses, drawn with the site’s own CSS. The written contract is DESIGN-CONTRACT.md at the repository root.</p>
      </header>

      <section className="section" aria-labelledby="ds-code">
        <h2 id="ds-code">Code</h2>
        <CodeWithFloat>
          <p className="ds-note">Scroll this block’s Copy behind the header to see FloatingCopy. It hides again once this example has scrolled past.</p>
        </CodeWithFloat>
      </section>

      <section className="section" aria-labelledby="ds-colour">
        <h2 id="ds-colour">Colour</h2>
        <h3>Surfaces</h3><Swatches names={surfaces} />
        <h3>Text</h3><Swatches names={text} />
        <h3>Lines</h3><Swatches names={lines} />
        <h3>Roles</h3><Swatches names={roles} />
        <h3>Section hues</h3><Swatches names={hues} prefix="--s-" />
      </section>

      <section className="section" aria-labelledby="ds-type">
        <h2 id="ds-type">Type</h2>
        <ul className="ds-type">
          {types.map((t) => (
            <li key={t} style={{ fontSize: `var(--type-${t})`, lineHeight: `var(--lh-${t})`, fontFamily: t === "display" || t === "h1" ? "var(--font-display)" : undefined }}>
              <code>--type-{t}</code> Paste one message into your agent
            </li>
          ))}
          <li style={{ fontFamily: "var(--font-mono)", fontSize: "var(--type-code)" }}><code>--font-mono</code> claude plugin install design-kit@agent-kit</li>
        </ul>
      </section>

      <section className="section" aria-labelledby="ds-space">
        <h2 id="ds-space">Space, shape and depth</h2>
        <ul className="ds-space">
          {space.map((n) => <li key={n}><span style={{ width: `var(--space-${n})` }} /><code>--space-{n}</code></li>)}
        </ul>
        <ul className="ds-boxes">
          {radii.map((r) => <li key={r} style={{ borderRadius: `var(--radius-${r})` }}><code>--radius-{r}</code></li>)}
          {shadows.map((s) => <li key={s} style={{ boxShadow: `var(--shadow-${s})` }}><code>--shadow-{s}</code></li>)}
        </ul>
      </section>

      <section className="section" aria-labelledby="ds-controls">
        <h2 id="ds-controls">Controls</h2>
        <div className="ds-row">
          <button className="btn btn--brand" type="button">Brand (one per page)</button>
          <button className="btn btn--primary" type="button">Primary</button>
          <button className="btn" type="button">Default</button>
          <button className="btn btn--ghost" type="button">Ghost</button>
          <button className="btn btn--danger" type="button">Delete</button>
          <button className="btn" type="button" aria-pressed="true">Pressed</button>
          <button className="btn" type="button" disabled>Disabled</button>
        </div>
        <div className="ds-row">
          <button className="btn btn--sm btn--primary" type="button">Small</button>
          <button className="btn btn--sm" type="button">Small</button>
          <button className="btn btn--lg btn--primary" type="button">Large</button>
          <CopyButton text="Copied from the design-system page" />
        </div>
        <div className="ds-row">
          <label className="field"><span>Collection name</span><input placeholder="Reviews" /></label>
          <input className="input" aria-label="Plain input" placeholder="Plain input" />
        </div>
        <div className="ds-row">
          <div className="chips">
            <button className="chip" type="button">Debugging <span className="chip__n">24</span></button>
            <button className="chip" type="button" aria-pressed="true">Design <span className="chip__n">12</span></button>
          </div>
          <span className="tag">Tag</span><span className="tag tag--signal">Tested</span><span className="tag tag--warn">Saved</span>
          <span><kbd className="kbd">Ctrl</kbd> <kbd className="kbd">V</kbd></span>
          <span><span className="led is-on" /> LED</span>
          {hues.map((h) => <span key={h} className="dot" style={{ ["--tone" as string]: `var(--s-${h})` }} />)}
        </div>
      </section>

    </main>
  );
}
