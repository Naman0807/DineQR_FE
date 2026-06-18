import type { MenuItem, MenuItemWithCategory, Order, OrderItem, Bill, BillWithOrders, Payment, PaymentCreate } from '../types';
import apiClient from './apiClient';
import { getToken, setToken, removeToken } from './tokenService';
import { getSession } from './sessionStore';

export { getToken, setToken, removeToken };

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

function transformPayment(payment: any): Payment {
  return {
    ...payment,
    amount: parseFloat(payment.amount) || 0,
  };
}

function transformBill(bill: any): Bill {
  return {
    ...bill,
    subtotal: parseFloat(bill.subtotal) || 0,
    tax_amount: parseFloat(bill.tax_amount) || 0,
    discount_amount: parseFloat(bill.discount_amount) || 0,
    final_total: parseFloat(bill.final_total) || 0,
    table_number: bill.table_number || (bill.session && bill.session.table ? bill.session.table.table_number : undefined),
    payments: (bill.payments || []).map(transformPayment),
  };
}

function transformBillWithOrders(bill: any): BillWithOrders {
  return {
    ...transformBill(bill),
    orders: (bill.orders || []).map(transformOrder),
  };
}

export const api = {
  auth: {
    login: async (data: import('../types').LoginRequest): Promise<import('../types').AuthResponse> => {
      const response = await apiClient.post<import('../types').AuthResponse>('/api/auth/login', data);
      const authData = response.data;
      if (!authData.access_token) {
        throw new Error('Login response missing access token');
      }
      setToken(authData.access_token);
      return authData;
    },
    register: async (data: import('../types').RegisterRequest): Promise<import('../types').AuthResponse> => {
      const response = await apiClient.post<import('../types').AuthResponse>('/api/auth/register', data);
      const authData = response.data;
      if (authData.access_token) {
        setToken(authData.access_token);
      }
      return authData;
    },
    getMe: async () => {
      const response = await apiClient.get<import('../types').User>('/api/auth/me');
      return response.data;
    },
    logout: () => {
      removeToken();
    },
  },

  tables: {
    getAll: async () => {
      const response = await apiClient.get<import('../types').Table[]>('/api/tables/');
      return response.data;
    },
    getById: async (id: string) => {
      const response = await apiClient.get<import('../types').Table>(`/api/tables/${id}`);
      return response.data;
    },
    getByToken: async (token: string, restaurantSlug?: string) => {
      const base = restaurantSlug ? `/api/tables/public/${restaurantSlug}` : '/api/tables';
      const response = await apiClient.get<import('../types').Table>(`${base}/by-token/${token}`);
      return response.data;
    },
    create: async (data: import('../types').TableCreate) => {
      const response = await apiClient.post<import('../types').TableWithQR>('/api/tables/', data);
      return response.data;
    },
    getWithQR: async (id: string) => {
      const response = await apiClient.get<import('../types').TableWithQR>(`/api/tables/${id}/qr`);
      return response.data;
    },
    delete: (id: string) => apiClient.delete(`/api/tables/${id}`),
    getOrCreateSession: async (token: string, restaurantSlug?: string) => {
      const base = restaurantSlug ? `/api/tables/public/${restaurantSlug}` : '/api/tables';
      const response = await apiClient.post<import('../types').SessionResponse>(`${base}/${token}/session`);
      return response.data;
    },
  },

  menu: {
    getCategories: async (restaurantSlug?: string) => {
      const base = restaurantSlug ? `/api/menu/public/${restaurantSlug}` : '/api/menu';
      const response = await apiClient.get<import('../types').MenuCategory[]>(`${base}/categories`);
      return response.data;
    },
    createCategory: async (data: import('../types').MenuCategoryCreate) => {
      const response = await apiClient.post<import('../types').MenuCategory>(`/api/menu/categories`, data);
      return response.data;
    },
    updateCategory: async (id: string, data: import('../types').MenuCategoryUpdate) => {
      const response = await apiClient.put<import('../types').MenuCategory>(`/api/menu/categories/${id}`, data);
      return response.data;
    },
    deleteCategory: (id: string) => apiClient.delete(`/api/menu/categories/${id}`),

    getItems: async (availableOnly = false, restaurantSlug?: string): Promise<MenuItemWithCategory[]> => {
      const base = restaurantSlug ? `/api/menu/public/${restaurantSlug}` : '/api/menu';
      const response = await apiClient.get<any[]>(`${base}/items`, {
        params: { available_only: availableOnly }
      });
      return response.data.map(transformMenuItemWithCategory);
    },
    getItemsByCategory: async (categoryId: string): Promise<MenuItem[]> => {
      const response = await apiClient.get<any[]>(`/api/menu/items/category/${categoryId}`);
      return response.data.map(transformMenuItem);
    },
    createItem: async (data: import('../types').MenuItemCreate): Promise<MenuItem> => {
      const response = await apiClient.post<any>(`/api/menu/items`, data);
      return transformMenuItem(response.data);
    },
    updateItem: async (id: string, data: import('../types').MenuItemUpdate): Promise<MenuItem> => {
      const response = await apiClient.put<any>(`/api/menu/items/${id}`, data);
      return transformMenuItem(response.data);
    },
    deleteItem: (id: string) => apiClient.delete(`/api/menu/items/${id}`),
    toggleAvailability: async (id: string, isAvailable: boolean): Promise<MenuItem> => {
      const response = await apiClient.patch<any>(`/api/menu/items/${id}/availability`, null, {
        params: { is_available: isAvailable }
      });
      return transformMenuItem(response.data);
    },
  },

  orders: {
    create: async (data: import('../types').OrderCreate, restaurantSlug?: string): Promise<Order> => {
      const base = restaurantSlug ? `/api/orders/${restaurantSlug}` : '/api/orders';
      const { customerToken } = getSession();
      const response = await apiClient.post<any>(`${base}/`, data, {
        headers: customerToken ? { Authorization: `Bearer ${customerToken}` } : {},
      });
      return transformOrder(response.data);
    },
    getBySession: async (sessionId: string, restaurantSlug?: string): Promise<Order[]> => {
      const base = restaurantSlug ? `/api/orders/${restaurantSlug}` : '/api/orders';
      const response = await apiClient.get<any[]>(`${base}/session/${sessionId}`);
      return response.data.map(transformOrder);
    },
    getActive: async (): Promise<Order[]> => {
      const response = await apiClient.get<any[]>('/api/orders/active');
      return response.data.map(transformOrder);
    },
    getById: async (id: string, restaurantSlug?: string): Promise<Order> => {
      const base = restaurantSlug ? `/api/orders/${restaurantSlug}` : '/api/orders';
      const response = await apiClient.get<any>(`${base}/${id}`);
      return transformOrder(response.data);
    },
    updateStatus: async (id: string, data: import('../types').OrderUpdate): Promise<Order> => {
      const response = await apiClient.patch<any>(`/api/orders/${id}/status`, data);
      return transformOrder(response.data);
    },
    getSessionWithOrders: async (sessionId: string, restaurantSlug?: string): Promise<import('../types').OrderSessionWithOrders> => {
      const base = restaurantSlug ? `/api/orders/${restaurantSlug}` : '/api/orders';
      const response = await apiClient.get<any>(`${base}/sessions/${sessionId}`);
      return {
        ...response.data,
        orders: (response.data.orders || []).map(transformOrder),
      };
    },
  },

  customer: {
    register: async (data: import('../types').CustomerRegisterRequest): Promise<import('../types').CustomerAuthResponse> => {
      const response = await apiClient.post<import('../types').CustomerAuthResponse>('/api/customer/register', data);
      return response.data;
    },
    logout: () => {
      // Token cleanup handled by SessionContext.clearCustomerAuth / endSession
    },
  },

  bills: {
    create: async (data: import('../types').BillCreate): Promise<Bill> => {
      const response = await apiClient.post<any>(`/api/bills/`, data);
      return transformBill(response.data);
    },
    getBySession: async (sessionId: string, restaurantSlug?: string): Promise<BillWithOrders> => {
      const url = restaurantSlug
        ? `/api/bills/${restaurantSlug}/session/${sessionId}`
        : `/api/bills/by-session/${sessionId}`;
      const response = await apiClient.get<any>(url);
      return transformBillWithOrders(response.data);
    },
    getDetails: async (id: string): Promise<BillWithOrders> => {
      const response = await apiClient.get<any>(`/api/bills/${id}/details`);
      return transformBillWithOrders(response.data);
    },
    getById: async (id: string, restaurantSlug?: string): Promise<Bill> => {
      const base = restaurantSlug ? `/api/bills/${restaurantSlug}` : '/api/bills';
      const response = await apiClient.get<any>(`${base}/${id}`);
      return transformBill(response.data);
    },
    update: async (id: string, data: import('../types').BillUpdate): Promise<Bill> => {
      const response = await apiClient.patch<any>(`/api/bills/${id}`, data);
      return transformBill(response.data);
    },
    pay: async (id: string, paymentMethod: import('../types').PaymentMethod): Promise<Bill> => {
      const response = await apiClient.post<any>(`/api/bills/${id}/pay`, {
        payment_method: paymentMethod
      });
      return transformBill(response.data);
    },
    getAll: async (): Promise<Bill[]> => {
      const response = await apiClient.get<any[]>('/api/bills/');
      return response.data.map(transformBill);
    },
    downloadPDF: async (id: string): Promise<void> => {
      const response = await apiClient.get(`/api/bills/${id}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bill_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
    createPayment: async (billId: string, data: PaymentCreate): Promise<Payment> => {
      const response = await apiClient.post<any>(`/api/bills/${billId}/payments`, data);
      return transformPayment(response.data);
    },
    getPayments: async (billId: string): Promise<Payment[]> => {
      const response = await apiClient.get<any[]>(`/api/bills/${billId}/payments`);
      return response.data.map(transformPayment);
    },
    delete: async (id: string): Promise<void> => {
      await apiClient.delete(`/api/bills/${id}`);
    },
  },

  superadmin: {
    getRestaurants: async () => {
      const response = await apiClient.get<import('../types').RestaurantListResponse>('/api/superadmin/restaurants');
      return response.data.restaurants;
    },
    createRestaurant: async (data: import('../types').CreateRestaurantAdminRequest) => {
      const response = await apiClient.post<import('../types').RestaurantWithAdmin>('/api/superadmin/restaurants', data);
      return response.data;
    },
    updateRestaurant: async (id: string, data: import('../types').UpdateRestaurantAdminRequest) => {
      const response = await apiClient.put<import('../types').RestaurantWithAdmin>(`/api/superadmin/restaurants/${id}`, data);
      return response.data;
    },
    updateRestaurantStatus: async (id: string, status: string) => {
      const response = await apiClient.patch<import('../types').RestaurantWithAdmin>(`/api/superadmin/restaurants/${id}/status`, { status });
      return response.data;
    },
    deleteRestaurant: async (id: string) => {
      await apiClient.delete(`/api/superadmin/restaurants/${id}`);
    },
  },
  settings: {
    get: async () => {
      const response = await apiClient.get<import('../types').RestaurantSettings>('/api/settings');
      return response.data;
    },
    update: async (data: import('../types').UpdateSettingsRequest) => {
      const response = await apiClient.put<import('../types').RestaurantSettings>('/api/settings', data);
      return response.data;
    },
  },
};

export const wsUrl = API_BASE.replace('http', 'ws');
