import { useMemo, useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { IdSearch } from '../../components/IdSearch';
import { Pill } from '../../components/Pill';
import { useStore } from '../../store/StoreContext';
import { formatDate, formatDateTime, formatMoney } from '../../lib/format';
import { vendorName } from '../../lib/lookup';
import { normaliseId } from '../../lib/ids';
import { can } from '../../lib/permissions';
import type { Invoice, InvoiceStatus } from '../../types';

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  awaiting_completion: 'Waiting for completion sign-off',
  ready: 'Ready for export',
  exported: 'Exported',
};

function toCsv(rows: Invoice[], vendor: (id: string) => string): string {
  const header = 'invoice_id,work_order,vendor,amount,gl_code,received';
  const lines = rows.map((r) =>
    [r.id, r.workOrderId, `"${vendor(r.vendorId)}"`, r.amount.toFixed(2), r.glCode, r.receivedAt.slice(0, 10)].join(','),
  );
  return [header, ...lines].join('\n');
}

export function BillingExport() {
  const { state, dispatch, user } = useStore();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<InvoiceStatus | 'all'>('all');
  const [csv, setCsv] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = normaliseId(query);
    return state.invoices
      .filter((i) => status === 'all' || i.status === status)
      .filter((i) => !q || i.id.includes(q) || i.workOrderId.includes(q));
  }, [state.invoices, query, status]);

  const ready = state.invoices.filter((i) => i.status === 'ready');
  const total = ready.reduce((sum, i) => sum + i.amount, 0);

  const buildExport = () => {
    setCsv(toCsv(ready, (id) => vendorName(state, id)));
    dispatch({ type: 'exportInvoices', invoiceIds: ready.map((i) => i.id) });
  };

  return (
    <>
      <PageHeader
        title="Billing Export"
        subtitle="Vendor invoices waiting to go to accounts payable. The export file is picked up at 6pm each weekday."
        actions={
          <button type="button" className="primary" onClick={buildExport} disabled={!ready.length || !can(user.role, 'export_billing')}>
            Build export ({ready.length} · {formatMoney(total)})
          </button>
        }
      />
      <div className="toolbar">
        <IdSearch value={query} onChange={setQuery} placeholder="Find INV or WO number" />
        <select value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus | 'all')} aria-label="Status">
          <option value="all">All invoices</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <table className="grid">
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Work order</th>
            <th>Vendor</th>
            <th>Amount</th>
            <th>GL code</th>
            <th>Received</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((i) => (
            <tr key={i.id}>
              <td>
                <code>{i.id}</code>
              </td>
              <td>
                <code>{i.workOrderId}</code>
              </td>
              <td>{vendorName(state, i.vendorId)}</td>
              <td>{formatMoney(i.amount)}</td>
              <td>{i.glCode}</td>
              <td>{formatDate(i.receivedAt)}</td>
              <td>
                <Pill tone={i.status === 'ready' ? 'good' : i.status === 'exported' ? 'neutral' : 'warn'}>
                  {i.status === 'exported' ? `Exported ${formatDateTime(i.exportedAt)}` : STATUS_LABEL[i.status]}
                </Pill>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {csv && (
        <section className="card">
          <h2>Export file</h2>
          <pre className="csv">{csv}</pre>
        </section>
      )}
    </>
  );
}
