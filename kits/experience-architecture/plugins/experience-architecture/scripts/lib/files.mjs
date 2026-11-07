// File discovery, project detection and import resolution. No dependencies.
import fs from 'node:fs';
import path from 'node:path';

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.next', '.nuxt', '.svelte-kit', '.turbo', '.vercel', '.output', 'dist', 'build',
  'out', 'coverage', '.cache', '.artifacts', '.experience-architecture', 'storybook-static', '__snapshots__',
]);
export const CODE_EXT = ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs', '.mdx'];

export function walk(root, { exts = CODE_EXT, maxFiles = 20000 } = {}) {
  const out = [];
  const stack = [root];
  while (stack.length && out.length < maxFiles) {
    const dir = stack.pop();
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name) && !e.name.startsWith('.')) stack.push(full);
      } else if (exts.some((x) => e.name.endsWith(x)) && !/\.(test|spec|stories)\.[jt]sx?$/.test(e.name) && !e.name.endsWith('.d.ts')) {
        out.push(full);
      }
    }
  }
  return out.sort();
}

const cache = new Map();
export function read(file) {
  if (!cache.has(file)) {
    try { cache.set(file, fs.readFileSync(file, 'utf8')); } catch { cache.set(file, ''); }
  }
  return cache.get(file);
}

export function lineOf(text, index) {
  let n = 1;
  for (let i = 0; i < index && i < text.length; i++) if (text.charCodeAt(i) === 10) n++;
  return n;
}

// JSON with comments and trailing commas (tsconfig, jsconfig). String-aware, so globs like "**/*.ts" survive.
export function stripJsonc(src) {
  let out = ''; let i = 0; let q = null;
  while (i < src.length) {
    const c = src[i]; const n = src[i + 1];
    if (q) { out += c; if (c === '\\') { out += n ?? ''; i += 2; continue; } if (c === q) q = null; i++; continue; }
    if (c === '"') { q = c; out += c; i++; continue; }
    if (c === '/' && n === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && n === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? src.length : e + 2; continue; }
    out += c; i++;
  }
  return out.replace(/,(\s*[}\]])/g, '$1');
}
function readJsonLoose(file) {
  try { return JSON.parse(stripJsonc(fs.readFileSync(file, 'utf8'))); } catch { return null; }
}

export function detectProject(root) {
  const pkg = readJsonLoose(path.join(root, 'package.json')) || {};
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  const has = (n) => Object.prototype.hasOwnProperty.call(deps, n);
  const frameworks = [];
  if (has('next')) frameworks.push(`next@${deps.next}`);
  if (has('react-router') || has('react-router-dom')) frameworks.push(`react-router@${deps['react-router'] || deps['react-router-dom']}`);
  if (has('@remix-run/react')) frameworks.push('remix');
  if (has('@tanstack/react-router')) frameworks.push('tanstack-router');
  if (has('vue-router')) frameworks.push('vue-router');
  if (has('@sveltejs/kit')) frameworks.push('sveltekit');
  if (has('astro')) frameworks.push('astro');
  const stateLibs = ['zustand', 'jotai', 'redux', '@reduxjs/toolkit', 'recoil', 'valtio', 'nuqs', '@tanstack/react-query', 'swr', 'xstate', 'mobx']
    .filter(has);
  return { name: pkg.name || path.basename(root), frameworks, stateLibs, aliases: loadAliases(root) };
}

// tsconfig/jsconfig "paths" -> [{prefix, targets[]}]
export function loadAliases(root) {
  const aliases = [];
  for (const f of ['tsconfig.json', 'jsconfig.json']) {
    const cfg = readJsonLoose(path.join(root, f));
    const co = cfg?.compilerOptions;
    if (!co) continue;
    const base = path.resolve(root, co.baseUrl || '.');
    for (const [k, v] of Object.entries(co.paths || {})) {
      aliases.push({ prefix: k.replace(/\*$/, ''), targets: v.map((t) => path.resolve(base, t.replace(/\*$/, ''))) });
    }
  }
  if (!aliases.some((a) => a.prefix === '~/')) {
    const appDir = path.join(root, 'app');
    if (fs.existsSync(path.join(root, 'app', 'root.tsx')) || fs.existsSync(path.join(root, 'app', 'root.jsx'))) aliases.push({ prefix: '~/', targets: [appDir + path.sep] });
  }
  return aliases;
}

function tryFile(base) {
  const cands = [base, ...CODE_EXT.map((e) => base + e), ...CODE_EXT.map((e) => path.join(base, 'index' + e))];
  for (const c of cands) {
    try { if (fs.statSync(c).isFile()) return c; } catch { /* next */ }
  }
  return null;
}

export function resolveImport(fromFile, spec, aliases) {
  if (spec.startsWith('.')) return tryFile(path.resolve(path.dirname(fromFile), spec));
  for (const a of aliases) {
    if (a.prefix && spec.startsWith(a.prefix)) {
      for (const t of a.targets) {
        const hit = tryFile(path.join(t, spec.slice(a.prefix.length)));
        if (hit) return hit;
      }
    }
  }
  return null;
}

const IMPORT_RE = /(?:import\s+(?:[\s\S]*?\s+from\s+)?|export\s+(?:\*|\{[\s\S]*?\})\s+from\s+|import\(\s*|require\(\s*)['"]([^'"]+)['"]/g;
export function importsOf(file, aliases) {
  const text = read(file);
  const out = [];
  for (const m of text.matchAll(IMPORT_RE)) {
    const r = resolveImport(file, m[1], aliases);
    if (r) out.push(r);
  }
  return [...new Set(out)];
}

export function rel(root, f) {
  return path.relative(root, f).split(path.sep).join('/');
}

// local binding name -> { file, imported } for every resolvable import in a file
export function importBindings(file, aliases) {
  const text = read(file);
  const out = new Map();
  for (const m of text.matchAll(/import\s+(?:type\s+)?([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g)) {
    const target = resolveImport(file, m[2], aliases);
    if (!target) continue;
    const clause = m[1].trim();
    const def = clause.match(/^([A-Za-z_$][\w$]*)/);
    if (def && !clause.startsWith('{') && !clause.startsWith('*')) out.set(def[1], { file: target, imported: 'default' });
    const named = clause.match(/\{([^}]*)\}/);
    if (named) for (const part of named[1].split(',')) {
      const [orig, local] = part.trim().replace(/^type\s+/, '').split(/\s+as\s+/);
      if (orig) out.set((local || orig).trim(), { file: target, imported: orig.trim() });
    }
    const ns = clause.match(/\*\s+as\s+(\w+)/);
    if (ns) out.set(ns[1], { file: target, imported: '*' });
  }
  for (const m of text.matchAll(/(?:const|let)\s+(\w+)\s*=\s*(?:React\.)?lazy\(\s*\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]/g)) {
    const target = resolveImport(file, m[2], aliases);
    if (target) out.set(m[1], { file: target, imported: 'default' });
  }
  return out;
}
