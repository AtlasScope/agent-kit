#!/usr/bin/env python3
"""Build the Viewport Proof sheet: one self-contained HTML page from proof.json.

Usage:
  python3 build_proof_sheet.py <run-dir>/proof.json

Writes <run-dir>/index.html. Frames are referenced by relative path (normally shots/<name>.png) and must
exist next to proof.json. After writing the page, the script prints the
`files` map for publishing it as a Claude artifact (published path -> source).

The script refuses a verdict the evidence does not support: "production ready"
with a blocker or material issue, any verdict with no frames, or a frame path
that is missing or escapes the run directory. Schema: references/proof-sheet.md.
Standard library only.
"""
import html
import json
import sys
from pathlib import Path

VERDICTS = {
    "production ready": ("Production ready", "ok"),
    "minor fixes required": ("Minor fixes required", "warn"),
    "not production ready": ("Not production ready", "bad"),
}
SEVERITIES = ["blocker", "material", "minor"]


class ProofError(ValueError):
    pass


def esc(value):
    return html.escape(str(value if value is not None else ""), quote=True)


def width_of(viewport):
    try:
        return int(str(viewport).lower().split("x")[0])
    except ValueError:
        return 0


def check_path(run_dir, rel, label):
    if not rel:
        return None
    p = Path(rel)
    if p.is_absolute() or ".." in p.parts:
        raise ProofError(f"{label}: frame path must be relative inside the run folder, got {rel!r}")
    if not (run_dir / p).is_file():
        raise ProofError(f"{label}: frame file not found: {run_dir / p}")
    return p.as_posix()


def validate(proof, run_dir):
    verdict = str(proof.get("verdict", "")).strip().lower()
    if verdict not in VERDICTS:
        raise ProofError(f"verdict must be one of {sorted(VERDICTS)}, got {proof.get('verdict')!r}")
    frames = proof.get("frames") or []
    if not frames:
        raise ProofError("no frames: a verdict needs captured evidence")
    issues = proof.get("issues") or []
    for i, issue in enumerate(issues, 1):
        sev = str(issue.get("severity", "")).lower()
        if sev not in SEVERITIES:
            raise ProofError(f"issue {i}: severity must be one of {SEVERITIES}, got {issue.get('severity')!r}")
        if not issue.get("title"):
            raise ProofError(f"issue {i}: title is required")
        issue["frame"] = check_path(run_dir, issue.get("frame"), f"issue {i}")
    serious = [x for x in issues if x["severity"].lower() in ("blocker", "material")]
    if verdict == "production ready" and serious:
        raise ProofError("verdict 'production ready' contradicts open blocker/material issues")
    if verdict == "minor fixes required" and any(x["severity"].lower() == "blocker" for x in issues):
        raise ProofError("verdict 'minor fixes required' contradicts an open blocker")
    if verdict == "minor fixes required" and not issues:
        raise ProofError("verdict 'minor fixes required' needs the named minor issues")
    for i, frame in enumerate(frames, 1):
        if not frame.get("viewport"):
            raise ProofError(f"frame {i}: viewport is required (e.g. '390x844')")
        frame["path"] = check_path(run_dir, frame.get("path"), f"frame {i}")
    return verdict


def where_text(where):
    if not isinstance(where, dict):
        return esc(where)
    parts = [where.get("route"), where.get("state"), where.get("viewport")]
    return " · ".join(esc(p) for p in parts if p)


