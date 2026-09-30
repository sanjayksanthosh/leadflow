const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const pad = (n: number) => String(n).padStart(2, '0');

export const nowIso = (): string => new Date().toISOString();

export const toDate = (iso: string | null | undefined): Date | null =>
  iso ? new Date(iso) : null;

export const startOfDay = (d: Date): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const addDays = (d: Date, days: number): Date => {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
};

export const addMinutes = (d: Date, minutes: number): Date => new Date(d.getTime() + minutes * 60000);

/** Calendar-day difference, ignoring clock time: today - target. */
export const daysFromToday = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const target = startOfDay(new Date(iso));
  return Math.round((startOfDay(new Date()).getTime() - target.getTime()) / 86400000);
};

export const isToday = (iso: string | null | undefined): boolean => daysFromToday(iso) === 0;
export const isTomorrow = (iso: string | null | undefined): boolean => daysFromToday(iso) === -1;
export const isYesterday = (iso: string | null | undefined): boolean => daysFromToday(iso) === 1;
export const isOverdue = (iso: string | null | undefined): boolean => {
  const d = daysFromToday(iso);
  return d !== null && d > 0;
};

export const formatDay = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatTime = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  const h = d.getHours();
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${pad(d.getMinutes())} ${suffix}`;
};

export const formatStamp = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  return `${formatDay(iso)}, ${formatTime(iso)}`;
};

/** Today / Tomorrow / Yesterday, else a short day for timelines. */
export const formatDaySmart = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const diff = daysFromToday(iso);
  if (diff === 0) return 'Today';
  if (diff === -1) return 'Tomorrow';
  if (diff === 1) return 'Yesterday';
  const d = new Date(iso);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]}`;
};

export const formatWeekday = (iso: string | null | undefined): string => {
  if (!iso) return '';
  return DAY_NAMES[new Date(iso).getDay()];
};

/** Bucket label for follow-up lists. */
export const followUpLabel = (iso: string | null | undefined): string => {
  if (!iso) return 'No follow-up set';
  const d = new Date(iso);
  const diff = daysFromToday(iso);
  const day = daysFromToday(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00:00`);
  if (day !== null && day > 0) {
    return day === 1 ? 'Overdue by 1 day' : `Overdue by ${day} days`;
  }
  if (diff === 0) return `Today, ${formatTime(iso)}`;
  if (diff === -1) return `Tomorrow, ${formatTime(iso)}`;
  return formatStamp(iso);
};

export const relativeTime = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24 && isToday(iso)) return `${hours}h ago`;
  if (isToday(iso)) return `Today, ${formatTime(iso)}`;
  if (isYesterday(iso)) return `Yesterday, ${formatTime(iso)}`;
  const days = daysFromToday(iso);
  if (days !== null && days > 1 && days < 7) return `${days} days ago`;
  return formatDay(iso);
};

export const toDateInput = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const toTimeInput = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const fromDateTimeInputs = (date: string, time: string): string | null => {
  if (!date) return null;
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return null;
  const [hh, mm] = (time || '09:00').split(':').map(Number);
  return new Date(y, m - 1, d, hh || 0, mm || 0).toISOString();
};

export const roundToNextHour = (d: Date): Date => {
  const next = new Date(d);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return next;
};

/** Resolves the Follow-ups quick presets into a real timestamp. */
export const resolveFollowUpPreset = (preset: string, base = new Date()): string | null => {
  switch (preset) {
    case '2h':
      return addMinutes(base, 120).toISOString();
    case 'today_eod':
      return new Date(base.getFullYear(), base.getMonth(), base.getDate(), 18, 0).toISOString();
    case 'tomorrow_am':
      return new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1, 10, 0).toISOString();
    case 'tomorrow_pm':
      return new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1, 16, 0).toISOString();
    case 'in_2_days':
      return new Date(base.getFullYear(), base.getMonth(), base.getDate() + 2, 11, 0).toISOString();
    case 'in_1_week':
      return new Date(base.getFullYear(), base.getMonth(), base.getDate() + 7, 11, 0).toISOString();
    case 'clear':
      return null;
    default:
      return null;
  }
};

export const greeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export const displayPhone = (phone: string): string => phone || '—';
