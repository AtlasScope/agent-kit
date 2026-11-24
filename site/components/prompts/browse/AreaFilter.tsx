"use client";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Narrow an area's list by what an entry does to your project ("Changes nothing", "Changes code", ...). The full
// list is in the page's HTML; this only hides rows, so the page reads and indexes the same without JavaScript.
// The address is the source of truth (?does=...), so a filtered list can be shared or reopened, and following a
// plain link to the same page clears the filter.
export function AreaFilter({ listId, options, total }: { listId: string; options: { label: string; n: number }[]; total: number }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const fromUrl = params.get("does");
  const urlPick = fromUrl && options.some((o) => o.label === fromUrl) ? fromUrl : null;
  const [pick, setPick] = useState<string | null>(urlPick);

  // Follow the address when it changes from outside (a link, back and forward).
  useEffect(() => setPick(urlPick), [urlPick]);

  useEffect(() => {
    const list = document.getElementById(listId);
    if (!list) return;
    for (const li of list.querySelectorAll<HTMLElement>(".prows > li")) li.hidden = Boolean(pick) && li.dataset.mode !== pick;
  }, [pick, listId]);

  const choose = (next: string | null) => {
    setPick(next);
    const q = new URLSearchParams(params.toString());
    if (next) q.set("does", next); else q.delete("does");
    const s = q.toString();
    // A null state lets Next sync useSearchParams with the new address.
    window.history.replaceState(null, "", s ? `${pathname}?${s}` : pathname);
  };

  const shown = pick ? options.find((o) => o.label === pick)?.n ?? total : total;
  return (
    <>
      <p className="lib__count" aria-live="polite">{pick ? `${shown} of ${total} prompts` : `${total} ${total === 1 ? "prompt" : "prompts"}`}</p>
      <div className="afilter" role="group" aria-label="Show prompts by what they change">
        <button type="button" className="afilter__b" aria-pressed={!pick} onClick={() => choose(null)}>
          All <span className="afilter__n">{total}</span>
        </button>
        {options.map((o) => (
          <button key={o.label} type="button" className="afilter__b" aria-pressed={pick === o.label} onClick={() => choose(pick === o.label ? null : o.label)}>
            {o.label} <span className="afilter__n">{o.n}</span>
          </button>
        ))}
      </div>
    </>
  );
}
