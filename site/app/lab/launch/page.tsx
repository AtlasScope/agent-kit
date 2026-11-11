import type { Metadata } from "next";
import { InstallRail } from "@/components/InstallRail";
import { LaunchHero } from "@/components/LaunchHero";
import { HERO_BLUR } from "@/lib/hero-blur";
import { HERO, KITS } from "@/lib/site";
import { counts } from "@/lib/content";
import "./launch.css";

// Prototype of the new homepage opening. Not linked from anywhere and kept out of search results.
export const metadata: Metadata = { title: "Launch prototype", robots: { index: false, follow: false } };

export default function LaunchLab() {
  return (
    <main className="home">
      <LaunchHero headline={HERO.headline} skills={counts.skills} prompts={counts.prompts} kits={KITS.length} blur={HERO_BLUR} />
      <div className="orbit__rail" id="install">
        <InstallRail />
      </div>
    </main>
  );
}
