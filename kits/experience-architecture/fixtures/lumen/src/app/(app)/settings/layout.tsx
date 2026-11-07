import type { ReactNode } from 'react';
import SettingsNav from '~/components/SettingsNav';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <h1>Settings</h1>
      <SettingsNav />
      {children}
    </>
  );
}
