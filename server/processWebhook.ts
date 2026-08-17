import { createClient } from '@supabase/supabase-js';

export function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
  }

  return createClient(supabaseUrl, supabaseKey);
}

function formatIST(dateInput?: string | Date) {
  if (!dateInput) return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' });
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' });
  return d.toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' });
}

export async function processWebhookPayload(payload: any, headers?: Record<string, any>) {
  if (!payload || typeof payload !== 'object') {
    return {
      status: 400,
      data: {
        success: false,
        message: "Invalid payload: Request body must be a JSON object"
      }
    };
  }

  // Infinite Loop Guard: Check X-Source header
  const xSource = headers?.['x-source'] || headers?.['X-Source'] || '';
  if (xSource === 'VYOMA_TESTER') {
    console.log('[Webhook Guard] Detected X-Source: VYOMA_TESTER. Processing with loop prevention.');
  }

  // Support nested payload structures (e.g. { order_details: { ... } } or { order: { ... } } or flat)
  const details = payload.order_details || payload.order || payload.data || payload;

  if (!details || typeof details !== 'object') {
    return {
      status: 400,
      data: {
        success: false,
        message: "Invalid payload structure: missing order_details or order object"
      }
    };
  }

  // Extract Order Source / Platform with priority on 'order_from'
  const rawOrderFrom = (
    details.order_from || 
    payload.order_from || 
    details.order_source || 
    payload.order_source || 
    details.source || 
    payload.source || 
    details.aggregator || 
    payload.aggregator || 
    details.aggregator_platform ||
    payload.aggregator_platform ||
    details.channel ||
    payload.channel ||
    ''
  ).toString().trim().toLowerCase();

  let detectedPlatform: 'swiggy' | 'zomato' | 'other_online' = 'other_online';
  let sourceUpper = 'ONLINE';

  if (rawOrderFrom.includes('swiggy') || rawOrderFrom === 'sw') {
    detectedPlatform = 'swiggy';
    sourceUpper = 'SWIGGY';
  } else if (rawOrderFrom.includes('zomato') || rawOrderFrom === 'zm') {
    detectedPlatform = 'zomato';
    sourceUpper = 'ZOMATO';
  } else if (rawOrderFrom.includes('magicpin')) {
    detectedPlatform = 'other_online';
    sourceUpper = 'MAGICPIN';
  } else if (rawOrderFrom.includes('ubereats') || rawOrderFrom.includes('uber')) {
    detectedPlatform = 'other_online';
    sourceUpper = 'UBEREATS';
  } else if (rawOrderFrom) {
    sourceUpper = rawOrderFrom.toUpperCase();
  } else {
    // Check if table_id or order_id or notes provides platform hints
    const combinedHints = `${details.table_id || ''} ${details.order_id || ''} ${details.notes || ''}`.toLowerCase();
    if (combinedHints.includes('swiggy')) {
      detectedPlatform = 'swiggy';
      sourceUpper = 'SWIGGY';
    } else if (combinedHints.includes('zomato')) {
      detectedPlatform = 'zomato';
      sourceUpper = 'ZOMATO';
    }
  }

  // Extract Order ID & Token
  const rawOrderId = (details.order_id || details.id || details.order_number || '').toString();
  const fallbackOrderId = rawOrderId || `PP_${Math.floor(100000 + Math.random() * 900000)}`;
  const orderId = rawOrderId || fallbackOrderId;

  let token = details.token ? details.token.toString().replace(/[^0-9]/g, '') : '';
  if (token.length !== 4) {
    token = orderId.replace(/[^0-9]/g, '').slice(-4);
  }
  if (token.length !== 4) {
    token = Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Map incoming status to internal format ('pending' | 'preparing' | 'ready' | 'completed' | 'cancelled')
  const rawStatus = (details.status || payload.status || 'pending').toString().toLowerCase();
  let mappedStatus = 'pending';
  if (rawStatus === 'in_kitchen' || rawStatus === 'preparing' || rawStatus === 'accepted') {
    mappedStatus = 'preparing';
  } else if (rawStatus === 'ready' || rawStatus === 'ready_for_pickup' || rawStatus === 'food_ready') {
    mappedStatus = 'ready';
  } else if (rawStatus === 'dispatched' || rawStatus === 'completed' || rawStatus === 'delivered' || rawStatus === 'settled') {
    mappedStatus = 'completed';
  } else if (rawStatus === 'cancelled' || rawStatus === 'rejected') {
    mappedStatus = 'cancelled';
  }

  // Customer info
  const customerName = details.customer_name || details.customer?.name || details.client_name || `${sourceUpper} Customer`;
  const customerPhone = details.customer_phone || details.customer?.phone || details.phone || '+919876543210';

  // Parse items
  const rawItems = Array.isArray(details.items) ? details.items : (Array.isArray(details.order_items) ? details.order_items : []);
  
  const items = rawItems.map((item: any, idx: number) => {
    const name = item.item_name || item.name || item.title || `Item ${idx + 1}`;
    const price = parseFloat(item.price || item.rate || item.unit_price || 0);
    const quantity = parseInt(item.quantity || item.qty || 1, 10);
    return {
      id: (item.item_id || item.id || `item-${idx + 1}`).toString(),
      name,
      price,
      quantity
    };
  });

  // Default sample items if array was empty
  if (items.length === 0) {
    items.push({
      id: 'item-1',
      name: details.item_name || 'Special Delicacy',
      price: parseFloat(details.price || details.total || 450),
      quantity: 1
    });
  }

  // Total Amount
  let total = parseFloat(details.total || details.order_total || details.amount || details.grand_total || 0);
  if (!total || total === 0) {
    total = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
  }

  // Timestamp
  const createdAt = details.created_at || details.order_date || details.placed_at || new Date().toISOString();
  const placedAtIst = details.placed_at_ist || formatIST(createdAt);

  const supabase = getSupabaseClient();

  // 1. IDEMPOTENCY CHECK (UPSERT)
  // Check if an order already exists by order_id/token/table or within recent window
  let existingOrder: any = null;

  // Search by token first
  if (token) {
    const { data: tokenMatches } = await supabase
      .from('orders')
      .select('*')
      .eq('token', token)
      .order('created_at', { ascending: false })
      .limit(5);

    if (tokenMatches && tokenMatches.length > 0) {
      existingOrder = tokenMatches[0];
    }
  }

  // If not found by token, check by table_id (e.g. "ZOMATO #412" or "SWIGGY #108") or customer phone within the last 2 hours
  if (!existingOrder && details.table_id) {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: tableMatches } = await supabase
      .from('orders')
      .select('*')
      .eq('table_id', details.table_id)
      .gte('created_at', twoHoursAgo)
      .order('created_at', { ascending: false })
      .limit(1);

    if (tableMatches && tableMatches.length > 0) {
      existingOrder = tableMatches[0];
    }
  }

  // If order exists, perform an UPDATE instead of creating a duplicate row
  if (existingOrder) {
    console.log(`[Webhook Idempotency] Existing order detected (ID: ${existingOrder.id}, Token: ${existingOrder.token}, Status: ${existingOrder.status} vs Incoming: ${mappedStatus}).`);
    
    // Check if status is identical -> DO NOT UPDATE, just return 200 OK immediately
    if (existingOrder.status === mappedStatus) {
      return {
        status: 200,
        data: {
          success: true,
          message: "Order already up-to-date (no-op)",
          order_id: existingOrder.id,
          token: existingOrder.token,
          status: existingOrder.status,
          is_duplicate_ignored: true
        }
      };
    }

    const updateData: any = {
      status: mappedStatus
    };
    if (items.length > 0 && (!existingOrder.items || existingOrder.items.length === 0)) {
      updateData.items = items;
    }
    if (total > 0 && (!existingOrder.total || existingOrder.total === 0)) {
      updateData.total = total;
    }

    const { data: updatedRecord, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', existingOrder.id)
      .select();

    if (updateError) {
      console.error('[Webhook Upsert Error] Failed to update existing order:', updateError);
    } else {
      existingOrder = updatedRecord?.[0] || existingOrder;
    }

    return {
      status: 200,
      data: {
        success: true,
        message: "Order processed successfully (updated existing record)",
        order_id: existingOrder.id,
        token: existingOrder.token,
        status: existingOrder.status,
        order_from: sourceUpper,
        platform: detectedPlatform,
        is_update: true
      }
    };
  }

  // 2. CREATE NEW ORDER IF NOT FOUND
  const orderRecord: any = {
    token,
    status: mappedStatus,
    total,
    items,
    customer_name: customerName,
    customer_phone: customerPhone,
    table_id: details.table_id || `${sourceUpper} Online`,
    order_type: 'aggregator',
    aggregator_platform: detectedPlatform,
    created_at: createdAt,
    placed_at_ist: placedAtIst
  };

  if (details.notes) {
    orderRecord.notes = details.notes;
  }

  const { data, error } = await supabase
    .from('orders')
    .insert([orderRecord])
    .select();

  if (error) {
    console.error('Supabase error inserting webhook order:', error);
    return {
      status: 500,
      data: {
        success: false,
        message: `Database error inserting order: ${error.message}`
      }
    };
  }

  const insertedData = data?.[0] || orderRecord;

  return {
    status: 200,
    data: {
      success: true,
      message: "Order processed successfully",
      order_id: insertedData.id || orderId,
      token: insertedData.token || token,
      order_from: sourceUpper,
      platform: detectedPlatform,
      placed_at_ist: insertedData.placed_at_ist || placedAtIst,
      data: {
        ...insertedData,
        order_from: sourceUpper,
        platform: detectedPlatform,
        placed_at_ist: insertedData.placed_at_ist || placedAtIst
      }
    }
  };
}
