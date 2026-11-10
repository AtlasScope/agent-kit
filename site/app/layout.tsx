import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Nav, Footer } from "@/components/Nav";
import { SITE, authEnabled } from "@/lib/site";
import { counts } from "@/lib/content";
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
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: [{ media: "(prefers-color-scheme: light)", color: "#ECEAE4" }, { media: "(prefers-color-scheme: dark)", color: "#0B0C12" }], colorScheme: "light dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const body = (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable} ${display.variable}`}>
      <body>
        <Nav />
        <div className="container">
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
  return authEnabled() ? <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-in" appearance={{ variables: { colorPrimary: "#0B0C12" } }}>{body}</ClerkProvider> : body;
}
