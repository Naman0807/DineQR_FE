const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

import type { MenuItem, MenuItemWithCategory, Order, OrderItem, Bill, BillWithOrders } from '../types';

function transformMenuItem(item: any): MenuItem {
  return {
    ...item,
    price: parseFloat(item.price) || 0,
  };
}

function transformMenuItemWithCategory(item: any): MenuItemWithCategory {
  return {
    ...transformMenuItem(item),
    category: item.category,
  };
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

function transformBill(bill: any): Bill {
  return {
    ...bill,
    subtotal: parseFloat(bill.subtotal) || 0,
    tax_amount: parseFloat(bill.tax_amount) || 0,
    discount_amount: parseFloat(bill.discount_amount) || 0,
    final_total: parseFloat(bill.final_total) || 0,
  };
}

function transformBillWithOrders(bill: any): BillWithOrders {
  return {
    ...transformBill(bill),
    orders: (bill.orders || []).map(transformOrder),
  };
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || 'An error occurred');
  }

  return response.json();
}

export const api = {
  tables: {
    getAll: () => fetchJson<import('../types').Table[]>(`${API_BASE}/api/tables/`),
    getById: (id: string) => fetchJson<import('../types').Table>(`${API_BASE}/api/tables/${id}`),
    getByToken: (token: string) => fetchJson<import('../types').Table>(`${API_BASE}/api/tables/by-token/${token}`),
    create: (data: import('../types').TableCreate) => fetchJson<import('../types').TableWithQR>(`${API_BASE}/api/tables/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getWithQR: (id: string) => fetchJson<import('../types').TableWithQR>(`${API_BASE}/api/tables/${id}/qr`),
    delete: (id: string) => fetch(`${API_BASE}/api/tables/${id}`, { method: 'DELETE' }),
    getOrCreateSession: (token: string) => fetchJson<import('../types').SessionResponse>(`${API_BASE}/api/tables/${token}/session`, {
      method: 'POST',
    }),
  },

  menu: {
    getCategories: () => fetchJson<import('../types').MenuCategory[]>(`${API_BASE}/api/menu/categories`),
    createCategory: (data: import('../types').MenuCategoryCreate) => fetchJson<import('../types').MenuCategory>(`${API_BASE}/api/menu/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateCategory: (id: string, data: import('../types').MenuCategoryUpdate) => fetchJson<import('../types').MenuCategory>(`${API_BASE}/api/menu/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    deleteCategory: (id: string) => fetch(`${API_BASE}/api/menu/categories/${id}`, { method: 'DELETE' }),
    
    getItems: async (availableOnly = false): Promise<MenuItemWithCategory[]> => {
      const data = await fetchJson<any[]>(`${API_BASE}/api/menu/items?available_only=${availableOnly}`);
      return data.map(transformMenuItemWithCategory);
    },
    getItemsByCategory: async (categoryId: string): Promise<MenuItem[]> => {
      const data = await fetchJson<any[]>(`${API_BASE}/api/menu/items/category/${categoryId}`);
      return data.map(transformMenuItem);
    },
    createItem: async (data: import('../types').MenuItemCreate): Promise<MenuItem> => {
      const result = await fetchJson<any>(`${API_BASE}/api/menu/items`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return transformMenuItem(result);
    },
    updateItem: async (id: string, data: import('../types').MenuItemUpdate): Promise<MenuItem> => {
      const result = await fetchJson<any>(`${API_BASE}/api/menu/items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return transformMenuItem(result);
    },
    deleteItem: (id: string) => fetch(`${API_BASE}/api/menu/items/${id}`, { method: 'DELETE' }),
    toggleAvailability: async (id: string, isAvailable: boolean): Promise<MenuItem> => {
      const result = await fetchJson<any>(`${API_BASE}/api/menu/items/${id}/availability?is_available=${isAvailable}`, {
        method: 'PATCH',
      });
      return transformMenuItem(result);
    },
  },

  orders: {
    create: async (data: import('../types').OrderCreate): Promise<Order> => {
      const result = await fetchJson<any>(`${API_BASE}/api/orders/`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return transformOrder(result);
    },
    getBySession: async (sessionId: string): Promise<Order[]> => {
      const data = await fetchJson<any[]>(`${API_BASE}/api/orders/session/${sessionId}`);
      return data.map(transformOrder);
    },
    getActive: async (): Promise<Order[]> => {
      const data = await fetchJson<any[]>(`${API_BASE}/api/orders/active`);
      return data.map(transformOrder);
    },
    getById: async (id: string): Promise<Order> => {
      const result = await fetchJson<any>(`${API_BASE}/api/orders/${id}`);
      return transformOrder(result);
    },
    updateStatus: async (id: string, data: import('../types').OrderUpdate): Promise<Order> => {
      const result = await fetchJson<any>(`${API_BASE}/api/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return transformOrder(result);
    },
    getSessionWithOrders: async (sessionId: string): Promise<import('../types').OrderSessionWithOrders> => {
      const result = await fetchJson<any>(`${API_BASE}/api/orders/sessions/${sessionId}`);
      return {
        ...result,
        orders: (result.orders || []).map(transformOrder),
      };
    },
  },

  bills: {
    create: async (data: import('../types').BillCreate): Promise<Bill> => {
      const result = await fetchJson<any>(`${API_BASE}/api/bills/`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return transformBill(result);
    },
    getBySession: async (sessionId: string): Promise<BillWithOrders> => {
      const result = await fetchJson<any>(`${API_BASE}/api/bills/session/${sessionId}`);
      return transformBillWithOrders(result);
    },
    getById: async (id: string): Promise<Bill> => {
      const result = await fetchJson<any>(`${API_BASE}/api/bills/${id}`);
      return transformBill(result);
    },
    update: async (id: string, data: import('../types').BillUpdate): Promise<Bill> => {
      const result = await fetchJson<any>(`${API_BASE}/api/bills/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return transformBill(result);
    },
    pay: async (id: string, paymentMethod: import('../types').PaymentMethod): Promise<Bill> => {
      const result = await fetchJson<any>(`${API_BASE}/api/bills/${id}/pay?payment_method=${paymentMethod}`, {
        method: 'POST',
      });
      return transformBill(result);
    },
    getAll: async (): Promise<Bill[]> => {
      const data = await fetchJson<any[]>(`${API_BASE}/api/bills/`);
      return data.map(transformBill);
    },
  },
};

export const wsUrl = API_BASE.replace('http', 'ws');
