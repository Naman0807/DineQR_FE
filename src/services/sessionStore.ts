export const SESSION_KEY = 'dineqr_session';

export interface DiningSession {
  tableId: string | null;
  tableNumber: number | null;
  sessionId: string | null;
  qrToken: string | null;
  restaurantSlug: string | null;
  customerToken: string | null;
  customerName: string | null;
  customerPhone: string | null;
}

const defaults: DiningSession = {
  tableId: null,
  tableNumber: null,
  sessionId: null,
  qrToken: null,
  restaurantSlug: null,
  customerToken: null,
  customerName: null,
  customerPhone: null,
};

/**
 * Read the current dining session from localStorage.
 * Returns defaults if the key is missing or JSON is corrupt.
 */
export function getSession(): DiningSession {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return { ...defaults };
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return { ...defaults };
  }
}

/**
 * Fully overwrite the dining session in localStorage.
 */
export function saveSession(session: DiningSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/**
 * Merge a partial object into the current session and persist.
 * Returns the merged session for convenience.
 */
export function updateSession(partial: Partial<DiningSession>): DiningSession {
  const current = getSession();
  const next = { ...current, ...partial };
  saveSession(next);
  return next;
}

/**
 * Remove the dining session entirely from localStorage.
 */
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
