import React, { useState, useEffect, useCallback } from 'react';
import { RestaurantTable, TableStatus, MenuItem, Order, OrderStatus } from '@/src/types';
import { TableStatusGrid } from './TableStatusGrid';
import { OrderBuilderSheet } from './OrderBuilderSheet';
import { ReadyOrdersBanner } from './ReadyOrdersBanner';
import { supabase } from '@/src/lib/supabase';
import { verifyAdminPassword } from '@/src/lib/authService';
import { 
  Lock, 
  Unlock, 
  Utensils, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  KeyRound, 
  X,
  Users,
  Sparkles,
  BellRing
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface CaptainDashboardProps {
  menuItems: MenuItem[];
  orders?: Order[];
  onOrderCreated?: (order: Order, tableNumber: string) => void;
  onUpdateStatus?: (orderId: string, status: OrderStatus) => void;
  isKioskLocked: boolean;
  setIsKioskLocked: (locked: boolean) => void;
}

const DEFAULT_TABLES: RestaurantTable[] = Array.from({ length: 20 }, (_, i) => {
  const num = (i + 1).toString().padStart(2, '0');
  return {
    id: `t-${i + 1}`,
    table_number: `Table ${num}`,
    capacity: 4,
    status: 'available',
    section: 'Main Hall',
    customer_name: null,
    total_amount: 0
  };
});

export function CaptainDashboard({
  menuItems,
  orders = [],
  onOrderCreated,
  onUpdateStatus,
  isKioskLocked,
  setIsKioskLocked
}: CaptainDashboardProps) {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isOrderSheetOpen, setIsOrderSheetOpen] = useState<boolean>(false);
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<RestaurantTable | null>(null);

  // Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordActionType, setPasswordActionType] = useState<'lock' | 'unlock'>('lock');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Seed default 20 tables into Supabase database (Only when explicitly triggered by user)
  const seedSupabaseTables = async () => {
    setIsSyncing(true);
    try {
      const payload = DEFAULT_TABLES.map(t => ({
        id: t.id,
        table_number: t.table_number,
        capacity: t.capacity || 4,
        status: t.status,
        section: 'Main Hall',
        customer_name: t.customer_name,
        total_amount: t.total_amount,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase.from('tables').upsert(payload);
      if (error) {
        console.warn('Error seeding tables to Supabase:', error.message);
        toast.error('Could not sync tables to Supabase DB', { description: error.message });
      } else {
        toast.success('Successfully initialized 20 tables in Supabase DB!');
        // Re-fetch to guarantee exact state from DB
        const { data } = await supabase.from('tables').select('*').order('table_number', { ascending: true });
        if (data && data.length > 0) {
          setTables(data as RestaurantTable[]);
        }
      }
    } catch (err: any) {
      console.error('Seed exception:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Fetch tables from Supabase & subscribe real-time (NEVER overwrite DB)
  const fetchTablesFromSupabase = useCallback(async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('table_number', { ascending: true });

      if (error) {
        console.warn('Supabase fetch tables error:', error.message);
        setTables(DEFAULT_TABLES);
        return;
      }

      if (data && data.length > 0) {
        // Read strictly from DB
        setTables(data as RestaurantTable[]);
      } else {
        // DB is empty - populate UI with default 20 tables, but DO NOT run upsert to avoid overwriting user DB
        setTables(DEFAULT_TABLES);
      }
    } catch (err) {
      console.warn('Failed to fetch tables from Supabase:', err);
      setTables(DEFAULT_TABLES);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchTablesFromSupabase();

    // Supabase Real-time channel for live table updates across devices
    const channel = supabase
      .channel('tables-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedTable = payload.new as RestaurantTable;
          setTables(prev => {
            const index = prev.findIndex(t => t.id === updatedTable.id || t.table_number === updatedTable.table_number);
            if (index >= 0) {
              const next = [...prev];
              next[index] = { ...next[index], ...updatedTable };
              return next;
            }
            return [...prev, updatedTable];
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTablesFromSupabase]);

  // Handle table capacity change in Supabase DB
  const handleTableCapacityChange = async (tableId: string | number, newCapacity: number) => {
    // 1. Optimistic update
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, capacity: newCapacity } : t));

    // 2. Persist to Supabase DB
    const targetTable = tables.find(t => t.id === tableId);
    if (targetTable) {
      const { error } = await supabase
        .from('tables')
        .upsert({
          id: targetTable.id,
          table_number: targetTable.table_number,
          capacity: newCapacity,
          status: targetTable.status,
          customer_name: targetTable.customer_name,
          total_amount: targetTable.total_amount,
          section: targetTable.section || 'Main Hall',
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.warn('Could not update capacity in Supabase:', error.message);
        toast.error('Failed to update seats in database');
      } else {
        toast.success(`${targetTable.table_number} capacity updated to ${newCapacity} seats in DB`);
      }
    }
  };

  // Handle table status change in Supabase DB
  const handleTableStatusChange = async (tableId: string | number, newStatus: TableStatus) => {
    // 1. Optimistic local update
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          status: newStatus,
          customer_name: newStatus === 'available' ? null : t.customer_name,
          total_amount: newStatus === 'available' ? 0 : t.total_amount
        };
      }
      return t;
    }));

    // 2. Persist to Supabase if available
    const targetTable = tables.find(t => t.id === tableId);
    if (targetTable) {
      const { error } = await supabase
        .from('tables')
        .upsert({
          id: targetTable.id,
          table_number: targetTable.table_number,
          capacity: targetTable.capacity,
          status: newStatus,
          customer_name: newStatus === 'available' ? null : targetTable.customer_name,
          total_amount: newStatus === 'available' ? 0 : targetTable.total_amount,
          section: targetTable.section || 'Main Hall',
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.warn('Could not persist table status to Supabase:', error.message);
      }
    }

    toast.success(`Table status updated to ${newStatus.toUpperCase()} in DB`);
  };

  // Open Order Builder Sheet
  const handleOpenOrderSheet = (table?: RestaurantTable) => {
    setSelectedTableForOrder(table || tables[0] || null);
    setIsOrderSheetOpen(true);
  };

  // Password Verification Handler
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    const res = await verifyAdminPassword(passwordInput);
    if (res.success) {
      if (passwordActionType === 'lock') {
        setIsKioskLocked(true);
        toast.success('Kiosk Lock Mode Activated', {
          description: 'Restricted access: Captain Desk view active.'
        });
      } else {
        setIsKioskLocked(false);
        toast.success('Kiosk Lock Mode Deactivated', {
          description: 'Full admin dashboard restored.'
        });
      }
      setIsPasswordModalOpen(false);
      setPasswordInput('');
    } else {
      setPasswordError(res.message || 'Invalid Admin Password. Verified against Supabase DB.');
    }
  };

  const openLockPrompt = (type: 'lock' | 'unlock') => {
    setPasswordActionType(type);
    setPasswordInput('');
    setPasswordError(null);
    setIsPasswordModalOpen(true);
  };

  // Stats calculation
  const totalTables = tables.length;
  const occupiedCount = tables.filter(t => t.status === 'occupied').length;
  const availableCount = tables.filter(t => t.status === 'available').length;
  const readyOrders = orders.filter(o => o.status === 'ready');
  const readyCount = readyOrders.length;

  return (
    <div className="flex flex-col gap-4 sm:gap-6 md:gap-8 p-3 sm:p-6 md:p-10 max-w-7xl mx-auto w-full">
      
      {/* Captain Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0F1016] p-4 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
        {/* Background Ambient Glow */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 sm:gap-5 z-10">
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/25 text-primary shadow-[0_0_25px_rgba(197,160,89,0.15)] shrink-0">
            <Utensils size={24} className="sm:w-7 sm:h-7" />
          </div>

          <div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-xl sm:text-3xl font-serif font-bold text-white tracking-tight">Captain Service Desk</h1>
              {isKioskLocked ? (
                <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/30 px-3 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-red-400">
                  <Lock size={11} className="animate-pulse" /> Kiosk Locked
                </span>
              ) : (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  <Unlock size={11} /> Dashboard Unlocked
                </span>
              )}
              {readyCount > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 px-3 py-1 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-amber-300 animate-pulse">
                  <BellRing size={11} /> {readyCount} Ready to Serve
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-white/70 mt-1 font-sans">Live table floor layout, waiter ready-order alert hub &amp; kitchen dispatch</p>
          </div>
        </div>

        {/* Action Controls & Quick Stats */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 z-10">
          {/* Quick Metrics */}
          <div className="flex items-center justify-around w-full sm:w-auto gap-3 sm:gap-4 rounded-2xl border border-white/10 bg-[#141620] px-4 sm:px-5 py-2.5">
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/70">Total</span>
              <span className="text-xs sm:text-sm font-serif font-bold text-white font-mono">{totalTables}</span>
            </div>
            <div className="h-5 w-px bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">Available</span>
              <span className="text-xs sm:text-sm font-serif font-bold text-emerald-400 font-mono">{availableCount}</span>
            </div>
            <div className="h-5 w-px bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400">Occupied</span>
              <span className="text-xs sm:text-sm font-serif font-bold text-amber-400 font-mono">{occupiedCount}</span>
            </div>
            {readyCount > 0 && (
              <>
                <div className="h-5 w-px bg-white/10" />
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-amber-300">Ready</span>
                  <span className="text-xs sm:text-sm font-serif font-bold text-amber-300 animate-pulse font-mono">{readyCount}</span>
                </div>
              </>
            )}
          </div>

          {/* Place Dine-in Order Button */}
          <button
            onClick={() => handleOpenOrderSheet()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs font-bold uppercase tracking-[0.15em] text-black shadow-[0_0_20px_rgba(197,160,89,0.25)] hover:bg-primary/90 transition-all cursor-pointer min-h-[44px] active:scale-95"
          >
            <PlusCircle size={16} />
            <span>Take New Order</span>
          </button>

          {/* Kiosk Lock / Unlock Toggle Button */}
          {isKioskLocked ? (
            <button
              onClick={() => openLockPrompt('unlock')}
              className="flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/20 transition-all cursor-pointer shadow-lg min-h-[44px] active:scale-95"
              title="Unlock Kiosk Mode with Admin Password"
            >
              <Unlock size={16} />
              <span>Unlock Kiosk</span>
            </button>
          ) : (
            <button
              onClick={() => openLockPrompt('lock')}
              className="flex items-center justify-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer shadow-lg min-h-[44px] active:scale-95"
              title="Lock Interface into Captain Kiosk Mode"
            >
              <Lock size={16} />
              <span>Lock Kiosk</span>
            </button>
          )}
        </div>
      </div>

      {/* Real-time Ready Orders Service Notification Alert Bar */}
      <ReadyOrdersBanner
        orders={orders}
        onUpdateStatus={onUpdateStatus}
      />

      {/* Table Layout & Management Grid */}
      <TableStatusGrid
        tables={tables}
        readyOrders={readyOrders}
        onTableSelect={handleOpenOrderSheet}
        onTableStatusChange={handleTableStatusChange}
        onTableCapacityChange={handleTableCapacityChange}
        onNewOrderClick={handleOpenOrderSheet}
        onUpdateStatus={onUpdateStatus}
        onRefreshTables={fetchTablesFromSupabase}
        onSeedSupabaseTables={seedSupabaseTables}
        isSyncing={isSyncing}
      />

      {/* Order Entry Sheet Drawer */}
      <OrderBuilderSheet
        isOpen={isOrderSheetOpen}
        onClose={() => setIsOrderSheetOpen(false)}
        selectedTable={selectedTableForOrder}
        tables={tables}
        menuItems={menuItems}
        onOrderCreated={(newOrder, tableNumber) => {
          // Update table status locally
          setTables(prev => prev.map(t => {
            if (t.table_number === tableNumber) {
              return {
                ...t,
                status: 'occupied',
                customer_name: newOrder.customer_name || 'Guest',
                total_amount: newOrder.total
              };
            }
            return t;
          }));

          if (onOrderCreated) {
            onOrderCreated(newOrder, tableNumber);
          }
        }}
      />

      {/* Admin Password Prompt Modal */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0F1016] p-6 shadow-2xl text-white font-sans overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-bold text-white">
                      {passwordActionType === 'lock' ? 'Lock into Captain Kiosk' : 'Unlock Admin Dashboard'}
                    </h3>
                    <p className="text-[10px] text-white/70">Enter Admin Password to proceed</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsPasswordModalOpen(false)}
                  aria-label="Close dialog"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handlePasswordSubmit} className="mt-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter password..."
                    autoFocus
                    className="w-full rounded-2xl bg-[#141620] border border-white/10 px-4 py-3 text-sm font-medium text-white placeholder-white/40 focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>

                {passwordError && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
                    <ShieldAlert size={16} className="flex-shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-primary/90 transition-all cursor-pointer shadow-[0_0_15px_rgba(197,160,89,0.2)]"
                  >
                    {passwordActionType === 'lock' ? 'Confirm Lock' : 'Unlock Dashboard'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
