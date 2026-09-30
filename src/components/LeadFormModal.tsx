import { useState } from 'react';
import type { Lead, LeadDraft, LeadSource, LeadStatus } from '../types';
import { SOURCES, STATUSES, partnerName } from '../lib/constants';
import { useCrm } from '../state/store';
import { Modal } from './Modal';
import { useToast } from './Toast';

/** Four questions, nothing else. Everything else is learned by logging a contact. */
const blank = (): LeadDraft => ({
  name: '',
  phone: '',
  source: 'website',
  status: 'new',
});

interface Props {
  lead?: Lead;
  onClose: () => void;
  onSaved?: (lead: Lead) => void;
}

export function LeadFormModal({ lead, onClose, onSaved }: Props) {
  const { currentPartner, actions } = useCrm();
  const { push } = useToast();
  const editing = Boolean(lead);

  const [form, setForm] = useState<LeadDraft>(() =>
    lead
      ? { name: lead.name, phone: lead.phone, source: lead.source, status: lead.status }
      : blank(),
  );
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const set = <K extends keyof LeadDraft>(key: K, value: LeadDraft[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const digits = form.phone.replace(/\D/g, '');

  const submit = () => {
    const next: { name?: string; phone?: string } = {};
    if (!form.name.trim()) next.name = 'Enter the lead name';
    if (digits.length < 7) next.phone = 'Enter a phone number we can reach';
    setErrors(next);
    if (Object.keys(next).length) return;

    if (lead) {
      const saved = { ...lead, ...form, name: form.name.trim(), phone: form.phone.trim() };
      actions.updateLead(lead.id, form);
      push({ title: 'Lead updated', detail: `${saved.name} saved`, tone: 'ok' });
      onSaved?.(saved);
    } else {
      const created = actions.createLead(form);
      push({ title: 'Lead added', detail: `${created.name} added`, tone: 'ok' });
      onSaved?.(created);
    }
    onClose();
  };

  return (
    <Modal
      title={editing ? 'Edit lead' : 'Add new lead'}
      subtitle={
        lead ? (
          lead.name
        ) : (
          <>
            Added by <strong>{partnerName(currentPartner?.id)}</strong>
          </>
        )
      }
      onClose={onClose}
      footer={
        <>
          <span className="spacer" />
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={submit}>
            {editing ? 'Save changes' : 'Add lead'}
          </button>
        </>
      }
    >
      <div className="form-grid">
        <label className="field span-2">
          <span className="field__label">
            Name <span className="field__req">*</span>
          </span>
          <input
            className="input"
            value={form.name}
            autoFocus
            aria-invalid={Boolean(errors.name)}
            placeholder="Priya Raghavan"
            onChange={(e) => set('name', e.target.value)}
          />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </label>

        <label className="field">
          <span className="field__label">
            Number <span className="field__req">*</span>
          </span>
          <input
            className="input"
            value={form.phone}
            inputMode="tel"
            aria-invalid={Boolean(errors.phone)}
            placeholder="+91 98450 33210"
            onChange={(e) => set('phone', e.target.value)}
          />
          {errors.phone && <span className="form-error">{errors.phone}</span>}
        </label>

        <label className="field">
          <span className="field__label">Where they came from</span>
          <select
            className="select"
            value={form.source}
            onChange={(e) => set('source', e.target.value as LeadSource)}
          >
            {SOURCES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Status</span>
          <select
            className="select"
            value={form.status}
            onChange={(e) => set('status', e.target.value as LeadStatus)}
          >
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </Modal>
  );
}