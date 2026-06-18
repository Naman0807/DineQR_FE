import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { getSession, updateSession, clearSession } from '../services/sessionStore';
import type { DiningSession } from '../services/sessionStore';

// ── Context type ──────────────────────────────────────────
interface SessionContextType {
  // Session state (sourced from localStorage)
  tableId: string | null;
  tableNumber: number | null;
  sessionId: string | null;
  qrToken: string | null;
  restaurantSlug: string | null;
  customerToken: string | null;
  customerName: string | null;
  customerPhone: string | null;

  // Derived flags
  isSessionValid: boolean;
  isCustomerAuthenticated: boolean;
  hasNoSession: boolean;

  // Actions
  setSession: (data: {
    tableId: string;
    tableNumber: number;
    sessionId: string;
    qrToken: string;
    restaurantSlug: string;
  }) => void;

  setCustomerAuth: (token: string, name: string, phone: string) => void;
  clearCustomerAuth: () => void;
  endSession: () => void;
}

// ── Default session values ────────────────────────────────
const defaultSession: DiningSession = {
  tableId: null,
  tableNumber: null,
  sessionId: null,
  qrToken: null,
  restaurantSlug: null,
  customerToken: null,
  customerName: null,
  customerPhone: null,
};

// ── Context ───────────────────────────────────────────────
const SessionContext = createContext<SessionContextType | null>(null);

// ── Synchronous bootstrap helper ──────────────────────────
// Runs ONCE during the initial render (before any child effects).
// Checks URL params for ?table= (QR token from scan) and localStorage.
function bootstrapSession(): { session: DiningSession; hadUrlToken: boolean } {
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('table');
  const stored = getSession();

  if (urlToken) {
    // QR scan detected — persist token to localStorage
    const merged = updateSession({ ...stored, qrToken: urlToken });
    return { session: merged, hadUrlToken: true };
  }

  if (stored.qrToken || stored.sessionId) {
    // No URL token, but we have a stored session — rehydrate
    return { session: stored, hadUrlToken: false };
  }

  // No session at all — clean slate
  return { session: { ...defaultSession }, hadUrlToken: false };
}

// ── Provider ──────────────────────────────────────────────
export function SessionProvider({ children }: { children: ReactNode }) {
  const [boot] = useState(bootstrapSession);
  const [session, setSessionState] = useState<DiningSession>(boot.session);

  // Strip URL params after first paint (must be in useEffect, not during render)
  useEffect(() => {
    if (boot.hadUrlToken) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [boot.hadUrlToken]);

  // Derived flags
  const isSessionValid = session.tableId !== null && session.sessionId !== null;
  const isCustomerAuthenticated = session.customerToken !== null;
  const hasNoSession = session.tableId === null && session.sessionId === null && session.qrToken === null;

  // ── Actions ───────────────────────────────────────────

  const setSession = useCallback(
    (data: { tableId: string; tableNumber: number; sessionId: string; qrToken: string; restaurantSlug: string }) => {
      const updated = updateSession(data);
      setSessionState(updated);
    },
    [],
  );

  const setCustomerAuth = useCallback((token: string, name: string, phone: string) => {
    const updated = updateSession({ customerToken: token, customerName: name, customerPhone: phone });
    setSessionState(updated);
  }, []);

  const clearCustomerAuth = useCallback(() => {
    const updated = updateSession({ customerToken: null, customerName: null, customerPhone: null });
    setSessionState(updated);
  }, []);

  const endSession = useCallback(() => {
    clearSession();
    setSessionState({ ...defaultSession });
  }, []);

  // ── Render ────────────────────────────────────────────
  return (
    <SessionContext.Provider
      value={{
        tableId: session.tableId,
        tableNumber: session.tableNumber,
        sessionId: session.sessionId,
        qrToken: session.qrToken,
        restaurantSlug: session.restaurantSlug,
        customerToken: session.customerToken,
        customerName: session.customerName,
        customerPhone: session.customerPhone,
        isSessionValid,
        isCustomerAuthenticated,
        hasNoSession,
        setSession,
        setCustomerAuth,
        clearCustomerAuth,
        endSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────
export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a <SessionProvider>');
  }
  return context;
}
