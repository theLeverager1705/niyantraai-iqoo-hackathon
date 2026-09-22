import type {
  Assessment,
  PrivacySettings,
  Project,
  ProjectUnderstanding,
  User,
} from '@/types';

/**
 * Local persistence.
 *
 * Everything NiyantraAI knows about a developer lives in their own browser in
 * the prototype. That is a product decision as much as a scope decision: the
 * privacy screen promises "your development data belongs to you", and the
 * storage layer is where that promise is either kept or broken. Every access
 * is guarded so private-mode browsers and blocked storage degrade to an
 * in-memory session rather than a crash.
 */

const STORAGE_KEY = 'niyantraai.state.v1';

export interface PersistedState {
  version: 1;
  mode: 'demo' | 'personal';
  user: User;
  project: Project | null;
  baseline: Assessment | null;
  assessments: Assessment[];
  understanding: ProjectUnderstanding | null;
  privacy: PrivacySettings;
  savedAt: string;
}

function storage(): Storage | null {
  try {
    const probe = '__niyantra__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadState(): PersistedState | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (parsed?.version !== 1 || !parsed.user) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveState(state: Omit<PersistedState, 'version' | 'savedAt'>): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...state, version: 1, savedAt: new Date().toISOString() }),
    );
  } catch {
    /* Quota or private mode - the session continues in memory. */
  }
}

export function clearState(): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to do */
  }
}

export function isStorageAvailable(): boolean {
  return storage() !== null;
}

/** Full export - the user can always take their data out. */
export function exportState(state: unknown, filename = 'niyantraai-export.json'): void {
  try {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    /* Download blocked - the Settings screen surfaces its own error state. */
  }
}
