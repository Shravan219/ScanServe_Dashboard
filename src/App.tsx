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
      <div className="flex h-screen w-full items-center justify-center bg-onyx-black text-onyx-green">
        <div className="flex flex-col items-center gap-4">
          <RefreshCcw className="h-12 w-12 animate-spin" />
          <p className="font-mono text-sm tracking-widest uppercase">Initializing ScanServe Systems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-onyx-black font-sans text-white selection:bg-onyx-green selection:text-onyx-black">
      <Toaster position="top-right" theme="dark" richColors />
      
      {/* Sidebar */}
      <aside className="flex w-20 flex-col items-center border-r border-onyx-graphite bg-onyx-black py-8 md:w-64">
        <div className="mb-12 flex items-center gap-3 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-onyx-green text-onyx-black shadow-[0_0_15px_rgba(0,255,65,0.3)]">
            <Coffee size={24} />
          </div>
          <h1 className="hidden text-xl font-bold tracking-tighter md:block uppercase">SCAN<span className="text-onyx-green">SERVE</span></h1>
        </div>

        <nav className="flex w-full flex-1 flex-col gap-2 px-4">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Counter" 
            active={activeTab === 'counter'} 
            onClick={() => setActiveTab('counter')}
          />
          <NavItem 
            icon={<ChefHat size={20} />} 
            label="Kitchen" 
            active={activeTab === 'kitchen'} 
            onClick={() => setActiveTab('kitchen')}
          />
          <NavItem 
            icon={<PackageCheck size={20} />} 
            label="Pickup" 
            active={activeTab === 'pickup'} 
            onClick={() => setActiveTab('pickup')}
          />
          <NavItem 
            icon={<MenuIcon size={20} />} 
            label="Menu" 
            active={activeTab === 'menu'} 
            onClick={() => setActiveTab('menu')}
          />
        </nav>

        <div className="mt-auto w-full px-4">
          <button className="flex w-full items-center gap-3 rounded-xl p-3 text-muted-foreground transition-colors hover:bg-onyx-graphite hover:text-white">
            <LogOut size={20} />
            <span className="hidden text-sm font-medium md:block">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <header className="flex h-20 items-center justify-between border-b border-onyx-graphite px-8">
            <TabsList className="bg-transparent p-0">
              <TabsTrigger value="counter" className="text-zinc-300 data-[state=active]:bg-transparent data-[state=active]:text-onyx-green data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-onyx-green rounded-none h-20 px-6 text-sm font-medium uppercase tracking-widest transition-colors">Counter</TabsTrigger>
              <TabsTrigger value="kitchen" className="text-zinc-300 data-[state=active]:bg-transparent data-[state=active]:text-onyx-green data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-onyx-green rounded-none h-20 px-6 text-sm font-medium uppercase tracking-widest transition-colors">Kitchen</TabsTrigger>
              <TabsTrigger value="pickup" className="text-zinc-300 data-[state=active]:bg-transparent data-[state=active]:text-onyx-green data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-onyx-green rounded-none h-20 px-6 text-sm font-medium uppercase tracking-widest transition-colors">Pickup</TabsTrigger>
              <TabsTrigger value="menu" className="text-zinc-300 data-[state=active]:bg-transparent data-[state=active]:text-onyx-green data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-onyx-green rounded-none h-20 px-6 text-sm font-medium uppercase tracking-widest transition-colors">Menu</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-full bg-onyx-graphite px-4 py-2 text-xs font-mono text-onyx-green">
                <span className="h-2 w-2 animate-pulse rounded-full bg-onyx-green" />
                SYSTEM ONLINE
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-hidden p-8">
            <TabsContent value="counter" className="m-0 h-full flex flex-col gap-6 outline-none">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Counter View</h2>
                  <p className="text-muted-foreground">Manage incoming orders and verify payments.</p>
                </div>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search Token ID..." 
                    className="pl-10 bg-onyx-graphite border-none focus-visible:ring-1 focus-visible:ring-onyx-green"
                    value={searchToken}
                    onChange={(e) => setSearchToken(e.target.value)}
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {pendingOrders.map((order) => (
                      <OrderCard 
                        key={order.id} 
                        order={order} 
                        actionLabel="Confirm Payment" 
                        actionIcon={<CheckCircle2 size={18} />}
                        onAction={() => updateOrderStatus(order.id, 'preparing')}
                      />
                    ))}
                  </AnimatePresence>
                  {pendingOrders.length === 0 && (
                    <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-onyx-graphite text-muted-foreground">
                      <Clock size={48} className="mb-4 opacity-20" />
                      <p>No pending orders found.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="kitchen" className="m-0 h-full flex flex-col gap-6 outline-none">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Kitchen View</h2>
                <p className="text-muted-foreground">Active orders currently being prepared.</p>
              </div>

              <ScrollArea className="flex-1">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {preparingOrders.map((order) => (
                      <OrderCard 
                        key={order.id} 
                        order={order} 
                        actionLabel="Order Done" 
                        actionIcon={<CheckCircle2 size={18} />}
                        onAction={() => updateOrderStatus(order.id, 'ready')}
                        variant="preparing"
                      />
                    ))}
                  </AnimatePresence>
                  {preparingOrders.length === 0 && (
                    <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-onyx-graphite text-muted-foreground">
                      <ChefHat size={48} className="mb-4 opacity-20" />
                      <p>Kitchen is clear. No active preparations.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="pickup" className="m-0 h-full flex flex-col gap-6 outline-none">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Pickup View</h2>
                <p className="text-muted-foreground">Orders ready for customer collection.</p>
              </div>

              <ScrollArea className="flex-1">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {readyOrders.map((order) => (
                      <OrderCard 
                        key={order.id} 
                        order={order} 
                        actionLabel="Mark Picked Up" 
                        actionIcon={<PackageCheck size={18} />}
                        onAction={() => updateOrderStatus(order.id, 'completed')}
                        variant="ready"
                      />
                    ))}
                  </AnimatePresence>
                  {readyOrders.length === 0 && (
                    <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-onyx-graphite text-muted-foreground">
                      <PackageCheck size={48} className="mb-4 opacity-20" />
                      <p>No orders waiting for pickup.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="menu" className="m-0 h-full flex flex-col gap-6 outline-none">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Menu Management</h2>
                <p className="text-zinc-300">Toggle item availability in real-time.</p>
              </div>

              <ScrollArea className="flex-1">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {menuItems.map((item) => (
                    <Card key={item.id} className="bg-onyx-graphite border border-white/5 overflow-hidden group hover:border-onyx-green/30 transition-colors">
                      <div className="flex items-center p-4 gap-4">
                        <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-onyx-black flex items-center justify-center overflow-hidden border border-white/10">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Coffee className="text-zinc-500" size={24} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold truncate text-white">{item.name}</h4>
                          <p className="text-xs text-zinc-400 truncate font-medium">{item.category}</p>
                          <p className="text-sm font-mono text-onyx-green mt-1 font-bold">${(item.price || 0).toFixed(2)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            <EditMenuItemDialog item={item} onSave={(updates) => updateMenuItem(item.id, updates)} />
                            <Switch 
                              checked={!item.is_sold_out} 
                              onCheckedChange={(checked) => toggleMenuItemSoldOut(item.id, !checked)}
                              className="data-[state=checked]:bg-onyx-green"
                            />
                          </div>
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            item.is_sold_out ? "text-red-500" : "text-onyx-green"
                          )}>
                            {item.is_sold_out ? "Sold Out" : "Available"}
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
        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-onyx-green hover:bg-onyx-green/10">
          <Edit2 size={14} />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-onyx-graphite border-onyx-black text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">Edit Menu Item</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Make changes to the menu item here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="name" className="text-sm font-medium text-zinc-300">Name</label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="bg-onyx-black border-white/10 focus-visible:ring-onyx-green"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label htmlFor="price" className="text-sm font-medium text-zinc-300">Price ($)</label>
              <Input 
                id="price" 
                type="number" 
                step="0.01"
                value={price} 
                onChange={(e) => setPrice(e.target.value)}
                className="bg-onyx-black border-white/10 focus-visible:ring-onyx-green"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="category" className="text-sm font-medium text-zinc-300">Category</label>
              <Input 
                id="category" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="bg-onyx-black border-white/10 focus-visible:ring-onyx-green"
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-onyx-black p-3 border border-white/5">
            <div className="space-y-0.5">
              <label className="text-sm font-medium text-zinc-300">Availability</label>
              <p className="text-xs text-zinc-500">Toggle if this item is currently sold out.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("text-[10px] font-bold uppercase", isSoldOut ? "text-red-500" : "text-onyx-green")}>
                {isSoldOut ? "Sold Out" : "Available"}
              </span>
              <Switch 
                checked={!isSoldOut} 
                onCheckedChange={(checked) => setIsSoldOut(!checked)}
                className="data-[state=checked]:bg-onyx-green"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400 hover:text-white">Cancel</Button>
          <Button onClick={handleSave} className="bg-onyx-green text-onyx-black hover:bg-onyx-green/90 font-bold">
            <Save size={16} className="mr-2" />
            Save Changes
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
        "flex w-full items-center gap-3 rounded-xl p-3 transition-all duration-200",
        active 
          ? "bg-onyx-green text-onyx-black shadow-[0_0_20px_rgba(0,255,65,0.2)]" 
          : "text-zinc-400 hover:bg-onyx-graphite hover:text-white"
      )}
    >
      {icon}
      <span className="hidden text-sm font-bold md:block uppercase tracking-wider">{label}</span>
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
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border-none bg-onyx-graphite overflow-hidden relative group">
        {variant === 'preparing' && (
          <div className="absolute top-0 left-0 w-1 h-full bg-onyx-green animate-pulse" />
        )}
        {variant === 'ready' && (
          <div className="absolute top-0 left-0 w-full h-1 bg-onyx-green" />
        )}
        
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="font-mono text-onyx-green border-onyx-green/40 bg-onyx-green/10 px-3 py-1 text-lg">
              #{order.token}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-zinc-300 font-mono">
              <Clock size={12} />
              {timeAgo(order.created_at)}
            </div>
          </div>
          <CardTitle className="mt-4 text-xl flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span>{order.customer_name || 'Guest'}</span>
              <span className="text-sm font-mono text-onyx-green">${(order.total || 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 uppercase tracking-tighter">
              <span>ID: {order.token}</span>
              {order.table_id && (
                <span className="text-onyx-green font-bold">Table: {order.table_id}</span>
              )}
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="pb-4">
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-onyx-black text-[10px] font-bold text-onyx-green">
                    {item.quantity}x
                  </span>
                  <span className="text-white/90">{item.name}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>

        <CardFooter className="pt-2 border-t border-onyx-black/50">
          <Button 
            onClick={onAction}
            className="w-full bg-onyx-green text-onyx-black hover:bg-onyx-green/90 font-bold uppercase tracking-widest h-12 rounded-xl group"
          >
            <span className="flex items-center gap-2">
              {actionIcon}
              {actionLabel}
            </span>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
