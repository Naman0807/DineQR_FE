import { useEffect, useRef, useState } from 'react';
import { wsUrl } from '../services/api';
import type { WebSocketMessage, Order, OrderItem } from '../types';

type ConnectionType = 'admin' | 'table';

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

  useEffect(() => {
    const connect = () => {
      const endpoint = type === 'admin' 
        ? `${wsUrl}/ws/admin` 
        : `${wsUrl}/ws/table/${tableId}`;

      const ws = new WebSocket(endpoint);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
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
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, 3000);
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
