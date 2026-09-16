import { supabase, isSupabaseConfigured } from './supabase';

export interface VerifyResult {
  success: boolean;
  message?: string;
}

const DEFAULT_ADMIN_PASSWORDS = ['admin123', '1234', 'admin', 'vyoma2026'];
const DEFAULT_STAFF_PASSWORDS = ['staff123', '1234', 'staff', 'captain123'];

/**
 * Verifies a staff access password against Supabase 'app_passwords' table,
 * with safe fallback defaults when database table is not yet seeded.
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
    }
  } catch {
    // If backend route unavailable, proceed to client verification
  }

  // 2. Direct client query to Supabase 'app_passwords' table if configured
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('app_passwords')
        .select('*');

      if (!error && data && data.length > 0) {
        const staffRow = data.find((r: any) => {
          const k = String(r.key || r.name || r.type || r.id || '').trim().toLowerCase();
          return k === 'staff_password' || k === 'staff' || k === 'staffpassword';
        });

        if (staffRow) {
          const passVal = String(staffRow.password || staffRow.value || staffRow.pass || '').trim();
          if (trimmed === passVal) {
            return { success: true };
          } else {
            return { success: false, message: 'Invalid Staff Access Password' };
          }
        }
      }
    } catch (err: any) {
      console.warn('[AuthService] Supabase query notice:', err?.message);
    }
  }

  // 3. Fallback to default passcodes if DB is not seeded or running offline
  if (DEFAULT_STAFF_PASSWORDS.includes(trimmed) || DEFAULT_ADMIN_PASSWORDS.includes(trimmed)) {
    return { success: true, message: 'Verified via default passcode' };
  }

  return { success: false, message: 'Invalid Passcode. Use default (staff123 / 1234) or set in Supabase.' };
}

/**
 * Verifies an admin password against Supabase 'app_passwords' table,
 * with safe fallback defaults when database table is not yet seeded.
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
    }
  } catch {
    // If backend route unavailable, proceed to client verification
  }

  // 2. Direct client query to Supabase 'app_passwords' table if configured
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('app_passwords')
        .select('*');

      if (!error && data && data.length > 0) {
        const adminRow = data.find((r: any) => {
          const k = String(r.key || r.name || r.type || r.id || '').trim().toLowerCase();
          return k === 'admin_password' || k === 'admin' || k === 'adminpassword';
        });

        if (adminRow) {
          const passVal = String(adminRow.password || adminRow.value || adminRow.pass || '').trim();
          if (trimmed === passVal) {
            return { success: true };
          } else {
            return { success: false, message: 'Invalid Admin Password' };
          }
        }
      }
    } catch (err: any) {
      console.warn('[AuthService] Supabase query notice:', err?.message);
    }
  }

  // 3. Fallback to default passcodes if DB is not seeded or running offline
  if (DEFAULT_ADMIN_PASSWORDS.includes(trimmed)) {
    return { success: true, message: 'Verified via default admin passcode' };
  }

  return { success: false, message: 'Invalid Admin Passcode. Use default (admin123 / 1234) or set in Supabase.' };
}

