import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  TrendingUp,
  Receipt,
  Search,
  Printer,
  Calendar,
  CreditCard,
  QrCode,
  Banknote,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { InvoiceReceiptModal, SavedInvoiceData } from './InvoiceReceiptModal';

interface InvoiceHistoryProps {
  orders: any[];
  onRefresh?: () => void;
}

export function InvoiceHistory({ orders, onRefresh }: InvoiceHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<SavedInvoiceData | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'UPI' | 'CASH' | 'CARD'>('ALL');

  // Filter only relevant completed/walk-in/invoiced orders
  const allInvoices = useMemo(() => {
    return (orders || []).filter(o => {
      // Return orders that are completed or generated
      return o && (o.id || o.token);
    });
  }, [orders]);

  // Analytics Computations
  const analytics = useMemo(() => {
    const totalRevenue = allInvoices.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    const totalCount = allInvoices.length;
    const aov = totalCount > 0 ? totalRevenue / totalCount : 0;

    // Payment mode breakdown
    let upiCount = 0;
    let cashCount = 0;
    let cardCount = 0;

    for (const o of allInvoices) {
      const notes = (o.notes || '').toUpperCase();
      const mode = (o.payment_mode || o.payment_method || '').toUpperCase();

      if (mode.includes('CASH') || notes.includes('CASH')) {
        cashCount++;
      } else if (mode.includes('CARD') || notes.includes('CARD')) {
        cardCount++;
      } else {
        upiCount++;
      }
    }

    return {
      totalRevenue,
      totalCount,
      aov,
      upiCount,
      cashCount,
      cardCount
    };
  }, [allInvoices]);

  // Filtered Invoices Table
  const filteredInvoices = useMemo(() => {
    return allInvoices.filter((inv) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        (inv.customer_name || '').toLowerCase().includes(search) ||
        (inv.customer_phone || '').toLowerCase().includes(search) ||
        (inv.token || '').toLowerCase().includes(search) ||
        (inv.id || '').toLowerCase().includes(search);

      if (!matchesSearch) return false;

      if (paymentFilter !== 'ALL') {
        const notes = (inv.notes || '').toUpperCase();
        const mode = (inv.payment_mode || inv.payment_method || '').toUpperCase();
        if (paymentFilter === 'CASH' && !notes.includes('CASH') && !mode.includes('CASH')) return false;
        if (paymentFilter === 'CARD' && !notes.includes('CARD') && !mode.includes('CARD')) return false;
        if (paymentFilter === 'UPI' && (notes.includes('CASH') || notes.includes('CARD') || mode.includes('CASH') || mode.includes('CARD'))) return false;
      }

      return true;
    });
  }, [allInvoices, searchTerm, paymentFilter]);

  const handleOpenReceipt = (inv: any) => {
    const items = Array.isArray(inv.items)
      ? inv.items.map((it: any) => ({
          name: it.name || it.itemName || 'Item',
          price: Number(it.price || it.rate || 0),
          quantity: Number(it.quantity || it.qty || 1)
        }))
      : [];

    const subtotal = items.reduce((sum: number, it: any) => sum + (it.price * it.quantity), 0);

    const invoiceData: SavedInvoiceData = {
      id: inv.id || `INV-${inv.token || Date.now()}`,
      token: inv.token,
      customer_name: inv.customer_name || 'Guest Customer',
      customer_phone: inv.customer_phone || 'Masked Number',
      items,
      subtotal: subtotal > 0 ? subtotal : Number(inv.total) || 0,
      total: Number(inv.total) || 0,
      table_id: inv.table_id || 'Walk-in POS',
      created_at: inv.created_at,
      gstin: inv.gstin,
      payment_mode: (inv.notes || '').includes('CASH') ? 'CASH' : (inv.notes || '').includes('CARD') ? 'CARD' : 'UPI'
    };

    setSelectedInvoice(invoiceData);
    setIsReceiptModalOpen(true);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(197,160,89,0.15)]">
              <TrendingUp size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-3xl font-serif tracking-tight text-white">
                Invoice <span className="italic text-primary font-normal">History & Analytics</span>
              </h1>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold">
                Real-Time Invoicing Ledger & Revenue Insights
              </p>
            </div>
          </div>
        </div>

        {onRefresh && (
          <Button
            type="button"
            variant="outline"
            onClick={onRefresh}
            className="border-white/10 hover:border-white/20 text-white/60 hover:text-white rounded-full text-[10px] uppercase tracking-[0.2em] font-bold h-11 px-5 bg-white/5 transition-all"
          >
            <RefreshCw size={13} className="mr-2" />
            Sync Ledger
          </Button>
        )}
      </div>

      {/* Real-Time Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <Card className="bg-[#0A0A0A] border-white/5 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group hover:border-primary/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] uppercase tracking-[0.25em] text-white/40 font-bold">
              Total Revenue
            </span>
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="text-3xl font-serif font-bold text-primary tracking-tight">
            ₹{analytics.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-mono mt-2 block">
            Across {analytics.totalCount} Invoices
          </span>
        </Card>

        {/* Total Invoices Issued */}
        <Card className="bg-[#0A0A0A] border-white/5 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group hover:border-primary/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] uppercase tracking-[0.25em] text-white/40 font-bold">
              Invoices Issued
            </span>
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Receipt size={16} />
            </div>
          </div>
          <p className="text-3xl font-serif font-bold text-white tracking-tight">
            {analytics.totalCount}
          </p>
          <span className="text-[9px] uppercase tracking-wider text-white/30 font-mono mt-2 block">
            Ledger transactions
          </span>
        </Card>

        {/* Average Order Value (AOV) */}
        <Card className="bg-[#0A0A0A] border-white/5 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group hover:border-primary/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] uppercase tracking-[0.25em] text-white/40 font-bold">
              Average Order Value (AOV)
            </span>
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-3xl font-serif font-bold text-primary tracking-tight">
            ₹{analytics.aov.toFixed(2)}
          </p>
          <span className="text-[9px] uppercase tracking-wider text-white/30 font-mono mt-2 block">
            Per transaction average
          </span>
        </Card>

        {/* Payment Mode Breakdown */}
        <Card className="bg-[#0A0A0A] border-white/5 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group hover:border-primary/30 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase tracking-[0.25em] text-white/40 font-bold">
              Payment Breakdown
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <QrCode size={16} />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-2">
            <div className="text-center">
              <span className="text-[9px] text-white/40 block font-bold">UPI</span>
              <span className="font-mono font-bold text-white">{analytics.upiCount}</span>
            </div>
            <div className="text-center border-l border-r border-white/5 px-4">
              <span className="text-[9px] text-white/40 block font-bold">Cash</span>
              <span className="font-mono font-bold text-white">{analytics.cashCount}</span>
            </div>
            <div className="text-center">
              <span className="text-[9px] text-white/40 block font-bold">Card</span>
              <span className="font-mono font-bold text-white">{analytics.cardCount}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0A0A0A] border border-white/5 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Input
            type="text"
            placeholder="Search by customer, phone, token, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-black/60 border-white/10 rounded-xl h-11 text-xs text-white pl-9 placeholder:text-white/20"
          />
          <Search size={14} className="absolute left-3 top-3.5 text-white/30 pointer-events-none" />
        </div>

        {/* Payment Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {(['ALL', 'UPI', 'CASH', 'CARD'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setPaymentFilter(filter)}
              className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all ${
                paymentFilter === filter
                  ? 'bg-primary text-black shadow-[0_0_15px_rgba(197,160,89,0.2)]'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Searchable Invoices Table */}
      <Card className="bg-[#0A0A0A] border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-black/40 text-[9px] uppercase tracking-[0.25em] text-white/40 font-bold">
                <th className="py-4 px-6">Invoice ID / Token</th>
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-6">Items Breakdown</th>
                <th className="py-4 px-6 text-center">Payment</th>
                <th className="py-4 px-6 text-right">Grand Total</th>
                <th className="py-4 px-6">Date & Time</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-white/80">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-white/30 italic">
                    No invoices found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const items = Array.isArray(inv.items) ? inv.items : [];
                  const itemsCount = items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);
                  const isCash = (inv.notes || '').toUpperCase().includes('CASH');
                  const isCard = (inv.notes || '').toUpperCase().includes('CARD');
                  const paymentBadge = isCash ? 'Cash' : isCard ? 'Card' : 'UPI';

                  return (
                    <tr key={inv.id || inv.token} className="hover:bg-white/[0.02] transition-colors group">
                      {/* Invoice ID / Token */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-primary">
                            {inv.token || `#${(inv.id || '').slice(-4)}`}
                          </span>
                          <span className="text-[9px] uppercase tracking-wider text-white/30 hidden sm:inline">
                            {inv.id}
                          </span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-semibold text-white group-hover:text-primary transition-colors">
                            {inv.customer_name || 'Guest Customer'}
                          </p>
                          <p className="text-[10px] text-white/40 font-mono">
                            {inv.customer_phone || 'Masked Number'}
                          </p>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 text-[10px] text-white/70 font-mono">
                          {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                        </span>
                        {items.length > 0 && (
                          <p className="text-[10px] text-white/30 truncate max-w-xs mt-1">
                            {items.map((it: any) => it.name || it.itemName).join(', ')}
                          </p>
                        )}
                      </td>

                      {/* Payment */}
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                            paymentBadge === 'UPI'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : paymentBadge === 'Cash'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}
                        >
                          {paymentBadge === 'UPI' && <QrCode size={11} />}
                          {paymentBadge === 'Cash' && <Banknote size={11} />}
                          {paymentBadge === 'Card' && <CreditCard size={11} />}
                          {paymentBadge}
                        </span>
                      </td>

                      {/* Grand Total */}
                      <td className="py-4 px-6 text-right">
                        <span className="font-serif font-bold text-base text-primary">
                          ₹{Number(inv.total || 0).toFixed(2)}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="py-4 px-6 text-white/40 text-[11px] font-mono">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-white/20" />
                          {new Date(inv.created_at || Date.now()).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleOpenReceipt(inv)}
                          className="border-white/10 hover:border-primary/40 text-white/80 hover:text-primary rounded-full h-8 px-3 text-[9px] uppercase tracking-wider font-bold bg-white/5 transition-all"
                        >
                          <Printer size={12} className="mr-1.5" />
                          View Receipt
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invoice Receipt Modal */}
      <InvoiceReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        invoice={selectedInvoice}
      />
    </div>
  );
}
