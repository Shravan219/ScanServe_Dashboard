import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export interface InboundWebhookLog {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  ip?: string;
  headers: Record<string, any>;
  raw_body: any;
  detected_platform: string;
  detected_source: string;
  order_id?: string;
  token?: string;
  item_count: number;
  total_amount: number;
  status_code: number;
  success: boolean;
  message: string;
  error?: string;
  duration_ms: number;
}

export interface ServerOrder {
  id: string;
  created_at: string;
  placed_at_ist?: string;
  token: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  total: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    item_notes?: string;
  }>;
  customer_name?: string;
  customer_phone?: string;
  table_id?: string | number;
  gstin?: string;
  order_type?: 'dine_in' | 'takeaway' | 'delivery' | 'aggregator';
  aggregator_platform?: 'swiggy' | 'zomato' | 'ubereats' | 'magicpin' | string;
  notes?: string;
  custom_instructions?: string;
}

// In-Memory circular store for active orders and logs
const memoryOrders = new Map<string, ServerOrder>();
const inboundLogs: InboundWebhookLog[] = [];
const MAX_LOGS = 100;

// SSE Listeners (Clients connected to Server-Sent Events)
type SSEClient = {
  id: string;
  send: (data: string) => void;
};
const sseClients = new Map<string, SSEClient>();

export function registerSSEClient(id: string, send: (data: string) => void) {
  sseClients.set(id, { id, send });
  console.log(`[SSE] Client connected: ${id} (Total: ${sseClients.size})`);
}

export function unregisterSSEClient(id: string) {
  sseClients.delete(id);
  console.log(`[SSE] Client disconnected: ${id} (Total: ${sseClients.size})`);
}

export function broadcastEvent(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients.values()) {
    try {
      client.send(payload);
    } catch (err) {
      console.warn(`[SSE] Failed sending to client ${client.id}:`, err);
    }
  }
}

export function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey || !supabaseUrl.startsWith('http')) {
    return null;
  }

  try {
    return createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.warn('[Supabase] Could not create client:', err);
    return null;
  }
}

export function recordInboundLog(log: InboundWebhookLog) {
  inboundLogs.unshift(log);
  if (inboundLogs.length > MAX_LOGS) {
    inboundLogs.pop();
  }
  // Broadcast log to UI in real time
  broadcastEvent('webhook_log', log);
}

export function getInboundLogs(): InboundWebhookLog[] {
  return inboundLogs;
}

export function clearInboundLogs() {
  inboundLogs.length = 0;
}

export function getAllMemoryOrders(): ServerOrder[] {
  return Array.from(memoryOrders.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getMemoryOrder(idOrToken: string): ServerOrder | undefined {
  if (memoryOrders.has(idOrToken)) {
    return memoryOrders.get(idOrToken);
  }
  for (const order of memoryOrders.values()) {
    if (order.id === idOrToken || order.token === idOrToken) {
      return order;
    }
  }
  return undefined;
}

export function saveMemoryOrder(order: ServerOrder): ServerOrder {
  memoryOrders.set(order.id, order);
  if (order.token) {
    // Also index by token
    memoryOrders.set(`tok_${order.token}`, order);
  }
  return order;
}

export function formatIST(dateInput?: string | Date) {
  if (!dateInput) return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' });
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' });
  return d.toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' });
}
