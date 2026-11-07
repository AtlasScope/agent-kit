import { useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { useStore } from '../../store/StoreContext';
import { findWorkOrder } from '../../lib/lookup';
import { normaliseId } from '../../lib/ids';
import { SPEND_APPROVAL_THRESHOLD, can, needsSpendApproval } from '../../lib/permissions';
import { CATEGORY_LABEL, formatMoney } from '../../lib/format';

export function AssignVendor() {
  const { state, dispatch, user } = useStore();
  const [woInput, setWoInput] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [quote, setQuote] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const wo = findWorkOrder(state, normaliseId(woInput));
  const candidates = wo ? state.vendors.filter((v) => v.trades.includes(wo.trade)) : state.vendors;
  const amount = Number(quote);
  const allowed = can(user.role, 'dispatch');

  const submit = () => {
    if (!wo || !vendorId || !quote) return;
    dispatch({ type: 'assignVendor', workOrderId: wo.id, vendorId, quoteAmount: amount, requestedBy: user.name });
    setResult(
      needsSpendApproval(amount)
        ? `${wo.id} sent for spend approval (${formatMoney(amount)}).`
        : `${wo.id} assigned. Schedule the visit from the work order.`,
    );
    setWoInput('');
    setVendorId('');
    setQuote('');
  };

  return (
    <>
      <PageHeader title="Assign Vendor" />
      <section className="card narrow">
        <label>
          Work order number
          <input value={woInput} onChange={(e) => setWoInput(e.target.value)} placeholder="WO-0000" />
        </label>
        {woInput && !wo && <p className="muted">No work order with that number.</p>}
        {wo && (
          <p className="muted">
            {CATEGORY_LABEL[wo.trade]} for {wo.requestId}
          </p>
        )}
        <label>
          Vendor
          <select value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
            <option value="">Choose…</option>
            {candidates.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
                {v.onPortal ? '' : ' (phone only)'}
              </option>
            ))}
          </select>
        </label>
        <label>
          Quote (USD)
          <input type="number" min={0} value={quote} onChange={(e) => setQuote(e.target.value)} />
        </label>
        {needsSpendApproval(amount) && (
          <p className="notice">Over {formatMoney(SPEND_APPROVAL_THRESHOLD)}: this goes to Approvals first.</p>
        )}
        <button type="button" className="primary" onClick={submit} disabled={!allowed || !wo || !vendorId || !quote}>
          Assign
        </button>
        {result && <p className="notice">{result}</p>}
      </section>
    </>
  );
}
