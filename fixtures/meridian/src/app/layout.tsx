import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Meridian", template: "%s · Meridian" },
  description: "Shipment operations for logistics teams.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
