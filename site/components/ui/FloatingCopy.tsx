"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import { CopyButton } from "@/components/CopyButton";

// :focus-visible where supported (it throws on older Safari); otherwise any focus counts as keyboard focus.
const keyboard = (el: Element) => { try { return el.matches(":focus-visible"); } catch { return true; } };

const TABBABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

// A compact Copy bar that appears once a panel's own Copy has scrolled up behind the header, so the reader can still
// copy from further down the page. Under the header on a computer, along the bottom on a phone (40rem and down).
// `anchor` is the element whose top edge marks "scrolled away", usually the panel's own Copy button or its row: the bar
// shows at the first pixel the anchor slides under the header, so one of the two Copy buttons can always be pressed.
// `end` (optional) is where the bar stops being relevant: once its bottom edge is behind the header too, the bar hides.
// `target` (optional) is the element holding the text. If the clipboard refuses a press of the bar's Copy, the page
// scrolls the target (or the anchor) back into view, selects the target's text so Cmd/Ctrl+C finishes the job, and
// moves focus there (to the anchor's first control, or the anchor, without a target). The bar stays up while its
// "Copied" or "Copy blocked" message shows, and while keyboard focus is in it.
// Render all refs in the same commit as the bar (they are read on mount). Pass `name` so the two Copy buttons are told
// apart by a screen reader, for example "Copy the install command".
// The bar is inert while hidden so it takes no focus. Styles: .fcopy in app/styles/primitives.css.
export function FloatingCopy({ anchor, end, target, text, title, detail, name, label = "Copy" }: {
  anchor: RefObject<HTMLElement | null>; end?: RefObject<HTMLElement | null>; target?: RefObject<HTMLElement | null>;
  text: string; title: string; detail?: string; name?: string; label?: string;
}) {
  const [away, setAway] = useState(false);
  const [held, setHeld] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  // The bar stays up while keyboard focus is inside it, so it never goes inert under a keyboard user. Pointer focus
  // (a click or tap) doesn't hold it, so it still hides past `end` or once the panel is back. A blur caused by the
  // window losing focus doesn't count; when the window regains focus the bar checks again.
  const [hasFocus, setHasFocus] = useState(false);
  const shown = away || held || hasFocus;
  useEffect(() => {
    const el = anchor.current;
    if (!el) return;
    // Measured per frame on scroll and resize: the header's height changes between breakpoints.
    let raf = 0;
    const check = () => {
      raf = 0;
      const head = document.querySelector<HTMLElement>(".top");
      const line = head ? head.getBoundingClientRect().bottom : 0;
      const past = el.getBoundingClientRect().top < line - 1;
      const done = !!end?.current && end.current.getBoundingClientRect().bottom <= line + 1;
      setAway(past && !done);
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue);
    return () => { cancelAnimationFrame(raf); removeEventListener("scroll", queue); removeEventListener("resize", queue); };
  }, [anchor, end]);
  useEffect(() => {
    const again = () => setHasFocus(!!bar.current?.contains(document.activeElement) && keyboard(document.activeElement as Element));
    addEventListener("focus", again);
    return () => removeEventListener("focus", again);
  }, []);
  // Focus after a block: the target, else the anchor's first control, else the anchor. A tabindex added here is
  // removed again when focus leaves (or at once if focus did not take).
  const land = () => {
    const t = target?.current, a = anchor.current;
    const el = t || (a?.matches(TABBABLE) ? a : a?.querySelector<HTMLElement>(TABBABLE)) || a;
    // Never send focus somewhere a screen reader can't follow (an aria-hidden marker anchor); stay in the bar instead.
    if (!el || el.closest("[aria-hidden=true]")) return;
    el.focus({ preventScroll: true });
    if (document.activeElement === el || el.hasAttribute("tabindex")) return;
    // Not focusable as it stands (a <pre>, an <a> without href): make it focusable for this visit only.
    el.tabIndex = -1;
    el.focus({ preventScroll: true });
    if (document.activeElement === el) el.addEventListener("blur", () => el.removeAttribute("tabindex"), { once: true });
    else el.removeAttribute("tabindex");
  };
  // CopyButton's documented data-blocked, set afresh on each press: recover only for a block this bar's press caused.
  useEffect(() => {
    const b = bar.current?.querySelector("button");
    if (!b) return;
    // A press counts until its outcome (Copied or Copy blocked) arrives, however long the clipboard takes.
    let pressed = false;
    const press = () => { pressed = true; };
    const watch = new MutationObserver(() => {
      const blocked = b.hasAttribute("data-blocked"), copied = b.hasAttribute("data-copied");
      // A repeat press first resets to the plain label; the bar stays up from the press until its outcome has been shown.
      if (pressed && !blocked && !copied) return;
      setHeld(blocked || copied);
      const mine = pressed;
      pressed = false;
      if (!blocked || !mine) return;
      const t = target?.current;
      (t || anchor.current)?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      land();
      if (t) { const r = document.createRange(); r.selectNodeContents(t); const sel = getSelection(); sel?.removeAllRanges(); sel?.addRange(r); }
    });
    watch.observe(b, { attributes: true, attributeFilter: ["data-blocked", "data-copied"] });
    b.addEventListener("click", press);
    return () => { watch.disconnect(); b.removeEventListener("click", press); };
  }, [anchor, target]);
  return (
    <div className="fcopy" ref={bar} data-on={shown || undefined} inert={!shown}
      onFocus={(e) => setHasFocus(keyboard(e.target))}
      onKeyDown={() => setHasFocus(true)}
      onBlur={(e) => { const to = e.relatedTarget as Node | null; if (to ? !e.currentTarget.contains(to) : document.hasFocus()) setHasFocus(false); }}>
      <span className="fcopy__label">
        <span className="fcopy__title">{title}</span>
        {detail && <span className="fcopy__detail">{detail}</span>}
      </span>
      <CopyButton className="btn btn--sm btn--primary fcopy__copy" text={text} label={label} name={name} icon />
    </div>
  );
}
