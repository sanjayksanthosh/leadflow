import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Lead, LeadStatus, PartnerId } from '../types';
import { STATUSES } from '../lib/constants';
import { filterLeads, type FollowUpBucket } from '../lib/selectors';
import { useCrm } from '../state/store';
import { ContactModal } from '../components/ContactModal';
import { LeadFormModal } from '../components/LeadFormModal';
import { LeadList } from '../components/LeadList';
import { EmptyState, Icon } from '../components/ui';

const FOLLOW_UP_OPTIONS: { value: FollowUpBucket | 'all'; label: string }[] = [
  { value: 'all', label: 'Any follow-up' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'none', label: 'None set' },
];

export function Leads() {
  const { data } = useCrm();
  const [params, setParams] = useSearchParams();
  const [adding, setAdding] = useState(false);
  const [contacting, setContacting] = useState<Lead | null>(null);

  const status = (params.get('status') ?? 'all') as LeadStatus | 'all';
  const partner = (params.get('partner') ?? 'all') as PartnerId | 'all';
  const followUp = (params.get('followUp') ?? 'all') as FollowUpBucket | 'all';
  const query = params.get('q') ?? '';

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const rows = useMemo(
    () => filterLeads(data.leads, { query, status, partner, followUp }),
    [data.leads, query, status, partner, followUp],
  );

  const activeFilters = [status !== 'all', partner !== 'all', followUp !== 'all', Boolean(query)].filter(
    Boolean,
  ).length;

  return (
    <>
      <main className="page">
        <header className="page__head">
          <div className="page__title-group">
            <h1>Leads</h1>
            <p className="page__sub">
              {rows.length} of {data.leads.length} leads · soonest follow-up first
            </p>
          </div>
          <div className="page__actions">
            <button className="btn btn--primary" onClick={() => setAdding(true)}>
              <Icon name="plus" size={16} />
              Add new lead
            </button>
          </div>
        </header>

        <div className="filterbar">
          <div className="filterbar__search">
            <Icon name="search" size={15} />
            <input
              className="input"
              value={query}
              placeholder="Search name or number"
              aria-label="Search leads"
              onChange={(e) => setParam('q', e.target.value)}
            />
          </div>

          <select
            className="select select--filter"
            value={status}
            aria-label="Filter by status"
            onChange={(e) => setParam('status', e.target.value)}
          >
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            className="select select--filter"
            value={partner}
            aria-label="Filter by partner"
            onChange={(e) => setParam('partner', e.target.value)}
          >
            <option value="all">All partners</option>
            {data.partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            className="select select--filter"
            value={followUp}
            aria-label="Filter by follow-up"
            onChange={(e) => setParam('followUp', e.target.value)}
          >
            {FOLLOW_UP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {activeFilters > 0 && (
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => setParams(new URLSearchParams(), { replace: true })}
            >
              <Icon name="x" size={14} />
              Clear {activeFilters}
            </button>
          )}
        </div>

        <div className="table-wrap">
          {rows.length > 0 && <LeadList leads={rows} onContact={setContacting} />}

          {rows.length === 0 && (
            <EmptyState
              icon={data.leads.length === 0 ? 'newLeads' : 'search'}
              title={data.leads.length === 0 ? 'No leads yet' : 'No leads match these filters'}
              hint={
                data.leads.length === 0
                  ? 'Add a lead with just a name, a number and where it came from.'
                  : 'Try clearing the filters, or search by phone number instead of name.'
              }
              action={
                data.leads.length === 0 ? (
                  <button className="btn btn--primary" onClick={() => setAdding(true)}>
                    <Icon name="newLeads" size={15} />
                    Add your first lead
                  </button>
                ) : (
                  <button className="btn" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                    Clear filters
                  </button>
                )
              }
            />
          )}
        </div>
      </main>

      {contacting && <ContactModal lead={contacting} onClose={() => setContacting(null)} />}
      {adding && <LeadFormModal onClose={() => setAdding(false)} />}
    </>
  );
}
