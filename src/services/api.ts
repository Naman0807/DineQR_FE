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

export const TOKEN_KEY = 'auth_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function fetchWithAuthNoJson(url: string, options?: RequestInit): Promise<void> {
  const token = getToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (response.status === 401) {
    removeToken();
    throw new Error('Session expired. Please login again.');
  }

  if (response.status === 403) {
    const error = await response.json().catch(() => ({ detail: 'Access denied' }));
    throw new Error(error.detail || 'Access denied');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || 'An error occurred');
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (response.status === 401) {
    removeToken();
    if (!url.includes('/auth/')) {
      window.location.href = '/admin/login';
    }
    throw new Error('Session expired. Please login again.');
  }

  if (response.status === 403) {
    const error = await response.json().catch(() => ({ detail: 'Access denied' }));
    if (error.detail?.includes('pending') || error.detail?.includes('deactivated') || error.status === 'pending' || error.status === 'deactivated') {
      removeToken();
      window.location.href = '/admin/suspended';
    }
    throw new Error(error.detail || 'Access denied');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || 'An error occurred');
  }

  return response.json();
}

export const api = {
  auth: {
    login: async (data: import('../types').LoginRequest): Promise<import('../types').AuthResponse> => {
      const response = await fetchJson<import('../types').AuthResponse>(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.access_token) {
        throw new Error('Login response missing access token');
      }
      setToken(response.access_token);
      return response;
    },
    register: async (data: import('../types').RegisterRequest): Promise<import('../types').AuthResponse> => {
      const response = await fetchJson<import('../types').AuthResponse>(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (response.access_token) {
        setToken(response.access_token);
      }
      return response;
    },
    getMe: () => fetchJson<import('../types').User>(`${API_BASE}/api/auth/me`),
    logout: () => {
      removeToken();
    },
  },

  tables: {
    getAll: () => fetchJson<import('../types').Table[]>(`${API_BASE}/api/tables/`),
    getById: (id: string) => fetchJson<import('../types').Table>(`${API_BASE}/api/tables/${id}`),
    getByToken: (token: string, restaurantSlug?: string) => {
      const base = restaurantSlug ? `${API_BASE}/api/tables/public/${restaurantSlug}` : `${API_BASE}/api/tables`;
      return fetchJson<import('../types').Table>(`${base}/by-token/${token}`);
    },
    create: (data: import('../types').TableCreate) => fetchJson<import('../types').TableWithQR>(`${API_BASE}/api/tables/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getWithQR: (id: string) => fetchJson<import('../types').TableWithQR>(`${API_BASE}/api/tables/${id}/qr`),
    delete: (id: string) => fetchWithAuthNoJson(`${API_BASE}/api/tables/${id}`, { method: 'DELETE' }),
    getOrCreateSession: (token: string, restaurantSlug?: string) => {
      const base = restaurantSlug ? `${API_BASE}/api/tables/public/${restaurantSlug}` : `${API_BASE}/api/tables`;
      return fetchJson<import('../types').SessionResponse>(`${base}/${token}/session`, {
        method: 'POST',
      });
    },
  },

  menu: {
    getCategories: (restaurantSlug?: string) => {
      const base = restaurantSlug ? `${API_BASE}/api/menu/public/${restaurantSlug}` : `${API_BASE}/api/menu`;
      return fetchJson<import('../types').MenuCategory[]>(`${base}/categories`);
    },
    createCategory: (data: import('../types').MenuCategoryCreate) => fetchJson<import('../types').MenuCategory>(`${API_BASE}/api/menu/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateCategory: (id: string, data: import('../types').MenuCategoryUpdate) => fetchJson<import('../types').MenuCategory>(`${API_BASE}/api/menu/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    deleteCategory: (id: string) => fetchWithAuthNoJson(`${API_BASE}/api/menu/categories/${id}`, { method: 'DELETE' }),
    
    getItems: async (availableOnly = false, restaurantSlug?: string): Promise<MenuItemWithCategory[]> => {
      const base = restaurantSlug ? `${API_BASE}/api/menu/public/${restaurantSlug}` : `${API_BASE}/api/menu`;
      const data = await fetchJson<any[]>(`${base}/items?available_only=${availableOnly}`);
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
    deleteItem: (id: string) => fetchWithAuthNoJson(`${API_BASE}/api/menu/items/${id}`, { method: 'DELETE' }),
    toggleAvailability: async (id: string, isAvailable: boolean): Promise<MenuItem> => {
      const result = await fetchJson<any>(`${API_BASE}/api/menu/items/${id}/availability?is_available=${isAvailable}`, {
        method: 'PATCH',
      });
      return transformMenuItem(result);
    },
  },

  orders: {
    create: async (data: import('../types').OrderCreate, restaurantSlug?: string): Promise<Order> => {
      const base = restaurantSlug ? `${API_BASE}/api/orders/${restaurantSlug}` : `${API_BASE}/api/orders`;
      const result = await fetchJson<any>(`${base}/`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return transformOrder(result);
    },
    getBySession: async (sessionId: string, restaurantSlug?: string): Promise<Order[]> => {
      const base = restaurantSlug ? `${API_BASE}/api/orders/${restaurantSlug}` : `${API_BASE}/api/orders`;
      const data = await fetchJson<any[]>(`${base}/session/${sessionId}`);
      return data.map(transformOrder);
    },
    getActive: async (): Promise<Order[]> => {
      const data = await fetchJson<any[]>(`${API_BASE}/api/orders/active`);
      return data.map(transformOrder);
    },
    getById: async (id: string, restaurantSlug?: string): Promise<Order> => {
      const base = restaurantSlug ? `${API_BASE}/api/orders/${restaurantSlug}` : `${API_BASE}/api/orders`;
      const result = await fetchJson<any>(`${base}/${id}`);
      return transformOrder(result);
    },
    updateStatus: async (id: string, data: import('../types').OrderUpdate): Promise<Order> => {
      const result = await fetchJson<any>(`${API_BASE}/api/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return transformOrder(result);
    },
    getSessionWithOrders: async (sessionId: string, restaurantSlug?: string): Promise<import('../types').OrderSessionWithOrders> => {
      const base = restaurantSlug ? `${API_BASE}/api/orders/${restaurantSlug}` : `${API_BASE}/api/orders`;
      const result = await fetchJson<any>(`${base}/sessions/${sessionId}`);
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
    getBySession: async (sessionId: string, restaurantSlug?: string): Promise<BillWithOrders> => {
      const url = restaurantSlug
        ? `${API_BASE}/api/bills/${restaurantSlug}/session/${sessionId}`
        : `${API_BASE}/api/bills/by-session/${sessionId}`;
      const result = await fetchJson<any>(url);
      return transformBillWithOrders(result);
    },
    getById: async (id: string, restaurantSlug?: string): Promise<Bill> => {
      const base = restaurantSlug ? `${API_BASE}/api/bills/${restaurantSlug}` : `${API_BASE}/api/bills`;
      const result = await fetchJson<any>(`${base}/${id}`);
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

  superadmin: {
    getRestaurants: async () => {
      const result = await fetchJson<import('../types').RestaurantListResponse>(`${API_BASE}/api/superadmin/restaurants`);
      return result.restaurants;
    },
    createRestaurant: async (data: import('../types').CreateRestaurantAdminRequest) => {
      const result = await fetchJson<import('../types').RestaurantWithAdmin>(`${API_BASE}/api/superadmin/restaurants`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return result;
    },
    updateRestaurant: async (id: string, data: import('../types').UpdateRestaurantAdminRequest) => {
      const result = await fetchJson<import('../types').RestaurantWithAdmin>(`${API_BASE}/api/superadmin/restaurants/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return result;
    },
    updateRestaurantStatus: async (id: string, status: string) => {
      const result = await fetchJson<import('../types').RestaurantWithAdmin>(`${API_BASE}/api/superadmin/restaurants/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      return result;
    },
    deleteRestaurant: async (id: string) => {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/superadmin/restaurants/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
        throw new Error(error.detail || 'An error occurred');
      }
    },
  },
};

export const wsUrl = API_BASE.replace('http', 'ws');
