import React, { useState, useMemo, useEffect } from 'react';
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
  ChefHat,
  Radio,
  Send,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Code,
  ArrowDownToLine,
  ArrowUpRight,
  Zap,
  Trash2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';

export function getOrderPlatform(order: Order): 'swiggy' | 'zomato' | 'other_online' | 'dine_in' {
  if (order.aggregator_platform === 'swiggy') return 'swiggy';
  if (order.aggregator_platform === 'zomato') return 'zomato';

  const tokenUpper = (order.token || '').toUpperCase();
  if (tokenUpper.startsWith('SWI') || tokenUpper.startsWith('SW') || tokenUpper.includes('SWI') || tokenUpper.includes('SWIGGY')) return 'swiggy';
  if (tokenUpper.startsWith('ZOM') || tokenUpper.startsWith('ZM') || tokenUpper.includes('ZOM') || tokenUpper.includes('ZOMATO')) return 'zomato';

  const tableStr = (order.table_id || '').toString().toLowerCase();
  if (tableStr.includes('swiggy') || tableStr.includes('sw_')) return 'swiggy';
  if (tableStr.includes('zomato') || tableStr.includes('zom_')) return 'zomato';

  const name = (order.customer_name || '').toLowerCase();
  const notes = (order.notes || '').toLowerCase();
  const instructions = (order.custom_instructions || '').toLowerCase();
  const fullText = `${name} ${notes} ${instructions} ${tableStr}`;

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

  const [showConfig, setShowConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<'inbound' | 'outbound'>('inbound');
  
  // Outbound Config State
  const [webhookUrl, setWebhookUrl] = useState('');
  const [restaurantId, setRestaurantId] = useState('REST_XTRA_01');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<any>(null);
  const [recentOutboundLogs, setRecentOutboundLogs] = useState<any[]>([]);

  // Inbound Inspection Logs State
  const [recentInboundLogs, setRecentInboundLogs] = useState<any[]>([]);
  const [selectedInboundLog, setSelectedInboundLog] = useState<any | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const inboundWebhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/petpooja` : '/api/webhooks/petpooja';

  // Fetch active webhook configuration and logs
  const fetchWebhookConfig = async () => {
    try {
      const res = await fetch('/api/orders/webhook-config');
      if (res.ok) {
        const data = await res.json();
        if (data.outbound_webhook_url) {
          setWebhookUrl(data.outbound_webhook_url);
        }
        if (data.restaurant_id) {
          setRestaurantId(data.restaurant_id);
        }
      }
    } catch (e) {
      console.warn('Could not load webhook config:', e);
    }
  };

  const fetchOutboundLogs = async () => {
    try {
      const res = await fetch('/api/orders/webhook-logs');
      if (res.ok) {
        const data = await res.json();
        setRecentOutboundLogs(data.logs || []);
      }
    } catch (e) {
      console.warn('Could not load outbound webhook logs:', e);
    }
  };

  const fetchInboundLogs = async () => {
    try {
      const res = await fetch('/api/webhooks/logs');
      if (res.ok) {
        const data = await res.json();
        setRecentInboundLogs(data.logs || []);
      }
    } catch (e) {
      console.warn('Could not load inbound webhook logs:', e);
    }
  };

  const refreshAllLogs = () => {
    fetchOutboundLogs();
    fetchInboundLogs();
  };

  useEffect(() => {
    fetchWebhookConfig();
    refreshAllLogs();

    // Listen to real-time webhook logs via EventSource
    let es: EventSource | null = null;
    let errorCount = 0;
    try {
      es = new EventSource('/api/orders/events');
      es.addEventListener('webhook_log', (event: MessageEvent) => {
        try {
          const log = JSON.parse(event.data);
          setRecentInboundLogs(prev => [log, ...prev.slice(0, 49)]);
        } catch {
          // ignore
        }
      });
      es.addEventListener('outbound_log', (event: MessageEvent) => {
        try {
          const log = JSON.parse(event.data);
          setRecentOutboundLogs(prev => [log, ...prev.slice(0, 49)]);
        } catch {
          // ignore
        }
      });
      es.onerror = () => {
        errorCount++;
        if (errorCount > 3 && es) {
          // If SSE is unavailable (e.g. static host/Vercel without SSE streaming), close gracefully to avoid reconnect loops
          es.close();
        }
      };
    } catch {
      // ignore
    }

    return () => {
      if (es) es.close();
    };
  }, []);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(inboundWebhookUrl);
    setCopiedUrl(true);
    toast.success('Inbound Webhook URL copied to clipboard!');
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleClearInboundLogs = async () => {
    try {
      await fetch('/api/webhooks/logs', { method: 'DELETE' });
      setRecentInboundLogs([]);
      setSelectedInboundLog(null);
      toast.success('Inbound inspection logs cleared');
    } catch (e: any) {
      toast.error('Failed to clear logs: ' + e.message);
    }
  };

  const handleSimulateQuickOrder = async (platform: 'swiggy' | 'zomato') => {
    setIsSimulating(true);
    const token = Math.floor(1000 + Math.random() * 9000).toString();
    const isSwiggy = platform === 'swiggy';
    
    const testPayload = {
      order_details: {
        order_id: isSwiggy ? `SWIGGY_${token}` : `ZOMATO_${token}`,
        token,
        order_from: platform.toUpperCase(),
        status: 'in_kitchen',
        customer_name: isSwiggy ? 'Swiggy Express Customer' : 'Zomato Gold Member',
        customer_phone: '+919876543210',
        table_id: `${platform.toUpperCase()} Online`,
        total: isSwiggy ? 540 : 680,
        items: [
          {
            item_id: 'item-101',
            item_name: isSwiggy ? 'Paneer Butter Masala Combo' : 'Chicken Tikka Biryani Box',
            price: isSwiggy ? 320 : 420,
            quantity: 1,
            notes: 'Extra spicy, cutlery included'
          },
          {
            item_id: 'item-102',
            item_name: 'Garlic Butter Naan (2 pcs)',
            price: isSwiggy ? 120 : 160,
            quantity: 1
          },
          {
            item_id: 'item-103',
            item_name: 'Gulab Jamun Dessert',
            price: 100,
            quantity: 1
          }
        ],
        notes: `Simulated live ${platform.toUpperCase()} test order`
      }
    };

    try {
      const res = await fetch('/api/webhooks/petpooja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });
      const data = await res.json();
      if (res.ok && (data.success === '1' || data.success === true || data.status === 'success')) {
        toast.success(`🎉 Test ${platform.toUpperCase()} Order #${token} Ingested Successfully!`, {
          description: `Order verified and active in kitchen queue.`
        });
        refreshAllLogs();
      } else {
        toast.error(`Simulation failed: ${data.message || 'Unknown error'}`);
      }
    } catch (e: any) {
      toast.error(`Simulation error: ${e.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      const res = await fetch('/api/orders/webhook-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outbound_webhook_url: webhookUrl,
          restaurant_id: restaurantId
        })
      });
      if (res.ok) {
        toast.success('Outbound Webhook URL saved successfully!');
      } else {
        toast.error('Failed to save Webhook configuration');
      }
    } catch (err: any) {
      toast.error(`Error saving config: ${err.message}`);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSendTestPing = async () => {
    setIsTestingPing(true);
    setPingResult(null);
    try {
      const res = await fetch('/api/orders/test-ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_url: webhookUrl || undefined,
          status: 'IN_KITCHEN',
          source: 'SWIGGY'
        })
      });
      const data = await res.json();
      setPingResult(data);
      if (data.success) {
        toast.success(`Ping delivered successfully (HTTP ${data.details?.http_status})`);
      } else {
        toast.error(`Ping failed: ${data.details?.error || data.message}`);
      }
      fetchOutboundLogs();
    } catch (err: any) {
      toast.error(`Failed to send ping: ${err.message}`);
      setPingResult({ success: false, message: err.message });
    } finally {
      setIsTestingPing(false);
    }
  };

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
              Swiggy & Zomato Live
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 mt-1 sm:mt-2 font-bold">
            Aggregator integration & dispatch desk
          </p>
        </div>

        {/* Webhook & Tester Control Action */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setShowConfig(!showConfig);
              refreshAllLogs();
            }}
            className={`rounded-full h-10 px-4 text-[10px] font-bold uppercase tracking-widest transition-all border ${
              showConfig 
                ? 'bg-primary text-black border-primary' 
                : 'bg-black/60 text-white/80 border-white/10 hover:border-primary/40 hover:text-white'
            }`}
          >
            <Radio size={14} className={`mr-2 ${showConfig ? 'animate-pulse text-black' : 'text-primary'}`} />
            Tester & Webhook Inspector
            {showConfig ? <ChevronUp size={14} className="ml-2" /> : <ChevronDown size={14} className="ml-2" />}
          </Button>
        </div>
      </div>

      {/* Webhook & Tester Setup Drawer Panel */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="bg-[#0D0D0D] border border-primary/30 rounded-3xl p-4 sm:p-6 shadow-2xl relative">
              {/* Header with Tabs */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Aggregator & Tester Webhook Center
                    </h3>
                  </div>
                  <p className="text-xs text-white/40 mt-1">
                    Inspect incoming order webhooks from your tester or configure status updates dispatch.
                  </p>
                </div>
                
                {/* Tab Switcher */}
                <div className="flex items-center bg-black/60 p-1 rounded-2xl border border-white/10 gap-1 self-stretch md:self-auto">
                  <button
                    onClick={() => setActiveTab('inbound')}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTab === 'inbound'
                        ? 'bg-primary text-black shadow-[0_0_15px_rgba(197,160,89,0.25)]'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <ArrowDownToLine size={14} />
                    <span>Inbound Webhooks ({recentInboundLogs.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('outbound')}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTab === 'outbound'
                        ? 'bg-primary text-black shadow-[0_0_15px_rgba(197,160,89,0.25)]'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <ArrowUpRight size={14} />
                    <span>Outbound Callbacks ({recentOutboundLogs.length})</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: INBOUND WEBHOOKS & TESTER RECEIVER */}
              {activeTab === 'inbound' && (
                <div className="mt-5 flex flex-col gap-5">
                  {/* Webhook Endpoint Banner */}
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
                          Live Inbound Webhook URL (Paste into Tester App)
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                          HTTP 200 Ready
                        </span>
                      </div>
                      <code className="text-xs sm:text-sm font-mono text-white bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 select-all break-all">
                        {inboundWebhookUrl}
                      </code>
                      <span className="text-[10px] text-white/40 mt-0.5">
                        Accepts POST requests formatted as Petpooja, Zomato, Swiggy, or generic JSON payloads.
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <Button
                        onClick={handleCopyUrl}
                        className="bg-primary text-black hover:bg-primary/90 font-bold text-xs uppercase tracking-wider h-10 px-4 rounded-xl"
                      >
                        {copiedUrl ? <Check size={14} className="mr-1.5" /> : <Copy size={14} className="mr-1.5" />}
                        {copiedUrl ? 'Copied URL!' : 'Copy Webhook URL'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={fetchInboundLogs}
                        className="h-10 px-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 border-white/10 text-white/70 hover:text-white"
                      >
                        <RefreshCw size={12} className="mr-1.5" /> Refresh
                      </Button>
                    </div>
                  </div>

                  {/* Quick Simulation Buttons */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Zap size={14} className="text-amber-400" />
                      <span>Need instant test orders? Click to simulate direct webhook payload:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleSimulateQuickOrder('swiggy')}
                        disabled={isSimulating}
                        size="sm"
                        className="h-8 rounded-xl bg-[#FC8019] hover:bg-[#FC8019]/90 text-white text-[10px] font-bold uppercase tracking-wider px-3"
                      >
                        + Test Swiggy Order
                      </Button>
                      <Button
                        onClick={() => handleSimulateQuickOrder('zomato')}
                        disabled={isSimulating}
                        size="sm"
                        className="h-8 rounded-xl bg-[#E23744] hover:bg-[#E23744]/90 text-white text-[10px] font-bold uppercase tracking-wider px-3"
                      >
                        + Test Zomato Order
                      </Button>
                    </div>
                  </div>

                  {/* Inbound Logs Table & Inspector */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                        Inbound Webhook Requests Stream (Last {recentInboundLogs.length})
                      </span>
                      {recentInboundLogs.length > 0 && (
                        <button
                          onClick={handleClearInboundLogs}
                          className="flex items-center gap-1 text-[10px] text-red-400/80 hover:text-red-400 cursor-pointer font-bold uppercase tracking-wider"
                        >
                          <Trash2 size={12} /> Clear Logs
                        </button>
                      )}
                    </div>

                    {recentInboundLogs.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        {/* Table */}
                        <div className="lg:col-span-7 max-h-64 overflow-y-auto custom-scrollbar border border-white/5 rounded-2xl bg-black/40">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-white/5 text-[9px] uppercase tracking-wider text-white/40 sticky top-0">
                              <tr>
                                <th className="py-2.5 px-3">Time</th>
                                <th className="py-2.5 px-3">Source</th>
                                <th className="py-2.5 px-3">Token</th>
                                <th className="py-2.5 px-3">Items</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3 text-right">Inspect</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                              {recentInboundLogs.map((log) => (
                                <tr
                                  key={log.id}
                                  onClick={() => setSelectedInboundLog(log)}
                                  className={`hover:bg-white/[0.03] cursor-pointer transition-colors ${
                                    selectedInboundLog?.id === log.id ? 'bg-primary/10 border-l-2 border-primary' : ''
                                  }`}
                                >
                                  <td className="py-2.5 px-3 text-white/40 text-[10px]">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-sans ${
                                      log.detected_source === 'SWIGGY' ? 'bg-[#FC8019]/20 text-[#FC8019]' :
                                      log.detected_source === 'ZOMATO' ? 'bg-[#E23744]/20 text-[#E23744]' :
                                      'bg-primary/20 text-primary'
                                    }`}>
                                      {log.detected_source}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 font-bold text-white">
                                    #{log.token || log.order_id || 'N/A'}
                                  </td>
                                  <td className="py-2.5 px-3 text-white/70">
                                    {log.item_count} items (₹{log.total_amount})
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                      log.success 
                                        ? 'bg-emerald-500/20 text-emerald-400' 
                                        : 'bg-red-500/20 text-red-400'
                                    }`}>
                                      HTTP {log.status_code}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    <button className="text-[10px] text-primary hover:underline font-bold">
                                      View JSON
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Payload Viewer Drawer */}
                        <div className="lg:col-span-5 max-h-64 overflow-y-auto custom-scrollbar border border-white/10 rounded-2xl bg-black p-3.5 text-xs">
                          {selectedInboundLog ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                                <div className="flex items-center gap-2">
                                  <Code size={14} className="text-primary" />
                                  <span className="font-bold text-white text-[11px]">
                                    Payload #{selectedInboundLog.token || selectedInboundLog.order_id}
                                  </span>
                                </div>
                                <span className="text-[10px] text-white/40">
                                  {selectedInboundLog.duration_ms}ms latency
                                </span>
                              </div>
                              <pre className="font-mono text-[10px] text-white/80 bg-white/[0.02] p-2.5 rounded-xl overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(selectedInboundLog.raw_body, null, 2)}
                              </pre>
                            </div>
                          ) : (
                            <div className="flex h-full min-h-[140px] items-center justify-center text-center text-white/30 text-xs">
                              Click any inbound webhook entry on the left to inspect its complete JSON payload.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs text-white/30 border border-white/5 rounded-2xl bg-black/20 flex flex-col items-center justify-center gap-2">
                        <ArrowDownToLine size={24} className="text-white/20" />
                        <span>No inbound webhook requests received yet. Send orders from your tester app to the URL above.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: OUTBOUND STATUS CALLBACKS */}
              {activeTab === 'outbound' && (
                <div className="mt-5 flex flex-col gap-5">
                  {/* URL Input & Test Ping Controls */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-8 flex flex-col gap-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
                        Target Tester Callback URL (PETPOOJA_OUTBOUND_WEBHOOK_URL)
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="e.g. https://your-tester-app.run.app/api/pos-callback"
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          className="bg-black border-white/10 rounded-xl h-11 text-xs text-white font-mono focus-visible:ring-primary/20"
                        />
                        <Button
                          onClick={handleSaveConfig}
                          disabled={isSavingConfig}
                          className="bg-primary text-black hover:bg-primary/90 font-bold text-[10px] uppercase tracking-wider h-11 px-5 rounded-xl shrink-0"
                        >
                          {isSavingConfig ? 'Saving...' : 'Save URL'}
                        </Button>
                      </div>
                      <span className="text-[10px] text-white/30">
                        Tip: When kitchen/captain changes order status in Vyoma POS, status updates are signed with HMAC-SHA256 and sent here.
                      </span>
                    </div>

                    <div className="lg:col-span-4 flex flex-col justify-end gap-2">
                      <Button
                        onClick={handleSendTestPing}
                        disabled={isTestingPing || !webhookUrl}
                        variant="outline"
                        className="h-11 rounded-xl border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-black text-[10px] font-bold uppercase tracking-wider transition-all"
                      >
                        <Send size={14} className={`mr-2 ${isTestingPing ? 'animate-spin' : ''}`} />
                        {isTestingPing ? 'Dispatching Ping...' : 'Send Live Test Ping'}
                      </Button>
                    </div>
                  </div>

                  {/* Ping Result Banner */}
                  {pingResult && (
                    <div className={`p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between gap-3 ${
                      pingResult.success 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                        : 'bg-red-500/10 border-red-500/30 text-red-300'
                    }`}>
                      <div className="flex items-center gap-2 overflow-hidden text-ellipsis">
                        {pingResult.success ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
                        <span>{pingResult.message}</span>
                      </div>
                      {pingResult.details?.duration_ms && (
                        <span className="text-[10px] opacity-70 shrink-0 font-sans">
                          Latency: {pingResult.details.duration_ms}ms
                        </span>
                      )}
                    </div>
                  )}

                  {/* Recent Dispatches Log Table */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                        Recent Outbound Dispatches (Last {recentOutboundLogs.length})
                      </span>
                      <span className="text-[10px] text-white/30">
                        Automatically sent on status changes
                      </span>
                    </div>

                    {recentOutboundLogs.length > 0 ? (
                      <div className="max-h-48 overflow-y-auto custom-scrollbar border border-white/5 rounded-xl bg-black/40">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-white/5 text-[9px] uppercase tracking-wider text-white/40 sticky top-0">
                            <tr>
                              <th className="py-2 px-3">Time</th>
                              <th className="py-2 px-3">Order ID</th>
                              <th className="py-2 px-3">Platform</th>
                              <th className="py-2 px-3">Status Sent</th>
                              <th className="py-2 px-3">HTTP Result</th>
                              <th className="py-2 px-3 text-right">Latency</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                            {recentOutboundLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-white/[0.02]">
                                <td className="py-2 px-3 text-white/40 text-[10px]">
                                  {new Date(log.timestamp).toLocaleTimeString()}
                                </td>
                                <td className="py-2 px-3 font-bold text-white">
                                  {log.order_id}
                                </td>
                                <td className="py-2 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-sans ${
                                    log.source === 'SWIGGY' ? 'bg-[#FC8019]/20 text-[#FC8019]' :
                                    log.source === 'ZOMATO' ? 'bg-[#E23744]/20 text-[#E23744]' :
                                    'bg-primary/20 text-primary'
                                  }`}>
                                    {log.source}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-white/80">
                                  {log.status}
                                </td>
                                <td className="py-2 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                    log.success 
                                      ? 'bg-emerald-500/20 text-emerald-400' 
                                      : 'bg-red-500/20 text-red-400'
                                  }`}>
                                    {log.http_status}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right text-white/40 text-[10px]">
                                  {log.duration_ms}ms
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-white/30 border border-white/5 rounded-xl bg-black/20">
                        No status updates dispatched yet. Click "Send Live Test Ping" or transition an order status to test.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/70" />
          <Input 
            placeholder="Search Token, Swiggy/Zomato ID..." 
            className="pl-11 bg-black border-white/10 rounded-full h-11 text-[10px] font-bold uppercase tracking-[0.2em] focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all text-white placeholder:text-white/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Platform & Status Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Platform Pills */}
          <div className="flex items-center bg-black p-1 rounded-full border border-white/10 gap-1">
            <button
              onClick={() => setPlatformFilter('all')}
              className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
                platformFilter === 'all' ? 'bg-primary text-black font-extrabold shadow-[0_0_10px_rgba(197,160,89,0.3)]' : 'text-white/70 hover:text-white'
              }`}
            >
              All Channels
            </button>
            <button
              onClick={() => setPlatformFilter('swiggy')}
              className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
                platformFilter === 'swiggy' ? 'bg-[#FC8019] text-white font-extrabold shadow-[0_0_10px_rgba(252,128,25,0.4)]' : 'text-[#FC8019]/80 hover:text-[#FC8019]'
              }`}
            >
              Swiggy
            </button>
            <button
              onClick={() => setPlatformFilter('zomato')}
              className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
                platformFilter === 'zomato' ? 'bg-[#E23744] text-white font-extrabold shadow-[0_0_10px_rgba(226,55,68,0.4)]' : 'text-[#E23744]/80 hover:text-[#E23744]'
              }`}
            >
              Zomato
            </button>
          </div>

          {/* Status Pills */}
          <div className="flex items-center bg-black p-1 rounded-full border border-white/10 gap-1">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
                statusFilter === 'active' ? 'bg-white/20 text-white font-extrabold' : 'text-white/70 hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('all_history')}
              className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
                statusFilter === 'all_history' ? 'bg-white/20 text-white font-extrabold' : 'text-white/70 hover:text-white'
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
            <Globe size={40} strokeWidth={1} className="mb-4 text-primary/30" />
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/80 font-bold mb-2">No Online Orders Found</p>
            <p className="text-xs text-white/60 max-w-md mb-4">
              {searchQuery || platformFilter !== 'all' || statusFilter !== 'active'
                ? 'No online orders match your active search or filter criteria.'
                : 'Swiggy and Zomato orders sent to your webhook URL or placed via the tester will appear here in real-time.'}
            </p>
            {(searchQuery || platformFilter !== 'all' || statusFilter !== 'active') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setPlatformFilter('all');
                  setStatusFilter('active');
                }}
                className="rounded-full border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-black text-[10px] font-bold uppercase tracking-wider h-9 px-4 transition-all"
              >
                <RefreshCw size={12} className="mr-2" /> Reset Filters & Search
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
