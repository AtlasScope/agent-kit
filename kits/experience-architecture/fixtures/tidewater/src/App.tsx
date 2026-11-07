import { Navigate, Route, Routes } from 'react-router-dom';
import { StaffLayout } from './components/StaffLayout';
import { IntakeList } from './pages/intake/IntakeList';
import { IntakeDetail } from './pages/intake/IntakeDetail';
import { DispatchBoard } from './pages/dispatch/DispatchBoard';
import { WorkOrderDetail } from './pages/dispatch/WorkOrderDetail';
import { AssignVendor } from './pages/dispatch/AssignVendor';
import { VendorSync } from './pages/vendor/VendorSync';
import { VendorJobDetail } from './pages/vendor/VendorJobDetail';
import { TenantComms } from './pages/tenant/TenantComms';
import { BillingExport } from './pages/billing/BillingExport';
import { Approvals } from './pages/approvals/Approvals';
import { OverviewBeta } from './pages/OverviewBeta';
import { TenantStatus } from './pages/status/TenantStatus';
import { NotFound } from './pages/NotFound';

export function App() {
  return (
    <Routes>
      <Route path="/status/:token" element={<TenantStatus />} />
      <Route element={<StaffLayout />}>
        <Route index element={<Navigate to="/intake" replace />} />
        <Route path="intake" element={<IntakeList />} />
        <Route path="intake/:requestId" element={<IntakeDetail />} />
        <Route path="dispatch" element={<DispatchBoard />} />
        <Route path="dispatch/assign" element={<AssignVendor />} />
        <Route path="dispatch/:workOrderId" element={<WorkOrderDetail />} />
        <Route path="vendor-sync" element={<VendorSync />} />
        <Route path="vendor-sync/:jobId" element={<VendorJobDetail />} />
        <Route path="tenant-comms" element={<TenantComms />} />
        <Route path="billing-export" element={<BillingExport />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="overview-beta" element={<OverviewBeta />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
