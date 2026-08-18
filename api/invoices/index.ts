import crypto from 'crypto';
import {
  getAllMemoryOrders,
  getSupabaseClient,
  saveMemoryOrder,
  broadcastEvent,
  recordInboundLog,
  formatIST,
  ServerOrder
} from '../../server/orderStore';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Source, X-Restaurant-ID');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET /api/invoices - Retrieve all saved invoices / orders
  if (req.method === 'GET' || req.method === 'HEAD') {
    try {
      const memoryOrders = getAllMemoryOrders() || [];
      const supabase = getSupabaseClient();
      let dbOrders: any[] = [];

      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
          if (!error && data) {
            dbOrders = data;
          }
        } catch (dbErr: any) {
          console.warn('[API /api/invoices GET] Supabase fetch error:', dbErr?.message);
        }
      }

      const orderMap = new Map<string, any>();
      for (const o of dbOrders) {
        const key = o.id || o.token;
        if (key) orderMap.set(key, o);
      }
      for (const o of memoryOrders) {
        const key = o.id || o.token;
        if (key) orderMap.set(key, o);
      }

      const merged = Array.from(orderMap.values()).sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );

      return res.status(200).json({
        success: true,
        count: merged.length,
        invoices: merged,
        orders: merged
      });
    } catch (e: any) {
      console.error('[API /api/invoices GET Error]:', e);
      return res.status(200).json({ success: true, count: 0, invoices: [], orders: [] });
    }
  }

  // POST /api/invoices - Create and save new manual invoice directly to DB
  if (req.method === 'POST') {
    const startTime = Date.now();
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {}
      }

      console.log('ATTEMPTING_INVOICE_CREATE:', JSON.stringify(body, null, 2));

      // Extract Customer Information
      const customerName = String(
        body?.customer_name ||
        body?.customerName ||
        body?.customer?.name ||
        body?.Customer?.Name ||
        'Guest Customer'
      ).trim();

      const customerPhone = String(
        body?.customer_phone ||
        body?.customerPhone ||
        body?.customer?.phone ||
        body?.Customer?.Phone ||
        body?.phone ||
        'Masked Number'
      ).trim();

      // Extract Items Array
      const rawItems = Array.isArray(body?.items)
        ? body.items
        : Array.isArray(body?.order_items)
        ? body.order_items
        : [];

      const items = rawItems.map((item: any, idx: number) => {
        const name = String(
          item?.name ||
          item?.itemName ||
          item?.Item_Name ||
          item?.title ||
          `Item ${idx + 1}`
        ).trim();

        const price = Number(item?.price || item?.rate || item?.unit_price || 0);
        const quantity = Number(item?.quantity || item?.qty || 1);

        return {
          id: String(item?.id || item?.item_id || `inv_item_${idx + 1}`),
          name: name || `Item ${idx + 1}`,
          price: isNaN(price) ? 0 : price,
          quantity: isNaN(quantity) || quantity <= 0 ? 1 : quantity,
          item_notes: item?.notes || item?.item_notes || undefined
        };
      });

      if (items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one order item is required to generate an invoice.'
        });
      }

      // Calculate totals
      const subtotal = items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
      const discount = Number(body?.discount || 0);
      const taxRate = Number(body?.tax_rate !== undefined ? body.tax_rate : 5);
      const taxAmount = Number(body?.tax_amount !== undefined ? body.tax_amount : (subtotal - discount) * (taxRate / 100));

      const calculatedGrandTotal = Math.max(0, subtotal - discount + (taxAmount > 0 ? taxAmount : 0));
      const grandTotal = Number(body?.total || body?.grand_total || body?.grandTotal || calculatedGrandTotal);

      // Generate IDs and 4-digit token
      const rawOrderId = body?.id || body?.order_id || body?.invoice_id || `INV-${Date.now().toString().slice(-6)}`;
      const orderId = String(rawOrderId);

      let token = String(body?.token || body?.token_no || '').replace(/[^0-9]/g, '');
      if (token.length !== 4) {
        token = orderId.replace(/[^0-9]/g, '').slice(-4);
      }
      if (token.length !== 4) {
        token = Math.floor(1000 + Math.random() * 9000).toString();
      }

      const paymentMode = String(body?.payment_mode || body?.payment_method || 'UPI').toUpperCase();
      const channel = String(body?.vendor || body?.channel || body?.source || 'DIRECT_POS').toUpperCase();
      const status = 'completed';
      const createdAt = body?.created_at || new Date().toISOString();
      const placedAtIst = formatIST(createdAt);
      const gstin = body?.gstin ? String(body.gstin).trim().toUpperCase() : null;
      const notes = body?.notes || `Payment: ${paymentMode} | POS Invoice Ref: ${orderId}`;

      const serverOrder: ServerOrder = {
        id: orderId,
        token: `#${token}`,
        status: 'completed',
        total: grandTotal,
        items,
        customer_name: customerName,
        customer_phone: customerPhone,
        table_id: body?.table_id || 'Walk-in POS',
        order_type: 'takeaway',
        created_at: createdAt,
        placed_at_ist: placedAtIst,
        gstin: gstin || undefined,
        notes
      };

      // 1. Save to in-memory cache
      saveMemoryOrder(serverOrder);

      // 2. Broadcast SSE Event to Dashboard / KDS
      try {
        broadcastEvent('new_order', serverOrder);
        broadcastEvent('order_created', serverOrder);
      } catch (sseErr: any) {
        console.warn('[API /api/invoices] SSE broadcast warning:', sseErr?.message);
      }

      // 3. Log Inbound Inspector
      try {
        recordInboundLog({
          id: `inv_log_${Date.now()}_${orderId}`,
          timestamp: new Date().toISOString(),
          method: 'POST',
          path: '/api/invoices',
          ip: req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'local',
          headers: req.headers || {},
          raw_body: body,
          detected_platform: 'Manual POS',
          detected_source: channel,
          order_id: orderId,
          token: serverOrder.token,
          item_count: items.length,
          total_amount: grandTotal,
          status_code: 200,
          success: true,
          message: `Invoice ${orderId} generated for ${customerName} (₹${grandTotal}) [${paymentMode}]`,
          duration_ms: Date.now() - startTime
        });
      } catch (logErr: any) {
        console.warn('[API /api/invoices] Inbound log warning:', logErr?.message);
      }

      // 4. Save directly to Supabase PostgreSQL database
      const supabase = getSupabaseClient();
      let dbSaved = false;
      let dbId = orderId;

      if (supabase) {
        console.log('ATTEMPTING_DB_PERSIST:', {
          orderId,
          customerName,
          grandTotal
        });

        const dbPayload: Record<string, any> = {
          token: serverOrder.token,
          status: 'completed',
          total: Number(serverOrder.total) || 0,
          items: serverOrder.items,
          customer_name: customerName,
          customer_phone: customerPhone,
          table_id: String(serverOrder.table_id || 'Walk-in POS'),
          created_at: serverOrder.created_at,
          gstin: gstin
        };

        if (isUUID(orderId)) {
          dbPayload.id = orderId;
        } else {
          dbPayload.id = crypto.randomUUID();
        }

        try {
          const { data: dbData, error: dbError } = await supabase
            .from('orders')
            .insert([dbPayload])
            .select();

          if (dbError) {
            console.error('DB_WRITE_FAILED:', dbError);
            return res.status(500).json({
              success: false,
              error: dbError.message || 'Database write failed',
              details: dbError,
              order_id: orderId
            });
          }

          dbSaved = true;
          dbId = dbPayload.id;
          console.log('DB_PERSIST_SUCCESS:', { orderId, dbId, dbData });
        } catch (dbException: any) {
          console.error('DB_WRITE_FAILED:', dbException);
          return res.status(500).json({
            success: false,
            error: dbException?.message || 'Database exception during invoice creation',
            order_id: orderId
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Invoice created and saved successfully',
        invoice_id: orderId,
        db_id: dbId,
        order_id: orderId,
        token: serverOrder.token,
        customer_name: customerName,
        customer_phone: customerPhone,
        total: grandTotal,
        subtotal,
        tax_amount: taxAmount,
        discount,
        payment_mode: paymentMode,
        items_count: items.length,
        items: serverOrder.items,
        created_at: createdAt,
        db_persisted: dbSaved
      });

    } catch (err: any) {
      console.error('[API /api/invoices POST Exception]:', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Failed to process invoice creation request'
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
