// Shared by the Collections workspace (client) and the page that renders it (server).
export const KEY = "agent-kit:collection";

// Picks the open collection before the first paint, so a link to #<id> or the remembered collection never
// flashes the first one. Kept tiny and dependency-free because it runs inline. Mirrors pick() in Workspace.tsx.
// The choice is written to <html> (data-ws-sel, data-ws-view), not to the workspace element, because React
// re-creates attributes it doesn't own on its own elements during hydration, which would flash the first one.
export const BOOT = `(function(){var w=document.getElementById("ws");if(!w)return;var d=document.documentElement;var ids=(w.getAttribute("data-ids")||"").split(" ");var h="";try{h=decodeURIComponent(location.hash.slice(1))}catch(e){}var r=null;try{r=localStorage.getItem("${KEY}")}catch(e){}var hit=ids.indexOf(h)>=0;d.setAttribute("data-ws-sel",hit?h:ids.indexOf(r)>=0?r:ids[0]);d.setAttribute("data-ws-view",hit?"detail":"list")})()`;

// One rule per collection: show its panel and mark its rail row when it is the open one.
// Then the page's one lit action: New collection is the satin pill unless the open collection's combined install is
// on screen beside it (a computer, where the rail and the panel show together); then New collection is quiet and the
// install's Copy is the lit one. On a phone the list and the panel never show together, so each keeps its own.
// The quiet state matches a plain small .btn, including its hover. Relies on :has(), like the rest of the site.
const QUIET = "--lift:0;border:1px solid var(--c-line-2);border-radius:var(--radius-sm);padding-inline:var(--space-3);background:var(--c-surface);color:var(--c-fg);box-shadow:var(--shadow-1);filter:none;font-weight:var(--weight-medium);letter-spacing:-0.005em";
const QUIET_HOVER = "background:var(--c-raised);border-color:var(--c-edge)";
export const selectionCss = (ids: string[]) => {
  const show = ids.map((id) => `:root[data-ws-sel="${id}"] .ws [data-col="${id}"]{display:grid}:root[data-ws-sel="${id}"] .ws [data-for="${id}"]{--on:1}`).join("");
  const quiet = [
    ...ids.map((id) => `:root[data-ws-sel="${id}"] .ws:has([data-col="${id}"] .cpanel__install) .ws__new.btn--brand`),
    `:root:not([data-ws-sel]) .ws:has(.ws__panel:first-child .cpanel__install) .ws__new.btn--brand`,
  ];
  const hover = quiet.map((s) => `${s}:hover`).join(",");
  // The exact complement of the phone layout's (max-width: 60rem), so no width shows both pills.
  return `${show}@media not all and (max-width:60rem){${quiet.join(",")}{${QUIET}}@media (hover:hover) and (pointer:fine){${hover}{${QUIET_HOVER}}}}`;
};
