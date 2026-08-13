import React, { useState } from 'react';
import { RestaurantTable, TableStatus } from '@/src/types';
import { 
  Users, 
  Utensils, 
  PlusCircle, 
  RefreshCw, 
  User,
  Plus,
  Minus,
  Database,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';

interface TableStatusGridProps {
  tables: RestaurantTable[];
  onTableSelect: (table: RestaurantTable) => void;
  onTableStatusChange: (tableId: string | number, newStatus: TableStatus) => void;
  onTableCapacityChange?: (tableId: string | number, newCapacity: number) => void;
  onNewOrderClick: (table?: RestaurantTable) => void;
  onRefreshTables?: () => void;
  onSeedSupabaseTables?: () => void;
  isSyncing?: boolean;
}

export function TableStatusGrid({
  tables,
  onTableSelect,
  onTableStatusChange,
  onTableCapacityChange,
  onNewOrderClick,
  onRefreshTables,
  onSeedSupabaseTables,
  isSyncing = false
}: TableStatusGridProps) {
  const [filterSection, setFilterSection] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Available sections
  const sections = Array.from(new Set(tables.map(t => t.section || 'Main Dining')));

  // Filtered tables
  const filteredTables = tables.filter(t => {
    const matchesSection = filterSection === 'all' || (t.section || 'Main Dining') === filterSection;
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesSection && matchesStatus;
  });

  const getStatusBadge = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Available
          </span>
        );
      case 'occupied':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Occupied
          </span>
        );
      case 'reserved':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-400">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
            Reserved
          </span>
        );
      case 'cleaning':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-white/5 bg-[#0D0E12] p-3.5 sm:p-4">
        {/* Section Filters - Scrollable on mobile */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mr-1 shrink-0">Sections:</span>
          <button
            onClick={() => setFilterSection('all')}
            className={`rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              filterSection === 'all'
                ? 'bg-primary text-black shadow-[0_0_15px_rgba(197,160,89,0.2)]'
                : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            All Sections
          </button>
          {sections.map(sec => (
            <button
              key={sec}
              onClick={() => setFilterSection(sec)}
              className={`rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                filterSection === sec
                  ? 'bg-primary text-black shadow-[0_0_15px_rgba(197,160,89,0.2)]'
                  : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        {/* Status Filters, Database Indicator & Refresh */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold text-emerald-400">
            <Database size={12} className="text-emerald-400 animate-pulse" />
            <span>Supabase DB Synced ({tables.length} Tables)</span>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 sm:flex-none rounded-xl bg-[#14161C] border border-white/10 px-3 py-2 sm:py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-primary/50 min-h-[38px]"
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
              className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 sm:py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary hover:text-black transition-all cursor-pointer disabled:opacity-50 min-h-[38px]"
              title="Ensure all 20 tables are initialized in Supabase DB"
            >
              <Database size={12} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Syncing...' : 'Sync DB'}</span>
            </button>
          )}

          {onRefreshTables && (
            <button
              onClick={onRefreshTables}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all cursor-pointer shrink-0"
              title="Refresh Table States from DB"
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* Table Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTables.map((table) => {
          const isOccupied = table.status === 'occupied';

          return (
            <motion.div
              key={table.id}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all shadow-lg ${
                isOccupied
                  ? 'border-amber-500/30 bg-[#121118] shadow-[0_0_20px_rgba(245,158,11,0.05)]'
                  : table.status === 'available'
                  ? 'border-emerald-500/20 bg-[#0C1210] hover:border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.03)]'
                  : 'border-white/10 bg-[#0F1014]'
              }`}
            >
              {/* Header: Number & Capacity (Seats) Adjustment */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-xl font-serif font-bold text-white tracking-tight">{table.table_number}</h3>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{table.section || 'Main Dining'}</span>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  {/* Status Dropdown selector for live DB updates */}
                  <select
                    value={table.status}
                    onChange={(e) => onTableStatusChange(table.id, e.target.value as TableStatus)}
                    className="rounded-full bg-black/50 border border-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white focus:outline-none focus:border-primary/50 cursor-pointer"
                  >
                    <option value="available" className="bg-[#14161C] text-emerald-400">Available</option>
                    <option value="occupied" className="bg-[#14161C] text-amber-400">Occupied</option>
                    <option value="reserved" className="bg-[#14161C] text-purple-400">Reserved</option>
                    <option value="cleaning" className="bg-[#14161C] text-cyan-400">Cleaning</option>
                  </select>

                  {/* Seats / Capacity adjustment control directly synced to Supabase */}
                  <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-lg px-2 py-0.5 mt-0.5">
                    <Users size={11} className="text-primary" />
                    <span className="text-[10px] font-bold text-white">{table.capacity} Seats</span>
                    {onTableCapacityChange && (
                      <div className="flex items-center gap-1 ml-1 border-l border-white/10 pl-1">
                        <button
                          onClick={() => onTableCapacityChange(table.id, Math.max(1, table.capacity - 1))}
                          className="h-4 w-4 flex items-center justify-center rounded bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                          title="Decrease seats in DB"
                        >
                          <Minus size={9} />
                        </button>
                        <button
                          onClick={() => onTableCapacityChange(table.id, table.capacity + 1)}
                          className="h-4 w-4 flex items-center justify-center rounded bg-primary/20 hover:bg-primary text-primary hover:text-black transition-all cursor-pointer"
                          title="Increase seats in DB"
                        >
                          <Plus size={9} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Occupant / Active Info */}
              <div className="my-4 py-3 border-y border-white/5 min-h-[52px] flex flex-col justify-center">
                {isOccupied ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/40 flex items-center gap-1 font-medium text-[10px] uppercase">
                        <User size={10} className="text-amber-400" /> Guest:
                      </span>
                      <span className="font-semibold text-amber-200 truncate max-w-[120px]">{table.customer_name || 'Occupied Guest'}</span>
                    </div>
                    {table.total_amount != null && table.total_amount > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/40 text-[10px] uppercase">Active Tab:</span>
                        <span className="font-serif font-bold text-primary">₹{table.total_amount}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-white/30 italic">Table is currently open for guests</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNewOrderClick(table)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary hover:text-black transition-all cursor-pointer"
                >
                  <PlusCircle size={12} />
                  Take Order
                </button>

                <button
                  onClick={() => onTableStatusChange(table.id, isOccupied ? 'available' : 'occupied')}
                  className={`flex h-8 px-2.5 items-center justify-center rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    isOccupied
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                  }`}
                  title={isOccupied ? 'Mark as Available' : 'Mark as Occupied'}
                >
                  {isOccupied ? 'Free' : 'Occupy'}
                </button>
              </div>
            </motion.div>
          );
        })}

        {filteredTables.length === 0 && (
          <div className="col-span-full flex h-60 flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#0D0E12] p-8 text-center">
            <Utensils size={36} className="mb-3 text-white/20 stroke-1" />
            <p className="text-xs font-bold text-white/60">No tables match selected filters</p>
            <button
              onClick={() => { setFilterSection('all'); setFilterStatus('all'); }}
              className="mt-3 text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

