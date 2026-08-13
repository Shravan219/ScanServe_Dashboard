import React, { useState, useMemo } from 'react';
import { Order, MenuItem, OrderStatus } from '@/src/types';
import { 
  Globe, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  ShoppingBag, 
  Smartphone, 
  TrendingUp, 
  Filter,
  PackageCheck,
  ChefHat
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { supabase } from '@/src/lib/supabase';

export function getOrderPlatform(order: Order): 'swiggy' | 'zomato' | 'other_online' | 'dine_in' {
  const tokenUpper = (order.token || '').toUpperCase();
  if (tokenUpper.startsWith('SWI') || tokenUpper.startsWith('SW') || tokenUpper.includes('SWI') || tokenUpper.includes('SWIGGY')) return 'swiggy';
  if (tokenUpper.startsWith('ZOM') || tokenUpper.startsWith('ZM') || tokenUpper.includes('ZOM') || tokenUpper.includes('ZOMATO')) return 'zomato';

  if (order.aggregator_platform === 'swiggy') return 'swiggy';
  if (order.aggregator_platform === 'zomato') return 'zomato';

  const name = (order.customer_name || '').toLowerCase();
  const notes = (order.notes || '').toLowerCase();
  const instructions = (order.custom_instructions || '').toLowerCase();
  const fullText = `${name} ${notes} ${instructions}`;

  if (fullText.includes('swiggy')) return 'swiggy';
  if (fullText.includes('zomato')) return 'zomato';

  if (order.order_type === 'aggregator' || order.order_type === 'delivery') {
    return 'other_online';
  }

  if (fullText.includes('online') || fullText.includes('ubereats') || fullText.includes('magicpin')) {
    return 'other_online';
  }

  return 'dine_in';
}

interface OnlineOrdersViewProps {
  orders: Order[];
  allOrders: Order[];
  menuItems: MenuItem[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onOrderCreated: (newOrder: Order) => void;
  renderOrderCard: (order: Order, index: number) => React.ReactNode;
}

export function OnlineOrdersView({
  orders,
  allOrders,
  menuItems,
  onUpdateStatus,
  onOrderCreated,
  renderOrderCard
}: OnlineOrdersViewProps) {
  const [platformFilter, setPlatformFilter] = useState<'all' | 'swiggy' | 'zomato' | 'other'>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'all_history' | 'pending' | 'preparing' | 'ready' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter online orders
  const onlineOrdersList = useMemo(() => {
    const sourcePool = statusFilter === 'all_history' || statusFilter === 'completed' ? allOrders : orders;
    
    return sourcePool.filter(order => {
      const platform = getOrderPlatform(order);
      const isOnline = platform !== 'dine_in';
      if (!isOnline) return false;

      if (platformFilter === 'swiggy' && platform !== 'swiggy') return false;
      if (platformFilter === 'zomato' && platform !== 'zomato') return false;
      if (platformFilter === 'other' && platform !== 'other_online') return false;

      if (statusFilter === 'pending' && order.status !== 'pending') return false;
      if (statusFilter === 'preparing' && order.status !== 'preparing') return false;
      if (statusFilter === 'ready' && order.status !== 'ready') return false;
      if (statusFilter === 'completed' && order.status !== 'completed') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchToken = order.token.toLowerCase().includes(q);
        const matchName = (order.customer_name || '').toLowerCase().includes(q);
        const matchPhone = (order.customer_phone || '').toLowerCase().includes(q);
        const matchNotes = (order.notes || '').toLowerCase().includes(q);
        return matchToken || matchName || matchPhone || matchNotes;
      }

      return true;
    });
  }, [orders, allOrders, platformFilter, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const allOnline = allOrders.filter(o => getOrderPlatform(o) !== 'dine_in');
    const swiggyOrders = allOnline.filter(o => getOrderPlatform(o) === 'swiggy');
    const zomatoOrders = allOnline.filter(o => getOrderPlatform(o) === 'zomato');
    
    const activeCount = orders.filter(o => getOrderPlatform(o) !== 'dine_in').length;
    const swiggyTotal = swiggyOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const zomatoTotal = zomatoOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOnlineRev = allOnline.reduce((sum, o) => sum + (o.total || 0), 0);

    return {
      activeCount,
      totalCount: allOnline.length,
      totalRev: totalOnlineRev,
      swiggyCount: swiggyOrders.length,
      swiggyRev: swiggyTotal,
      zomatoCount: zomatoOrders.length,
      zomatoRev: zomatoTotal
    };
  }, [orders, allOrders]);

  return (
    <div className="h-full flex flex-col gap-4 sm:gap-6 md:gap-8 p-3.5 sm:p-6 md:p-10 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-4xl font-serif tracking-tight">Online Orders</h2>
            <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
              Swiggy & Zomato
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 mt-1 sm:mt-2 font-bold">
            Aggregator integration & dispatch desk
          </p>
        </div>
      </div>

      {/* Platform Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Online */}
        <Card className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">Active Dispatch</span>
            <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Globe size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-serif font-bold text-white">{stats.activeCount}</span>
            <span className="text-[10px] text-white/30 block mt-1">Pending & Kitchen items</span>
          </div>
        </Card>

        {/* Swiggy Card */}
        <Card className="bg-[#0A0A0A] border border-[#FC8019]/20 rounded-2xl p-5 flex flex-col justify-between shadow-[0_0_20px_rgba(252,128,25,0.05)]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#FC8019]">Swiggy Orders</span>
            <div className="px-2.5 py-1 rounded-full bg-[#FC8019]/20 text-[#FC8019] text-[9px] font-bold uppercase tracking-wider">
              SWIGGY
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-serif font-bold text-white">{stats.swiggyCount}</span>
              <span className="text-[10px] text-white/30 block mt-1">Total Orders</span>
            </div>
            <span className="text-lg font-serif font-bold text-[#FC8019]">₹{stats.swiggyRev.toFixed(0)}</span>
          </div>
        </Card>

        {/* Zomato Card */}
        <Card className="bg-[#0A0A0A] border border-[#E23744]/20 rounded-2xl p-5 flex flex-col justify-between shadow-[0_0_20px_rgba(226,55,68,0.05)]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#E23744]">Zomato Orders</span>
            <div className="px-2.5 py-1 rounded-full bg-[#E23744]/20 text-[#E23744] text-[9px] font-bold uppercase tracking-wider">
              ZOMATO
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-serif font-bold text-white">{stats.zomatoCount}</span>
              <span className="text-[10px] text-white/30 block mt-1">Total Orders</span>
            </div>
            <span className="text-lg font-serif font-bold text-[#E23744]">₹{stats.zomatoRev.toFixed(0)}</span>
          </div>
        </Card>

        {/* Total Online Revenue */}
        <Card className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">Total Online Sales</span>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-serif font-bold text-emerald-400">₹{stats.totalRev.toFixed(0)}</span>
            <span className="text-[10px] text-white/30 block mt-1">Lifetime Online Revenue</span>
          </div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0A0A0A] border border-white/5 rounded-2xl p-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/40" />
          <Input 
            placeholder="Search Token, Swiggy/Zomato ID..." 
            className="pl-11 bg-black border-white/5 rounded-full h-11 text-[10px] font-bold uppercase tracking-[0.2em] focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Platform & Status Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Platform Pills */}
          <div className="flex items-center bg-black p-1 rounded-full border border-white/5 gap-1">
            <button
              onClick={() => setPlatformFilter('all')}
              className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all ${
                platformFilter === 'all' ? 'bg-primary text-black' : 'text-white/40 hover:text-white'
              }`}
            >
              All Channels
            </button>
            <button
              onClick={() => setPlatformFilter('swiggy')}
              className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all ${
                platformFilter === 'swiggy' ? 'bg-[#FC8019] text-white' : 'text-[#FC8019]/70 hover:text-[#FC8019]'
              }`}
            >
              Swiggy
            </button>
            <button
              onClick={() => setPlatformFilter('zomato')}
              className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all ${
                platformFilter === 'zomato' ? 'bg-[#E23744] text-white' : 'text-[#E23744]/70 hover:text-[#E23744]'
              }`}
            >
              Zomato
            </button>
          </div>

          {/* Status Pills */}
          <div className="flex items-center bg-black p-1 rounded-full border border-white/5 gap-1">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all ${
                statusFilter === 'active' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('all_history')}
              className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all ${
                statusFilter === 'all_history' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              All History
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="w-full">
        {onlineOrdersList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 pb-10 w-full">
            <AnimatePresence mode="popLayout">
              {onlineOrdersList.map((order, index) => renderOrderCard(order, index))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex h-64 sm:h-80 flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#0A0A0A] p-6 text-center w-full">
            <Globe size={40} strokeWidth={1} className="mb-4 text-primary/20" />
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/20 font-bold mb-2">No Online Orders Found</p>
            <p className="text-xs text-white/40 max-w-md">
              Swiggy and Zomato orders placed via Captain POS or online channels will appear here automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
