import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../orderStore';

const router = Router();

/**
 * Helper to fetch a specific password strictly from Supabase 'app_passwords' table
 */
async function fetchPasswordFromSupabase(type: 'staff' | 'admin'): Promise<{ password: string | null; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { password: null, error: 'Supabase client is not configured or environment variables are missing on backend.' };
  }

  try {
    const targetKeys = type === 'admin' 
      ? ['admin_password', 'admin', 'adminpassword'] 
      : ['staff_password', 'staff', 'staffpassword'];

    // Select rows from app_passwords
    const { data, error } = await supabase
      .from('app_passwords')
      .select('*');

    if (error) {
      console.warn(`[Server Auth Route] Error querying app_passwords table:`, error.message);
      return { password: null, error: `Database error querying 'app_passwords': ${error.message}` };
    }

    if (!data || data.length === 0) {
      return { password: null, error: `The 'app_passwords' table in Supabase is empty.` };
    }

    for (const row of data) {
      const keyVal = String(row.key || row.name || row.type || row.id || '').trim().toLowerCase();
      if (targetKeys.some(k => k === keyVal)) {
        const passVal = row.password || row.value || row.pass;
        if (passVal) {
          return { password: String(passVal).trim() };
        }
      }
    }

    return { 
      password: null, 
      error: `Authentication failed: '${type === 'admin' ? 'admin_password' : 'staff_password'}' record not found in Supabase 'app_passwords' table.` 
    };
  } catch (err: any) {
    console.error(`[Server Auth Route] Exception querying app_passwords:`, err?.message);
    return { password: null, error: err?.message || 'Database query exception' };
  }
}

/**
 * GET /api/auth/passwords
 * Returns public status whether app_passwords table records exist in Supabase
 */
router.get('/passwords', async (req: Request, res: Response) => {
  try {
    const staffRes = await fetchPasswordFromSupabase('staff');
    const adminRes = await fetchPasswordFromSupabase('admin');

    return res.status(200).json({
      success: true,
      hasStaffPasswordInDb: !!staffRes.password,
      hasAdminPasswordInDb: !!adminRes.password,
      staffError: staffRes.error,
      adminError: adminRes.error
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

/**
 * POST /api/auth/verify
 * STRICTLY validates staff or admin password against Supabase 'app_passwords' table.
 * NO HARDCODED FALLBACKS allowed.
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { type, password } = req.body || {};
    const input = String(password || '').trim();

    if (!input) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const { password: dbPassword, error } = await fetchPasswordFromSupabase(type === 'admin' ? 'admin' : 'staff');

    if (dbPassword === null) {
      return res.status(401).json({
        success: false,
        message: error || `Authentication failed: '${type === 'admin' ? 'admin_password' : 'staff_password'}' record not found in Supabase 'app_passwords' table.`
      });
    }

    if (input === dbPassword) {
      return res.status(200).json({
        success: true,
        type: type || 'staff',
        message: 'Password verified successfully against Supabase app_passwords table'
      });
    } else {
      return res.status(401).json({
        success: false,
        message: `Invalid ${type === 'admin' ? 'Admin' : 'Staff Access'} Password`
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }
});

export default router;
