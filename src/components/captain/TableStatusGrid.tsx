import React, { useState, useMemo } from 'react';
import { RestaurantTable, TableStatus, Order, OrderStatus } from '@/src/types';
import { 
  Users, 
  Utensils, 
  PlusCircle, 
  RefreshCw, 
  User,
  Plus,
  Minus,
  Database,
  Check,
  BellRing,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface TableStatusGridProps {
  tables: RestaurantTable[];
  readyOrders?: Order[];
  onTableSelect: (table: RestaurantTable) => void;
  onTableStatusChange: (tableId: string | number, newStatus: TableStatus) => void;
  onTableCapacityChange?: (tableId: string | number, newCapacity: number) => void;
  onNewOrderClick: (table?: RestaurantTable) => void;
  onUpdateStatus?: (orderId: string, status: OrderStatus) => void;
  onRefreshTables?: () => void;
  onSeedSupabaseTables?: () => void;
  isSyncing?: boolean;
}

export function TableStatusGrid({
  tables,
  readyOrders = [],
  onTableSelect,
  onTableStatusChange,
  onTableCapacityChange,
  onNewOrderClick,
  onUpdateStatus,
  onRefreshTables,
  onSeedSupabaseTables,
  isSyncing = false
}: TableStatusGridProps) {
  const [filterSection, setFilterSection] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Available sections (memoized)
  const sections = useMemo(() => {
    return Array.from(new Set(tables.map(t => t.section || 'Main Dining')));
  }, [tables]);

  // Filtered tables (memoized)
  const filteredTables = useMemo(() => {
    return tables.filter(t => {
      const matchesSection = filterSection === 'all' || (t.section || 'Main Dining') === filterSection;
      const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
      return matchesSection && matchesStatus;
    });
  }, [tables, filterSection, filterStatus]);

  // Map of ready orders by table identifier for fast O(1) lookup
  const readyOrdersByTable = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const o of readyOrders) {
      if (!o.table_id) continue;
      const raw = String(o.table_id).toLowerCase().trim();
      const plain = raw.replace(/^table\s*/, '').trim();
      
      const keys = [raw, plain, `table ${plain}`];
      for (const k of keys) {
        const existing = map.get(k) || [];
        if (!existing.some(item => item.id === o.id)) {
          existing.push(o);
          map.set(k, existing);
        }
      }
    }
    return map;
  }, [readyOrders]);

  const getStatusBadge = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Available
          </span>
        );
      case 'occupied':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Occupied
          </span>
        );
      case 'reserved':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-400">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
            Reserved
          </span>
        );
      case 'cleaning':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Cleaning
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-white/10 bg-[#0D0E14] p-3.5 sm:p-4 shadow-lg backdrop-blur-md">
        {/* Section Filters - Scrollable on mobile with smooth touch handling */}
        <div 
          className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0 min-w-0 touch-pan-x"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 mr-1 shrink-0">Sections:</span>
          <button
            type="button"
            onClick={() => setFilterSection('all')}
            aria-pressed={filterSection === 'all'}
            className={`min-h-[40px] rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 min-w-max flex items-center gap-2 touch-manipulation active:scale-95 ${
              filterSection === 'all'
                ? 'bg-primary text-black shadow-[0_0_15px_rgba(197,160,89,0.25)]'
                : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>All Sections</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${filterSection === 'all' ? 'bg-black/20 text-black' : 'bg-white/10 text-white/70'}`}>
              {tables.length}
            </span>
          </button>
          {sections.map(sec => {
            const count = tables.filter(t => (t.section || 'Main Dining') === sec).length;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => setFilterSection(sec)}
                aria-pressed={filterSection === sec}
                className={`min-h-[40px] rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 min-w-max flex items-center gap-2 touch-manipulation active:scale-95 ${
                  filterSection === sec
                    ? 'bg-primary text-black shadow-[0_0_15px_rgba(197,160,89,0.25)]'
                    : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{sec}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${filterSection === sec ? 'bg-black/20 text-black' : 'bg-white/10 text-white/70'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Status Filters, Database Indicator & Refresh */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[10px] font-bold text-emerald-400 shrink-0">
            <Database size={12} className="text-emerald-400 animate-pulse" />
            <span>Supabase DB Synced ({tables.length} Tables)</span>
          </div>

          <select
            value={filterStatus}
            aria-label="Filter tables by status"
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 sm:w-auto rounded-xl bg-[#141620] border border-white/10 px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-primary/50 min-h-[44px] cursor-pointer touch-manipulation shrink-0"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available Only</option>
            <option value="occupied">Occupied Only</option>
            <option value="reserved">Reserved Only</option>
            <option value="cleaning">Cleaning Only</option>
          </select>

          {onSeedSupabaseTables && (
            <button
              type="button"
              onClick={onSeedSupabaseTables}
              disabled={isSyncing}
              className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary hover:text-black transition-all cursor-pointer disabled:opacity-50 min-h-[44px] shadow-sm active:scale-95 touch-manipulation shrink-0 whitespace-nowrap"
              title="Ensure all dining tables are initialized in database"
            >
              <Database size={14} className={isSyncing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Tables'}</span>
              <span className="sm:hidden">{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>
          )}

          {onRefreshTables && (
            <button
              type="button"
              onClick={onRefreshTables}
              className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition-all cursor-pointer shrink-0 active:scale-95 touch-manipulation"
              title="Refresh Table States from DB"
              aria-label="Refresh Table States from DB"
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* Table Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        <AnimatePresence mode="popLayout">
          {filteredTables.map((table, idx) => {
            const isOccupied = table.status === 'occupied';
            
            // Fast O(1) match of ready orders for this table
            const tId = String(table.id).toLowerCase();
            const tNum = table.table_number.toLowerCase();
            const tNumPlain = tNum.replace(/^table\s*/, '').trim();
            const tableReadyOrders = readyOrdersByTable.get(tNumPlain) || readyOrdersByTable.get(tId) || readyOrdersByTable.get(tNum) || [];
            const hasReadyFood = tableReadyOrders.length > 0;

            return (
              <motion.div
                key={table.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.02, 0.15), ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -2 }}
                className={`group relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition-all duration-300 shadow-xl ${
                hasReadyFood
                  ? 'border-amber-400/80 bg-gradient-to-b from-[#22190B] to-[#100F15] shadow-[0_0_30px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/60'
                  : isOccupied
                  ? 'border-amber-500/30 bg-[#100F15] hover:border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.06)]'
                  : table.status === 'available'
                  ? 'border-emerald-500/25 bg-[#09100D] hover:border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.05)]'
                  : table.status === 'reserved'
                  ? 'border-violet-500/30 bg-[#120F1D] hover:border-violet-500/60 shadow-[0_0_20px_rgba(139,92,246,0.06)]'
                  : table.status === 'cleaning'
                  ? 'border-cyan-500/30 bg-[#0A1218] hover:border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.06)]'
                  : 'border-white/10 bg-[#0E0F16] hover:border-white/20'
              }`}
            >
              {/* Ready Food Notification Tag on Table Card */}
              {hasReadyFood && (
                <div className="mb-3 -mt-1 flex items-center justify-between gap-1.5 rounded-xl bg-amber-400/20 border border-amber-400/50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <div className="flex items-center gap-1.5">
                    <BellRing size={13} className="text-amber-300" />
                    <span>Food Ready!</span>
                  </div>
                  <span className="bg-amber-400 text-black px-2 py-0.5 rounded-md text-[9px] font-black font-mono">
                    {tableReadyOrders.length} {tableReadyOrders.length === 1 ? 'Order' : 'Orders'}
                  </span>
                </div>
              )}

              {/* Header: Number & Capacity (Seats) Adjustment */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-xl font-serif font-bold text-white tracking-tight">{table.table_number}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 block mt-0.5">{table.section || 'Main Dining'}</span>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {/* Status Dropdown selector for live DB updates */}
                  <select
                    value={table.status}
                    aria-label={`Table status for ${table.table_number}`}
                    onChange={(e) => onTableStatusChange(table.id, e.target.value as TableStatus)}
                    className={`min-h-[44px] rounded-xl bg-black/70 border px-3 py-2 text-xs font-extrabold uppercase tracking-wider text-white focus:outline-none focus:border-primary/50 cursor-pointer shadow-inner touch-manipulation ${
                      table.status === 'available' ? 'border-emerald-500/40 text-emerald-400' :
                      table.status === 'occupied' ? 'border-amber-500/40 text-amber-400' :
                      table.status === 'reserved' ? 'border-violet-500/40 text-violet-400' :
                      'border-cyan-500/40 text-cyan-400'
                    }`}
                  >
                    <option value="available" className="bg-[#141620] text-emerald-400">Available</option>
                    <option value="occupied" className="bg-[#141620] text-amber-400">Occupied</option>
                    <option value="reserved" className="bg-[#141620] text-violet-400">Reserved</option>
                    <option value="cleaning" className="bg-[#141620] text-cyan-400">Cleaning</option>
                  </select>

                  {/* Seats / Capacity adjustment control directly synced to Supabase */}
                  <div className="flex items-center gap-1.5 bg-black/60 border border-white/10 rounded-xl px-2.5 py-1 mt-0.5 shadow-inner">
                    <Users size={13} className="text-primary shrink-0" />
                    <span className="text-[11px] font-bold text-white font-mono">{table.capacity} Seats</span>
                    {onTableCapacityChange && (
                      <div className="flex items-center gap-1 ml-2 border-l border-white/10 pl-2">
                        <button
                          type="button"
                          onClick={() => onTableCapacityChange(table.id, Math.max(1, table.capacity - 1))}
                          disabled={table.capacity <= 1}
                          className="h-8 w-8 min-h-[36px] min-w-[36px] sm:h-7 sm:w-7 touch-target flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer active:scale-90 touch-manipulation disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none"
                          title="Decrease seats"
                          aria-label={`Decrease seats for ${table.table_number}`}
                        >
                          <Minus size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onTableCapacityChange(table.id, Math.min(50, table.capacity + 1))}
                          disabled={table.capacity >= 50}
                          className="h-8 w-8 min-h-[36px] min-w-[36px] sm:h-7 sm:w-7 touch-target flex items-center justify-center rounded-lg bg-primary/20 hover:bg-primary text-primary hover:text-black transition-all cursor-pointer active:scale-90 font-bold touch-manipulation disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none"
                          title="Increase seats"
                          aria-label={`Increase seats for ${table.table_number}`}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Occupant / Active Info */}
              <div className="my-3 py-2 border-y border-white/5 min-h-[48px] flex flex-col justify-center">
                {isOccupied ? (
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60 flex items-center gap-1 font-semibold text-[10px] uppercase tracking-wider">
                        <User size={11} className="text-amber-400" /> Guest:
                      </span>
                      <span className="font-semibold text-amber-200 truncate max-w-[130px] font-serif">{table.customer_name || 'Occupied Guest'}</span>
                    </div>
                    {table.total_amount != null && table.total_amount > 0 && (
                      <div className="flex items-center justify-between text-xs mt-0.5">
                        <span className="text-white/60 font-semibold text-[10px] uppercase tracking-wider">Running Tab:</span>
                        <span className="font-serif font-bold text-primary text-sm font-mono">₹{table.total_amount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                ) : table.status === 'reserved' ? (
                  <div className="flex items-center gap-1.5 text-xs text-violet-300">
                    <span className="h-2 w-2 rounded-full bg-violet-400 shrink-0" />
                    <span className="font-medium italic">Reserved for Guest</span>
                  </div>
                ) : table.status === 'cleaning' ? (
                  <div className="flex items-center gap-1.5 text-xs text-cyan-300">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
                    <span className="font-medium italic">Sanitization / Reset in Progress</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-white/50 italic">Table available for walk-in or reservation</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col gap-2 pt-1">
                {/* Fast action to serve ready food */}
                {hasReadyFood && tableReadyOrders[0] && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateStatus) {
                        onUpdateStatus(tableReadyOrders[0].id, 'waiting for payment');
                        toast.success(`Served Order #${tableReadyOrders[0].token} for ${table.table_number}! Awaiting payment.`);
                      }
                    }}
                    className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black py-2.5 px-3 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.3)] active:scale-95 touch-manipulation"
                  >
                    <CheckCircle2 size={16} />
                    <span>Serve &amp; Bill (#{tableReadyOrders[0].token})</span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onNewOrderClick(table)}
                    className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-primary/10 border border-primary/30 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary hover:text-black transition-all cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(197,160,89,0.1)] touch-manipulation"
                  >
                    <PlusCircle size={15} />
                    <span>Take Order</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onTableStatusChange(table.id, isOccupied ? 'available' : 'occupied')}
                    className={`min-h-[44px] min-w-[70px] flex px-3.5 items-center justify-center rounded-xl border text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer active:scale-95 touch-manipulation ${
                      isOccupied
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        : 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                    }`}
                    title={isOccupied ? 'Clear table and mark available' : 'Seat guests and mark occupied'}
                  >
                    {isOccupied ? 'Clear' : 'Seat'}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
        </AnimatePresence>

        {filteredTables.length === 0 && (
          <div className="col-span-full flex h-60 flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0E0F16] p-8 text-center shadow-xl">
            <Utensils size={36} className="mb-3 text-white/30 stroke-1" />
            <p className="text-sm font-serif font-bold text-white tracking-tight">No Tables Found</p>
            <p className="text-xs text-white/50 mt-1">No dining tables match your selected section or status filter.</p>
            <button
              type="button"
              onClick={() => { setFilterSection('all'); setFilterStatus('all'); }}
              className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary hover:text-black transition-all cursor-pointer min-h-[38px] touch-target active:scale-95"
            >
              Reset Table Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


