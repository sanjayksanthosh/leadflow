import type { ContactMethod, LeadSource, LeadStatus, Partner, ResponseType } from '../types';

export const PARTNERS: Partner[] = [
  { id: 'p1', name: 'Partner 1', role: 'Sales & site visits', initials: 'P1', hue: 222 },
  { id: 'p2', name: 'Partner 2', role: 'WhatsApp & follow-ups', initials: 'P2', hue: 268 },
  { id: 'p3', name: 'Partner 3', role: 'Enquiries & follow-ups', initials: 'P3', hue: 168 },
];

export const PARTNER_MAP: Record<string, Partner> = Object.fromEntries(
  PARTNERS.map((p) => [p.id, p]),
);

export const partnerName = (id: string | null | undefined): string =>
  (id && PARTNER_MAP[id]?.name) || 'Unassigned';

export interface StatusMeta {
  id: LeadStatus;
  label: string;
  dot: string;
  /** Tinted pill + solid dot, readable on white and on the dark sidebar. */
  chipBg: string;
  chipText: string;
  blurb: string;
}

export const STATUSES: StatusMeta[] = [
  {
    id: 'new',
    label: 'New',
    dot: '#2563eb',
    chipBg: '#e8effd',
    chipText: '#1a4fbd',
    blurb: 'Not contacted yet',
  },
  {
    id: 'contacted',
    label: 'Contacted',
    dot: '#b07d10',
    chipBg: '#fbf0d6',
    chipText: '#8a6008',
    blurb: 'Reached, waiting on detail',
  },
  {
    id: 'waiting',
    label: 'Waiting for Response',
    dot: '#c2600c',
    chipBg: '#fceadb',
    chipText: '#a44d08',
    blurb: 'We are waiting on them',
  },
  {
    id: 'interested',
    label: 'Interested',
    dot: '#0e8a5f',
    chipBg: '#e0f4ec',
    chipText: '#0a6a4a',
    blurb: 'Wants to move ahead',
  },
  {
    id: 'followup',
    label: 'Follow-up Required',
    dot: '#6d3fc4',
    chipBg: '#efe6fc',
    chipText: '#5a2fa5',
    blurb: 'Needs another touch',
  },
  {
    id: 'converted',
    label: 'Converted',
    dot: '#15803d',
    chipBg: '#dff3e5',
    chipText: '#12632f',
    blurb: 'Closed as won',
  },
  {
    id: 'not_interested',
    label: 'Not Interested',
    dot: '#c02626',
    chipBg: '#fbe6e6',
    chipText: '#9c1c1c',
    blurb: 'Said no for now',
  },
  {
    id: 'lost',
    label: 'Lost',
    dot: '#5a6270',
    chipBg: '#eceef1',
    chipText: '#454c57',
    blurb: 'Gone quiet',
  },
];

export const STATUS_MAP: Record<LeadStatus, StatusMeta> = Object.fromEntries(
  STATUSES.map((s) => [s.id, s]),
) as Record<LeadStatus, StatusMeta>;

export const statusLabel = (id: LeadStatus): string => STATUS_MAP[id]?.label ?? id;

export interface Option<T extends string> {
  value: T;
  label: string;
}

export const SOURCES: Option<LeadSource>[] = [
  { value: 'website', label: 'Website' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'referral', label: 'Referral' },
  { value: 'direct', label: 'Direct' },
  { value: 'other', label: 'Other' },
];

export const CONTACT_METHODS: Option<ContactMethod>[] = [
  { value: 'phone_call', label: 'Phone Call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'other', label: 'Other' },
];

export const RESPONSE_TYPES: Option<ResponseType>[] = [
  { value: 'interested', label: 'Interested' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'call_later', label: 'Asked to Call Later' },
  { value: 'wants_info', label: 'Wants More Information' },
  { value: 'no_response', label: 'No Response' },
  { value: 'converted', label: 'Converted' },
  { value: 'other', label: 'Other' },
];

export const NEXT_ACTIONS: Option<string>[] = [
  { value: 'call_again', label: 'Call Again' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'send_details', label: 'Send Details' },
  { value: 'send_proposal', label: 'Send Proposal' },
  { value: 'send_quotation', label: 'Send Quotation' },
  { value: 'schedule_meeting', label: 'Schedule Meeting' },
  { value: 'site_visit', label: 'Site Visit' },
  { value: 'wait', label: 'Wait for Response' },
  { value: 'none', label: 'No Further Action' },
  { value: 'other', label: 'Other' },
];

export const FOLLOW_UP_PRESETS: Option<string>[] = [
  { value: '2h', label: 'In 2 hours' },
  { value: 'today_eod', label: 'Later today' },
  { value: 'tomorrow_am', label: 'Tomorrow 10:00 AM' },
  { value: 'tomorrow_pm', label: 'Tomorrow 4:00 PM' },
  { value: 'in_2_days', label: 'In 2 days' },
  { value: 'in_1_week', label: 'In 1 week' },
  { value: 'clear', label: 'Clear follow-up' },
];

export const sourceLabel = (s: LeadSource): string =>
  SOURCES.find((o) => o.value === s)?.label ?? 'Other';

export const methodLabel = (m: ContactMethod | null): string =>
  CONTACT_METHODS.find((o) => o.value === m)?.label ?? 'Not recorded';

export const responseTypeLabel = (r: ResponseType | null): string =>
  RESPONSE_TYPES.find((o) => o.value === r)?.label ?? 'Not recorded';

export const nextActionLabel = (a: string | null | undefined): string => {
  if (!a) return 'No next action set';
  if (a === 'none') return 'No further action';
  return NEXT_ACTIONS.find((o) => o.value === a)?.label ?? a;
};
