import type { Interaction, Lead, Partner, PartnerId } from '../types';

const STORAGE_KEY = 'leadflow:v3';
export const SCHEMA_VERSION = 3;

export interface AppData {
  version: number;
  partners: Partner[];
  leads: Lead[];
  interactions: Interaction[];
  currentPartnerId: PartnerId | null;
}

const memoryFallback = new Map<string, string>();

/**
 * localStorage is the MVP database. Everything goes through here so that swapping
 * in a real API later means reimplementing this one module.
 * Private-browsing modes throw on access, hence the in-memory fallback.
 */
function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return memoryFallback.get(STORAGE_KEY) ?? null;
  }
}

function writeRaw(value: string): void {
  memoryFallback.set(STORAGE_KEY, value);
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* storage unavailable — the in-memory copy above keeps the session alive */
  }
}

export function loadData(): AppData | null {
  const raw = readRaw();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed || parsed.version !== SCHEMA_VERSION) return null;
    if (!Array.isArray(parsed.leads) || !Array.isArray(parsed.interactions)) return null;
    return {
      version: parsed.version,
      partners: parsed.partners,
      leads: parsed.leads,
      interactions: parsed.interactions,
      currentPartnerId: parsed.currentPartnerId ?? null,
    };
  } catch {
    return null;
  }
}

export function saveData(data: AppData): void {
  writeRaw(JSON.stringify(data));
}

export function clearData(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  memoryFallback.delete(STORAGE_KEY);
}
