import type { Lead, LeadStatus, PartnerId } from '../types';
import { isOverdue, isToday, isTomorrow } from '../lib/dates';
import { isOpenStatus, needsNextAction } from '../lib/leadState';

export const leadLabel = (lead: Lead): string => lead.name;

export type FollowUpBucket = 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'none';

export function followUpBucket(lead: Lead): FollowUpBucket {
  if (!lead.followUpDate) return 'none';
  if (isOverdue(lead.followUpDate)) return 'overdue';
  if (isToday(lead.followUpDate)) return 'today';
  if (isTomorrow(lead.followUpDate)) return 'tomorrow';
  return 'upcoming';
}

/** Overdue and today are what a partner has to act on; the rest is future work. */
export const byFollowUpSoonest = (a: Lead, b: Lead): number =>
  (a.followUpDate ?? '9999').localeCompare(b.followUpDate ?? '9999');

export function searchLeads(leads: Lead[], query: string): Lead[] {
  const q = query.trim().toLowerCase();
  if (!q) return leads;
  return leads.filter((lead) =>
    [lead.name, lead.phone].join(' ').toLowerCase().includes(q),
  );
}

export interface LeadFilters {
  query: string;
  status: LeadStatus | 'all';
  partner: PartnerId | 'all';
  followUp: FollowUpBucket | 'all';
}

export function filterLeads(leads: Lead[], filters: LeadFilters): Lead[] {
  return searchLeads(leads, filters.query)
    .filter((lead) => {
      if (filters.status !== 'all' && lead.status !== filters.status) return false;
      if (filters.partner !== 'all' && lead.assignedPartner !== filters.partner) return false;
      if (filters.followUp !== 'all' && followUpBucket(lead) !== filters.followUp) return false;
      return true;
    })
    .sort(byFollowUpSoonest);
}

export interface DashboardCounts {
  total: number;
  newLeads: number;
  contacted: number;
  waiting: number;
  interested: number;
  due: number;
  converted: number;
  missingNextAction: number;
}

/**
 * What the home page lists: anything overdue or due today first, then the rest by
 * follow-up date, and closed leads at the bottom.
 */
export function sortByUrgency(leads: Lead[]): Lead[] {
  const rank = (lead: Lead) => {
    if (!isOpenStatus(lead.status)) return 3;
    const bucket = followUpBucket(lead);
    if (bucket === 'overdue') return 0;
    if (bucket === 'today') return 1;
    if (bucket === 'tomorrow') return 2;
    if (bucket === 'upcoming') return 2;
    return 1.5;
  };
  return [...leads].sort(
    (a, b) => rank(a) - rank(b) || byFollowUpSoonest(a, b) || b.updatedAt.localeCompare(a.updatedAt),
  );
}

export function dashboardCounts(leads: Lead[]): DashboardCounts {
  const open = leads.filter((l) => isOpenStatus(l.status));
  return {
    total: leads.length,
    newLeads: leads.filter((l) => l.status === 'new').length,
    contacted: leads.filter((l) => l.status === 'contacted').length,
    waiting: leads.filter((l) => l.status === 'waiting').length,
    interested: leads.filter((l) => l.status === 'interested').length,
    due: open.filter((l) => {
      const b = followUpBucket(l);
      return b === 'overdue' || b === 'today';
    }).length,
    converted: leads.filter((l) => l.status === 'converted').length,
    missingNextAction: open.filter(needsNextAction).length,
  };
}

/** Today's board: everything due today plus anything already late. */
export const todayFollowUps = (leads: Lead[]): Lead[] =>
  leads
    .filter((l) => isOpenStatus(l.status))
    .filter((l) => {
      const b = followUpBucket(l);
      return b === 'overdue' || b === 'today';
    })
    .sort(byFollowUpSoonest);
