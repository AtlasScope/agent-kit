import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { CopyId } from '../../components/CopyId';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useStore } from '../../store/StoreContext';
import { invoiceForWorkOrder, vendorName } from '../../lib/lookup';
import { VENDOR_STATUS_LABEL, formatDateTime, formatMoney } from '../../lib/format';
import { can } from '../../lib/permissions';

export function VendorJobDetail() {
  const { jobId = '' } = useParams();
  const { state, dispatch, user } = useStore();
  // Confirmation lives in component state. Accepting releases the vendor's
  // invoice into tonight's AP export, and the portal re-sends completion
  // events, so a reload, a bookmark or a pasted link must never arrive with
  // the release step already open.
  const [confirming, setConfirming] = useState(false);

  const job = state.vendorJobs.find((j) => j.id === jobId);
  if (!job) {
    return (
      <>
        <PageHeader title="Portal job not found" />
        <p>
          No portal job <code>{jobId}</code>. <Link to="/vendor-sync">Back to Vendor Portal Sync</Link>
        </p>
      </>
    );
  }

  const invoice = invoiceForWorkOrder(state, job.workOrderId);
  const canAccept = can(user.role, 'accept_completion') && job.reportedStatus === 'completed' && !job.accepted;

  return (
    <>
      <PageHeader title={`${job.id} · ${vendorName(state, job.vendorId)}`} subtitle={VENDOR_STATUS_LABEL[job.reportedStatus]} />
      <section className="card">
        <dl className="facts">
          <dt>Portal job</dt>
          <dd>
            <CopyId id={job.id} />
          </dd>
          <dt>Work order</dt>
          <dd>
            <CopyId id={job.workOrderId} />
          </dd>
          <dt>Last synced</dt>
          <dd>{formatDateTime(job.lastSyncedAt)}</dd>
          <dt>Vendor completed</dt>
          <dd>{formatDateTime(job.completedAt)}</dd>
          <dt>Photos</dt>
          <dd>{job.photoCount}</dd>
          <dt>Invoice</dt>
          <dd>{invoice ? `${invoice.id} · ${formatMoney(invoice.amount)}` : 'Not received'}</dd>
        </dl>
        <h2>Vendor note</h2>
        <p className="details">{job.completionNote ?? 'No note yet.'}</p>
        {job.accepted ? (
          <p className="notice">Completion accepted.</p>
        ) : (
          <button type="button" className="primary" disabled={!canAccept} onClick={() => setConfirming(true)}>
            Accept completion
          </button>
        )}
      </section>
      <ConfirmDialog
        open={confirming}
        title={`Accept completion of ${job.workOrderId}?`}
        confirmLabel="Accept and release invoice"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          dispatch({ type: 'acceptCompletion', jobId: job.id });
          setConfirming(false);
        }}
      >
        <p>
          This closes the work order and moves {invoice ? invoice.id : 'the invoice'} to Ready for export. Accounting
          picks up the export at 6pm and payment cannot be pulled back from Tidewater after that.
        </p>
      </ConfirmDialog>
    </>
  );
}
