import { useNavigate } from 'react-router-dom';
import type { Lead } from '../types';
import { partnerName, sourceLabel } from '../lib/constants';
import { followUpLabel } from '../lib/dates';
import { useCrm } from '../state/store';
import { Avatar, NextAction, StatusSelect } from './ui';

interface Props {
  leads: Lead[];
  onContact?: (lead: Lead) => void;
}

/**
 * The one lead list, shared by the home page and the leads page. Six columns on
 * purpose: the table used to carry ten, which forced a horizontal scrollbar and
 * squeezed the status chip into nothing. Source sits under the name, and last
 * contact / last response live on the lead page.
 */
export function LeadList({ leads, onContact }: Props) {
  const navigate = useNavigate();
  const { currentPartner, actions } = useCrm();

  return (
    <div className="table-scroll">
      <table className="table">
        <thead>
          <tr>
            <th>Lead</th>
            <th>Status</th>
            <th>Assigned to</th>
            <th>Next action</th>
            <th>Follow-up</th>
            {onContact && <th />}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const overdue = lead.followUpDate
              ? followUpLabel(lead.followUpDate).startsWith('Overdue')
              : false;
            return (
              <tr
                key={lead.id}
                className="is-clickable"
                tabIndex={0}
                onClick={() => navigate(`/leads/${lead.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate(`/leads/${lead.id}`);
                }}
              >
                <td data-label="">
                  <div className="lead-cell">
                    <span className="lead-cell__name">{lead.name}</span>
                    <span className="lead-cell__meta tnum">
                      {lead.phone} · {sourceLabel(lead.source)}
                    </span>
                  </div>
                </td>
                <td data-label="Status">
                  <StatusSelect
                    value={lead.status}
                    label={`Status for ${lead.name}`}
                    onChange={(status) => {
                      if (status === lead.status) return;
                      actions.setStatus(lead.id, status);
                    }}
                  />
                </td>
                <td data-label="Assigned to">
                  <span className="partner-tag">
                    <Avatar partnerId={lead.assignedPartner} size="sm" />
                    <span>
                      {lead.assignedPartner === currentPartner?.id
                        ? 'You'
                        : partnerName(lead.assignedPartner)}
                    </span>
                  </span>
                </td>
                <td data-label="Next action">
                  <NextAction value={lead.nextAction} compact />
                </td>
                <td
                  data-label="Follow-up"
                  className="tnum"
                  style={{ fontSize: 13, color: overdue ? 'var(--danger)' : undefined }}
                >
                  {lead.followUpDate ? followUpLabel(lead.followUpDate) : <span className="faint">Not set</span>}
                </td>
                {onContact && (
                  <td data-label="" className="cell-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn--sm" onClick={() => onContact(lead)}>
                      Log contact
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}