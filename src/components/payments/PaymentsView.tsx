import React, { useState, useMemo } from 'react';
import { Order, OrderStatus } from '@/src/types';
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  Search, 
  Printer, 
  Phone, 
  Copy, 
  User, 
  Utensils, 
  Receipt, 
  Banknote, 
  QrCode, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Percent,
  TrendingUp,
  RotateCcw,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { soundService } from '@/src/lib/sound';

interface PaymentsViewProps {
  orders: Order[];
  allOrders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void> | void;
  discountPercentage?: number;
}

export function PaymentsView({
  orders,
  allOrders,
  onUpdateStatus,
  discountPercentage = 10
}: PaymentsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'dine_in' | 'counter'>('all');
  const [paymentMethods, setPaymentMethods] = useState<Record<string, 'cash' | 'upi' | 'card'>>({});
  const [isSettlingId, setIsSettlingId] = useState<string | null>(null);

  // Filter orders strictly with "waiting for payment" or "waiting_for_payment"
  const pendingPaymentOrders = useMemo(() => {
    // Look across allOrders + active orders
    const map = new Map<string, Order>();
    [...orders, ...allOrders].forEach(o => {
      const st = (o.status || '').toLowerCase().trim();
      if (st === 'waiting for payment' || st === 'waiting_for_payment') {
        map.set(o.id || o.token, o);
      }
    });

    const list = Array.from(map.values()).sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return list;
  }, [orders, allOrders]);

  // Filter based on search query and order type
  const filteredOrders = useMemo(() => {
    return pendingPaymentOrders.filter(order => {
      const q = searchQuery.toLowerCase().trim();
      const name = (order.customer_name || '').toLowerCase();
      const phone = (order.customer_phone || '').toLowerCase();
      const token = (order.token || '').toLowerCase();
      const table = order.table_id ? `table ${order.table_id}`.toLowerCase() : '';
      const gstin = (order.gstin || '').toLowerCase();

      const matchesSearch = !q || name.includes(q) || phone.includes(q) || token.includes(q) || table.includes(q) || gstin.includes(q);

      if (!matchesSearch) return false;

      if (selectedFilter === 'dine_in') {
        return !!order.table_id;
      }
      if (selectedFilter === 'counter') {
        return !order.table_id;
      }

      return true;
    });
  }, [pendingPaymentOrders, searchQuery, selectedFilter]);

  // Financial calculations
  const totalPendingAmount = useMemo(() => {
    return pendingPaymentOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  }, [pendingPaymentOrders]);

  const totalDineInWaiting = useMemo(() => {
    return pendingPaymentOrders.filter(o => !!o.table_id).length;
  }, [pendingPaymentOrders]);

  const settledTodayCount = useMemo(() => {
    const today = new Date().toDateString();
    return allOrders.filter(o => o.status === 'completed' && new Date(o.created_at).toDateString() === today).length;
  }, [allOrders]);

  const settledTodayAmount = useMemo(() => {
    const today = new Date().toDateString();
    return allOrders
      .filter(o => o.status === 'completed' && new Date(o.created_at).toDateString() === today)
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  }, [allOrders]);

  const handlePaymentDone = async (order: Order) => {
    const method = paymentMethods[order.id] || 'upi';
    setIsSettlingId(order.id);
    try {
      await onUpdateStatus(order.id, 'completed');
      soundService.playSuccessChime();
      soundService.triggerVibration([100, 50, 150]);
      toast.success(`Payment Done for Order #${order.token}!`, {
        description: `Collected ₹${Number(order.total).toFixed(2)} via ${method.toUpperCase()} for ${order.customer_name || 'Guest'}`
      });
    } catch (err: any) {
      toast.error('Failed to complete payment status update', { description: err?.message });
    } finally {
      setIsSettlingId(null);
    }
  };

  const setMethodForOrder = (orderId: string, method: 'cash' | 'upi' | 'card') => {
    setPaymentMethods(prev => ({ ...prev, [orderId]: method }));
  };

  const formatElapsed = (createdAtStr: string) => {
    try {
      const created = new Date(createdAtStr).getTime();
      const diffSec = Math.max(0, Math.floor((Date.now() - created) / 1000));
      if (diffSec < 60) return `${diffSec}s ago`;
      const mins = Math.floor(diffSec / 60);
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      return `${hrs}h ${mins % 60}m ago`;
    } catch {
      return 'Just now';
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto custom-scrollbar">
      
      {/* Top Banner & KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Pending Collections */}
        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#1E170C] to-[#0E0E14] p-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300/90">Awaiting Settlement</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Banknote size={17} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-serif font-bold text-amber-400 font-mono">
              ₹{totalPendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-white/70 mt-1 font-sans">
            {pendingPaymentOrders.length} {pendingPaymentOrders.length === 1 ? 'bill' : 'bills'} currently waiting
          </p>
        </div>

        {/* KPI 2: Active Tables Finishing */}
        <div className="rounded-3xl border border-white/10 bg-[#0F1016] p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Dine-in Tables</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/25 shadow-[0_0_15px_rgba(197,160,89,0.15)]">
              <Utensils size={17} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-serif font-bold text-white font-mono">
              {totalDineInWaiting}
            </span>
            <span className="text-xs text-white/70 font-medium font-sans">served tables</span>
          </div>
          <p className="text-[11px] text-white/70 mt-1 font-sans">
            Food served • Awaiting guest payment
          </p>
        </div>

        {/* KPI 3: Settled Today Count */}
        <div className="rounded-3xl border border-white/10 bg-[#0F1016] p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Settled Today</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <CheckCircle2 size={17} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-serif font-bold text-emerald-400 font-mono">
              {settledTodayCount}
            </span>
            <span className="text-xs text-emerald-400/80 font-medium font-sans">orders completed</span>
          </div>
          <p className="text-[11px] text-white/70 mt-1 font-sans">
            Successfully closed transactions
          </p>
        </div>

        {/* KPI 4: Settled Revenue Today */}
        <div className="rounded-3xl border border-white/10 bg-[#0F1016] p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Revenue Collected</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/25 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <TrendingUp size={17} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-serif font-bold text-white font-mono">
              ₹{settledTodayAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
          <p className="text-[11px] text-white/70 mt-1 font-sans">
            Total realized sales today
          </p>
        </div>
      </div>

      {/* Action Header & Search Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#0F1016] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
            <CreditCard size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-2xl font-serif font-bold text-white tracking-tight">Payments Desk</h2>
              <span className="rounded-full bg-amber-500/20 border border-amber-500/35 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-amber-300">
                {pendingPaymentOrders.length} Waiting for Payment
              </span>
            </div>
            <p className="text-[11px] text-white/70 font-sans">
              Orders marked as Served by captain • Click &quot;Payment Done&quot; to finalize bill
            </p>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Segment Filter */}
          <div className="flex items-center bg-[#141620] border border-white/10 rounded-xl p-1 shrink-0 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`min-h-[38px] px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                selectedFilter === 'all' ? 'bg-primary text-black shadow-md' : 'text-white/70 hover:text-white'
              }`}
            >
              All ({pendingPaymentOrders.length})
            </button>
            <button
              onClick={() => setSelectedFilter('dine_in')}
              className={`min-h-[38px] px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                selectedFilter === 'dine_in' ? 'bg-primary text-black shadow-md' : 'text-white/70 hover:text-white'
              }`}
            >
              Dine-In ({totalDineInWaiting})
            </button>
            <button
              onClick={() => setSelectedFilter('counter')}
              className={`min-h-[38px] px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                selectedFilter === 'counter' ? 'bg-primary text-black shadow-md' : 'text-white/70 hover:text-white'
              }`}
            >
              Takeaway ({pendingPaymentOrders.length - totalDineInWaiting})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search table, name, token..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141620] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-all font-sans"
            />
          </div>
        </div>
      </div>

      {/* Orders List / Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-[#0A0B0E] p-12 text-center my-4 min-h-[320px]">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-xl font-serif font-bold text-white tracking-tight">All Payments Settled</h3>
          <p className="text-xs text-white/40 max-w-md mt-1.5">
            There are currently no customers in the &quot;Waiting for Payment&quot; status. When a captain marks food as served, the order will appear here for instant bill settlement.
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-xs text-primary underline underline-offset-4 hover:opacity-80 cursor-pointer"
            >
              Clear Search Query
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {filteredOrders.map((order, idx) => {
              const selectedMethod = paymentMethods[order.id] || 'upi';
              const rawName = (order.customer_name || 'Guest Customer').trim();
              const isGuest = !rawName || rawName.toLowerCase() === 'guest' || rawName.toLowerCase() === 'guest order';
              const tableNum = order.table_id ? `Table ${String(order.table_id).replace(/^table\s*/i, '')}` : 'Counter / Takeaway';
              const isDineIn = !!order.table_id;
              const isProcessing = isSettlingId === order.id;

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                  className="rounded-3xl border border-amber-500/30 bg-[#0E0F14] hover:border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.05)] transition-all overflow-hidden"
                >
                  <div className="flex flex-col lg:flex-row items-stretch justify-between p-5 sm:p-6 gap-6">
                    
                    {/* Left: Customer Info, Token & Table */}
                    <div className="flex flex-col justify-between gap-4 flex-1 min-w-0">
                      <div>
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                          <span className="text-2xl sm:text-3xl font-serif font-bold text-amber-400 tracking-wider">
                            #{order.token}
                          </span>

                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                            isDineIn 
                              ? 'bg-primary/10 border-primary/30 text-primary' 
                              : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                          }`}>
                            {tableNum}
                          </span>

                          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2.5 py-0.5 rounded-full animate-pulse">
                            <Clock size={11} /> Waiting for Payment
                          </span>

                          <span className="text-[11px] text-white/70 font-mono">
                            {formatElapsed(order.created_at)}
                          </span>
                        </div>

                        {/* Customer Name & Phone */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <div className="flex items-center gap-1.5 text-white/95 font-medium text-base">
                            <User size={15} className="text-primary/70" />
                            <span>{rawName}</span>
                          </div>

                          {order.customer_phone && (
                            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full text-xs font-mono text-white/80">
                              <Phone size={12} className="text-white/60" />
                              <span>{order.customer_phone}</span>
                              <button
                                onClick={() => {
                                  if (order.customer_phone) {
                                    navigator.clipboard.writeText(order.customer_phone);
                                    toast.success('Phone copied to clipboard');
                                  }
                                }}
                                aria-label="Copy phone number"
                                className="text-white/50 hover:text-primary transition-colors cursor-pointer ml-0.5"
                                title="Copy Phone"
                              >
                                <Copy size={11} />
                              </button>
                            </div>
                          )}

                          {order.gstin && (
                            <span className="text-[10px] font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/70">
                              GSTIN: {order.gstin}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Items Ordered List Preview */}
                      <div className="bg-[#14161C] border border-white/5 rounded-2xl p-3 max-h-32 overflow-y-auto custom-scrollbar">
                        <div className="text-[9px] uppercase tracking-widest font-bold text-white/60 mb-2">
                          Order Breakdown ({order.items?.length || 0} items)
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {order.items?.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-xs text-white/90">
                              <span className="truncate pr-2">
                                <span className="font-bold text-amber-300 mr-1.5">{item.quantity}x</span>
                                {item.name}
                              </span>
                              <span className="font-mono text-white/70 text-[11px] shrink-0">
                                ₹{(item.price * item.quantity).toFixed(0)}
                              </span>
                            </div>
                          ))}
                        </div>
                        {order.notes && (
                          <div className="mt-2 pt-2 border-t border-white/5 text-[10px] text-amber-300/90 italic">
                            Note: {order.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Payment Method Selector & "Payment Done" Action Button */}
                    <div className="flex flex-col justify-between items-end border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6 gap-4 shrink-0 min-w-[280px]">
                      {/* Price Summary */}
                      <div className="w-full text-right">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 block mb-0.5">
                          Total Bill Due
                        </span>
                        <div className="text-3xl sm:text-4xl font-serif font-bold text-primary tracking-tight font-mono">
                          ₹{Number(order.total).toFixed(2)}
                        </div>
                        <span className="text-[10px] text-white/60 block mt-0.5">
                          Taxes &amp; GST included
                        </span>
                      </div>

                      {/* Payment Method Selector */}
                      <div className="w-full">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/70 block mb-1.5 text-left">
                          Settlement Method
                        </span>
                        <div className="grid grid-cols-3 gap-1.5 bg-[#14161C] p-1 rounded-xl border border-white/10">
                          <button
                            onClick={() => setMethodForOrder(order.id, 'upi')}
                            className={`min-h-[42px] flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 touch-manipulation ${
                              selectedMethod === 'upi'
                                ? 'bg-primary text-black shadow-md'
                                : 'text-white/70 hover:text-white'
                            }`}
                          >
                            <QrCode size={13} />
                            <span>UPI / QR</span>
                          </button>

                          <button
                            onClick={() => setMethodForOrder(order.id, 'cash')}
                            className={`min-h-[42px] flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 touch-manipulation ${
                              selectedMethod === 'cash'
                                ? 'bg-emerald-500 text-black shadow-md'
                                : 'text-white/70 hover:text-white'
                            }`}
                          >
                            <Banknote size={13} />
                            <span>Cash</span>
                          </button>

                          <button
                            onClick={() => setMethodForOrder(order.id, 'card')}
                            className={`min-h-[42px] flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 touch-manipulation ${
                              selectedMethod === 'card'
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'text-white/70 hover:text-white'
                            }`}
                          >
                            <CreditCard size={13} />
                            <span>Card</span>
                          </button>
                        </div>
                      </div>

                      {/* Primary "Payment Done" Action Button */}
                      <button
                        onClick={() => handlePaymentDone(order)}
                        disabled={isProcessing}
                        className="w-full min-h-[52px] flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black py-3.5 px-6 text-sm font-extrabold uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:scale-[1.02] active:scale-98 cursor-pointer disabled:opacity-50 touch-manipulation"
                      >
                        {isProcessing ? (
                          <>
                            <RotateCcw size={18} className="animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={18} />
                            <span>Payment Done</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

    </div>
  );
}
