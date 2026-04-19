/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  X,
  TrendingUp,
  Timer,
  Bell,
  Lock,
  ArrowRight
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
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchToken, setSearchToken] = useState('');
  const [menuSearch, setMenuSearch] = useState('');
  
  const activeTab = useMemo(() => {
    const path = location.pathname.split('/')[1];
    const validTabs = ['service', 'counter', 'kitchen', 'pickup', 'menu'];
    return validTabs.includes(path) ? path : 'service';
  }, [location.pathname]);

  const setActiveTab = (tab: string) => {
    navigate(`/${tab}`);
  };

  const [stats, setStats] = useState({ preparedToday: 0, avgTime: '12m' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '') {
      navigate('/service', { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    const checkAuth = () => {
      const authData = localStorage.getItem('scanserve_staff_auth');
      if (authData) {
        try {
          const { expiry } = JSON.parse(authData);
          if (new Date().getTime() < expiry) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('scanserve_staff_auth');
          }
        } catch (e) {
          localStorage.removeItem('scanserve_staff_auth');
        }
      }
    };
    checkAuth();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default password for staff access
    if (password === 'ScanServe2026') {
      // Calculate expiry: End of the day in IST
      // IST is UTC+5:30
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istNow = new Date(now.getTime() + istOffset);
      
      const istEndOfDay = new Date(istNow);
      istEndOfDay.setHours(23, 59, 59, 999);
      
      const expiryUtc = istEndOfDay.getTime() - istOffset;
      
      localStorage.setItem('scanserve_staff_auth', JSON.stringify({
        authenticated: true,
        expiry: expiryUtc
      }));
      setIsAuthenticated(true);
      setAuthError(false);
      toast.success('Access Granted');
    } else {
      setAuthError(true);
      toast.error('Invalid Access Password');
    }
  };

  const playPopSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    audio.volume = 0.8;
    audio.play().catch(e => console.log('Audio play failed:', e));
  };

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
          .order('created_at', { ascending: true });

        if (ordersError) throw ordersError;
        setOrders(ordersData || []);

        // Fetch stats for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { count, error: statsError } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed')
          .gte('created_at', today.toISOString());

        if (!statsError) {
          setStats(prev => ({ ...prev, preparedToday: count || 0 }));
        }

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
          setOrders(prev => [...prev, payload.new as Order]);
          playPopSound();
          toast.success(`New Order Received! Token: ${(payload.new as Order).token}`);
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Order;
          if (updated.status === 'completed') {
            setStats(prev => ({ ...prev, preparedToday: prev.preparedToday + 1 }));
          }
          setOrders(prev => {
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
    let base = orders;
    if (searchToken) {
      base = base.filter(o => o.token.toLowerCase().includes(searchToken.toLowerCase()));
    }
    return base;
  }, [orders, searchToken]);

  const serviceRailOrders = useMemo(() => {
    return filteredOrders.filter(o => o.status === 'pending');
  }, [filteredOrders]);

  const filteredMenuItems = useMemo(() => {
    if (!menuSearch) return menuItems;
    const query = menuSearch.toLowerCase();
    return menuItems.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.category.toLowerCase().includes(query)
    );
  }, [menuItems, menuSearch]);

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="flex flex-col items-center gap-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-[#0A0A0A] shadow-[0_0_30px_rgba(197,160,89,0.1)]">
              <Lock size={32} strokeWidth={1.5} className="text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-serif tracking-tight mb-2">Staff <span className="italic opacity-60 text-primary">Access</span></h1>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/20 font-bold">Secure Dashboard Entry</p>
            </div>
            
            <form onSubmit={handleLogin} className="w-full space-y-6 mt-4">
              <div className="relative group">
                <Input 
                  type="password"
                  placeholder="Enter Access Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    "bg-[#0A0A0A] border-white/5 rounded-full h-16 text-center text-[12px] font-bold uppercase tracking-[0.3em] focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all",
                    authError && "border-red-500/50 focus-visible:border-red-500/50"
                  )}
                  autoFocus
                />
              </div>
              <Button 
                type="submit"
                className="w-full bg-primary text-black hover:bg-primary/90 rounded-full h-16 text-[11px] uppercase tracking-[0.4em] font-bold shadow-[0_0_20px_rgba(197,160,89,0.2)] group"
              >
                Authenticate
                <ArrowRight size={16} className="ml-3 transition-transform group-hover:translate-x-1" />
              </Button>
            </form>
            
            <p className="text-[9px] text-white/10 uppercase tracking-[0.2em] font-bold mt-8">
              Authorized Personnel Only
            </p>
          </div>
        </motion.div>
        <Toaster position="top-center" theme="dark" richColors />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-6">
          <RefreshCcw className="h-10 w-10 animate-spin text-primary opacity-20" />
          <p className="font-serif text-2xl tracking-tight text-primary">Scan<span className="italic opacity-60">Serve</span></p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-black font-sans text-white selection:bg-primary selection:text-black">
      <Toaster position="top-right" theme="dark" richColors />
      
      {/* Sidebar */}
      <aside className="flex w-20 flex-col items-center border-r border-white/5 bg-[#0A0A0A] py-10 md:w-64">
        <div className="mb-16 flex items-center gap-3 px-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-transparent shadow-[0_0_15px_rgba(197,160,89,0.1)]">
            <Coffee size={20} strokeWidth={1.5} className="text-primary" />
          </div>
          <h1 className="hidden text-2xl font-serif tracking-tight md:block">Scan<span className="italic opacity-60 text-primary">Serve</span></h1>
        </div>

        <nav className="flex w-full flex-1 flex-col gap-2 px-4">
          <NavItem 
            icon={<RefreshCcw size={18} strokeWidth={1.5} />} 
            label="Service Rail" 
            active={activeTab === 'service'} 
            onClick={() => setActiveTab('service')}
          />
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
          <header className="flex h-24 items-center justify-between border-b border-white/5 px-10 backdrop-blur-xl sticky top-0 z-10">
            <TabsList className="bg-transparent p-0 gap-10">
              <TabsTrigger value="service" className="text-white/30 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-24 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all">Service Rail</TabsTrigger>
              <TabsTrigger value="counter" className="text-white/30 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-24 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all">Counter</TabsTrigger>
              <TabsTrigger value="kitchen" className="text-white/30 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-24 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all">Kitchen</TabsTrigger>
              <TabsTrigger value="pickup" className="text-white/30 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-24 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all">Pickup</TabsTrigger>
              <TabsTrigger value="menu" className="text-white/30 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-24 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all">Menu</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-12">
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/20">Prepared Today</span>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={12} className="text-primary/60" />
                    <span className="text-xl font-serif text-primary">{stats.preparedToday}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end border-l border-white/5 pl-8">
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/20">Avg Crafting</span>
                  <div className="flex items-center gap-2">
                    <Timer size={12} className="text-primary/60" />
                    <span className="text-xl font-serif text-primary">{stats.avgTime}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-full border border-primary/20 px-5 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-primary/80">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(197,160,89,0.8)]" />
                SYSTEM ONLINE
              </div>
            </div>
          </header>

          <div className="flex-1 min-h-0">
            <TabsContent value="counter" className="m-0 h-full flex flex-col gap-10 p-10 outline-none data-[state=inactive]:hidden">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-serif tracking-tight">Counter</h2>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/20 mt-2 font-bold">Incoming orders & Verification</p>
                </div>
                <div className="relative w-80">
                  <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/40" />
                  <Input 
                    placeholder="Search Token ID..." 
                    className="pl-14 bg-[#0A0A0A] border-white/5 rounded-full h-14 text-[10px] font-bold uppercase tracking-[0.2em] focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all"
                    value={searchToken}
                    onChange={(e) => setSearchToken(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex flex-col gap-8 pb-10 max-w-4xl mx-auto">
                  <AnimatePresence mode="popLayout">
                    {serviceRailOrders.map((order, index) => (
                      <OrderCard 
                        key={order.id} 
                        order={order} 
                        actionLabel="Start Crafting" 
                        actionIcon={<CheckCircle2 size={14} strokeWidth={1.5} />}
                        onAction={() => updateOrderStatus(order.id, 'preparing')}
                        variant="pending"
                        index={index}
                      />
                    ))}
                  </AnimatePresence>
                  {serviceRailOrders.length === 0 && (
                    <div className="flex h-80 flex-col items-center justify-center rounded-[2rem] border border-white/5 bg-[#0A0A0A]">
                      <Clock size={48} strokeWidth={1} className="mb-6 text-primary/20" />
                      <p className="text-[10px] uppercase tracking-[0.4em] text-white/10 font-bold">No new orders</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="service" className="m-0 h-full flex flex-col gap-10 p-10 outline-none data-[state=inactive]:hidden">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-serif tracking-tight">Service Rail</h2>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/20 mt-2 font-bold">Full Order Lifecycle</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex flex-col gap-8 pb-10 max-w-4xl mx-auto">
                  <AnimatePresence mode="popLayout">
                    {filteredOrders.map((order, index) => {
                      let actionLabel = "Start Crafting";
                      let nextStatus: OrderStatus = "preparing";
                      
                      if (order.status === 'preparing') {
                        actionLabel = "Mark Ready";
                        nextStatus = "ready";
                      } else if (order.status === 'ready') {
                        actionLabel = "Complete & Paid";
                        nextStatus = "completed";
                      }

                      return (
                        <OrderCard 
                          key={order.id} 
                          order={order} 
                          actionLabel={actionLabel} 
                          actionIcon={<CheckCircle2 size={14} strokeWidth={1.5} />}
                          onAction={() => updateOrderStatus(order.id, nextStatus)}
                          variant={order.status as any}
                          index={index}
                        />
                      );
                    })}
                  </AnimatePresence>
                  {filteredOrders.length === 0 && (
                    <div className="flex h-80 flex-col items-center justify-center rounded-[2rem] border border-white/5 bg-[#0A0A0A]">
                      <Clock size={48} strokeWidth={1} className="mb-6 text-primary/20" />
                      <p className="text-[10px] uppercase tracking-[0.4em] text-white/10 font-bold">No active orders</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="kitchen" className="m-0 h-full flex flex-col gap-10 p-10 outline-none data-[state=inactive]:hidden">
              <div>
                <h2 className="text-4xl font-serif tracking-tight">Kitchen</h2>
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/20 mt-2 font-bold">Active Preparations</p>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex flex-col gap-8 pb-10 max-w-4xl mx-auto">
                  <AnimatePresence mode="popLayout">
                    {orders.filter(o => o.status === 'preparing').map((order, index) => (
                      <OrderCard 
                        key={order.id} 
                        order={order} 
                        actionLabel="Mark Ready" 
                        actionIcon={<CheckCircle2 size={14} strokeWidth={1.5} />}
                        onAction={() => updateOrderStatus(order.id, 'ready')}
                        variant="preparing"
                        index={index}
                      />
                    ))}
                  </AnimatePresence>
                  {orders.filter(o => o.status === 'preparing').length === 0 && (
                    <div className="flex h-80 flex-col items-center justify-center rounded-[2rem] border border-white/5 bg-[#0A0A0A]">
                      <ChefHat size={48} strokeWidth={1} className="mb-6 text-primary/20" />
                      <p className="text-[10px] uppercase tracking-[0.4em] text-white/10 font-bold">Kitchen is clear</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pickup" className="m-0 h-full flex flex-col gap-10 p-10 outline-none data-[state=inactive]:hidden">
              <div>
                <h2 className="text-4xl font-serif tracking-tight">Pickup</h2>
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/20 mt-2 font-bold">Awaiting Collection</p>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex flex-col gap-8 pb-10 max-w-4xl mx-auto">
                  <AnimatePresence mode="popLayout">
                    {orders.filter(o => o.status === 'ready').map((order, index) => (
                      <OrderCard 
                        key={order.id} 
                        order={order} 
                        actionLabel="Complete & Paid" 
                        actionIcon={<PackageCheck size={14} strokeWidth={1.5} />}
                        onAction={() => updateOrderStatus(order.id, 'completed')}
                        variant="ready"
                        index={index}
                      />
                    ))}
                  </AnimatePresence>
                  {orders.filter(o => o.status === 'ready').length === 0 && (
                    <div className="flex h-80 flex-col items-center justify-center rounded-[2rem] border border-white/5 bg-[#0A0A0A]">
                      <PackageCheck size={48} strokeWidth={1} className="mb-6 text-primary/20" />
                      <p className="text-[10px] uppercase tracking-[0.4em] text-white/10 font-bold">No orders waiting</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="menu" className="m-0 h-full flex flex-col gap-10 p-10 outline-none data-[state=inactive]:hidden">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-serif tracking-tight">Menu</h2>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/20 mt-2 font-bold">Inventory & Availability</p>
                </div>
                <div className="relative w-80">
                  <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/40" />
                  <Input 
                    placeholder="Search Menu..." 
                    className="pl-14 bg-[#0A0A0A] border-white/5 rounded-full h-14 text-[10px] font-bold uppercase tracking-[0.2em] focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all"
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3 pb-10">
                  {filteredMenuItems.map((item) => (
                    <Card key={item.id} className="relative bg-[#0A0A0A] border border-white/5 rounded-[2rem] overflow-hidden group hover:border-primary/30 transition-all duration-500 hover:shadow-[0_0_30px_rgba(197,160,89,0.03)]">
                      <div className="flex items-stretch p-8 gap-8">
                        <div className="h-24 w-24 flex-shrink-0 rounded-full bg-black flex items-center justify-center overflow-hidden border border-white/5 group-hover:border-primary/20 transition-all duration-700 self-center">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                          ) : (
                            <Coffee className="text-primary/20" size={28} strokeWidth={1} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h4 className="text-lg font-serif tracking-tight text-white/90 group-hover:text-primary transition-colors">{item.name}</h4>
                          <p className="text-[9px] text-white/20 uppercase tracking-[0.2em] mt-2 font-bold">{item.category}</p>
                          <div className="flex items-baseline gap-2 mt-3">
                            {item.discount_price && item.discount_price > 0 ? (
                              <>
                                <p className="text-sm font-medium text-primary tracking-tight">₹{item.discount_price.toFixed(2)}</p>
                                <p className="text-[10px] text-white/20 line-through tracking-tight">₹{item.price.toFixed(2)}</p>
                              </>
                            ) : (
                              <p className="text-sm font-medium text-primary tracking-tight">₹{(item.price || 0).toFixed(2)}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-between h-full">
                          <div className="flex flex-col items-end gap-2">
                            <EditMenuItemDialog item={item} onSave={(updates) => updateMenuItem(item.id, updates)} />
                            {item.discount_price && item.discount_price > 0 && (
                              <span className="text-[7px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                Discount Active
                              </span>
                            )}
                          </div>
                          <span className={cn(
                            "text-[8px] font-bold uppercase tracking-[0.25em] px-3 py-1 rounded-full border mt-auto",
                            item.is_sold_out 
                              ? "text-red-500/60 border-red-500/10 bg-red-500/5" 
                              : "text-primary/80 border-primary/10 bg-primary/5"
                          )}>
                            {item.is_sold_out ? "Sold Out" : "Active"}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {filteredMenuItems.length === 0 && (
                    <div className="col-span-full flex h-80 flex-col items-center justify-center rounded-[2rem] border border-white/5 bg-[#0A0A0A]">
                      <Search size={48} strokeWidth={1} className="mb-6 text-primary/20" />
                      <p className="text-[10px] uppercase tracking-[0.4em] text-white/10 font-bold">No items match your search</p>
                    </div>
                  )}
                </div>
              </div>
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
  const [discountPrice, setDiscountPrice] = useState(item.discount_price?.toString() || '');
  const [category, setCategory] = useState(item.category);
  const [isSoldOut, setIsSoldOut] = useState(item.is_sold_out);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    onSave({
      name,
      price: parseFloat(price) || 0,
      discount_price: discountPrice ? parseFloat(discountPrice) : null,
      category,
      is_sold_out: isSoldOut
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="h-10 w-10 flex items-center justify-center rounded-full border border-white/5 text-white/20 hover:text-primary hover:border-primary/30 transition-all duration-500 hover:bg-primary/5">
          <Edit2 size={14} strokeWidth={1.5} />
        </button>
      </DialogTrigger>
      <DialogContent className="bg-[#0A0A0A] border-white/5 text-white sm:max-w-[450px] rounded-[2rem] p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <DialogHeader>
          <DialogTitle className="text-3xl font-serif tracking-tight">Edit Item</DialogTitle>
          <DialogDescription className="text-[9px] uppercase tracking-[0.3em] text-white/20 font-bold mt-2">
            Modify menu item specifications
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-8 py-8">
          <div className="grid gap-3">
            <label htmlFor="name" className="text-[9px] uppercase tracking-[0.25em] text-white/40 ml-1 font-bold">Item Name</label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="bg-black border-white/5 rounded-full h-14 text-[10px] font-bold uppercase tracking-[0.2em] focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="grid gap-3">
              <label htmlFor="price" className="text-[9px] uppercase tracking-[0.25em] text-white/40 ml-1 font-bold">Base Price (₹)</label>
              <Input 
                id="price" 
                type="number" 
                step="0.01"
                value={price} 
                onChange={(e) => setPrice(e.target.value)}
                className="bg-black border-white/5 rounded-full h-14 text-[10px] font-bold uppercase tracking-[0.2em] focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all"
              />
            </div>
            <div className="grid gap-3">
              <label htmlFor="discount" className="text-[9px] uppercase tracking-[0.25em] text-white/40 ml-1 font-bold">Discount Price (₹)</label>
              <Input 
                id="discount" 
                type="number" 
                step="0.01"
                placeholder="Optional"
                value={discountPrice} 
                onChange={(e) => setDiscountPrice(e.target.value)}
                className="bg-black border-white/5 rounded-full h-14 text-[10px] font-bold uppercase tracking-[0.2em] focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all"
              />
            </div>
          </div>
          <div className="grid gap-3">
            <label htmlFor="category" className="text-[9px] uppercase tracking-[0.25em] text-white/40 ml-1 font-bold">Category</label>
            <Input 
              id="category" 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="bg-black border-white/5 rounded-full h-14 text-[10px] font-bold uppercase tracking-[0.2em] focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all"
            />
          </div>
          <div className="flex items-center justify-between rounded-[1.5rem] bg-black p-6 border border-white/5">
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-[0.2em] text-white/60 font-bold">Availability</label>
              <p className="text-[8px] text-white/20 uppercase tracking-[0.2em] font-bold">Toggle sold out status</p>
            </div>
            <div className="flex items-center gap-4">
              <span className={cn("text-[8px] font-bold uppercase tracking-[0.2em]", isSoldOut ? "text-red-500/40" : "text-primary/40")}>
                {isSoldOut ? "Sold Out" : "Active"}
              </span>
              <Switch 
                checked={!isSoldOut} 
                onCheckedChange={(checked) => setIsSoldOut(!checked)}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-4">
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-[9px] uppercase tracking-[0.3em] text-white/20 hover:text-white hover:bg-transparent font-bold">Cancel</Button>
          <Button onClick={handleSave} className="bg-primary text-black hover:bg-primary/90 rounded-full px-10 h-14 text-[10px] uppercase tracking-[0.3em] font-bold shadow-[0_0_20px_rgba(197,160,89,0.2)]">
            <Save size={16} className="mr-3" strokeWidth={1.5} />
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
        "flex w-full items-center gap-4 rounded-full px-6 py-4 transition-all duration-500 group",
        active 
          ? "bg-primary text-black shadow-[0_0_30px_rgba(197,160,89,0.2)]" 
          : "text-white/20 hover:text-primary hover:bg-primary/5"
      )}
    >
      <span className={cn("transition-transform duration-500 group-hover:scale-110", active ? "text-black" : "text-primary/60 group-hover:text-primary")}>
        {icon}
      </span>
      <span className="hidden text-[10px] font-bold md:block uppercase tracking-[0.25em]">{label}</span>
    </button>
  );
}

function OrderCard({ 
  order, 
  actionLabel, 
  actionIcon, 
  onAction,
  variant = 'pending',
  index = 0
}: { 
  order: Order, 
  actionLabel: string, 
  actionIcon: React.ReactNode, 
  onAction: () => void | Promise<void>,
  variant?: 'pending' | 'preparing' | 'ready',
  index?: number,
  key?: string | number
}) {
  const [isOldReady, setIsOldReady] = useState(false);

  useEffect(() => {
    if (variant !== 'ready') return;
    
    const checkAge = () => {
      const ageInMinutes = (new Date().getTime() - new Date(order.created_at).getTime()) / (1000 * 60);
      setIsOldReady(ageInMinutes > 5);
    };

    checkAge();
    const interval = setInterval(checkAge, 30000);
    return () => clearInterval(interval);
  }, [variant, order.created_at]);

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1] 
      }}
      className="w-full"
    >
      <Card className={cn(
        "border border-white/5 bg-[#0A0A0A] overflow-hidden relative group transition-all duration-700 rounded-[2.5rem]",
        variant === 'pending' && "animate-pulse-subtle",
        isOldReady ? "border-primary/40 shadow-[0_0_50px_rgba(197,160,89,0.15)]" : "hover:border-primary/30 hover:shadow-[0_0_40px_rgba(197,160,89,0.05)]"
      )}>
        <div className="flex flex-col md:flex-row">
          {/* Token Section - Most Prominent */}
          <div className="flex flex-col items-center justify-center bg-black/40 p-8 border-b md:border-b-0 md:border-r border-white/5 min-w-[200px]">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20 mb-2">Token</span>
            <span className="text-5xl font-serif text-primary tracking-tighter">{order.token}</span>
            {order.table_id && (
              <div className="mt-4 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Table {order.table_id}
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="flex-1 p-8 flex flex-col justify-between">
            <div className="flex items-start justify-between mb-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "h-2 w-2 rounded-full",
                    variant === 'pending' ? "bg-blue-500" : variant === 'preparing' ? "bg-amber-500" : "bg-green-500"
                  )} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">{variant}</span>
                </div>
                <span className="text-xl font-serif text-white/90">{order.customer_name || 'Guest Order'}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-white/20 font-bold uppercase tracking-[0.2em]">
                <Clock size={12} strokeWidth={2} className="text-primary/40" />
                {timeAgo(order.created_at)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 text-xs group/item">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-primary/10 bg-primary/5 text-[9px] font-bold text-primary/60">
                      {item.quantity}
                    </span>
                    <span className="text-white/60 group-hover/item:text-white transition-colors tracking-tight">{item.name}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-end gap-4">
                <div className="text-right">
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/20 block mb-1">Total Amount</span>
                  <span className="text-2xl font-serif text-primary">₹{(order.total || 0).toFixed(2)}</span>
                </div>
                <Button 
                  onClick={onAction}
                  className="bg-primary text-black hover:bg-primary/90 rounded-full px-8 h-12 text-[10px] uppercase tracking-[0.3em] font-bold shadow-[0_0_20px_rgba(197,160,89,0.2)] transition-all duration-500 hover:scale-105"
                >
                  <span className="flex items-center gap-3">
                    {actionIcon}
                    {actionLabel}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
