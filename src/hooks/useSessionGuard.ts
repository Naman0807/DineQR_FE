import { useEffect, useCallback } from 'react';
import { message } from 'antd';
import { useSession } from '../stores/SessionContext';
import { api } from '../services/api';

/**
 * Session Guard Hook
 *
 * Verifies the current dining session is still valid on the backend.
 * Runs on mount and whenever the tab regains focus.
 *
 * - 401 / 403 / 404  → session invalid → clear + warn
 * - table status === 'available' → session closed → clear + warn
 * - otherwise → session still active → no-op
 */
export function useSessionGuard(): void {
  const { qrToken, restaurantSlug, isSessionValid, endSession } = useSession();

  const verifySession = useCallback(async () => {
    if (!qrToken || !restaurantSlug || !isSessionValid) return;

    try {
      const table = await api.tables.getByToken(qrToken, restaurantSlug);
      if (table.status === 'available') {
        endSession();
        message.warning('Your dining session has ended. Please scan the QR code again.');
      }
      // status === 'occupied' → session still valid → do nothing
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403 || status === 404) {
        endSession();
        message.warning('Session expired. Please scan the QR code again.');
      }
      // Other errors (network, 500) → ignore to avoid disrupting the user
    }
  }, [qrToken, restaurantSlug, isSessionValid, endSession]);

  // Run on mount
  useEffect(() => {
    verifySession();
  }, [verifySession]);

  // Run whenever tab regains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        verifySession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [verifySession]);
}
