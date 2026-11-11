"use client";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/app/account/actions";

// A form for one account action. It shows the action's error beside the form, clears and closes its
// panel when the action succeeds, and its Submit button reads as busy while the action runs.
export function ActionForm({ action, className, children, reset }: {
  action: (s: ActionState, f: FormData) => Promise<ActionState>; className?: string; children: React.ReactNode; reset?: boolean;
}) {
  const [state, run] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!state?.ok) return;
    if (reset) ref.current?.reset();
    ref.current?.closest("details")?.removeAttribute("open");
  }, [state, reset]);
  return (
    <form ref={ref} action={run} className={className}>
      {children}
      <p className="form-err" aria-live="polite">{state?.error ?? ""}</p>
    </form>
  );
}

export function Submit({ children, busy, className = "btn btn--sm", label }: { children: React.ReactNode; busy: string; className?: string; label?: string }) {
  const { pending } = useFormStatus();
  return <button className={className} type="submit" disabled={pending} aria-label={label}>{pending ? busy : children}</button>;
}
