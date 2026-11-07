import { AccountNav } from "./AccountNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="content">
      <Breadcrumbs />
      <h1 style={{ marginBottom: 14 }}>Your account</h1>
      <AccountNav />
      {children}
    </div>
  );
}
