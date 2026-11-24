import type { Viewport } from "next";
import { JsonLd } from "@/components/Crumbs";
import { SITE } from "@/lib/site";
import { HomeHero } from "@/components/stage/HomeHero";

// Always dark, so the browser's own bar matches it in both themes.
export const viewport: Viewport = { themeColor: "#000000", colorScheme: "dark" };

// One screen and nothing below it: a headline, one line and Install, over the view from orbit the layout holds.
// The footer is hidden here (shell.css); the hero carries About, Privacy, Terms and Credits at its foot instead.
export default function Home() {
  return (
    <main className="home">
      <HomeHero />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: "AtlasScope", url: SITE.url, sameAs: [SITE.repo] }} />
    </main>
  );
}
