import type { Metadata } from "next";
import { LaunchHero } from "@/components/LaunchHero";
import { CURATED } from "@/components/horizon/stage";
import { HERO } from "@/lib/site";
import "../../launch.css";

// Experimental: the homepage opening on one of the curated views, chosen afresh for each request. The choice is made
// on the server so the page arrives with the still that matches the view it will play. From there the scene runs on
// its own: the orbit carries the camera on and the light changes with it.
export const metadata: Metadata = { title: "Horizon experiment", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function Page() {
  const art = CURATED[Math.floor(Math.random() * CURATED.length)];
  return (
    <main className="home">
      <LaunchHero headline={HERO.headline} blur="" art={art} />
    </main>
  );
}
