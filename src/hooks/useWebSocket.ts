import { useEffect, useRef, useState } from 'react';
import { wsUrl, getToken } from '../services/api';
import type { WebSocketMessage, Order, OrderItem } from '../types';

type ConnectionType = 'admin' | 'table';

// Exponential backoff with jitter configuration
const INITIAL_DELAY = 1000; // 1 second
const MAX_DELAY = 30000; // 30 seconds
const MAX_RECONNECT_ATTEMPTS = 10;

function calculateBackoff(attempt: number): number {
  // Exponential backoff with jitter: min(1000 * 2^attempt + random, 30000)
  const baseDelay = Math.min(INITIAL_DELAY * Math.pow(2, attempt), MAX_DELAY);
  const jitter = Math.random() * 1000; // Add up to 1 second of jitter
  return Math.min(baseDelay + jitter, MAX_DELAY);
}

function transformOrderItem(item: any): OrderItem {
  return {
    ...item,
    unit_price: parseFloat(item.unit_price) || 0,
  };
}

function transformOrder(order: any): Order {
  return {
    ...order,
    total_amount: parseFloat(order.total_amount) || 0,
    items: (order.items || []).map(transformOrderItem),
  };
}

export function useWebSocket(type: 'admin'): {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
};

export function useWebSocket(type: 'table', tableId: string): {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
};

export function useWebSocket(type: ConnectionType, tableId?: string): {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
} {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef<number>(0);

  useEffect(() => {
    const connect = () => {
      let endpoint: string;

      if (type === 'admin') {
        const token = getToken();
        if (!token) {
          console.log('No auth token, skipping WebSocket connection');
          return;
        }
        endpoint = `${wsUrl}/ws/admin?token=${token}`;
      } else {
        endpoint = `${wsUrl}/ws/table/${tableId}`;
      }

      const ws = new WebSocket(endpoint);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttemptRef.current = 0; // Reset attempt counter on successful connection
        console.log(`WebSocket connected: ${type}`);
      };

      ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          const message: WebSocketMessage = {
            event: raw.event,
            data: raw.event === 'item_status_updated' 
              ? transformOrderItem(raw.data)
              : transformOrder(raw.data),
          };
          setLastMessage(message);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log(`WebSocket disconnected: ${type}`);
        
        // Implement exponential backoff with jitter
        if (reconnectAttemptRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = calculateBackoff(reconnectAttemptRef.current);
          console.log(`Reconnecting in ${Math.round(delay)}ms (attempt ${reconnectAttemptRef.current + 1})`);
          
          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectAttemptRef.current += 1;
            connect();
          }, delay);
        } else {
          console.error(`Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached`);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [type, tableId]);

  return { isConnected, lastMessage };
}
