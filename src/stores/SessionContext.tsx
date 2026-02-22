import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface SessionContextType {
  tableId: string | null;
  tableNumber: number | null;
  sessionId: string | null;
  qrToken: string | null;
  setSession: (tableId: string, tableNumber: number, sessionId: string, qrToken: string) => void;
  clearSession: () => void;
  isSessionValid: () => boolean;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [tableId, setTableId] = useState<string | null>(() => {
    return sessionStorage.getItem('tableId');
  });
  const [tableNumber, setTableNumber] = useState<number | null>(() => {
    const stored = sessionStorage.getItem('tableNumber');
    return stored ? parseInt(stored, 10) : null;
  });
  const [sessionId, setSessionId] = useState<string | null>(() => {
    return sessionStorage.getItem('sessionId');
  });
  const [qrToken, setQrToken] = useState<string | null>(() => {
    return sessionStorage.getItem('qrToken');
  });

  const setSession = useCallback((tableId: string, tableNumber: number, sessionId: string, qrToken: string) => {
    setTableId(tableId);
    setTableNumber(tableNumber);
    setSessionId(sessionId);
    setQrToken(qrToken);
    sessionStorage.setItem('tableId', tableId);
    sessionStorage.setItem('tableNumber', tableNumber.toString());
    sessionStorage.setItem('sessionId', sessionId);
    sessionStorage.setItem('qrToken', qrToken);
  }, []);

  const clearSession = useCallback(() => {
    setTableId(null);
    setTableNumber(null);
    setSessionId(null);
    setQrToken(null);
    sessionStorage.removeItem('tableId');
    sessionStorage.removeItem('tableNumber');
    sessionStorage.removeItem('sessionId');
    sessionStorage.removeItem('qrToken');
  }, []);

  const isSessionValid = useCallback(() => {
    return tableId !== null && sessionId !== null;
  }, [tableId, sessionId]);

  return (
    <SessionContext.Provider value={{
      tableId,
      tableNumber,
      sessionId,
      qrToken,
      setSession,
      clearSession,
      isSessionValid,
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
