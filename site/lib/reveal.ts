export const REVEAL_KEY = "agent-kit:revealed";

// Runs before the hero paints: on a first visit this session, with motion allowed, hide the hero
// parts so the reveal can play. Without script, on repeat visits and with reduced motion, the final hero shows as is.
export const revealBootScript = `try{if(sessionStorage.getItem("${REVEAL_KEY}")!=="1"&&!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("js-reveal")}catch(e){}`;

