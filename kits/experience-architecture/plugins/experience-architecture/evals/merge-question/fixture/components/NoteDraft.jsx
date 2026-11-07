'use client';
import { createContext, useContext, useState } from 'react';

const DraftContext = createContext(null);
export function useNoteDraft() { return useContext(DraftContext); }

export function NoteDraftProvider({ children }) {
  const [draft, setDraft] = useState('');
  return <DraftContext.Provider value={{ draft, setDraft }}>{children}</DraftContext.Provider>;
}
