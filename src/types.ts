export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

export interface RestaurantTable {
  id: string | number;
  table_number: string;
  capacity: number;
  status: TableStatus;
  section?: string;
  active_order_id?: string | null;
  customer_name?: string | null;
  total_amount?: number;
  updated_at?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  item_notes?: string;
}

export interface Order {
  id: string;
  created_at: string;
  placed_at_ist?: string;
  token: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  customer_name?: string;
  customer_phone?: string;
  table_id?: string | number;
  gstin?: string;
  order_type?: 'dine_in' | 'takeaway' | 'delivery' | 'aggregator';
  aggregator_platform?: 'swiggy' | 'zomato' | 'ubereats' | 'magicpin' | string;
  notes?: string;
  custom_instructions?: string;
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

