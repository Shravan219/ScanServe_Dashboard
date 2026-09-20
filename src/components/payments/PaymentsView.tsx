import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, OrderItem } from '@/src/types';
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
  Banknote, 
  QrCode, 
  Sparkles, 
  RotateCcw, 
  MessageSquare, 
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { soundService } from '@/src/lib/sound';
import { supabase } from '@/src/lib/supabase';
import { 
  OrderReceiptData,
  formatPhoneNumber, 
  sendWhatsAppReceiptWithPDF
} from '@/src/lib/whatsapp';

export interface GroupedInvoice {
  groupKey: string;
  order_ids: string[];
  tokens: string[];
  customer_name?: string;
  customer_phone?: string;
  table_id?: string | number;
  subtotal: number;
  tax: number;
  grand_total: number;
  items: OrderItem[];
  mergedCount: number;
  created_at: string;
  gstin?: string;
  notes?: string;
}

export interface PaymentsViewProps {
  orders: Order[];
  allOrders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void> | void;
  discountPercentage?: number;
}

interface SettledInvoiceRecord {
  invoice: GroupedInvoice;
  paymentMode: 'cash' | 'upi' | 'card';
  settledAt: string;
}

/**
 * Groups unpaid orders by composite key: Table ID + Customer Identity (Phone/Name).
 * - Filters out orders that are already COMPLETED or PAID.
 * - Key formula: `${order.table_id || 'TAKEAWAY'}_${(order.customer_phone || order.customer_name || 'walk-in').toLowerCase().trim()}`
 * - Aggregates matching orders into a single consolidated invoice object.
 * - Zero runtime mutation of input arrays or nested objects.
 */
export function groupOrdersByCustomerAndTable(orders: Order[]): GroupedInvoice[] {
  // Filter out orders that are already COMPLETED or PAID
  const unpaid = orders.filter(o => {
    const st = (o.status || '').toLowerCase().trim();
    const paySt = (((o as unknown as { payment_status?: string }).payment_status) || '').toLowerCase().trim();
    return st !== 'completed' && st !== 'paid' && paySt !== 'paid' && st !== 'cancelled';
  });

  const groups = new Map<string, GroupedInvoice>();

  unpaid.forEach(order => {
    const rawCustomerIdentity = order.customer_phone || order.customer_name || 'walk-in';
    const groupKey = `${order.table_id || 'TAKEAWAY'}_${rawCustomerIdentity.toLowerCase().trim()}`;

    // Safely clone items to prevent mutation
    const orderItems: OrderItem[] = (order.items || []).map(item => ({
      id: item.id || crypto.randomUUID(),
      name: item.name,
      quantity: Number(item.quantity) || 1,
      price: Number(item.price) || 0,
      item_notes: item.item_notes
    }));

    const rawSubtotal = (order as unknown as { subtotal?: number }).subtotal;
    const rawTax = (order as unknown as { tax_amount?: number }).tax_amount;

    const orderSubtotal = Number(rawSubtotal) || 
      orderItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
    const orderTax = Number(rawTax) || 0;
    const orderTotal = Number(order.total) || (orderSubtotal + orderTax);
    const orderToken = order.token ? String(order.token) : (order.id ? order.id.slice(-4) : '0000');

    const existing = groups.get(groupKey);

    if (existing) {
      // 1. Collect order ID into array
      if (!existing.order_ids.includes(order.id)) {
        existing.order_ids.push(order.id);
      }

      // Track distinct tokens
      if (!existing.tokens.includes(orderToken)) {
        existing.tokens.push(orderToken);
      }

      // 2. Aggregate item quantities
      orderItems.forEach(newItem => {
        const match = existing.items.find(
          existingItem => existingItem.name.toLowerCase().trim() === newItem.name.toLowerCase().trim()
        );
        if (match) {
          match.quantity += newItem.quantity;
        } else {
          existing.items.push({ ...newItem });
        }
      });

      // 3. Calculate running totals
      existing.subtotal += orderSubtotal;
      existing.tax += orderTax;
      existing.grand_total += orderTotal;

      // 4. Retain customer information
      if (
        order.customer_name && 
        (!existing.customer_name || existing.customer_name.toLowerCase() === 'guest' || existing.customer_name.toLowerCase() === 'walk-in')
      ) {
        existing.customer_name = order.customer_name;
      }

      if (order.customer_phone && !existing.customer_phone) {
        existing.customer_phone = order.customer_phone;
      }

      if (order.gstin && !existing.gstin) {
        existing.gstin = order.gstin;
      }

      if (order.notes) {
        existing.notes = existing.notes ? `${existing.notes} | ${order.notes}` : order.notes;
      }

      if (order.table_id !== undefined && existing.table_id === undefined) {
        existing.table_id = order.table_id;
      }

      existing.mergedCount = existing.order_ids.length;
    } else {
      const aggregatedItems: OrderItem[] = [];
      orderItems.forEach(newItem => {
        const match = aggregatedItems.find(
          it => it.name.toLowerCase().trim() === newItem.name.toLowerCase().trim()
        );
        if (match) {
          match.quantity += newItem.quantity;
        } else {
          aggregatedItems.push({ ...newItem });
        }
      });

      groups.set(groupKey, {
        groupKey,
        order_ids: [order.id],
        tokens: [orderToken],
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        table_id: order.table_id,
        subtotal: orderSubtotal,
        tax: orderTax,
        grand_total: orderTotal,
        items: aggregatedItems,
        mergedCount: 1,
        created_at: order.created_at,
        gstin: order.gstin,
        notes: order.notes
      });
    }
  });

  return Array.from(groups.values());
}

