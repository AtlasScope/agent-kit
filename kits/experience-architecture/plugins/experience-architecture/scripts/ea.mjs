#!/usr/bin/env node
// experience-architecture toolkit CLI. Zero dependencies; Playwright is optional (browser commands).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const [cmd, ...rest] = process.argv.slice(2);

function parse(args) {
  const o = { _: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      if (v !== undefined) o[k] = v;
      else if (args[i + 1] && !args[i + 1].startsWith('--')) o[k] = args[++i];
      else o[k] = true;
    } else o._.push(a);
  }
  return o;
}
const opts = parse(rest);
const outDir = (def) => { const d = path.resolve(opts.out || def); fs.mkdirSync(d, { recursive: true }); return d; };
const write = (dir, name, data) => { const f = path.join(dir, name); fs.writeFileSync(f, typeof data === 'string' ? data : JSON.stringify(data, null, 2)); return f; };
// --ci exit codes: 0 verified pass, 1 failure, 2 nothing was verified (no stated check was evaluated).
const CI_EXIT = { pass: 0, fail: 1, exploratory: 2 };
const readJson = (f) => JSON.parse(fs.readFileSync(path.resolve(f), 'utf8'));

const HELP = `ea <command> [options]

Static analysis (no browser needed)
  map [root] [--out dir]                 Route inventory, chrome, nav graph, signals -> model.json, summary.md, *.mmd
  routes [root]                          Print the route table only
  brief [root] [--area a,b] [--out dir]  Map, save artifacts, print a compact digest (used by the skills at load time)
  sitemap <model.json|proposal.json>     Mermaid site map (current model or a proposal)

Browser (needs Playwright; otherwise use 'probe' with your browser tools)
  crawl <url> [--max 60] [--viewport desktop|mobile|WxH] [--cookie name=value] [--storage-state f] [--out dir]
                                         Runtime link graph by page region, 404s, redirects, near-duplicate pages
  journey <spec.json> [--base url] [--viewport v] [--out dir] [--ci] [--screenshots] [--keep-text] [--reveal]
                                         Run journeys step by step, snapshot state after every step, check invariants.
                                         Verdict: PASS (stated checks met, no open defects), FAIL (a check failed, a
                                         journey stopped, or a defect not listed under "accept"), or EXPLORATORY (no
                                         stated check; nothing verified). --ci exits 0 / 1 / 2 for these.
  capture <url|path...> [--base url] [--widths desktop,mobile,560x900] [--out dir] [--revision r] [--fold]
          [--cookie name=value] [--storage-state f]
                                         Full-page screens of each URL at each width, plus capture.json. File names
                                         depend on the URL and width only, so a run before a change and a run after
                                         it (each with its own --out) pair up by name
  probe                                  Print the state-snapshot script to run in any browser tool
  transitions <log.json> [--out dir] [--ci]  Analyze a journey log (from 'journey' or hand-collected probe snapshots)

Reports
  refs <report.md> [--root app] [--ci]   Check every file:line reference in a report against the source: the file
                                         exists, the line exists, quoted identifiers are near it. --ci exits 1 on
                                         any wrong reference

  sheet <before-dir> <after-dir> [--out sheet.html] [--title t] [--blind] [--inline]
                                         One HTML page pairing the captures that share a file name in two folders
                                         (from 'capture' or 'journey --screenshots'). --blind shows each pair as A
                                         and B in mixed order and writes the key to a separate file. No browser

Design and migration
  prototype <proposal.json...> [--out file.html]   Clickable navigation prototype of one or more proposals
  migrate <model.json> <mapping.json> [--out dir]  URL migration coverage, redirect config, regression journeys
`;

