import { SettingsNav } from "./SettingsNav";

export default function OrgSettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <SettingsNav />
      {children}
    </div>
  );
}