export function PaymentsView({
  orders,
  allOrders,
  onUpdateStatus,
  discountPercentage
}: PaymentsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'dine_in' | 'counter'>('all');
  const [paymentMethods, setPaymentMethods] = useState<Record<string, 'cash' | 'upi' | 'card'>>({});
  const [isSettlingKey, setIsSettlingKey] = useState<string | null>(null);
  
  const [settledInvoices, setSettledInvoices] = useState<Record<string, SettledInvoiceRecord>>({});
  const [customerPhoneInputs, setCustomerPhoneInputs] = useState<Record<string, string>>({});

  const pendingPaymentOrders = useMemo(() => {
    const map = new Map<string, Order>();
    [...orders, ...allOrders].forEach(o => {
      const st = (o.status || '').toLowerCase().trim();
      const paySt = (((o as unknown as { payment_status?: string }).payment_status) || '').toLowerCase().trim();
      
      const isPending = 
        st === 'waiting for payment' || 
        st === 'waiting_for_payment' || 
        (st !== 'completed' && st !== 'paid' && st !== 'cancelled' && paySt !== 'paid');

      if (isPending) {
        map.set(o.id || o.token, o);
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [orders, allOrders]);

  const groupedInvoices = useMemo(() => {
    return groupOrdersByCustomerAndTable(pendingPaymentOrders);
  }, [pendingPaymentOrders]);

  const filteredInvoices = useMemo(() => {
    return groupedInvoices.filter(invoice => {
      const q = searchQuery.toLowerCase().trim();
      const name = (invoice.customer_name || '').toLowerCase();
      const phone = (invoice.customer_phone || '').toLowerCase();
      const tokens = invoice.tokens.join(' ').toLowerCase();
      const table = invoice.table_id ? `table ${invoice.table_id}`.toLowerCase() : 'takeaway';
      const gstin = (invoice.gstin || '').toLowerCase();

      const matchesSearch = !q || 
        name.includes(q) || 
        phone.includes(q) || 
        tokens.includes(q) || 
        table.includes(q) || 
        gstin.includes(q);

      if (!matchesSearch) return false;

      const isDineIn = !!invoice.table_id && String(invoice.table_id).toUpperCase() !== 'TAKEAWAY';

      if (selectedFilter === 'dine_in') {
        return isDineIn;
      }
      if (selectedFilter === 'counter') {
        return !isDineIn;
      }

      return true;
    });
  }, [groupedInvoices, searchQuery, selectedFilter]);

  const displayInvoices = useMemo(() => {
    const pendingList = filteredInvoices.filter(inv => !settledInvoices[inv.groupKey]);
    const settledList = (Object.values(settledInvoices) as SettledInvoiceRecord[]).map(s => s.invoice);
    return [...settledList, ...pendingList];
  }, [filteredInvoices, settledInvoices]);

  const totalPendingAmount = useMemo(() => {
    return groupedInvoices.reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0);
  }, [groupedInvoices]);

  const totalDineInWaiting = useMemo(() => {
    return groupedInvoices.filter(inv => !!inv.table_id && String(inv.table_id).toUpperCase() !== 'TAKEAWAY').length;
  }, [groupedInvoices]);

  const totalCounterWaiting = useMemo(() => {
    return groupedInvoices.filter(inv => !inv.table_id || String(inv.table_id).toUpperCase() === 'TAKEAWAY').length;
  }, [groupedInvoices]);

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

  const buildReceiptData = (invoice: GroupedInvoice, paymentMode = 'UPI'): OrderReceiptData => {
    return {
      id: invoice.order_ids[0] || 'ORD-001',
      order_ids: invoice.order_ids,
      token: invoice.tokens[0],
      tokens: invoice.tokens,
      customer_name: invoice.customer_name,
      customer_phone: customerPhoneInputs[invoice.groupKey] || invoice.customer_phone,
      items: invoice.items,
      subtotal: invoice.subtotal,
      tax_amount: invoice.tax,
      total: invoice.grand_total,
      payment_mode: paymentMode.toUpperCase(),
      table_id: invoice.table_id,
      created_at: invoice.created_at,
      gstin: invoice.gstin,
      mergedCount: invoice.mergedCount
    };
  };

  const handleSendWhatsApp = (invoice: GroupedInvoice, paymentMode?: string, phoneOverride?: string) => {
    const targetPhone = phoneOverride || customerPhoneInputs[invoice.groupKey] || invoice.customer_phone;
    
    if (!targetPhone || targetPhone.trim() === '') {
      toast.error('Please enter a customer phone number in the box to send the WhatsApp receipt.');
      return;
    }

    const digitsOnly = targetPhone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      toast.error('Invalid phone number', {
        description: 'Please enter a valid 10-digit mobile number (e.g. +91 9876543210).'
      });
      return;
    }

    const mode = paymentMode || paymentMethods[invoice.groupKey] || 'upi';
    const receiptPayload = buildReceiptData(invoice, mode);
    receiptPayload.customer_phone = targetPhone;

    const shareResult = sendWhatsAppReceiptWithPDF(receiptPayload, targetPhone);
    if (shareResult.success) {
      toast.success(`WhatsApp receipt opened for ${shareResult.formattedPhone}!`);
    } else {
      toast.error(shareResult.error || 'Failed to open WhatsApp');
    }

    try {
      fetch('/api/whatsapp/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          order: receiptPayload, 
          phone: targetPhone,
          restaurantName: 'Vyoma Luxury Dining',
          googleReviewUrl: 'https://maps.google.com'
        })
      })
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            toast.success('✅ PDF receipt sent directly via WhatsApp bot!');
          }
        })
        .catch(() => {});
    } catch {}
  };

  const handlePaymentDone = async (invoice: GroupedInvoice) => {
    if (isSettlingKey) return;
    const method = paymentMethods[invoice.groupKey] || 'upi';
    setIsSettlingKey(invoice.groupKey);

    try {
      soundService.playSuccessChime();
      soundService.triggerVibration([100, 50, 150]);

      const settledRecord: SettledInvoiceRecord = {
        invoice,
        paymentMode: method,
        settledAt: new Date().toISOString()
      };
      setSettledInvoices(prev => ({
        ...prev,
        [invoice.groupKey]: settledRecord
      }));

      invoice.order_ids.forEach(orderId => {
        try {
          onUpdateStatus(orderId, 'completed');
        } catch (updateErr) {
          console.warn(`Local status update notice for ${orderId}:`, updateErr);
        }
      });

      (async () => {
        try {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const validUuids = invoice.order_ids.filter(id => uuidRegex.test(id));
          const nonUuidTokens = invoice.order_ids.filter(id => !uuidRegex.test(id)).concat(invoice.tokens);

          if (validUuids.length > 0) {
            const { error: errWithPayStatus } = await supabase
              .from('orders')
              .update({ status: 'completed', payment_status: 'PAID' } as any)
              .in('id', validUuids);

            if (errWithPayStatus) {
              await supabase
                .from('orders')
                .update({ status: 'completed' })
                .in('id', validUuids);
            }
          }

          if (nonUuidTokens.length > 0) {
            await supabase
              .from('orders')
              .update({ status: 'completed' })
              .in('token', nonUuidTokens);
          }

          if (invoice.table_id && String(invoice.table_id).toUpperCase() !== 'TAKEAWAY') {
            const cleanTableNum = String(invoice.table_id).replace(/^table\s*/i, '').trim();
            try {
              const { error: tblErr } = await supabase
                .from('tables')
                .update({ is_occupied: false, status: 'available', customer_name: null, total_amount: 0 } as any)
                .or(`id.eq.${invoice.table_id},table_number.eq.${cleanTableNum},table_number.eq.Table ${cleanTableNum}`);

              if (tblErr) {
                await supabase
                  .from('tables')
                  .update({ status: 'available', customer_name: null, total_amount: 0 } as any)
                  .or(`id.eq.${invoice.table_id},table_number.eq.${cleanTableNum},table_number.eq.Table ${cleanTableNum}`);
              }
            } catch (tblEx) {
              console.warn('Table occupancy update notice:', tblEx);
            }
          }
        } catch (dbErr: any) {
          console.warn('Database batch settlement notice:', dbErr?.message || dbErr);
        }
      })();

      const targetPhone = customerPhoneInputs[invoice.groupKey] || invoice.customer_phone;
      const tokenDisplay = invoice.tokens.length > 1 
        ? `#${invoice.tokens.join(', #')}` 
        : `#${invoice.tokens[0]}`;

      if (targetPhone) {
        toast.success(`Payment Done: ₹${invoice.grand_total.toFixed(2)} (${method.toUpperCase()})`, {
          description: `Consolidated bill for ${tokenDisplay} settled. Send WhatsApp receipt to ${formatPhoneNumber(targetPhone, true)}?`,
          action: {
            label: 'Send WhatsApp',
            onClick: () => handleSendWhatsApp(invoice, method, targetPhone)
          },
          duration: 9000
        });
      } else {
        toast.success(`Payment Done: ₹${invoice.grand_total.toFixed(2)} (${method.toUpperCase()})`, {
          description: `Consolidated bill for ${tokenDisplay} settled (${invoice.mergedCount > 1 ? `${invoice.mergedCount} orders merged` : '1 order'}).`,
          duration: 6000
        });
      }
    } catch (err: any) {
      console.error('Payment settlement error:', err);
      toast.error('Payment settlement notice', { description: err?.message || 'Transaction recorded locally' });
    } finally {
      setIsSettlingKey(null);
    }
  };

  const handleDismissSettled = (groupKey: string) => {
    setSettledInvoices(prev => {
      const next = { ...prev };
      delete next[groupKey];
      return next;
    });
    toast.info('Settled tab closed');
  };

  const setMethodForGroup = (groupKey: string, method: 'cash' | 'upi' | 'card') => {
    setPaymentMethods(prev => ({ ...prev, [groupKey]: method }));
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
      {/* Top Banner & Consolidated KPI Metrics */}
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
            {groupedInvoices.length} {groupedInvoices.length === 1 ? 'consolidated bill' : 'consolidated bills'} ({pendingPaymentOrders.length} sub-orders)
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
            <span className="text-xs text-white/70 font-medium font-sans">occupied tables</span>
          </div>
          <p className="text-[11px] text-white/70 mt-1 font-sans">
            Served guests • Awaiting final payment
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
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Revenue Realized</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/25 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <CreditCard size={17} />
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
                {groupedInvoices.length} Consolidated Tabs
              </span>
            </div>
            <p className="text-[11px] text-white/70 font-sans">
              Merged by Table &amp; Customer • Instant one-click settlement with WhatsApp receipt
            </p>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Segment Filter */}
          <div className="flex items-center bg-[#141620] border border-white/10 rounded-xl p-1 shrink-0 overflow-x-auto custom-scrollbar" role="tablist" aria-label="Filter payment tabs">
            <button
              type="button"
              role="tab"
              aria-selected={selectedFilter === 'all'}
              onClick={() => setSelectedFilter('all')}
              className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap active:scale-95 touch-manipulation ${
                selectedFilter === 'all' ? 'bg-primary text-black shadow-md' : 'text-white/70 hover:text-white'
              }`}
            >
              All ({groupedInvoices.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={selectedFilter === 'dine_in'}
              onClick={() => setSelectedFilter('dine_in')}
              className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap active:scale-95 touch-manipulation ${
                selectedFilter === 'dine_in' ? 'bg-primary text-black shadow-md' : 'text-white/70 hover:text-white'
              }`}
            >
              Dine-In ({totalDineInWaiting})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={selectedFilter === 'counter'}
              onClick={() => setSelectedFilter('counter')}
              className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap active:scale-95 touch-manipulation ${
                selectedFilter === 'counter' ? 'bg-primary text-black shadow-md' : 'text-white/70 hover:text-white'
              }`}
            >
              Counter ({totalCounterWaiting})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            <input
              type="text"
              aria-label="Search tabs by table, name, token, or phone"
              placeholder="Search table, name, token, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] bg-[#141620] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/50 focus:outline-none focus:border-primary/50 transition-all font-sans"
            />
          </div>
        </div>
      </div>

      {/* Invoices List / Empty State */}
      {displayInvoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-[#0A0B0E] p-12 text-center my-4 min-h-[320px]">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-xl font-serif font-bold text-white tracking-tight">All Tabs Settled</h3>
          <p className="text-xs text-white/40 max-w-md mt-1.5">
            There are currently no active customer or table tabs awaiting payment. Multiple orders from the same table or customer will automatically consolidate here for single-batch checkout.
          </p>
          {searchQuery && (
            <button
              type="button"
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
            {displayInvoices.map((invoice) => {
              const selectedMethod = paymentMethods[invoice.groupKey] || 'upi';
              const rawName = (invoice.customer_name || 'Guest Customer').trim();
              const isDineIn = !!invoice.table_id && String(invoice.table_id).toUpperCase() !== 'TAKEAWAY';
              const tableNum = isDineIn 
                ? `Table ${String(invoice.table_id).replace(/^table\s*/i, '').trim()}` 
                : 'Takeaway / Counter';
              const isProcessing = isSettlingKey === invoice.groupKey;
              const settledRecord = settledInvoices[invoice.groupKey];
              const isSettled = !!settledRecord;

              const activePhone = customerPhoneInputs[invoice.groupKey] ?? (invoice.customer_phone || '');

              return (
                <motion.div
                  key={invoice.groupKey}
                  layout
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] } }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className={`rounded-3xl border transition-all overflow-hidden ${
                    isSettled 
                      ? 'border-emerald-500/40 bg-gradient-to-b from-[#0C1713] to-[#0A0B0E] shadow-[0_0_35px_rgba(16,185,129,0.12)]' 
                      : 'border-amber-500/30 bg-[#0E0F14] hover:border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.05)]'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row items-stretch justify-between p-5 sm:p-6 gap-6">
                    
                    {/* Left: Customer Info, Token & Table */}
                    <div className="flex flex-col justify-between gap-4 flex-1 min-w-0">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap mb-2.5">
                          {/* Token(s) */}
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            {invoice.tokens.map((tok, i) => (
                              <span 
                                key={i}
                                className={`font-serif font-bold tracking-wider ${
                                  i === 0 ? 'text-2xl sm:text-3xl text-amber-400' : 'text-sm text-amber-400/70 font-mono'
                                }`}
                              >
                                #{tok}{i < invoice.tokens.length - 1 ? ',' : ''}
                              </span>
                            ))}
                          </div>

                          {/* Table Badge */}
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                            isDineIn 
                              ? 'bg-primary/10 border-primary/30 text-primary' 
                              : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                          }`}>
                            {tableNum}
                          </span>

                          {/* Merged Orders Count Badge */}
                          {invoice.mergedCount > 1 && (
                            <span className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/35 text-amber-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.15)]">
                              <Sparkles size={11} className="text-amber-400" />
                              Merged {invoice.mergedCount} Orders
                            </span>
                          )}

                          {/* Status Badge */}
                          {isSettled ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-full">
                              <CheckCircle2 size={12} /> Payment Settled
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2.5 py-1 rounded-full animate-pulse">
                              <Clock size={11} /> Waiting for Payment
                            </span>
                          )}

                          <span className="text-[11px] text-white/70 font-mono">
                            {formatElapsed(invoice.created_at)}
                          </span>
                        </div>

                        {/* Customer Name & Phone */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <div className="flex items-center gap-1.5 text-white/95 font-medium text-base">
                            <User size={15} className="text-primary/70" />
                            <span>{rawName}</span>
                          </div>

                          {activePhone ? (
                            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full text-xs font-mono text-white/80">
                              <Phone size={12} className="text-white/60" />
                              <span>{formatPhoneNumber(activePhone, true)}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(activePhone);
                                  toast.success('Phone copied to clipboard');
                                }}
                                aria-label="Copy phone number"
                                className="h-8 w-8 min-h-[36px] min-w-[36px] touch-target flex items-center justify-center text-white/50 hover:text-primary transition-colors cursor-pointer ml-1 touch-manipulation active:scale-90"
                                title="Copy Phone"
                              >
                                <Copy size={13} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="tel"
                                aria-label="Customer phone number"
                                placeholder="+91 Customer Phone"
                                maxLength={13}
                                value={customerPhoneInputs[invoice.groupKey] || ''}
                                onChange={(e) => setCustomerPhoneInputs(prev => ({ ...prev, [invoice.groupKey]: e.target.value.replace(/[^\d+]/g, '').slice(0, 13) }))}
                                className="min-h-[44px] bg-[#141620] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/50 focus:outline-none focus:border-primary/50 font-mono w-44 touch-manipulation"
                              />
                            </div>
                          )}

                          {invoice.gstin && (
                            <span className="text-[10px] font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/70">
                              GSTIN: {invoice.gstin}
                            </span>
                          )}

                          <span className="text-[10px] font-mono text-white/60 flex items-center gap-1">
                            <Layers size={11} /> {invoice.order_ids.length} ticket(s)
                          </span>
                        </div>
                      </div>

                      {/* Items Ordered List Breakdown */}
                      <div className="bg-[#14161C] border border-white/5 rounded-2xl p-3.5 max-h-36 overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between text-[9px] uppercase tracking-widest font-bold text-white/60 mb-2">
                          <span>Consolidated Items Breakdown ({invoice.items.length} items)</span>
                          {invoice.mergedCount > 1 && (
                            <span className="text-amber-400/90 font-mono">
                              Combined from {invoice.mergedCount} orders
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {invoice.items.map((item, i) => (
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
                        {invoice.notes && (
                          <div className="mt-2 pt-2 border-t border-white/5 text-[10px] text-amber-300/90 italic">
                            Notes: {invoice.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Payment Method Selector & Actions */}
                    <div className="flex flex-col justify-between items-end border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6 gap-4 shrink-0 min-w-[290px]">
                      {/* Price Summary */}
                      <div className="w-full text-right">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 block mb-0.5">
                          {isSettled ? 'Amount Settled' : 'Total Bill Due'}
                        </span>
                        <div className="text-3xl sm:text-4xl font-serif font-bold text-primary tracking-tight font-mono">
                          ₹{Number(invoice.grand_total).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-white/60 flex items-center justify-end gap-2 mt-0.5">
                          <span>Subtotal: ₹{invoice.subtotal.toFixed(0)}</span>
                          {invoice.tax > 0 && <span>• GST: ₹{invoice.tax.toFixed(0)}</span>}
                        </div>
                      </div>

                      {/* POST-PAYMENT STATE */}
                      {isSettled ? (
                        <div className="w-full flex flex-col gap-2.5 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-3.5">
                          <div className="flex items-center justify-between text-xs text-emerald-300 font-bold">
                            <span className="flex items-center gap-2">
                              <CheckCircle2 size={15} className="text-emerald-400" />
                              <span>Settled via</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border ${
                                settledRecord?.paymentMode === 'upi'
                                  ? 'bg-primary/20 text-primary border-primary/40'
                                  : settledRecord?.paymentMode === 'cash'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                              }`}>
                                {settledRecord?.paymentMode || 'PAID'}
                              </span>
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400/80">PAID ✅</span>
                          </div>

                          {!activePhone && (
                            <input
                              type="tel"
                              placeholder="Enter Phone (+91...)"
                              maxLength={13}
                              value={customerPhoneInputs[invoice.groupKey] || ''}
                              onChange={(e) => setCustomerPhoneInputs(prev => ({ ...prev, [invoice.groupKey]: e.target.value.replace(/[^\d+]/g, '').slice(0, 13) }))}
                              className="w-full bg-[#10131A] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-white/50 focus:outline-none focus:border-emerald-500/50 font-mono"
                            />
                          )}

                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => handleSendWhatsApp(invoice, settledRecord?.paymentMode, activePhone)}
                              className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black py-2.5 px-4 text-xs font-extrabold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:scale-[1.01] active:scale-98 cursor-pointer touch-manipulation"
                            >
                              <MessageSquare size={15} />
                              <span>Send WhatsApp Receipt</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDismissSettled(invoice.groupKey)}
                              className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 touch-manipulation"
                            >
                              <span>Dismiss Receipt</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* UNPAID STATE */
                        <>
                          <div className="w-full">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 block mb-1.5 text-left">
                              Settlement Method
                            </span>
                            <div className="grid grid-cols-3 gap-1.5 bg-[#14161C] p-1 rounded-xl border border-white/10" role="radiogroup" aria-label="Settlement method">
                              <button
                                type="button"
                                role="radio"
                                aria-checked={selectedMethod === 'upi'}
                                onClick={() => setMethodForGroup(invoice.groupKey, 'upi')}
                                className={`min-h-[44px] flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 touch-manipulation ${
                                  selectedMethod === 'upi'
                                    ? 'bg-primary text-black shadow-[0_0_12px_rgba(197,160,89,0.3)]'
                                    : 'text-white/70 hover:text-white'
                                }`}
                              >
                                <QrCode size={14} />
                                <span>UPI</span>
                              </button>

                              <button
                                type="button"
                                role="radio"
                                aria-checked={selectedMethod === 'cash'}
                                onClick={() => setMethodForGroup(invoice.groupKey, 'cash')}
                                className={`min-h-[44px] flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 touch-manipulation ${
                                  selectedMethod === 'cash'
                                    ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                                    : 'text-white/70 hover:text-white'
                                }`}
                              >
                                <Banknote size={14} />
                                <span>Cash</span>
                              </button>

                              <button
                                type="button"
                                role="radio"
                                aria-checked={selectedMethod === 'card'}
                                onClick={() => setMethodForGroup(invoice.groupKey, 'card')}
                                className={`min-h-[44px] flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 touch-manipulation ${
                                  selectedMethod === 'card'
                                    ? 'bg-sky-500 text-black shadow-[0_0_12px_rgba(14,165,233,0.3)]'
                                    : 'text-white/70 hover:text-white'
                                }`}
                              >
                                <CreditCard size={14} />
                                <span>Card</span>
                              </button>
                            </div>
                          </div>

                          <div className="w-full flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => handlePaymentDone(invoice)}
                              disabled={isProcessing}
                              className="w-full min-h-[48px] flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black py-3 px-6 text-xs font-extrabold uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:scale-[1.01] active:scale-98 cursor-pointer disabled:opacity-50 touch-manipulation"
                            >
                              {isProcessing ? (
                                <>
                                  <RotateCcw size={16} className="animate-spin" />
                                  <span>Settling ({invoice.order_ids.length} orders)...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 size={16} />
                                  <span>Settle Bill (₹{Number(invoice.grand_total).toFixed(2)})</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSendWhatsApp(invoice, selectedMethod, activePhone)}
                              className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 touch-manipulation"
                            >
                              <MessageSquare size={14} />
                              <span>Send WhatsApp Receipt</span>
                            </button>
                          </div>
                        </>
                      )}
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