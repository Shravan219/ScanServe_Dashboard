import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { toast } from 'sonner';

let lastBackPressTime = 0;
let wakeLockSentinel: any = null;

/**
 * Initializes native Android plugins, safe-area styles, and hardware back button behavior.
 */
export async function initializeCapacitorAdaptations(options?: {
  onBackNavigate?: () => boolean; // Return true if handled internally
}) {
  if (!Capacitor.isNativePlatform()) {
    // In standard browser, still enable screen wake lock if available
    setupWakeLock();
    return;
  }

  // 1. Configure Android Status Bar
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#000000' });
  } catch (err) {
    console.debug('[Capacitor] StatusBar setup notice:', err);
  }

  // 2. Configure Hardware Back Button
  try {
    await CapApp.removeAllListeners();
    await CapApp.addListener('backButton', ({ canGoBack }) => {
      // Allow caller to handle modal/navigation closing first
      if (options?.onBackNavigate && options.onBackNavigate()) {
        return;
      }

      // Check if any HTML dialog or modal is active in the DOM
      const activeModal = document.querySelector('[role="dialog"], [data-state="open"]');
      if (activeModal) {
        const closeBtn = activeModal.querySelector('button[aria-label="Close"], button:has(svg.lucide-x)') as HTMLButtonElement | null;
        if (closeBtn) {
          closeBtn.click();
          return;
        }
      }

      // Double-press back to exit protection for POS / KDS kiosk tablets
      const now = Date.now();
      if (now - lastBackPressTime < 2000) {
        CapApp.exitApp();
      } else {
        lastBackPressTime = now;
        toast.info('Press back again to exit Vyoma ScanServe', { duration: 2000 });
      }
    });
  } catch (err) {
    console.debug('[Capacitor] BackButton listener notice:', err);
  }

  // 3. Keep Screen Awake for Kitchen KDS / Counter tablets
  setupWakeLock();
}

/**
 * Manages Web Screen WakeLock API so tablets don't dim during active shifts.
 */
export async function setupWakeLock() {
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

  const requestLock = async () => {
    try {
      if (document.visibilityState === 'visible') {
        wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        wakeLockSentinel.addEventListener('release', () => {
          wakeLockSentinel = null;
        });
      }
    } catch {
      // Wake lock requests can be rejected if battery is low or system denies
    }
  };

  await requestLock();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !wakeLockSentinel) {
      requestLock();
    }
  });
}
