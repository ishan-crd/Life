/** Monday-first weekday index (0 = Monday). */
export function isoDay(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export function startOfWeek(d: Date): Date {
  const m = new Date(d);
  m.setDate(m.getDate() - isoDay(m));
  m.setHours(0, 0, 0, 0);
  return m;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** "Mon, 8 Sep" — matches the design's toLocaleDateString options. */
export function fmtShortDate(d: Date): string {
  return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
}

export function fmtLongDate(d: Date): string {
  return d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' });
}

export function fmtMonth(d: Date): string {
  return d.toLocaleDateString([], { month: 'long', year: 'numeric' });
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Leading blank cells so the grid starts on Monday. */
export function monthLead(year: number, month: number): number {
  return isoDay(new Date(year, month, 1));
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function dateKey(year: number, month: number, day: number): string {
  return `${monthKey(year, month)}-${String(day).padStart(2, '0')}`;
}

export function mmss(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function greetingFor(hour: number): string {
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}

/** 24h "18:30" -> "6:30 PM" */
export function to12h(hhmm: string): string {
  const [hRaw, m] = hhmm.split(':');
  const h = Number(hRaw);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${suffix}`;
}
