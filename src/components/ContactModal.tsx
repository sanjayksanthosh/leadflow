import { useState } from 'react';
import type { ContactDraft, ContactMethod, Lead, ResponseType } from '../types';
import {
  CONTACT_METHODS,
  FOLLOW_UP_PRESETS,
  NEXT_ACTIONS,
  RESPONSE_TYPES,
  partnerName,
  statusLabel,
} from '../lib/constants';
import {
  followUpLabel,
  formatStamp,
  fromDateTimeInputs,
  resolveFollowUpPreset,
  toDateInput,
  toTimeInput,
} from '../lib/dates';
import { deriveStatus } from '../lib/leadState';
import { useCrm } from '../state/store';
import { Modal } from './Modal';
import { useToast } from './Toast';
import { Avatar, Icon, type IconName } from './ui';

const METHOD_ICONS: Record<ContactMethod, IconName> = {
  phone_call: 'phone',
  whatsapp: 'message',
  email: 'mail',
  instagram: 'instagram',
  meeting: 'meeting',
  other: 'more',
};

const blankDraft = (): ContactDraft => ({
  contactMethod: 'phone_call',
  response: '',
  responseType: 'wants_info',
  nextAction: 'send_details',
  followUpDate: null,
  notes: '',
});

export function ContactModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { currentPartner, actions } = useCrm();
  const { push } = useToast();
  const [draft, setDraft] = useState<ContactDraft>(() => ({
    ...blankDraft(),
    nextAction: lead.nextAction && lead.nextAction !== 'none' ? lead.nextAction : 'send_details',
  }));
  const [customAction, setCustomAction] = useState('');

  const set = <K extends keyof ContactDraft>(key: K, value: ContactDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const nextStatus = deriveStatus(lead.status, draft.responseType);
  const noAction = draft.nextAction === 'none';

  const submit = () => {
    const finalAction =
      draft.nextAction === 'other' && customAction.trim() ? customAction.trim() : draft.nextAction;
    actions.logContact(lead.id, { ...draft, nextAction: finalAction });
    push({
      title: `Contact logged for ${lead.name}`,
      detail: `Status is now ${statusLabel(nextStatus)}`,
      tone: 'ok',
    });
    onClose();
  };

  return (
    <Modal
      title="Log a contact"
      subtitle={
        <>
          {lead.name}
          {lead.lastContacted && (
            <>
              {' · last contacted '}
              {formatStamp(lead.lastContacted)}
            </>
          )}
        </>
      }
      onClose={onClose}
      wide
      footer={
        <>
          <span className="faint" style={{ fontSize: 12.5 }}>
            Saved as {statusLabel(nextStatus)}
          </span>
          <span className="spacer" />
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={submit}>
            Save contact
          </button>
        </>
      }
    >
      <div className="modal__who">
        <Avatar partnerId={currentPartner?.id ?? null} size="sm" />
        <span>
          Contacted by <strong>{partnerName(currentPartner?.id)}</strong> — recorded automatically
        </span>
      </div>

      {lead.lastContactedBy && lead.lastContactedBy !== currentPartner?.id && (
        <div className="alert alert--warn" style={{ marginBottom: 16 }}>
          <Icon name="alert" size={16} style={{ marginTop: 1, flexShrink: 0 }} />
          <span>
            <strong>{partnerName(lead.lastContactedBy)}</strong> already contacted this lead on{' '}
            {formatStamp(lead.lastContacted)}
            {lead.lastResponse ? (
              <>
                {' '}
                and wrote: “{lead.lastResponse}”
              </>
            ) : null}
            . Add to that instead of starting over.
          </span>
        </div>
      )}

      <div className="field" style={{ marginBottom: 16 }}>
        <span className="field__label">Contact method</span>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {CONTACT_METHODS.map((m) => {
            const selected = draft.contactMethod === m.value;
            return (
              <button
                type="button"
                key={m.value}
                className={selected ? 'login__option login__option--selected' : 'login__option'}
                style={{ flex: '1 1 130px', padding: '9px 12px' }}
                onClick={() => set('contactMethod', m.value)}
              >
                <Icon name={METHOD_ICONS[m.value]} size={16} style={{ color: 'var(--text-2)' }} />
                <span className="login__option-name" style={{ fontSize: 13.5 }}>
                  {m.label}
                </span>
                <span className="login__radio" />
              </button>
            );
          })}
        </div>
      </div>

      <label className="field" style={{ marginBottom: 16 }}>
        <span className="field__label">
          What did the lead say? <span className="field__req">*</span>
        </span>
        <textarea
          className="textarea textarea--tall"
          autoFocus
          value={draft.response}
          placeholder="Interested. Please send the details."
          onChange={(e) => set('response', e.target.value)}
        />
        <span className="field__hint">
          Write it in the lead's own words. This is what the other partners will read.
        </span>
      </label>

      <div className="form-grid" style={{ marginBottom: 16 }}>
        <label className="field">
          <span className="field__label">Response type</span>
          <select
            className="select"
            value={draft.responseType}
            onChange={(e) => set('responseType', e.target.value as ResponseType)}
          >
            {RESPONSE_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="field__hint">
            Status moves to <strong>{statusLabel(nextStatus)}</strong> automatically.
          </span>
        </label>

        <div className="field">
          <span className="field__label">Next action</span>
          <select
            className="select"
            value={draft.nextAction ?? 'none'}
            onChange={(e) => set('nextAction', e.target.value || null)}
          >
            {NEXT_ACTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {draft.nextAction === 'other' && (
            <input
              className="input"
              style={{ marginTop: 6 }}
              value={customAction}
              placeholder="Describe the next step"
              onChange={(e) => setCustomAction(e.target.value)}
            />
          )}
          {noAction && (
            <span className="field__hint">This lead will drop off the follow-up list.</span>
          )}
        </div>
      </div>

      <div className="field" style={{ marginBottom: 16 }}>
        <span className="field__label">Next follow-up</span>
        <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {FOLLOW_UP_PRESETS.map((p) => (
            <button
              type="button"
              key={p.value}
              className="btn btn--sm"
              onClick={() => set('followUpDate', resolveFollowUpPreset(p.value))}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="input-row" style={{ maxWidth: 320 }}>
          <input
            className="input"
            type="date"
            value={toDateInput(draft.followUpDate)}
            onChange={(e) =>
              set('followUpDate', fromDateTimeInputs(e.target.value, toTimeInput(draft.followUpDate) || '10:00'))
            }
          />
          <input
            className="input"
            type="time"
            style={{ maxWidth: 120 }}
            value={toTimeInput(draft.followUpDate)}
            onChange={(e) =>
              set('followUpDate', fromDateTimeInputs(toDateInput(draft.followUpDate), e.target.value))
            }
          />
        </div>
        <span className="field__hint">
          {draft.followUpDate
            ? `Scheduled for ${followUpLabel(draft.followUpDate)}`
            : 'No follow-up set. This lead will not show up on the follow-ups page.'}
        </span>
      </div>

      <label className="field">
        <span className="field__label">Notes (optional)</span>
        <textarea
          className="textarea"
          style={{ minHeight: 70 }}
          value={draft.notes}
          placeholder="Anything the next partner should know before they call."
          onChange={(e) => set('notes', e.target.value)}
        />
      </label>
    </Modal>
  );
}
