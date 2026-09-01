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
import { motion } from 'motion/react';
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
        {/* Section Filters - Scrollable on mobile */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 mr-1 shrink-0">Sections:</span>
          <button
            onClick={() => setFilterSection('all')}
            className={`rounded-xl px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              filterSection === 'all'
                ? 'bg-primary text-black shadow-[0_0_15px_rgba(197,160,89,0.25)]'
                : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>All Sections</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${filterSection === 'all' ? 'bg-black/20 text-black' : 'bg-white/10 text-white/70'}`}>
              {tables.length}
            </span>
          </button>
          {sections.map(sec => {
            const count = tables.filter(t => (t.section || 'Main Dining') === sec).length;
            return (
              <button
                key={sec}
                onClick={() => setFilterSection(sec)}
                className={`rounded-xl px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  filterSection === sec
                    ? 'bg-primary text-black shadow-[0_0_15px_rgba(197,160,89,0.25)]'
                    : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{sec}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${filterSection === sec ? 'bg-black/20 text-black' : 'bg-white/10 text-white/70'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Status Filters, Database Indicator & Refresh */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[10px] font-bold text-emerald-400">
            <Database size={12} className="text-emerald-400 animate-pulse" />
            <span>Supabase DB Synced ({tables.length} Tables)</span>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 sm:flex-none rounded-xl bg-[#141620] border border-white/10 px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-primary/50 min-h-[40px] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available Only</option>
            <option value="occupied">Occupied Only</option>
            <option value="reserved">Reserved Only</option>
            <option value="cleaning">Cleaning Only</option>
          </select>

          {onSeedSupabaseTables && (
            <button
              onClick={onSeedSupabaseTables}
              disabled={isSyncing}
              className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary hover:text-black transition-all cursor-pointer disabled:opacity-50 min-h-[40px] shadow-sm active:scale-95"
              title="Ensure all 20 tables are initialized in Supabase DB"
            >
              <Database size={13} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Syncing...' : 'Sync DB'}</span>
            </button>
          )}

          {onRefreshTables && (
            <button
              onClick={onRefreshTables}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition-all cursor-pointer shrink-0 active:scale-95"
              title="Refresh Table States from DB"
              aria-label="Refresh Table States from DB"
            >
              <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* Table Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.02 }}
              whileHover={{ y: -3 }}
              className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-300 shadow-xl ${
                hasReadyFood
                  ? 'border-amber-400/80 bg-gradient-to-b from-[#20180B] to-[#121118] shadow-[0_0_30px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/60'
                  : isOccupied
                  ? 'border-amber-500/30 bg-[#121118] hover:border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.06)]'
                  : table.status === 'available'
                  ? 'border-emerald-500/20 bg-[#0C1210] hover:border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.04)]'
                  : 'border-white/10 bg-[#0F1016] hover:border-white/20'
              }`}
            >
              {/* Ready Food Notification Tag on Table Card */}
              {hasReadyFood && (
                <div className="mb-3 -mt-1 flex items-center justify-between gap-1.5 rounded-xl bg-amber-400/20 border border-amber-400/50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300 animate-pulse">
                  <div className="flex items-center gap-1.5">
                    <BellRing size={13} className="text-amber-300" />
                    <span>Food Ready to Serve!</span>
                  </div>
                  <span className="bg-amber-400 text-black px-2 py-0.5 rounded-md text-[9px] font-black">
                    {tableReadyOrders.length} {tableReadyOrders.length === 1 ? 'Order' : 'Orders'}
                  </span>
                </div>
              )}

              {/* Header: Number & Capacity (Seats) Adjustment */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-xl font-serif font-bold text-white tracking-tight">{table.table_number}</h3>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">{table.section || 'Main Dining'}</span>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  {/* Status Dropdown selector for live DB updates */}
                  <select
                    value={table.status}
                    onChange={(e) => onTableStatusChange(table.id, e.target.value as TableStatus)}
                    className="min-h-[34px] rounded-full bg-black/60 border border-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white focus:outline-none focus:border-primary/50 cursor-pointer"
                  >
                    <option value="available" className="bg-[#141620] text-emerald-400">Available</option>
                    <option value="occupied" className="bg-[#141620] text-amber-400">Occupied</option>
                    <option value="reserved" className="bg-[#141620] text-purple-400">Reserved</option>
                    <option value="cleaning" className="bg-[#141620] text-cyan-400">Cleaning</option>
                  </select>

                  {/* Seats / Capacity adjustment control directly synced to Supabase */}
                  <div className="flex items-center gap-1.5 bg-black/50 border border-white/10 rounded-lg px-2.5 py-1 mt-0.5">
                    <Users size={12} className="text-primary" />
                    <span className="text-[10px] font-bold text-white font-mono">{table.capacity} Seats</span>
                    {onTableCapacityChange && (
                      <div className="flex items-center gap-1 ml-1.5 border-l border-white/10 pl-1.5">
                        <button
                          onClick={() => onTableCapacityChange(table.id, Math.max(1, table.capacity - 1))}
                          className="h-7 w-7 flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer active:scale-90 touch-manipulation"
                          title="Decrease seats in DB"
                          aria-label="Decrease table capacity"
                        >
                          <Minus size={12} />
                        </button>
                        <button
                          onClick={() => onTableCapacityChange(table.id, table.capacity + 1)}
                          className="h-7 w-7 flex items-center justify-center rounded-md bg-primary/20 hover:bg-primary text-primary hover:text-black transition-all cursor-pointer active:scale-90 touch-manipulation"
                          title="Increase seats in DB"
                          aria-label="Increase table capacity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Occupant / Active Info */}
              <div className="my-3 py-2.5 border-y border-white/5 min-h-[52px] flex flex-col justify-center">
                {isOccupied ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/70 flex items-center gap-1 font-semibold text-[10px] uppercase tracking-wider">
                        <User size={11} className="text-amber-400" /> Guest:
                      </span>
                      <span className="font-semibold text-amber-200 truncate max-w-[130px]">{table.customer_name || 'Occupied Guest'}</span>
                    </div>
                    {table.total_amount != null && table.total_amount > 0 && (
                      <div className="flex items-center justify-between text-xs mt-0.5">
                        <span className="text-white/70 font-semibold text-[10px] uppercase tracking-wider">Active Tab:</span>
                        <span className="font-serif font-bold text-primary text-sm font-mono">₹{table.total_amount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-white/60 italic font-medium">Table is currently open for guests</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col gap-2 pt-1">
                {/* Fast action to serve ready food */}
                {hasReadyFood && tableReadyOrders[0] && (
                  <button
                    onClick={() => {
                      if (onUpdateStatus) {
                        onUpdateStatus(tableReadyOrders[0].id, 'waiting for payment');
                        toast.success(`Served Order #${tableReadyOrders[0].token} for ${table.table_number}! Awaiting payment.`);
                      }
                    }}
                    className="w-full min-h-[42px] flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.35)] active:scale-98"
                  >
                    <CheckCircle2 size={14} />
                    <span>Serve Food &amp; Bill (#{tableReadyOrders[0].token})</span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNewOrderClick(table)}
                    className="flex-1 min-h-[42px] flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 border border-primary/25 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary hover:text-black transition-all cursor-pointer active:scale-98"
                  >
                    <PlusCircle size={13} />
                    <span>Take Order</span>
                  </button>

                  <button
                    onClick={() => onTableStatusChange(table.id, isOccupied ? 'available' : 'occupied')}
                    className={`min-h-[42px] min-w-[58px] flex px-3 items-center justify-center rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
                      isOccupied
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        : 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                    }`}
                    title={isOccupied ? 'Mark as Available' : 'Mark as Occupied'}
                  >
                    {isOccupied ? 'Free' : 'Occupy'}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredTables.length === 0 && (
          <div className="col-span-full flex h-60 flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#0D0E14] p-8 text-center">
            <Utensils size={36} className="mb-3 text-white/20 stroke-1" />
            <p className="text-xs font-bold text-white/70">No tables match selected filters</p>
            <button
              onClick={() => { setFilterSection('all'); setFilterStatus('all'); }}
              className="mt-3 text-[10px] font-bold uppercase tracking-wider text-primary hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


