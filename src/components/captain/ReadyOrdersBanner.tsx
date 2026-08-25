import React, { useState, useEffect, useRef } from 'react';
import { Order, OrderStatus, normalizeOrderItems } from '@/src/types';
import { soundService } from '@/src/lib/sound';
import { 
  Bell, 
  BellRing, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Clock, 
  Utensils, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  ShoppingBag,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface ReadyOrdersBannerProps {
  orders: Order[];
  onUpdateStatus?: (orderId: string, status: OrderStatus) => void;
}

export function ReadyOrdersBanner({
  orders,
  onUpdateStatus
}: ReadyOrdersBannerProps) {
  const readyOrders = orders.filter(o => o.status === 'ready');
  const [isMuted, setIsMuted] = useState<boolean>(soundService.getMuted());
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const prevReadyIdsRef = useRef<Set<string>>(new Set());
  const [now, setNow] = useState<number>(Date.now());

  // Update time counter every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  // Detect newly ready orders and trigger chime & vibration
  useEffect(() => {
    const currentReadyIds = new Set(readyOrders.map(o => o.id));
    const prevReadyIds = prevReadyIdsRef.current;

    // Check if there are any new ready orders
    let hasNewlyReady = false;
    let newlyReadyOrder: Order | null = null;

    for (const id of currentReadyIds) {
      if (!prevReadyIds.has(id)) {
        hasNewlyReady = true;
        newlyReadyOrder = readyOrders.find(o => o.id === id) || null;
        break;
      }
    }

    if (hasNewlyReady && newlyReadyOrder) {
      soundService.playReadyChime();
      soundService.triggerVibration([200, 100, 200, 100, 300]);
      
      const tableText = newlyReadyOrder.table_id 
        ? `Table ${String(newlyReadyOrder.table_id).replace(/^table\s*/i, '')}` 
        : 'Counter Pickup';

      toast.success(`🛎️ ORDER READY TO SERVE!`, {
        description: `${tableText} (Token: ${newlyReadyOrder.token}) is cooked and ready for pickup!`,
        duration: 8000
      });
    }

    prevReadyIdsRef.current = currentReadyIds;
  }, [readyOrders]);

  const toggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundService.setMuted(nextMuted);
    if (!nextMuted) {
      soundService.playReadyChime();
      toast.success('Waiter Service Bell Chime Enabled');
    } else {
      toast.info('Waiter Service Bell Chime Muted');
    }
  };

  const handleTestChime = () => {
    soundService.playReadyChime();
    soundService.triggerVibration([200, 100, 200]);
    toast.success('🔔 Bell Chime Tested: Ready signal played!');
  };

  const handleMarkServed = (order: Order) => {
    if (onUpdateStatus) {
      onUpdateStatus(order.id, 'waiting for payment');
      toast.success(`Order #${order.token} marked as Served & Moved to Payments!`);
    }
  };

  const formatElapsed = (createdAtStr: string) => {
    try {
      const created = new Date(createdAtStr).getTime();
      const diffSec = Math.max(0, Math.floor((now - created) / 1000));
      if (diffSec < 60) return `${diffSec}s ago`;
      const mins = Math.floor(diffSec / 60);
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      return `${hrs}h ${mins % 60}m ago`;
    } catch {
      return 'Just now';
    }
  };

  if (readyOrders.length === 0) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-[#0D0E12] px-4 py-3 text-xs text-white/50">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-white/40">
            <Bell size={15} />
          </div>
          <div>
            <span className="font-medium text-white/70">Waiter Notification System Active</span>
            <span className="hidden sm:inline text-white/30 text-[11px] ml-2">• Automatic chime will ring when kitchen marks food ready</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestChime}
            className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            title="Test the waiter ready chime sound"
          >
            Test Chime
          </button>

          <button
            onClick={toggleSound}
            className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all cursor-pointer ${
              isMuted 
                ? 'border-red-500/20 bg-red-500/10 text-red-400' 
                : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
            }`}
            title={isMuted ? 'Unmute Waiter Ready Chimes' : 'Mute Waiter Ready Chimes'}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col rounded-2xl sm:rounded-3xl border border-amber-500/40 bg-gradient-to-b from-[#1A150D] to-[#0F1014] p-4 sm:p-5 shadow-[0_0_30px_rgba(245,158,11,0.15)] relative overflow-hidden"
    >
      {/* Ambient Pulsing Top Highlight */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-primary to-amber-500 animate-pulse" />

      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-bounce">
            <BellRing size={20} className="animate-wiggle" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-serif font-bold text-amber-200 tracking-tight flex items-center gap-2">
                Orders Ready to Serve
                <span className="flex h-6 px-2.5 items-center justify-center rounded-full bg-amber-400 text-black font-sans font-extrabold text-xs shadow-md">
                  {readyOrders.length}
                </span>
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                Pick Up Immediately
              </span>
            </div>
            <p className="text-[11px] text-amber-200/60 mt-0.5">
              Kitchen has prepared these dishes. Waiters can pick up from counter & deliver to table.
            </p>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleTestChime}
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer"
            title="Ring Service Bell"
          >
            <Bell size={12} />
            <span>Ring Bell</span>
          </button>

          <button
            onClick={toggleSound}
            className={`flex h-8 px-2.5 items-center gap-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              isMuted 
                ? 'border-red-500/30 bg-red-500/10 text-red-400' 
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            }`}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound ON'}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Ready Orders Cards Grid */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-3.5 overflow-hidden"
          >
            {readyOrders.map((order) => {
              const tableNum = order.table_id 
                ? `Table ${String(order.table_id).replace(/^table\s*/i, '')}` 
                : 'Pickup Counter';

              const isDineIn = order.order_type === 'dine_in' || !order.order_type;

              return (
                <div
                  key={order.id}
                  className="flex flex-col justify-between rounded-2xl border border-amber-500/30 bg-[#14121A] p-4 shadow-lg hover:border-amber-400 transition-all group"
                >
                  {/* Card Header: Table & Token */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-serif font-bold text-white tracking-tight bg-primary/20 border border-primary/30 text-primary px-2.5 py-0.5 rounded-lg">
                          {tableNum}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">
                          #{order.token}
                        </span>
                      </div>
                      {order.customer_name && (
                        <p className="text-xs text-white/80 font-medium mt-1">
                          Guest: <span className="text-white font-bold">{order.customer_name}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-300/80">
                        <Clock size={11} /> {formatElapsed(order.created_at)}
                      </span>
                      <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-400 mt-0.5">
                        Ready to Serve
                      </span>
                    </div>
                  </div>

                  {/* Items List Preview */}
                  <div className="my-3 py-2.5 px-3 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-1 text-xs">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-white/30">
                      Dishes Ready ({normalizeOrderItems(order.items).length}):
                    </span>
                    <div className="flex flex-col gap-1 max-h-24 overflow-y-auto custom-scrollbar">
                      {normalizeOrderItems(order.items).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-white/90">
                          <span className="font-medium text-xs">
                            <span className="text-primary font-bold mr-1.5">{item.quantity}x</span>
                            {item.name}
                          </span>
                          <span className="text-white/40 text-[11px]">₹{(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                    {order.notes && (
                      <p className="text-[10px] text-amber-300/80 italic mt-1 pt-1 border-t border-white/5">
                        Note: {order.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions: Mark as Served */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleMarkServed(order)}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black py-2 px-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.25)] active:scale-98"
                    >
                      <CheckCircle2 size={14} />
                      <span>Mark Served</span>
                    </button>

                    <button
                      onClick={() => {
                        soundService.playReadyChime();
                        soundService.triggerVibration([200, 100, 200]);
                        toast.info(`🔔 Alert re-sent for ${tableNum} (Token: ${order.token})`);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-amber-300 transition-all cursor-pointer"
                      title="Re-ring bell to alert waiters"
                    >
                      <Bell size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
