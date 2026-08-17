import React, { useState, useEffect, useRef } from 'react';
import { Order, MenuItem, OrderStatus } from '@/src/types';
import { 
  Zap, 
  Send, 
  RefreshCw, 
  Globe, 
  Code2, 
  Copy, 
  Check, 
  Terminal, 
  Activity, 
  CheckCircle2, 
  Clock, 
  ShoppingBag, 
  User, 
  Phone, 
  ShieldCheck, 
  Flame, 
  PackageCheck, 
  Trash2,
  Filter,
  ArrowUpRight,
  Sparkles,
  Database
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/src/lib/supabase';
import { syncOrderStatusToPetpooja } from '@/src/lib/orderSync';
import { motion, AnimatePresence } from 'motion/react';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'incoming' | 'outbound' | 'system' | 'error';
  title: string;
  details?: string;
  statusCode?: number;
  payload?: any;
}

interface AdminOnlineOrdersTestBenchProps {
  orders: Order[];
  allOrders: Order[];
  onUpdateStatus?: (orderId: string, status: OrderStatus) => Promise<void>;
  onOrderCreated?: (newOrder: Order) => void;
}

const SAMPLE_SWIGGY_ITEMS = [
  { item_name: "Xtra Loaded Stack Burger", price: 340, quantity: 2 },
  { item_name: "Iced Caramel Macchiato", price: 210, quantity: 1 }
];

const SAMPLE_ZOMATO_ITEMS = [
  { item_name: "Chicken Tandoori Tikka Pizza", price: 460, quantity: 1 },
  { item_name: "Cold Coffee", price: 180, quantity: 1 }
];

