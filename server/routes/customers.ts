import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../orderStore';

const router = Router();

/**
 * GET /api/customers
 * Returns all customer records directly from Supabase DB.
 * The server DOES NOT fabricate or add any phantom rows.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: 'Supabase client is not configured on server',
        customers: []
      });
    }

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Server Customers API] Error querying customers:', error.message);
      return res.status(500).json({
        success: false,
        error: error.message,
        customers: []
      });
    }

    return res.status(200).json({
      success: true,
      count: (data || []).length,
      customers: data || []
    });
  } catch (err: any) {
    console.error('[Server Customers API] Exception fetching customers:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Internal server error',
      customers: []
    });
  }
});

/**
 * PATCH /api/customers/:phone/vip
 * Toggles or sets VIP status and discount for a specific customer in the database.
 */
router.patch('/:phone/vip', async (req: Request, res: Response) => {
  try {
    const phone = decodeURIComponent(req.params.phone);
    const { loyal_vip, discount, name } = req.body || {};

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(503).json({ success: false, error: 'Supabase client not available' });
    }

    const updates: Record<string, any> = {
      loyal_vip: Boolean(loyal_vip),
      discount: loyal_vip ? (Number(discount) || null) : null
    };

    if (name) {
      updates.name = String(name).trim();
    }

    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('phone', phone)
      .select();

    if (error) {
      console.error('[Server Customers API] Error updating VIP status:', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: `Updated VIP status for ${phone}`,
      customer: data?.[0]
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

/**
 * PATCH /api/customers/bulk-discount
 * Updates discount percentage for all active VIP customers when discount settings change.
 */
router.patch('/bulk-discount', async (req: Request, res: Response) => {
  try {
    const { discount } = req.body || {};
    const discountVal = Number(discount) || 0;

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(503).json({ success: false, error: 'Supabase client not available' });
    }

    const { data, error } = await supabase
      .from('customers')
      .update({ discount: discountVal })
      .eq('loyal_vip', true)
      .select();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({
      success: true,
      updatedCount: data?.length || 0
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

export default router;
