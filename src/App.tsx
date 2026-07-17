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
  ArrowRight,
  Users,
  Copy,
  Check,
  Printer
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Receipt } from '@/src/components/Receipt';
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
  const [customerSearch, setCustomerSearch] = useState('');

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [dbCustomers, setDbCustomers] = useState<any[]>([]);

  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const handleCopyValue = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedValue(value);
    toast.success('Phone number copied!');
    setTimeout(() => {
      setCopiedValue(null);
    }, 2000);
  };

  const [frequentDiscountEnabled, setFrequentDiscountEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('scanserve_frequent_discount_enabled');
    return saved === 'true';
  });
  const [minOrdersForDiscount, setMinOrdersForDiscount] = useState<number>(() => {
    const saved = localStorage.getItem('scanserve_min_orders_discount');
    return saved ? parseInt(saved) : 3;
  });
  const [discountPercentage, setDiscountPercentage] = useState<number>(() => {
    const saved = localStorage.getItem('scanserve_discount_percentage');
    return saved ? parseInt(saved) : 10;
  });

  const toggleFrequentDiscount = async () => {
    const newValue = !frequentDiscountEnabled;
    setFrequentDiscountEnabled(newValue);
    
    if (!newValue) {
      toast.promise(
        (async () => {
          // Clear VIP status and active loyal tags in database for ALL records
          const { error } = await supabase
            .from('customers')
            .update({ loyal_vip: false, discount: null })
            .not('phone', 'is', null);
          
          if (error) throw error;

          // Refetch customer table data to update current state
          const { data: updatedCusts, error: listErr } = await supabase
            .from('customers')
            .select('*');
          if (listErr) throw listErr;
          if (updatedCusts) {
            setDbCustomers(updatedCusts);
          }
        })(),
        {
          loading: 'Updating Customer Database...',
          success: 'Loyalty system disabled. Cleared all Loyal VIP profiles and discounts.',
          error: 'Failed to update customer loyalty status in database.'
        }
      );
    } else {
      toast.success('Loyalty system enabled!');
    }
  };

  const computedCustomers = useMemo(() => {
    // Build the list of customers strictly and exclusively from the dbCustomers array,
    // which corresponds directly to the public.customers table schema.
    const sortedList = dbCustomers.map(dc => {
      const phone = dc.phone || '';
      const name = dc.name || 'Unknown';
      const loyal_vip = !!dc.loyal_vip;
      const discount = dc.discount != null ? Number(dc.discount) : null;
      const createdAt = dc.created_at || new Date().toISOString();

      let totalSpent = 0;
      let lastOrder = createdAt;
      let lastTable: string | number | null = null;
      const favoriteItems: { [key: string]: number } = {};
      const tables = new Set<string | number>();

      // Filter orders that belong to this specific customer with normalized phone verification
      const customerOrders = allOrders.filter(order => {
        const orderPhone = order.customer_phone?.trim();
        const orderName = order.customer_name?.trim();
        if (phone && orderPhone) {
          const normPhone = phone.replace(/\D/g, '');
          const normOrderPhone = orderPhone.replace(/\D/g, '');
          if (normPhone && normOrderPhone) {
            return normPhone === normOrderPhone;
          }
          return orderPhone === phone;
        }
        if (name && orderName) {
          return orderName.toLowerCase() === name.toLowerCase();
        }
        return false;
      });

      // Cross-verify the true order count from the orders table (excluding cancelled orders)
      const verifiedOrders = customerOrders.filter(o => o.status !== 'cancelled');
      const orderCount = customerOrders.length > 0 ? verifiedOrders.length : (dc.order_count || 0);

      // Compute statistics based on verified non-cancelled orders
      verifiedOrders.forEach(order => {
        totalSpent += order.total || 0;
        
        if (order.table_id) {
          tables.add(order.table_id);
        }
        
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            if (item.name) {
              favoriteItems[item.name] = (favoriteItems[item.name] || 0) + (item.quantity || 1);
            }
          });
        }
      });

      // Find the most recent order details
      const sortedCustOrders = [...customerOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      if (sortedCustOrders.length > 0) {
        lastOrder = sortedCustOrders[0].created_at;
        const withTable = sortedCustOrders.find(o => o.table_id);
        if (withTable) {
          lastTable = withTable.table_id;
        }
      }

      let topItem = 'None';
      let maxQty = 0;
      Object.entries(favoriteItems).forEach(([item, qty]) => {
        if (qty > maxQty) {
          maxQty = qty;
          topItem = item;
        }
      });

      return {
        name,
        phone,
        orderCount,
        totalSpent,
        lastOrder,
        lastTable,
        loyal_vip,
        discount,
        favoriteItem: topItem,
        tablesList: lastTable ? `Table ${lastTable}` : 'Walk-in'
      };
    }).sort((a, b) => b.orderCount - a.orderCount);

    if (!customerSearch) return sortedList;
    const q = customerSearch.toLowerCase();
    return sortedList.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.phone.toLowerCase().includes(q)
    );
  }, [allOrders, dbCustomers, customerSearch]);
  
  const activeTab = useMemo(() => {
    const path = location.pathname.split('/')[1];
    const validTabs = ['service', 'counter', 'kitchen', 'pickup', 'menu', 'customers'];
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
    localStorage.setItem('scanserve_frequent_discount_enabled', frequentDiscountEnabled.toString());
  }, [frequentDiscountEnabled]);

  useEffect(() => {
    localStorage.setItem('scanserve_min_orders_discount', minOrdersForDiscount.toString());
  }, [minOrdersForDiscount]);

  useEffect(() => {
    localStorage.setItem('scanserve_discount_percentage', discountPercentage.toString());
  }, [discountPercentage]);

  const getOrderDiscountInfo = (order: Order) => {
    if (!order.customer_name) {
      return { isDiscounted: false, discountPercentage, originalTotal: order.total, finalTotal: order.total, orderCount: 0 };
    }
    
    const nameToMatch = order.customer_name.trim().toLowerCase();
    const phoneToMatch = order.customer_phone?.trim();
    if (nameToMatch === '' || nameToMatch === 'guest order') {
      return { isDiscounted: false, discountPercentage, originalTotal: order.total, finalTotal: order.total, orderCount: 0 };
    }

    // Check if customer exists in dbCustomers with loyal_vip = true (using normalized phone matching)
    const dbCust = dbCustomers.find(c => {
      if (phoneToMatch && c.phone) {
        const p1 = phoneToMatch.replace(/\D/g, '');
        const p2 = c.phone.replace(/\D/g, '');
        if (p1 && p2) return p1 === p2;
      }
      return c.name && c.name.trim().toLowerCase() === nameToMatch;
    });

    const isVipInDb = dbCust ? !!dbCust.loyal_vip : false;
    const dbDiscountValue = dbCust?.discount != null ? Number(dbCust.discount) : null;

    // Verify occurrences from orders table using normalized phone matching (excluding cancelled orders)
    const occurrencesCount = allOrders.filter(o => {
      if (o.status === 'cancelled') return false;
      
      const orderPhone = o.customer_phone?.trim();
      const orderName = o.customer_name?.trim();
      if (phoneToMatch && orderPhone) {
        const p1 = phoneToMatch.replace(/\D/g, '');
        const p2 = orderPhone.replace(/\D/g, '');
        if (p1 && p2) {
          return p1 === p2;
        }
        return orderPhone === phoneToMatch;
      }
      if (nameToMatch && orderName) {
        return orderName.toLowerCase() === nameToMatch;
      }
      return false;
    }).length;
    
    if (frequentDiscountEnabled && (isVipInDb || occurrencesCount >= minOrdersForDiscount)) {
      const activeDiscount = dbDiscountValue ?? discountPercentage;
      const factor = (100 - activeDiscount) / 100;
      const finalTotal = order.total * factor;
      return {
        isDiscounted: true,
        discountPercentage: activeDiscount,
        originalTotal: order.total,
        finalTotal: finalTotal,
        orderCount: occurrencesCount
      };
    }
    
    return { isDiscounted: false, discountPercentage, originalTotal: order.total, finalTotal: order.total, orderCount: occurrencesCount };
  };

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

        // Fetch all orders for Customer Database statistics
        const { data: allOrdersData, error: allOrdersError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (!allOrdersError && allOrdersData) {
          setAllOrders(allOrdersData);
        }

        // Try getting dedicated customer records
        try {
          const { data: custData, error: custError } = await supabase
            .from('customers')
            .select('*');
          if (!custError && custData) {
            setDbCustomers(custData);
          }
        } catch (e) {
          console.warn('Dedicated customers table not found, fallback to dynamically computed customer history.');
        }

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
          const newOrder = payload.new as Order;
          setOrders(prev => [...prev, newOrder]);
          setAllOrders(prev => [newOrder, ...prev]);
          playPopSound();
          toast.success(`New Order Received! Token: ${newOrder.token}`);
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
          setAllOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id));
          setAllOrders(prev => prev.filter(o => o.id !== payload.old.id));
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
      const orderToUpdate = orders.find(o => o.id === orderId);
      if (!orderToUpdate) {
        throw new Error('Order not found');
      }

      // 1. Fetch fresh customer data to check for exact up-to-date values, avoiding state mismatch
      const phone = orderToUpdate.customer_phone?.trim();
      const name = orderToUpdate.customer_name?.trim() || 'Guest';

      let isEligible = false;
      let currentDbCount = 0;
      let existingDiscount = discountPercentage;

      if (phone) {
        try {
          const { data: existingCust, error: fetchErr } = await supabase
            .from('customers')
            .select('*')
            .eq('phone', phone)
            .maybeSingle();

          if (!fetchErr && existingCust) {
            currentDbCount = existingCust.order_count || 0;
            isEligible = !!existingCust.loyal_vip;
            if (existingCust.discount != null) {
              existingDiscount = Number(existingCust.discount);
            }
          }
        } catch (err) {
          console.error('Error fetching customer profile:', err);
        }
      }

      // Calculate completed order count as of before this status change, verified from the orders list
      let completedOrdersCount = 0;
      if (phone) {
        const pNormalized = phone.replace(/\D/g, '');
        completedOrdersCount = allOrders.filter(o => {
          if (o.id === orderId) return false;
          if (o.status !== 'completed') return false;
          const oPhone = o.customer_phone?.trim();
          if (oPhone) {
            return oPhone.replace(/\D/g, '') === pNormalized;
          }
          return false;
        }).length;
      } else if (name) {
        completedOrdersCount = allOrders.filter(o => {
          if (o.id === orderId) return false;
          if (o.status !== 'completed') return false;
          return o.customer_name?.trim().toLowerCase() === name.toLowerCase();
        }).length;
      }

      // Calculate state as of after the current order is completed
      const newCount = completedOrdersCount + (newStatus === 'completed' ? 1 : 0);
      
      // Eligibility is met if they are already VIP, or if frequent loyalty is enabled and newCount hits threshold
      const isEligibleNow = frequentDiscountEnabled && (isEligible || newCount >= minOrdersForDiscount);
      const activeDiscountPercentage = (frequentDiscountEnabled && isEligible) ? existingDiscount : discountPercentage;

      // Calculate order discount details
      const discountInfo = getOrderDiscountInfo(orderToUpdate);
      const shouldApplyDiscount = isEligibleNow || discountInfo.isDiscounted;

      const updatePayload: any = { status: newStatus };
      if (newStatus === 'completed' && shouldApplyDiscount) {
        const factor = (100 - activeDiscountPercentage) / 100;
        updatePayload.total = orderToUpdate.total * factor;
      }

      // 2. Perform the Order Update in Supabase
      const { data, error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId)
        .select();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      console.log('Update successful:', data);

      // 3. Handle Customer Database loyalty update
      if (newStatus === 'completed' && phone) {
        try {
          const customerPayload = {
            phone,
            name,
            order_count: newCount,
            loyal_vip: isEligibleNow,
            discount: isEligibleNow ? activeDiscountPercentage : null
          };

          console.log('Upserting customers record:', customerPayload);
          const { error: upsertErr } = await supabase
            .from('customers')
            .upsert(customerPayload);

          if (upsertErr) {
            console.error('Error upserting customer table:', upsertErr);
          } else {
            console.log('Customer table updated successfully:', customerPayload);
            // Fetch updated list of customers to keep UI fully in sync
            const { data: updatedCusts, error: listErr } = await supabase
              .from('customers')
              .select('*');
            if (!listErr && updatedCusts) {
              setDbCustomers(updatedCusts);
            }
          }
        } catch (err) {
          console.error('Exception updating customer loyalty:', err);
        }
      }

      toast.success(
        shouldApplyDiscount && newStatus === 'completed'
          ? `Order status updated to ${newStatus} (${activeDiscountPercentage}% Loyalty Discount applied!)`
          : `Order status updated to ${newStatus}`
      );
      
      // Manual state update
      setOrders(prev => {
        if (newStatus === 'completed' || newStatus === 'cancelled') {
          return prev.filter(o => o.id !== orderId);
        }
        return prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
      });

      setAllOrders(prev => {
        return prev.map(o => {
          if (o.id === orderId) {
            const updatedOrder = { ...o, status: newStatus };
            if (newStatus === 'completed' && discountInfo?.isDiscounted) {
              updatedOrder.total = discountInfo.finalTotal;
            }
            return updatedOrder;
          }
          return o;
        });
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
          <NavItem 
            icon={<Users size={18} strokeWidth={1.5} />} 
            label="Customers" 
            active={activeTab === 'customers'} 
            onClick={() => setActiveTab('customers')}
          />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <header className="flex h-24 items-center justify-between border-b border-white/5 px-10 backdrop-blur-xl sticky top-0 z-10 animate-fade-in">
            <TabsList className="bg-transparent p-0 gap-10">
              <TabsTrigger value="service" className="text-white/30 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-24 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all">Service Rail</TabsTrigger>
              <TabsTrigger value="counter" className="text-white/30 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-24 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all">Counter</TabsTrigger>
              <TabsTrigger value="kitchen" className="text-white/30 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-24 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all">Kitchen</TabsTrigger>
              <TabsTrigger value="pickup" className="text-white/30 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-24 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all">Pickup</TabsTrigger>
              <TabsTrigger value="menu" className="text-white/30 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-24 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all">Menu</TabsTrigger>
              <TabsTrigger value="customers" className="text-white/30 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-24 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all">Customer Database</TabsTrigger>
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
                        discountInfo={getOrderDiscountInfo(order)}
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
                          discountInfo={getOrderDiscountInfo(order)}
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
                        discountInfo={getOrderDiscountInfo(order)}
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
                        discountInfo={getOrderDiscountInfo(order)}
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

            <TabsContent value="customers" className="m-0 h-full flex flex-col gap-10 p-10 outline-none data-[state=inactive]:hidden overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-in">
                <div>
                  <h2 className="text-4xl font-serif tracking-tight">Customer Database</h2>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/20 mt-2 font-bold font-sans">Loyalty & Historical Statistics</p>
                </div>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/40" />
                  <Input 
                    placeholder="Search Customers..." 
                    className="pl-14 bg-[#0A0A0A] border-white/5 rounded-full h-14 text-[10px] font-bold uppercase tracking-[0.2em] focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all font-sans"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Loyalty Discount Option Panel */}
              <div className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-[0_0_30px_rgba(197,160,89,0.02)] animate-fade-in delay-100">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  <div className="space-y-4 lg:max-w-xl">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary">
                        <TrendingUp size={12} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Automatic Checkout Promotion</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-serif tracking-tight text-white mb-2">Loyal Customer Checkout Discounts</h3>
                      <p className="text-xs text-white/40 leading-relaxed font-sans">
                        Encourage repeat visits by automatically applying percentage-based discounts to customers on checkout once they reach a set order threshold.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6 lg:self-end">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-[8px] font-bold uppercase tracking-[0.25em] text-white/30 ml-1 font-sans">Min Orders Needed</label>
                        <Input 
                          type="number"
                          min="1"
                          className="bg-black border-white/5 rounded-full h-12 w-28 text-center text-xs font-bold font-sans"
                          value={minOrdersForDiscount}
                          onChange={(e) => setMinOrdersForDiscount(Math.max(1, parseInt(e.target.value) || 0))}
                          disabled={!frequentDiscountEnabled}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[8px] font-bold uppercase tracking-[0.25em] text-white/30 ml-1 font-sans">Discount Percentage (%)</label>
                        <Input 
                          type="number"
                          min="1"
                          max="100"
                          className="bg-black border-white/5 rounded-full h-12 w-28 text-center text-xs font-bold font-sans text-primary"
                          value={discountPercentage}
                          onChange={(e) => setDiscountPercentage(Math.min(100, Math.max(1, parseInt(e.target.value) || 0)))}
                          disabled={!frequentDiscountEnabled}
                        />
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={toggleFrequentDiscount}
                      className="flex items-center gap-4 bg-black/40 hover:bg-black/60 border border-white/5 rounded-full px-6 py-3 self-center sm:self-auto h-12 mt-auto cursor-pointer select-none transition-all"
                    >
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-[0.2em] font-sans",
                        frequentDiscountEnabled ? "text-primary/90" : "text-white/20"
                      )}>
                        {frequentDiscountEnabled ? "SYSTEM ACTIVE" : "DISABLED"}
                      </span>
                      <Switch 
                        checked={frequentDiscountEnabled} 
                        onCheckedChange={toggleFrequentDiscount}
                        className="data-[state=checked]:bg-primary pointer-events-none"
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Customer List Table */}
              <div className="flex-1 overflow-hidden flex flex-col border border-white/5 bg-[#0A0A0A] rounded-[2.5rem] p-8 md:p-10 shadow-[0_0_40px_rgba(0,0,0,0.3)] animate-fade-in delay-200">
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-white/5 text-[9px] uppercase tracking-[0.3em] text-white/30 font-bold font-sans">
                        <th className="pb-6">Customer Name</th>
                        <th className="pb-6 pl-4">Phone Number</th>
                        <th className="pb-6 text-center">Order Count</th>
                        <th className="pb-6 text-right">Total Spent</th>
                        <th className="pb-6 text-right">Avg Order Value</th>
                        <th className="pb-6 pl-6">Favorite Item</th>
                        <th className="pb-6">Last Table</th>
                        <th className="pb-6 text-right">Last Visit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs font-sans">
                      {computedCustomers.map((customer, idx) => {
                        const qualifies = frequentDiscountEnabled && (customer.loyal_vip || customer.orderCount >= minOrdersForDiscount);
                        const avgValue = customer.orderCount > 0 ? customer.totalSpent / customer.orderCount : 0;
                        const formattedDate = new Date(customer.lastOrder).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        });

                        return (
                          <motion.tr 
                            key={customer.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: idx * 0.03 }}
                            className="group hover:bg-white/[0.01] transition-colors"
                          >
                            <td className="py-5 font-medium text-white/95">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-serif">{customer.name}</span>
                                {qualifies && (
                                  <span className="text-[7px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                                    Loyal VIP {customer.discount ? `(${customer.discount}%)` : ''}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-5 pl-4 font-mono text-white/70">
                              {customer.phone ? (
                                <div className="flex items-center gap-2 group/copy">
                                  <span>{customer.phone}</span>
                                  <button
                                    onClick={() => handleCopyValue(customer.phone)}
                                    className="p-1 px-1.5 text-white/30 hover:text-primary hover:bg-white/5 rounded-md cursor-pointer transition-all flex items-center gap-1 active:scale-95"
                                    title="Copy Phone Number"
                                  >
                                    {copiedValue === customer.phone ? (
                                      <Check size={11} className="text-emerald-400" />
                                    ) : (
                                      <Copy size={11} className="opacity-40 group-hover/copy:opacity-100 transition-opacity" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-white/20 italic">No phone</span>
                              )}
                            </td>
                            <td className="py-5 text-center">
                              <span className="inline-flex items-center justify-center h-7 w-12 rounded-full bg-white/5 font-mono text-white/80 font-semibold group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                {customer.orderCount}
                              </span>
                            </td>
                            <td className="py-5 text-right font-mono text-white/80 font-medium">
                              ₹{customer.totalSpent.toFixed(2)}
                            </td>
                            <td className="py-5 text-right font-mono text-white/60">
                              ₹{avgValue.toFixed(2)}
                            </td>
                            <td className="py-5 pl-6 text-white/60">
                              <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] uppercase font-bold tracking-wider text-white/55">
                                {customer.favoriteItem}
                              </span>
                            </td>
                            <td className="py-5 text-white/40 max-w-[150px] truncate">
                              {customer.tablesList}
                            </td>
                            <td className="py-5 text-right text-white/40 font-mono">
                              {formattedDate}
                            </td>
                          </motion.tr>
                        );
                      })}

                      {computedCustomers.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-20 text-center">
                            <Users size={48} strokeWidth={1} className="mx-auto mb-6 text-primary/10" />
                            <p className="text-[10px] uppercase tracking-[0.4em] text-white/15 font-bold">No registered customers found</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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
    const parsedPrice = parseFloat(price) || 0;
    const parsedDiscount = discountPrice ? parseFloat(discountPrice) : null;

    if (parsedDiscount !== null && parsedDiscount >= parsedPrice) {
      toast.error('Discount price must be lower than base price');
      return;
    }

    onSave({
      name,
      price: parsedPrice,
      discount_price: parsedDiscount,
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
            <button 
              type="button"
              onClick={() => setIsSoldOut(!isSoldOut)}
              className="flex items-center gap-4 cursor-pointer select-none"
            >
              <span className={cn("text-[8px] font-bold uppercase tracking-[0.2em]", isSoldOut ? "text-red-500/40" : "text-primary/40")}>
                {isSoldOut ? "Sold Out" : "Active"}
              </span>
              <Switch 
                checked={!isSoldOut} 
                onCheckedChange={(checked) => setIsSoldOut(!checked)}
                className="data-[state=checked]:bg-primary pointer-events-none"
              />
            </button>
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
  index = 0,
  discountInfo
}: { 
  order: Order, 
  actionLabel: string, 
  actionIcon: React.ReactNode, 
  onAction: () => void | Promise<void>,
  variant?: 'pending' | 'preparing' | 'ready',
  index?: number,
  key?: string | number,
  discountInfo?: {
    isDiscounted: boolean;
    discountPercentage: number;
    originalTotal: number;
    finalTotal: number;
    orderCount: number;
  }
}) {
  const [isOldReady, setIsOldReady] = useState(false);
  const [receiptGstin, setReceiptGstin] = useState(() => {
    return localStorage.getItem('scanserve_default_gstin') || '';
  });
  const [receiptTaxRate, setReceiptTaxRate] = useState(() => {
    const saved = localStorage.getItem('scanserve_default_tax_rate');
    return saved ? Number(saved) : 5;
  });

  useEffect(() => {
    localStorage.setItem('scanserve_default_gstin', receiptGstin);
  }, [receiptGstin]);

  useEffect(() => {
    localStorage.setItem('scanserve_default_tax_rate', receiptTaxRate.toString());
  }, [receiptTaxRate]);

  const printRef = React.useRef<HTMLDivElement>(null);
  const handlePrintReceipt = useReactToPrint({
    contentRef: printRef,
  });

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
                  {discountInfo && discountInfo.isDiscounted ? (
                    <div className="flex flex-col items-end">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs text-white/20 line-through">₹{(discountInfo.originalTotal || 0).toFixed(2)}</span>
                        <span className="text-2xl font-serif text-primary">₹{(discountInfo.finalTotal || 0).toFixed(2)}</span>
                      </div>
                      <span className="text-[8px] font-bold uppercase text-green-500 tracking-wider mt-1">
                        {discountInfo.discountPercentage}% Loyalty Discount ({discountInfo.orderCount} Orders)
                      </span>
                    </div>
                  ) : (
                    <span className="text-2xl font-serif text-primary">₹{(order.total || 0).toFixed(2)}</span>
                  )}
                </div>
                <div className="flex items-center">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline"
                        className="border border-white/10 text-white/60 hover:text-primary hover:border-primary/40 rounded-full px-6 h-12 text-[10px] uppercase tracking-[0.3em] font-bold transition-all duration-500 hover:scale-105 mr-3"
                      >
                        <span className="flex items-center gap-3">
                          <Printer size={14} strokeWidth={1.5} />
                          Receipt
                        </span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#0A0A0A] border border-white/5 text-white max-w-[450px] w-full rounded-[2rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
                      <DialogHeader>
                        <DialogTitle className="text-3xl font-serif tracking-tight text-white">Receipt Terminal</DialogTitle>
                        <DialogDescription className="text-[9px] uppercase tracking-[0.3em] text-white/20 font-bold mt-2">
                          Print thermal or invoice copy for Token {order.token}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-6 my-6 border-t border-b border-white/5 py-6 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="grid gap-3">
                          <label className="text-[9px] uppercase tracking-[0.25em] text-white/40 ml-1 font-bold">GSTIN (India Compliance)</label>
                          <Input 
                            placeholder="e.g. 27AAAAA1111A1Z1 (Leave empty for unregistered)" 
                            value={receiptGstin} 
                            onChange={(e) => setReceiptGstin(e.target.value)}
                            className="bg-black border-white/5 rounded-full h-12 text-[10px] font-bold uppercase tracking-[0.2em] focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all placeholder:text-white/10 text-white"
                          />
                        </div>
                        
                        {receiptGstin && (
                          <div className="grid gap-3 animate-fade-in">
                            <div className="flex justify-between items-center px-1">
                              <label className="text-[9px] uppercase tracking-[0.25em] text-white/40 font-bold">GST Tax Rate</label>
                              <span className="text-[10px] font-mono font-bold text-primary">{receiptTaxRate}% (CGST {receiptTaxRate/2}% + SGST {receiptTaxRate/2}%)</span>
                            </div>
                            <div className="flex items-center bg-black rounded-full h-12 px-6 border border-white/5">
                              <input 
                                type="range" 
                                min="0" 
                                max="28" 
                                step="1"
                                value={receiptTaxRate} 
                                onChange={(e) => setReceiptTaxRate(Number(e.target.value))}
                                className="w-full accent-primary bg-white/10 h-1 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-3">
                          <span className="text-[9px] uppercase tracking-[0.25em] text-white/40 ml-1 font-bold">Live Receipt Preview</span>
                          <div className="border border-white/5 rounded-[1.5rem] bg-zinc-100 p-4 max-h-[300px] overflow-y-auto custom-scrollbar flex justify-center shadow-inner">
                            <div className="receipt-print-wrapper" ref={printRef}>
                              <Receipt 
                                orderId={order.id}
                                table={order.table_id?.toString() || 'Walk-in'}
                                items={order.items}
                                subtotal={discountInfo?.isDiscounted ? discountInfo.finalTotal : order.total}
                                gstin={receiptGstin}
                                taxRate={receiptTaxRate}
                                token={order.token}
                                customerName={order.customer_name}
                                customerPhone={order.customer_phone}
                                createdAt={order.created_at}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <DialogFooter className="gap-3 mt-auto">
                        <Button 
                          onClick={handlePrintReceipt}
                          className="bg-primary text-black hover:bg-primary/90 rounded-full px-8 h-14 text-[10px] uppercase tracking-[0.3em] font-bold shadow-[0_0_20px_rgba(197,160,89,0.2)] w-full"
                        >
                          <Printer size={16} className="mr-3" strokeWidth={1.5} />
                          Print Thermal Receipt
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

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
        </div>
      </Card>
    </motion.div>
  );
}
