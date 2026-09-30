import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type {
  ContactDraft,
  Interaction,
  Lead,
  LeadDraft,
  LeadStatus,
  Partner,
  PartnerId,
} from '../types';
import { PARTNERS } from '../lib/constants';
import { clearData, loadData, saveData, SCHEMA_VERSION, type AppData } from '../lib/storage';
import { applyInteraction, buildInteraction, newId } from '../lib/leadState';

type Action =
  | { type: 'signIn'; partnerId: PartnerId }
  | { type: 'signOut' }
  | { type: 'lead/create'; lead: Lead }
  | { type: 'lead/update'; leadId: string; patch: Partial<LeadDraft> }
  | { type: 'lead/setStatus'; leadId: string; status: LeadStatus }
  | { type: 'contact/add'; lead: Lead; interaction: Interaction }
  | { type: 'data/reset' };

function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'signIn':
      return { ...state, currentPartnerId: action.partnerId };

    case 'signOut':
      return { ...state, currentPartnerId: null };

    case 'lead/create':
      return { ...state, leads: [action.lead, ...state.leads] };

    case 'lead/update': {
      const lead = state.leads.find((l) => l.id === action.leadId);
      if (!lead) return state;
      const updated: Lead = {
        ...lead,
        ...action.patch,
        name: action.patch.name?.trim() ?? lead.name,
        phone: action.patch.phone?.trim() ?? lead.phone,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        leads: state.leads.map((l) => (l.id === lead.id ? updated : l)),
      };
    }

    case 'lead/setStatus': {
      const lead = state.leads.find((l) => l.id === action.leadId);
      if (!lead || lead.status === action.status) return state;
      const closed = action.status === 'converted' || action.status === 'lost' || action.status === 'not_interested';
      const updated: Lead = {
        ...lead,
        status: action.status,
        followUpDate: closed ? null : lead.followUpDate,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        leads: state.leads.map((l) => (l.id === lead.id ? updated : l)),
      };
    }

    case 'contact/add':
      return {
        ...state,
        leads: state.leads.map((l) => (l.id === action.lead.id ? action.lead : l)),
        interactions: [action.interaction, ...state.interactions],
      };

    case 'data/reset':
      clearData();
      return { ...state, leads: [], interactions: [] };

    default:
      return state;
  }
}

/** No demo data — a fresh install starts empty, with the three partners ready. */
function init(): AppData {
  const empty: AppData = {
    version: SCHEMA_VERSION,
    partners: PARTNERS,
    leads: [],
    interactions: [],
    currentPartnerId: null,
  };
  return loadData() ?? empty;
}

export interface CrmActions {
  signIn: (partnerId: PartnerId) => void;
  signOut: () => void;
  createLead: (draft: LeadDraft) => Lead;
  updateLead: (leadId: string, patch: Partial<LeadDraft>) => void;
  setStatus: (leadId: string, status: LeadStatus) => void;
  logContact: (leadId: string, draft: ContactDraft) => void;
  clearLeads: () => void;
}

interface CrmContextValue {
  data: AppData;
  currentPartner: Partner | null;
  actions: CrmActions;
}

const CrmContext = createContext<CrmContextValue | null>(null);

/** Builds a brand new lead, stamped with whoever is signed in. */
function draftToLead(draft: LeadDraft, assignedTo: PartnerId): Lead {
  const iso = new Date().toISOString();
  return {
    id: newId('lead'),
    name: draft.name.trim(),
    phone: draft.phone.trim(),
    source: draft.source,
    status: draft.status,
    assignedPartner: assignedTo,
    lastContacted: null,
    lastContactedBy: null,
    lastContactMethod: null,
    lastResponse: null,
    lastResponseType: null,
    nextAction: null,
    followUpDate: null,
    createdBy: assignedTo,
    createdAt: iso,
    updatedAt: iso,
  };
}

export function CrmProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, init);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const currentPartner = useMemo(
    () => data.partners.find((p) => p.id === data.currentPartnerId) ?? null,
    [data.partners, data.currentPartnerId],
  );

  const actions = useMemo<CrmActions>(() => {
    const me = data.currentPartnerId;

    return {
      signIn: (partnerId) => dispatch({ type: 'signIn', partnerId }),
      signOut: () => dispatch({ type: 'signOut' }),

      createLead: (draft) => {
        const lead = draftToLead(draft, me ?? 'p1');
        dispatch({ type: 'lead/create', lead });
        return lead;
      },

      updateLead: (leadId, patch) => dispatch({ type: 'lead/update', leadId, patch }),

      setStatus: (leadId, status) => dispatch({ type: 'lead/setStatus', leadId, status }),

      logContact: (leadId, draft) => {
        const lead = data.leads.find((l) => l.id === leadId);
        if (!lead) return;
        const interaction = buildInteraction(leadId, me ?? 'p1', draft);
        dispatch({ type: 'contact/add', lead: applyInteraction(lead, interaction), interaction });
      },

      clearLeads: () => dispatch({ type: 'data/reset' }),
    };
  }, [data.currentPartnerId, data.leads]);

  const value = useMemo<CrmContextValue>(
    () => ({ data, currentPartner, actions }),
    [data, currentPartner, actions],
  );

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm(): CrmContextValue {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error('useCrm must be used inside CrmProvider');
  return ctx;
}
