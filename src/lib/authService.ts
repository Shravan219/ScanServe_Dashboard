import { supabase, isSupabaseConfigured } from './supabase';
import { Capacitor } from '@capacitor/core';
import { getApiBaseUrl } from './apiConfig';

export interface VerifyResult {
  success: boolean;
  message?: string;
}

const DEFAULT_ADMIN_PASSWORDS = ['admin123', '1234', 'admin', 'vyoma2026'];
const DEFAULT_STAFF_PASSWORDS = ['staff123', '1234', 'staff', 'captain123'];

/**
 * Executes a promise with a hard timeout to prevent mobile app hanging on slow networks.
 */
function withTimeout<T>(promise: PromiseLike<T> | Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    Promise.resolve(promise) as Promise<T>,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
  ]);
}

/**
 * Verifies a staff access password instantly for default passcodes,
 * or with strict timeouts against remote server & Supabase.
 */
export async function verifyStaffPassword(input: string): Promise<VerifyResult> {
  const trimmed = input.trim();
  if (!trimmed) {
    return { success: false, message: 'Password cannot be empty' };
  }

  // 1. Instant check for standard demo & default passcodes (0ms latency)
  if (DEFAULT_STAFF_PASSWORDS.includes(trimmed) || DEFAULT_ADMIN_PASSWORDS.includes(trimmed)) {
    return { success: true, message: 'Access Granted' };
  }

  // 2. Try server verification route only if web or remote POS server is configured
  const hasServer = !Capacitor.isNativePlatform() || Boolean(getApiBaseUrl());
  if (hasServer) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const apiRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'staff', password: trimmed }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data.success) {
          return { success: true, message: data.message };
        }
      }
    } catch {
      // Backend route unreachable or timed out, fallback to Supabase
    }
  }

  // 3. Direct client query to Supabase 'app_passwords' table if configured (with 2s timeout)
  if (isSupabaseConfigured) {
    try {
      const queryPromise = supabase.from('app_passwords').select('*');
      const { data, error } = await withTimeout(queryPromise, 2000, { data: null, error: null } as any);

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

  return { success: false, message: 'Invalid Passcode. Use default (1234 / staff123) or configure in Supabase.' };
}

/**
 * Verifies an admin password instantly for default passcodes,
 * or with strict timeouts against remote server & Supabase.
 */
export async function verifyAdminPassword(input: string): Promise<VerifyResult> {
  const trimmed = input.trim();
  if (!trimmed) {
    return { success: false, message: 'Password cannot be empty' };
  }

  // 1. Instant check for standard admin demo & default passcodes (0ms latency)
  if (DEFAULT_ADMIN_PASSWORDS.includes(trimmed)) {
    return { success: true, message: 'Access Granted' };
  }

  // 2. Try server verification route only if web or remote POS server is configured
  const hasServer = !Capacitor.isNativePlatform() || Boolean(getApiBaseUrl());
  if (hasServer) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const apiRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'admin', password: trimmed }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data.success) {
          return { success: true, message: data.message };
        }
      }
    } catch {
      // Backend route unreachable or timed out, fallback to Supabase
    }
  }

  // 3. Direct client query to Supabase 'app_passwords' table if configured (with 2s timeout)
  if (isSupabaseConfigured) {
    try {
      const queryPromise = supabase.from('app_passwords').select('*');
      const { data, error } = await withTimeout(queryPromise, 2000, { data: null, error: null } as any);

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

  return { success: false, message: 'Invalid Admin Passcode. Use default (1234 / admin123) or configure in Supabase.' };
}

