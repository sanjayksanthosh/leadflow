import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { LeadStatus } from '../types';
import { useCrm } from '../state/store';
import { STATUS_MAP } from '../lib/constants';
import { greeting } from '../lib/dates';
import { dashboardCounts, sortByUrgency } from '../lib/selectors';
import { LeadFormModal } from '../components/LeadFormModal';
import { LeadList } from '../components/LeadList';
import { EmptyState, Icon } from '../components/ui';

const CARDS: { status: LeadStatus | null; label: string }[] = [
  { status: null, label: 'All leads' },
  { status: 'new', label: 'New' },
  { status: 'contacted', label: 'Contacted' },
  { status: 'waiting', label: 'Waiting' },
  { status: 'interested', label: 'Interested' },
  { status: 'followup', label: 'Follow-up' },
  { status: 'converted', label: 'Converted' },
];

export function Dashboard() {
  const { data, currentPartner } = useCrm();
  const [adding, setAdding] = useState(false);
  const [picked, setPicked] = useState<LeadStatus | null>(null);

  const counts = useMemo(() => dashboardCounts(data.leads), [data.leads]);
  const all = useMemo(() => sortByUrgency(data.leads), [data.leads]);
  const rows = picked ? all.filter((l) => l.status === picked) : all;

  const mine = all.filter((l) => l.assignedPartner === currentPartner?.id).length;

  const countFor = (status: LeadStatus | null) =>
    status ? data.leads.filter((l) => l.status === status).length : data.leads.length;

  return (
    <>
      <main className="page">
        <header className="page__head">
          <div className="page__title-group">
            <h1>
              {greeting()}, {currentPartner?.name?.split(' ')[0]}
            </h1>
            <p className="page__sub">
              {counts.total === 0
                ? 'Add your first lead to get started.'
                : `${counts.due} follow-up${counts.due === 1 ? '' : 's'} need attention · ${mine} assigned to you`}
            </p>
          </div>
          <div className="page__actions">
            <button className="btn btn--primary" onClick={() => setAdding(true)}>
              <Icon name="plus" size={16} />
              Add new lead
            </button>
          </div>
        </header>

        <div className="stat-grid">
          {CARDS.map((c) => (
            <button
              key={c.label}
              className={picked === c.status ? 'stat stat--on' : 'stat'}
              aria-pressed={picked === c.status}
              onClick={() => setPicked(picked === c.status ? null : c.status)}
            >
              <span className="stat__label">
                <span className="stat__dot" style={{ background: c.status ? STATUS_MAP[c.status].dot : 'var(--text-3)' }} />
                {c.label}
              </span>
              <span className="stat__value">{countFor(c.status)}</span>
            </button>
          ))}
        </div>

        <section className="section">
          <div className="section__head">
            <h2>
              {picked ? `${STATUS_MAP[picked].label} leads` : 'All leads'}
              <span className="section__count">{rows.length}</span>
            </h2>
            <Link className="link" to="/leads">
              Open leads page
            </Link>
          </div>

          {data.leads.length === 0 ? (
            <div className="table-wrap">
              <EmptyState
                icon="newLeads"
                title="No leads yet"
                hint="Add a lead with just a name, a number and where it came from."
                action={
                  <button className="btn btn--primary" onClick={() => setAdding(true)}>
                    <Icon name="newLeads" size={15} />
                    Add your first lead
                  </button>
                }
              />
            </div>
          ) : (
            <div className="table-wrap">
              <LeadList leads={rows} />
            </div>
          )}

          {data.leads.length > 0 && rows.length === 0 && (
            <div className="table-wrap">
              <EmptyState
                icon="search"
                title={`Nothing in ${STATUS_MAP[picked!].label}`}
                hint="Pick another status above, or clear the filter."
                action={
                  <button className="btn" onClick={() => setPicked(null)}>
                    Show all leads
                  </button>
                }
              />
            </div>
          )}
        </section>

        {counts.missingNextAction > 0 && (
          <p className="faint" style={{ display: 'flex', gap: 7, alignItems: 'center', marginTop: 14 }}>
            <Icon name="alert" size={14} />
            {counts.missingNextAction} lead{counts.missingNextAction === 1 ? '' : 's'} logged a response but
            no next action — set one so nothing slips.
          </p>
        )}
      </main>

      {adding && <LeadFormModal onClose={() => setAdding(false)} />}
    </>
  );
}