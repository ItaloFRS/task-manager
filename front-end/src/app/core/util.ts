import { Card, PRIORITIES } from './models';

const pad = (n: number) => String(n).padStart(2, '0');

/** Lê "2026-10-20T00:00:00" (ou array do Jackson) como data LOCAL, ignorando fuso. */
export function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    const [y, m, d, h = 0, mi = 0] = value as number[];
    return new Date(y, m - 1, d, h, mi);
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(String(value));
  if (!match) return null;
  const [, y, m, d, h = '0', mi = '0'] = match;
  return new Date(+y, +m - 1, +d, +h, +mi);
}

export function toDateInput(value: unknown): string {
  const d = parseDate(value);
  return d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : '';
}

export function fromDateInput(value: string): string | null {
  return value ? `${value}T00:00:00` : null;
}

export function shortDate(value: unknown): string {
  const d = parseDate(value);
  if (!d) return '';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
}

export function longDate(value: unknown): string {
  const d = parseDate(value);
  return d ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/\./g, '') : '';
}

export function isOverdue(card: Card): boolean {
  const due = parseDate(card.dueDate);
  if (!due || card.status === 'DONE') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}

export function initials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

/** Número de 0 a 5, estável para o mesmo nome (escolhe a cor do avatar). */
export function tone(name?: string | null): number {
  let hash = 0;
  for (const ch of name ?? '') hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash % 6;
}

export function priorityLabel(priority: string): string {
  return PRIORITIES.find((p) => p.key === priority)?.label ?? priority;
}
