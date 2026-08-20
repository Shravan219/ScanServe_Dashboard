import { supabase } from './supabase';

export interface VerifyResult {
  success: boolean;
  message?: string;
}

/**
 * STRICTLY verifies a staff access password against Supabase 'app_passwords' table.
 * NO HARDCODED FALLBACKS ALLOWED.
 */
export async function verifyStaffPassword(input: string): Promise<VerifyResult> {
  const trimmed = input.trim();
  if (!trimmed) {
    return { success: false, message: 'Password cannot be empty' };
  }

  // 1. Try server verification route first
  try {
    const apiRes = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'staff', password: trimmed })
    });

    const data = await apiRes.json();
    if (apiRes.ok && data.success) {
      return { success: true, message: data.message };
    } else if (data && data.message) {
      return { success: false, message: data.message };
    }
  } catch {
    // If backend route unavailable, query Supabase client directly
  }

  // 2. Direct client query to Supabase 'app_passwords' table
  try {
    const { data, error } = await supabase
      .from('app_passwords')
      .select('*');

    if (error) {
      return { success: false, message: `Supabase error: ${error.message}` };
    }

    if (!data || data.length === 0) {
      return { success: false, message: "Supabase 'app_passwords' table is empty." };
    }

    const staffRow = data.find((r: any) => {
      const k = String(r.key || r.name || r.type || r.id || '').trim().toLowerCase();
      return k === 'staff_password' || k === 'staff' || k === 'staffpassword';
    });

    if (!staffRow) {
      return { success: false, message: "No 'staff_password' key found in Supabase 'app_passwords' table." };
    }

    const passVal = String(staffRow.password || staffRow.value || staffRow.pass || '').trim();
    if (trimmed === passVal) {
      return { success: true };
    } else {
      return { success: false, message: 'Invalid Staff Access Password' };
    }
  } catch (err: any) {
    console.error('[AuthService] Supabase staff auth exception:', err);
    return { success: false, message: err?.message || 'Authentication error' };
  }
}

/**
 * STRICTLY verifies an admin password against Supabase 'app_passwords' table.
 * NO HARDCODED FALLBACKS ALLOWED.
 */
export async function verifyAdminPassword(input: string): Promise<VerifyResult> {
  const trimmed = input.trim();
  if (!trimmed) {
    return { success: false, message: 'Password cannot be empty' };
  }

  // 1. Try server verification route first
  try {
    const apiRes = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'admin', password: trimmed })
    });

    const data = await apiRes.json();
    if (apiRes.ok && data.success) {
      return { success: true, message: data.message };
    } else if (data && data.message) {
      return { success: false, message: data.message };
    }
  } catch {
    // If backend route unavailable, query Supabase client directly
  }

  // 2. Direct client query to Supabase 'app_passwords' table
  try {
    const { data, error } = await supabase
      .from('app_passwords')
      .select('*');

    if (error) {
      return { success: false, message: `Supabase error: ${error.message}` };
    }

    if (!data || data.length === 0) {
      return { success: false, message: "Supabase 'app_passwords' table is empty." };
    }

    const adminRow = data.find((r: any) => {
      const k = String(r.key || r.name || r.type || r.id || '').trim().toLowerCase();
      return k === 'admin_password' || k === 'admin' || k === 'adminpassword';
    });

    if (!adminRow) {
      return { success: false, message: "No 'admin_password' key found in Supabase 'app_passwords' table." };
    }

    const passVal = String(adminRow.password || adminRow.value || adminRow.pass || '').trim();
    if (trimmed === passVal) {
      return { success: true };
    } else {
      return { success: false, message: 'Invalid Admin Password' };
    }
  } catch (err: any) {
    console.error('[AuthService] Supabase admin auth exception:', err);
    return { success: false, message: err?.message || 'Authentication error' };
  }
}