def render(proof, verdict):
    label, tone = VERDICTS[verdict]
    target = proof.get("target") or {}
    issues = sorted(proof.get("issues") or [], key=lambda x: SEVERITIES.index(x["severity"].lower()))
    frames = proof.get("frames") or []
    unsaved = sum(1 for f in frames if not f.get("path"))
    title = proof.get("title") or "Viewport Proof"

    out = []
    w = out.append
    w("<!doctype html><html lang='en'><head><meta charset='utf-8'>")
    w("<meta name='viewport' content='width=device-width, initial-scale=1'>")
    w(f"<title>{esc(title)}</title><style>{CSS}</style></head><body><main>")
    w(f"<header><p class='eyebrow'>Viewport production-readiness proof</p><h1>{esc(title)}</h1>")
    w(f"<p class='verdict {tone}'>{esc(label)}</p>")
    if proof.get("summary"):
        w(f"<p class='lede'>{esc(proof['summary'])}</p>")
    facts = [("Target", target.get("url")), ("Branch", target.get("branch")), ("Commit", target.get("commit")),
             ("Served from", target.get("served_from")), ("Serving proof", target.get("verified_by")),
             ("Coverage", proof.get("coverage")), ("Captured", proof.get("captured_at"))]
    w("<dl class='facts'>" + "".join(f"<div><dt>{esc(k)}</dt><dd>{esc(v)}</dd></div>" for k, v in facts if v) + "</dl>")
    if unsaved:
        w(f"<p class='note'>{unsaved} of {len(frames)} frames were inspected in the session but have no saved image.</p>")
    w("</header>")

    w(f"<section><h2>Issues <span class='count'>{len(issues)}</span></h2>")
    if not issues:
        w("<p class='muted'>No open issues.</p>")
    for i, issue in enumerate(issues, 1):
        sev = issue["severity"].lower()
        w(f"<article class='issue'><div class='issue-body'><p class='sev {sev}'>{esc(sev)}</p>")
        w(f"<h3>{i}. {esc(issue['title'])}</h3>")
        if issue.get("where"):
            w(f"<p class='where'>{where_text(issue['where'])}</p>")
        if issue.get("element"):
            w(f"<p class='el'><code>{esc(issue['element'])}</code></p>")
        if issue.get("detail"):
            w(f"<p>{esc(issue['detail'])}</p>")
        if issue.get("fix"):
            w(f"<p class='fix'><strong>Fix:</strong> {esc(issue['fix'])}</p>")
        w("</div>")
        if issue.get("frame"):
            w(f"<a class='thumb' href='{esc(issue['frame'])}'><img loading='lazy' src='{esc(issue['frame'])}' alt='Frame for issue {i}'></a>")
        w("</article>")
    w("</section>")

    if proof.get("strengths"):
        w("<section><h2>Already strong</h2><ul>" + "".join(f"<li>{esc(s)}</li>" for s in proof["strengths"]) + "</ul></section>")

    checks = proof.get("checks") or {}
    if checks:
        w("<section><h2>Checks</h2><dl class='checks'>")
        for k, v in checks.items():
            text = str(v)
            tone_cls = "ok" if text.lower().startswith("pass") else ("bad" if text.lower().startswith("fail") else "")
            w(f"<div><dt>{esc(k.replace('_', ' ').capitalize())}</dt><dd class='{tone_cls}'>{esc(text)}</dd></div>")
        w("</dl></section>")

    groups = {}
    for f in frames:
        groups.setdefault((f.get("route") or "", f.get("state") or ""), []).append(f)
    w("<section><h2>Frames</h2>")
    for (route, state), items in groups.items():
        heading = " · ".join(x for x in (route, state) if x) or "Frames"
        w(f"<h3 class='group'>{esc(heading)}</h3><div class='grid'>")
        for f in sorted(items, key=lambda x: width_of(x.get("viewport"))):
            geo = f.get("geometry") or {}
            geo_txt = ", ".join(f"{geo[k]} {k}" for k in ("fail", "warn") if geo.get(k))
            w("<figure>")
            if f.get("path"):
                w(f"<a href='{esc(f['path'])}'><img loading='lazy' src='{esc(f['path'])}' alt='{esc(heading)} at {esc(f['viewport'])}'></a>")
            else:
                w("<div class='noimg'>Inspected in session, no saved image</div>")
            cap = f"<strong>{esc(f['viewport'])}</strong>"
            if f.get("input"):
                cap += f" · {esc(f['input'])}"
            if f.get("theme"):
                cap += f" · {esc(f['theme'])}"
            if geo_txt:
                cap += f" · <span class='geo'>geometry: {esc(geo_txt)}</span>"
            if f.get("note"):
                cap += f"<br>{esc(f['note'])}"
            w(f"<figcaption>{cap}</figcaption></figure>")
        w("</div>")
    w("</section>")

    if proof.get("not_checked"):
        w("<section><h2>Not checked</h2><ul>" + "".join(f"<li>{esc(s)}</li>" for s in proof["not_checked"]) + "</ul></section>")
    if proof.get("evidence_note"):
        w(f"<footer><p class='muted'>{esc(proof['evidence_note'])}</p></footer>")
    w("</main></body></html>")
    return "\n".join(out)


