import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey || !supabaseUrl.startsWith('http')) {
    return null;
  }
  return createClient(supabaseUrl, supabaseKey);
}

function formatIST(dateInput?: string | Date) {
  if (!dateInput) return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' });
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' });
  return d.toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' });
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const headers = Object.fromEntries(req.headers.entries());

    // 1. Check infinite loop guard header
    const xSource = headers['x-source'] || '';
    if (xSource === 'VYOMA_TESTER') {
      console.log('[Webhook Guard] Detected X-Source: VYOMA_TESTER. Processing safely.');
    }

    if (!payload || typeof payload !== 'object') {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid payload: must be a JSON object' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const details = payload.order_details || payload.order || payload.data || payload;
    const rawSource = (details.order_from || details.source || details.order_source || details.aggregator || 'zomato').toString().toLowerCase();
    const sourceUpper = rawSource.includes('swiggy') ? 'SWIGGY' : rawSource.includes('zomato') ? 'ZOMATO' : 'ONLINE';

    // 2. Extract Order ID & Token
    const orderId = (details.order_id || details.id || details.order_number || payload.order_id || `PP_ONLINE_${Date.now()}`).toString();
    let token = details.token ? details.token.toString().replace(/[^0-9]/g, '') : '';
    if (token.length !== 4) {
      token = orderId.replace(/[^0-9]/g, '').slice(-4);
    }
    if (token.length !== 4) {
      token = Math.floor(1000 + Math.random() * 9000).toString();
    }

    // 3. Map status
    const rawStatus = (details.status || payload.status || 'pending').toString().toLowerCase();
    let mappedStatus: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled' = 'pending';
    if (rawStatus === 'in_kitchen' || rawStatus === 'preparing' || rawStatus === 'accepted') {
      mappedStatus = 'preparing';
    } else if (rawStatus === 'ready' || rawStatus === 'ready_for_pickup' || rawStatus === 'food_ready') {
      mappedStatus = 'ready';
    } else if (rawStatus === 'dispatched' || rawStatus === 'completed' || rawStatus === 'delivered') {
      mappedStatus = 'completed';
    } else if (rawStatus === 'cancelled' || rawStatus === 'rejected') {
      mappedStatus = 'cancelled';
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return new Response(
        JSON.stringify({ success: false, message: 'Supabase configuration missing' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Idempotency Check (Upsert)
    let existingOrder: any = null;
    if (token) {
      const { data: tokenMatches } = await supabase
        .from('orders')
        .select('*')
        .eq('token', token)
        .order('created_at', { ascending: false })
        .limit(1);

      if (tokenMatches && tokenMatches.length > 0) {
        existingOrder = tokenMatches[0];
      }
    }

    if (existingOrder) {
      console.log(`[Next.js API Webhook] Updating existing order: ${existingOrder.id}`);
      await supabase
        .from('orders')
        .update({
          status: mappedStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingOrder.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Order processed',
          order_id: orderId,
          token: existingOrder.token,
          status: mappedStatus,
          is_update: true
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Create new order if not found
    const customerName = details.customer_name || details.customer?.name || `${sourceUpper} Customer`;
    const customerPhone = details.customer_phone || details.customer?.phone || '+919876543210';
    const rawItems = Array.isArray(details.items) ? details.items : [];
    const items = rawItems.length > 0 ? rawItems.map((item: any, idx: number) => ({
      id: (item.item_id || item.id || `item-${idx + 1}`).toString(),
      name: item.item_name || item.name || `Item ${idx + 1}`,
      price: parseFloat(item.price || 0),
      quantity: parseInt(item.quantity || 1, 10)
    })) : [
      { id: 'item-1', name: 'Chef Special Item', price: 350, quantity: 1 }
    ];

    const total = parseFloat(details.total || details.grand_total || 0) || items.reduce((a, b) => a + b.price * b.quantity, 0);
    const createdAt = details.created_at || new Date().toISOString();
    const placedAtIst = details.placed_at_ist || formatIST(createdAt);

    const orderRecord = {
      token,
      status: mappedStatus,
      total,
      items,
      customer_name: customerName,
      customer_phone: customerPhone,
      table_id: details.table_id || `${sourceUpper} Online`,
      created_at: createdAt,
      placed_at_ist: placedAtIst
    };

    const { data: inserted } = await supabase.from('orders').insert([orderRecord]).select();
    const finalRecord = inserted?.[0] || orderRecord;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Order processed',
        order_id: orderId,
        token: finalRecord.token || token,
        status: finalRecord.status || mappedStatus
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('Webhook Error:', err);
    return new Response(
      JSON.stringify({ success: false, message: err.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
