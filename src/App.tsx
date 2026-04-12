/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Order, MenuItem, OrderStatus } from '@/src/types';
import { 
  LayoutDashboard, 
  ChefHat, 
  PackageCheck, 
  Coffee, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Menu as MenuIcon,
  LogOut,
  RefreshCcw,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toaster } from '@/components/ui/sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export default function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchToken, setSearchToken] = useState('');
  const [activeTab, setActiveTab] = useState('counter');

  // ... (rest of the useEffect and handlers)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .neq('status', 'completed')
          .neq('status', 'cancelled')
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;
        setOrders(ordersData || []);

        const { data: menuData, error: menuError } = await supabase
          .from('menu_items')
          .select('*')
          .order('category', { ascending: true });

        if (menuError) throw menuError;
        setMenuItems(menuData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to real-time updates
    const ordersSubscription = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', table: 'orders', schema: 'public' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new as Order, ...prev]);
          toast.success(`New Order Received! Token: ${(payload.new as Order).token}`);
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => {
            const updated = payload.new as Order;
            if (updated.status === 'completed' || updated.status === 'cancelled') {
              return prev.filter(o => o.id !== updated.id);
            }
            return prev.map(o => o.id === updated.id ? updated : o);
          });
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id));
        }
      })
      .subscribe();

    const menuSubscription = supabase
      .channel('menu-realtime')
      .on('postgres_changes', { event: 'UPDATE', table: 'menu_items', schema: 'public' }, (payload) => {
        setMenuItems(prev => prev.map(item => item.id === payload.new.id ? payload.new as MenuItem : item));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
      supabase.removeChannel(menuSubscription);
    };
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    console.log(`Updating order ${orderId} status to ${newStatus}...`);
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
        .select();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      console.log('Update successful:', data);
      toast.success(`Order status updated to ${newStatus}`);
      
      // Manual state update
      setOrders(prev => {
        if (newStatus === 'completed' || newStatus === 'cancelled') {
          return prev.filter(o => o.id !== orderId);
        }
        return prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    }
  };

  const toggleMenuItemSoldOut = async (itemId: string, isSoldOut: boolean) => {
    console.log(`Toggling item ${itemId} availability to ${isSoldOut ? 'Sold Out' : 'Available'}...`);
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .update({ is_sold_out: isSoldOut })
        .eq('id', itemId)
        .select();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Update successful:', data);
      toast.success(`Item availability updated`);
      
      // Manual state update
      setMenuItems(prev => prev.map(item => item.id === itemId ? { ...item, is_sold_out: isSoldOut } : item));
    } catch (error) {
      console.error('Error updating menu item:', error);
      toast.error('Failed to update menu item');
    }
  };

  const updateMenuItem = async (itemId: string, updates: Partial<MenuItem>) => {
    console.log(`Updating menu item ${itemId} with:`, updates);
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', itemId)
        .select();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Update successful:', data);
      toast.success(`Menu item updated successfully`);
      
      // Manual state update
      setMenuItems(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } : item));
    } catch (error) {
      console.error('Error updating menu item:', error);
      toast.error('Failed to update menu item');
    }
  };

  const filteredOrders = useMemo(() => {
    if (!searchToken) return orders;
    return orders.filter(o => o.token.toLowerCase().includes(searchToken.toLowerCase()));
  }, [orders, searchToken]);

  const pendingOrders = filteredOrders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-6">
          <RefreshCcw className="h-10 w-10 animate-spin opacity-20" />
          <p className="font-serif italic text-lg tracking-wide opacity-60">ScanServe</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-black font-sans text-white selection:bg-white selection:text-black">
      <Toaster position="top-right" theme="dark" richColors />
      
      {/* Sidebar */}
      <aside className="flex w-20 flex-col items-center border-r border-white/10 bg-black py-10 md:w-64">
        <div className="mb-16 flex items-center gap-3 px-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-transparent">
            <Coffee size={20} strokeWidth={1.5} />
          </div>
          <h1 className="hidden text-2xl font-serif tracking-tight md:block">Scan<span className="italic opacity-60">Serve</span></h1>
        </div>

        <nav className="flex w-full flex-1 flex-col gap-1 px-4">
          <NavItem 
            icon={<LayoutDashboard size={18} strokeWidth={1.5} />} 
            label="Counter" 
            active={activeTab === 'counter'} 
            onClick={() => setActiveTab('counter')}
          />
          <NavItem 
            icon={<ChefHat size={18} strokeWidth={1.5} />} 
            label="Kitchen" 
            active={activeTab === 'kitchen'} 
            onClick={() => setActiveTab('kitchen')}
          />
          <NavItem 
            icon={<PackageCheck size={18} strokeWidth={1.5} />} 
            label="Pickup" 
            active={activeTab === 'pickup'} 
            onClick={() => setActiveTab('pickup')}
          />
          <NavItem 
            icon={<MenuIcon size={18} strokeWidth={1.5} />} 
            label="Menu" 
            active={activeTab === 'menu'} 
            onClick={() => setActiveTab('menu')}
          />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <header className="flex h-24 items-center justify-between border-b border-white/10 px-10">
            <TabsList className="bg-transparent p-0 gap-8">
              <TabsTrigger value="counter" className="text-white/40 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none border-b border-transparent data-[state=active]:border-white rounded-none h-24 px-0 text-xs font-medium uppercase tracking-[0.2em] transition-all">Counter</TabsTrigger>
              <TabsTrigger value="kitchen" className="text-white/40 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none border-b border-transparent data-[state=active]:border-white rounded-none h-24 px-0 text-xs font-medium uppercase tracking-[0.2em] transition-all">Kitchen</TabsTrigger>
              <TabsTrigger value="pickup" className="text-white/40 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none border-b border-transparent data-[state=active]:border-white rounded-none h-24 px-0 text-xs font-medium uppercase tracking-[0.2em] transition-all">Pickup</TabsTrigger>
              <TabsTrigger value="menu" className="text-white/40 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none border-b border-transparent data-[state=active]:border-white rounded-none h-24 px-0 text-xs font-medium uppercase tracking-[0.2em] transition-all">Menu</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 rounded-full border border-white/10 px-5 py-2 text-[10px] font-medium uppercase tracking-widest text-white/60">
                <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                SYSTEM ONLINE
              </div>
            </div>
          </header>

          <div className="flex-1 min-h-0 p-10">
            <TabsContent value="counter" className="m-0 h-full flex flex-col gap-10 outline-none data-[state=inactive]:hidden">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-serif italic tracking-tight">Counter</h2>
                  <p className="text-xs uppercase tracking-widest text-white/30 mt-1">Incoming orders & Verification</p>
                </div>
                <div className="relative w-80">
                  <Search className="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/20" />
                  <Input 
                    placeholder="Search Token ID..." 
                    className="pl-12 bg-white/[0.03] border-white/10 rounded-full h-12 text-xs tracking-widest focus-visible:ring-white/20"
                    value={searchToken}
                    onChange={(e) => setSearchToken(e.target.value)}
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {pendingOrders.map((order) => (
                      <OrderCard 
                        key={order.id} 
                        order={order} 
                        actionLabel="Confirm Payment" 
                        actionIcon={<CheckCircle2 size={14} strokeWidth={1.5} />}
                        onAction={() => updateOrderStatus(order.id, 'preparing')}
                      />
                    ))}
                  </AnimatePresence>
                  {pendingOrders.length === 0 && (
                    <div className="col-span-full flex h-80 flex-col items-center justify-center rounded-3xl border border-white/5 bg-white/[0.01]">
                      <Clock size={40} strokeWidth={1} className="mb-6 opacity-10" />
                      <p className="text-[10px] uppercase tracking-[0.3em] text-white/20">All systems clear</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="kitchen" className="m-0 h-full flex flex-col gap-10 outline-none data-[state=inactive]:hidden">
              <div>
                <h2 className="text-3xl font-serif italic tracking-tight">Kitchen</h2>
                <p className="text-xs uppercase tracking-widest text-white/30 mt-1">Active Preparations</p>
              </div>

              <ScrollArea className="flex-1">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {preparingOrders.map((order) => (
                      <OrderCard 
                        key={order.id} 
                        order={order} 
                        actionLabel="Order Ready" 
                        actionIcon={<CheckCircle2 size={14} strokeWidth={1.5} />}
                        onAction={() => updateOrderStatus(order.id, 'ready')}
                        variant="preparing"
                      />
                    ))}
                  </AnimatePresence>
                  {preparingOrders.length === 0 && (
                    <div className="col-span-full flex h-80 flex-col items-center justify-center rounded-3xl border border-white/5 bg-white/[0.01]">
                      <ChefHat size={40} strokeWidth={1} className="mb-6 opacity-10" />
                      <p className="text-[10px] uppercase tracking-[0.3em] text-white/20">Kitchen is clear</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="pickup" className="m-0 h-full flex flex-col gap-10 outline-none data-[state=inactive]:hidden">
              <div>
                <h2 className="text-3xl font-serif italic tracking-tight">Pickup</h2>
                <p className="text-xs uppercase tracking-widest text-white/30 mt-1">Awaiting Collection</p>
              </div>

              <ScrollArea className="flex-1">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {readyOrders.map((order) => (
                      <OrderCard 
                        key={order.id} 
                        order={order} 
                        actionLabel="Mark Collected" 
                        actionIcon={<PackageCheck size={14} strokeWidth={1.5} />}
                        onAction={() => updateOrderStatus(order.id, 'completed')}
                        variant="ready"
                      />
                    ))}
                  </AnimatePresence>
                  {readyOrders.length === 0 && (
                    <div className="col-span-full flex h-80 flex-col items-center justify-center rounded-3xl border border-white/5 bg-white/[0.01]">
                      <PackageCheck size={40} strokeWidth={1} className="mb-6 opacity-10" />
                      <p className="text-[10px] uppercase tracking-[0.3em] text-white/20">No orders waiting</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="menu" className="m-0 h-full flex flex-col gap-10 outline-none data-[state=inactive]:hidden">
              <div>
                <h2 className="text-3xl font-serif italic tracking-tight">Menu</h2>
                <p className="text-xs uppercase tracking-widest text-white/30 mt-1">Inventory & Availability</p>
              </div>

              <ScrollArea className="flex-1">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {menuItems.map((item) => (
                    <Card key={item.id} className="bg-white/[0.02] border border-white/5 overflow-hidden group hover:border-white/20 transition-all duration-500">
                      <div className="flex items-center p-6 gap-6">
                        <div className="h-20 w-20 flex-shrink-0 rounded-full bg-black flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-white/30 transition-all">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                          ) : (
                            <Coffee className="text-white/20" size={24} strokeWidth={1} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate text-white/90">{item.name}</h4>
                          <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">{item.category}</p>
                          <p className="text-xs font-medium text-white/60 mt-2">${(item.price || 0).toFixed(2)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <div className="flex items-center gap-3">
                            <EditMenuItemDialog item={item} onSave={(updates) => updateMenuItem(item.id, updates)} />
                            <Switch 
                              checked={!item.is_sold_out} 
                              onCheckedChange={(checked) => toggleMenuItemSoldOut(item.id, !checked)}
                              className="data-[state=checked]:bg-white"
                            />
                          </div>
                          <span className={cn(
                            "text-[9px] font-medium uppercase tracking-[0.2em]",
                            item.is_sold_out ? "text-red-500/60" : "text-white/40"
                          )}>
                            {item.is_sold_out ? "Sold Out" : "Active"}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}

function EditMenuItemDialog({ item, onSave }: { item: MenuItem, onSave: (updates: Partial<MenuItem>) => void }) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(item.price.toString());
  const [category, setCategory] = useState(item.category);
  const [isSoldOut, setIsSoldOut] = useState(item.is_sold_out);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    onSave({
      name,
      price: parseFloat(price) || 0,
      category,
      is_sold_out: isSoldOut
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="h-8 w-8 flex items-center justify-center rounded-full border border-white/10 text-white/20 hover:text-white hover:border-white/30 transition-all">
          <Edit2 size={12} strokeWidth={1.5} />
        </button>
      </DialogTrigger>
      <DialogContent className="bg-black border-white/10 text-white sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif italic tracking-tight">Edit Item</DialogTitle>
          <DialogDescription className="text-[10px] uppercase tracking-widest text-white/30">
            Modify menu item specifications
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-6">
          <div className="grid gap-2">
            <label htmlFor="name" className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Item Name</label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="bg-white/[0.03] border-white/10 rounded-full h-12 text-xs tracking-widest focus-visible:ring-white/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label htmlFor="price" className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Price ($)</label>
              <Input 
                id="price" 
                type="number" 
                step="0.01"
                value={price} 
                onChange={(e) => setPrice(e.target.value)}
                className="bg-white/[0.03] border-white/10 rounded-full h-12 text-xs tracking-widest focus-visible:ring-white/20"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="category" className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Category</label>
              <Input 
                id="category" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="bg-white/[0.03] border-white/10 rounded-full h-12 text-xs tracking-widest focus-visible:ring-white/20"
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-3xl bg-white/[0.02] p-5 border border-white/5">
            <div className="space-y-0.5">
              <label className="text-[10px] uppercase tracking-widest text-white/60">Availability</label>
              <p className="text-[9px] text-white/20 uppercase tracking-widest">Toggle sold out status</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn("text-[9px] font-medium uppercase tracking-widest", isSoldOut ? "text-red-500/60" : "text-white/40")}>
                {isSoldOut ? "Sold Out" : "Active"}
              </span>
              <Switch 
                checked={!isSoldOut} 
                onCheckedChange={(checked) => setIsSoldOut(!checked)}
                className="data-[state=checked]:bg-white"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-[10px] uppercase tracking-widest text-white/30 hover:text-white hover:bg-transparent">Cancel</Button>
          <Button onClick={handleSave} className="bg-white text-black hover:bg-white/90 rounded-full px-8 h-12 text-[10px] uppercase tracking-[0.2em] font-medium">
            <Save size={14} className="mr-2" strokeWidth={1.5} />
            Update Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-full px-4 py-3 transition-all duration-300",
        active 
          ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.1)]" 
          : "text-white/40 hover:text-white"
      )}
    >
      {icon}
      <span className="hidden text-[11px] font-medium md:block uppercase tracking-[0.15em]">{label}</span>
    </button>
  );
}

function OrderCard({ 
  order, 
  actionLabel, 
  actionIcon, 
  onAction,
  variant = 'pending'
}: { 
  order: Order, 
  actionLabel: string, 
  actionIcon: React.ReactNode, 
  onAction: () => void | Promise<void>,
  variant?: 'pending' | 'preparing' | 'ready',
  key?: string | number
}) {
  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      <Card className="border border-white/5 bg-white/[0.02] backdrop-blur-sm overflow-hidden relative group transition-all hover:border-white/20">
        <CardHeader className="pb-4 pt-6 px-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">
              Order #{order.token}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-white/30 font-medium uppercase tracking-widest">
              <Clock size={10} strokeWidth={2} />
              {timeAgo(order.created_at)}
            </div>
          </div>
          <CardTitle className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-serif italic tracking-tight">{order.customer_name || 'Anonymous'}</span>
              <span className="text-xs font-medium tracking-widest opacity-80">${(order.total || 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-[9px] font-medium text-white/30 uppercase tracking-[0.15em] mt-1">
              <span>Ref: {order.id.slice(0, 8)}</span>
              {order.table_id && (
                <span className="text-white/60">Table {order.table_id}</span>
              )}
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="pb-6 px-6">
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs group/item">
                <div className="flex items-center gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 text-[9px] font-medium text-white/40">
                    {item.quantity}
                  </span>
                  <span className="text-white/70 group-hover/item:text-white transition-colors">{item.name}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>

        <CardFooter className="p-0 border-t border-white/5">
          <Button 
            onClick={onAction}
            variant="ghost"
            className="w-full h-14 rounded-none text-[10px] font-medium uppercase tracking-[0.3em] text-white/40 hover:bg-white hover:text-black transition-all duration-500"
          >
            {actionIcon}
            <span className="ml-2">{actionLabel}</span>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
