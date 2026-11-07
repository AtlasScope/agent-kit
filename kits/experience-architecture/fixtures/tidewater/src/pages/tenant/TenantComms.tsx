import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { IdSearch } from '../../components/IdSearch';
import { useStore } from '../../store/StoreContext';
import { findRequest } from '../../lib/lookup';
import { formatDateTime } from '../../lib/format';
import { nextId } from '../../lib/ids';
import { can } from '../../lib/permissions';

const TEMPLATES = [
  { label: 'Received', body: 'Thanks for letting us know. We have your request and will be in touch shortly.' },
  { label: 'Vendor booked', body: 'A technician is booked for [date], between [window].' },
  { label: 'Delay', body: 'Your repair needs a part that is on order. We will confirm a new visit as soon as it arrives.' },
  { label: 'Complete', body: 'Your repair is complete. Reply to this message if anything is still not right.' },
];

export function TenantComms() {
  const { state, dispatch, user } = useStore();
  const [query, setQuery] = useState('');
  const [channel, setChannel] = useState<'sms' | 'email'>('sms');
  const [body, setBody] = useState('');

  const term = query.trim();
  const request = term ? findRequest(state, term) : undefined;

  const messages = useMemo(() => {
    const list = term ? state.tenantMessages.filter((m) => m.requestId.includes(term)) : state.tenantMessages;
    return [...list].sort((a, b) => b.sentAt.localeCompare(a.sentAt));
  }, [state.tenantMessages, term]);

  const send = () => {
    if (!request || !body.trim()) return;
    dispatch({
      type: 'sendTenantMessage',
      message: {
        id: nextId('M', state.tenantMessages.map((m) => m.id)),
        requestId: request.id,
        sentAt: new Date().toISOString().slice(0, 19),
        channel,
        body: body.trim(),
        sentBy: user.name,
      },
    });
    setBody('');
  };

  return (
    <>
      <PageHeader
        title="Tenant Comms"
        subtitle="Updates sent to tenants by SMS or email. Enter a request number to see its thread and send an update."
      />
      <div className="toolbar">
        <IdSearch value={query} onChange={setQuery} placeholder="Request number (REQ-…)" />
      </div>

      {request && (
        <section className="card">
          <h2>
            {request.id} · {request.tenantName}, {request.building} {request.unit}
          </h2>
          <p className="muted">
            {request.tenantPhone} · Tenant status page:{' '}
            <Link to={`/status/${request.tenantToken}`} target="_blank">
              /status/{request.tenantToken}
            </Link>
          </p>
          <div className="templates">
            {TEMPLATES.map((t) => (
              <button key={t.label} type="button" onClick={() => setBody(t.body)}>
                {t.label}
              </button>
            ))}
          </div>
          <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="form-row">
            <select value={channel} onChange={(e) => setChannel(e.target.value as 'sms' | 'email')} aria-label="Channel">
              <option value="sms">SMS</option>
              <option value="email">Email</option>
            </select>
            <button type="button" className="primary" onClick={send} disabled={!can(user.role, 'message_tenant') || !body.trim()}>
              Send update
            </button>
          </div>
        </section>
      )}
      {term && !request && <p className="muted">No request {term}. Check the number in Intake or Dispatch.</p>}

      <table className="grid">
        <thead>
          <tr>
            <th>Sent</th>
            <th>Request</th>
            <th>Channel</th>
            <th>Message</th>
            <th>By</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((m) => (
            <tr key={m.id}>
              <td>{formatDateTime(m.sentAt)}</td>
              <td>
                <code>{m.requestId}</code>
              </td>
              <td>{m.channel.toUpperCase()}</td>
              <td>{m.body}</td>
              <td>{m.sentBy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