export function AdminOnlineOrdersTestBench({
  orders,
  allOrders,
  onUpdateStatus,
  onOrderCreated
}: AdminOnlineOrdersTestBenchProps) {
  // Simulator State
  const [targetUrl, setTargetUrl] = useState('/api/webhooks/petpooja');
  const [source, setSource] = useState<'SWIGGY' | 'ZOMATO'>('SWIGGY');
  const [customerName, setCustomerName] = useState('Aarav Sharma');
  const [customerPhone, setCustomerPhone] = useState('+919876543210');
  const [customItems, setCustomItems] = useState(SAMPLE_SWIGGY_ITEMS);
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastSimulatorResponse, setLastSimulatorResponse] = useState<any>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  
  // Status filter for the rail
  const [railFilter, setRailFilter] = useState<'all' | 'pending' | 'preparing' | 'ready'>('all');

  // Logs stream
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'log-init',
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      type: 'system',
      title: 'Vyoma Admin Simulator Initialized',
      details: 'Strict 2-status loop guard active: IN_KITCHEN | READY_FOR_PICKUP only.'
    }
  ]);

  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newLog: LogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
    };
    setLogs(prev => [...prev, newLog]);
  };

  // Filter orders strictly for online aggregator sources
  const onlineOrders = orders.filter(o => {
    const table = String(o.table_id || '').toUpperCase();
    const token = String(o.token || '').toUpperCase();
    const name = String(o.customer_name || '').toUpperCase();
    const isAggregator = o.order_type === 'aggregator' || 
      table.includes('SWIGGY') || table.includes('ZOMATO') || table.includes('ONLINE') ||
      token.startsWith('SW') || token.startsWith('ZM') ||
      name.includes('SWIGGY') || name.includes('ZOMATO');
    
    if (!isAggregator) return false;
    if (railFilter === 'all') return true;
    return o.status === railFilter;
  });

  // Calculate current payload preview
  const currentTotal = customItems.reduce((sum, it) => sum + (it.price * it.quantity), 0);
  const generatedOrderId = `PP_ONLINE_${Math.floor(1000 + Math.random() * 9000)}`;

  const currentPayload = {
    order_details: {
      order_id: generatedOrderId,
      order_from: source.toLowerCase(),
      customer_name: customerName,
      customer_phone: customerPhone,
      total: currentTotal,
      items: customItems
    }
  };

  const payloadString = JSON.stringify(currentPayload, null, 2);

  const curlString = `curl -X POST "${window.location.origin}${targetUrl}" \\
  -H "Content-Type: application/json" \\
  -H "X-Source: VYOMA_TESTER" \\
  -d '${JSON.stringify(currentPayload)}'`;

  // Simulator Dispatch Function
  const handleFireSimulation = async (selectedSource: 'SWIGGY' | 'ZOMATO') => {
    setIsSimulating(true);
    const now = Date.now();
    const uniqueOrderId = `PP_ONLINE_${Math.floor(1000 + Math.random() * 9000)}`;
    const itemsToUse = selectedSource === 'SWIGGY' ? SAMPLE_SWIGGY_ITEMS : SAMPLE_ZOMATO_ITEMS;
    const total = itemsToUse.reduce((s, it) => s + (it.price * it.quantity), 0);

    const payload = {
      order_details: {
        order_id: uniqueOrderId,
        order_from: selectedSource.toLowerCase(),
        customer_name: selectedSource === 'SWIGGY' ? 'Aarav Sharma (Swiggy)' : 'Rohan Deshmukh (Zomato)',
        customer_phone: '+919876543210',
        total: total,
        items: itemsToUse
      }
    };

    const startTime = performance.now();

    try {
      addLog({
        type: 'incoming',
        title: `📥 Incoming ${selectedSource} Order Dispatched`,
        details: `Simulating webhook injection for order ${uniqueOrderId}`,
        payload
      });

      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Source': 'VYOMA_TESTER'
        },
        body: JSON.stringify(payload)
      });

      const latency = Math.round(performance.now() - startTime);
      const resData = await res.json().catch(() => ({ status: 'non-json-response' }));

      setLastSimulatorResponse({
        httpStatus: res.status,
        ok: res.ok,
        latencyMs: latency,
        data: resData
      });

      if (res.ok) {
        addLog({
          type: 'incoming',
          title: `📥 Incoming Online Order Received (${resData.token || uniqueOrderId})`,
          details: `Order created/upserted in ${latency}ms with status: PENDING`,
          statusCode: res.status,
          payload: resData
        });

        toast.success(`Simulated ${selectedSource} Order Created!`, {
          description: `Token: #${resData.token || uniqueOrderId.slice(-4)} • Latency: ${latency}ms`
        });
      } else {
        addLog({
          type: 'error',
          title: `❌ Webhook Error (${res.status})`,
          details: resData.message || 'Server error processing simulation',
          statusCode: res.status
        });
        toast.error(`Simulation Error (${res.status})`, {
          description: resData.message || 'Webhook failed'
        });
      }
    } catch (err: any) {
      addLog({
        type: 'error',
        title: `❌ Network Connection Error`,
        details: err.message || 'Failed to reach target URL'
      });
      toast.error('Simulation Failed', {
        description: err.message || 'Network error'
      });
    } finally {
      setIsSimulating(false);
    }
  };

  // Status Update Handlers strictly limited to TWO triggers:
  // 1. "Start Crafting" -> IN_KITCHEN
  // 2. "Mark Ready" -> READY_FOR_PICKUP
  const handleUpdateStatusAction = async (order: Order, nextStatus: 'preparing' | 'ready') => {
    const orderSource = String(order.table_id || '').toUpperCase().includes('ZOMATO') ? 'ZOMATO' : 'SWIGGY';
    const outboundActionName = nextStatus === 'preparing' ? 'IN_KITCHEN' : 'READY_FOR_PICKUP';

    try {
      // 1. Update UI state locally and in Supabase
      if (onUpdateStatus) {
        await onUpdateStatus(order.id, nextStatus);
      } else {
        await supabase
          .from('orders')
          .update({ status: nextStatus, updated_at: new Date().toISOString() })
          .eq('id', order.id);
      }

      // 2. Fire Outbound Webhook callback
      const syncResult = await syncOrderStatusToPetpooja({
        orderId: order.id,
        token: order.token,
        status: nextStatus,
        source: orderSource
      });

      addLog({
        type: 'outbound',
        title: `📤 Outbound Callback Fired: ${outboundActionName} (200 OK)`,
        details: `Order #${order.token} synced to ${orderSource} aggregator backend`,
        statusCode: 200,
        payload: syncResult || { order_id: order.token, status: outboundActionName, source: orderSource }
      });

      toast.success(`Status updated to ${outboundActionName}`, {
        description: `Outbound webhook successfully synced to aggregator.`
      });
    } catch (err: any) {
      addLog({
        type: 'error',
        title: `❌ Outbound Sync Failed (${outboundActionName})`,
        details: err.message
      });
      toast.error(`Outbound sync error: ${err.message}`);
    }
  };

  const copyToClipboard = (text: string, type: 'payload' | 'curl') => {
    navigator.clipboard.writeText(text);
    if (type === 'payload') {
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    } else {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    }
    toast.success(`${type === 'payload' ? 'JSON Payload' : 'cURL Command'} copied to clipboard`);
  };

  return (
    <div className="h-full flex flex-col gap-6 p-4 md:p-8 bg-[#070708] text-white overflow-y-auto custom-scrollbar font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(197,160,89,0.15)]">
              <Terminal size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-serif tracking-tight flex items-center gap-2">
                Online Orders Admin Test Suite
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[9px] uppercase tracking-widest font-mono">
                  Petpooja / Swiggy / Zomato
                </Badge>
              </h1>
              <p className="text-xs text-white/40 mt-0.5">
                Two-way webhook simulator, idempotent upsert engine & live status dispatch rail.
              </p>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-emerald-500/30 text-emerald-400 font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Loop Guard: Active</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-primary/30 text-primary font-mono">
            <ShieldCheck size={14} />
            <span>Scope: 2 Triggers Only</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Admin Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT PANE: AGGREGATOR ORDER SIMULATOR (5 cols) ================= */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <Card className="bg-[#0D0E11] border-white/10 rounded-3xl p-5 md:p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Zap size={15} />
                </div>
                <span className="text-sm font-bold uppercase tracking-wider text-white/90">
                  Aggregator Order Simulator
                </span>
              </div>
              <span className="text-[10px] text-white/40 font-mono">POST Payload</span>
            </div>

            {/* Target URL Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
                Target Webhook Endpoint
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="bg-black/60 border-white/10 rounded-xl h-10 text-xs font-mono text-primary focus:border-primary"
                  placeholder="/api/webhooks/petpooja"
                />
              </div>
            </div>

            {/* Preset Trigger Action Buttons */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
                1-Click Simulation Triggers
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Button 1: Swiggy */}
                <button
                  type="button"
                  onClick={() => handleFireSimulation('SWIGGY')}
                  disabled={isSimulating}
                  className="p-3.5 rounded-2xl bg-gradient-to-br from-[#FC8019]/20 to-[#FC8019]/5 border border-[#FC8019]/40 hover:border-[#FC8019] text-white group transition-all text-left cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#FC8019]">Swiggy</span>
                    <Sparkles size={13} className="text-[#FC8019] group-hover:rotate-12 transition-transform" />
                  </div>
                  <p className="text-[10px] text-white/60 font-mono">Simulate Swiggy Order</p>
                  <span className="mt-2 inline-block text-[9px] font-bold uppercase tracking-widest text-[#FC8019] bg-[#FC8019]/20 px-2 py-0.5 rounded-md">
                    2 Items • ₹890
                  </span>
                </button>

                {/* Button 2: Zomato */}
                <button
                  type="button"
                  onClick={() => handleFireSimulation('ZOMATO')}
                  disabled={isSimulating}
                  className="p-3.5 rounded-2xl bg-gradient-to-br from-[#CB202D]/20 to-[#CB202D]/5 border border-[#CB202D]/40 hover:border-[#CB202D] text-white group transition-all text-left cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#CB202D]">Zomato</span>
                    <Sparkles size={13} className="text-[#CB202D] group-hover:rotate-12 transition-transform" />
                  </div>
                  <p className="text-[10px] text-white/60 font-mono">Simulate Zomato Order</p>
                  <span className="mt-2 inline-block text-[9px] font-bold uppercase tracking-widest text-[#CB202D] bg-[#CB202D]/20 px-2 py-0.5 rounded-md">
                    2 Items • ₹640
                  </span>
                </button>
              </div>
            </div>

            {/* Custom Field Customization */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                  Custom Order Parameters
                </span>
                <span className="text-[10px] text-primary font-mono">Unique ID Auto-Generated</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] text-white/40 uppercase font-mono block mb-1">Customer</label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="bg-black/80 border-white/10 rounded-xl h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-white/40 uppercase font-mono block mb-1">Phone</label>
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="bg-black/80 border-white/10 rounded-xl h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Payload & cURL Code Snippets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <Code2 size={13} className="text-primary" />
                  Live JSON Payload Preview
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(payloadString, 'payload')}
                  className="text-[10px] text-primary hover:underline flex items-center gap-1 font-mono cursor-pointer"
                >
                  {copiedPayload ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedPayload ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="p-3 bg-black/90 rounded-2xl text-[10px] font-mono text-emerald-400/90 overflow-x-auto border border-white/10 max-h-36 custom-scrollbar">
                {payloadString}
              </pre>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <Terminal size={13} className="text-amber-400" />
                  cURL Test Command
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(curlString, 'curl')}
                  className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 font-mono cursor-pointer"
                >
                  {copiedCurl ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
                </button>
              </div>
              <pre className="p-3 bg-black/90 rounded-2xl text-[10px] font-mono text-amber-300/80 overflow-x-auto border border-white/10 max-h-24 custom-scrollbar">
                {curlString}
              </pre>
            </div>

            {/* Last Execution Telemetry */}
            {lastSimulatorResponse && (
              <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 text-xs font-mono space-y-1">
                <div className="flex items-center justify-between text-primary font-bold text-[10px] uppercase">
                  <span>Last Simulator Call</span>
                  <span>HTTP {lastSimulatorResponse.httpStatus} ({lastSimulatorResponse.latencyMs}ms)</span>
                </div>
                <div className="text-[10px] text-white/70 truncate">
                  Response: {JSON.stringify(lastSimulatorResponse.data)}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* ================= RIGHT PANE: LIVE ORDERS RAIL & STATUS INSPECTOR (7 cols) ================= */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          
          {/* Live Online Orders Rail */}
          <Card className="bg-[#0D0E11] border-white/10 rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Globe size={15} />
                </div>
                <div>
                  <span className="text-sm font-bold uppercase tracking-wider text-white/90">
                    Live Online Orders Rail
                  </span>
                  <span className="ml-2 text-[10px] font-mono text-primary font-bold">
                    ({onlineOrders.length} Active)
                  </span>
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/5 text-[10px] font-bold uppercase font-mono">
                {(['all', 'pending', 'preparing', 'ready'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setRailFilter(f)}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      railFilter === f ? 'bg-primary text-black font-bold' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Stream */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
              <AnimatePresence mode="popLayout">
                {onlineOrders.map((order) => {
                  const isSwiggy = String(order.table_id || '').toUpperCase().includes('SWIGGY') || String(order.token || '').startsWith('SW');
                  const isZomato = String(order.table_id || '').toUpperCase().includes('ZOMATO') || String(order.token || '').startsWith('ZM');
                  
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 rounded-2xl bg-black/60 border border-white/10 hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-serif font-bold text-white tracking-wide">
                            #{order.token}
                          </span>
                          
                          {/* Aggregator Badge */}
                          {isSwiggy && (
                            <Badge className="bg-[#FC8019]/20 text-[#FC8019] border-[#FC8019]/40 text-[9px] uppercase font-bold tracking-wider">
                              Swiggy
                            </Badge>
                          )}
                          {isZomato && (
                            <Badge className="bg-[#CB202D]/20 text-[#CB202D] border-[#CB202D]/40 text-[9px] uppercase font-bold tracking-wider">
                              Zomato
                            </Badge>
                          )}
                          {!isSwiggy && !isZomato && (
                            <Badge className="bg-primary/20 text-primary border-primary/40 text-[9px] uppercase font-bold tracking-wider">
                              Online
                            </Badge>
                          )}

                          {/* Current Status Badge */}
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                            order.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : order.status === 'preparing'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}>
                            {order.status === 'pending' ? 'PENDING' : order.status === 'preparing' ? 'IN KITCHEN' : 'READY FOR PICKUP'}
                          </span>
                        </div>

                        <div className="text-xs text-white/70 flex items-center gap-3">
                          <span className="text-white/90 font-medium">{order.customer_name || 'Online Customer'}</span>
                          <span className="text-white/30">•</span>
                          <span className="font-mono text-primary font-bold">₹{order.total?.toFixed(2)}</span>
                          <span className="text-white/30">•</span>
                          <span className="text-white/40 text-[10px]">{order.items?.length || 1} items</span>
                        </div>

                        <div className="text-[10px] text-white/40 font-mono">
                          Items: {order.items?.map(it => `${it.quantity}x ${it.name}`).join(', ')}
                        </div>
                      </div>

                      {/* STRICT TWO ACTION BUTTONS */}
                      <div className="flex sm:flex-col items-end gap-2 shrink-0">
                        {order.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatusAction(order, 'preparing')}
                            className="bg-primary hover:bg-primary/90 text-black font-bold h-9 rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(197,160,89,0.2)]"
                          >
                            <Flame size={13} />
                            <span>Start Crafting</span>
                          </Button>
                        )}

                        {order.status === 'preparing' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatusAction(order, 'ready')}
                            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold h-9 rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                          >
                            <PackageCheck size={13} />
                            <span>Mark Ready</span>
                          </Button>
                        )}

                        {order.status === 'ready' && (
                          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono flex items-center gap-1.5">
                            <CheckCircle2 size={13} />
                            <span>Ready for Pickup</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {onlineOrders.length === 0 && (
                <div className="text-center py-12 text-white/30 border border-dashed border-white/10 rounded-2xl">
                  <Globe size={32} className="mx-auto mb-2 opacity-30 text-primary" />
                  <p className="text-xs uppercase tracking-widest font-mono">No active online orders found</p>
                  <p className="text-[10px] text-white/20 mt-1">Use the simulator on the left to inject a test order.</p>
                </div>
              )}
            </div>
          </Card>

          {/* ================= EVENT LOG BOX ================= */}
          <Card className="bg-[#0A0A0B] border-white/10 rounded-3xl p-5 md:p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Activity size={15} className="text-primary animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-white/90">
                  Execution Stream & Event Log
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLogs([])}
                  className="text-[10px] text-white/40 hover:text-red-400 flex items-center gap-1 font-mono transition-colors cursor-pointer"
                  title="Clear Log"
                >
                  <Trash2 size={11} />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Log stream viewport */}
            <div
              ref={logsContainerRef}
              className="h-48 overflow-y-auto custom-scrollbar font-mono text-[11px] space-y-2 pr-2 bg-black/70 p-3.5 rounded-2xl border border-white/5"
            >
              {logs.map((log) => (
                <div 
                  key={log.id} 
                  className={`p-2 rounded-xl border leading-relaxed transition-all ${
                    log.type === 'incoming'
                      ? 'bg-blue-500/5 border-blue-500/20 text-blue-300'
                      : log.type === 'outbound'
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                      : log.type === 'error'
                      ? 'bg-red-500/10 border-red-500/30 text-red-300'
                      : 'bg-white/5 border-white/10 text-white/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="text-white/40">[{log.timestamp}]</span>
                      {log.title}
                    </span>
                    {log.statusCode && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/60 border border-white/10">
                        HTTP {log.statusCode}
                      </span>
                    )}
                  </div>
                  {log.details && (
                    <p className="text-[10px] text-white/50 mt-1 pl-4 border-l border-white/10">
                      {log.details}
                    </p>
                  )}
                </div>
              ))}

              {logs.length === 0 && (
                <div className="text-center py-6 text-white/20 text-xs">
                  Event log is empty. Dispatch a simulation or trigger a status update to inspect live execution.
                </div>
              )}
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
