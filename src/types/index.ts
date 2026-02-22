export type TableStatus = 'available' | 'occupied';
export type SessionStatus = 'active' | 'closed';
export type OrderStatus = 'received' | 'preparing' | 'served';
export type OrderItemStatus = 'pending' | 'completed';
export type PaymentStatus = 'unpaid' | 'paid';
export type PaymentMethod = 'cash' | 'card' | 'upi';

export interface Table {
  id: string;
  table_number: number;
  qr_token: string;
  status: TableStatus;
  created_at: string;
}

export interface TableWithQR extends Table {
  qr_code_url: string;
}

export interface TableCreate {
  table_number: number;
}

export interface SessionResponse {
  table_id: string;
  table_number: number;
  session_id: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  display_order: number;
  created_at: string;
}

export interface MenuCategoryCreate {
  name: string;
  display_order?: number;
}

export interface MenuCategoryUpdate {
  name?: string;
  display_order?: number;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  is_available: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface MenuItemWithCategory extends MenuItem {
  category: MenuCategory;
}

export interface MenuItemCreate {
  category_id: string;
  name: string;
  description?: string;
  price: number;
  is_available?: boolean;
  image_url?: string;
}

export interface MenuItemUpdate {
  name?: string;
  description?: string;
  price?: number;
  is_available?: boolean;
  image_url?: string;
}

export interface OrderItem {
  id: string;
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
  special_instructions?: string;
  status: OrderItemStatus;
}

export interface OrderItemCreate {
  menu_item_id: string;
  quantity: number;
  special_instructions?: string;
}

export interface Order {
  id: string;
  session_id: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  table_id?: string;
  table_number?: number;
}

export interface OrderCreate {
  session_id: string;
  items: OrderItemCreate[];
}

export interface OrderUpdate {
  status: OrderStatus;
}

export interface OrderSession {
  id: string;
  table_id: string;
  table_number: number;
  session_status: SessionStatus;
  started_at: string;
  ended_at?: string;
}

export interface OrderSessionWithOrders extends OrderSession {
  orders: Order[];
}

export interface Bill {
  id: string;
  session_id: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  final_total: number;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  created_at: string;
  paid_at?: string;
}

export interface BillWithOrders extends Bill {
  orders: Order[];
}

export interface BillCreate {
  session_id: string;
  subtotal: number;
  tax_amount: number;
  discount_amount?: number;
}

export interface BillUpdate {
  discount_amount?: number;
  payment_status?: PaymentStatus;
  payment_method?: PaymentMethod;
}

export interface WebSocketMessage {
  event: 'order_created' | 'order_updated' | 'item_status_updated';
  data: Order | OrderItem;
}

export interface CartItem {
  menu_item: MenuItem;
  quantity: number;
  special_instructions?: string;
}
