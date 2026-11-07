import type { Priority } from '../types';
import { PRIORITY_LABEL } from '../lib/format';

export function Pill({ tone = 'neutral', children }: { tone?: 'neutral' | 'warn' | 'bad' | 'good'; children: string }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

export function PriorityPill({ priority }: { priority: Priority | null }) {
  if (!priority) return <Pill>Not triaged</Pill>;
  const tone = priority === 'emergency' ? 'bad' : priority === 'urgent' ? 'warn' : 'neutral';
  return <Pill tone={tone}>{PRIORITY_LABEL[priority]}</Pill>;
}
