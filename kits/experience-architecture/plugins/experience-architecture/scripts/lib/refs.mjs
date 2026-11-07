// Check the source references in a report before anyone acts on it. Finds `path/file.ext:12`, `:12-20`,
// `#L12`, "file.ext line 12" and bare file paths; confirms each file exists under the app root, each line
// exists, and that identifiers quoted on the same report line appear near the cited lines.
import fs from 'node:fs';
import path from 'node:path';

const EXT = 'tsx|ts|jsx|json|js|mjs|cjs|scss|css|mdx|md|py|rb|go|rs|vue|svelte|astro|html|yaml|yml|toml|sql|prisma|graphql';
const FILE = `((?:[\\w@.\\-\\[\\]()+]+\\/)*[\\w@.\\-\\[\\]()+]+\\.(?:${EXT}))(?![\\w])`;
const REF = new RegExp(`${FILE}(?:(?::|#L)(\\d+)(?:\\s*[-–]\\s*L?(\\d+))?|,?\\s+\\(?lines?\\s+(\\d+)(?:\\s*[-–]\\s*(\\d+))?\\)?)?`, 'g');
const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.turbo', '.vercel', 'coverage']);
const NEAR = 12;

function listFiles(root) {
  const out = [];
  const walk = (d, depth) => {
    if (depth > 12) return;
    let ents = [];
    try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(path.join(d, e.name), depth + 1); }
      else out.push(path.relative(root, path.join(d, e.name)).split(path.sep).join('/'));
    }
  };
  walk(root, 0);
  return out;
}

// Identifiers quoted in backticks on the same report line, minus the reference itself and common words.
function quotedIdentifiers(line) {
  const ids = [];
  for (const m of line.matchAll(/`([^`]+)`/g)) {
    const t = m[1].trim();
    if (new RegExp(`\\.(${EXT})(:|#L|$)`).test(t)) continue;
    // code-like only: camelCase, PascalCase, CONSTANTS, snake_case. Plain words ("patients") match too much.
    for (const w of t.split(/[^\w$]+/)) if (w.length >= 4 && /^[A-Za-z_$][\w$]*$/.test(w) && /[a-z][A-Z]|^[A-Z][a-z]+[A-Z]|^[A-Z0-9_]{4,}$|_/.test(w) && !/^(true|false|null|undefined)$/.test(w)) ids.push(w);
  }
  return [...new Set(ids)];
}

export function checkRefs(text, root) {
  const files = listFiles(root);
  const lengths = new Map();
  const lines = (f) => { if (!lengths.has(f)) lengths.set(f, fs.readFileSync(path.isAbsolute(f) ? f : path.join(root, f), 'utf8').split('\n')); return lengths.get(f); };
  const resolve = (p) => {
    const clean = p.replace(/^\.?\//, '');
    if (files.includes(clean)) return [clean];
    return files.filter((f) => f === clean || f.endsWith('/' + clean));
  };
  const results = [];
  const seen = new Set();
  text.split('\n').forEach((reportLine, idx) => {
    for (const m of reportLine.matchAll(REF)) {
      const [raw] = m; let file = m[1];
      const absolute = reportLine[m.index - 1] === '/' && !/[\w.]/.test(reportLine[m.index - 2] || ' ');
      if (absolute) file = '/' + file;
      if (/^https?:/.test(reportLine.slice(Math.max(0, m.index - 8), m.index + 1)) || /^(e\.g|i\.e)\./.test(file)) continue;
      if (!file.includes('/') && !m[2] && !m[4]) continue; // a bare file name with no line ("package.json") is a mention, not a reference
      const start = Number(m[2] || m[4]) || null;
      const end = Number(m[3] || m[5]) || start;
      const key = `${file}:${start}-${end}`;
      if (seen.has(key)) continue; seen.add(key);
      const r = { ref: raw.trim(), reportLine: idx + 1, file, start, end };
      const hits = absolute ? (fs.existsSync(file) ? [file] : []) : resolve(file);
      // A path with no line that does not exist is usually a file the report proposes or an output file:
      // listed for a second look, never counted as wrong.
      if (!hits.length) { results.push({ ...r, status: start ? 'missing-file' : 'not-in-source', note: start ? 'no such file under the app root' : 'not in the source (fine if the report proposes it)' }); continue; }
      const fitting = start ? hits.filter((f) => lines(f).length >= end) : hits;
      if (!fitting.length) { results.push({ ...r, resolved: hits[0], status: 'line-out-of-range', note: `${hits[0]} has ${lines(hits[0]).length} lines` }); continue; }
      const f = fitting[0];
      r.resolved = f;
      if (hits.length > 1) r.ambiguous = hits;
      if (start) {
        const body = lines(f);
        const ids = quotedIdentifiers(reportLine).filter((id) => body.some((l) => l.includes(id)));
        const window = body.slice(Math.max(0, start - 1 - NEAR), end + NEAR);
        const far = ids.filter((id) => !window.some((l) => l.includes(id)));
        if (ids.length && far.length === ids.length) { // none of the quoted code is near the cited lines
          const at = far.map((id) => `${id} at line ${body.findIndex((l) => l.includes(id)) + 1}`);
          results.push({ ...r, status: 'not-near', note: `quoted ${at.join(', ')}, not near line ${start}` });
          continue;
        }
      }
      results.push({ ...r, status: 'ok' });
    }
  });
  const bad = results.filter((x) => ['missing-file', 'line-out-of-range'].includes(x.status));
  const doubtful = results.filter((x) => x.status === 'not-near');
  const absent = results.filter((x) => x.status === 'not-in-source');
  return { root, checked: results.length, ok: results.filter((x) => x.status === 'ok').length, bad: bad.length, doubtful: doubtful.length, notInSource: absent.length, results };
}

export function refsMarkdown(r, reportName) {
  const L = [`# Source references in ${reportName}`, '', `${r.checked} reference(s): ${r.ok} confirmed, ${r.bad} wrong, ${r.doubtful} doubtful, ${r.notInSource} paths not in the source.`, ''];
  const shown = r.results.filter((x) => x.status !== 'ok');
  if (shown.length) {
    L.push('Fix or remove every wrong reference before the report is shared. Recheck doubtful ones: the quoted code exists, but elsewhere in the file. Paths not in the source are fine when the report proposes them or names its own output.', '', '| Report line | Reference | Problem | Detail |', '|---|---|---|---|');
    for (const x of shown) L.push(`| ${x.reportLine} | \`${x.ref}\` | ${x.status} | ${x.note || ''} |`);
  }
  return L.join('\n');
}
