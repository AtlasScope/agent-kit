import { team } from '@/lib/data';

export default function TeamPage() {
  return (<><h1>Team</h1><ul>{team.map((m) => <li key={m.name}>{m.name} — {m.role}</li>)}</ul></>);
}
