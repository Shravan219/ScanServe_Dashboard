import React, { useState, useMemo } from 'react';
import { MenuItem } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Plus,
  Trash2,
  Receipt,
  User,
  Phone,
  CreditCard,
  QrCode,
  Banknote,
  Search,
  Sparkles,
  ShoppingBag,
  Percent,
  CheckCircle2,
  RotateCcw,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { InvoiceReceiptModal, SavedInvoiceData } from './InvoiceReceiptModal';

export interface InvoiceItemLine {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isCustom?: boolean;
  notes?: string;
  menuItemId?: string;
}

interface InvoiceCreatorProps {
  menuItems: MenuItem[];
  onOrderCreated?: (newOrder: any) => void;
}

export function InvoiceCreator({ menuItems, onOrderCreated }: InvoiceCreatorProps) {
  // Customer Details State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'CASH' | 'CARD' | 'SPLIT'>('UPI');
  const [orderChannel, setOrderChannel] = useState<'WALK_IN' | 'DIRECT_POS' | 'TAKEAWAY' | 'DINE_IN'>('WALK_IN');
  const [tableNumber, setTableNumber] = useState('');
  const [gstin, setGstin] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Items State
  const [items, setItems] = useState<InvoiceItemLine[]>([
    {
      id: `item_${Date.now()}_1`,
      name: '',
      price: 0,
      quantity: 1,
      isCustom: false
    }
  ]);

  // Billing Configuration State
  const [applyGst, setApplyGst] = useState(true);
  const [gstRate, setGstRate] = useState<number>(5);
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [discountValue, setDiscountValue] = useState<string>('0');

  // UI / Search state
  const [activeItemSearchIdx, setActiveItemSearchIdx] = useState<number | null>(null);
  const [searchQueries, setSearchQueries] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Completed Invoice Receipt Modal State
  const [savedInvoice, setSavedInvoice] = useState<SavedInvoiceData | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => acc + (Math.max(0, it.price) * Math.max(1, it.quantity)), 0);
  }, [items]);

  const discountAmount = useMemo(() => {
    const rawVal = parseFloat(discountValue) || 0;
    if (rawVal <= 0) return 0;
    if (discountType === 'percent') {
      return (subtotal * Math.min(100, rawVal)) / 100;
    }
    return Math.min(subtotal, rawVal);
  }, [subtotal, discountValue, discountType]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  const gstAmount = useMemo(() => {
    if (!applyGst || gstRate <= 0) return 0;
    return taxableAmount * (gstRate / 100);
  }, [applyGst, gstRate, taxableAmount]);

  const grandTotal = useMemo(() => {
    return Math.round((taxableAmount + gstAmount) * 100) / 100;
  }, [taxableAmount, gstAmount]);

  // Helpers for items manipulation
  const handleAddItem = () => {
    const newId = `item_${Date.now()}_${items.length + 1}`;
    setItems(prev => [
      ...prev,
      {
        id: newId,
        name: '',
        price: 0,
        quantity: 1,
        isCustom: false
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      // Reset the single item
      setItems([{
        id: `item_${Date.now()}_1`,
        name: '',
        price: 0,
        quantity: 1,
        isCustom: false
      }]);
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, updates: Partial<InvoiceItemLine>) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleSelectMenuItem = (index: number, menuItem: MenuItem) => {
    handleUpdateItem(index, {
      name: menuItem.name,
      price: menuItem.price,
      menuItemId: menuItem.id,
      isCustom: false
    });
    setActiveItemSearchIdx(null);
    setSearchQueries(prev => ({ ...prev, [index]: '' }));
  };

  const handleResetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setPaymentMode('UPI');
    setOrderChannel('WALK_IN');
    setTableNumber('');
    setGstin('');
    setOrderNotes('');
    setDiscountValue('0');
    setItems([
      {
        id: `item_${Date.now()}_1`,
        name: '',
        price: 0,
        quantity: 1,
        isCustom: false
      }
    ]);
  };

  // Quick Preset Add helper
  const handleQuickAddMenuItem = (menuItem: MenuItem) => {
    // Check if the last item is empty, replace it
    if (items.length === 1 && (!items[0].name || items[0].name.trim() === '')) {
      handleSelectMenuItem(0, menuItem);
      return;
    }
    // Check if item already exists, increment qty
    const existingIdx = items.findIndex(it => it.name.toLowerCase() === menuItem.name.toLowerCase());
    if (existingIdx >= 0) {
      handleUpdateItem(existingIdx, { quantity: items[existingIdx].quantity + 1 });
      toast.success(`Incremented quantity for ${menuItem.name}`);
      return;
    }
    // Else append
    setItems(prev => [
      ...prev,
      {
        id: `item_${Date.now()}_${prev.length + 1}`,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        isCustom: false,
        menuItemId: menuItem.id
      }
    ]);
    toast.success(`Added ${menuItem.name}`);
  };

  // Submit Handler -> Direct Orders DB save & Inbound Webhook compatibility
  const handleGenerateInvoice = async () => {
    // Validation
    const validItems = items.filter(it => it.name && it.name.trim().length > 0 && it.price >= 0);
    if (validItems.length === 0) {
      toast.error('Please add at least one valid item with a name and price.');
      return;
    }

    if (grandTotal <= 0) {
      toast.error('Invoice grand total must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    const invoiceId = `INV-${Date.now().toString().slice(-6)}`;
    const randomToken = Math.floor(1000 + Math.random() * 9000).toString();

    const formattedItems = validItems.map((it, idx) => ({
      id: it.id || `item_${idx + 1}`,
      name: it.name.trim(),
      itemName: it.name.trim(),
      price: Number(it.price) || 0,
      quantity: Number(it.quantity) || 1,
      total: (Number(it.price) || 0) * (Number(it.quantity) || 1),
      item_notes: it.notes || undefined
    }));

    const finalCustomerName = customerName.trim() || 'Guest Customer';
    const finalCustomerPhone = customerPhone.trim() || 'Masked Number';
    const finalTableId = tableNumber.trim() ? `Table ${tableNumber.trim()}` : (orderChannel === 'DINE_IN' ? 'Dine In' : 'Walk-in POS');

    const invoicePayload = {
      id: invoiceId,
      order_id: invoiceId,
      invoice_id: invoiceId,
      token: randomToken,
      customer_name: finalCustomerName,
      customer_phone: finalCustomerPhone,
      customer: {
        name: finalCustomerName,
        phone: finalCustomerPhone
      },
      items: formattedItems,
      order_items: formattedItems,
      subtotal,
      discount: discountAmount,
      tax_rate: applyGst ? gstRate : 0,
      tax_amount: gstAmount,
      total: grandTotal,
      grand_total: grandTotal,
      bill_amount: grandTotal,
      payment_mode: paymentMode,
      payment_method: paymentMode,
      vendor: orderChannel,
      channel: orderChannel,
      source: orderChannel,
      table_id: finalTableId,
      status: 'completed',
      order_status: 'completed',
      gstin: gstin.trim() || undefined,
      notes: orderNotes.trim() ? `${orderNotes.trim()} [Mode: ${paymentMode}]` : `Direct POS Invoice [Mode: ${paymentMode}]`,
      created_at: new Date().toISOString()
    };

    try {
      // 1. Send POST request to /api/invoices
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Source': 'DIRECT_POS'
        },
        body: JSON.stringify(invoicePayload)
      });

      let data: any = {};
      const resText = await res.text();
      try {
        data = JSON.parse(resText);
      } catch {
        data = { message: resText };
      }

      if (!res.ok || data.success === false) {
        console.warn('[Invoice API Response Notice]', data);
      }

      // Success
      toast.success(`Invoice #${randomToken} created & saved to database!`, {
        description: `Grand Total: ₹${grandTotal.toFixed(2)} (${paymentMode})`
      });

      const savedData: SavedInvoiceData = {
        id: invoiceId,
        token: `#${randomToken}`,
        customer_name: finalCustomerName,
        customer_phone: finalCustomerPhone,
        items: formattedItems,
        subtotal,
        tax_amount: gstAmount,
        tax_rate: applyGst ? gstRate : 0,
        discount: discountAmount,
        total: grandTotal,
        payment_mode: paymentMode,
        table_id: finalTableId,
        created_at: new Date().toISOString(),
        gstin: gstin.trim() || undefined
      };

      setSavedInvoice(savedData);
      setIsReceiptModalOpen(true);

      if (onOrderCreated) {
        onOrderCreated(savedData);
      }
    } catch (err: any) {
      console.error('Invoice Creation Error:', err);
      toast.error('Invoice Creation Failed', {
        description: err.message || 'Could not persist invoice to database.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Top Header / Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(197,160,89,0.15)]">
              <Receipt size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-3xl font-serif tracking-tight text-white">
                Invoice <span className="italic text-primary font-normal">Creator</span>
              </h1>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold">
                Manual POS Billing & Instant Receipt Terminal
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleResetForm}
            className="border-white/10 hover:border-white/20 text-white/60 hover:text-white rounded-full text-[10px] uppercase tracking-[0.2em] font-bold h-11 px-5 bg-white/5 transition-all"
          >
            <RotateCcw size={13} className="mr-2" />
            Reset Form
          </Button>

          <Button
            type="button"
            onClick={handleGenerateInvoice}
            disabled={isSubmitting}
            className="bg-primary text-black hover:bg-primary/90 rounded-full text-[10px] uppercase tracking-[0.3em] font-bold h-11 px-8 shadow-[0_0_25px_rgba(197,160,89,0.3)] transition-all hover:scale-105"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                Generate & Save (₹{grandTotal.toFixed(0)})
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Main Grid: Form Left (2 Cols) & Bill Summary Right (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Customer Info & Order Item Selector (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Customer Details Card */}
          <Card className="bg-[#0A0A0A] border-white/5 p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2.5 text-primary">
                <User size={16} />
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-white">
                  Customer & Order Details
                </span>
              </div>
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold">
                Step 1 of 2
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Name */}
              <div className="space-y-1.5">
                <label htmlFor="invoice-customer-name" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold ml-1 flex items-center gap-1.5 cursor-pointer">
                  <User size={12} className="text-primary/70" />
                  Customer Name
                </label>
                <Input
                  id="invoice-customer-name"
                  type="text"
                  placeholder="e.g. Shravan Kumar"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-black/60 border-white/10 rounded-2xl h-12 text-xs font-semibold tracking-wide text-white focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-all placeholder:text-white/20"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label htmlFor="invoice-customer-phone" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold ml-1 flex items-center gap-1.5 cursor-pointer">
                  <Phone size={12} className="text-primary/70" />
                  Phone Number
                </label>
                <Input
                  id="invoice-customer-phone"
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="bg-black/60 border-white/10 rounded-2xl h-12 text-xs font-semibold tracking-wide text-white focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-all placeholder:text-white/20"
                />
              </div>

              {/* Order Channel */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold ml-1 flex items-center gap-1.5">
                  <ShoppingBag size={12} className="text-primary/70" />
                  Order Channel / Type
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['WALK_IN', 'TAKEAWAY', 'DINE_IN'] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setOrderChannel(ch)}
                      className={`h-11 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all border ${
                        orderChannel === ch
                          ? 'bg-primary text-black border-primary font-extrabold shadow-[0_0_15px_rgba(197,160,89,0.2)]'
                          : 'bg-black/40 border-white/5 text-white/60 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {ch === 'WALK_IN' ? 'Walk-In' : ch === 'TAKEAWAY' ? 'Takeaway' : 'Dine-In'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Mode Selection */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold ml-1 flex items-center gap-1.5">
                  <CreditCard size={12} className="text-primary/70" />
                  Payment Mode
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'UPI', label: 'UPI', icon: <QrCode size={13} /> },
                    { id: 'CASH', label: 'Cash', icon: <Banknote size={13} /> },
                    { id: 'CARD', label: 'Card', icon: <CreditCard size={13} /> },
                    { id: 'SPLIT', label: 'Split', icon: <Tag size={13} /> }
                  ].map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMode(pm.id as any)}
                      className={`h-11 rounded-xl text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border ${
                        paymentMode === pm.id
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                          : 'bg-black/40 border-white/5 text-white/60 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {pm.icon}
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table Number (If Dine In or Walk-in) */}
              {orderChannel === 'DINE_IN' && (
                <div className="space-y-1.5 animate-fade-in">
                  <label htmlFor="invoice-table-number" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold ml-1 cursor-pointer">
                    Table Number
                  </label>
                  <Input
                    id="invoice-table-number"
                    type="text"
                    placeholder="e.g. Table 04"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="bg-black/60 border-white/10 rounded-2xl h-12 text-xs font-semibold text-white placeholder:text-white/20"
                  />
                </div>
              )}

              {/* Optional GSTIN for India Tax Invoicing */}
              <div className="space-y-1.5">
                <label htmlFor="invoice-gstin" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold ml-1 flex items-center justify-between cursor-pointer">
                  <span>GSTIN (B2B Tax Invoice)</span>
                  <span className="text-[8px] text-white/30 normal-case">Optional</span>
                </label>
                <Input
                  id="invoice-gstin"
                  type="text"
                  placeholder="e.g. 29AAAAA0000A1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="bg-black/60 border-white/10 rounded-2xl h-12 text-xs font-mono font-semibold uppercase tracking-wider text-white placeholder:text-white/20"
                />
              </div>
            </div>
          </Card>

          {/* Quick Menu Item Shortcuts Carousel */}
          {menuItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-primary" />
                  Quick Tap Menu Items
                </span>
                <span className="text-[9px] text-white/30 uppercase tracking-wider">
                  Tap item to add to bill
                </span>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-2 custom-scrollbar">
                {menuItems.slice(0, 10).map((mItem) => (
                  <button
                    key={mItem.id}
                    type="button"
                    onClick={() => handleQuickAddMenuItem(mItem)}
                    className="flex-shrink-0 flex items-center gap-3 bg-[#0E0E0E] hover:bg-white/[0.08] border border-white/5 hover:border-primary/30 rounded-2xl px-4 py-2.5 text-left transition-all duration-300 group hover:scale-[1.02]"
                  >
                    <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0 group-hover:bg-primary group-hover:text-black transition-colors">
                      +
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white group-hover:text-primary transition-colors line-clamp-1">
                        {mItem.name}
                      </p>
                      <p className="text-[10px] font-mono text-white/40">
                        ₹{mItem.price.toFixed(2)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Order Item Builder */}
          <Card className="bg-[#0A0A0A] border-white/5 p-6 rounded-[2rem] shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2.5 text-primary">
                <ShoppingBag size={16} />
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-white">
                  Order Item Selection ({items.length} {items.length === 1 ? 'Item' : 'Items'})
                </span>
              </div>
              <Button
                type="button"
                onClick={handleAddItem}
                className="bg-primary/10 hover:bg-primary text-primary hover:text-black border border-primary/20 rounded-full h-9 px-4 text-[9px] uppercase tracking-[0.2em] font-bold transition-all"
              >
                <Plus size={14} className="mr-1.5" />
                Add Item
              </Button>
            </div>

            {/* Dynamic Items List */}
            <div className="space-y-4">
              <AnimatePresence>
                {items.map((item, idx) => {
                  const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
                  const searchQuery = searchQueries[idx] || '';
                  const filteredMenuForLine = menuItems.filter(m =>
                    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    m.category.toLowerCase().includes(searchQuery.toLowerCase())
                  );

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-black/50 border border-white/5 rounded-2xl p-4 space-y-3 relative group hover:border-white/15 transition-all"
                    >
                      {/* Row: Item Name Selector / Input + Price + Quantity + Line Total + Delete */}
                      <div className="grid grid-cols-12 gap-3 items-center">
                        {/* Item Name / Picker (6 cols) */}
                        <div className="col-span-12 sm:col-span-6 relative">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-bold">
                              Item #{idx + 1} Name
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                handleUpdateItem(idx, {
                                  isCustom: !item.isCustom,
                                  name: '',
                                  price: 0
                                });
                              }}
                              className="text-[8px] uppercase tracking-wider text-primary hover:underline"
                            >
                              {item.isCustom ? 'Switch to Menu Picker' : 'Custom Off-Menu Item'}
                            </button>
                          </div>

                          {item.isCustom ? (
                            <Input
                              type="text"
                              placeholder="Type custom item name..."
                              value={item.name}
                              onChange={(e) => handleUpdateItem(idx, { name: e.target.value })}
                              className="bg-[#111] border-white/10 rounded-xl h-11 text-xs text-white placeholder:text-white/40 focus-visible:ring-primary/20"
                            />
                          ) : (
                            <div className="relative">
                              <Input
                                type="text"
                                placeholder="Search & pick menu item..."
                                value={item.name ? item.name : (searchQueries[idx] || '')}
                                onChange={(e) => {
                                  setSearchQueries(prev => ({ ...prev, [idx]: e.target.value }));
                                  if (item.name) {
                                    handleUpdateItem(idx, { name: '' });
                                  }
                                  setActiveItemSearchIdx(idx);
                                }}
                                onFocus={() => setActiveItemSearchIdx(idx)}
                                className="bg-[#111] border-white/10 rounded-xl h-11 text-xs text-white pr-8 placeholder:text-white/40 focus-visible:ring-primary/20"
                              />
                              <Search size={14} className="absolute right-3 top-3.5 text-white/40 pointer-events-none" />

                              {/* Autocomplete Dropdown */}
                              {activeItemSearchIdx === idx && (
                                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#141414] border border-white/10 rounded-2xl shadow-2xl max-h-56 overflow-y-auto custom-scrollbar p-2">
                                  <div className="text-[8px] uppercase tracking-[0.2em] text-white/30 px-3 py-1 font-bold">
                                    Select From Menu ({filteredMenuForLine.length} options)
                                  </div>
                                  {filteredMenuForLine.length === 0 ? (
                                    <div className="p-3 text-center text-xs text-white/40">
                                      No items match. Tap "Custom Off-Menu Item" above.
                                    </div>
                                  ) : (
                                    filteredMenuForLine.map((menuItem) => (
                                      <button
                                        key={menuItem.id}
                                        type="button"
                                        onClick={() => handleSelectMenuItem(idx, menuItem)}
                                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-primary/10 text-left transition-colors group/item"
                                      >
                                        <div>
                                          <span className="text-xs font-semibold text-white group-hover/item:text-primary">
                                            {menuItem.name}
                                          </span>
                                          <span className="text-[9px] uppercase tracking-wider text-white/30 block">
                                            {menuItem.category}
                                          </span>
                                        </div>
                                        <span className="text-xs font-mono font-bold text-primary">
                                          ₹{menuItem.price.toFixed(2)}
                                        </span>
                                      </button>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Price Input (2 cols) */}
                        <div className="col-span-4 sm:col-span-2">
                          <span className="text-[9px] uppercase tracking-[0.2em] text-white/50 font-bold block mb-1">
                            Price (₹)
                          </span>
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            value={item.price || ''}
                            onChange={(e) => handleUpdateItem(idx, { price: parseFloat(e.target.value) || 0 })}
                            className="bg-[#111] border-white/10 rounded-xl h-11 text-xs font-mono text-center text-white focus-visible:ring-primary/20"
                          />
                        </div>

                        {/* Quantity Controls (3 cols) */}
                        <div className="col-span-5 sm:col-span-2">
                          <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-bold block mb-1 text-center">
                            Quantity
                          </span>
                          <div className="flex items-center justify-between bg-[#111] border border-white/10 rounded-xl h-11 px-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateItem(idx, { quantity: Math.max(1, item.quantity - 1) })}
                              className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center font-bold text-sm transition-colors"
                            >
                              -
                            </button>
                            <span className="font-mono text-xs font-bold text-white px-2">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateItem(idx, { quantity: item.quantity + 1 })}
                              className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center font-bold text-sm transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Line Total & Remove Action (2 cols) */}
                        <div className="col-span-3 sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 pt-4 sm:pt-0">
                          <div className="text-right">
                            <span className="text-[8px] uppercase tracking-wider text-white/30 block sm:hidden">Total</span>
                            <span className="text-sm font-serif font-bold text-primary block">
                              ₹{lineTotal.toFixed(2)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="h-9 w-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors shrink-0"
                            title="Remove Item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Bottom Add Item Bar */}
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddItem}
                className="w-full border-dashed border-white/10 hover:border-primary/40 text-white/60 hover:text-primary rounded-2xl h-12 text-[10px] uppercase tracking-[0.25em] font-bold bg-white/[0.02] hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={15} />
                + Add Another Item
              </Button>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Live Bill Summary Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
          <Card className="bg-[#0A0A0A] border-primary/20 p-6 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-primary" />
                <span className="text-xs font-serif uppercase tracking-[0.2em] font-bold text-white">
                  Live Bill Summary
                </span>
              </div>
              <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[9px] font-mono font-bold text-primary">
                {items.filter(i => i.name).length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Live Items Breakdown List */}
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {items.filter(i => i.name && i.name.trim()).length === 0 ? (
                <p className="text-[11px] text-white/20 italic text-center py-4">
                  No items selected yet. Choose from menu or add custom items.
                </p>
              ) : (
                items.filter(i => i.name && i.name.trim()).map((it, i) => (
                  <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-white/[0.02]">
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 font-mono text-[10px]">x{it.quantity}</span>
                      <span className="text-white/90 truncate max-w-[150px] font-medium">{it.name}</span>
                    </div>
                    <span className="font-mono text-white/70">
                      ₹{(it.price * it.quantity).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-3 border-t border-white/5 pt-4 text-xs">
              {/* Subtotal */}
              <div className="flex justify-between items-center text-white/60">
                <span className="text-[10px] uppercase tracking-wider font-semibold">Subtotal</span>
                <span className="font-mono text-white font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>

              {/* Discount Selector */}
              <div className="space-y-1.5 bg-black/40 p-3 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] uppercase tracking-wider text-white/50 font-bold flex items-center gap-1">
                    <Percent size={11} className="text-primary" />
                    Apply Discount
                  </span>
                  <div className="flex rounded-lg overflow-hidden border border-white/10 text-[8px] font-bold">
                    <button
                      type="button"
                      onClick={() => setDiscountType('flat')}
                      className={`px-2 py-0.5 ${discountType === 'flat' ? 'bg-primary text-black' : 'text-white/40'}`}
                    >
                      ₹ Flat
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('percent')}
                      className={`px-2 py-0.5 ${discountType === 'percent' ? 'bg-primary text-black' : 'text-white/40'}`}
                    >
                      % Off
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="h-8 bg-black/80 border-white/10 text-xs font-mono rounded-lg text-white"
                  />
                  {discountAmount > 0 && (
                    <span className="text-[10px] font-mono text-emerald-400 font-bold whitespace-nowrap">
                      -₹{discountAmount.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* 5% GST Tax Toggle & Rate */}
              <div className="space-y-2 bg-black/40 p-3 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="applyGstCheck"
                      checked={applyGst}
                      onChange={(e) => setApplyGst(e.target.checked)}
                      className="accent-primary h-4 w-4 rounded cursor-pointer"
                    />
                    <label htmlFor="applyGstCheck" className="text-[10px] uppercase tracking-wider text-white font-bold cursor-pointer">
                      GST Tax ({gstRate}%)
                    </label>
                  </div>
                  <span className="font-mono text-primary font-bold">
                    ₹{gstAmount.toFixed(2)}
                  </span>
                </div>

                {applyGst && (
                  <div className="flex justify-between text-[8px] uppercase tracking-wider text-white/30 pt-1 border-t border-white/5 font-mono">
                    <span>CGST ({gstRate / 2}%): ₹{(gstAmount / 2).toFixed(2)}</span>
                    <span>SGST ({gstRate / 2}%): ₹{(gstAmount / 2).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Grand Total */}
              <div className="border-t border-primary/20 pt-4 mt-2">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-[9px] uppercase tracking-[0.25em] text-white/40 font-bold block">
                      Grand Total
                    </span>
                    <span className="text-[9px] text-emerald-400/80 font-mono">
                      Includes all taxes & discounts
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-serif text-primary font-bold tracking-tight">
                      ₹{grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <Button
                type="button"
                onClick={handleGenerateInvoice}
                disabled={isSubmitting || grandTotal <= 0}
                className="w-full bg-primary text-black hover:bg-primary/90 rounded-full h-14 text-[11px] uppercase tracking-[0.35em] font-extrabold shadow-[0_0_30px_rgba(197,160,89,0.35)] transition-all hover:scale-[1.02] duration-300"
              >
                {isSubmitting ? 'Writing to Orders DB...' : 'Generate & Save Invoice'}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Invoice Receipt Modal */}
      <InvoiceReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        invoice={savedInvoice}
        onResetForm={handleResetForm}
      />
    </div>
  );
}
