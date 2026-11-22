// Paste this whole file into a browser tool's JavaScript runner, on the page being studied.
// It reads what is painted and returns plain data. It changes nothing on the page and sends nothing.
// It never reads what is typed into fields, and masks email addresses and long numbers in text samples.
(() => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const cache = new Map();
  // Computed colours can be rgb, oklch, lab or color(). A pixel settles all of them.
  const read = (value) => {
    if (!value || value === "transparent") return null;
    if (cache.has(value)) return cache.get(value);
    let out = null;
    if (CSS.supports("color", value)) {
      ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = value; ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      if (a) out = { rgb: [r, g, b], a: a / 255 };
    }
    cache.set(value, out);
    return out;
  };
  const hex = (rgb) => "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
  const over = (top, under) => (top ? top.rgb.map((v, i) => v * top.a + under[i] * (1 - top.a)) : under);
  const canvasColor = read(getComputedStyle(document.documentElement).colorScheme.startsWith("dark") ? "#121212" : "#FFFFFF").rgb;
  const behind = new Map();
  const backdrop = (el) => {
    if (!el) return canvasColor;
    if (behind.has(el)) return behind.get(el);
    const under = el === document.documentElement ? over(read(getComputedStyle(document.body || el).backgroundColor), canvasColor) : backdrop(el.parentElement);
    const out = over(read(getComputedStyle(el).backgroundColor), under);
    behind.set(el, out);
    return out;
  };

  const maps = { backgrounds: new Map(), text: new Map(), edges: new Map(), fonts: new Map() };
  const add = (map, key, n) => map.set(key, (map.get(key) || 0) + n);
  const tidy = (s) => (s || "").trim().replace(/\s+/g, " ").replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]").replace(/\d{6,}/g, "[number]").slice(0, 70);
  const pieces = [], seen = new Set();

  for (const el of Array.from(document.querySelectorAll("body, body *")).slice(0, 8000)) {
    if (/^(script|style|template|noscript|option)$/i.test(el.tagName)) continue;
    const s = getComputedStyle(el), box = el.getBoundingClientRect();
    if (box.width < 1 || box.height < 1 || s.visibility === "hidden" || +s.opacity === 0) continue;
    const bg = read(s.backgroundColor), ground = backdrop(el);
    if (bg) add(maps.backgrounds, hex(ground), Math.round(Math.min(box.width, innerWidth) * Math.min(box.height, innerHeight * 4)));
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(" ").trim();
    const ink = read(s.color);
    if (own && ink) {
      add(maps.text, `${hex(over(ink, ground))} on ${hex(ground)}`, own.length);
      add(maps.fonts, `${s.fontFamily.split(",")[0].replace(/["']/g, "")} ${s.fontWeight}`, own.length);
    }
    const edge = parseFloat(s.borderBottomWidth) ? read(s.borderBottomColor) : parseFloat(s.borderTopWidth) ? read(s.borderTopColor) : null;
    if (edge) add(maps.edges, hex(over(edge, ground)), Math.round(box.width));

    const kind = el.matches("header, [role=banner]") ? "header" : el.matches("h1, h2") ? "heading"
      : el.matches("button, [role=button], input[type=submit], a[class*=btn i], a[class*=button i]") ? "button"
      : el.matches("input:not([type=hidden]), textarea, select") ? "field"
      : el.matches("pre, code") ? "code" : el.matches("nav a") ? "nav link" : el.matches("a") ? "link"
      : el.matches("article, [class*=card i], li[class]") ? "card" : null;
    if (!kind) continue;
    const key = [kind, s.backgroundColor, s.color, s.borderBottomColor, s.borderRadius].join();
    if (seen.has(key) || pieces.filter((p) => p.kind === kind).length >= 4) continue;
    seen.add(key);
    pieces.push({
      kind,
      text: kind === "field" ? tidy(el.getAttribute("placeholder")) : tidy(el.innerText),
      color: ink && hex(over(ink, ground)), background: hex(ground), border: edge && hex(over(edge, ground)),
      radius: s.borderRadius, font: `${s.fontWeight} ${s.fontSize} ${s.fontFamily.split(",")[0]}`,
      padding: s.padding, shadow: s.boxShadow === "none" ? null : s.boxShadow.slice(0, 120), size: [Math.round(box.width), Math.round(box.height)],
    });
  }

  const tokens = [];
  let unreadableSheets = 0;
  const rules = (list, scope) => {
    for (const r of list) {
      if (r.style) {
        for (const name of r.style) {
          if (!name.startsWith("--") || name.startsWith("--tw-") || tokens.length >= 200) continue;
          const value = r.style.getPropertyValue(name).trim();
          const color = read(value) || (/^[\d.]+\s+[\d.]+%\s+[\d.]+%$/.test(value) ? read(`hsl(${value})`) : null);
          if (color) tokens.push({ name, value, hex: hex(color.rgb), scope: `${scope} ${r.selectorText}`.trim() });
        }
      }
      if (r.cssRules?.length) rules(r.cssRules, r.media ? `${scope} @media ${r.media.mediaText}`.trim() : scope);
    }
  };
  for (const sheet of document.styleSheets) { try { rules(sheet.cssRules, ""); } catch { unreadableSheets++; } }

  const top = (map, n) => [...map].sort((a, b) => b[1] - a[1]).slice(0, n).map(([value, weight]) => ({ value, weight }));
  return {
    page: location.origin + location.pathname, title: tidy(document.title),
    viewport: [innerWidth, innerHeight], prefers: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    backgrounds: top(maps.backgrounds, 16), text: top(maps.text, 24), edges: top(maps.edges, 12), fonts: top(maps.fonts, 8),
    pieces, tokens, unreadableSheets,
  };
})();
