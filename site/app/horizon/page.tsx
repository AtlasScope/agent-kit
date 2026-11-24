import type { Metadata } from "next";
import Link from "next/link";
import { DIRECTIONS } from "@/components/horizon/stage";

// Experimental: the list of horizon directions, each opening the real homepage with that scene behind it.
export const metadata: Metadata = { title: "Horizon experiments", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <main className="doc" style={{ maxWidth: "46rem", marginInline: "auto", padding: "64px 0 96px" }}>
      <h1 style={{ fontSize: "2rem", letterSpacing: "-0.03em", margin: "0 0 12px" }}>Horizon experiments</h1>
      <p style={{ color: "var(--color-muted)", margin: "0 0 32px", lineHeight: 1.55 }}>
        The homepage with a different view from orbit behind it. Every view is built from the real planet: cloud as NASA&rsquo;s VIIRS instrument saw it on 22 November 2026, Blue Marble land and sea, Black Marble city lights, and air whose colour is computed. Nothing is live, and the cloud&rsquo;s movement is simulated. Not linked from the site.
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 20 }}>
        {Object.entries(DIRECTIONS).map(([key, direction]) => (
          <li key={key}>
            <Link href={`/horizon/${key}`} style={{ fontWeight: 600 }}>{direction.title}</Link>
            <p style={{ margin: "4px 0 0", color: "var(--color-muted)", lineHeight: 1.5 }}>{direction.note}</p>
          </li>
        ))}
        <li>
          <Link href="/horizon/visit" style={{ fontWeight: 600 }}>A visit</Link>
          <p style={{ margin: "4px 0 0", color: "var(--color-muted)", lineHeight: 1.5 }}>One of the curated views, chosen afresh each time the page is loaded.</p>
        </li>
        <li>
          <Link href="/horizon/about" style={{ fontWeight: 600 }}>About this view</Link>
          <p style={{ margin: "4px 0 0", color: "var(--color-muted)", lineHeight: 1.5 }}>What is observed, what is simulated, and where each part comes from.</p>
        </li>
        <li>
          <Link href="/horizon/orbit" style={{ fontWeight: 600 }}>The procedural planet</Link>
          <p style={{ margin: "4px 0 0", color: "var(--color-muted)", lineHeight: 1.5 }}>The scene drawn wholly from code in pull request 124, kept as the baseline.</p>
        </li>
      </ul>
    </main>
  );
}
