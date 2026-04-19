export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  created_at: string;
  token: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  customer_name?: string;
  table_id?: string | number;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  discount_price?: number | null;
  category: string;
  image?: string;
  is_sold_out: boolean;
}
