"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function BoardClock() {
  const router = useRouter();
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
    tick();
    const t = window.setInterval(tick, 15000);
    const r = window.setInterval(() => router.refresh(), 30000);
    return () => {
      window.clearInterval(t);
      window.clearInterval(r);
    };
  }, [router]);
  return <span className="clock">{now}</span>;
}