CSS = """
:root{--bg:#f7f7f5;--surface:#fff;--text:#1d1d1b;--muted:#6b6b66;--line:#e2e2dc;
--ok:#1f7a45;--ok-bg:#e5f3ea;--warn:#8a5a00;--warn-bg:#fbf0d9;--bad:#a12a2a;--bad-bg:#f8e3e1;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#161615;--surface:#1f1f1d;--text:#ecece8;
--muted:#a3a39c;--line:#33332f;--ok:#6fcf97;--ok-bg:#183323;--warn:#f0c060;--warn-bg:#3a2e14;--bad:#f08a80;--bad-bg:#3d1c1a;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#161615;--surface:#1f1f1d;--text:#ecece8;--muted:#a3a39c;--line:#33332f;
--ok:#6fcf97;--ok-bg:#183323;--warn:#f0c060;--warn-bg:#3a2e14;--bad:#f08a80;--bad-bg:#3d1c1a;color-scheme:dark}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:1100px;margin:0 auto;padding:24px 16px 48px}
h1{font-size:1.6rem;margin:.1rem 0 .6rem;line-height:1.2}h2{font-size:1.1rem;margin:2rem 0 .8rem}
h3{font-size:1rem;margin:.2rem 0 .3rem}.eyebrow{margin:0;color:var(--muted);font-size:.8rem;text-transform:uppercase;letter-spacing:.06em}
.verdict{display:inline-block;margin:0 0 .8rem;padding:.35rem .8rem;border-radius:6px;font-weight:650;font-size:1.05rem}
.verdict.ok{color:var(--ok);background:var(--ok-bg)}.verdict.warn{color:var(--warn);background:var(--warn-bg)}.verdict.bad{color:var(--bad);background:var(--bad-bg)}
.lede{font-size:1.05rem;max-width:70ch;margin:0 0 1rem}.muted,.where{color:var(--muted)}.where{margin:0 0 .3rem;font-size:.9rem}
.facts,.checks{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;margin:0}
.facts div,.checks div{background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:8px 10px;min-width:0}
dt{color:var(--muted);font-size:.78rem}dd{margin:0;overflow-wrap:anywhere}dd.ok{color:var(--ok)}dd.bad{color:var(--bad)}
.note{margin:.8rem 0 0;padding:8px 10px;border-radius:6px;background:var(--warn-bg);color:var(--warn)}
.count{color:var(--muted);font-weight:400}
.issue{display:grid;grid-template-columns:1fr minmax(0,260px);gap:16px;background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:14px;margin-bottom:10px}
.issue-body{min-width:0}.issue p{margin:.25rem 0}.el code{font-size:.85rem;overflow-wrap:anywhere}
.sev{display:inline-block;font-size:.72rem;font-weight:650;text-transform:uppercase;letter-spacing:.05em;padding:.1rem .45rem;border-radius:4px}
.sev.blocker{color:var(--bad);background:var(--bad-bg)}.sev.material{color:var(--warn);background:var(--warn-bg)}.sev.minor{color:var(--muted);background:var(--bg)}
.thumb img,figure img{display:block;width:100%;height:auto;border:1px solid var(--line);border-radius:6px;background:var(--bg)}
.thumb img{max-height:220px;object-fit:cover;object-position:top}
.group{margin-top:1.2rem;color:var(--muted);font-weight:600}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;align-items:start}
figure{margin:0;min-width:0}figure img{max-height:520px;object-fit:cover;object-position:top}
figcaption{font-size:.82rem;margin-top:4px;overflow-wrap:anywhere}.geo{color:var(--warn)}
.noimg{display:grid;place-items:center;min-height:120px;border:1px dashed var(--line);border-radius:6px;color:var(--muted);font-size:.85rem;text-align:center;padding:8px}
ul{padding-left:1.2rem}li{margin:.2rem 0}footer{margin-top:2rem}
@media (max-width:640px){.issue{grid-template-columns:1fr}}
"""


def publish_files(proof):
    paths = {f["path"] for f in proof.get("frames") or [] if f.get("path")}
    paths |= {i["frame"] for i in proof.get("issues") or [] if i.get("frame")}
    return sorted(paths)


def main(argv):
    if len(argv) < 2:
        print(__doc__.strip(), file=sys.stderr)
        return 2
    src = Path(argv[1]).resolve()
    out = src.with_name("index.html")
    run_dir = src.parent
    try:
        proof = json.loads(src.read_text(encoding="utf-8"))
        verdict = validate(proof, run_dir)
    except (OSError, json.JSONDecodeError, ProofError) as err:
        print(f"proof sheet not built: {err}", file=sys.stderr)
        return 1
    out.write_text(render(proof, verdict), encoding="utf-8")
    files = {p: str(run_dir / p) for p in publish_files(proof)}
    print(f"wrote {out}")
    print("artifact files map:")
    print(json.dumps(files, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
