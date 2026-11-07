"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="dialog-backdrop">
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">{title}</h2>
        <div className="dialog-body">{children}</div>
        <div className="dialog-actions">
          <button type="button" className="btn ghost" ref={cancelRef} onClick={onCancel}>Keep it</button>
          <button type="button" className={danger ? "btn danger" : "btn primary"} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
