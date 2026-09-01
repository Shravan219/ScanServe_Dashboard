import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, RestaurantTable, Order, OrderItem } from '@/src/types';
import { supabase } from '@/src/lib/supabase';
import { 
  X, 
  Search, 
  Plus, 
  Minus, 
  Utensils, 
  User, 
  Phone, 
  MessageSquare, 
  Send, 
  ShoppingBag,
  Sparkles,
  ChevronRight,
  Trash2,
  Table as TableIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface OrderBuilderSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTable: RestaurantTable | null;
  tables: RestaurantTable[];
  menuItems: MenuItem[];
  onOrderCreated?: (order: Order, tableNumber: string) => void;
}

const QUICK_INSTRUCTION_TAGS = [
  'Less Spicy',
  'Extra Napkins',
  'Beverages First',
  'No Onion / Garlic',
  'Serve Hot',
  'Separate Plates',
  'Jain Preparation',
  'Mild Spice'
];

export function OrderBuilderSheet({
  isOpen,
  onClose,
  selectedTable,
  tables,
  menuItems,
  onOrderCreated
}: OrderBuilderSheetProps) {
  const [tableNumber, setTableNumber] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('Guest');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customInstructions, setCustomInstructions] = useState<string>('');
  
  // Menu filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Cart state: map item ID to { menuItem, quantity, item_notes }
  const [cart, setCart] = useState<Record<string, { item: MenuItem; quantity: number; notes: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'menu' | 'cart'>('menu');
  const [orderChannel, setOrderChannel] = useState<'dine_in' | 'takeaway' | 'swiggy' | 'zomato'>('dine_in');

  // Sync selected table on open
  useEffect(() => {
    if (selectedTable) {
      setTableNumber(selectedTable.table_number);
      if (selectedTable.customer_name) {
        setCustomerName(selectedTable.customer_name);
      } else {
        setCustomerName('Guest');
      }
    } else if (tables.length > 0 && !tableNumber) {
      setTableNumber(tables[0].table_number);
    }
  }, [selectedTable, tables, isOpen]);

  // Reset cart when drawer opens for a new table
  useEffect(() => {
    if (isOpen) {
      setCart({});
      setSearchQuery('');
      setCustomInstructions('');
    }
  }, [isOpen, selectedTable?.id]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    menuItems.forEach(item => {
      if (item.category) set.add(item.category);
    });
    return ['all', ...Array.from(set)];
  }, [menuItems]);

  // Filtered menu items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = activeCategory === 'all' || item.category?.toLowerCase() === activeCategory.toLowerCase();
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategory, searchQuery]);

  // Quantity helpers
  const handleQuantityChange = (menuItem: MenuItem, delta: number) => {
    if (menuItem.is_sold_out) return;

    setCart(prev => {
      const existing = prev[menuItem.id];
      const currentQty = existing ? existing.quantity : 0;
      const newQty = Math.max(0, currentQty + delta);

      if (newQty === 0) {
        const next = { ...prev };
        delete next[menuItem.id];
        return next;
      }

      return {
        ...prev,
        [menuItem.id]: {
          item: menuItem,
          quantity: newQty,
          notes: existing?.notes || ''
        }
      };
    });
  };

  const handleQuickTagClick = (tag: string) => {
    if (customInstructions.includes(tag)) {
      setCustomInstructions(prev => 
        prev.split(', ').filter(t => t.trim() !== tag).join(', ')
      );
    } else {
      setCustomInstructions(prev => 
        prev ? `${prev}, ${tag}` : tag
      );
    }
  };

  // Cart total calculations
  const cartEntries = Object.values(cart) as Array<{ item: MenuItem; quantity: number; notes: string }>;
  const totalItemCount = cartEntries.reduce((acc, c) => acc + c.quantity, 0);
  const totalAmount = cartEntries.reduce((acc, c) => acc + (c.item.price * c.quantity), 0);

  // Submit Order handler
  const handleSendToCounter = async () => {
    if (isSubmitting) return;

    if (cartEntries.length === 0) {
      toast.error('Please add at least one item to the order!');
      return;
    }

    if (!tableNumber) {
      toast.error('Please select or specify a table number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderItems: OrderItem[] = cartEntries.map(c => ({
        id: c.item.id,
        name: c.item.name,
        price: c.item.price,
        quantity: c.quantity,
        item_notes: c.notes || undefined
      }));

      // Generate IST formatted date
      const now = new Date();
      const createdAtIso = now.toISOString();
      const placedAtIst = now.toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' });

      // Generate unique 4-digit pure numeric token (1000 - 9999)
      let token = Math.floor(1000 + Math.random() * 9000).toString();
      try {
        const { data: existingOrders } = await supabase
          .from('orders')
          .select('token')
          .order('created_at', { ascending: false })
          .limit(500);

        if (existingOrders && existingOrders.length > 0) {
          const usedTokens = new Set(existingOrders.map(o => String(o.token)));
          let attempts = 0;
          while (usedTokens.has(token) && attempts < 100) {
            token = Math.floor(1000 + Math.random() * 9000).toString();
            attempts++;
          }
        }
      } catch (e) {
        console.warn('Error checking token uniqueness:', e);
      }

      if (orderChannel === 'swiggy') {
        token = `SWI-${token}`;
      } else if (orderChannel === 'zomato') {
        token = `ZOM-${token}`;
      }

      const isAggregator = orderChannel === 'swiggy' || orderChannel === 'zomato';
      const orderType = isAggregator ? 'aggregator' : orderChannel;
      const aggregatorPlatform = isAggregator ? orderChannel : undefined;

      const newOrderPayload = {
        token,
        status: 'pending',
        order_type: orderType,
        aggregator_platform: aggregatorPlatform,
        total: totalAmount,
        items: orderItems,
        customer_name: customerName.trim() || (isAggregator ? `${orderChannel === 'swiggy' ? 'Swiggy' : 'Zomato'} Order` : 'Guest'),
        customer_phone: customerPhone.trim() || undefined,
        table_id: isAggregator ? 'Online' : tableNumber,
        notes: customInstructions.trim() || (isAggregator ? `Online order via ${orderChannel.toUpperCase()}` : undefined),
        custom_instructions: customInstructions.trim() || undefined,
        created_at: createdAtIso,
        placed_at_ist: placedAtIst
      };

      // 1. Insert order into Supabase
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([newOrderPayload])
        .select();

      if (orderError) {
        console.error('Supabase order creation error:', orderError);
        throw new Error(orderError.message || 'Failed to submit order to database.');
      }

      const createdOrderRecord: Order = orderData?.[0] || {
        id: `ord-${Date.now()}`,
        ...newOrderPayload
      };

      // 2. Update table status to occupied in Supabase
      const targetTableObj = tables.find(t => t.table_number.toLowerCase() === tableNumber.toLowerCase());
      if (targetTableObj) {
        const { error: tableErr } = await supabase
          .from('tables')
          .upsert({
            id: targetTableObj.id,
            table_number: tableNumber,
            capacity: targetTableObj.capacity || 4,
            section: targetTableObj.section || 'Main Hall',
            status: 'occupied',
            customer_name: customerName.trim() || 'Guest',
            active_order_id: createdOrderRecord.id,
            total_amount: totalAmount,
            updated_at: new Date().toISOString()
          });

        if (tableErr) {
          console.warn('Could not update table status in Supabase:', tableErr.message);
        }
      }

      // 3. Notify and callback
      toast.success(`Order ${token} sent to counter successfully!`, {
        description: `Table ${tableNumber} • ${totalItemCount} items • ₹${totalAmount}`
      });

      if (onOrderCreated) {
        onOrderCreated(createdOrderRecord, tableNumber);
      }

      onClose();
    } catch (err: any) {
      console.error('Error dispatching captain order:', err);
      toast.error('Failed to send order', {
        description: err?.message || 'Check network connection or try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative flex h-full w-full max-w-3xl flex-col bg-[#0B0C0E] border-l border-white/10 text-white shadow-2xl overflow-hidden font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 sm:px-6 py-4 sm:py-5 bg-[#0F1014] shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shrink-0">
                <Utensils size={18} className="sm:w-5 sm:h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-serif tracking-tight text-white">Captain Order Entry</h2>
                  <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/30">
                    Dine-In
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-white/40">Build & dispatch order directly to Kitchen</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all cursor-pointer shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Mobile Tab Switcher */}
          <div className="flex md:hidden border-b border-white/10 bg-[#0A0B0E] p-2 gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setMobileTab('menu')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                mobileTab === 'menu'
                  ? 'bg-primary text-black shadow-[0_0_12px_rgba(197,160,89,0.3)]'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              <Utensils size={14} />
              <span>1. Menu Items ({menuItems.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('cart')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all relative ${
                mobileTab === 'cart'
                  ? 'bg-primary text-black shadow-[0_0_12px_rgba(197,160,89,0.3)]'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              <ShoppingBag size={14} />
              <span>2. Cart & Table ({totalItemCount})</span>
              {totalItemCount > 0 && mobileTab !== 'cart' && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow">
                  {totalItemCount}
                </span>
              )}
            </button>
          </div>

          {/* Drawer Body - Responsive stacked layout on mobile via tabs, side-by-side on desktop */}
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
            {/* Left/Cart Column: Selected Items, Table/Customer Details & Kitchen Instructions */}
            <div className={`w-full md:w-96 flex-shrink-0 border-b md:border-b-0 md:border-r border-white/10 bg-[#090A0D] p-4 sm:p-5 flex-col gap-4 sm:gap-5 overflow-y-auto custom-scrollbar ${
              mobileTab === 'cart' ? 'flex flex-1 md:flex-none' : 'hidden md:flex'
            }`}>
              
              {/* 1. Order Cart Summary - PLACED FIRST for immediate visibility and item review */}
              <div className="flex flex-col rounded-2xl border border-primary/20 bg-[#0F1014] p-4 gap-3 shadow-[0_0_25px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                      <ShoppingBag size={12} />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-white">
                        Selected Items
                      </span>
                      <span className="ml-1.5 text-[10px] font-bold text-primary px-1.5 py-0.5 rounded-full bg-primary/10">
                        {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  </div>
                  {cartEntries.length > 0 && (
                    <button
                      onClick={() => setCart({})}
                      className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider transition-colors px-2 py-1 rounded-lg hover:bg-red-400/10"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2.5 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
                  {cartEntries.length === 0 ? (
                    <div className="flex h-32 flex-col items-center justify-center text-center p-4 text-white/40">
                      <ShoppingBag size={28} className="mb-2 stroke-1 text-white/20" />
                      <p className="text-xs font-medium">Cart is empty</p>
                      <button
                        onClick={() => setMobileTab('menu')}
                        className="mt-2 text-[10px] text-primary underline underline-offset-2 font-bold uppercase tracking-wider"
                      >
                        Browse Menu Items
                      </button>
                    </div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {cartEntries.map(({ item, quantity }) => (
                        <motion.div
                          layout
                          initial={{ opacity: 0, scale: 0.96, y: 6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
                          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          key={item.id}
                          className="flex items-center justify-between rounded-xl bg-[#14161C] p-3 border border-white/5 hover:border-white/10 transition-colors"
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="text-xs font-bold text-white leading-tight">{item.name}</p>
                            <p className="text-[10px] text-primary/90 font-mono mt-0.5">
                              ₹{item.price} × {quantity} = <span className="font-bold text-primary">₹{item.price * quantity}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 bg-black/60 rounded-lg p-1 border border-white/10 shrink-0">
                            <button
                              onClick={() => handleQuantityChange(item, -1)}
                              className="h-7 w-7 flex items-center justify-center rounded bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer touch-manipulation"
                              title="Decrease quantity"
                              aria-label="Decrease item quantity"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-primary font-mono">{quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item, 1)}
                              className="h-7 w-7 flex items-center justify-center rounded bg-primary text-black font-bold hover:bg-primary/90 active:scale-95 transition-all cursor-pointer touch-manipulation"
                              title="Increase quantity"
                              aria-label="Increase item quantity"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>

                {/* Subtotal & Action in Cart Card */}
                <div className="pt-3 border-t border-white/10 flex flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">Grand Total</span>
                    <span className="text-xl font-serif font-bold text-primary font-mono">₹{totalAmount}</span>
                  </div>

                  <button
                    onClick={handleSendToCounter}
                    disabled={isSubmitting || cartEntries.length === 0}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-black shadow-[0_0_20px_rgba(197,160,89,0.25)] hover:bg-primary/90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <Send size={14} className={isSubmitting ? 'animate-spin' : ''} />
                    {isSubmitting ? 'Sending to Kitchen...' : 'Send to Counter / Kitchen'}
                  </button>
                </div>
              </div>

              {/* 2. Table & Customer Details Card */}
              <div className="rounded-2xl border border-white/10 bg-[#0F1014] p-4 flex flex-col gap-3">
                {/* Order Channel Selector */}
                <div className="flex flex-col gap-1.5 pb-2 border-b border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-1.5">
                    <ShoppingBag size={12} /> Order Channel
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setOrderChannel('dine_in')}
                      className={`px-2 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${
                        orderChannel === 'dine_in'
                          ? 'bg-primary/20 text-primary border-primary/50'
                          : 'bg-[#14161C] text-white/70 border-white/10 hover:text-white'
                      }`}
                    >
                      Dine-in
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderChannel('takeaway')}
                      className={`px-2 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${
                        orderChannel === 'takeaway'
                          ? 'bg-primary/20 text-primary border-primary/50'
                          : 'bg-[#14161C] text-white/70 border-white/10 hover:text-white'
                      }`}
                    >
                      Takeaway
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderChannel('swiggy')}
                      className={`px-2 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${
                        orderChannel === 'swiggy'
                          ? 'bg-[#FC8019] text-white border-[#FC8019]'
                          : 'bg-[#14161C] text-[#FC8019]/80 border-white/10 hover:text-[#FC8019]'
                      }`}
                    >
                      Swiggy
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderChannel('zomato')}
                      className={`px-2 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${
                        orderChannel === 'zomato'
                          ? 'bg-[#E23744] text-white border-[#E23744]'
                          : 'bg-[#14161C] text-[#E23744]/80 border-white/10 hover:text-[#E23744]'
                      }`}
                    >
                      Zomato
                    </button>
                  </div>
                </div>

                {orderChannel === 'dine_in' && (
                  <>
                    {/* Table Dropdown / Number */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                        <TableIcon size={11} className="text-primary" /> Target Table
                      </label>
                      <select
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        className="w-full rounded-xl bg-[#14161C] border border-white/10 px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-primary/50 transition-all"
                      >
                        {tables.map(t => (
                          <option key={t.id} value={t.table_number} className="bg-[#14161C] text-white">
                            {t.table_number} ({t.capacity} Seats) • {t.status.toUpperCase()}
                          </option>
                        ))}
                        {!tables.some(t => t.table_number === tableNumber) && (
                          <option value={tableNumber}>{tableNumber}</option>
                        )}
                      </select>
                    </div>
                  </>
                )}

                {/* Customer Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-medium text-white/70 uppercase tracking-wider flex items-center gap-1">
                      <User size={10} /> Customer Name
                    </label>
                    <input
                      type="text"
                      maxLength={50}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Rahul (Optional)"
                      className="w-full rounded-xl bg-[#14161C] border border-white/10 px-3 py-2 text-xs font-medium text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-medium text-white/70 uppercase tracking-wider flex items-center gap-1">
                      <Phone size={10} /> Phone Number
                    </label>
                    <input
                      type="tel"
                      maxLength={15}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value.replace(/[^0-9+ ]/g, ''))}
                      placeholder="+91 98765..."
                      className="w-full rounded-xl bg-[#14161C] border border-white/10 px-3 py-2 text-xs font-medium text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Custom Instructions / Kitchen Notes */}
              <div className="rounded-2xl border border-white/10 bg-[#0F1014] p-4 flex flex-col gap-2.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-1.5">
                  <MessageSquare size={12} /> Kitchen Notes & Special Instructions
                </span>

                <textarea
                  maxLength={250}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Less spicy, extra napkins, serve beverages first..."
                  rows={2}
                  className="w-full rounded-xl bg-[#14161C] border border-white/10 p-2.5 text-xs font-medium text-white placeholder-white/30 focus:outline-none focus:border-primary/50 resize-none transition-all"
                />

                {/* Quick Instruction Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {QUICK_INSTRUCTION_TAGS.map(tag => {
                    const active = customInstructions.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleQuickTagClick(tag)}
                        className={`rounded-lg px-2 py-1 text-[9px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                          active 
                            ? 'bg-primary text-black shadow-[0_0_10px_rgba(197,160,89,0.3)]' 
                            : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right Column: Menu Item Search & Grid */}
            <div className={`flex-1 flex flex-col p-4 sm:p-5 bg-[#0B0C0E] overflow-hidden gap-4 ${
              mobileTab === 'menu' ? 'flex min-h-0' : 'hidden md:flex'
            }`}>
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search menu items..."
                  className="w-full rounded-2xl bg-[#13151B] border border-white/10 pl-11 pr-4 py-3 text-xs font-semibold text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                      activeCategory === cat
                        ? 'bg-primary text-black shadow-[0_0_15px_rgba(197,160,89,0.2)]'
                        : 'bg-[#14161C] border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Menu Grid */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pb-6">
                  {filteredMenuItems.map(menuItem => {
                    const cartItem = cart[menuItem.id];
                    const qty = cartItem ? cartItem.quantity : 0;

                    return (
                      <div
                        key={menuItem.id}
                        className={`flex flex-col justify-between rounded-2xl border p-4 transition-all duration-300 ${
                          qty > 0 
                            ? 'border-primary/50 bg-[#161822] shadow-[0_0_20px_rgba(197,160,89,0.12)]' 
                            : 'border-white/10 bg-[#12141C] hover:border-white/20'
                        } ${menuItem.is_sold_out ? 'opacity-40 grayscale pointer-events-none' : ''}`}
                      >
                        <div className="flex gap-3.5 items-start">
                          {menuItem.image ? (
                            <img
                              src={menuItem.image}
                              alt={menuItem.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                              className="h-16 w-16 rounded-xl object-cover border border-white/10 shrink-0 bg-black/40"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary/40 shrink-0">
                              <Utensils size={20} />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <h3 className="text-xs font-bold text-white tracking-tight leading-snug">{menuItem.name}</h3>
                            {menuItem.description && (
                              <p className="text-[10px] text-white/40 line-clamp-2 mt-0.5 leading-relaxed">{menuItem.description}</p>
                            )}
                            <div className="mt-1.5 flex items-center gap-2">
                              <span className="text-sm font-bold text-primary font-mono">₹{menuItem.price.toFixed(2)}</span>
                              {menuItem.category && (
                                <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                                  {menuItem.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quantity Add / Sub Controls */}
                        <div className="mt-3.5 flex items-center justify-between pt-2.5 border-t border-white/5">
                          <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">
                            {menuItem.is_sold_out ? 'Sold Out' : qty > 0 ? `${qty} in cart` : 'Add to order'}
                          </span>

                          <div className="flex items-center gap-2">
                            {qty > 0 && (
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(menuItem, -1)}
                                className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer touch-manipulation"
                                aria-label="Decrease quantity"
                              >
                                <Minus size={14} />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleQuantityChange(menuItem, 1)}
                              className={`min-h-[36px] flex items-center justify-center rounded-xl px-4 text-xs font-bold transition-all cursor-pointer active:scale-95 touch-manipulation ${
                                qty > 0 
                                  ? 'bg-primary text-black hover:bg-primary/90 font-mono shadow-sm' 
                                  : 'bg-white/10 text-white hover:bg-primary hover:text-black'
                              }`}
                              aria-label="Add item"
                            >
                              {qty > 0 ? `${qty}` : <Plus size={15} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredMenuItems.length === 0 && (
                    <div className="col-span-full flex h-48 flex-col items-center justify-center text-center p-6 rounded-2xl border border-white/5 bg-[#12141A]">
                      <Search size={32} className="mb-2 text-white/40" />
                      <p className="text-xs font-semibold text-white/80">No menu items match your search</p>
                      <p className="text-[10px] text-white/50 mt-1">Try a different name, category, or spelling</p>
                      {(searchQuery || activeCategory !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setActiveCategory('all');
                          }}
                          className="mt-3.5 px-3.5 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-[10px] font-bold uppercase tracking-wider hover:bg-primary/20 transition-all cursor-pointer active:scale-95"
                        >
                          Reset Filters &amp; Search
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Sticky Floating Cart Action Bar with Safe-Area padding */}
              {totalItemCount > 0 && mobileTab === 'menu' && (
                <div className="md:hidden shrink-0 p-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] bg-[#12141C] border border-primary/40 rounded-2xl shadow-[0_0_25px_rgba(197,160,89,0.2)] flex items-center justify-between z-10 backdrop-blur-md">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-primary block">Selected Items ({totalItemCount})</span>
                    <span className="text-sm font-serif font-bold text-white font-mono">Total: ₹{totalAmount.toFixed(2)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileTab('cart')}
                    className="min-h-[44px] flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-black shadow hover:bg-primary/90 transition-all cursor-pointer active:scale-95 touch-manipulation"
                  >
                    <span>View Cart</span>
                    <ShoppingBag size={14} />
                  </button>
                </div>
              )}

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
