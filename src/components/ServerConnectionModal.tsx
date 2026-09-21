import * as React from 'react';
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { 
  Server, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Smartphone, 
  Monitor, 
  HelpCircle,
  ExternalLink,
  Save,
  Trash2
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  getApiBaseUrl, 
  setApiBaseUrl, 
  testServerConnection,
  normalizeServerUrl 
} from '@/src/lib/apiConfig';

interface ServerConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServerConnectionModal({ open, onOpenChange }: ServerConnectionModalProps) {
  const [urlInput, setUrlInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  const isNative = Capacitor.isNativePlatform();
  const platformName = Capacitor.getPlatform();

  useEffect(() => {
    if (open) {
      setUrlInput(getApiBaseUrl());
      setTestResult(null);
    }
  }, [open]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testServerConnection(urlInput);
      setTestResult({
        tested: true,
        success: res.success,
        message: res.message,
        latencyMs: res.latencyMs
      });
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const normalized = normalizeServerUrl(urlInput);
    setApiBaseUrl(normalized);
    toast.success(normalized ? `POS Server set to: ${normalized}` : 'Server URL cleared (Cloud / Direct mode)');
    onOpenChange(false);
  };

  const handleClear = () => {
    setUrlInput('');
    setApiBaseUrl(null);
    setTestResult(null);
    toast.info('POS Server URL reset to default');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0D0E15] border border-white/10 text-white shadow-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(197,160,89,0.15)] shrink-0">
              <Server size={20} />
            </div>
            <div>
              <DialogTitle className="font-serif text-xl font-bold tracking-wide text-white">
                POS Terminal & Server Config
              </DialogTitle>
              <DialogDescription className="text-white/60 text-xs mt-0.5">
                Configure backend API routing for tablet and handheld devices.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Environment Status Pills */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Platform</span>
                {isNative ? <Smartphone size={13} className="text-primary" /> : <Monitor size={13} className="text-blue-400" />}
              </div>
              <span className="text-xs font-bold text-white capitalize">
                {isNative ? `Android APK (${platformName})` : 'Web Browser'}
              </span>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Active Host</span>
                <Wifi size={13} className={urlInput ? 'text-emerald-400' : 'text-amber-400'} />
              </div>
              <span className="text-xs font-mono font-medium truncate text-white/80">
                {urlInput || (isNative ? 'Local / Direct DB' : 'Relative (/api)')}
              </span>
            </div>
          </div>

          {/* Server URL Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="backend-server-address-input" className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center justify-between">
              <span>Backend Server Address</span>
              <span className="text-[10px] text-white/40 font-normal">e.g. http://192.168.1.100:3000</span>
            </label>
            <div className="flex gap-2">
              <Input
                id="backend-server-address-input"
                type="text"
                aria-label="Backend server network address"
                placeholder="http://192.168.1.X:3000"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setTestResult(null);
                }}
                className="bg-black/60 border-white/15 text-white font-mono text-xs focus-visible:ring-primary h-10"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                disabled={testing || !urlInput.trim()}
                className="border-white/15 bg-white/5 hover:bg-white/10 text-white shrink-0 text-xs px-3 h-10 cursor-pointer"
              >
                {testing ? (
                  <RefreshCw size={14} className="animate-spin text-primary" />
                ) : (
                  'Ping'
                )}
              </Button>
            </div>
          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex flex-col">
                <span className="font-bold">
                  {testResult.success ? 'Server Responding' : 'Connection Failed'}
                </span>
                <span className="text-[11px] opacity-80 mt-0.5">{testResult.message}</span>
              </div>
            </div>
          )}

          {/* Quick Presets for Android */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Quick Presets</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setUrlInput('http://10.0.2.2:3000');
                  setTestResult(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-white/70 hover:text-white transition-all cursor-pointer"
              >
                Emulator (10.0.2.2:3000)
              </button>
              <button
                type="button"
                onClick={() => {
                  setUrlInput('http://localhost:3000');
                  setTestResult(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-white/70 hover:text-white transition-all cursor-pointer"
              >
                localhost:3000
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-[10px] text-red-300 transition-all cursor-pointer flex items-center gap-1"
              >
                <Trash2 size={10} /> Reset Default
              </button>
            </div>
          </div>

          {/* LAN Connection Instructions Tip */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[11px] text-white/60 flex items-start gap-2.5 leading-relaxed">
            <HelpCircle size={14} className="text-primary shrink-0 mt-0.5" />
            <div>
              <strong className="text-white/90">Running on a Local Tablet:</strong> Connect your tablet to the same Wi-Fi as your POS computer. On your PC, open Command Prompt, run <code className="text-primary font-mono">ipconfig</code>, find the IPv4 Address (e.g. 192.168.1.50), and set it above with port <code className="text-primary font-mono">:3000</code>.
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-white/60 hover:text-white text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="bg-primary hover:bg-[#D4AF37] text-black font-bold text-xs uppercase tracking-wider px-5 shadow-[0_0_15px_rgba(197,160,89,0.25)] cursor-pointer"
          >
            <Save size={14} className="mr-1.5" /> Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
