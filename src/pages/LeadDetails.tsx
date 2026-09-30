import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCrm } from '../state/store';
import { STATUSES, methodLabel, nextActionLabel, partnerName, responseTypeLabel, sourceLabel } from '../lib/constants';
import { followUpLabel, formatDay, formatDaySmart, formatStamp, formatTime, relativeTime } from '../lib/dates';
import { contactedRecentlyByOther } from '../lib/leadState';
import { ContactModal } from '../components/ContactModal';
import { LeadFormModal } from '../components/LeadFormModal';
import { useToast } from '../components/Toast';
import { Avatar, EmptyState, Icon, StatusChip } from '../components/ui';

export function LeadDetails() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { data, currentPartner, actions } = useCrm();
  const { push } = useToast();
  const [contacting, setContacting] = useState(false);
  const [editing, setEditing] = useState(false);

  const lead = data.leads.find((l) => l.id === leadId);
  const interactions = useMemo(
    () =>
      data.interactions
        .filter((i) => i.leadId === leadId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data.interactions, leadId],
  );

  if (!lead) {
    return (
      <main className="page">
        <div className="card">
          <EmptyState
            icon="search"
            title="This lead no longer exists"
            hint="It may have been removed by a reset of the demo data."
            action={
              <button className="btn" onClick={() => navigate('/leads')}>
                Back to leads
              </button>
            }
          />
        </div>
      </main>
    );
  }

  const recent = contactedRecentlyByOther(lead, currentPartner?.id ?? '', 24);
  const isMine = lead.assignedPartner === currentPartner?.id;

  return (
    <>
      <main className="page">
        <div style={{ marginBottom: 12 }}>
          <Link to="/leads" className="row" style={{ gap: 4, color: 'var(--text-2)', fontSize: 13 }}>
            <Icon name="chevronRight" size={14} style={{ transform: 'rotate(180deg)' }} />
            All leads
          </Link>
        </div>

        <header className="leadhead">
          <div className="leadhead__top">
            <div style={{ minWidth: 0 }}>
              <h1 className="leadhead__company">{lead.name}</h1>
              <div className="leadhead__person">{sourceLabel(lead.source)} enquiry</div>
              <div className="leadhead__badges">
                <StatusChip status={lead.status} />
                <span className="chip chip--outline">
                  <Avatar partnerId={lead.assignedPartner} size="sm" />
                  {isMine ? 'You' : partnerName(lead.assignedPartner)}
                </span>
                <span className="chip chip--plain">{sourceLabel(lead.source)}</span>
                <span className="faint" style={{ fontSize: 12.5 }}>
                  Added {formatDay(lead.createdAt)} by {partnerName(lead.createdBy)}
                </span>
              </div>
            </div>

            <div className="leadhead__actions">
              <select
                className="select"
                value={lead.status}
                aria-label="Status"
                onChange={(e) => {
                  actions.setStatus(lead.id, e.target.value as typeof lead.status);
                  push({ title: 'Status updated', tone: 'ok' });
                }}
              >
                {STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <button className="btn btn--primary" onClick={() => setContacting(true)}>
                <Icon name="message" size={15} />
                Add contact
              </button>
              <button className="btn" onClick={() => setEditing(true)}>
                <Icon name="edit" size={15} />
                Edit
              </button>
            </div>
          </div>

          <div className="leadhead__contacts">
            <a
              className="contact-link"
              href={lead.phone ? `tel:${lead.phone.replace(/\s/g, '')}` : undefined}
              aria-disabled={!lead.phone}
            >
              <Icon name="phone" size={15} />
              <span className="contact-link__value">{lead.phone || 'No number'}</span>
            </a>
            <a
              className="contact-link"
              href={lead.phone ? `https://wa.me/${lead.phone.replace(/\D/g, '')}` : undefined}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!lead.phone}
            >
              <Icon name="message" size={15} />
              <span className="contact-link__value">WhatsApp</span>
            </a>
            <a
              className="contact-link"
              href={`tel:${lead.phone.replace(/\s/g, '')}`}
            >
              <Icon name="send" size={15} />
              <span className="contact-link__value">Call again</span>
            </a>
          </div>
        </header>

        {recent && (
          <div className="alert alert--warn" style={{ marginBottom: 16 }}>
            <Icon name="alert" size={16} style={{ marginTop: 1, flexShrink: 0 }} />
            <span>
              <strong>{partnerName(recent.partnerId)}</strong> contacted this lead{' '}
              {formatDaySmart(recent.at).toLowerCase()} at {formatTime(recent.at)}
              {lead.lastResponse ? ` and wrote: “${lead.lastResponse}”` : ''}. Add to that instead of
              starting a new thread.
            </span>
            <span className="alert__actions">
              <button className="btn btn--sm" onClick={() => setContacting(true)}>
                Add to it
              </button>
            </span>
          </div>
        )}

        <section className="lastcontact">
          <div className="lastcontact__head">
            <Icon name="history" size={16} style={{ color: 'var(--accent)' }} />
            <span className="lastcontact__title">Last contact</span>
            {lead.lastContacted && (
              <span className="lastcontact__stamp tnum">{formatStamp(lead.lastContacted)}</span>
            )}
          </div>

          {lead.lastContacted ? (
            <div className="lastcontact__body">
              <div className="lc-block">
                <div className="lc-key">Contacted by</div>
                <div className="row" style={{ gap: 8 }}>
                  <Avatar partnerId={lead.lastContactedBy} />
                  <div>
                    <div className="lc-value">{partnerName(lead.lastContactedBy)}</div>
                    <div className="faint" style={{ fontSize: 12 }}>
                      {methodLabel(lead.lastContactMethod)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lc-block">
                <div className="lc-key">Response</div>
                <p className="lc-quote">{lead.lastResponse}</p>
                <div className="faint" style={{ fontSize: 12, marginTop: 6 }}>
                  {responseTypeLabel(lead.lastResponseType)}
                </div>
              </div>

              <div className="lc-grid">
                <div className="lc-block">
                  <div className="lc-key">Next action</div>
                  {lead.nextAction ? (
                    <div className="lc-value">{nextActionLabel(lead.nextAction)}</div>
                  ) : (
                    <div className="missing" style={{ fontSize: 14 }}>
                      <Icon name="alert" size={14} />
                      No next action set
                    </div>
                  )}
                </div>
                <div className="lc-block">
                  <div className="lc-key">Follow-up</div>
                  {lead.followUpDate ? (
                    <div className="lc-value tnum">{followUpLabel(lead.followUpDate)}</div>
                  ) : (
                    <div className="lc-value lc-value--muted">No follow-up scheduled</div>
                  )}
                </div>
                <div className="lc-block">
                  <div className="lc-key">Last updated</div>
                  <div className="lc-value tnum" style={{ fontSize: 13.5 }}>
                    {relativeTime(lead.updatedAt)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="lastcontact__body">
              <div className="lc-block">
                <div className="lc-key">Contacted by</div>
                <div className="lc-value lc-value--muted">Never contacted</div>
              </div>
              <div className="lc-block">
                <div className="lc-key">Response</div>
                <div className="lc-value lc-value--muted">
                  No contact logged yet. Log the first call so the other partners know where this
                  lead stands.
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="detail-cols">
          <div className="card">
            <div className="card__head">
              <h2>Lead details</h2>
              <button className="btn btn--sm btn--ghost" style={{ marginLeft: 'auto' }} onClick={() => setEditing(true)}>
                <Icon name="edit" size={14} />
                Edit
              </button>
            </div>
            <div className="card__body">
              <dl className="kv">
                <dt>Name</dt>
                <dd>{lead.name}</dd>
                <dt>Number</dt>
                <dd className="tnum">{lead.phone}</dd>
                <dt>Came from</dt>
                <dd>{sourceLabel(lead.source)}</dd>
                <dt>Status</dt>
                <dd>
                  <StatusChip status={lead.status} />
                </dd>
                <dt>Assigned to</dt>
                <dd>
                  <Avatar partnerId={lead.assignedPartner} size="sm" />
                  <span style={{ marginLeft: 7 }}>{partnerName(lead.assignedPartner)}</span>
                </dd>
                <dt>Added</dt>
                <dd className="tnum">
                  {formatStamp(lead.createdAt)}{' '}
                  <span className="faint">by {partnerName(lead.createdBy)}</span>
                </dd>
              </dl>
            </div>
          </div>

          <div className="card">
            <div className="card__head">
              <h2>Communication timeline</h2>
              <span className="section__count" style={{ marginLeft: 'auto' }}>
                {interactions.length} contact{interactions.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="card__body">
              {interactions.length === 0 ? (
                <EmptyState
                  icon="history"
                  title="No conversations logged yet"
                  hint="Every call, WhatsApp message and meeting shows up here in order, so nobody has to rely on memory."
                  action={
                    <button className="btn btn--primary" onClick={() => setContacting(true)}>
                      Log the first contact
                    </button>
                  }
                />
              ) : (
                <div className="timeline">
                  {interactions.map((item) => (
                    <div className="tl-item" key={item.id}>
                      <span className="tl-item__dot">
                        <Icon name={item.contactMethod === 'phone_call' ? 'phone' : item.contactMethod === 'email' ? 'mail' : 'message'} size={13} />
                      </span>
                      <div className="tl-card">
                        <div className="tl-card__head">
                          <Avatar partnerId={item.partnerId} size="sm" />
                          <strong style={{ fontSize: 13.5 }}>{partnerName(item.partnerId)}</strong>
                          <span className="chip chip--plain">{methodLabel(item.contactMethod)}</span>
                          <span className="tl-card__time tnum">{formatTime(item.createdAt)}</span>
                        </div>

                        <div className="tl-card__label">Response</div>
                        <p className="tl-card__text">{item.response}</p>
                        <div className="faint" style={{ fontSize: 12, marginTop: 3 }}>
                          {responseTypeLabel(item.responseType)}
                        </div>

                        {item.nextAction && (
                          <>
                            <div className="tl-card__label">Next action</div>
                            <p className="tl-card__text">{nextActionLabel(item.nextAction)}</p>
                          </>
                        )}

                        {item.followUpDate && (
                          <div className="faint tnum" style={{ fontSize: 12, marginTop: 6 }}>
                            Follow-up set for {followUpLabel(item.followUpDate)}
                          </div>
                        )}

                        {item.notes && <div className="tl-card__notes">{item.notes}</div>}

                        <div className="faint" style={{ fontSize: 11.5, marginTop: 8 }}>
                          {formatDaySmart(item.createdAt)} · {formatDay(item.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {contacting && <ContactModal lead={lead} onClose={() => setContacting(false)} />}
      {editing && <LeadFormModal lead={lead} onClose={() => setEditing(false)} />}
    </>
  );
}
