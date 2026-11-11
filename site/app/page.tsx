import { HERO_BLUR } from "@/lib/hero-blur";
import { JsonLd } from "@/components/Crumbs";
import { HERO, SITE } from "@/lib/site";
import { LaunchHero } from "@/components/LaunchHero";
import "./launch.css";

// One screen and nothing below it: the hero, whose Install button opens /install. The footer is hidden here
// (globals.css); its links are in the header and on every other page.
export default function Home() {
  return (
    <main className="home">
      <LaunchHero headline={HERO.headline} blur={HERO_BLUR} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: "AtlasScope", url: SITE.url, sameAs: [SITE.repo] }} />
    </main>
  );
}
