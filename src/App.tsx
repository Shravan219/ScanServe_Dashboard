/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';
import { Order, MenuItem, OrderStatus, normalizeOrder, normalizeOrderItems } from '@/src/types';
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
  Printer,
  Utensils,
  Globe,
  Shield,
  ShieldCheck,
  KeyRound,
  FileText
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Receipt } from '@/src/components/Receipt';
import { CaptainDashboard } from '@/src/components/captain/CaptainDashboard';
import { OnlineOrdersView, getOrderPlatform } from '@/src/components/OnlineOrdersView';
import { InvoicesView } from '@/src/components/invoices/InvoicesView';
import { soundService } from '@/src/lib/sound';
import { verifyStaffPassword } from '@/src/lib/authService';
import { syncOrderStatusToDyno } from '@/src/lib/orderSync';
import { dispatchOrderStatus } from '@/lib/dispatch-status';
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

const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  coffee: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80",
  espresso: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=400&q=80",
  latte: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=400&q=80",
  beverage: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80",
  tea: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80",
  bakery: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
  dessert: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80",
  pastry: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80",
  sandwich: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80",
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80",
  pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80",
  pasta: "https://images.unsplash.com/photo-1621996346565-e3d5d6281288?auto=format&fit=crop&w=400&q=80",
  starter: "https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=400&q=80",
  food: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80",
};

