export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function today(): string {
  return toISODate(new Date());
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDayName(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

export function formatMonthYear(year: number, month: number): string {
  const d = new Date(year, month, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function diffDays(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

export function getLast30Days(): string[] {
  const result: string[] = [];
  const t = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(t);
    d.setDate(d.getDate() - i);
    result.push(toISODate(d));
  }
  return result;
}

export function getLast7Days(): string[] {
  const result: string[] = [];
  const t = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(t);
    d.setDate(d.getDate() - i);
    result.push(toISODate(d));
  }
  return result;
}

export function isProtocolDueOnDate(
  protocol: { frequency_type: string; frequency_value: number; start_date: string },
  dateStr: string
): boolean {
  const start = new Date(protocol.start_date + 'T00:00:00');
  const target = new Date(dateStr + 'T00:00:00');
  if (target < start) return false;

  const daysDiff = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (protocol.frequency_type === 'daily') {
    return true;
  } else if (protocol.frequency_type === 'weekly') {
    return daysDiff % 7 === 0;
  } else if (protocol.frequency_type === 'every_x_days') {
    return daysDiff % protocol.frequency_value === 0;
  }
  return false;
}

export function getNextDoseDate(protocol: {
  frequency_type: string;
  frequency_value: number;
  start_date: string;
}): string {
  return getNextDoseDateFrom(protocol, today());
}

export function getNextDoseDateFrom(
  protocol: {
    frequency_type: string;
    frequency_value: number;
    start_date: string;
  },
  startDate: string
): string {
  let check = startDate;
  for (let i = 0; i <= 365; i++) {
    const d = addDays(startDate, i);
    if (isProtocolDueOnDate(protocol, d)) {
      check = d;
      break;
    }
  }
  return check;
}

export function daysUntil(dateStr: string): number {
  return diffDays(today(), dateStr);
}

export function formatRelativeDate(dateStr: string): string {
  const diff = daysUntil(dateStr);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < 0) return `${Math.abs(diff)} days ago`;
  return `In ${diff} days`;
}
