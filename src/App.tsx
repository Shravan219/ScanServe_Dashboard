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
  FileText,
  CreditCard,
  Volume2,
  VolumeX,
  Sparkles,
  Filter
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Receipt } from '@/src/components/Receipt';
import { CaptainDashboard } from '@/src/components/captain/CaptainDashboard';
import { OnlineOrdersView, getOrderPlatform } from '@/src/components/OnlineOrdersView';
import { InvoicesView } from '@/src/components/invoices/InvoicesView';
import { PaymentsView } from '@/src/components/payments/PaymentsView';
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
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<string>('all');
  const [customerSearch, setCustomerSearch] = useState('');
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(() => soundService.getMuted());

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [dbCustomers, setDbCustomers] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

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
          await supabase
            .from('customers')
            .update({ loyal_vip: false, discount: null })
            .not('phone', 'is', null);

          try {
            await fetch('/api/customers/bulk-discount', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ discount: null })
            });
          } catch {}

          // Refetch customer table data from DB
          const { data: updatedCusts, error: listErr } = await supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });
          if (!listErr && updatedCusts) {
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
    // Single-pass Map data structure strictly populated from DB customers
    const customerMap = new Map<string, {
      id?: string;
      name: string;
      phone: string;
      orderCount: number;
      computedOrderCount: number;
      totalSpent: number;
      lastOrder: string;
      lastTable: string | number | null;
      loyal_vip: boolean;
      discount: number | null;
      favoriteItems: Record<string, number>;
      gstin: string | null;
    }>();

    // 1. Populate ONLY from dedicated dbCustomers records in Supabase
    dbCustomers.forEach(dc => {
      const rawPhone = (dc.phone || '').trim();
      const rawName = (dc.name || 'Guest').trim();
      const normPhone = rawPhone.replace(/\D/g, '');
      const key = rawPhone || (dc.id ? String(dc.id) : rawName.toLowerCase());
      const isVip = !!dc.loyal_vip;
      const initialOrderCount = Number(dc.order_count) || 0;

      if (key) {
        customerMap.set(key, {
          id: dc.id,
          name: rawName,
          phone: rawPhone,
          orderCount: initialOrderCount,
          computedOrderCount: 0,
          totalSpent: 0,
          lastOrder: dc.created_at || new Date().toISOString(),
          lastTable: null,
          loyal_vip: isVip,
          discount: isVip ? (dc.discount != null ? Number(dc.discount) : discountPercentage) : (dc.discount != null ? Number(dc.discount) : null),
          favoriteItems: {},
          gstin: dc.gstin || null,
        });
      }
    });

    // 2. Scan allOrders to calculate spending, top items, and tables ONLY for existing dbCustomers
    // The code DOES NOT create or insert any new customer rows on its own!
    allOrders.forEach(order => {
      if (order.status === 'cancelled') return;

      const orderPhone = (order.customer_phone || '').trim();
      const orderName = (order.customer_name || '').trim();
      const normOrderPhone = orderPhone.replace(/\D/g, '');

      // Find matching customer from dbCustomers Map
      let matchedCust: any = null;

      for (const cust of customerMap.values()) {
        const custPhone = cust.phone.trim();
        const normCustPhone = custPhone.replace(/\D/g, '');

        if (normOrderPhone && normCustPhone && normOrderPhone === normCustPhone) {
          matchedCust = cust;
          break;
        } else if (orderPhone && custPhone && orderPhone.toLowerCase() === custPhone.toLowerCase()) {
          matchedCust = cust;
          break;
        } else if (
          orderName && 
          cust.name && 
          orderName.toLowerCase() === cust.name.trim().toLowerCase() && 
          orderName.toLowerCase() !== 'guest' && 
          orderName.toLowerCase() !== 'guest customer'
        ) {
          matchedCust = cust;
          break;
        }
      }

      if (matchedCust) {
        matchedCust.totalSpent += Number(order.total) || 0;
        matchedCust.computedOrderCount += 1;

        if (new Date(order.created_at).getTime() >= new Date(matchedCust.lastOrder).getTime()) {
          matchedCust.lastOrder = order.created_at;
          if (order.table_id) matchedCust.lastTable = order.table_id;
        } else if (!matchedCust.lastTable && order.table_id) {
          matchedCust.lastTable = order.table_id;
        }

        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            if (item.name) {
              matchedCust.favoriteItems[item.name] = (matchedCust.favoriteItems[item.name] || 0) + (item.quantity || 1);
            }
          });
        }
      }
      // CRITICAL: If no match in dbCustomers, DO NOT create a row!
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

      const effectiveOrderCount = Math.max(c.orderCount, c.computedOrderCount);

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        orderCount: effectiveOrderCount,
        totalSpent: c.totalSpent,
        lastOrder: c.lastOrder,
        lastTable: c.lastTable,
        loyal_vip: c.loyal_vip,
        discount: c.discount,
        favoriteItem: topItem,
        tablesList: c.lastTable ? `Table ${c.lastTable}` : 'Walk-in',
        gstin: c.gstin
      };
    }).sort((a, b) => b.orderCount - a.orderCount);

    if (!customerSearch) return sortedList;
    const q = customerSearch.toLowerCase();
    return sortedList.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.phone.toLowerCase().includes(q) ||
      (c.gstin && c.gstin.toLowerCase().includes(q))
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
    const validTabs = ['captain', 'counter', 'kitchen', 'pickup', 'payments', 'menu', 'customers', 'online', 'invoices'];
    return validTabs.includes(path) ? path : 'captain';
  }, [location.pathname, isKioskLocked]);

  const waitingForPaymentCount = useMemo(() => {
    return (allOrders && allOrders.length > 0 ? allOrders : orders).filter(
      o => (o.status || '').toLowerCase().trim() === 'waiting for payment' || (o.status || '').toLowerCase().trim() === 'waiting_for_payment'
    ).length;
  }, [allOrders, orders]);

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
    if (location.pathname === '/' || location.pathname === '' || location.pathname === '/service') {
      navigate('/captain', { replace: true });
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

      // Try getting dedicated customer records from Supabase, with API fallback
      try {
        const { data: custData, error: custError } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false });
        if (!custError && custData && Array.isArray(custData)) {
          setDbCustomers(custData);
        } else {
          const apiCustRes = await fetch('/api/customers');
          if (apiCustRes.ok) {
            const apiCustData = await apiCustRes.json();
            if (apiCustData.success && Array.isArray(apiCustData.customers)) {
              setDbCustomers(apiCustData.customers);
            }
          }
        }
      } catch (e) {
        console.warn('Customer fetch notice, attempting API fallback:', e);
        try {
          const apiCustRes = await fetch('/api/customers');
          if (apiCustRes.ok) {
            const apiCustData = await apiCustRes.json();
            if (apiCustData.success && Array.isArray(apiCustData.customers)) {
              setDbCustomers(apiCustData.customers);
            }
          }
        } catch {}
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
      // Performance optimization: skip network poll when document is backgrounded
      if (typeof document !== 'undefined' && document.hidden) return;

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
      // Poll customers from API to guarantee DB sync
      try {
        const custRes = await fetch('/api/customers');
        if (custRes.ok) {
          const custJson = await custRes.json();
          if (custJson.success && Array.isArray(custJson.customers)) {
            setDbCustomers(custJson.customers);
          }
        }
      } catch {
        // silent poll error
      }
    }, 3500);

    // Instant foreground synchronization when staff re-opens / focuses tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

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

    const customersSubscription = supabase
      .channel('customers-realtime')
      .on('postgres_changes', { event: '*', table: 'customers', schema: 'public' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newCust = payload.new;
          setDbCustomers(prev => {
            const exists = prev.some(c => c.phone === (newCust as any).phone);
            if (exists) {
              return prev.map(c => c.phone === (newCust as any).phone ? newCust : c);
            }
            return [newCust, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedCust = payload.new;
          setDbCustomers(prev => prev.map(c => c.phone === (updatedCust as any).phone ? updatedCust : c));
        } else if (payload.eventType === 'DELETE') {
          const oldCust = payload.old;
          setDbCustomers(prev => prev.filter(c => c.phone !== (oldCust as any).phone));
        }
      })
      .subscribe();

    // Network connection status listeners
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Internet connection restored. Synchronizing live orders...');
      fetchData();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Network disconnected. Operating in offline cached mode.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (eventSource) eventSource.close();
      clearInterval(pollInterval);
      supabase.removeChannel(ordersSubscription);
      supabase.removeChannel(menuSubscription);
      supabase.removeChannel(customersSubscription);
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
      // 1. Update in Supabase
      const { error } = await supabase
        .from('customers')
        .upsert({
          phone,
          name: customerName || 'Guest',
          loyal_vip: nextVip,
          discount: targetDiscount
        }, { onConflict: 'phone' });

      if (error) {
        console.warn('Direct Supabase update warning, syncing via server API:', error.message);
      }

      // 2. Also call backend API to ensure server-side service_role sync
      try {
        await fetch(`/api/customers/${encodeURIComponent(phone)}/vip`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ loyal_vip: nextVip, discount: targetDiscount, name: customerName })
        });
      } catch (apiErr) {
        console.warn('API customer update notice:', apiErr);
      }

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

  const counterOrders = useMemo(() => {
    return filteredOrders.filter(o => o.status === 'pending');
  }, [filteredOrders]);

  const menuCategories = useMemo(() => {
    const cats = new Set<string>();
    menuItems.forEach(item => {
      if (item.category && item.category.trim()) {
        cats.add(item.category.trim());
      }
    });
    return ['all', ...Array.from(cats)];
  }, [menuItems]);

  const filteredMenuItems = useMemo(() => {
    let list = menuItems;
    if (menuCategoryFilter && menuCategoryFilter !== 'all') {
      list = list.filter(item => (item.category || '').toLowerCase().trim() === menuCategoryFilter.toLowerCase().trim());
    }
    if (menuSearch) {
      const query = menuSearch.toLowerCase().trim();
      list = list.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.category.toLowerCase().includes(query)
      );
    }
    return list;
  }, [menuItems, menuSearch, menuCategoryFilter]);

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
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/60 font-bold">Secure Dashboard Entry</p>
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
            
            <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-semibold mt-8">
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
    <div className="flex h-screen w-full bg-black text-white overflow-hidden font-sans select-none">
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex md:w-56 lg:w-60 flex-col justify-between border-r border-white/5 bg-[#0A0A0A] p-4 py-6 z-20 shrink-0">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 shadow-[0_0_20px_rgba(197,160,89,0.1)] shrink-0">
              <Coffee size={20} className="text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg font-bold tracking-tight text-white leading-none">
                Vy<span className="italic text-primary opacity-80">oma</span>
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50 mt-1">POS & KDS</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5 w-full">
            {!isKioskLocked && (
              <>
                <NavItem 
                  icon={<LayoutDashboard size={16} strokeWidth={1.5} />} 
                  label="Counter" 
                  active={activeTab === 'counter'} 
                  onClick={() => setActiveTab('counter')}
                />
                <NavItem 
                  icon={<ChefHat size={16} strokeWidth={1.5} />} 
                  label="Kitchen" 
                  active={activeTab === 'kitchen'} 
                  onClick={() => setActiveTab('kitchen')}
                />
                <NavItem 
                  icon={<PackageCheck size={16} strokeWidth={1.5} />} 
                  label="Pickup" 
                  active={activeTab === 'pickup'} 
                  onClick={() => setActiveTab('pickup')}
                />
                <NavItem 
                  icon={<CreditCard size={16} strokeWidth={1.5} />} 
                  label="Payments" 
                  active={activeTab === 'payments'} 
                  onClick={() => setActiveTab('payments')}
                  badge={waitingForPaymentCount > 0 ? waitingForPaymentCount : undefined}
                />
                <NavItem 
                  icon={<MenuIcon size={16} strokeWidth={1.5} />} 
                  label="Menu" 
                  active={activeTab === 'menu'} 
                  onClick={() => setActiveTab('menu')}
                />
                <NavItem 
                  icon={<Users size={16} strokeWidth={1.5} />} 
                  label="Customers" 
                  active={activeTab === 'customers'} 
                  onClick={() => setActiveTab('customers')}
                />
                <NavItem 
                  icon={<Globe size={16} strokeWidth={1.5} />} 
                  label="Online" 
                  active={activeTab === 'online'} 
                  onClick={() => setActiveTab('online')}
                />
                <NavItem 
                  icon={<FileText size={16} strokeWidth={1.5} />} 
                  label="Invoices" 
                  active={activeTab === 'invoices'} 
                  onClick={() => setActiveTab('invoices')}
                />
              </>
            )}

            <NavItem 
              icon={<Utensils size={16} strokeWidth={1.5} />} 
              label="Captain" 
              active={activeTab === 'captain'} 
              onClick={() => setActiveTab('captain')}
            />
          </nav>
        </div>

        {isKioskLocked && (
          <div className="mt-auto hidden md:flex flex-col items-center gap-2 rounded-2xl bg-red-500/10 border border-red-500/20 p-3.5 text-center">
            <Lock size={16} className="text-red-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Kiosk Mode Locked</span>
            <p className="text-[10px] text-white/60 font-medium">Staff access restricted to Captain View.</p>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        {/* Offline Connection Alert Bar */}
        {!isOnline && (
          <div className="bg-red-500 text-white px-4 py-2 text-xs font-bold flex items-center justify-between z-50 shrink-0 shadow-lg animate-pulse">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-white animate-ping" />
              <span>Offline Mode: Internet connection lost. Serving from local cache.</span>
            </div>
            <button
              onClick={() => fetchData()}
              className="px-3 py-1 bg-black text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider hover:bg-black/80 transition-all cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

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
        <div className="flex md:hidden overflow-x-auto border-b border-white/5 bg-[#0F1014] px-3 py-2.5 gap-2 custom-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('captain')}
            className={`min-h-[38px] px-3.5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center justify-center active:scale-95 ${
              activeTab === 'captain'
                ? 'bg-primary text-black shadow-[0_0_12px_rgba(197,160,89,0.3)]'
                : 'bg-white/5 border border-white/10 text-white/80 hover:text-white'
            }`}
          >
            Captain
          </button>
          {!isKioskLocked && (
            <>
              <button
                onClick={() => setActiveTab('counter')}
                className={`min-h-[38px] px-3.5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center justify-center active:scale-95 ${
                  activeTab === 'counter'
                    ? 'bg-primary text-black shadow-[0_0_12px_rgba(197,160,89,0.3)]'
                    : 'bg-white/5 border border-white/10 text-white/80 hover:text-white'
                }`}
              >
                Counter
              </button>
              <button
                onClick={() => setActiveTab('kitchen')}
                className={`min-h-[38px] px-3.5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center justify-center active:scale-95 ${
                  activeTab === 'kitchen'
                    ? 'bg-primary text-black shadow-[0_0_12px_rgba(197,160,89,0.3)]'
                    : 'bg-white/5 border border-white/10 text-white/80 hover:text-white'
                }`}
              >
                Kitchen
              </button>
              <button
                onClick={() => setActiveTab('pickup')}
                className={`min-h-[38px] px-3.5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center justify-center active:scale-95 ${
                  activeTab === 'pickup'
                    ? 'bg-primary text-black shadow-[0_0_12px_rgba(197,160,89,0.3)]'
                    : 'bg-white/5 border border-white/10 text-white/80 hover:text-white'
                }`}
              >
                Pickup
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`min-h-[38px] flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all active:scale-95 ${
                  activeTab === 'payments'
                    ? 'bg-primary text-black shadow-[0_0_12px_rgba(197,160,89,0.3)]'
                    : 'bg-white/5 border border-white/10 text-white/80 hover:text-white'
                }`}
              >
                <span>Payments</span>
                {waitingForPaymentCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-black text-[8px] font-black">
                    {waitingForPaymentCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('menu')}
                className={`min-h-[38px] px-3.5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center justify-center active:scale-95 ${
                  activeTab === 'menu'
                    ? 'bg-primary text-black shadow-[0_0_12px_rgba(197,160,89,0.3)]'
                    : 'bg-white/5 border border-white/10 text-white/80 hover:text-white'
                }`}
              >
                Menu
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`min-h-[38px] px-3.5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center justify-center active:scale-95 ${
                  activeTab === 'customers'
                    ? 'bg-primary text-black shadow-[0_0_12px_rgba(197,160,89,0.3)]'
                    : 'bg-white/5 border border-white/10 text-white/80 hover:text-white'
                }`}
              >
                Customers
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`min-h-[38px] px-3.5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center justify-center active:scale-95 ${
                  activeTab === 'invoices'
                    ? 'bg-primary text-black shadow-[0_0_12px_rgba(197,160,89,0.3)]'
                    : 'bg-white/5 border border-white/10 text-white/80 hover:text-white'
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
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/60 px-2 mb-1">
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
                    onClick={() => setActiveTab('payments')}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTab === 'payments' ? 'bg-primary text-black' : 'bg-white/5 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard size={16} /> Payments Desk
                    </div>
                    {waitingForPaymentCount > 0 && (
                      <span className="flex h-5 px-2 items-center justify-center rounded-full bg-amber-500 text-black text-[9px] font-black">
                        {waitingForPaymentCount} Due
                      </span>
                    )}
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
          <header className="hidden md:flex h-20 items-center justify-between border-b border-white/10 px-8 backdrop-blur-2xl bg-[#07080C]/80 sticky top-0 z-10 animate-fade-in shrink-0">
            <TabsList className="bg-transparent p-0 gap-6 lg:gap-8">
              <TabsTrigger value="captain" className="text-white/60 hover:text-white/90 data-active:bg-transparent data-active:text-primary data-active:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-primary border-b-2 border-transparent rounded-none h-20 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all">Captain</TabsTrigger>
              {!isKioskLocked && (
                <>
                  <TabsTrigger value="counter" className="text-white/60 hover:text-white/90 data-active:bg-transparent data-active:text-primary data-active:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-primary border-b-2 border-transparent rounded-none h-20 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all">Counter</TabsTrigger>
                  <TabsTrigger value="kitchen" className="text-white/60 hover:text-white/90 data-active:bg-transparent data-active:text-primary data-active:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-primary border-b-2 border-transparent rounded-none h-20 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all">Kitchen</TabsTrigger>
                  <TabsTrigger value="pickup" className="text-white/60 hover:text-white/90 data-active:bg-transparent data-active:text-primary data-active:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-primary border-b-2 border-transparent rounded-none h-20 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all">Pickup</TabsTrigger>
                  <TabsTrigger value="payments" className="text-white/60 hover:text-white/90 data-active:bg-transparent data-active:text-primary data-active:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-primary border-b-2 border-transparent rounded-none h-20 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all flex items-center gap-2">
                    Payments
                    {waitingForPaymentCount > 0 && (
                      <span className="flex h-4 px-1.5 items-center justify-center rounded-full bg-amber-500 text-black text-[9px] font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                        {waitingForPaymentCount}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="menu" className="text-white/60 hover:text-white/90 data-active:bg-transparent data-active:text-primary data-active:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-primary border-b-2 border-transparent rounded-none h-20 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all">Menu</TabsTrigger>
                  <TabsTrigger value="customers" className="text-white/60 hover:text-white/90 data-active:bg-transparent data-active:text-primary data-active:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-primary border-b-2 border-transparent rounded-none h-20 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all">Customers</TabsTrigger>
                  <TabsTrigger value="online" className="text-white/60 hover:text-white/90 data-active:bg-transparent data-active:text-primary data-active:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-primary border-b-2 border-transparent rounded-none h-20 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all">Online Orders</TabsTrigger>
                  <TabsTrigger value="invoices" className="text-white/60 hover:text-white/90 data-active:bg-transparent data-active:text-primary data-active:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-primary border-b-2 border-transparent rounded-none h-20 px-0 text-[10px] font-bold uppercase tracking-[0.25em] transition-all">Invoices</TabsTrigger>
                </>
              )}
            </TabsList>

            <div className="flex items-center gap-6">
              {/* Quick Metrics */}
              <div className="flex items-center gap-6 rounded-2xl border border-white/10 bg-[#0E0F15] px-4 py-2 shadow-inner">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/60">Prepared Today</span>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-primary/70" />
                    <span className="text-lg font-serif text-primary font-mono font-bold">{stats.preparedToday}</span>
                  </div>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/60">Avg Crafting</span>
                  <div className="flex items-center gap-1.5">
                    <Timer size={12} className="text-primary/70" />
                    <span className="text-lg font-serif text-primary font-mono font-bold">{stats.avgTime}</span>
                  </div>
                </div>
              </div>

              {/* Sound Chime Alert Toggle */}
              <button
                type="button"
                onClick={() => {
                  const nextMuted = !isSoundMuted;
                  soundService.setMuted(nextMuted);
                  setIsSoundMuted(nextMuted);
                  toast.info(nextMuted ? 'Kitchen sound alerts muted' : 'Kitchen sound alerts enabled');
                }}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl border transition-all cursor-pointer active:scale-95",
                  isSoundMuted
                    ? "border-white/10 bg-white/5 text-white/40 hover:text-white"
                    : "border-primary/30 bg-primary/10 text-primary shadow-[0_0_15px_rgba(197,160,89,0.15)]"
                )}
                title={isSoundMuted ? "Unmute Kitchen Audio Chimes" : "Mute Kitchen Audio Chimes"}
                aria-label={isSoundMuted ? "Unmute Audio" : "Mute Audio"}
              >
                {isSoundMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>

              {/* Live Connection Status */}
              <div className="flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-primary/90">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse" />
                <span>ONLINE</span>
              </div>
            </div>
          </header>

          <div className="flex-1 min-h-0">
            {/* COUNTER VIEW */}
            <TabsContent value="counter" className="m-0 h-full flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 md:p-8 outline-none data-[state=inactive]:hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 border border-primary/25 text-primary shadow-[0_0_20px_rgba(197,160,89,0.15)] shrink-0">
                    <LayoutDashboard size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">Counter Desk</h2>
                      <span className="flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-blue-400 font-mono">
                        {counterOrders.length} Pending
                      </span>
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 mt-0.5 font-bold">Incoming guest tickets &amp; order verification</p>
                  </div>
                </div>

                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/70 pointer-events-none" />
                  <Input 
                    placeholder="Search Token ID, Name..." 
                    className="pl-11 bg-[#0D0E15] border-white/10 rounded-2xl h-11 text-xs font-semibold tracking-wider focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all text-white placeholder:text-white/40 shadow-inner"
                    value={searchToken}
                    onChange={(e) => setSearchToken(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                <div className="flex flex-col gap-5 pb-10 max-w-4xl mx-auto">
                  <AnimatePresence mode="popLayout">
                    {counterOrders.map((order, index) => (
                      <OrderCard 
                        key={order.id} 
                        order={order} 
                        actionLabel="Start Crafting" 
                        actionIcon={<CheckCircle2 size={15} strokeWidth={2} />}
                        onAction={() => updateOrderStatus(order.id, 'preparing')}
                        variant="pending"
                        index={index}
                        discountInfo={getOrderDiscountInfo(order)}
                      />
                    ))}
                  </AnimatePresence>
                  {counterOrders.length === 0 && (
                    <div className="flex h-72 flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#090A0E] p-8 text-center shadow-xl">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/40 mb-3">
                        <Clock size={28} strokeWidth={1.5} className="text-primary/40" />
                      </div>
                      <h3 className="text-lg font-serif font-bold text-white tracking-tight">No Pending Orders</h3>
                      <p className="text-xs text-white/50 max-w-sm mt-1">
                        All guest tickets have been verified. New orders from Dine-in tables or POS terminals will appear here instantly.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* KITCHEN KDS VIEW */}
            <TabsContent value="kitchen" className="m-0 h-full flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 md:p-8 outline-none data-[state=inactive]:hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)] shrink-0">
                    <ChefHat size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">Kitchen KDS</h2>
                      <span className="flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-amber-400 font-mono">
                        {dineInOrders.filter(o => o.status === 'preparing').length} In Preparation
                      </span>
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 mt-0.5 font-bold">Live culinary cooking stations &amp; fire tickets</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0D0E15] px-4 py-2 shadow-inner">
                    <Utensils size={14} className="text-primary/80" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                      {dineInOrders.filter(o => o.status === 'preparing').reduce((acc, o) => acc + (o.items?.length || 0), 0)} Items Firing
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                <div className="flex flex-col gap-5 pb-10 max-w-4xl mx-auto">
                  <AnimatePresence mode="popLayout">
                    {dineInOrders.filter(o => o.status === 'preparing').map((order, index) => (
                      <OrderCard 
                        key={order.id} 
                        order={order} 
                        actionLabel="Mark Ready" 
                        actionIcon={<CheckCircle2 size={15} strokeWidth={2} />}
                        onAction={() => updateOrderStatus(order.id, 'ready')}
                        variant="preparing"
                        index={index}
                        discountInfo={getOrderDiscountInfo(order)}
                      />
                    ))}
                  </AnimatePresence>
                  {dineInOrders.filter(o => o.status === 'preparing').length === 0 && (
                    <div className="flex h-72 flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#090A0E] p-8 text-center shadow-xl">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                        <CheckCircle2 size={28} />
                      </div>
                      <h3 className="text-lg font-serif font-bold text-white tracking-tight">Kitchen Line Clear</h3>
                      <p className="text-xs text-white/50 max-w-sm mt-1">
                        All active preparations have been completed. Great job chef!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* PICKUP VIEW */}
            <TabsContent value="pickup" className="m-0 h-full flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 md:p-8 outline-none data-[state=inactive]:hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] shrink-0">
                    <PackageCheck size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">Ready for Dispatch</h2>
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-emerald-400 font-mono">
                        {dineInOrders.filter(o => o.status === 'ready').length} Ready
                      </span>
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 mt-0.5 font-bold">Food plated &amp; ready for waiter delivery or guest collection</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                <div className="flex flex-col gap-5 pb-10 max-w-4xl mx-auto">
                  <AnimatePresence mode="popLayout">
                    {dineInOrders.filter(o => o.status === 'ready').map((order, index) => (
                      <OrderCard 
                        key={order.id} 
                        order={order} 
                        actionLabel="Mark Served (Bill)" 
                        actionIcon={<PackageCheck size={15} strokeWidth={2} />}
                        onAction={() => updateOrderStatus(order.id, 'waiting for payment')}
                        variant="ready"
                        index={index}
                        discountInfo={getOrderDiscountInfo(order)}
                      />
                    ))}
                  </AnimatePresence>
                  {dineInOrders.filter(o => o.status === 'ready').length === 0 && (
                    <div className="flex h-72 flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#090A0E] p-8 text-center shadow-xl">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/40 mb-3">
                        <PackageCheck size={28} strokeWidth={1.5} className="text-primary/40" />
                      </div>
                      <h3 className="text-lg font-serif font-bold text-white tracking-tight">No Orders Waiting</h3>
                      <p className="text-xs text-white/50 max-w-sm mt-1">
                        All prepared dishes have been served to guests and moved to billing.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* PAYMENTS VIEW */}
            <TabsContent value="payments" className="m-0 h-full flex flex-col p-0 outline-none data-[state=inactive]:hidden overflow-y-auto custom-scrollbar">
              <PaymentsView 
                orders={orders}
                allOrders={allOrders}
                onUpdateStatus={updateOrderStatus}
                discountPercentage={discountPercentage}
              />
            </TabsContent>

            {/* MENU MANAGEMENT VIEW */}
            <TabsContent value="menu" className="m-0 h-full flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 md:p-8 outline-none data-[state=inactive]:hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 border border-primary/25 text-primary shadow-[0_0_20px_rgba(197,160,89,0.15)] shrink-0">
                    <MenuIcon size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">Menu Catalog</h2>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 mt-0.5 font-bold">Inventory, Pricing &amp; Live Kitchen Availability</p>
                  </div>
                </div>

                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/70 pointer-events-none" />
                  <Input 
                    placeholder="Search Dishes, Categories..." 
                    className="pl-11 bg-[#0D0E15] border-white/10 rounded-2xl h-11 text-xs font-semibold tracking-wider focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all text-white placeholder:text-white/40 shadow-inner"
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 mr-1 shrink-0 flex items-center gap-1">
                  <Filter size={11} className="text-primary" /> Category:
                </span>
                {menuCategories.map(cat => {
                  const isAll = cat === 'all';
                  const count = isAll ? menuItems.length : menuItems.filter(i => (i.category || '').toLowerCase().trim() === cat.toLowerCase().trim()).length;
                  const isActive = menuCategoryFilter === cat;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setMenuCategoryFilter(cat)}
                      className={`rounded-xl px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-primary text-black shadow-[0_0_15px_rgba(197,160,89,0.25)] font-extrabold'
                          : 'bg-[#0E0F16] border border-white/10 text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="capitalize">{cat}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-white/70'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Menu Cards Grid */}
              <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 pb-10">
                  {filteredMenuItems.map((item) => (
                    <Card key={item.id} className="relative bg-[#0E0F16] border border-white/10 rounded-2xl overflow-hidden group hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(197,160,89,0.08)] flex flex-col justify-between">
                      <div className="p-4 sm:p-5 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-16 w-16 flex-shrink-0 rounded-2xl bg-black flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-primary/30 transition-all duration-500">
                            <MenuItemImage src={item.image} name={item.name} category={item.category} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-serif font-bold tracking-tight text-white group-hover:text-primary transition-colors leading-tight line-clamp-1">{item.name}</h4>
                            <span className="text-[9px] text-white/60 uppercase tracking-[0.18em] font-bold mt-1 block">{item.category}</span>
                            <div className="flex items-baseline gap-2 mt-1.5">
                              {item.discount_price && item.discount_price > 0 ? (
                                <>
                                  <span className="text-sm font-bold text-primary font-mono">₹{item.discount_price.toFixed(2)}</span>
                                  <span className="text-[10px] text-white/40 line-through font-mono">₹{item.price.toFixed(2)}</span>
                                </>
                              ) : (
                                <span className="text-sm font-bold text-primary font-mono">₹{(item.price || 0).toFixed(2)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Edit & Availability Controls */}
                      <div className="border-t border-white/5 bg-black/40 px-4 py-2.5 flex items-center justify-between gap-2">
                        <EditMenuItemDialog item={item} onSave={(updates) => updateMenuItem(item.id, updates)} />

                        <button
                          type="button"
                          onClick={() => toggleMenuItemSoldOut(item.id, !item.is_sold_out)}
                          className={cn(
                            "text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border transition-all cursor-pointer",
                            item.is_sold_out 
                              ? "text-red-400 border-red-500/30 bg-red-500/10 hover:bg-red-500/20" 
                              : "text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20"
                          )}
                        >
                          {item.is_sold_out ? "Sold Out" : "In Stock"}
                        </button>
                      </div>
                    </Card>
                  ))}
                  {filteredMenuItems.length === 0 && (
                    <div className="col-span-full flex h-72 flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#090A0E] p-8 text-center">
                      <Search size={36} strokeWidth={1.5} className="mb-3 text-primary/40" />
                      <p className="text-sm font-serif font-bold text-white tracking-tight">No Matching Menu Items</p>
                      <p className="text-xs text-white/50 mt-1">Try selecting another category or clearing your search.</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="customers" className="m-0 h-full flex flex-col gap-6 p-4 sm:p-6 md:p-8 outline-none data-[state=inactive]:hidden overflow-y-auto custom-scrollbar">
              {/* Header & Search */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in flex-shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 border border-primary/25 text-primary shadow-[0_0_20px_rgba(197,160,89,0.15)] shrink-0">
                    <Users size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">Customer Intelligence</h2>
                      <span className="flex items-center gap-1 rounded-full bg-primary/10 border border-primary/30 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-primary font-mono">
                        {computedCustomers.length} Patrons
                      </span>
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 mt-0.5 font-bold">Guest CRM, VIP Membership &amp; Loyalty Rewards</p>
                  </div>
                </div>

                <div className="relative w-full md:w-80">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/70 pointer-events-none" />
                  <Input 
                    placeholder="Search by name, phone..." 
                    className="pl-11 bg-[#0D0E15] border-white/10 rounded-2xl h-11 text-xs font-semibold tracking-wider focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all text-white placeholder:text-white/40 shadow-inner"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 flex-shrink-0">
                <div className="luxury-stat-tile p-4 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-white/60 font-bold">Total Diners</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-serif font-bold text-white font-mono">{computedCustomers.length}</span>
                    <Users size={16} className="text-primary/60" />
                  </div>
                </div>
                <div className="luxury-stat-tile p-4 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-white/60 font-bold">VIP Patrons</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-serif font-bold text-primary font-mono">
                      {computedCustomers.filter(c => c.loyal_vip || c.orderCount >= minOrdersForDiscount).length}
                    </span>
                    <Sparkles size={16} className="text-primary" />
                  </div>
                </div>
                <div className="luxury-stat-tile p-4 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-white/60 font-bold">Total CRM Revenue</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-serif font-bold text-emerald-400 font-mono">
                      ₹{computedCustomers.reduce((acc, c) => acc + c.totalSpent, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                    <TrendingUp size={16} className="text-emerald-400/70" />
                  </div>
                </div>
                <div className="luxury-stat-tile p-4 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-white/60 font-bold">Avg Ticket / Guest</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-serif font-bold text-sky-400 font-mono">
                      ₹{computedCustomers.length > 0 
                        ? (computedCustomers.reduce((acc, c) => acc + c.totalSpent, 0) / Math.max(1, computedCustomers.reduce((acc, c) => acc + c.orderCount, 0))).toFixed(0)
                        : '0'}
                    </span>
                    <Timer size={16} className="text-sky-400/70" />
                  </div>
                </div>
              </div>

              {/* Loyalty Discount Option Panel */}
              <div className="bg-[#0D0E15] border border-white/10 rounded-2xl p-5 md:p-6 shadow-xl animate-fade-in flex-shrink-0">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="space-y-2 lg:max-w-xl">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary">
                        <Sparkles size={12} />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-primary">Automated VIP Checkout Discount</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-serif font-bold tracking-tight text-white">Loyalty Reward Program</h3>
                      <p className="text-xs text-white/70 leading-relaxed">
                        Recognize recurring diners by granting an automated discount at payment settlement once their visit count reaches threshold.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:self-center">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="min-orders-needed" className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/70 ml-1">Min Orders</label>
                        <Input 
                          id="min-orders-needed"
                          type="number"
                          min="1"
                          className="bg-black/60 border-white/15 rounded-xl h-10 w-28 text-center text-xs font-bold text-white font-mono shadow-inner"
                          value={minOrdersForDiscount}
                          onChange={(e) => setMinOrdersForDiscount(Math.max(1, parseInt(e.target.value) || 0))}
                          disabled={!frequentDiscountEnabled}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="discount-pct-input" className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/70 ml-1">Discount (%)</label>
                        <Input 
                          id="discount-pct-input"
                          type="number"
                          min="1"
                          max="100"
                          className="bg-black/60 border-white/15 rounded-xl h-10 w-28 text-center text-xs font-bold text-primary font-mono shadow-inner"
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

                    <div 
                      onClick={toggleFrequentDiscount}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleFrequentDiscount();
                        }
                      }}
                      className="flex items-center gap-3 bg-black/80 hover:bg-black border border-white/15 rounded-xl px-5 py-2.5 h-10 self-center sm:self-auto cursor-pointer select-none transition-all focus-visible:ring-2 focus-visible:ring-primary/50 outline-none"
                    >
                      <span className={cn(
                        "text-[9px] font-extrabold uppercase tracking-[0.2em]",
                        frequentDiscountEnabled ? "text-primary" : "text-white/50"
                      )}>
                        {frequentDiscountEnabled ? "REWARDS ACTIVE" : "DISABLED"}
                      </span>
                      <Switch 
                        id="frequent-discount-switch"
                        checked={frequentDiscountEnabled} 
                        onCheckedChange={toggleFrequentDiscount}
                        className="data-[state=checked]:bg-primary pointer-events-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer List Table */}
              <div className="flex-1 min-h-[450px] border border-white/10 bg-[#0D0E15] rounded-2xl p-4 sm:p-6 shadow-2xl animate-fade-in flex flex-col overflow-hidden">
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="border-b border-white/10 text-[9px] uppercase tracking-[0.2em] text-white/70 font-bold">
                        <th className="px-4 pb-3.5 text-left whitespace-nowrap">Customer Name</th>
                        <th className="px-4 pb-3.5 text-left whitespace-nowrap">Phone Number</th>
                        <th className="px-4 pb-3.5 text-center whitespace-nowrap">Orders</th>
                        <th className="px-4 pb-3.5 text-right whitespace-nowrap">Total Spent</th>
                        <th className="px-4 pb-3.5 text-right whitespace-nowrap">Avg Ticket</th>
                        <th className="px-4 pb-3.5 text-left whitespace-nowrap">Favorite Dish</th>
                        <th className="px-4 pb-3.5 text-left whitespace-nowrap">Tables Visited</th>
                        <th className="px-4 pb-3.5 text-center whitespace-nowrap">VIP Status</th>
                        <th className="px-4 pb-3.5 text-right whitespace-nowrap">Last Visit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
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
                            transition={{ duration: 0.3, delay: Math.min(0.3, idx * 0.02) }}
                            className="group hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="px-4 py-3.5 font-medium text-white whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <span className="font-serif font-bold text-sm text-white/95">{customer.name}</span>
                                {qualifies && (
                                  <span className="text-[8px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30 flex items-center gap-1 shadow-[0_0_10px_rgba(197,160,89,0.15)]">
                                    <Sparkles size={9} /> VIP {customer.discount ? `(${customer.discount}%)` : ''}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 font-mono text-white/80 whitespace-nowrap">
                              {customer.phone ? (
                                <div className="flex items-center gap-2">
                                  <span>{customer.phone}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyValue(customer.phone)}
                                    className="p-1 text-white/40 hover:text-primary hover:bg-white/10 rounded-md cursor-pointer transition-all flex items-center gap-1 active:scale-95"
                                    title="Copy Phone Number"
                                    aria-label={`Copy phone number for ${customer.name}`}
                                  >
                                    {copiedValue === customer.phone ? (
                                      <Check size={12} className="text-emerald-400" />
                                    ) : (
                                      <Copy size={12} />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-white/40 italic">No phone</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                              <span className="inline-flex items-center justify-center h-6 w-10 rounded-full bg-white/5 font-mono text-white/90 font-bold group-hover:bg-primary/15 group-hover:text-primary transition-colors">
                                {customer.orderCount}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono text-primary font-bold whitespace-nowrap">
                              ₹{customer.totalSpent.toFixed(2)}
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono text-white/70 whitespace-nowrap">
                              ₹{avgValue.toFixed(2)}
                            </td>
                            <td className="px-4 py-3.5 text-left text-white/70 whitespace-nowrap">
                              <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-semibold text-white/80">
                                {customer.favoriteItem}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-left text-white/50 max-w-[150px] truncate whitespace-nowrap">
                              {customer.tablesList}
                            </td>
                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleToggleCustomerVip(customer.phone, customer.loyal_vip, customer.name)}
                                disabled={!customer.phone}
                                className={cn(
                                  "px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider transition-all border cursor-pointer active:scale-95",
                                  customer.loyal_vip
                                    ? "bg-primary/20 text-primary border-primary/40 hover:bg-primary/30 shadow-[0_0_10px_rgba(197,160,89,0.2)]"
                                    : "bg-white/5 text-white/50 border-white/10 hover:border-white/25 hover:text-white"
                                )}
                                title={customer.phone ? "Click to toggle Loyal VIP status" : "Phone required to toggle VIP"}
                              >
                                {customer.loyal_vip ? "VIP Active" : "Grant VIP"}
                              </button>
                            </td>
                            <td className="px-4 py-3.5 text-right text-white/50 font-mono whitespace-nowrap">
                              {formattedDate}
                            </td>
                          </motion.tr>
                        );
                      })}

                      {computedCustomers.length === 0 && (
                        <tr>
                          <td colSpan={9} className="py-20 text-center">
                            <Users size={40} strokeWidth={1.5} className="mx-auto mb-3 text-primary/30" />
                            <p className="text-sm font-serif font-bold text-white tracking-tight">No Customers Found</p>
                            <p className="text-xs text-white/50 mt-1">Guest details will be recorded here when orders are placed.</p>
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
        <button 
          type="button"
          aria-label={`Edit ${item.name}`}
          className="h-10 w-10 flex items-center justify-center rounded-full border border-white/10 text-white/60 hover:text-primary hover:border-primary/40 transition-all duration-300 hover:bg-primary/5 cursor-pointer"
        >
          <Edit2 size={14} strokeWidth={1.5} />
        </button>
      </DialogTrigger>
      <DialogContent className="bg-[#0A0A0A] border-white/10 text-white sm:max-w-[480px] rounded-[2rem] p-8 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-3xl font-serif tracking-tight text-white">Edit Item</DialogTitle>
          <DialogDescription className="text-[10px] uppercase tracking-[0.25em] text-white/60 font-bold mt-2">
            Modify menu item specifications & image
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-6">
          <div className="grid gap-3">
            <label htmlFor="name" className="text-[10px] uppercase tracking-[0.2em] text-white/70 ml-1 font-bold">Item Name</label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="bg-black border-white/10 rounded-full h-12 text-xs font-bold uppercase tracking-[0.15em] focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-3">
              <label htmlFor="price" className="text-[10px] uppercase tracking-[0.2em] text-white/70 ml-1 font-bold">Base Price (₹)</label>
              <Input 
                id="price" 
                type="number" 
                step="0.01"
                value={price} 
                onChange={(e) => setPrice(e.target.value)}
                className="bg-black border-white/10 rounded-full h-12 text-xs font-bold uppercase tracking-[0.15em] focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all text-white font-mono"
              />
            </div>
            <div className="grid gap-3">
              <label htmlFor="discount" className="text-[10px] uppercase tracking-[0.2em] text-white/70 ml-1 font-bold">Discount Price (₹)</label>
              <Input 
                id="discount" 
                type="number" 
                step="0.01"
                placeholder="Optional"
                value={discountPrice} 
                onChange={(e) => setDiscountPrice(e.target.value)}
                className="bg-black border-white/10 rounded-full h-12 text-xs font-bold uppercase tracking-[0.15em] focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all text-white placeholder:text-white/40 font-mono"
              />
            </div>
          </div>
          <div className="grid gap-3">
            <label htmlFor="category" className="text-[10px] uppercase tracking-[0.2em] text-white/70 ml-1 font-bold">Category</label>
            <Input 
              id="category" 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="bg-black border-white/10 rounded-full h-12 text-xs font-bold uppercase tracking-[0.15em] focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all text-white"
            />
          </div>
          <div className="grid gap-3">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="image" className="text-[10px] uppercase tracking-[0.2em] text-white/70 font-bold">Image URL</label>
              <span className="text-[9px] uppercase tracking-wider text-primary/80 font-bold">Food Photography</span>
            </div>
            <Input 
              id="image" 
              placeholder="Paste Image URL (https://...)" 
              value={image} 
              onChange={(e) => setImage(e.target.value)}
              className="bg-black border-white/10 rounded-full h-12 text-xs font-mono focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all text-white placeholder:text-white/40"
            />
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="text-[9px] uppercase tracking-wider text-white/50 w-full font-bold">Quick Presets:</span>
              {Object.entries(DEFAULT_CATEGORY_IMAGES).slice(0, 6).map(([key, url]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setImage(url)}
                  className="px-3 py-1 rounded-full bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/40 text-[9px] uppercase font-bold text-white/70 hover:text-primary transition-all cursor-pointer"
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-[1.5rem] bg-black p-5 border border-white/5">
            <div className="space-y-1">
              <label htmlFor="availability-switch" className="text-[10px] uppercase tracking-[0.2em] text-white/70 font-bold cursor-pointer">Availability</label>
              <p className="text-[9px] text-white/50 uppercase tracking-[0.15em] font-bold">Toggle sold out status</p>
            </div>
            <div 
              onClick={() => setIsSoldOut(!isSoldOut)}
              className="flex items-center gap-4 cursor-pointer select-none"
            >
              <span className={cn("text-[9px] font-bold uppercase tracking-[0.2em]", isSoldOut ? "text-red-400 font-bold" : "text-primary/90 font-bold")}>
                {isSoldOut ? "Sold Out" : "Active"}
              </span>
              <Switch 
                id="availability-switch"
                checked={!isSoldOut} 
                onCheckedChange={(checked) => setIsSoldOut(!checked)}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-4">
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-[10px] uppercase tracking-[0.25em] text-white/60 hover:text-white hover:bg-transparent font-bold">Cancel</Button>
          <Button onClick={handleSave} className="bg-primary text-black hover:bg-primary/90 rounded-full px-10 h-14 text-[10px] uppercase tracking-[0.25em] font-bold shadow-[0_0_20px_rgba(197,160,89,0.2)]">
            <Save size={16} className="mr-3" strokeWidth={1.5} />
            Update Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NavItem({ icon, label, badge, active = false, onClick }: { icon: React.ReactNode, label: string, badge?: number | string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        "flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 transition-all duration-200 group relative cursor-pointer active:scale-[0.98]",
        active 
          ? "bg-primary text-black font-extrabold shadow-[0_0_25px_rgba(197,160,89,0.2)]" 
          : "text-white/70 hover:text-white hover:bg-white/5"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={cn("transition-transform duration-200 group-hover:scale-110 shrink-0", active ? "text-black" : "text-primary/80 group-hover:text-primary")}>
          {icon}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.15em] truncate">{label}</span>
      </div>
      {badge !== undefined && Number(badge) > 0 && (
        <span className={cn(
          "flex items-center justify-center rounded-full text-[9px] font-extrabold px-2 py-0.5 min-w-[20px] transition-all",
          active ? "bg-black text-primary" : "bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]"
        )}>
          {badge}
        </span>
      )}
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
  variant?: 'pending' | 'preparing' | 'ready' | 'waiting for payment' | 'completed' | 'cancelled',
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

  const handleGstinChange = (val: string) => {
    setReceiptGstin(val);
    try {
      localStorage.setItem('vyoma_default_gstin', val);
    } catch {
      // Ignore localStorage quotas
    }
  };

  const handleTaxRateChange = (val: number) => {
    setReceiptTaxRate(val);
    try {
      localStorage.setItem('vyoma_default_tax_rate', val.toString());
    } catch {
      // Ignore localStorage quotas
    }
  };

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
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18, ease: "easeOut" } }}
      transition={{ 
        duration: 0.35, 
        delay: Math.min(index * 0.03, 0.18),
        ease: [0.16, 1, 0.3, 1] 
      }}
      className="w-full"
    >
      <Card className={cn(
        "luxury-card overflow-hidden relative group transition-all duration-300 rounded-2xl",
        variant === 'pending' && "border-blue-500/30 shadow-[0_0_25px_rgba(59,130,246,0.1)]",
        variant === 'preparing' && "border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.1)]",
        variant === 'ready' && "border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.1)]",
        isOldReady && "border-primary/50 shadow-[0_0_40px_rgba(197,160,89,0.2)]"
      )}>
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 bg-black/60 px-5 py-3.5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50">TOKEN</span>
            <span className="text-2xl font-serif text-primary tracking-wider font-bold">{order.token}</span>
            {order.table_id && (
              <div className="px-2.5 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-[9px] font-bold uppercase tracking-[0.15em] text-primary whitespace-nowrap shadow-[0_0_10px_rgba(197,160,89,0.1)]">
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

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <span className={cn(
                "h-2 w-2 rounded-full shrink-0",
                variant === 'pending' ? "bg-blue-400 animate-pulse" : 
                variant === 'preparing' ? "bg-amber-400 animate-pulse" : 
                variant === 'waiting for payment' ? "bg-amber-400 animate-pulse" : 
                "bg-emerald-400"
              )} />
              <span className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-white/80">
                {variant === 'waiting for payment' ? 'WAITING FOR PAYMENT' : variant}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[10px] text-white/60 font-bold uppercase tracking-[0.15em] ml-1 font-mono">
              <Clock size={12} strokeWidth={2} className="text-primary/70" />
              {timeAgo(order.created_at)}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="p-4 sm:p-5 flex flex-col justify-between min-w-0 flex-1">
          <div>
            <div className="mb-3">
              <span className="text-lg font-serif text-white block font-bold tracking-tight">{displayCustomerName}</span>
              {isPhoneMasked ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 w-fit text-[10px] text-white/70 tracking-wider font-mono mt-1.5">
                  <ShieldCheck size={11} className="text-primary/70 shrink-0" />
                  <span>Masked Number (Privacy Protected)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-white/80 tracking-wider font-mono">{order.customer_phone}</span>
                  <button
                    type="button"
                    aria-label="Copy customer phone number"
                    onClick={() => {
                      if (order.customer_phone) {
                        navigator.clipboard.writeText(order.customer_phone);
                        toast.success('Customer phone copied!');
                      }
                    }}
                    className="p-1 text-white/40 hover:text-primary rounded transition-colors cursor-pointer"
                    title="Copy Phone"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="space-y-2 bg-black/40 p-3.5 rounded-xl border border-white/10 my-2 shadow-inner">
              {normalizeOrderItems(order.items).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs group/item py-0.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-[10px] font-bold text-primary font-mono">
                      {item.quantity}
                    </span>
                    <span className="text-white/90 group-hover/item:text-white transition-colors tracking-tight font-medium truncate">
                      {item.name}
                    </span>
                  </div>
                  {Number(item.price) > 0 ? (
                    <span className="text-xs font-mono text-primary/90 shrink-0 ml-2 font-bold">₹{(Number(item.price) * (Number(item.quantity) || 1)).toFixed(2)}</span>
                  ) : (
                    <span className="text-[10px] font-mono text-white/40 shrink-0 ml-2 italic">Included</span>
                  )}
                </div>
              ))}
            </div>

            {order.notes && (
              <p className="text-xs italic text-amber-300/90 bg-amber-400/5 border border-amber-400/15 p-2.5 rounded-xl mt-2 font-medium">
                Note: {order.notes}
              </p>
            )}
          </div>

          {/* Bottom Bar: Total Amount & Action Buttons */}
          <div className="border-t border-white/10 pt-4 mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/60 block mb-0.5">Total Amount</span>
              {discountInfo && discountInfo.isDiscounted ? (
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-white/40 line-through font-mono">₹{discountInfo.originalTotal.toFixed(2)}</span>
                    <span className="text-2xl font-serif text-primary font-bold">₹{discountInfo.finalTotal.toFixed(2)}</span>
                  </div>
                  <span className="text-[9px] font-extrabold uppercase text-emerald-400 tracking-wider mt-0.5">
                    {discountInfo.discountPercentage}% VIP Reward Applied
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-serif text-primary font-bold">₹{Number(order.total || 0).toFixed(2)}</span>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap justify-end">
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline"
                    className="border border-white/15 bg-white/5 text-white/80 hover:text-primary hover:border-primary/40 rounded-xl px-4 h-10 text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-300 active:scale-95"
                  >
                    <span className="flex items-center gap-1.5">
                      <Printer size={13} />
                      Receipt
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#0A0A0A] border border-white/10 text-white max-w-[450px] w-full rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-serif font-bold tracking-tight text-white">Receipt Terminal</DialogTitle>
                    <DialogDescription className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-bold mt-1">
                      Print thermal receipt or tax invoice for Token {order.token}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-5 my-5 border-t border-b border-white/10 py-5 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid gap-2">
                      <label htmlFor="receipt-gstin-input" className="text-[10px] uppercase tracking-[0.2em] text-white/70 ml-1 font-bold">GSTIN (India Compliance)</label>
                      <div className="flex gap-2">
                        <Input 
                          id="receipt-gstin-input"
                          placeholder="e.g. 27AAAAA1111A1Z1 (Leave empty if unregistered)" 
                          value={receiptGstin} 
                          onChange={(e) => handleGstinChange(e.target.value)}
                          className="bg-black/60 border-white/15 rounded-xl h-11 text-xs font-mono uppercase tracking-wider focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all placeholder:text-white/30 text-white flex-1"
                        />
                        <Button
                          type="button"
                          onClick={() => handleSaveGstinToDb(receiptGstin)}
                          disabled={isSavingGstin}
                          variant="outline"
                          className="border border-primary/30 hover:border-primary text-primary hover:bg-primary/10 rounded-xl h-11 px-4 text-[9px] uppercase tracking-wider font-bold transition-all shrink-0"
                        >
                          {isSavingGstin ? 'Saving...' : 'Save to DB'}
                        </Button>
                      </div>
                    </div>
                    
                    {receiptGstin && (
                      <div className="grid gap-2 animate-fade-in">
                        <div className="flex justify-between items-center px-1">
                          <label htmlFor="receipt-tax-rate-slider" className="text-[10px] uppercase tracking-[0.2em] text-white/70 font-bold">GST Tax Rate</label>
                          <span className="text-[10px] font-mono font-bold text-primary">{receiptTaxRate}% (CGST {receiptTaxRate/2}% + SGST {receiptTaxRate/2}%)</span>
                        </div>
                        <div className="flex items-center bg-black/60 rounded-xl h-11 px-4 border border-white/15">
                          <input 
                            id="receipt-tax-rate-slider"
                            type="range" 
                            min="0" 
                            max="28" 
                            step="1" 
                            value={receiptTaxRate} 
                            onChange={(e) => handleTaxRateChange(Number(e.target.value))}
                            className="w-full accent-primary bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-white/70 ml-1 font-bold">Receipt Preview</span>
                      <div className="border border-white/10 rounded-xl bg-zinc-100 p-4 max-h-[280px] overflow-y-auto custom-scrollbar flex justify-center shadow-inner">
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
                      className="bg-primary text-black hover:bg-primary/90 rounded-xl px-6 h-12 text-[10px] uppercase tracking-[0.3em] font-extrabold shadow-[0_0_20px_rgba(197,160,89,0.2)] w-full active:scale-95"
                    >
                      <Printer size={15} className="mr-2" />
                      Print Thermal Receipt
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button 
                onClick={onAction}
                className="bg-primary text-black hover:bg-primary/90 rounded-xl px-6 h-10 text-[10px] uppercase tracking-[0.25em] font-extrabold shadow-[0_0_20px_rgba(197,160,89,0.2)] transition-all duration-300 active:scale-95 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {actionIcon}
                  {actionLabel}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
