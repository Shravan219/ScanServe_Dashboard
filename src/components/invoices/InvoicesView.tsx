import React, { useState } from 'react';
import { MenuItem } from '@/src/types';
import { InvoiceCreator } from './InvoiceCreator';
import { InvoiceHistory } from './InvoiceHistory';
import { PlusCircle, History } from 'lucide-react';

interface InvoicesViewProps {
  menuItems: MenuItem[];
  orders: any[];
  onOrderCreated?: (newOrder: any) => void;
  onRefreshLedger?: () => void;
}

export function InvoicesView({
  menuItems,
  orders,
  onOrderCreated,
  onRefreshLedger
}: InvoicesViewProps) {
  const [subView, setSubView] = useState<'create' | 'history'>('create');

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-0 bg-black">
      {/* Sub-Navigation Switcher Bar */}
      <div className="border-b border-white/10 bg-[#0A0A0E]/80 backdrop-blur-xl px-6 py-3.5 sticky top-0 z-20 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 bg-[#0D0E14] p-1.5 rounded-full border border-white/10 shadow-lg">
            <button
              type="button"
              onClick={() => setSubView('create')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all cursor-pointer ${
                subView === 'create'
                  ? 'bg-primary text-black shadow-[0_0_20px_rgba(197,160,89,0.35)] font-extrabold'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <PlusCircle size={14} />
              Create Invoice
            </button>

            <button
              type="button"
              onClick={() => setSubView('history')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all cursor-pointer ${
                subView === 'history'
                  ? 'bg-primary text-black shadow-[0_0_20px_rgba(197,160,89,0.35)] font-extrabold'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <History size={14} />
              History &amp; Ledger
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.25em] text-white/60 font-bold font-mono">
              DIRECT POS BILLING
            </span>
            <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 min-h-0 pb-12">
        {subView === 'create' ? (
          <InvoiceCreator
            menuItems={menuItems}
            onOrderCreated={onOrderCreated}
          />
        ) : (
          <InvoiceHistory
            orders={orders}
            onRefresh={onRefreshLedger}
          />
        )}
      </div>
    </div>
  );
}
