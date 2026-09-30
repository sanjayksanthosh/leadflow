export type PartnerId = 'p1' | 'p2' | 'p3';

export interface Partner {
  id: PartnerId;
  name: string;
  role: string;
  initials: string;
  hue: number;
}

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'waiting'
  | 'interested'
  | 'followup'
  | 'converted'
  | 'not_interested'
  | 'lost';

export type LeadSource = 'website' | 'whatsapp' | 'instagram' | 'facebook' | 'referral' | 'direct' | 'other';

export type ContactMethod = 'phone_call' | 'whatsapp' | 'email' | 'instagram' | 'meeting' | 'other';

export type ResponseType =
  | 'interested'
  | 'not_interested'
  | 'call_later'
  | 'wants_info'
  | 'no_response'
  | 'converted'
  | 'other';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  /** Whoever is working the lead. Set once at creation, changed from the form. */
  assignedPartner: PartnerId;
  /** Everything below is written by logging a contact, never typed by hand. */
  lastContacted: string | null;
  lastContactedBy: PartnerId | null;
  lastContactMethod: ContactMethod | null;
  lastResponse: string | null;
  lastResponseType: ResponseType | null;
  nextAction: string | null;
  followUpDate: string | null;
  createdBy: PartnerId;
  createdAt: string;
  updatedAt: string;
}

export interface Interaction {
  id: string;
  leadId: string;
  partnerId: PartnerId;
  contactMethod: ContactMethod;
  response: string;
  responseType: ResponseType;
  nextAction: string | null;
  followUpDate: string | null;
  notes: string;
  createdAt: string;
}

/** What the add-lead form collects. Created-by is never typed by hand. */
export interface LeadDraft {
  name: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
}

export interface ContactDraft {
  contactMethod: ContactMethod;
  response: string;
  responseType: ResponseType;
  nextAction: string | null;
  followUpDate: string | null;
  notes: string;
}