// Shared settings for the QA harness: devices, appearances and the route sample.
// Everything here is browser emulation. It is not a physical iPhone, iPad or Mac, and the Chromium
// projects are not Safari. Reports carry these labels so nobody mistakes one for the other.
import { devices } from "playwright";
import { STEPS } from "../../lib/start.ts";
import { LESSONS } from "../../lib/lessons.ts";

// Apple-first, then one non-Apple desktop so cross-platform regressions still show.
export const DEVICES = [
  { id: "macbook", label: "MacBook Retina 1440x900 @2x (emulated)", ctx: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, userAgent: devices["Desktop Safari"].userAgent } },
  { id: "ipad", label: "iPad Pro 11 portrait 834x1194 @2x (emulated)", ctx: { ...devices["iPad Pro 11"] } },
  { id: "iphone", label: "iPhone 15 Pro 393x659 @3x (emulated)", ctx: { ...devices["iPhone 15 Pro"] } },
  { id: "desktop", label: "Desktop 1280x800 @1x (emulated)", ctx: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 } },
];
for (const d of DEVICES) delete d.ctx.defaultBrowserType;

export const SCHEMES = ["light", "dark"];

// Touch-target floor from DESIGN-CONTRACT.md rule 6 (44px on coarse pointers).
export const TOUCH_MIN = 44;

// One or two pages per route family, picked from the built content so the sample follows the data.
// `data` is this checkout's content/generated.json, so run the harness from a checkout whose content matches the target.
export function routeSample(data) {
  const pick = (arr, fn) => arr.find(fn) || arr[0];
  const area = data.areas?.[0];
  const prompt = pick(data.prompts, (p) => p.id === "PG01");
  const recipe = pick(data.prompts, (p) => p.steps && !p.replacedBy);
  const command = pick(data.prompts, (p) => p.sec === "ecmd" && !p.replacedBy);
  const skill = pick(data.skills, (s) => s.name === "design");
  const kit = pick(data.kits, (k) => k.name === "design-kit");
  const fix = data.fixes?.[0];
  const step = STEPS[0], lesson = LESSONS[0];
  return [
    { path: "/", family: "home", owner: "Fable (home)" },
    { path: "/install", family: "install", owner: "W9" },
    { path: "/start", family: "guide", owner: "W8" },
    step && { path: `/start/${step.slug}`, family: "guide", owner: "W8" },
    { path: "/learn", family: "guide", owner: "W8" },
    lesson && { path: `/learn/${lesson.slug}`, family: "guide", owner: "W8" },
    { path: "/fix", family: "guide", owner: "W8" },
    fix && { path: `/fix/${fix.slug}`, family: "guide", owner: "W8" },
    { path: "/prompts", family: "prompts-browse", owner: "W4" },
    area && { path: `/prompts/${area.slug}`, family: "prompts-browse", owner: "W4" },
    { path: `/prompts/${prompt.slug}`, family: "prompt-detail", owner: "W5" },
    recipe && { path: `/prompts/${recipe.slug}`, family: "prompt-detail", owner: "W5" },
    command && { path: `/prompts/${command.slug}`, family: "prompt-detail", owner: "W5" },
    { path: "/skills", family: "skills-browse", owner: "W6" },
    { path: "/kits", family: "skills-browse", owner: "W6" },
    { path: `/skills/${skill.name}`, family: "skill-detail", owner: "W7" },
    { path: `/kits/${kit.name}`, family: "skill-detail", owner: "W7" },
    { path: "/mcp-setup", family: "utility", owner: "W10" },
    { path: "/about", family: "utility", owner: "W10" },
    { path: "/privacy", family: "utility", owner: "W10" },
    { path: "/terms", family: "utility", owner: "W10" },
    { path: "/this-page-does-not-exist", family: "utility", owner: "W2", status: 404 },
  ].filter(Boolean);
}

export const slugOf = (path) => (path === "/" ? "home" : path.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "_"));
