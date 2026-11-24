// In-page checks. Each function runs inside the page (Playwright `page.evaluate` or WebDriver
// `execute/sync`), so it uses only DOM APIs and returns plain JSON. Nothing here depends on the
// site's class names, so the checks survive a redesign.

// Records every string the page tries to put on the clipboard, through either API, and can make
// the Clipboard API refuse (to test the "copy blocked" path). Installed before any page script runs.
export const clipboardRecorder = (deny) => {
  window.__qaCopies = [];
  const clip = navigator.clipboard;
  if (clip && clip.writeText) {
    const original = clip.writeText.bind(clip);
    clip.writeText = (text) => {
      window.__qaCopies.push(String(text));
      if (deny) return Promise.reject(new DOMException("Denied by QA harness", "NotAllowedError"));
      return original(text).catch(() => undefined);
    };
  }
  const exec = document.execCommand.bind(document);
  document.execCommand = (cmd, ...rest) => {
    if (String(cmd).toLowerCase() === "copy") window.__qaCopies.push(String(getSelection()));
    return exec(cmd, ...rest);
  };
};

// Layout, structure and metadata of the page as it stands.
export const pageFacts = () => {
  const meta = (sel) => document.querySelector(sel)?.getAttribute("content") ?? null;
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && Number(cs.opacity) > 0;
  };
  const sideScroll = document.documentElement.scrollWidth - window.innerWidth;
  // Elements wider than the viewport, to name the culprit of a side scroll.
  const wide = sideScroll > 1
    ? [...document.querySelectorAll("body *")].filter((el) => { const r = el.getBoundingClientRect(); return r.right > window.innerWidth + 1 && r.width > 0 && visible(el); })
        .slice(0, 5).map((el) => el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).join(".") : ""))
    : [];
  const h1 = [...document.querySelectorAll("h1")].filter(visible).map((h) => h.textContent.trim().replace(/\s+/g, " "));
  const jsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { return JSON.parse(s.textContent)["@type"]; } catch { return "invalid"; } });
  return {
    title: document.title,
    lang: document.documentElement.lang,
    description: meta('meta[name="description"]'),
    robots: meta('meta[name="robots"]'),
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null,
    ogTitle: meta('meta[property="og:title"]'),
    ogDescription: meta('meta[property="og:description"]'),
    ogImage: meta('meta[property="og:image"]'),
    ogUrl: meta('meta[property="og:url"]'),
    twitterCard: meta('meta[name="twitter:card"]'),
    alternateMd: document.querySelector('link[rel="alternate"][type="text/markdown"]')?.getAttribute("href") ?? null,
    viewport: meta('meta[name="viewport"]'),
    h1,
    jsonLd,
    landmarks: { main: document.querySelectorAll("main").length, banner: document.querySelectorAll('header, [role="banner"]').length, nav: document.querySelectorAll('nav, [role="navigation"]').length },
    skipLink: !!document.querySelector('a[href="#main"], a[href^="#"][class*="skip"]'),
    sideScroll,
    wide,
    docHeight: document.documentElement.scrollHeight,
  };
};

// Interactive elements under the touch-target floor (DESIGN-CONTRACT rule 6). Inline links inside
// running text are exempt, as WCAG 2.5.8 exempts them.
export const smallTargets = (min) => {
  const out = [];
  const sel = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="tab"], [role="link"], [role="option"], [tabindex]:not([tabindex="-1"])';
  for (const el of document.querySelectorAll(sel)) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (r.width === 0 || r.height === 0 || cs.visibility === "hidden" || cs.display === "none") continue;
    if (el.closest("[inert], [aria-hidden='true']")) continue;
    // A "stretched" link whose ::after covers its card is as big as the card.
    const after = getComputedStyle(el, "::after");
    if (after.content !== "none" && after.position === "absolute") continue;
    if (el.tagName === "A" && cs.display === "inline" && el.parentElement && /^(P|LI|TD|DD|SPAN|EM|STRONG)$/.test(el.parentElement.tagName) && el.parentElement.textContent.trim().length > el.textContent.trim().length + 20) continue;
    if (r.width < min - 0.5 || r.height < min - 0.5) {
      out.push({ name: (el.getAttribute("aria-label") || el.textContent || el.getAttribute("title") || el.tagName).trim().replace(/\s+/g, " ").slice(0, 60), w: Math.round(r.width), h: Math.round(r.height), tag: el.tagName.toLowerCase() });
    }
  }
  return out;
};

// Animations still running a moment after load. Interior pages must not animate by themselves
// (contract rule 7), and nothing may travel when reduced motion is on.
export const runningAnimations = () =>
  document.getAnimations ? document.getAnimations().filter((a) => a.playState === "running").map((a) => {
    const t = a.effect?.target;
    const timing = a.effect?.getComputedTiming?.() || {};
    return { name: a.animationName || a.transitionProperty || a.constructor.name, target: t ? t.tagName.toLowerCase() + (t.className && typeof t.className === "string" ? "." + t.className.trim().split(/\s+/)[0] : "") : "?", infinite: timing.iterations === Infinity, duration: timing.duration };
  }).slice(0, 10) : [];

// Describes what has focus and whether focus visibly changes it (on the element or a close ancestor). The focused element's outline,
// box-shadow, border colour and background are compared with the same element unfocused; an outline
// or any of those changing counts as a visible focus indicator.
export const focusInfo = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return { tag: "body" };
  // The element and up to three ancestors, since a card can show focus with :focus-within on its wrapper.
  const chain = [el, el.parentElement, el.parentElement?.parentElement, el.parentElement?.parentElement?.parentElement].filter(Boolean);
  const look = () => chain.map((n) => { const cs = getComputedStyle(n); return [cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0 ? cs.outlineColor + cs.outlineWidth : "", cs.boxShadow, cs.borderColor, cs.backgroundColor, cs.textDecorationLine, cs.color].join("|"); }).join("||");
  const focused = look();
  const cs = getComputedStyle(el);
  const hasOutline = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
  el.blur();
  const resting = look();
  el.focus({ preventScroll: true });
  const r = el.getBoundingClientRect();
  return {
    tag: el.tagName.toLowerCase(),
    name: (el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder") || "").trim().replace(/\s+/g, " ").slice(0, 50),
    href: el.getAttribute("href"),
    ring: hasOutline || focused !== resting,
    onScreen: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && r.width > 0,
    key: el.tagName + "|" + (el.getAttribute("href") || "") + "|" + (el.textContent || "").trim().slice(0, 30) + "|" + Math.round(r.top + scrollY) + "|" + Math.round(r.left),
  };
};

// Every visible control whose name says it copies.
export const copyControls = () => {
  const out = [];
  document.querySelectorAll('button, [role="button"]').forEach((el, i) => {
    const name = (el.getAttribute("aria-label") || el.textContent || "").trim();
    const r = el.getBoundingClientRect();
    if (!/\bcopy\b/i.test(name) || r.width === 0 || r.height === 0) return;
    el.setAttribute("data-qa-copy", String(i));
    out.push({ id: String(i), name: name.replace(/\s+/g, " ").slice(0, 60) });
  });
  return out;
};