async function main() {
  switch (cmd) {
    case 'map': {
      const { buildModel } = await import('./lib/model.mjs');
      const { summaryMarkdown, navGraphMermaid, navGraphDot, sitemapMermaid } = await import('./lib/render.mjs');
      const root = path.resolve(opts._[0] || '.');
      const model = buildModel(root);
      const dir = outDir(path.join(root, '.experience-architecture', 'map'));
      write(dir, 'model.json', model);
      write(dir, 'summary.md', summaryMarkdown(model));
      write(dir, 'nav-graph.mmd', navGraphMermaid(model));
      write(dir, 'nav-graph.dot', navGraphDot(model));
      const status = (r) => (r.inbound?.length === 0 && r.path !== '/' ? 'orphan' : undefined);
      write(dir, 'sitemap-current.mmd', sitemapMermaid(model.routes.filter((r) => r.kind === 'page').map((r) => ({ path: r.path, status: status(r) })), { title: 'current' }));
      const by = (a) => model.signals.filter((s) => s.area === a).length;
      console.log(`${model.project.name}: ${model.counts.pages} pages, ${model.chrome.length} chrome components, ${model.counts.edges} nav refs, ${model.counts.signals} signals (ia ${by('ia')}, routing ${by('routing')}, chrome ${by('chrome')}, continuity ${by('continuity')})`);
      console.log(`Wrote ${dir}/{model.json,summary.md,nav-graph.mmd,nav-graph.dot,sitemap-current.mmd}`);
      break;
    }
    case 'brief': {
      // Compact digest for injection into a skill at load time. Never fails the caller.
      try {
        const { buildModel } = await import('./lib/model.mjs');
        const { summaryMarkdown, navGraphMermaid, navGraphDot, sitemapMermaid } = await import('./lib/render.mjs');
        const root = path.resolve(opts._[0] || '.');
        const model = buildModel(root);
        const pages = model.routes.filter((r) => r.kind === 'page');
        if (!pages.length) { console.log(`ea brief: no routes found under ${root}. If the app lives elsewhere (monorepo package, other folder), run: ea map <app-root> --out <dir>`); break; }
        const day = new Date().toISOString().slice(0, 10);
        const base = opts.out ? path.resolve(opts.out) : fs.existsSync(path.join(root, '.artifacts')) ? path.join(root, '.artifacts', 'experience-architecture', day) : path.join(root, '.experience-architecture', day);
        let dir = path.join(base, 'map');
        try { fs.mkdirSync(dir, { recursive: true }); } catch { dir = fs.mkdtempSync(path.join((await import('node:os')).tmpdir(), 'ea-map-')); }
        write(dir, 'model.json', model); write(dir, 'summary.md', summaryMarkdown(model)); write(dir, 'nav-graph.mmd', navGraphMermaid(model)); write(dir, 'nav-graph.dot', navGraphDot(model));
        write(dir, 'sitemap-current.mmd', sitemapMermaid(pages.map((r) => ({ path: r.path, status: r.inbound?.length === 0 && r.path !== '/' ? 'orphan' : undefined }))));
        const areas = opts.area ? String(opts.area).split(',') : ['ia', 'routing', 'chrome', 'continuity'];
        const sigs = model.signals.filter((x) => areas.includes(x.area));
        const L = [];
        L.push(`Static map of ${model.project.name} (${model.project.frameworks.join(', ') || 'framework unknown'}): ${pages.length} pages, ${model.chrome.length} persistent nav components, ${model.counts.edges} navigation references, ${model.redirects.length} redirects, ${model.guards.length} auth guards.`);
        L.push(`Artifacts: ${dir}/ (model.json, summary.md with the full route table, nav-graph.mmd, sitemap-current.mmd). Write the rest of this review's output beside that folder: ${path.dirname(dir)}/`);
        L.push(`Pages: ${pages.map((r) => r.path).join('  ')}`);
        if (model.chrome.length) L.push(`Chrome: ${model.chrome.map((c) => `${c.file} [${c.targets.length} destinations, active=${c.activeStrategy || 'none'}]`).join('; ')}`);
        L.push('', `Signals${opts.area ? ' (' + areas.join(', ') + ')' : ''}: candidates to confirm in code or the browser, not findings yet.`);
        for (const x of sigs) L.push(`- ${x.id} ${x.title}. ${(x.evidence || []).slice(0, 3).map((e) => e.file + (e.line ? ':' + e.line : '')).join(', ')}`);
        if (!sigs.length) L.push('- none in these areas');
        const dyn = model.edges.filter((e) => e.status === 'dynamic').length;
        if (dyn) L.push('', `${dyn} navigation target(s) are computed at runtime and unresolved; see the end of summary.md.`);
        console.log(L.join('\n'));
      } catch (e) { console.log(`ea brief could not map this folder (${e.message}). Run ea map <app-root> manually.`); }
      break;
    }
    case 'routes': {
      const { buildModel } = await import('./lib/model.mjs');
      const m = buildModel(path.resolve(opts._[0] || '.'));
      for (const r of m.routes) console.log(`${r.kind.padEnd(12)} ${r.path.padEnd(40)} ${r.file}${r.line ? ':' + r.line : ''}${r.inbound?.length === 0 ? '  [no inbound]' : ''}`);
      break;
    }
    case 'sitemap': {
      const { sitemapMermaid } = await import('./lib/render.mjs');
      const j = readJson(opts._[0]);
      if (j.routes) console.log(sitemapMermaid(j.routes.filter((r) => r.kind === 'page').map((r) => ({ path: r.path, status: r.inbound?.length === 0 && r.path !== '/' ? 'orphan' : undefined }))));
      else { const { flattenProposal } = await import('./lib/prototype.mjs'); console.log(sitemapMermaid(flattenProposal(j), { title: j.name })); }
      break;
    }
    case 'probe': {
      process.stdout.write(fs.readFileSync(path.join(HERE, 'lib', 'probe.js'), 'utf8'));
      break;
    }
    case 'crawl': {
      const { crawl } = await import('./lib/browser.mjs');
      const dir = outDir('.experience-architecture/crawl');
      const cookies = [].concat(opts.cookie || []).filter((c) => typeof c === 'string').map((c) => { const [name, ...v] = c.split('='); return { name, value: v.join('=') }; });
      const res = await crawl(opts._[0], { max: Number(opts.max || 60), viewport: opts.viewport, storageState: opts['storage-state'], cookies, include: opts.include, exclude: opts.exclude });
      write(dir, 'crawl.json', res);
      const { crawlMarkdown } = await import('./lib/browser.mjs');
      write(dir, 'crawl.md', crawlMarkdown(res));
      console.log(`Crawled ${res.pages.length} pages; ${res.findings.length} findings. Wrote ${dir}/crawl.{json,md}`);
      break;
    }
    case 'capture': {
      const { capture } = await import('./lib/browser.mjs');
      if (!opts._.length) throw new Error('usage: ea capture <url|path...> [--base url] [--widths desktop,mobile] [--out dir]');
      if (opts._.some((u) => !/^https?:/.test(u)) && typeof opts.base !== 'string') throw new Error('ea capture: give full URLs, or paths with --base <url>');
      const dir = outDir('.experience-architecture/captures');
      const widths = String(opts.widths || 'desktop,mobile').split(',').filter(Boolean);
      const cookies = [].concat(opts.cookie || []).filter((c) => typeof c === 'string').map((c) => { const [name, ...v] = c.split('='); return { name, value: v.join('=') }; });
      const res = await capture(opts._, { widths, dir, base: opts.base, storageState: opts['storage-state'], cookies, foldOnly: !!opts.fold });
      let revision = typeof opts.revision === 'string' ? opts.revision : null;
      if (!revision) { try { const { execFileSync } = await import('node:child_process'); revision = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() + (execFileSync('git', ['status', '--porcelain'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() ? ' with uncommitted changes' : ''); } catch { /* not a git folder */ } }
      const { scrubUrls } = await import('./lib/browser.mjs');
      write(dir, 'capture.json', { base: scrubUrls(opts.base || new URL(opts._[0]).origin), revision, capturedAt: new Date().toISOString(), widths, fullPage: !opts.fold, ...res });
      const failed = res.shots.filter((x) => x.error);
      console.log(`${res.shots.length - failed.length} capture(s) at ${widths.join(', ')}${failed.length ? `, ${failed.length} failed` : ''}. Revision: ${revision || 'not recorded (pass --revision)'}.\nWrote ${dir}/ (PNG files and capture.json)`);
      for (const x of failed) console.log(`  failed: ${x.url} at ${x.width}: ${x.error}`);
      for (const x of res.shots.filter((y) => y.status >= 400 || y.landedOn)) console.log(`  check: ${x.url} at ${x.width} ${x.status >= 400 ? `returned ${x.status}` : `landed on ${x.landedOn}`}`);
      if (failed.length) process.exitCode = 1;
      break;
    }
    case 'sheet': {
      const { buildSheet } = await import('./lib/sheet.mjs');
      const [b, a] = opts._.map((d) => path.resolve(d));
      if (!b || !a || !fs.existsSync(b) || !fs.existsSync(a)) throw new Error('usage: ea sheet <before-dir> <after-dir> [--out sheet.html] [--blind]');
      const outFile = path.resolve(typeof opts.out === 'string' ? opts.out : path.join(path.dirname(a), opts.blind ? 'sheet-blind.html' : 'sheet.html'));
      fs.mkdirSync(path.dirname(outFile), { recursive: true });
      const r = buildSheet(b, a, { outFile, title: typeof opts.title === 'string' ? opts.title : undefined, blind: !!opts.blind, inline: !!opts.inline });
      if (!r.pairs.length) throw new Error(`ea sheet: no PNG file names are shared by ${b} and ${a}. Captures pair by file name; run the same command or spec on both sides.`);
      fs.writeFileSync(outFile, r.html);
      console.log(`${r.pairs.length} pair(s). Wrote ${outFile}`);
      if (r.key) { const k = outFile.replace(/\.html?$/i, '') + '-key.json'; fs.writeFileSync(k, JSON.stringify(r.key, null, 2)); console.log(`Key: ${k} (keep it from whoever judges the sheet)`); }
      for (const n of r.notes) console.log(`  note: ${n}`);
      if (r.onlyBefore.length || r.onlyAfter.length) console.log(`  not paired: ${r.onlyBefore.length} only in before, ${r.onlyAfter.length} only in after`);
      break;
    }
    case 'journey': {
      const { runJourneys } = await import('./lib/browser.mjs');
      const { analyzeLog, transitionsMarkdown, transitionMermaid } = await import('./lib/transitions.mjs');
      const spec = readJson(opts._[0]);
      const dir = outDir('.experience-architecture/journeys');
      const { redactLog, sensitiveValues, scrubText } = await import('./lib/browser.mjs');
      const reveal = !!opts.reveal || !!spec.reveal;
      const log = await runJourneys(spec, { base: opts.base, viewport: opts.viewport, screenshots: opts.screenshots ? dir : null, reveal });
      const analysis = analyzeLog(log);
      // Final sweep: no typed value, cookie value or secret URL parameter from this run reaches disk.
      const secrets = reveal ? [] : sensitiveValues(spec);
      const save = (name, data) => write(dir, name, reveal ? data : scrubText(typeof data === 'string' ? data : JSON.stringify(data, null, 2), secrets));
      save('journey-log.json', opts['keep-text'] ? log : redactLog(log));
      save('transitions.json', analysis);
      save('transitions.md', transitionsMarkdown(analysis));
      save('transitions.mmd', transitionMermaid(analysis));
      console.log(`${log.runs.length} journey run(s). ${analysis.verdict.summary}\nWrote ${dir}/{journey-log.json,transitions.*}`);
      if (analysis.verdict.result !== 'pass') console.log('Read transitions.md before reporting anything as working.');
      if (opts.ci) process.exitCode = CI_EXIT[analysis.verdict.result];
      break;
    }
    case 'transitions': {
      const { analyzeLog, transitionsMarkdown, transitionMermaid } = await import('./lib/transitions.mjs');
      const analysis = analyzeLog(readJson(opts._[0]));
      const dir = outDir(path.dirname(path.resolve(opts._[0])));
      write(dir, 'transitions.json', analysis); write(dir, 'transitions.md', transitionsMarkdown(analysis)); write(dir, 'transitions.mmd', transitionMermaid(analysis));
      console.log(`${analysis.verdict.summary}\nWrote ${dir}/transitions.*`);
      if (opts.ci) process.exitCode = CI_EXIT[analysis.verdict.result];
      break;
    }
    case 'refs': {
      const { checkRefs, refsMarkdown } = await import('./lib/refs.mjs');
      const file = opts._[0];
      if (!file) throw new Error('usage: ea refs <report.md> [--root app]');
      const r = checkRefs(fs.readFileSync(path.resolve(file), 'utf8'), path.resolve(opts.root || '.'));
      console.log(refsMarkdown(r, path.basename(file)));
      if (opts.ci && r.bad) process.exitCode = 1;
      break;
    }
    case 'prototype': {
      const { prototypeHtml } = await import('./lib/prototype.mjs');
      const proposals = opts._.map(readJson);
      const file = path.resolve(opts.out || '.experience-architecture/prototype.html');
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, prototypeHtml(proposals));
      console.log(`Wrote ${file} (${proposals.length} proposal(s))`);
      break;
    }
    case 'migrate': {
      const { planMigration, migrationMarkdown } = await import('./lib/migrate.mjs');
      const plan = planMigration(readJson(opts._[0]), readJson(opts._[1]));
      const dir = outDir('.experience-architecture/migration');
      write(dir, 'migration.json', plan); write(dir, 'migration.md', migrationMarkdown(plan));
      write(dir, 'regression-journeys.json', plan.regressionSpec);
      if (plan.nextRedirects) write(dir, 'next-redirects.js', plan.nextRedirects);
      console.log(`${plan.coverage.mapped}/${plan.coverage.total} current pages accounted for, ${plan.problems.length} problem(s), ${plan.codeUpdates.length} code reference(s) to update. Wrote ${dir}/`);
      if (plan.problems.length && opts.ci) process.exitCode = 1;
      break;
    }
    default:
      process.stdout.write(HELP);
      if (cmd && cmd !== 'help' && cmd !== '--help') process.exitCode = 1;
  }
}

main().catch((e) => { console.error(e.message || e); process.exitCode = 1; });
