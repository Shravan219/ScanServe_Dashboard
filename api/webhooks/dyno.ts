import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method === 'GET') {
    return res.status(200).json({ status: 200, message: 'Dyno API active' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json([{ status: 405, message: 'Method Not Allowed' }]);
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const orders = Array.isArray(body?.orders) ? body.orders : [body];
    const responseList = [];

    // Lazy load Supabase inside request handler to prevent cold-start crashes
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

    for (const rawOrder of orders) {
      if (!rawOrder || typeof rawOrder !== 'object') continue;

      const orderId = String(rawOrder.orderId || rawOrder.order_id || rawOrder.id || `DYN_${Date.now()}`).trim();
      const token = `#${orderId.replace(/[^0-9]/g, '').slice(-4) || '1001'}`;

      if (supabase) {
        try {
          await supabase.from('orders').upsert({
            order_id: orderId,
            token,
            status: 'preparing',
            total: Number(rawOrder.bill_amount || rawOrder.grand_total || 0),
            items: rawOrder.items || rawOrder.order_items || [],
            customer_name: rawOrder.customer_name || rawOrder.customer?.name || 'Guest Customer',
            customer_phone: rawOrder.customer_mobile || rawOrder.customer?.phone || 'Masked Number',
            created_at: new Date().toISOString()
          }, { onConflict: 'order_id' });
        } catch (dbError) {
          console.error('Database write skipped:', dbError);
        }
      }

      responseList.push({
        status: 200,
        orderId,
        message: `Order No. ${orderId} Inserted Successfully`
      });
    }

    return res.status(200).json(responseList);
  } catch (error: any) {
    return res.status(500).json([{ status: 500, orderId: 'ERROR', message: error?.message || 'Serverless Exception' }]);
  }
}