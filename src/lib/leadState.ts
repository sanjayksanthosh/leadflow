import type { ContactDraft, Interaction, Lead, LeadStatus, ResponseType } from '../types';

export const newId = (prefix: string): string =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/**
 * Status is derived from what the lead actually said, so a partner never has to
 * set it by hand after every call. Manual changes still win until the next
 * contact is logged (see `deriveStatus`).
 */
export function deriveStatus(current: LeadStatus, responseType: ResponseType): LeadStatus {
  if (responseType === 'converted') return 'converted';
  if (responseType === 'interested') return 'interested';
  if (responseType === 'not_interested') return 'not_interested';
  if (responseType === 'no_response') return 'waiting';
  if (responseType === 'wants_info' || responseType === 'call_later') return 'followup';
  // "Other" / neutral answer: don't revive a closed lead, otherwise it just moves
  // to the first stage of contact.
  if (current === 'lost' || current === 'converted') return current;
  return 'contacted';
}

/** Single place where an interaction is folded back onto the lead summary. */
export function applyInteraction(lead: Lead, interaction: Interaction): Lead {
  const noFurtherAction = interaction.nextAction === 'none';
  return {
    ...lead,
    lastContacted: interaction.createdAt,
    lastContactedBy: interaction.partnerId,
    lastContactMethod: interaction.contactMethod,
    lastResponse: interaction.response,
    lastResponseType: interaction.responseType,
    nextAction: interaction.nextAction,
    followUpDate: noFurtherAction ? null : interaction.followUpDate,
    status: deriveStatus(lead.status, interaction.responseType),
    updatedAt: interaction.createdAt,
  };
}

export function buildInteraction(
  leadId: string,
  partnerId: Interaction['partnerId'],
  draft: ContactDraft,
  at = new Date(),
): Interaction {
  return {
    id: newId('int'),
    leadId,
    partnerId,
    contactMethod: draft.contactMethod,
    response: draft.response.trim() || 'No response recorded.',
    responseType: draft.responseType,
    nextAction: draft.nextAction,
    followUpDate: draft.followUpDate,
    notes: draft.notes.trim(),
    createdAt: at.toISOString(),
  };
}

/** A lead is "open" while it still has a chance of closing. */
export const isOpenStatus = (status: LeadStatus): boolean =>
  status !== 'converted' && status !== 'not_interested' && status !== 'lost';

/** Contacted but nobody has written down what to do next. */
export const needsNextAction = (lead: Lead): boolean =>
  isOpenStatus(lead.status) && !!lead.lastContacted && !lead.nextAction;

/** Contacted today by somebody else — the duplicate-contact warning. */
export function contactedRecentlyByOther(
  lead: Lead,
  partnerId: string,
  withinHours = 24,
): { partnerId: string; at: string } | null {
  if (!lead.lastContacted || !lead.lastContactedBy) return null;
  if (lead.lastContactedBy === partnerId) return null;
  const age = Date.now() - new Date(lead.lastContacted).getTime();
  if (age > withinHours * 3600000) return null;
  return { partnerId: lead.lastContactedBy, at: lead.lastContacted };
}
