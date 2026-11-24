// Shared by the Collections workspace (client) and the page that renders it (server).
export const KEY = "agent-kit:collection";

// Picks the open collection before the first paint, so a link to #<id> or the remembered collection never
// flashes the first one. Kept tiny and dependency-free because it runs inline. Mirrors pick() in Workspace.tsx.
export const BOOT = `(function(){var w=document.getElementById("ws");if(!w)return;var ids=(w.getAttribute("data-ids")||"").split(" ");var h=decodeURIComponent(location.hash.slice(1));var r=null;try{r=localStorage.getItem("${KEY}")}catch(e){}var hit=ids.indexOf(h)>=0;w.setAttribute("data-sel",hit?h:ids.indexOf(r)>=0?r:ids[0]);w.setAttribute("data-view",hit?"detail":"list")})()`;

// One rule per collection: show its panel and mark its rail row when it is the open one.
export const selectionCss = (ids: string[]) =>
  ids.map((id) => `.ws[data-sel="${id}"] [data-col="${id}"]{display:grid}.ws[data-sel="${id}"] [data-for="${id}"]{--on:1}`).join("");
