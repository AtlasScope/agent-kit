// Shared by the Collections workspace (client) and the page that renders it (server).
export const KEY = "agent-kit:collection";

// Picks the open collection before the first paint, so a link to #<id> or the remembered collection never
// flashes the first one. Kept tiny and dependency-free because it runs inline. Mirrors pick() in Workspace.tsx.
// The choice is written to <html> (data-ws-sel, data-ws-view), not to the workspace element, because React
// re-creates attributes it doesn't own on its own elements during hydration, which would flash the first one.
export const BOOT = `(function(){var w=document.getElementById("ws");if(!w)return;var d=document.documentElement;var ids=(w.getAttribute("data-ids")||"").split(" ");var h="";try{h=decodeURIComponent(location.hash.slice(1))}catch(e){}var r=null;try{r=localStorage.getItem("${KEY}")}catch(e){}var hit=ids.indexOf(h)>=0;d.setAttribute("data-ws-sel",hit?h:ids.indexOf(r)>=0?r:ids[0]);d.setAttribute("data-ws-view",hit?"detail":"list")})()`;

// One rule per collection: show its panel and mark its rail row when it is the open one.
export const selectionCss = (ids: string[]) =>
  ids.map((id) => `:root[data-ws-sel="${id}"] .ws [data-col="${id}"]{display:grid}:root[data-ws-sel="${id}"] .ws [data-for="${id}"]{--on:1}`).join("");
