import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Printer, 
  Download, 
  Wifi, 
  Utensils, 
  Sparkles, 
  Copy, 
  ExternalLink,
  Layers,
  ChevronRight
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RestaurantTable } from '@/src/types';
import QRCode from 'qrcode';
import { toast } from 'sonner';

interface TableQrModalProps {
  tables?: RestaurantTable[];
  activeTableId?: string | number;
  triggerButton?: React.ReactNode;
}

const DEFAULT_TABLES = Array.from({ length: 20 }, (_, i) => {
  const num = String(i + 1).padStart(2, '0');
  return {
    id: `t_${num}`,
    table_number: `T-${num}`,
    capacity: 4,
    status: 'available' as const,
    section: i < 8 ? 'Main Dining' : i < 14 ? 'Patio' : 'Private Lounge'
  };
});

export function TableQrModal({ tables = DEFAULT_TABLES, activeTableId, triggerButton }: TableQrModalProps) {
  const [open, setOpen] = useState(false);
  const displayTables = tables.length > 0 ? tables : DEFAULT_TABLES;
  
  const [selectedTableNumber, setSelectedTableNumber] = useState<string>(() => {
    if (activeTableId) {
      const match = displayTables.find(t => String(t.id) === String(activeTableId) || t.table_number === String(activeTableId));
      if (match) return match.table_number;
    }
    return displayTables[0]?.table_number || 'T-01';
  });

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [wifiSsid, setWifiSsid] = useState('Vyoma_Guest');
  const [wifiPassword, setWifiPassword] = useState('welcome@vyoma');
  const [restaurantName, setRestaurantName] = useState('Vyoma Luxury Dining');
  const [batchMode, setBatchMode] = useState(false);
  const [batchQrs, setBatchQrs] = useState<Record<string, string>>({});

  // Construct target order URL
  const getTableUrl = (tblNum: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vyoma.pos';
    return `${origin}/?table=${encodeURIComponent(tblNum)}&order_mode=qr_dinein`;
  };

  // Generate single table QR
  useEffect(() => {
    if (!open) return;
    const url = getTableUrl(selectedTableNumber);
    QRCode.toDataURL(url, {
      width: 480,
      margin: 1.5,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Failed to generate QR:', err));
  }, [selectedTableNumber, open]);

  // Generate batch QRs when entering batch mode
  useEffect(() => {
    if (!batchMode || !open) return;
    const promises = displayTables.map(t => {
      const url = getTableUrl(t.table_number);
      return QRCode.toDataURL(url, { width: 360, margin: 1, errorCorrectionLevel: 'H' })
        .then(dataUrl => ({ num: t.table_number, dataUrl }));
    });

    Promise.all(promises).then(results => {
      const map: Record<string, string> = {};
      results.forEach(r => { map[r.num] = r.dataUrl; });
      setBatchQrs(map);
    });
  }, [batchMode, open, displayTables]);

  const handleCopyLink = () => {
    const url = getTableUrl(selectedTableNumber);
    navigator.clipboard.writeText(url);
    toast.success(`Copied table order link: ${url}`);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_${selectedTableNumber}.png`;
    link.click();
    toast.success(`Downloaded QR code for ${selectedTableNumber}`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button
            variant="outline"
            className="rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary hover:text-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <QrCode size={14} />
            <span>Table QRs &amp; Tent Cards</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-4xl bg-[#090A0E] border border-white/10 text-white p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-2xl max-h-[92vh] flex flex-col custom-scrollbar">
        <DialogHeader className="space-y-1 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <QrCode size={20} />
              </div>
              <div>
                <DialogTitle className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-white flex items-center gap-2">
                  Table QR Hub &amp; Tent Cards
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[9px] uppercase tracking-wider font-mono">
                    Zero Add-On Fee
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-white/50">
                  Generate contactless dining QR codes and print luxury acrylic table tents with built-in Wi-Fi details.
                </DialogDescription>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={batchMode ? "default" : "outline"}
                onClick={() => setBatchMode(!batchMode)}
                className={`text-xs rounded-xl h-9 px-3 ${batchMode ? 'bg-primary text-black font-bold' : 'border-white/10 text-white/80'}`}
              >
                <Layers size={14} className="mr-1.5" />
                {batchMode ? "Show Single Card" : "Batch View All"}
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handlePrint}
                className="bg-primary text-black font-bold hover:bg-primary/90 rounded-xl h-9 px-3 text-xs tracking-wider uppercase flex items-center gap-1.5"
              >
                <Printer size={14} />
                Print Tent Cards
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Printable CSS Hook */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-tent-card, #printable-tent-card * {
              visibility: visible;
            }
            #printable-tent-card {
              position: absolute;
              left: 0;
              top: 0;
              width: 100vw;
              height: 100vh;
              background: #000000 !important;
              color: #FFFFFF !important;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
              margin: 0;
            }
          }
        `}} />

        <div className="flex-1 overflow-y-auto space-y-6 my-2 pr-1 custom-scrollbar">
          {/* Table Selector Pills */}
          {!batchMode && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 block">
                Select Table ({displayTables.length} Active Tables):
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {displayTables.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTableNumber(t.table_number)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider font-mono transition-all cursor-pointer shrink-0 ${
                      selectedTableNumber === t.table_number
                        ? 'bg-primary text-black shadow-[0_0_15px_rgba(197,160,89,0.3)] font-extrabold scale-105'
                        : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {t.table_number}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Single Table Card Preview */}
          {!batchMode ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Luxury Tent Card Visual Preview */}
              <div className="md:col-span-7 flex flex-col items-center justify-center">
                <div 
                  id="printable-tent-card"
                  className="w-full max-w-[340px] aspect-[4/6] bg-[#000000] border-2 border-[#C5A059] rounded-3xl p-6 flex flex-col items-center justify-between text-center relative shadow-[0_0_50px_rgba(197,160,89,0.15)] overflow-hidden"
                >
                  {/* Decorative Corner Filigree Accents */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#C5A059]" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#C5A059]" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#C5A059]" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#C5A059]" />

                  {/* Top Branding */}
                  <div className="space-y-1 mt-1">
                    <div className="flex items-center justify-center gap-1.5 text-[#C5A059]">
                      <Sparkles size={14} />
                      <span className="text-[10px] tracking-[0.25em] uppercase font-bold">Touchless Dining</span>
                      <Sparkles size={14} />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-white tracking-tight leading-none">
                      {restaurantName}
                    </h3>
                  </div>

                  {/* Table Badge */}
                  <div className="my-1">
                    <div className="inline-block px-4 py-1 rounded-full bg-[#C5A059]/15 border border-[#C5A059] text-[#C5A059] font-mono text-sm font-black tracking-widest uppercase">
                      {selectedTableNumber}
                    </div>
                  </div>

                  {/* QR Code Container */}
                  <div className="bg-white p-3.5 rounded-2xl shadow-xl flex items-center justify-center border-4 border-[#0D0E15]">
                    {qrDataUrl ? (
                      <img 
                        src={qrDataUrl} 
                        alt={`QR Code for ${selectedTableNumber}`} 
                        className="w-44 h-44 object-contain rounded-lg" 
                      />
                    ) : (
                      <div className="w-44 h-44 flex items-center justify-center text-black/50 font-mono text-xs">
                        Generating QR...
                      </div>
                    )}
                  </div>

                  {/* Instructions */}
                  <div className="space-y-1">
                    <p className="text-xs font-serif font-semibold text-white tracking-wide">
                      Scan with Phone Camera to Order &amp; Pay
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-white/50">
                      No app download required • Instant Kitchen Dispatch
                    </p>
                  </div>

                  {/* Wi-Fi Details Badge */}
                  <div className="w-full bg-[#111219] border border-white/10 rounded-xl px-3 py-1.5 flex items-center justify-around text-[10px] text-white/70">
                    <div className="flex items-center gap-1 text-[#C5A059]">
                      <Wifi size={11} />
                      <span className="font-mono font-bold">{wifiSsid}</span>
                    </div>
                    <span className="text-white/20">|</span>
                    <span className="font-mono text-white/60">Pass: {wifiPassword}</span>
                  </div>
                </div>
              </div>

              {/* Customization & Quick Actions Column */}
              <div className="md:col-span-5 space-y-4">
                <div className="bg-[#10121A] p-4 rounded-2xl border border-white/10 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                    <Sparkles size={13} /> Tent Card Customization
                  </h4>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-white/60">Restaurant Header</label>
                    <input
                      type="text"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      className="w-full bg-[#08090D] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-white/60">Wi-Fi Name</label>
                      <input
                        type="text"
                        value={wifiSsid}
                        onChange={(e) => setWifiSsid(e.target.value)}
                        className="w-full bg-[#08090D] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-white/60">Wi-Fi Password</label>
                      <input
                        type="text"
                        value={wifiPassword}
                        onChange={(e) => setWifiPassword(e.target.value)}
                        className="w-full bg-[#08090D] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Direct Link Info & Actions */}
                <div className="bg-[#10121A] p-4 rounded-2xl border border-white/10 space-y-3">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-white/60 block">
                    Scannable Target Link:
                  </span>
                  <div className="flex items-center gap-2 bg-[#08090D] p-2.5 rounded-xl border border-white/5 font-mono text-[11px] text-white/70 overflow-hidden text-ellipsis whitespace-nowrap">
                    <span className="truncate flex-1">{getTableUrl(selectedTableNumber)}</span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="text-primary hover:text-white p-1 rounded transition-colors"
                      title="Copy URL"
                    >
                      <Copy size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDownloadQr}
                      className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs h-9"
                    >
                      <Download size={13} className="mr-1.5 text-primary" />
                      Save PNG
                    </Button>

                    <Button
                      type="button"
                      onClick={() => window.open(getTableUrl(selectedTableNumber), '_blank')}
                      className="bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary hover:text-white rounded-xl text-xs h-9"
                    >
                      <ExternalLink size={13} className="mr-1.5" />
                      Test Scan
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Batch View: All Tables Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {displayTables.map(t => {
                const qrUrl = batchQrs[t.table_number];
                return (
                  <div 
                    key={t.id} 
                    className="bg-[#000000] border border-[#C5A059]/40 rounded-2xl p-4 flex flex-col items-center justify-between text-center space-y-2 hover:border-[#C5A059] transition-all"
                  >
                    <div className="font-mono font-bold text-xs text-primary px-3 py-0.5 rounded-full bg-primary/10 border border-primary/30">
                      {t.table_number}
                    </div>
                    <div className="bg-white p-2 rounded-xl">
                      {qrUrl ? (
                        <img src={qrUrl} alt={t.table_number} className="w-28 h-28 object-contain" />
                      ) : (
                        <div className="w-28 h-28 flex items-center justify-center text-black/50 text-[10px]">Loading...</div>
                      )}
                    </div>
                    <span className="text-[10px] text-white/50 uppercase tracking-wider">{t.section || 'Main Dining'}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