function MenuItemImage({ src, name, category }: { src?: string; name: string; category?: string }) {
  const fallbackUrl = useMemo(() => {
    const catLower = (category || '').toLowerCase();
    const nameLower = (name || '').toLowerCase();
    for (const [key, url] of Object.entries(DEFAULT_CATEGORY_IMAGES)) {
      if (catLower.includes(key) || nameLower.includes(key)) {
        return url;
      }
    }
    return DEFAULT_CATEGORY_IMAGES.food;
  }, [category, name]);

  const initialUrl = (src && src.trim() && src.trim().startsWith('http')) ? src.trim() : fallbackUrl;
  const [imgSrc, setImgSrc] = useState<string>(initialUrl);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const validSrc = (src && src.trim() && src.trim().startsWith('http')) ? src.trim() : fallbackUrl;
    setImgSrc(validSrc);
    setHasError(false);
  }, [src, fallbackUrl]);

  return (
    <img 
      src={hasError ? fallbackUrl : imgSrc} 
      alt={name} 
      loading="lazy"
      decoding="async"
      onError={() => {
        if (!hasError) {
          setHasError(true);
          setImgSrc(fallbackUrl);
        }
      }}
      className="h-full w-full object-cover opacity-85 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" 
      referrerPolicy="no-referrer" 
    />
  );
}

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
    const saved = localStorage.getItem('vyoma_frequent_discount_enabled');
    return saved === 'true';
  });
  const [minOrdersForDiscount, setMinOrdersForDiscount] = useState<number>(() => {
    const saved = localStorage.getItem('vyoma_min_orders_discount');
    return saved ? parseInt(saved) : 3;
  });
  const [discountPercentage, setDiscountPercentage] = useState<number>(() => {
    const saved = localStorage.getItem('vyoma_discount_percentage');
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
    // Single-pass Map data structure for high-performance O(N + M) aggregation
    const customerMap = new Map<string, {
      name: string;
      phone: string;
      orderCount: number;
      totalSpent: number;
      lastOrder: string;
      lastTable: string | number | null;
      loyal_vip: boolean;
      discount: number | null;
      favoriteItems: Record<string, number>;
    }>();

    // 1. Populate from dedicated dbCustomers records
    dbCustomers.forEach(dc => {
      const rawPhone = (dc.phone || '').trim();
      const rawName = (dc.name || 'Guest').trim();
      const normPhone = rawPhone.replace(/\D/g, '') || rawPhone;
      const key = normPhone || rawName.toLowerCase();
      const isVip = !!dc.loyal_vip;

      if (key) {
        customerMap.set(key, {
          name: rawName,
          phone: rawPhone,
          orderCount: dc.order_count || 0,
          totalSpent: 0,
          lastOrder: dc.created_at || new Date().toISOString(),
          lastTable: null,
          loyal_vip: isVip,
          discount: isVip ? discountPercentage : (dc.discount != null ? Number(dc.discount) : null),
          favoriteItems: {},
        });
      }
    });

    // 2. Scan allOrders in a single pass to aggregate metrics & discover missing customers
    allOrders.forEach(order => {
      if (order.status === 'cancelled') return;

      const orderPhone = (order.customer_phone || '').trim();
      const orderName = (order.customer_name || '').trim();
      const normPhone = orderPhone.replace(/\D/g, '') || orderPhone;
      const key = normPhone || (orderName ? orderName.toLowerCase() : '');

      if (!key) return; // Skip guest order without phone or name

      let cust = customerMap.get(key);

      if (!cust && orderPhone) {
        // Try finding by raw phone string matching
        for (const [_, existing] of customerMap.entries()) {
          if (existing.phone && (existing.phone === orderPhone || existing.phone.replace(/\D/g, '') === normPhone)) {
            cust = existing;
            break;
          }
        }
      }

      if (!cust) {
        cust = {
          name: orderName || 'Guest',
          phone: orderPhone,
          orderCount: 0,
          totalSpent: 0,
          lastOrder: order.created_at,
          lastTable: order.table_id || null,
          loyal_vip: false,
          discount: null,
          favoriteItems: {},
        };
        customerMap.set(key, cust);
      } else {
        if ((!cust.name || cust.name === 'Guest') && orderName && orderName !== 'Guest') {
          cust.name = orderName;
        }
        if (!cust.phone && orderPhone) {
          cust.phone = orderPhone;
        }
      }

      cust.orderCount += 1;
      cust.totalSpent += Number(order.total) || 0;

      if (new Date(order.created_at).getTime() >= new Date(cust.lastOrder).getTime()) {
        cust.lastOrder = order.created_at;
        if (order.table_id) cust.lastTable = order.table_id;
      } else if (!cust.lastTable && order.table_id) {
        cust.lastTable = order.table_id;
      }

      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (item.name) {
            cust!.favoriteItems[item.name] = (cust!.favoriteItems[item.name] || 0) + (item.quantity || 1);
          }
        });
      }
    });

    // 3. Format and sort list
    const sortedList = Array.from(customerMap.values()).map(c => {
      let topItem = 'None';
      let maxQty = 0;
      Object.entries(c.favoriteItems).forEach(([item, qty]) => {
        if (qty > maxQty) {
          maxQty = qty;
          topItem = item;
        }
      });

      return {
        name: c.name,
        phone: c.phone,
        orderCount: c.orderCount,
        totalSpent: c.totalSpent,
        lastOrder: c.lastOrder,
        lastTable: c.lastTable,
        loyal_vip: c.loyal_vip,
        discount: c.loyal_vip ? discountPercentage : c.discount,
        favoriteItem: topItem,
        tablesList: c.lastTable ? `Table ${c.lastTable}` : 'Walk-in'
      };
    }).sort((a, b) => b.orderCount - a.orderCount);

    if (!customerSearch) return sortedList;
    const q = customerSearch.toLowerCase();
    return sortedList.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.phone.toLowerCase().includes(q)
    );
  }, [allOrders, dbCustomers, customerSearch, discountPercentage]);
  
  const [isKioskLocked, setIsKioskLocked] = useState<boolean>(() => {
    return localStorage.getItem('vyoma_kiosk_locked') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('vyoma_kiosk_locked', isKioskLocked.toString());
    if (isKioskLocked && location.pathname !== '/captain') {
      navigate('/captain', { replace: true });
    }
  }, [isKioskLocked, location.pathname, navigate]);

  const activeTab = useMemo(() => {
    if (isKioskLocked) return 'captain';
    const path = location.pathname.split('/')[1];
    const validTabs = ['service', 'counter', 'kitchen', 'pickup', 'menu', 'customers', 'captain', 'online', 'invoices'];
    return validTabs.includes(path) ? path : 'service';
  }, [location.pathname, isKioskLocked]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const setActiveTab = (tab: string) => {
    if (isKioskLocked && tab !== 'captain') return;
    setMobileMenuOpen(false);
    navigate(`/${tab}`);
  };

  const [stats, setStats] = useState({ preparedToday: 0, avgTime: '12m' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    localStorage.setItem('vyoma_frequent_discount_enabled', frequentDiscountEnabled.toString());
  }, [frequentDiscountEnabled]);

  useEffect(() => {
    localStorage.setItem('vyoma_min_orders_discount', minOrdersForDiscount.toString());
  }, [minOrdersForDiscount]);

  useEffect(() => {
    localStorage.setItem('vyoma_discount_percentage', discountPercentage.toString());
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
      const activeDiscount = discountPercentage;
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
    // Clear any legacy auth tokens
    localStorage.removeItem('vyoma_staff_auth');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setAuthError(true);
      toast.error('Please enter access password');
      return;
    }

    const res = await verifyStaffPassword(password);
    if (res.success) {
      setIsAuthenticated(true);
      setAuthError(false);
      toast.success('Access Granted (Verified via Supabase)');
    } else {
      setAuthError(true);
      toast.error(res.message || 'Invalid Access Password');
    }
  };

  const playPopSound = () => {
    soundService.playNewOrderSound();
  };

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      let dbActiveOrders: Order[] = [];
      let dbAllOrders: Order[] = [];

      // 1. Try fetching from Supabase
      try {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .neq('status', 'completed')
          .neq('status', 'cancelled')
          .order('created_at', { ascending: true });

        if (!ordersError && ordersData) {
          dbActiveOrders = ordersData;
        }

        const { data: allOrdersData, error: allOrdersError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (!allOrdersError && allOrdersData) {
          dbAllOrders = allOrdersData;
        }
      } catch (supabaseErr) {
        console.warn('Supabase fetch notice, falling back to API server store:', supabaseErr);
      }

      // 2. Fetch from Express API server orders store
      try {
        const apiRes = await fetch('/api/orders');
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (apiData.orders && Array.isArray(apiData.orders)) {
            const apiOrders: Order[] = apiData.orders;
            
            // Merge with Supabase orders without duplicates
            const mergedMap = new Map<string, Order>();
            for (const o of dbAllOrders) {
              mergedMap.set(o.id || o.token, o);
            }
            for (const o of apiOrders) {
              mergedMap.set(o.id || o.token, o);
            }
            
            dbAllOrders = Array.from(mergedMap.values())
              .map(o => normalizeOrder(o))
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            dbActiveOrders = dbAllOrders.filter(
              o => o.status !== 'completed' && o.status !== 'cancelled'
            );
          }
        }
      } catch (apiErr) {
        console.warn('API orders fetch notice:', apiErr);
      }

      setOrders(dbActiveOrders);
      setAllOrders(dbAllOrders);

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
      
      try {
        const { count, error: statsError } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed')
          .gte('created_at', today.toISOString());

        if (!statsError && count !== null) {
          setStats(prev => ({ ...prev, preparedToday: count }));
        }
      } catch {
        // ignore
      }

      const { data: menuData, error: menuError } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true });

      if (menuError) {
        console.warn('Could not load menu items from Supabase:', menuError.message);
      } else if (menuData && menuData.length > 0) {
        setMenuItems(menuData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // 1. Server-Sent Events (SSE) listener for instant order delivery from webhooks/testers
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/orders/events');

      eventSource.addEventListener('order_created', (event: MessageEvent) => {
        try {
          const newOrder = normalizeOrder(JSON.parse(event.data) as Order);
          console.log('[SSE] New Order Received from Server:', newOrder);

          setOrders(prev => {
            const exists = prev.some(o => o.id === newOrder.id || (o.token && o.token === newOrder.token));
            if (exists) {
              return prev.map(o => (o.id === newOrder.id || (o.token && o.token === newOrder.token)) ? newOrder : o);
            }
            return [newOrder, ...prev];
          });

          setAllOrders(prev => {
            const exists = prev.some(o => o.id === newOrder.id || (o.token && o.token === newOrder.token));
            if (exists) {
              return prev.map(o => (o.id === newOrder.id || (o.token && o.token === newOrder.token)) ? newOrder : o);
            }
            return [newOrder, ...prev];
          });

          soundService.playNewOrderSound();
          const platformLabel = (newOrder.aggregator_platform || newOrder.order_type || 'ONLINE').toUpperCase();
          toast.success(`⚡ New ${platformLabel} Order Received! Token: #${newOrder.token}`, {
            description: `${newOrder.customer_name || 'Customer'} • ₹${newOrder.total} • ${newOrder.items?.length || 1} items`,
            duration: 6000
          });
        } catch (e) {
          console.error('[SSE] Error handling order_created event:', e);
        }
      });

      eventSource.addEventListener('order_updated', (event: MessageEvent) => {
        try {
          const updated = normalizeOrder(JSON.parse(event.data) as Order);
          console.log('[SSE] Order Status Update Received:', updated);

          if (updated.status === 'ready') {
            soundService.playReadyChime();
            soundService.triggerVibration([200, 100, 200, 100, 300]);
            const targetTable = updated.table_id ? `Table ${String(updated.table_id).replace(/^table\s*/i, '')}` : (updated.order_type === 'takeaway' ? 'Takeaway Counter' : 'Pickup Desk');
            toast.warning(`🛎️ Food Ready to Serve! Order #${updated.token} for ${targetTable}`, {
              description: 'The kitchen has marked this order ready for waiter pickup.',
              duration: 8000
            });
          } else if (updated.status === 'completed') {
            setStats(prev => ({ ...prev, preparedToday: prev.preparedToday + 1 }));
          }

          setOrders(prev => {
            if (updated.status === 'completed' || updated.status === 'cancelled') {
              return prev.filter(o => o.id !== updated.id && o.token !== updated.token);
            }
            return prev.map(o => (o.id === updated.id || o.token === updated.token) ? updated : o);
          });

          setAllOrders(prev => prev.map(o => (o.id === updated.id || o.token === updated.token) ? updated : o));
        } catch (e) {
          console.error('[SSE] Error handling order_updated event:', e);
        }
      });
    } catch (sseErr) {
      console.warn('SSE connection failed:', sseErr);
    }

    // 2. Periodic sync polling (every 3.5s) to guarantee zero missed orders
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          if (data.orders && Array.isArray(data.orders)) {
            const apiOrders: Order[] = data.orders;
            setAllOrders(prev => {
              const map = new Map<string, Order>();
              for (const o of prev) {
                map.set(o.id || o.token, o);
              }
              let hasNew = false;
              for (const o of apiOrders) {
                const key = o.id || o.token;
                if (!map.has(key)) {
                  map.set(key, o);
                  hasNew = true;
                }
              }
              if (!hasNew) return prev;
              return Array.from(map.values()).sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              );
            });

            setOrders(prev => {
              const activeApi = apiOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
              const map = new Map<string, Order>();
              for (const o of prev) {
                map.set(o.id || o.token, o);
              }
              let hasChanges = false;
              for (const o of activeApi) {
                const key = o.id || o.token;
                if (!map.has(key) || map.get(key)?.status !== o.status) {
                  map.set(key, o);
                  hasChanges = true;
                }
              }
              // Also remove completed
              for (const [key, o] of map.entries()) {
                const latest = apiOrders.find(ao => (ao.id && ao.id === o.id) || (ao.token && ao.token === o.token));
                if (latest && (latest.status === 'completed' || latest.status === 'cancelled')) {
                  map.delete(key);
                  hasChanges = true;
                }
              }
              if (!hasChanges) return prev;
              return Array.from(map.values()).sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
            });
          }
        }
      } catch {
        // silent poll error
      }
    }, 3500);

    // 3. Supabase real-time updates subscription
    const ordersSubscription = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', table: 'orders', schema: 'public' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newOrder = payload.new as Order;
          setOrders(prev => {
            const exists = prev.some(o => o.id === newOrder.id || (o.token && o.token === newOrder.token));
            if (exists) {
              return prev.map(o => (o.id === newOrder.id || (o.token && o.token === newOrder.token)) ? newOrder : o);
            }
            return [newOrder, ...prev];
          });
          setAllOrders(prev => {
            const exists = prev.some(o => o.id === newOrder.id || (o.token && o.token === newOrder.token));
            if (exists) {
              return prev.map(o => (o.id === newOrder.id || (o.token && o.token === newOrder.token)) ? newOrder : o);
            }
            return [newOrder, ...prev];
          });
          soundService.playNewOrderSound();
          toast.success(`New Order Received! Token: #${newOrder.token}`);
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Order;
          if (updated.status === 'ready') {
            soundService.playReadyChime();
            soundService.triggerVibration([200, 100, 200, 100, 300]);
            const targetTable = updated.table_id ? `Table ${String(updated.table_id).replace(/^table\s*/i, '')}` : (updated.order_type === 'takeaway' ? 'Takeaway Counter' : 'Pickup Desk');
            toast.warning(`🛎️ Food Ready to Serve! Order #${updated.token} for ${targetTable}`, {
              description: 'The kitchen has marked this order ready for waiter pickup.',
              duration: 8000
            });
          } else if (updated.status === 'completed') {
            setStats(prev => ({ ...prev, preparedToday: prev.preparedToday + 1 }));
          }
          setOrders(prev => {
            if (updated.status === 'completed' || updated.status === 'cancelled') {
              return prev.filter(o => o.id !== updated.id && o.token !== updated.token);
            }
            return prev.map(o => (o.id === updated.id || o.token === updated.token) ? updated : o);
          });
          setAllOrders(prev => prev.map(o => (o.id === updated.id || o.token === updated.token) ? updated : o));
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id && o.token !== payload.old.token));
          setAllOrders(prev => prev.filter(o => o.id !== payload.old.id && o.token !== payload.old.token));
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
      if (eventSource) eventSource.close();
      clearInterval(pollInterval);
      supabase.removeChannel(ordersSubscription);
      supabase.removeChannel(menuSubscription);
    };
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    console.log(`Updating order ${orderId} status to ${newStatus}...`);
    
    // Find order in allOrders or active orders list (matching by id or token)
    const orderToUpdate = 
      allOrders.find(o => o.id === orderId || o.token === orderId) || 
      orders.find(o => o.id === orderId || o.token === orderId);

    const realOrderId = orderToUpdate?.id || orderId;

    // 1. Optimistic UI State Update
    setOrders(prev => {
      if (newStatus === 'completed' || newStatus === 'cancelled') {
        return prev.filter(o => o.id !== realOrderId && o.token !== orderId);
      }
      return prev.map(o => (o.id === realOrderId || o.token === orderId) ? { ...o, status: newStatus } : o);
    });

    setAllOrders(prev => {
      return prev.map(o => {
        if (o.id === realOrderId || o.token === orderId) {
          return { ...o, status: newStatus };
        }
        return o;
      });
    });

    toast.success(`Order #${orderToUpdate?.token || realOrderId} updated to ${newStatus}`);

    // 2. Dispatch to Backend Server & Dyno Webhooks
    const platform = orderToUpdate ? getOrderPlatform(orderToUpdate) : 'online';
    const sourceUpper = platform === 'swiggy' ? 'SWIGGY' : (platform === 'zomato' ? 'ZOMATO' : (orderToUpdate?.source || 'DYNO'));

    dispatchOrderStatus({
      orderId: realOrderId,
      nextStatus: newStatus,
      callbackUrl: orderToUpdate?.callback_url
    }).catch(err => {
      console.warn('[Outbound Dispatcher Warning]', err);
    });

    syncOrderStatusToDyno({
      orderId: realOrderId,
      token: orderToUpdate?.token,
      status: newStatus,
      source: sourceUpper
    });

    // 3. Sync to Supabase DB (Non-blocking)
    try {
      const { error: dbErr } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .or(`id.eq.${realOrderId},token.eq.${orderToUpdate?.token || realOrderId}`);

      if (dbErr) {
        console.warn('Supabase DB update warning:', dbErr.message);
      }
    } catch (dbErr: any) {
      console.warn('Supabase exception:', dbErr?.message || dbErr);
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

  const handleToggleCustomerVip = async (phone: string, currentVipStatus: boolean, customerName: string) => {
    if (!phone) {
      toast.error('Customer phone number is required to assign VIP status');
      return;
    }
    const nextVip = !currentVipStatus;
    const targetDiscount = nextVip ? discountPercentage : null;

    try {
      const { error } = await supabase
        .from('customers')
        .upsert({
          phone,
          name: customerName || 'Guest',
          loyal_vip: nextVip,
          discount: targetDiscount
        }, { onConflict: 'phone' });

      if (error) throw error;

      toast.success(nextVip ? `${customerName || 'Customer'} marked as Loyal VIP (${targetDiscount}%)` : `VIP status revoked for ${customerName || 'Customer'}`);

      // Update local dbCustomers state
      setDbCustomers(prev => {
        const idx = prev.findIndex(c => c.phone === phone);
        if (idx >= 0) {
          return prev.map((c, i) => i === idx ? { ...c, loyal_vip: nextVip, discount: targetDiscount } : c);
        }
        return [...prev, { phone, name: customerName, order_count: 0, loyal_vip: nextVip, discount: targetDiscount, created_at: new Date().toISOString() }];
      });
    } catch (err: any) {
      console.error('Error toggling customer VIP status:', err);
      toast.error('Failed to update VIP status in database');
    }
  };

  const dineInOrders = useMemo(() => {
    return orders.filter(o => getOrderPlatform(o) === 'dine_in');
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let base = dineInOrders;
    if (searchToken) {
      base = base.filter(o => o.token.toLowerCase().includes(searchToken.toLowerCase()));
    }
    // Deduplicate by ID and Token to guarantee unique order cards in UI
    const seen = new Set<string>();
    const uniqueBase: Order[] = [];
    for (const item of base) {
      const key = item.id || item.token;
      if (key && !seen.has(key)) {
        seen.add(key);
        uniqueBase.push(item);
      }
    }
    return uniqueBase;
  }, [dineInOrders, searchToken]);

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
          <p className="font-serif text-2xl tracking-tight text-primary">Vy<span className="italic opacity-60">oma</span></p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-black font-sans text-white selection:bg-primary selection:text-black">
      <Toaster position="top-right" theme="dark" richColors />
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-20 flex-col items-center border-r border-white/5 bg-[#0A0A0A] py-10 md:w-64">
        <div className="mb-16 flex items-center gap-3 px-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-transparent shadow-[0_0_15px_rgba(197,160,89,0.1)]">
            <Coffee size={20} strokeWidth={1.5} className="text-primary" />
          </div>
          <h1 className="hidden text-2xl font-serif tracking-tight md:block">Vy<span className="italic opacity-60 text-primary">oma</span></h1>
        </div>

        <nav className="flex w-full flex-1 flex-col gap-2 px-4">
          {!isKioskLocked && (
            <>
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
              <NavItem 
                icon={<Globe size={18} strokeWidth={1.5} />} 
                label="Online Orders" 
                active={activeTab === 'online'} 
                onClick={() => setActiveTab('online')}
              />
              <NavItem 
                icon={<FileText size={18} strokeWidth={1.5} />} 
                label="Invoices" 
                active={activeTab === 'invoices'} 
                onClick={() => setActiveTab('invoices')}
              />
            </>
          )}

          <NavItem 
            icon={<Utensils size={18} strokeWidth={1.5} />} 
            label="Captain" 
            active={activeTab === 'captain'} 
            onClick={() => setActiveTab('captain')}
          />

          {isKioskLocked && (
            <div className="mt-auto hidden md:flex flex-col items-center gap-2 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-center">
              <Lock size={18} className="text-red-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Kiosk Mode Locked</span>
              <p className="text-[9px] text-white/30">Staff access restricted to Captain View.</p>
            </div>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Mobile Top Header */}
        <header className="flex md:hidden h-14 items-center justify-between border-b border-white/10 bg-[#0A0A0A] px-4 z-20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
              <Coffee size={16} className="text-primary" />
            </div>
            <span className="font-serif text-lg font-bold tracking-tight">Vy<span className="italic text-primary opacity-80">oma</span></span>
            <span className="ml-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
              {activeTab}
            </span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <MenuIcon size={18} />}
          </button>
        </header>

        {/* Mobile Quick Tab Bar */}
        <div className="flex md:hidden overflow-x-auto border-b border-white/5 bg-[#0F1014] px-3 py-2 gap-2 custom-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('captain')}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
              activeTab === 'captain'
                ? 'bg-primary text-black shadow-[0_0_10px_rgba(197,160,89,0.3)]'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            Captain
          </button>
          {!isKioskLocked && (
            <>
              <button
                onClick={() => setActiveTab('counter')}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  activeTab === 'counter'
                    ? 'bg-primary text-black shadow-[0_0_10px_rgba(197,160,89,0.3)]'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                Counter
              </button>
              <button
                onClick={() => setActiveTab('service')}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  activeTab === 'service'
                    ? 'bg-primary text-black shadow-[0_0_10px_rgba(197,160,89,0.3)]'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                Service Rail
              </button>
              <button
                onClick={() => setActiveTab('kitchen')}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  activeTab === 'kitchen'
                    ? 'bg-primary text-black shadow-[0_0_10px_rgba(197,160,89,0.3)]'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                Kitchen
              </button>
              <button
                onClick={() => setActiveTab('pickup')}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  activeTab === 'pickup'
                    ? 'bg-primary text-black shadow-[0_0_10px_rgba(197,160,89,0.3)]'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                Pickup
              </button>
              <button
                onClick={() => setActiveTab('menu')}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  activeTab === 'menu'
                    ? 'bg-primary text-black shadow-[0_0_10px_rgba(197,160,89,0.3)]'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                Menu
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  activeTab === 'customers'
                    ? 'bg-primary text-black shadow-[0_0_10px_rgba(197,160,89,0.3)]'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                Customers
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  activeTab === 'invoices'
                    ? 'bg-primary text-black shadow-[0_0_10px_rgba(197,160,89,0.3)]'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                Invoices
              </button>
            </>
          )}
        </div>

        {/* Mobile Slide-Out Drawer Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-b border-white/10 bg-[#0A0A0A] px-4 py-4 flex flex-col gap-2 z-30 shrink-0"
            >
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 px-2 mb-1">
                Navigation Menu
              </span>
              <button
                onClick={() => setActiveTab('captain')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'captain' ? 'bg-primary text-black' : 'bg-white/5 text-white'
                }`}
              >
                <Utensils size={16} /> Captain Service Desk
              </button>
              {!isKioskLocked && (
                <>
                  <button
                    onClick={() => setActiveTab('service')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTab === 'service' ? 'bg-primary text-black' : 'bg-white/5 text-white'
                    }`}
                  >
                    <RefreshCcw size={16} /> Service Rail
                  </button>
                  <button
                    onClick={() => setActiveTab('counter')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTab === 'counter' ? 'bg-primary text-black' : 'bg-white/5 text-white'
                    }`}
                  >
                    <LayoutDashboard size={16} /> Counter
                  </button>
                  <button
                    onClick={() => setActiveTab('kitchen')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTab === 'kitchen' ? 'bg-primary text-black' : 'bg-white/5 text-white'
                    }`}
                  >
                    <ChefHat size={16} /> Kitchen KDS
                  </button>
                  <button
                    onClick={() => setActiveTab('pickup')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTab === 'pickup' ? 'bg-primary text-black' : 'bg-white/5 text-white'
                    }`}
                  >
                    <PackageCheck size={16} /> Pickup Station
                  </button>
                  <button
                    onClick={() => setActiveTab('menu')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTab === 'menu' ? 'bg-primary text-black' : 'bg-white/5 text-white'
                    }`}
                  >
                    <MenuIcon size={16} /> Menu Inventory
                  </button>
                  <button
                    onClick={() => setActiveTab('customers')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTab === 'customers' ? 'bg-primary text-black' : 'bg-white/5 text-white'
                    }`}
                  >
                    <Users size={16} /> Customer Database
                  </button>
                  <button
                    onClick={() => setActiveTab('online')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTab === 'online' ? 'bg-primary text-black' : 'bg-white/5 text-white'
                    }`}
                  >
                    <Globe size={16} /> Online Orders
                  </button>
                  <button
                    onClick={() => setActiveTab('invoices')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTab === 'invoices' ? 'bg-primary text-black' : 'bg-white/5 text-white'
                    }`}
                  >
                    <FileText size={16} /> Invoices & Billing
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col min-h-0 flex-1">
          {/* Desktop Header */}
          <header className="hidden md:flex h-24 items-center justify-between border-b border-white/5 px-10 backdrop-blur-xl sticky top-0 z-10 animate-fade-in shrink-0">
            <TabsList className="bg-transparent p-0 gap-10">
              <TabsTrigger value="captain" className="text-white/30 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-24 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all">Captain</TabsTrigger>
              {!isKioskLocked && (
                <>
                  <TabsTrigger value="service" className="text-white/30 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-24 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all">Service Rail</TabsTrigger>
                  <TabsTrigger value="counter" className="text-white/30 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-24 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all">Counter</TabsTrigger>
                  <TabsTrigger value="kitchen" className="text-white/30 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-24 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all">Kitchen</TabsTrigger>
                  <TabsTrigger value="pickup" className="text-white/30 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-24 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all">Pickup</TabsTrigger>
                  <TabsTrigger value="menu" className="text-white/30 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-24 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all">Menu</TabsTrigger>
                  <TabsTrigger value="customers" className="text-white/30 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-24 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all">Customer Database</TabsTrigger>
                  <TabsTrigger value="online" className="text-white/30 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-24 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all">Online Orders</TabsTrigger>
                  <TabsTrigger value="invoices" className="text-white/30 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-24 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all">Invoices</TabsTrigger>
                </>
              )}
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
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 rounded-full border border-primary/20 px-5 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-primary/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(197,160,89,0.8)]" />
                  SYSTEM ONLINE
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 min-h-0">
            <TabsContent value="counter" className="m-0 h-full flex flex-col gap-4 sm:gap-6 md:gap-10 p-3.5 sm:p-6 md:p-10 outline-none data-[state=inactive]:hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-4xl font-serif tracking-tight">Counter</h2>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/20 mt-1 sm:mt-2 font-bold">Incoming orders & Verification</p>
                </div>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-4 sm:left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/40" />
                  <Input 
                    placeholder="Search Token ID..." 
                    className="pl-12 sm:pl-14 bg-[#0A0A0A] border-white/5 rounded-full h-11 sm:h-14 text-[10px] font-bold uppercase tracking-[0.2em] focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all"
                    value={searchToken}
                    onChange={(e) => setSearchToken(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                <div className="flex flex-col gap-6 sm:gap-8 pb-10 max-w-4xl mx-auto">
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
                    <div className="flex h-64 sm:h-80 flex-col items-center justify-center rounded-2xl sm:rounded-[2rem] border border-white/5 bg-[#0A0A0A] p-4 text-center">
                      <Clock size={40} strokeWidth={1} className="mb-4 sm:mb-6 text-primary/20 sm:w-12 sm:h-12" />
                      <p className="text-[10px] uppercase tracking-[0.4em] text-white/10 font-bold">No new orders</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="service" className="m-0 h-full flex flex-col gap-4 sm:gap-6 md:gap-10 p-3.5 sm:p-6 md:p-10 outline-none data-[state=inactive]:hidden">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl sm:text-4xl font-serif tracking-tight">Service Rail</h2>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/20 mt-1 sm:mt-2 font-bold">Full Order Lifecycle</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                <div className="flex flex-col gap-6 sm:gap-8 pb-10 max-w-4xl mx-auto">
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
                    <div className="flex h-64 sm:h-80 flex-col items-center justify-center rounded-2xl sm:rounded-[2rem] border border-white/5 bg-[#0A0A0A] p-4 text-center">
                      <Clock size={40} strokeWidth={1} className="mb-4 sm:mb-6 text-primary/20 sm:w-12 sm:h-12" />
                      <p className="text-[10px] uppercase tracking-[0.4em] text-white/10 font-bold">No active orders</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="kitchen" className="m-0 h-full flex flex-col gap-4 sm:gap-6 md:gap-10 p-3.5 sm:p-6 md:p-10 outline-none data-[state=inactive]:hidden">
              <div>
                <h2 className="text-2xl sm:text-4xl font-serif tracking-tight">Kitchen</h2>
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/20 mt-1 sm:mt-2 font-bold">Active Preparations</p>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                <div className="flex flex-col gap-6 sm:gap-8 pb-10 max-w-4xl mx-auto">
                  <AnimatePresence mode="popLayout">
                    {dineInOrders.filter(o => o.status === 'preparing').map((order, index) => (
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
                  {dineInOrders.filter(o => o.status === 'preparing').length === 0 && (
                    <div className="flex h-64 sm:h-80 flex-col items-center justify-center rounded-2xl sm:rounded-[2rem] border border-white/5 bg-[#0A0A0A] p-4 text-center">
                      <ChefHat size={40} strokeWidth={1} className="mb-4 sm:mb-6 text-primary/20 sm:w-12 sm:h-12" />
                      <p className="text-[10px] uppercase tracking-[0.4em] text-white/10 font-bold">Kitchen is clear</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pickup" className="m-0 h-full flex flex-col gap-4 sm:gap-6 md:gap-10 p-3.5 sm:p-6 md:p-10 outline-none data-[state=inactive]:hidden">
              <div>
                <h2 className="text-2xl sm:text-4xl font-serif tracking-tight">Pickup</h2>
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/20 mt-1 sm:mt-2 font-bold">Awaiting Collection</p>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                <div className="flex flex-col gap-6 sm:gap-8 pb-10 max-w-4xl mx-auto">
                  <AnimatePresence mode="popLayout">
                    {dineInOrders.filter(o => o.status === 'ready').map((order, index) => (
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
                  {dineInOrders.filter(o => o.status === 'ready').length === 0 && (
                    <div className="flex h-64 sm:h-80 flex-col items-center justify-center rounded-2xl sm:rounded-[2rem] border border-white/5 bg-[#0A0A0A] p-4 text-center">
                      <PackageCheck size={40} strokeWidth={1} className="mb-4 sm:mb-6 text-primary/20 sm:w-12 sm:h-12" />
                      <p className="text-[10px] uppercase tracking-[0.4em] text-white/10 font-bold">No orders waiting</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="menu" className="m-0 h-full flex flex-col gap-4 sm:gap-6 md:gap-10 p-3.5 sm:p-6 md:p-10 outline-none data-[state=inactive]:hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-4xl font-serif tracking-tight">Menu</h2>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/20 mt-1 sm:mt-2 font-bold">Inventory & Availability</p>
                </div>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-4 sm:left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/40" />
                  <Input 
                    placeholder="Search Menu..." 
                    className="pl-12 sm:pl-14 bg-[#0A0A0A] border-white/5 rounded-full h-11 sm:h-14 text-[10px] font-bold uppercase tracking-[0.2em] focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all"
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 gap-4 sm:gap-8 md:grid-cols-2 xl:grid-cols-3 pb-10">
                  {filteredMenuItems.map((item) => (
                    <Card key={item.id} className="relative bg-[#0A0A0A] border border-white/5 rounded-2xl sm:rounded-[2rem] overflow-hidden group hover:border-primary/30 transition-all duration-500 hover:shadow-[0_0_30px_rgba(197,160,89,0.03)]">
                      <div className="flex items-stretch p-4 sm:p-8 gap-4 sm:gap-8">
                        <div className="h-24 w-24 flex-shrink-0 rounded-full bg-black flex items-center justify-center overflow-hidden border border-white/5 group-hover:border-primary/20 transition-all duration-700 self-center">
                          <MenuItemImage src={item.image} name={item.name} category={item.category} />
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

            <TabsContent value="customers" className="m-0 h-full flex flex-col gap-6 p-6 md:p-10 outline-none data-[state=inactive]:hidden overflow-y-auto custom-scrollbar">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-in flex-shrink-0">
                <div>
                  <h2 className="text-3xl md:text-4xl font-serif tracking-tight">Customer Database</h2>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/20 mt-2 font-bold font-sans">Loyalty & Historical Statistics</p>
                </div>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/40" />
                  <Input 
                    placeholder="Search Customers..." 
                    className="pl-14 bg-[#0A0A0A] border-white/5 rounded-full h-12 text-[10px] font-bold uppercase tracking-[0.2em] focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all font-sans"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Loyalty Discount Option Panel */}
              <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-6 md:p-8 shadow-[0_0_30px_rgba(197,160,89,0.02)] animate-fade-in delay-100 flex-shrink-0">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-3 lg:max-w-xl">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary">
                        <TrendingUp size={12} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Automatic Checkout Promotion</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-serif tracking-tight text-white mb-1">Loyal Customer Checkout Discounts</h3>
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
                          className="bg-black border-white/5 rounded-full h-11 w-28 text-center text-xs font-bold font-sans"
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
                          className="bg-black border-white/5 rounded-full h-11 w-28 text-center text-xs font-bold font-sans text-primary"
                          value={discountPercentage}
                          onChange={(e) => {
                            const val = Math.min(100, Math.max(1, parseInt(e.target.value) || 0));
                            setDiscountPercentage(val);
                            supabase.from('customers').update({ discount: val }).eq('loyal_vip', true).then();
                            setDbCustomers(prev => prev.map(c => c.loyal_vip ? { ...c, discount: val } : c));
                          }}
                          disabled={!frequentDiscountEnabled}
                        />
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={toggleFrequentDiscount}
                      className="flex items-center gap-4 bg-black/40 hover:bg-black/60 border border-white/5 rounded-full px-6 py-3 self-center sm:self-auto h-11 mt-auto cursor-pointer select-none transition-all"
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
              <div className="flex-1 min-h-[450px] border border-white/5 bg-[#0A0A0A] rounded-[2rem] p-6 md:p-8 shadow-[0_0_40px_rgba(0,0,0,0.3)] animate-fade-in delay-200 flex flex-col overflow-hidden">
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="border-b border-white/5 text-[9px] uppercase tracking-[0.25em] text-white/30 font-bold font-sans">
                        <th className="px-4 pb-4 text-left whitespace-nowrap">Customer Name</th>
                        <th className="px-4 pb-4 text-left whitespace-nowrap">Phone Number</th>
                        <th className="px-4 pb-4 text-center whitespace-nowrap">Order Count</th>
                        <th className="px-4 pb-4 text-right whitespace-nowrap">Total Spent</th>
                        <th className="px-4 pb-4 text-right whitespace-nowrap">Avg Order Value</th>
                        <th className="px-4 pb-4 text-left whitespace-nowrap">Favorite Item</th>
                        <th className="px-4 pb-4 text-left whitespace-nowrap">Last Table</th>
                        <th className="px-4 pb-4 text-center whitespace-nowrap">VIP Status</th>
                        <th className="px-4 pb-4 text-right whitespace-nowrap">Last Visit</th>
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
                            key={customer.phone || customer.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: idx * 0.03 }}
                            className="group hover:bg-white/[0.01] transition-colors"
                          >
                            <td className="px-4 py-4 font-medium text-white/95 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-serif">{customer.name}</span>
                                {qualifies && (
                                  <span className="text-[7px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                                    Loyal VIP {customer.discount ? `(${customer.discount}%)` : ''}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 font-mono text-white/70 whitespace-nowrap">
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
                            <td className="px-4 py-4 text-center whitespace-nowrap">
                              <span className="inline-flex items-center justify-center h-7 w-12 rounded-full bg-white/5 font-mono text-white/80 font-semibold group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                {customer.orderCount}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right font-mono text-white/80 font-medium whitespace-nowrap">
                              ₹{customer.totalSpent.toFixed(2)}
                            </td>
                            <td className="px-4 py-4 text-right font-mono text-white/60 whitespace-nowrap">
                              ₹{avgValue.toFixed(2)}
                            </td>
                            <td className="px-4 py-4 text-left text-white/60 whitespace-nowrap">
                              <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] uppercase font-bold tracking-wider text-white/55">
                                {customer.favoriteItem}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-left text-white/40 max-w-[150px] truncate whitespace-nowrap">
                              {customer.tablesList}
                            </td>
                            <td className="px-4 py-4 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleToggleCustomerVip(customer.phone, customer.loyal_vip, customer.name)}
                                disabled={!customer.phone}
                                className={cn(
                                  "px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all border cursor-pointer active:scale-95",
                                  customer.loyal_vip
                                    ? "bg-primary/20 text-primary border-primary/40 hover:bg-primary/30"
                                    : "bg-white/5 text-white/40 border-white/10 hover:border-white/20 hover:text-white/80"
                                )}
                                title={customer.phone ? "Click to toggle Loyal VIP status" : "Phone required to toggle VIP"}
                              >
                                {customer.loyal_vip ? "VIP Active" : "Make VIP"}
                              </button>
                            </td>
                            <td className="px-4 py-4 text-right text-white/40 font-mono whitespace-nowrap">
                              {formattedDate}
                            </td>
                          </motion.tr>
                        );
                      })}

                      {computedCustomers.length === 0 && (
                        <tr>
                          <td colSpan={9} className="py-20 text-center">
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

            <TabsContent value="captain" className="m-0 h-full flex flex-col p-0 outline-none data-[state=inactive]:hidden overflow-y-auto custom-scrollbar">
              <CaptainDashboard
                menuItems={menuItems}
                orders={orders}
                onUpdateStatus={updateOrderStatus}
                isKioskLocked={isKioskLocked}
                setIsKioskLocked={setIsKioskLocked}
                onOrderCreated={(newOrder) => {
                  setOrders(prev => {
                    const exists = prev.some(o => o.id === newOrder.id || (o.token && o.token === newOrder.token));
                    if (exists) {
                      return prev.map(o => (o.id === newOrder.id || (o.token && o.token === newOrder.token)) ? newOrder : o);
                    }
                    return [newOrder, ...prev];
                  });
                  setAllOrders(prev => {
                    const exists = prev.some(o => o.id === newOrder.id || (o.token && o.token === newOrder.token));
                    if (exists) {
                      return prev.map(o => (o.id === newOrder.id || (o.token && o.token === newOrder.token)) ? newOrder : o);
                    }
                    return [newOrder, ...prev];
                  });
                }}
              />
            </TabsContent>

            <TabsContent value="online" className="m-0 h-full flex flex-col p-0 outline-none data-[state=inactive]:hidden overflow-y-auto custom-scrollbar">
              <OnlineOrdersView
                orders={orders}
                allOrders={allOrders}
                menuItems={menuItems}
                onUpdateStatus={updateOrderStatus}
                onOrderCreated={(newOrder) => {
                  setOrders(prev => [newOrder, ...prev]);
                  setAllOrders(prev => [newOrder, ...prev]);
                }}
                renderOrderCard={(order, index) => {
                  let actionLabel = "Start Crafting";
                  let nextStatus: OrderStatus = "preparing";
                  
                  if (order.status === 'preparing') {
                    actionLabel = "Mark Ready";
                    nextStatus = "ready";
                  } else if (order.status === 'ready') {
                    actionLabel = "Complete & Paid";
                    nextStatus = "completed";
                  } else if (order.status === 'completed') {
                    actionLabel = "Order Completed";
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
                }}
              />
            </TabsContent>

            <TabsContent value="invoices" className="m-0 h-full flex flex-col p-0 outline-none data-[state=inactive]:hidden overflow-hidden">
              <InvoicesView
                menuItems={menuItems}
                orders={allOrders && allOrders.length > 0 ? allOrders : orders}
                onOrderCreated={(newOrder) => {
                  setOrders(prev => {
                    const exists = prev.some(o => o.id === newOrder.id || (o.token && o.token === newOrder.token));
                    if (exists) {
                      return prev.map(o => (o.id === newOrder.id || (o.token && o.token === newOrder.token)) ? newOrder : o);
                    }
                    return [newOrder, ...prev];
                  });
                  setAllOrders(prev => {
                    const exists = prev.some(o => o.id === newOrder.id || (o.token && o.token === newOrder.token));
                    if (exists) {
                      return prev.map(o => (o.id === newOrder.id || (o.token && o.token === newOrder.token)) ? newOrder : o);
                    }
                    return [newOrder, ...prev];
                  });
                }}
                onRefreshLedger={fetchData}
              />
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
  const [image, setImage] = useState(item.image || '');
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
      image: image.trim() || undefined,
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
      <DialogContent className="bg-[#0A0A0A] border-white/5 text-white sm:max-w-[480px] rounded-[2rem] p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-3xl font-serif tracking-tight">Edit Item</DialogTitle>
          <DialogDescription className="text-[9px] uppercase tracking-[0.3em] text-white/20 font-bold mt-2">
            Modify menu item specifications & image
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-6">
          <div className="grid gap-3">
            <label htmlFor="name" className="text-[9px] uppercase tracking-[0.25em] text-white/40 ml-1 font-bold">Item Name</label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="bg-black border-white/5 rounded-full h-12 text-[10px] font-bold uppercase tracking-[0.2em] focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-3">
              <label htmlFor="price" className="text-[9px] uppercase tracking-[0.25em] text-white/40 ml-1 font-bold">Base Price (₹)</label>
              <Input 
                id="price" 
                type="number" 
                step="0.01"
                value={price} 
                onChange={(e) => setPrice(e.target.value)}
                className="bg-black border-white/5 rounded-full h-12 text-[10px] font-bold uppercase tracking-[0.2em] focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all"
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
                className="bg-black border-white/5 rounded-full h-12 text-[10px] font-bold uppercase tracking-[0.2em] focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all"
              />
            </div>
          </div>
          <div className="grid gap-3">
            <label htmlFor="category" className="text-[9px] uppercase tracking-[0.25em] text-white/40 ml-1 font-bold">Category</label>
            <Input 
              id="category" 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="bg-black border-white/5 rounded-full h-12 text-[10px] font-bold uppercase tracking-[0.2em] focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all"
            />
          </div>
          <div className="grid gap-3">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="image" className="text-[9px] uppercase tracking-[0.25em] text-white/40 font-bold">Image URL</label>
              <span className="text-[8px] uppercase tracking-wider text-primary/60 font-bold">Food Photography</span>
            </div>
            <Input 
              id="image" 
              placeholder="Paste Image URL (https://...)" 
              value={image} 
              onChange={(e) => setImage(e.target.value)}
              className="bg-black border-white/5 rounded-full h-12 text-[10px] font-mono focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all"
            />
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="text-[8px] uppercase tracking-wider text-white/20 w-full font-bold">Quick Presets:</span>
              {Object.entries(DEFAULT_CATEGORY_IMAGES).slice(0, 6).map(([key, url]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setImage(url)}
                  className="px-3 py-1 rounded-full bg-white/5 hover:bg-primary/20 border border-white/5 hover:border-primary/40 text-[8px] uppercase font-bold text-white/60 hover:text-primary transition-all"
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-[1.5rem] bg-black p-5 border border-white/5">
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
    return order.gstin || localStorage.getItem('vyoma_default_gstin') || '';
  });
  const [receiptTaxRate, setReceiptTaxRate] = useState(() => {
    const saved = localStorage.getItem('vyoma_default_tax_rate');
    return saved ? Number(saved) : 5;
  });

  useEffect(() => {
    localStorage.setItem('vyoma_default_gstin', receiptGstin);
  }, [receiptGstin]);

  useEffect(() => {
    localStorage.setItem('vyoma_default_tax_rate', receiptTaxRate.toString());
  }, [receiptTaxRate]);

  const [isSavingGstin, setIsSavingGstin] = useState(false);

  const handleSaveGstinToDb = async (gstToSave: string) => {
    setIsSavingGstin(true);
    try {
      // 1. Update order
      const { error: orderErr } = await supabase
        .from('orders')
        .update({ gstin: gstToSave || null })
        .eq('id', order.id);

      if (orderErr) throw orderErr;
      
      // Update local reference
      order.gstin = gstToSave;

      // 2. Update customer if phone is provided
      if (order.customer_phone) {
        const { error: custErr } = await supabase
          .from('customers')
          .update({ gstin: gstToSave || null })
          .eq('phone', order.customer_phone);
      }
      
      toast.success('GSTIN saved to Database successfully!');
    } catch (err: any) {
      console.error('Error saving GSTIN:', err);
      toast.error('Failed to save GSTIN to database');
    } finally {
      setIsSavingGstin(false);
    }
  };

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

  const platform = getOrderPlatform(order);
  const platformLabel = platform === 'swiggy' ? 'Swiggy' : platform === 'zomato' ? 'Zomato' : platform === 'other_online' ? 'Online' : '';

  const displayCustomerName = useMemo(() => {
    const raw = (order.customer_name || '').trim();
    if (!raw || raw.toLowerCase() === 'guest' || raw.toLowerCase() === 'guest order' || raw.toLowerCase() === 'null' || raw.toLowerCase() === 'undefined') {
      return platformLabel ? `Guest Customer (${platformLabel})` : 'Guest Customer';
    }
    return raw;
  }, [order.customer_name, platformLabel]);

  const isPhoneMasked = useMemo(() => {
    const phone = (order.customer_phone || '').trim();
    if (!phone) return true;
    const lower = phone.toLowerCase();
    if (
      lower.includes('mask') || 
      lower.includes('policy') || 
      lower.includes('n/a') || 
      lower.includes('null') || 
      lower === '0' || 
      phone === '+919876543210' ||
      phone.replace(/\D/g, '').length < 6
    ) {
      return true;
    }
    return false;
  }, [order.customer_phone]);

  const formatPrice = (amount?: number | null) => {
    const num = Number(amount);
    if (amount === null || amount === undefined || isNaN(num) || num <= 0) {
      return 'Price N/A';
    }
    return `₹${num.toFixed(2)}`;
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
        "border border-white/5 bg-[#0A0A0A] overflow-hidden relative group transition-all duration-700 rounded-2xl sm:rounded-[1.5rem]",
        variant === 'pending' && "animate-pulse-subtle",
        isOldReady ? "border-primary/40 shadow-[0_0_50px_rgba(197,160,89,0.15)]" : "hover:border-primary/30 hover:shadow-[0_0_40px_rgba(197,160,89,0.05)]"
      )}>
        <div className="flex flex-col">
          {/* Top Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-black/60 px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">TOKEN</span>
              <span className="text-xl sm:text-2xl font-serif text-primary tracking-widest font-bold">{order.token}</span>
              {order.table_id && (
                <div className="px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5 text-[9px] font-bold uppercase tracking-[0.15em] text-primary whitespace-nowrap">
                  Table {String(order.table_id).replace(/^table\s*/i, '')}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {(() => {
                if (platform === 'swiggy') {
                  return (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FC8019] text-white text-[9px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(252,128,25,0.3)]">
                      SWIGGY
                    </span>
                  );
                }
                if (platform === 'zomato') {
                  return (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E23744] text-white text-[9px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(226,55,68,0.3)]">
                      ZOMATO
                    </span>
                  );
                }
                if (platform === 'other_online') {
                  return (
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(37,99,235,0.3)]">
                      ONLINE
                    </span>
                  );
                }
                return null;
              })()}

              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                <span className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  variant === 'pending' ? "bg-blue-500" : variant === 'preparing' ? "bg-amber-500" : "bg-green-500"
                )} />
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/60">{variant}</span>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-white/30 font-bold uppercase tracking-[0.15em] ml-1">
                <Clock size={11} strokeWidth={2} className="text-primary/50" />
                {timeAgo(order.created_at)}
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="p-4 sm:p-5 flex flex-col justify-between min-w-0 flex-1">
            <div>
              <div className="mb-3">
                <span className="text-lg font-serif text-white/90 block font-semibold">{displayCustomerName}</span>
                {isPhoneMasked ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 w-fit text-[9px] text-white/50 tracking-wider font-mono mt-1.5">
                    <ShieldCheck size={11} className="text-primary/70 shrink-0" />
                    <span>Masked Number (Privacy Protected)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-white/60 tracking-wider font-mono block">{order.customer_phone}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (order.customer_phone) {
                          navigator.clipboard.writeText(order.customer_phone);
                          toast.success('Customer phone copied!');
                        }
                      }}
                      className="p-1 text-white/30 hover:text-primary rounded transition-colors"
                      title="Copy Phone"
                    >
                      <Copy size={11} />
                    </button>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-2 bg-white/[0.02] p-3 rounded-xl border border-white/5 my-2">
                {normalizeOrderItems(order.items).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs group/item">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-[9px] font-bold text-primary">
                        {item.quantity}
                      </span>
                      <span className="text-white/80 group-hover/item:text-white transition-colors tracking-tight font-medium truncate">
                        {item.name}
                      </span>
                    </div>
                    {Number(item.price) > 0 ? (
                      <span className="text-[10px] font-mono text-white/40 shrink-0 ml-2">₹{(Number(item.price) * (Number(item.quantity) || 1)).toFixed(2)}</span>
                    ) : (
                      <span className="text-[9px] font-mono text-white/20 shrink-0 ml-2 italic">Included</span>
                    )}
                  </div>
                ))}
              </div>

              {order.notes && (
                <p className="text-[10px] italic text-amber-400/80 bg-amber-400/5 border border-amber-400/10 p-2.5 rounded-lg mt-2">
                  Note: {order.notes}
                </p>
              )}
            </div>

            {/* Bottom Bar: Total Amount & Action Buttons in a clean, non-overlapping row */}
            <div className="border-t border-white/5 pt-4 mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/20 block mb-0.5">Total Amount</span>
                {discountInfo && discountInfo.isDiscounted ? (
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-white/20 line-through">{formatPrice(discountInfo.originalTotal)}</span>
                      <span className="text-2xl font-serif text-primary font-bold">{formatPrice(discountInfo.finalTotal)}</span>
                    </div>
                    <span className="text-[8px] font-bold uppercase text-green-500 tracking-wider mt-0.5">
                      {discountInfo.discountPercentage}% Loyalty Discount ({discountInfo.orderCount} Orders)
                    </span>
                  </div>
                ) : (
                  <span className="text-2xl font-serif text-primary font-bold">{formatPrice(order.total)}</span>
                )}
              </div>

              <div className="flex items-center gap-2.5 flex-wrap justify-end">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline"
                      className="border border-white/10 text-white/70 hover:text-primary hover:border-primary/40 rounded-full px-5 h-11 text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-300 hover:scale-105"
                    >
                      <span className="flex items-center gap-2">
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
                          <div className="flex gap-2">
                            <Input 
                              placeholder="e.g. 27AAAAA1111A1Z1 (Leave empty for unregistered)" 
                              value={receiptGstin} 
                              onChange={(e) => setReceiptGstin(e.target.value)}
                              className="bg-black border-white/5 rounded-full h-12 text-[10px] font-bold uppercase tracking-[0.2em] focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all placeholder:text-white/10 text-white flex-1"
                            />
                            <Button
                              type="button"
                              onClick={() => handleSaveGstinToDb(receiptGstin)}
                              disabled={isSavingGstin}
                              variant="outline"
                              className="border border-primary/20 hover:border-primary/40 text-primary hover:bg-primary/5 rounded-full h-12 px-5 text-[9px] uppercase tracking-wider font-bold transition-all shrink-0"
                            >
                              {isSavingGstin ? 'Saving...' : 'Save to DB'}
                            </Button>
                          </div>
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
                          onClick={async () => {
                            if (receiptGstin !== (order.gstin || '')) {
                              await handleSaveGstinToDb(receiptGstin);
                            }
                            handlePrintReceipt();
                          }}
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
        </Card>
      </motion.div>
  );
}
