import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { IdSearch } from '../../components/IdSearch';
import { Pill } from '../../components/Pill';
import { useStore } from '../../store/StoreContext';
import { CATEGORY_LABEL, WO_STATUS_LABEL, formatDate, formatMoney } from '../../lib/format';
import { vendorName } from '../../lib/lookup';
import { normaliseId } from '../../lib/ids';
import type { WorkOrderStatus } from '../../types';

const COLUMNS: WorkOrderStatus[] = ['unassigned', 'awaiting_approval', 'assigned', 'scheduled', 'on_site'];

export function DispatchBoard() {
  const { state } = useStore();
  const [query, setQuery] = useState('');
  const [showDone, setShowDone] = useState(false);

  const list = useMemo(() => {
    const q = normaliseId(query);
    return state.workOrders
      .filter((w) => showDone || w.status !== 'done')
      .filter((w) => !q || w.id.includes(q) || w.requestId.includes(q));
  }, [state.workOrders, query, showDone]);

  const statuses: WorkOrderStatus[] = showDone ? [...COLUMNS, 'done'] : COLUMNS;

  return (
    <>
      <PageHeader
        title="Dispatch"
        subtitle="Open work orders by status. Assign vendors from Assign Vendor; vendor progress comes in through Vendor Portal Sync."
        actions={<Link to="/dispatch/assign">Assign Vendor →</Link>}
      />
      <div className="toolbar">
        <IdSearch value={query} onChange={setQuery} placeholder="Find WO or REQ number" />
        <label className="inline">
          <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> Show done
        </label>
      </div>
      <div className="board">
        {statuses.map((status) => {
          const items = list.filter((w) => w.status === status);
          return (
            <section key={status} className="board-col">
              <h2>
                {WO_STATUS_LABEL[status]} <span className="count">{items.length}</span>
              </h2>
              {items.map((w) => (
                <Link key={w.id} to={`/dispatch/${w.id}`} className="board-card">
                  <strong>{w.id}</strong>
                  <span className="muted">for {w.requestId}</span>
                  <span>{CATEGORY_LABEL[w.trade]}</span>
                  <span>{vendorName(state, w.vendorId)}</span>
                  {w.scheduledFor && (
                    <span>
                      {formatDate(w.scheduledFor)} · {w.arrivalWindow}
                    </span>
                  )}
                  {w.quoteAmount !== null && <Pill>{formatMoney(w.quoteAmount)}</Pill>}
                </Link>
              ))}
            </section>
          );
        })}
      </div>
    </>
  );
}
