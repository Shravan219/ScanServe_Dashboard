import { createClient } from '@supabase/supabase-js';
import { saveMemoryOrder, broadcastEvent } from '../../server/orderStore';

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

function sanitizeStatus(rawStatus: any): 'pending' | 'preparing' | 'ready' | 'completed' {
  const s = String(rawStatus || '').toLowerCase();
  if (['preparing', 'in_kitchen', 'accepted', 'confirmed', '1', 'new'].includes(s)) return 'pending';
  if (['ready', 'ready_for_pickup', '2'].includes(s)) return 'ready';
  if (['completed', 'dispatched', 'delivered', '3'].includes(s)) return 'completed';
  return 'pending';
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.status(200).json({ status: 200, message: 'Dyno Webhook Active' });
  if (req.method !== 'POST') return res.status(405).json([{ status: 405, message: 'Method Not Allowed' }]);

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }

    const rawOrdersList = Array.isArray(body?.orders)
      ? body.orders
      : Array.isArray(body?.data?.orders)
      ? body.data.orders
      : Array.isArray(body)
      ? body
      : [body];

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

    const responseList = [];

    for (const rawOrder of rawOrdersList) {
      if (!rawOrder || typeof rawOrder !== 'object') continue;

      const externalOrderId = String(
        rawOrder.orderId || rawOrder.order_id || rawOrder.id || `DYN_${Date.now()}`
      ).trim();

      const digitsOnly = externalOrderId.replace(/[^0-9]/g, '');
      const tokenNumber = digitsOnly.length >= 4 ? digitsOnly.slice(-4) : digitsOnly || '1001';
      const token = `#${tokenNumber}`;

      const vendorName = String(rawOrder.vendor || rawOrder.aggregator_platform || rawOrder.source || 'ZOMATO').toUpperCase();

      const customer = rawOrder.customerDetails || rawOrder.customer || {};
      const customerName = customer.name || rawOrder.customer_name || 'Guest Customer';
      const customerPhone = customer.phone || customer.mobile || rawOrder.customer_phone || 'Masked Number';

      const bill = rawOrder.billSummary || {};
      const grandTotal = Number(bill.grandTotal || bill.grand_total || rawOrder.bill_amount || rawOrder.total || 0);
      const discountVal = bill.discount ? Number(bill.discount) : (rawOrder.discount ? Number(rawOrder.discount) : null);

      const orderType = String(rawOrder.orderType || rawOrder.order_type || 'delivery').toLowerCase();
      const instructions = rawOrder.specialInstructions || rawOrder.instructions || rawOrder.custom_instructions || null;

      // Extract and normalize item schema across UI key naming conventions
      const rawItems = Array.isArray(rawOrder.items)
        ? rawOrder.items
        : Array.isArray(rawOrder.order_items)
        ? rawOrder.order_items
        : [];

      const normalizedItems = rawItems.map((it: any, idx: number) => {
        const name = String(it.name || it.itemName || it.item_name || it.title || `Item ${idx + 1}`).trim();
        const price = Number(it.price || it.itemPrice || it.rate || 0);
        const quantity = Number(it.quantity || it.qty || 1);
        const notes = it.specialNotes || it.notes || it.item_notes || '';

        const addons = Array.isArray(it.addons)
          ? it.addons.map((a: any) => ({
              id: a.id || safeUUID(),
              name: a.name || a.addon_name || '',
              price: Number(a.price || 0)
            }))
          : [];

        return {
          id: String(it.id || it.item_id || `itm_${idx + 1}`),
          name,
          itemName: name,
          item_name: name,
          price: isNaN(price) ? 0 : price,
          quantity: isNaN(quantity) ? 1 : quantity,
          qty: isNaN(quantity) ? 1 : quantity,
          notes,
          specialNotes: notes,
          category: it.category || 'General',
          isVeg: it.isVeg ?? true,
          addons
        };
      });

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(externalOrderId);

      const dbPayload = {
        id: isUUID ? externalOrderId : safeUUID(),
        token: token,
        status: sanitizeStatus(rawOrder.status),
        total: grandTotal,
        items: normalizedItems, // Saved as normalized JSONB
        table_id: String(rawOrder.restaurantId || rawOrder.table_id || `${vendorName} Order`),
        created_at: rawOrder.timestamp || new Date().toISOString(),
        placed_at_ist: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        customer_name: customerName,
        customer_phone: customerPhone,
        gstin: rawOrder.gstin || null,
        discount: discountVal,
        order_type: orderType,
        notes: `[${vendorName}] Order ID: ${externalOrderId}`,
        custom_instructions: instructions,
        aggregator_platform: vendorName.toLowerCase()
      };

      // Save to memory store and broadcast SSE for instant UI updates
      try {
        saveMemoryOrder(dbPayload as any);
        broadcastEvent('order_created', dbPayload);
      } catch (memErr) {
        console.warn('[Dyno Webhook Memory Save Notice]', memErr);
      }

      if (supabase) {
        const { error: dbError } = await supabase.from('orders').insert([dbPayload]);
        if (dbError) {
          console.warn(`SUPABASE_INSERT_WARNING [${externalOrderId}]:`, dbError.message);
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
    return res.status(500).json([{ status: 500, orderId: 'ERROR', message: err?.message || 'Serverless Exception' }]);
  }
}