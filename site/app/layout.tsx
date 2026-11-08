import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Nav, Footer } from "@/components/Nav";
import { SITE, authEnabled } from "@/lib/site";
import { counts } from "@/lib/content";
import "./globals.css";

const serif = Instrument_Serif({ weight: "400", subsets: ["latin"], variable: "--font-instrument", display: "swap" });
const sans = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} ${SITE.byline}`, template: `%s · ${SITE.name}` },
  description: `${counts.skills} skills and ${counts.prompts} prompts for Claude Code, Codex, Cursor and any agent that reads Agent Skills.`,
  openGraph: { siteName: SITE.name, type: "website" },
  alternates: { types: { "text/markdown": "/index.md" } },
};

// viewport-fit=cover lets the page run under the notch in landscape; the container pads back with safe-area insets.
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#050506", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const body = (
    <html lang="en" suppressHydrationWarning className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <div className="container">
          <Nav />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
  return authEnabled() ? <ClerkProvider appearance={{ variables: { colorPrimary: "#f3f3f5" } }}>{body}</ClerkProvider> : body;
}
