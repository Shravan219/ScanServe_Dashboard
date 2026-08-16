import React, { useState } from 'react';
import { 
  Webhook, 
  Send, 
  Copy, 
  Check, 
  Zap, 
  Code2, 
  User, 
  Phone, 
  ShoppingBag, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface SimulateOrderModalProps {
  trigger?: React.ReactNode;
}

const SAMPLE_ZOMATO_ITEMS = [
  { item_name: "Chicken Tandoori Tikka Pizza", price: 460, quantity: 1 },
  { item_name: "Cold Coffee", price: 180, quantity: 1 }
];

const SAMPLE_SWIGGY_ITEMS = [
  { item_name: "Xtra Loaded Stack Burger", price: 340, quantity: 2 },
  { item_name: "Iced Caramel Macchiato", price: 210, quantity: 1 }
];

export function SimulateOrderModal({ trigger }: SimulateOrderModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Form state
  const [aggregator, setAggregator] = useState<'zomato' | 'swiggy'>('zomato');
  const [customerName, setCustomerName] = useState('Rohan Deshmukh');
  const [customerPhone, setCustomerPhone] = useState('+919876543210');
  const [orderId, setOrderId] = useState(() => `PP-${Math.floor(1000 + Math.random() * 9000)}`);
  
  // Active payload preview
  const items = aggregator === 'zomato' ? SAMPLE_ZOMATO_ITEMS : SAMPLE_SWIGGY_ITEMS;
  const total = items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

  const payload = {
    order_details: {
      order_id: orderId,
      order_from: aggregator,
      customer_name: customerName,
      customer_phone: customerPhone,
      total: total,
      items: items
    }
  };

  const payloadString = JSON.stringify(payload, null, 2);

  const curlCommand = `curl -X POST "${window.location.origin}/api/webhooks/petpooja" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload)}'`;

  const handleSendWebhook = async (overridePayload?: any) => {
    setLoading(true);
    const bodyToSend = overridePayload || payload;
    try {
      const response = await fetch('/api/webhooks/petpooja', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyToSend),
      });

      const resData = await response.json();

      if (response.ok && resData.success === "1") {
        toast.success(
          `Webhook Delivered: ${resData.token || 'Order Created'}`,
          {
            description: `Simulated ${bodyToSend.order_details.order_from.toUpperCase()} order successfully injected into KDS!`,
          }
        );
        // Regenerate random order ID for next test
        setOrderId(`PP-${Math.floor(1000 + Math.random() * 9000)}`);
      } else {
        toast.error('Webhook Delivery Failed', {
          description: resData.message || 'Server responded with an error',
        });
      }
    } catch (err: any) {
      console.error('Failed to trigger webhook:', err);
      toast.error('Webhook Network Error', {
        description: err?.message || 'Could not connect to /api/webhooks/petpooja',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSimulate = (source: 'zomato' | 'swiggy') => {
    const quickItems = source === 'zomato' ? SAMPLE_ZOMATO_ITEMS : SAMPLE_SWIGGY_ITEMS;
    const quickTotal = quickItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const id = `PP-${Math.floor(1000 + Math.random() * 9000)}`;

    const quickPayload = {
      order_details: {
        order_id: id,
        order_from: source,
        customer_name: source === 'zomato' ? 'Rohan Deshmukh' : 'Ananya Verma',
        customer_phone: source === 'zomato' ? '+919876543210' : '+919812345678',
        total: quickTotal,
        items: quickItems
      }
    };

    handleSendWebhook(quickPayload);
  };

  const handleCopy = (text: string, isCurl: boolean) => {
    navigator.clipboard.writeText(text);
    if (isCurl) {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } else {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
    toast.success(isCurl ? 'cURL Command Copied!' : 'JSON Payload Copied!');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            variant="outline" 
            className="flex items-center gap-2.5 bg-[#0A0A0A] hover:bg-white/5 border-primary/20 text-primary hover:text-primary rounded-full px-4 h-10 text-[10px] font-bold uppercase tracking-[0.18em] transition-all cursor-pointer shadow-[0_0_20px_rgba(197,160,89,0.05)]"
          >
            <Webhook size={14} className="text-primary animate-pulse" />
            <span>Simulate Order</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl bg-[#0B0C0E] border-white/10 text-white rounded-[2rem] p-6 md:p-8 shadow-2xl overflow-hidden font-sans">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              <Webhook size={18} />
            </div>
            <div>
              <DialogTitle className="text-xl font-serif text-white tracking-tight flex items-center gap-2">
                Webhook Aggregator Simulator
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[9px] uppercase tracking-wider font-mono">
                  Petpooja / Deliverect API
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-white/40">
                Simulate real-time online order injection from Zomato and Swiggy into Vyoma.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Quick Simulation Buttons */}
        <div className="grid grid-cols-2 gap-4 mt-2">
          <button
            type="button"
            onClick={() => handleQuickSimulate('zomato')}
            disabled={loading}
            className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[#CB202D]/15 to-[#CB202D]/5 border border-[#CB202D]/30 hover:border-[#CB202D]/60 text-white group transition-all text-left cursor-pointer active:scale-98"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#CB202D]">Zomato</span>
                <Sparkles size={12} className="text-[#CB202D] opacity-70" />
              </div>
              <p className="text-[10px] text-white/50 mt-1">Simulate ZOM-9821 Order</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-[#CB202D]/20 flex items-center justify-center text-[#CB202D] group-hover:scale-110 transition-transform">
              <Zap size={16} />
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickSimulate('swiggy')}
            disabled={loading}
            className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[#FC8019]/15 to-[#FC8019]/5 border border-[#FC8019]/30 hover:border-[#FC8019]/60 text-white group transition-all text-left cursor-pointer active:scale-98"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FC8019]">Swiggy</span>
                <Sparkles size={12} className="text-[#FC8019] opacity-70" />
              </div>
              <p className="text-[10px] text-white/50 mt-1">Simulate SWI-4412 Order</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-[#FC8019]/20 flex items-center justify-center text-[#FC8019] group-hover:scale-110 transition-transform">
              <Zap size={16} />
            </div>
          </button>
        </div>

        {/* Customized Payload Configuration */}
        <Tabs defaultValue="configure" className="mt-4">
          <TabsList className="bg-black/50 border border-white/5 rounded-full p-1 h-10 w-full grid grid-cols-2">
            <TabsTrigger value="configure" className="rounded-full text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              Customize Fields
            </TabsTrigger>
            <TabsTrigger value="payload" className="rounded-full text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              Payload Preview & cURL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configure" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-white/40 mb-1.5 block">
                  Aggregator Source
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAggregator('zomato')}
                    className={`h-10 rounded-xl text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all ${
                      aggregator === 'zomato' 
                        ? 'bg-[#CB202D]/20 text-[#CB202D] border-[#CB202D]/50' 
                        : 'bg-white/5 text-white/40 border-white/5 hover:border-white/10'
                    }`}
                  >
                    Zomato
                  </button>
                  <button
                    type="button"
                    onClick={() => setAggregator('swiggy')}
                    className={`h-10 rounded-xl text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all ${
                      aggregator === 'swiggy' 
                        ? 'bg-[#FC8019]/20 text-[#FC8019] border-[#FC8019]/50' 
                        : 'bg-white/5 text-white/40 border-white/5 hover:border-white/10'
                    }`}
                  >
                    Swiggy
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-white/40 mb-1.5 block">
                  Petpooja Order ID
                </label>
                <div className="relative">
                  <Input 
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="bg-black/40 border-white/10 rounded-xl h-10 text-xs font-mono pr-10"
                  />
                  <button 
                    type="button"
                    onClick={() => setOrderId(`PP-${Math.floor(1000 + Math.random() * 9000)}`)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/80 p-1"
                    title="Randomize ID"
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-white/40 mb-1.5 block">
                  Customer Name
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <Input 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="bg-black/40 border-white/10 rounded-xl h-10 text-xs pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-white/40 mb-1.5 block">
                  Customer Phone
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <Input 
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="bg-black/40 border-white/10 rounded-xl h-10 text-xs font-mono pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-white/40 flex items-center gap-1.5">
                  <ShoppingBag size={12} />
                  Included Mock Items
                </span>
                <span className="text-xs font-mono text-primary font-bold">Total: ₹{total.toFixed(2)}</span>
              </div>
              <div className="space-y-1.5">
                {items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs text-white/80 font-sans">
                    <span>{it.quantity}x {it.item_name}</span>
                    <span className="font-mono text-white/50">₹{(it.price * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              type="button"
              onClick={() => handleSendWebhook()}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-black font-bold h-11 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              <span>Dispatch Webhook Payload (`/api/webhooks/petpooja`)</span>
            </Button>
          </TabsContent>

          <TabsContent value="payload" className="space-y-4 mt-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-white/40 flex items-center gap-1">
                  <Code2 size={12} />
                  JSON Body Payload
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(payloadString, false)}
                  className="text-[10px] text-primary hover:underline flex items-center gap-1 font-mono cursor-pointer"
                >
                  {copiedJson ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="p-3.5 bg-black/80 rounded-xl text-[11px] font-mono text-emerald-400/90 overflow-x-auto border border-white/10 max-h-48 custom-scrollbar">
                {payloadString}
              </pre>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-white/40 flex items-center gap-1">
                  <Code2 size={12} />
                  Terminal cURL Command
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(curlCommand, true)}
                  className="text-[10px] text-primary hover:underline flex items-center gap-1 font-mono cursor-pointer"
                >
                  {copiedCurl ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
                </button>
              </div>
              <pre className="p-3.5 bg-black/80 rounded-xl text-[10px] font-mono text-amber-300/80 overflow-x-auto border border-white/10 max-h-32 custom-scrollbar">
                {curlCommand}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
