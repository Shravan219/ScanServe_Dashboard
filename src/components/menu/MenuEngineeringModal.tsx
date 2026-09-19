import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Star, 
  HelpCircle, 
  AlertTriangle, 
  Award, 
  Sparkles, 
  ArrowUpRight, 
  DollarSign, 
  BarChart3, 
  Utensils, 
  MessageSquare,
  CheckCircle2,
  Filter
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
import { Badge } from '@/components/ui/badge';
import { MenuItem, Order, normalizeOrderItems } from '@/src/types';

interface MenuEngineeringModalProps {
  menuItems: MenuItem[];
  orders: Order[];
}

type MatrixQuadrant = 'stars' | 'plowhorses' | 'puzzles' | 'dogs';

interface AnalyzedItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantitySold: number;
  totalRevenue: number;
  quadrant: MatrixQuadrant;
  actionRecommendation: string;
}

export function MenuEngineeringModal({ menuItems, orders }: MenuEngineeringModalProps) {
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | MatrixQuadrant>('all');

  const { analyzedItems, stats } = useMemo(() => {
    // 1. Tally quantities & revenue from all orders
    const itemSales: Record<string, { quantity: number; revenue: number; name: string; price: number; category: string }> = {};

    // Initialize with menu catalog
    menuItems.forEach(m => {
      itemSales[m.name.toLowerCase().trim()] = {
        quantity: 0,
        revenue: 0,
        name: m.name,
        price: m.discount_price || m.price,
        category: m.category || 'Mains'
      };
    });

    // Populate from orders
    orders.forEach(order => {
      const items = normalizeOrderItems(order.items);
      items.forEach(item => {
        const key = item.name.toLowerCase().trim();
        const price = item.price || 0;
        const qty = item.quantity || 1;

        if (!itemSales[key]) {
          itemSales[key] = {
            quantity: 0,
            revenue: 0,
            name: item.name,
            price,
            category: 'Mains'
          };
        }

        itemSales[key].quantity += qty;
        itemSales[key].revenue += price * qty;
      });
    });

    const list = Object.values(itemSales);

    // 2. Compute Benchmarks (Averages)
    const totalVolume = list.reduce((acc, i) => acc + i.quantity, 0);
    const totalRevenue = list.reduce((acc, i) => acc + i.revenue, 0);
    const avgVolume = list.length > 0 ? totalVolume / list.length : 1;
    const avgRevenue = list.length > 0 ? totalRevenue / list.length : 1;

    // 3. Classify into Quadrants
    const analyzed: AnalyzedItem[] = list.map((item, idx) => {
      const isHighVolume = item.quantity >= avgVolume;
      const isHighRevenue = item.revenue >= avgRevenue || item.price > 450; // High ticket threshold

      let quadrant: MatrixQuadrant;
      let actionRecommendation: string;

      if (isHighVolume && isHighRevenue) {
        quadrant = 'stars';
        actionRecommendation = 'Crown Jewel. Maintain recipe quality & feature prominently on QR menu front page.';
      } else if (isHighVolume && !isHighRevenue) {
        quadrant = 'plowhorses';
        actionRecommendation = 'High Volume Magnet. Increase price by ₹20–₹50 or bundle with high-margin beverages.';
      } else if (!isHighVolume && isHighRevenue) {
        quadrant = 'puzzles';
        actionRecommendation = 'Hidden High-Margin Gem. Train floor captains to verbally recommend to diners.';
      } else {
        quadrant = 'dogs';
        actionRecommendation = 'Underperforming. Consider revising recipe, reducing stock, or swapping for seasonal special.';
      }

      return {
        id: `analysis_${idx}`,
        name: item.name,
        category: item.category,
        price: item.price,
        quantitySold: item.quantity,
        totalRevenue: item.revenue,
        quadrant,
        actionRecommendation
      };
    });

    // Sort by revenue descending
    analyzed.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Calculate score
    const starCount = analyzed.filter(i => i.quadrant === 'stars').length;
    const puzzleCount = analyzed.filter(i => i.quadrant === 'puzzles').length;
    const dogCount = analyzed.filter(i => i.quadrant === 'dogs').length;
    const plowhorseCount = analyzed.filter(i => i.quadrant === 'plowhorses').length;

    const profitScore = Math.min(100, Math.round(((starCount * 2 + puzzleCount * 1.5 + plowhorseCount) / (Math.max(1, analyzed.length) * 2)) * 100));

    return {
      analyzedItems: analyzed,
      stats: {
        totalRevenue,
        totalVolume,
        starCount,
        plowhorseCount,
        puzzleCount,
        dogCount,
        profitScore
      }
    };
  }, [menuItems, orders]);

  const filteredList = useMemo(() => {
    if (activeFilter === 'all') return analyzedItems;
    return analyzedItems.filter(i => i.quadrant === activeFilter);
  }, [analyzedItems, activeFilter]);

  const getBadgeForQuadrant = (quadrant: MatrixQuadrant) => {
    switch (quadrant) {
      case 'stars':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
            <Star size={11} className="fill-amber-400 text-amber-400" /> Star Dish
          </span>
        );
      case 'plowhorses':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
            <Utensils size={11} /> Plowhorse
          </span>
        );
      case 'puzzles':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
            <Sparkles size={11} /> Puzzle
          </span>
        );
      case 'dogs':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
            <AlertTriangle size={11} /> Dog
          </span>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="rounded-2xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 h-11 px-4 text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.15)] flex items-center gap-2 transition-all cursor-pointer"
        >
          <TrendingUp size={16} />
          <span>Menu Engineering &amp; BCG Matrix</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl bg-[#090A0E] border border-white/10 text-white p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-2xl max-h-[92vh] flex flex-col custom-scrollbar">
        <DialogHeader className="space-y-1 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BarChart3 size={20} />
            </div>
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-white flex items-center gap-2">
                BCG Menu Engineering &amp; Profitability Intelligence
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[9px] uppercase tracking-wider font-mono">
                  Consultant Grade
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-white/50">
                Data-driven margin optimization matrix categorizing dishes into Stars, Plowhorses, Puzzles, and Dogs.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Executive Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-2 shrink-0">
          <div className="bg-[#10121A] border border-white/5 p-3 rounded-2xl">
            <span className="text-[10px] uppercase font-bold tracking-wider text-white/50">Catalog Sales</span>
            <div className="text-lg font-mono font-bold text-primary mt-0.5">
              ₹{stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">From {stats.totalVolume} items sold</span>
          </div>

          <div className="bg-[#10121A] border border-white/5 p-3 rounded-2xl">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1">
              <Star size={11} className="fill-amber-400" /> Stars (High Profit)
            </span>
            <div className="text-lg font-mono font-bold text-amber-300 mt-0.5">
              {stats.starCount} Dishes
            </div>
            <span className="text-[10px] text-white/40">Prime revenue drivers</span>
          </div>

          <div className="bg-[#10121A] border border-white/5 p-3 rounded-2xl">
            <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 flex items-center gap-1">
              <Sparkles size={11} /> Puzzles (High Margin)
            </span>
            <div className="text-lg font-mono font-bold text-purple-300 mt-0.5">
              {stats.puzzleCount} Dishes
            </div>
            <span className="text-[10px] text-purple-400/80">Opportunity to upsell</span>
          </div>

          <div className="bg-[#10121A] border border-white/5 p-3 rounded-2xl">
            <span className="text-[10px] uppercase font-bold tracking-wider text-white/50">Profit Health Score</span>
            <div className="text-lg font-mono font-bold text-emerald-400 mt-0.5">
              {stats.profitScore}/100
            </div>
            <span className="text-[10px] text-white/40">Matrix health index</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 custom-scrollbar">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 mr-1 flex items-center gap-1">
            <Filter size={11} /> Filter:
          </span>
          {[
            { id: 'all', label: `All Dishes (${analyzedItems.length})` },
            { id: 'stars', label: `⭐ Stars (${stats.starCount})` },
            { id: 'plowhorses', label: `🐎 Plowhorses (${stats.plowhorseCount})` },
            { id: 'puzzles', label: `❓ Puzzles (${stats.puzzleCount})` },
            { id: 'dogs', label: `🐕 Dogs (${stats.dogCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === tab.id
                  ? 'bg-primary text-black font-extrabold shadow-[0_0_15px_rgba(197,160,89,0.25)]'
                  : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Analyzed Dishes Table */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
          <div className="rounded-2xl border border-white/10 bg-[#08090D] overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-white/60 text-[10px] uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Dish / Category</th>
                  <th className="py-2.5 px-3">BCG Matrix Status</th>
                  <th className="py-2.5 px-3 text-right">Price</th>
                  <th className="py-2.5 px-3 text-right">Qty Sold</th>
                  <th className="py-2.5 px-3 text-right">Revenue (₹)</th>
                  <th className="py-2.5 px-3">Strategic Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredList.map(item => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-white block">{item.name}</span>
                      <span className="text-[10px] text-white/50 uppercase tracking-wider font-mono">{item.category}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      {getBadgeForQuadrant(item.quadrant)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-white/80">
                      ₹{item.price.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                      {item.quantitySold}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">
                      ₹{item.totalRevenue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-white/70 max-w-[280px]">
                      {item.actionRecommendation}
                    </td>
                  </tr>
                ))}

                {filteredList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-white/50 text-xs font-serif">
                      No items found in this classification.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Captain Upsell Cheat-Sheet Card */}
          <div className="bg-gradient-to-r from-purple-950/30 via-[#10121A] to-amber-950/20 border border-purple-500/20 p-4 rounded-2xl space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-purple-300 flex items-center gap-1.5">
              <MessageSquare size={14} className="text-purple-400" />
              Captain Floor Upsell Strategy (Instant Revenue Lift)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-white/70">
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                <span className="font-bold text-amber-400 block mb-0.5">1. Star Preservation</span>
                Always ensure top-selling Stars are prepped and never run out during 8 PM rush.
              </div>
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                <span className="font-bold text-purple-400 block mb-0.5">2. Verbal Puzzle Recommendations</span>
                Instruct captains to suggest: <em>"Our chef's signature {analyzedItems.find(i => i.quadrant === 'puzzles')?.name || 'Specialty Dish'} is freshly prepared tonight"</em>.
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
