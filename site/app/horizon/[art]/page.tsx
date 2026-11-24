import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LaunchHero } from "@/components/LaunchHero";
import { DIRECTIONS } from "@/components/horizon/stage";
import { HERO } from "@/lib/site";
import "../../launch.css";

// Experimental: the real homepage with one of the horizon directions behind it. Not linked from the site and not
// indexed. `orbit` is the scene the homepage ships today, for comparison on the same page.
export const metadata: Metadata = { title: "Horizon experiment", robots: { index: false, follow: false } };
export const generateStaticParams = () => [...Object.keys(DIRECTIONS), "orbit"].map((art) => ({ art }));

export default async function Page({ params }: { params: Promise<{ art: string }> }) {
  const { art } = await params;
  if (art !== "orbit" && !DIRECTIONS[art]) notFound();
  return (
    <main className="home">
      <LaunchHero headline={HERO.headline} blur="" art={art === "orbit" ? undefined : art} />
    </main>
  );
}
