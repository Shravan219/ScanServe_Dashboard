// Web Audio API based sound synthesizer for crisp, reliable, zero-network-dependency alert chimes

class SoundService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx || this.ctx.state === 'suspended') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('vyoma_sound_muted', muted ? 'true' : 'false');
    } catch {}
  }

  public getMuted(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('vyoma_sound_muted') === 'true';
    } catch {
      return false;
    }
  }

  // Dual-tone high clarity restaurant service bell chime (Ding-Dong / 🛎️)
  public playReadyChime() {
    if (this.getMuted()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // First note: High chime (880 Hz - A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(860, now + 0.6);

      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.45, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.8);

      // Second note: Pleasant harmonic bell (1320 Hz - E6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1320, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(1300, now + 0.9);

      gain2.gain.setValueAtTime(0, now + 0.12);
      gain2.gain.linearRampToValueAtTime(0.35, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 1.2);

      // Third lower undertone for bell resonance (440 Hz)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(440, now + 0.12);

      gain3.gain.setValueAtTime(0, now + 0.12);
      gain3.gain.linearRampToValueAtTime(0.2, now + 0.15);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.12);
      osc3.stop(now + 1.0);
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }

  // Pop sound for new incoming orders
  public playNewOrderSound() {
    if (this.getMuted()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // Haptic feedback for mobile devices
  public triggerVibration(pattern: number[] = [150, 80, 150]) {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }
}

export const soundService = new SoundService();
