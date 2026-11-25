import type { Metadata } from "next";
import Link from "next/link";

// Experimental: what the horizon view is made of, for the discreet "About this view" link under it. The wording has
// to stay true to components/horizon/PRODUCTION.md: nothing here is live, and the page says which parts are measured.
export const metadata: Metadata = { title: "About this view", robots: { index: false, follow: false } };

const ROWS: [string, string, string][] = [
  ["Cloud", "Observed", "NASA VIIRS on the NOAA-20 satellite, true-colour imagery of 22 November 2026, through NASA GIBS."],
  ["Cloud-top height", "Observed, then smoothed", "NASA's retrieved cloud properties for the same satellite and day (the GIBS rendering of the CLDPROP product), for the South Pacific views only. Gaps are filled from the cloud beside them."],
  ["Land and sea colour", "Observed, composited", "NASA Blue Marble Next Generation, December 2004."],
  ["City lights", "Observed, composited", "NASA Black Marble, 2016."],
  ["Cloud movement", "Simulated", "The cloud map is carried along the long-term average wind for its latitude, about 150 times faster than life. No storm forms or fades."],
  ["Sunlight, moonlight, twilight colour, shadows", "Computed", "A model of how air and cloud scatter light. The sun and moon are where the almanac puts them for the scene's date."],
  ["The orbit and the camera", "Invented", "A circular orbit 1,800 km up, chosen for the view. It is no real spacecraft's."],
];

export default function Page() {
  const cell = { padding: "10px 12px 10px 0", verticalAlign: "top", borderTop: "1px solid var(--color-line, rgba(127,127,127,.25))", lineHeight: 1.5 } as const;
  return (
    <main className="doc" style={{ maxWidth: "46rem", marginInline: "auto", padding: "64px 0 96px" }}>
      <h1 style={{ fontSize: "2rem", letterSpacing: "-0.03em", margin: "0 0 12px" }}>About this view</h1>
      <p style={{ margin: "0 0 12px", lineHeight: 1.55 }}>
        Horizon is an artistic orbital reconstruction using historical satellite imagery, simulated atmospheric movement and computational lighting.
      </p>
      <p style={{ color: "var(--color-muted)", margin: "0 0 28px", lineHeight: 1.55 }}>
        It is not a live picture of the planet and not a photograph. The weather is that of one past day, and the way it moves on the page is a simulation.
      </p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9375rem" }}>
        <thead>
          <tr style={{ textAlign: "left" }}><th style={{ padding: "0 12px 8px 0" }}>Part</th><th style={{ padding: "0 12px 8px 0" }}>What it is</th><th style={{ padding: "0 0 8px" }}>Source</th></tr>
        </thead>
        <tbody>
          {ROWS.map(([part, kind, source]) => (
            <tr key={part}><td style={{ ...cell, fontWeight: 600 }}>{part}</td><td style={cell}>{kind}</td><td style={{ ...cell, paddingRight: 0, color: "var(--color-muted)" }}>{source}</td></tr>
          ))}
        </tbody>
      </table>
      <p style={{ color: "var(--color-muted)", margin: "28px 0 0", lineHeight: 1.55 }}>
        We acknowledge the use of imagery provided by services from NASA&rsquo;s Global Imagery Browse Services (GIBS), part of NASA&rsquo;s Earth Science Data and Information System (ESDIS). Blue Marble and Black Marble imagery by NASA Earth Observatory. NASA does not endorse Agent Kit.
      </p>
      <p style={{ margin: "20px 0 0" }}><Link href="/horizon">All the experimental views</Link></p>
    </main>
  );
}
