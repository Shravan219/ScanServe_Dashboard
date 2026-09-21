import { Capacitor } from '@capacitor/core';

export const POS_SERVER_STORAGE_KEY = 'vyoma_pos_server_url';
export const POS_SERVER_DEFAULT_PORT = '3000';

/**
 * Normalizes a base URL, removing trailing slashes.
 * Automatically converts 'localhost' to '10.0.2.2' if running inside an Android emulator.
 */
export function normalizeServerUrl(url: string): string {
  let cleaned = (url || '').trim().replace(/\/+$/, '');
  if (!cleaned) return '';

  // Ensure protocol exists
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `http://${cleaned}`;
  }

  // If in native Android emulator and localhost is typed, offer loopback alias
  if (Capacitor.isNativePlatform() && (cleaned.includes('localhost:') || cleaned.endsWith('localhost'))) {
    // 10.0.2.2 is Android's standard alias to host 127.0.0.1
    cleaned = cleaned.replace('localhost', '10.0.2.2');
  }

  return cleaned;
}

/**
 * Returns the currently active POS Server Base URL.
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return '';

  const stored = localStorage.getItem(POS_SERVER_STORAGE_KEY);
  if (stored && stored.trim()) {
    return normalizeServerUrl(stored);
  }

  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return normalizeServerUrl(envUrl);
  }

  // If running on Native Android and no server has been set yet,
  // return empty so callers know no remote server is configured,
  // or fall back to window.location.origin if it is a real host (not localhost).
  if (Capacitor.isNativePlatform()) {
    return '';
  }

  // In web browser development/production, empty string lets relative paths like /api/* work
  return '';
}

/**
 * Saves or clears the POS Server Base URL.
 */
export function setApiBaseUrl(url: string | null): void {
  if (typeof window === 'undefined') return;

  if (!url || !url.trim()) {
    localStorage.removeItem(POS_SERVER_STORAGE_KEY);
  } else {
    localStorage.setItem(POS_SERVER_STORAGE_KEY, normalizeServerUrl(url));
  }

  window.dispatchEvent(new CustomEvent('vyoma:server-config-changed', {
    detail: { url: getApiBaseUrl() }
  }));
}

/**
 * Resolves an API endpoint path against the configured server base URL.
 */
export function resolveApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (!base) {
    return cleanPath;
  }

  return `${base}${cleanPath}`;
}

/**
 * Tests connectivity to a given server address.
 */
export async function testServerConnection(urlCandidate?: string): Promise<{
  success: boolean;
  message: string;
  latencyMs?: number;
}> {
  const target = normalizeServerUrl(urlCandidate || getApiBaseUrl());
  if (!target) {
    return {
      success: false,
      message: 'No server URL configured. Set your POS server IP (e.g. http://192.168.1.100:3000).'
    };
  }

  const pingUrl = `${target}/api/whatsapp/status`;
  const startTime = Date.now();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await window.originalFetch(pingUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const latencyMs = Date.now() - startTime;
    if (res.ok) {
      return {
        success: true,
        message: `Connected successfully (${latencyMs}ms)`,
        latencyMs
      };
    } else {
      return {
        success: true,
        message: `Server reachable with status ${res.status} (${latencyMs}ms)`,
        latencyMs
      };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return { success: false, message: 'Connection timed out (4s). Check IP address and ensure PC & device are on the same Wi-Fi.' };
    }
    return {
      success: false,
      message: err.message ? `Cannot connect: ${err.message}` : 'Connection failed. Verify server is running on target IP.'
    };
  }
}

// Preserve original fetch
declare global {
  interface Window {
    originalFetch: typeof window.fetch;
    __vyomaFetchIntercepted?: boolean;
  }
}

/**
 * Installs transparent global fetch rewriting for /api/* requests.
 */
export function setupApiInterceptor(): void {
  if (typeof window === 'undefined' || window.__vyomaFetchIntercepted) return;

  window.originalFetch = window.fetch.bind(window);

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const base = getApiBaseUrl();

    const isApiRequest = 
      (typeof input === 'string' && (input.startsWith('/api/') || input === '/api')) ||
      (input instanceof URL && input.pathname.startsWith('/api/')) ||
      (input instanceof Request && new URL(input.url, window.location.origin).pathname.startsWith('/api/'));

    // On native mobile (Capacitor), if no POS server IP has been configured,
    // relative /api/* requests to localhost cannot succeed and would hang the app for 60s.
    // Return an immediate fast response so callers failover cleanly to Supabase/offline cache in 0ms.
    if (Capacitor.isNativePlatform() && !base && isApiRequest) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No POS server configured on mobile device',
        orders: [],
        customers: [],
        logs: []
      }), {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // If no custom base is set or request is not /api/*, pass through to original fetch
    if (!base) {
      return window.originalFetch(input, init);
    }

    try {
      if (typeof input === 'string') {
        if (input.startsWith('/api/') || input === '/api') {
          const newUrl = `${base}${input}`;
          return window.originalFetch(newUrl, init);
        }
      } else if (input instanceof URL) {
        if (input.pathname.startsWith('/api/')) {
          const newUrl = `${base}${input.pathname}${input.search}`;
          return window.originalFetch(newUrl, init);
        }
      } else if (input instanceof Request) {
        const url = new URL(input.url, window.location.origin);
        if (url.pathname.startsWith('/api/')) {
          const newUrl = `${base}${url.pathname}${url.search}`;
          const newRequest = new Request(newUrl, input);
          return window.originalFetch(newRequest, init);
        }
      }
    } catch {
      // Fallback if parsing fails
    }

    return window.originalFetch(input, init);
  };

  window.__vyomaFetchIntercepted = true;
}
