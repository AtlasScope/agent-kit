import { MODES, type Prompt } from "@/lib/content";

// What running an entry does to the visitor's project, in the library's own words. Cards, rows and the area
// filter all read it from here so the label and the filter can never disagree.
export const modeOf = (p: Prompt) => (p.mode ? (p.iso ? "Tests on a copy" : MODES[p.mode]) : p.dmode) || "";

// True when the entry may edit code, so its label is marked (not in the danger colour; see library.css).
export const marksChange = (p: Prompt) => Boolean((p.mode && p.mode !== "read") || p.dmode === "Changes code");
