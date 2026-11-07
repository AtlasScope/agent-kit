'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

export function BackButton({ label = 'Close' }: { label?: string }) {
  const router = useRouter();
  return (
    <button type="button" onClick={() => router.back()}>
      {label}
    </button>
  );
}

export default function Modal({ children }: { children: ReactNode }) {
  return (
    <div className="overlay">
      <div className="dialog">
        <BackButton />
        {children}
      </div>
    </div>
  );
}
