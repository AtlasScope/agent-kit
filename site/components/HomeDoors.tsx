"use client";
import Link from "next/link";
import { useEffect } from "react";
import { loadMe, useMe } from "./Star";

// The middle door on the homepage: puts the cursor in the header search.
export function SearchDoor({ children }: { children: React.ReactNode }) {
  return (
    <button type="button" className="door__search" onClick={() => document.querySelector<HTMLInputElement>(".nav .search input")?.focus()}>
      {children}
    </button>
  );
}

// Signed in only: one line back to the visitor's collections, naming the latest three.
export function YourCollections() {
  const me = useMe();
  useEffect(() => { loadMe(); }, []);
  const names = (me?.signedIn && me.collections ? me.collections : []).slice(-3).map((c) => c.name);
  if (!names.length) return null;
  return <Link className="yours" href="/account"><strong>Your collections</strong><span>{names.join(", ")}</span></Link>;
}
