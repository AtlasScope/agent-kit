'use client';
import { useState } from 'react';

// Templates remount on every navigation, so this dismissal never sticks.
export default function AppTemplate({ children }) {
  const [dismissed, setDismissed] = useState(false);
  return (
    <>
      {!dismissed && (
        <div className="banner" role="status">
          <span>New: quarterly billing is now available.</span>
          <button onClick={() => setDismissed(true)}>Dismiss</button>
        </div>
      )}
      {children}
    </>
  );
}
