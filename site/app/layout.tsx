import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SITE, authEnabled } from "@/lib/site";
import { counts } from "@/lib/content";
import { AuthGate } from "@/components/auth/AuthGate";
import { SIGNED_IN_HINT } from "@/lib/auth-hint";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const display = Montserrat({ subsets: ["latin"], weight: "600", variable: "--font-montserrat", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} ${SITE.byline}`, template: `%s · ${SITE.name}` },
  description: `${counts.skills} skills and ${counts.prompts} prompts for Claude Code, Codex, Cursor and any agent that reads Agent Skills.`,
  openGraph: { siteName: SITE.name, type: "website" },
  alternates: { types: { "text/markdown": "/index.md" } },
};

// viewport-fit=cover lets the page run under the notch in landscape; the container pads back with safe-area insets.
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0B0C12", colorScheme: "light dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable} ${display.variable}`}>
      {authEnabled() && <head><script dangerouslySetInnerHTML={{ __html: SIGNED_IN_HINT }} /></head>}
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <AuthGate>
          <Nav />
          <div className="container" id="main">
            {children}
            <Footer />
          </div>
        </AuthGate>
      </body>
    </html>
  );
}
