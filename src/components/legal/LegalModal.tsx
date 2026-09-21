import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  Lock, 
  Cookie, 
  Scale, 
  Printer, 
  Download, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  TERMS_OF_SERVICE, 
  PRIVACY_POLICY, 
  DATA_PROCESSING_AGREEMENT, 
  COOKIE_POLICY, 
  GST_DISCLAIMER,
  LEGAL_DISCLAIMER_NOTICE,
  LegalDocument
} from './legalContent';

export type LegalDocType = 'terms' | 'privacy' | 'dpa' | 'cookies' | 'gst';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDoc?: LegalDocType;
}

export function LegalModal({ isOpen, onClose, initialDoc = 'terms' }: LegalModalProps) {
  const [activeDoc, setActiveDoc] = useState<LegalDocType>(initialDoc);

  // Sync state if initialDoc changes when opening
  React.useEffect(() => {
    setActiveDoc(initialDoc);
  }, [initialDoc, isOpen]);

  if (!isOpen) return null;

  const currentDocument: LegalDocument = (() => {
    switch (activeDoc) {
      case 'privacy':
        return PRIVACY_POLICY;
      case 'dpa':
        return DATA_PROCESSING_AGREEMENT;
      case 'cookies':
        return COOKIE_POLICY;
      case 'gst':
        return GST_DISCLAIMER;
      case 'terms':
      default:
        return TERMS_OF_SERVICE;
    }
  })();

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-[#0A0A0E] border border-white/10 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-white font-sans"
        >
          {/* Top Header Bar */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#0E0F15] shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(197,160,89,0.15)]">
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
                    Compliance &amp; Legal Center
                  </h2>
                  <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[9px] font-mono font-bold uppercase tracking-wider">
                    {currentDocument.version}
                  </span>
                </div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold mt-0.5">
                  Vyoma ScanServe Enterprise Governance Suite
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
                title="Print Legal Document"
              >
                <Printer size={13} />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/15 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                aria-label="Close Legal Center"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Document Type Tabs */}
          <div className="flex items-center gap-2 px-6 py-3 border-b border-white/5 bg-black/40 overflow-x-auto custom-scrollbar shrink-0">
            <button
              type="button"
              onClick={() => setActiveDoc('terms')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                activeDoc === 'terms'
                  ? 'bg-primary text-black shadow-[0_0_15px_rgba(197,160,89,0.3)] font-extrabold'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText size={14} />
              <span>Terms of Service</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDoc('privacy')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                activeDoc === 'privacy'
                  ? 'bg-primary text-black shadow-[0_0_15px_rgba(197,160,89,0.3)] font-extrabold'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Lock size={14} />
              <span>Privacy (DPDP/GDPR)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDoc('dpa')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                activeDoc === 'dpa'
                  ? 'bg-primary text-black shadow-[0_0_15px_rgba(197,160,89,0.3)] font-extrabold'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Scale size={14} />
              <span>DPA Schedule</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDoc('cookies')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                activeDoc === 'cookies'
                  ? 'bg-primary text-black shadow-[0_0_15px_rgba(197,160,89,0.3)] font-extrabold'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Cookie size={14} />
              <span>Cookies &amp; Storage</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDoc('gst')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                activeDoc === 'gst'
                  ? 'bg-primary text-black shadow-[0_0_15px_rgba(197,160,89,0.3)] font-extrabold'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <CheckCircle2 size={14} />
              <span>GST Tax Disclaimer</span>
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-8 custom-scrollbar space-y-8">
            {/* Document Title Header */}
            <div className="border-b border-white/10 pb-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-primary">
                  Official Legal Schedule
                </span>
                <span className="text-[10px] font-mono text-white/50">
                  Effective: <strong className="text-white/80">{currentDocument.effectiveDate}</strong>
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
                {currentDocument.title}
              </h1>
              <p className="text-xs sm:text-sm text-white/70 mt-2 font-sans">
                {currentDocument.subtitle}
              </p>
            </div>

            {/* Mandatory Regulatory Alert Notice */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3.5">
              <AlertCircle size={18} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-white/70 leading-relaxed italic">
                {LEGAL_DISCLAIMER_NOTICE}
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-8">
              {currentDocument.sections.map((sec) => (
                <div key={sec.id} className="space-y-3">
                  <h3 className="text-base sm:text-lg font-serif font-bold text-white tracking-wide flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {sec.title}
                  </h3>
                  <div className="text-xs sm:text-sm text-white/80 leading-relaxed font-sans whitespace-pre-line pl-3.5 border-l border-white/10 max-w-3xl">
                    {sec.content}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="px-6 py-4 border-t border-white/10 bg-[#0E0F15] flex flex-wrap items-center justify-between gap-4 shrink-0 text-xs font-mono text-white/50">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>India DPDP Act 2023 &bull; GDPR Ready &bull; CGST Sec 31 Compliant</span>
            </div>

            <Button
              onClick={onClose}
              className="bg-primary text-black hover:bg-[#D4AF37] font-bold text-[10px] uppercase tracking-wider rounded-xl px-5 py-2 cursor-pointer shadow-[0_0_15px_rgba(197,160,89,0.25)] active:scale-95"
            >
              Close Legal Center
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
