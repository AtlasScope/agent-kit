import type { ReactNode } from "react";

export default function KioskLayout({ children }: { children: ReactNode }) {
  return <div className="kiosk">{children}</div>;
}
