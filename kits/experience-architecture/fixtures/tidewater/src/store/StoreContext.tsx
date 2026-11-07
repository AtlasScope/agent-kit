import { createContext, useContext, useMemo, useReducer, useState, type ReactNode } from 'react';
import type { StaffUser } from '../types';
import { STAFF } from '../data/seed';
import { initialState, reducer, type Action, type StoreState } from './reducer';

interface StoreValue {
  state: StoreState;
  dispatch: (action: Action) => void;
  user: StaffUser;
  setUser: (name: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [userName, setUserName] = useState(STAFF[0].name);
  const user = STAFF.find((s) => s.name === userName) ?? STAFF[0];

  const value = useMemo(() => ({ state, dispatch, user, setUser: setUserName }), [state, user]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
