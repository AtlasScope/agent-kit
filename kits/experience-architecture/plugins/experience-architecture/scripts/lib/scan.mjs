// Per-file extraction of navigation references and state-ownership signals.
import { read, lineOf } from './files.mjs';

const lit = (s) => s && /^['"`]/.test(s.trim()) ? s.trim().slice(1, -1) : null;

function firstArg(text, start) {
  // returns the raw first argument text starting at `start` (just after '(')
  let depth = 0; let q = null; let i = start;
  for (; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === q && text[i - 1] !== '\\') q = null; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; continue; }
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) { if (depth === 0) break; depth--; }
    else if (c === ',' && depth === 0) break;
  }
  return { arg: text.slice(start, i).trim(), end: i };
}

function tagBefore(text, idx) {
  const lt = text.lastIndexOf('<', idx);
  const m = text.slice(lt, idx).match(/^<\s*([A-Za-z][\w.]*)/);
  return m ? m[1] : null;
}

function jsxLabel(text, idx) {
  const close = text.indexOf('>', idx);
  if (close < 0) return null;
  const m = text.slice(close + 1, close + 160).match(/^\s*([^<{]{1,60}?)\s*</);
  return m ? m[1].trim() || null : null;
}

export function scanFile(file) {
  const text = read(file);
  const refs = [];
  const add = (r) => refs.push({ ...r, line: lineOf(text, r.at) });

  // JSX href= / to=
  for (const m of text.matchAll(/\b(href|to)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*([`'"])([^`'"]*?)\4\s*\}|\{([^}]+)\})/g)) {
    const tag = tagBefore(text, m.index);
    if (!tag) continue;
    const literal = m[2] ?? m[3] ?? m[5];
    const expr = m[6];
    add({ at: m.index, kind: 'link', tag, target: literal ?? null, expr: literal == null ? expr?.trim() : null, label: jsxLabel(text, m.index) });
  }
  // object literal nav items: { href: '/x', label: 'X' }
  if (/<(Link|NavLink|a)\b|router\.(push|replace)|navigate\(/.test(text)) {
    for (const m of text.matchAll(/\{[^{}]*?\b(href|to|path|url|pathname)\s*:\s*(['"`])(\/[^'"`]*)\2[^{}]*\}/g)) {
      const obj = m[0];
      const lab = obj.match(/\b(label|title|name|text)\s*:\s*['"`]([^'"`]+)['"`]/);
      add({ at: m.index, kind: 'nav-item', tag: null, target: m[3], label: lab ? lab[2] : null });
    }
  }
  // imperative navigation
  const CALLS = [
    [/\brouter\.(push|replace|prefetch)\(/g, (m) => m[1]],
    [/\b(?:navigate|nav)\(/g, () => 'navigate'],
    [/\bhistory\.(push|replace|pushState|replaceState)\(/g, (m) => m[1].replace('State', '')],
    [/\b(?:window\.)?location\.(assign|replace)\(/g, (m) => 'location-' + m[1]],
    [/(?:^|[^.\w])(redirect|permanentRedirect)\(/g, () => 'redirect'],
  ];
  for (const [re, kindOf] of CALLS) {
    for (const m of text.matchAll(re)) {
      let kind = kindOf(m);
      if (kind === 'prefetch') continue;
      let { arg, end } = firstArg(text, m.index + m[0].length);
      if ((kind === 'push' || kind === 'replace') && /^history\./.test(m[0].replace(/^\W/, '')) && m[0].includes('State')) {
        // pushState(state, title, url) -> third arg
        const a2 = firstArg(text, end + 1); const a3 = firstArg(text, a2.end + 1); arg = a3.arg;
      }
      const tail = text.slice(end, end + 120);
      if (kind === 'navigate') {
        if (/replace\s*:\s*true/.test(tail)) kind = 'replace';
        else if (/^-?\d+$/.test(arg)) kind = arg.startsWith('-') ? 'back' : 'forward';
        else kind = 'push';
      }
      const target = lit(arg);
      const ctxStart = text.lastIndexOf('<', m.index);
      const ctx = text.slice(Math.max(ctxStart, m.index - 200), m.index + 200);
      add({
        at: m.index, kind, tag: null, target: target ?? null, expr: target == null ? arg.slice(0, 80) : null,
        scrollFalse: /scroll\s*:\s*false|preventScrollReset/.test(tail),
        backLike: /←|&larr;|\bBack\b/i.test(ctx.slice(ctx.indexOf(m[0]))),
      });
    }
  }
  for (const m of text.matchAll(/(?:window\.)?location\.href\s*=\s*([^;\n]+)/g)) add({ at: m.index, kind: 'location-assign', target: lit(m[1]), expr: lit(m[1]) ? null : m[1].trim().slice(0, 80) });

  // exported/local arrays of nav items: const primaryNav = [{ label, to }, ...]
  const navArrays = {};
  for (const m of text.matchAll(/(?:export\s+)?const\s+(\w+)\s*(?::[^=]+)?=\s*\[/g)) {
    let depth = 0; let i = m.index + m[0].length - 1;
    for (; i < text.length; i++) { const c = text[i]; if (c === '[') depth++; else if (c === ']') { depth--; if (!depth) break; } }
    const body = text.slice(m.index, i);
    const items = [...body.matchAll(/\{[^{}]*?\b(href|to|path|url|pathname)\s*:\s*(['"`])(\/[^'"`]*)\2[^{}]*\}/g)].map((x) => {
      const lab = x[0].match(/\b(label|title|name|text)\s*:\s*['"`]([^'"`]+)['"`]/);
      return { target: x[3], label: lab ? lab[2] : null, line: lineOf(text, m.index + x.index) };
    });
    if (items.length) navArrays[m[1]] = items;
  }
  // URL helper functions (lower-case names that return a path): export const ticketUrl = (id) => `/tickets/${id}`
  const urlHelpers = {};
  const pathLits = (body) => [...body.matchAll(/`(\/[^`]*)`|'(\/[^']*)'|"(\/[^"]*)"/g)].map((x) => x[1] ?? x[2] ?? x[3]);
  for (const m of text.matchAll(/(?:export\s+)?(?:const\s+([a-z]\w*)\s*=\s*(?:\([^)]*\)|\w+)\s*(?::[^=]+)?=>\s*|function\s+([a-z]\w*)\s*\([^)]*\)[^{]*\{)/g)) {
    const name = m[1] || m[2];
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 800);
    let body; let lits;
    if (m[1]) { body = after.split(/;\s*\n|\n(?=\S)/)[0]; lits = /^\s*[`'"]/.test(body) || /^\s*\(?\s*[\w.]+\s*\?/.test(body) ? pathLits(body) : []; }
    else { const endIdx = after.search(/\n\}/); body = after.slice(0, endIdx > 0 ? endIdx : 800); lits = [...body.matchAll(/return\s+([^;\n]+)/g)].flatMap((r) => pathLits(r[1])); }
    if (lits.length) urlHelpers[name] = { templates: [...new Set(lits)], line: lineOf(text, m.index), unencoded: lits.some((t) => t.includes('?') || t.includes('=')) && /=\$\{|\$\{[^}]*join\(/.test(body) && !/encodeURIComponent|URLSearchParams|qs\.stringify|querystring|\.toString\(\)/.test(body) };
  }

  // ---- state / ownership signals ----
  const useStates = [...text.matchAll(/const\s*\[\s*(\w+)\s*,\s*set\w*\s*\]\s*=\s*(?:React\.)?useState\b/g)].map((m) => ({ name: m[1], line: lineOf(text, m.index) }));
  const queryKeysRead = [...text.matchAll(/(?:searchParams|params|query|search)\??\.get\(\s*['"`]([\w-]+)['"`]/g)].map((m) => m[1]);
  const destructuredQuery = [...text.matchAll(/const\s*\{([^}]+)\}\s*=\s*(?:await\s+)?searchParams/g)].flatMap((m) => m[1].split(',').map((s) => s.trim().split(/[:\s=]/)[0]).filter(Boolean));
  const has = (re) => re.test(text);
  const activeStrategy = has(/\bNavLink\b|useSelectedLayoutSegments?\b|useMatch\(|useMatchRoute|activeProps|activeClassName/) ? 'library'
    : has(/pathname\s*\.startsWith\(|\.startsWith\(\s*pathname|pathname\.includes\(|matchPath\(/) ? 'prefix'
      : has(/pathname\s*===|===\s*pathname|pathname\s*==\s|location\.pathname\s*===/) ? 'exact' : null;

  return {
    refs,
    navArrays,
    urlHelpers,
    client: /^\s*['"]use client['"]/.test(text),
    useStates,
    queryKeysRead: [...new Set([...queryKeysRead, ...destructuredQuery])],
    readsSearchParams: has(/useSearchParams|searchParams|useLocation\(\)\.search|location\.search|useQueryState|useSearch\(/),
    readsParams: has(/useParams|params\b/),
    usesPathname: has(/usePathname|useLocation|location\.pathname/),
    context: has(/createContext\(/),
    provider: has(/\.Provider\b|Provider\s*value=|<\w+Provider\b/),
    store: has(/\bcreate\(\s*\(?\s*set\b|configureStore|atom\(|createSlice|proxy\(/),
    storage: [...text.matchAll(/(local|session)Storage\.(?:get|set)Item\(\s*['"`]([^'"`]+)/g)].map((m) => `${m[1]}:${m[2]}`),
    scrollHandling: has(/scrollTo\(|scrollIntoView|scrollRestoration|<ScrollRestoration|preventScrollReset|scroll\s*:\s*false/),
    focusHandling: has(/\.focus\(|autoFocus|tabIndex=\{?-1/),
    overlay: has(/role\s*=\s*['"]dialog['"]|<dialog\b|aria-modal|<(Dialog|Modal|Drawer|Sheet|Popover|SlideOver)\b/),
    tabs: has(/role\s*=\s*['"]tab['"]|<Tabs?\b|TabList|TabsTrigger/),
    activeStrategy,
    ariaCurrent: has(/aria-current/),
    derivedCrumbs: has(/split\(\s*['"]\/['"]\s*\)/) && has(/join\(\s*['"]\/['"]\s*\)/) && has(/href|to=/),
    popstate: has(/popstate|beforeunload|useBlocker|onbeforeunload/),
    mobileNavHint: has(/md:hidden|sm:hidden|lg:hidden|hamburger|MobileNav|mobile-?menu|aria-label=["'][^"']*menu/i),
    hiddenBelowBreakpoint: [...text.matchAll(/<(nav|aside|header)\b[^>]*className\s*=\s*["'{`][^"'`]*\bhidden\s+(sm|md|lg|xl):(flex|block|grid)/g)].map((m) => ({ tag: m[1], bp: m[2], line: lineOf(text, m.index) })),
    tokens: contentTokens(text),
    dataSig: dataSignature(text),
    nestedComponents: nestedComponents(text),
    overlayStates: useStates.filter((u) => new RegExp(`\\{\\s*${u.name}\\s*&&\\s*(?:\\(\\s*)?<\\w*(Dialog|Modal|Drawer|Sheet|Overlay|Popover|SlideOver|Lightbox|Composer)\\b|\\b(open|isOpen|show|visible)\\s*=\\s*\\{\\s*${u.name}\\s*\\}`).test(text)),
    storeEntityFields: /\bcreate\s*(<[^>]*>)?\s*\(|createSlice|createStore|atom\(/.test(text) ? [...text.matchAll(/^\s*(\w*(?:draft|reply|note|comment|message|body|selected\w*|current\w*)\w*)\s*:\s*(?:['"`]|null|''|\[\]|\{\}|0\b)/gim)].map((m) => ({ name: m[1], line: lineOf(text, m.index) })) : [],
    unencodedQuery: Object.entries(urlHelpers).filter(([, h]) => h.unencoded).map(([n]) => n),
    scrollRestoration: /<ScrollRestoration|scrollRestoration|scrollTo\(\s*0|useScrollToTop|preventScrollReset/.test(text),
  };
}

// CSS: selectors hidden inside max-width media queries
export function scanCss(file) {
  const text = read(file);
  const out = [];
  for (const m of text.matchAll(/@media[^{]*max-width\s*:\s*(\d+)px[^{]*\{([\s\S]*?\})\s*\}/g)) {
    for (const r of m[2].matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      if (/display\s*:\s*none/.test(r[2])) out.push({ selector: r[1].trim(), maxWidth: Number(m[1]), line: lineOf(text, m.index) });
    }
  }
  return out;
}

const STOP = new Set('export default function return const async await import from props children classname onclick usestate useeffect params searchparams button label input type value true false null undefined length style'.split(' '));
function contentTokens(text) {
  const body = text.replace(/^import[^\n]*$/gm, '').replace(/\/\/.*$/gm, '');
  const words = (body.match(/>[^<>{}]{2,}</g) || []).join(' ') + ' ' + (body.match(/\b[a-z][a-zA-Z]{3,}\b/g) || []).join(' ');
  return [...new Set(words.toLowerCase().split(/[^a-z0-9$]+/).filter((w) => w.length > 3 && !STOP.has(w)))];
}

// What data a page reads and which fields it renders: imported lowercase symbols + member accesses.
const GENERIC = new Set('map filter slice length find findIndex includes push replace get set then catch preventDefault target value cookie startsWith endsWith join split toUpperCase toLowerCase trim forEach reduce some every keys values entries current toString toFixed indexOf concat sort'.split(' '));
// Components declared inside another component's body remount on every parent render.
function nestedComponents(text) {
  const out = [];
  const lines = text.split('\n');
  let inComp = null;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const top = l.match(/^(?:export\s+(?:default\s+)?)?(?:function\s+([A-Z]\w*)\s*\(|const\s+([A-Z]\w*)\s*=\s*(?:\([^)]*\)|\w+)\s*=>)/);
    if (top) { inComp = top[1] || top[2]; continue; }
    if (/^\S/.test(l) && !/^[}\])]/.test(l)) inComp = null;
    const nested = inComp && l.match(/^\s+(?:function\s+([A-Z]\w*)\s*\(|const\s+([A-Z]\w*)\s*=\s*(?:\([^)]*\)|\w+)\s*=>)/);
    if (nested) { const name = nested[1] || nested[2]; if (new RegExp(`<${name}[\\s/>]`).test(text)) out.push({ name, parent: inComp, line: i + 1 }); }
  }
  return out;
}

function dataSignature(text) {
  const imported = [...text.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"](?:\.|@\/|~\/)[^'"]*['"]/g)].flatMap((m) => m[1].split(',').map((x) => x.trim().split(/\s+as\s+/).pop())).filter((x) => /^[a-z]/.test(x) && !/^use[A-Z]/.test(x));
  const members = [...text.matchAll(/\b[a-zA-Z_$][\w$]*\.([a-zA-Z_$][\w$]*)/g)].map((m) => m[1]).filter((x) => !GENERIC.has(x));
  const comps = [...text.matchAll(/import\s+(?:([A-Z]\w*)|\{([^}]+)\})\s+from\s*['"](?:\.|@\/|~\/)[^'"]*['"]/g)].flatMap((m) => (m[1] ? [m[1]] : m[2].split(',').map((x) => x.trim().split(/\s+as\s+/).pop()))).filter((x) => /^[A-Z]/.test(x) && new RegExp(`<${x}[\\s/>]`).test(text));
  return [...new Set([...imported.map((x) => 'data:' + x), ...comps.map((x) => 'comp:' + x), ...members])];
}
