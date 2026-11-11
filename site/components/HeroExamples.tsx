"use client";
import { useRef, useState } from "react";
import { EXAMPLES, short } from "@/lib/hero-demo";

// The homepage hero's example panel. Three requests a person might type; picking one shows the router that takes
// it, what it picks and why (the router's own line), and the line it quotes, with every line read on the way one
// click further. Nothing moves until the visitor picks: on load the first request shows, finished.
// Content and line numbers come from lib/hero-demo.ts, which tests/hero-demo.test.mjs checks against the kits.
// Router lines are Markdown: drop the code ticks, and turn quotes inside a quote into single ones.
const plain = (s: string) => s.replaceAll("`", "");
const inner = (s: string) => plain(s).replace(/"([^"]*)"/g, "‘$1’");
const base = (f: string) => f.split("/").pop();

export function HeroExamples() {
  const [i, setI] = useState(0);
  const [said, setSaid] = useState("");
  const moved = useRef(false);
  const ex = EXAMPLES[i];
  const pick = (n: number) => {
    if (n === i) return;
    moved.current = true; setI(n);
    setSaid(`${EXAMPLES[n].router} sends it to ${EXAMPLES[n].pick}.`);
  };

  return (
    <section className="hx" aria-labelledby="hx-h">
      <h2 id="hx-h" className="hx__h">Pick a request. See where it goes.</h2>
      <div className="hx__asks" role="group" aria-labelledby="hx-h">
        {EXAMPLES.map((e, n) => (
          <button key={e.id} type="button" className="hx__ask" aria-pressed={n === i} onClick={() => pick(n)}>
            <span className="hx__cmd" translate="no">{e.router}</span> {e.request}
          </button>
        ))}
      </div>

      <div key={ex.id} className={`hx__out${moved.current ? " is-new" : ""}`}>
        <p className="hx__route" translate="no">
          <span className="hx__cmd">{ex.router}</span><i className="hx__wire" aria-hidden="true" /><span className="hx__pick">{ex.pick}</span>
          <span className="hx__kind">{ex.kind}</span>
        </p>
        <p className="hx__why">Picked by the router’s own line: <q>{inner(ex.because.text)}</q></p>
        <blockquote className={`hx__answer${ex.answer.text.length > 48 ? " is-long" : ""}`} cite={`${short(ex.answer.file)}#L${ex.answer.line}`}>
          <p>{ex.answer.text}</p>
          {ex.answer.example && <p className="hx__ex"><b>{ex.answer.example.big}</b><span>{ex.answer.example.small}</span></p>}
        </blockquote>
        <p className="hx__src"><span translate="no">{base(ex.answer.file)}, line {ex.answer.line}.</span> {ex.note}</p>
        <details className="hx__trail">
          <summary>See every line it read</summary>
          <ol translate="no">
            {ex.trail.map((l) => (
              <li key={l.file + l.line}><span title={short(l.file)}>{base(l.file)}<b>{l.line}</b></span><code>{plain(l.text)}</code></li>
            ))}
          </ol>
        </details>
      </div>
      <p className="hx__said" aria-live="polite">{said}</p>
    </section>
  );
}
