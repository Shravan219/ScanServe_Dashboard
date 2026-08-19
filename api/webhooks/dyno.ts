import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

function safeUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Maps external statuses strictly to Postgres check constraint: 'pending' | 'preparing' | 'ready' | 'completed'
function sanitizeStatus(rawStatus: any): 'pending' | 'preparing' | 'ready' | 'completed' {
  const s = String(rawStatus || '').toLowerCase();
  if (['preparing', 'in_kitchen', 'accepted', 'confirmed', '1'].includes(s)) return 'preparing';
  if (['ready', 'ready_for_pickup', '2'].includes(s)) return 'ready';
  if (['completed', 'dispatched', 'delivered', '3'].includes(s)) return 'completed';
  return 'pending';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ status: 200, message: 'Dyno Webhook Endpoint Active' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json([{ status: 405, message: 'Method Not Allowed' }]);
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // Raw body fallback
      }
    }

    const rawOrdersList = Array.isArray(body?.orders)
      ? body.orders
      : Array.isArray(body?.data?.orders)
      ? body.data.orders
      : Array.isArray(body)
      ? body
      : [body];

    // Lazy load Supabase to prevent cold start failures
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

    if (!supabase) {
      console.error('SUPABASE_CLIENT_ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY');
    }

    const responseList = [];

    for (const rawOrder of rawOrdersList) {
      if (!rawOrder || typeof rawOrder !== 'object') continue;

      const externalOrderId = String(
        rawOrder.orderId || rawOrder.order_id || rawOrder.id || `DYN_${Date.now()}`
      ).trim();

      const digitsOnly = externalOrderId.replace(/[^0-9]/g, '');
      const tokenNumber = digitsOnly.length >= 4 ? digitsOnly.slice(-4) : digitsOnly || '1001';
      const token = `#${tokenNumber}`;

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(externalOrderId);

      // Matches exact public.orders table schema
      const dbPayload = {
        id: isUUID ? externalOrderId : safeUUID(),
        token: token,
        status: sanitizeStatus(rawOrder.status),
        total: Number(rawOrder.bill_amount || rawOrder.grand_total || rawOrder.total || 0),
        items: rawOrder.items || rawOrder.order_items || [],
        table_id: String(rawOrder.table_id || rawOrder.restaurant_id || 'Dyno API'),
        created_at: new Date().toISOString(),
        placed_at_ist: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        customer_name: rawOrder.customer_name || rawOrder.customer?.name || 'Guest Customer',
        customer_phone: rawOrder.customer_mobile || rawOrder.customer?.phone || rawOrder.phone || 'Masked Number',
        gstin: rawOrder.gstin || null,
        discount: rawOrder.discount ? Number(rawOrder.discount) : null,
        order_type: rawOrder.order_type || 'delivery',
        notes: `Ref ID: ${externalOrderId}`,
        custom_instructions: rawOrder.instructions || rawOrder.custom_instructions || null,
        aggregator_platform: rawOrder.aggregator_platform || rawOrder.source || 'dyno'
      };

      if (supabase) {
        const { error: dbError } = await supabase.from('orders').insert([dbPayload]);
        if (dbError) {
          console.error(`SUPABASE_INSERT_ERROR [Order: ${externalOrderId}]:`, dbError.message, dbError.details);
        }
      }

      responseList.push({
        status: 200,
        orderId: externalOrderId,
        message: `Order No. ${externalOrderId} Inserted Successfully`
      });
    }

    return res.status(200).json(responseList);
  } catch (err: any) {
    console.error('FATAL_SERVERLESS_ERROR:', err);
    return res.status(500).json([
      {
        status: 500,
        orderId: 'ERROR',
        message: err?.message || 'Internal Serverless Exception'
      }
    ]);
  }
}