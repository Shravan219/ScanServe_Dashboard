import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Coffee,
  ChefHat,
  LayoutDashboard,
  Utensils,
  MessageSquare,
  ShieldCheck,
  Zap,
  Server,
  Globe,
  Printer,
  Users,
  CreditCard,
  RefreshCcw,
  Smartphone,
  Flame,
  FileText,
  Star,
  Layers,
  ArrowUpRight,
  Shield,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DemoTier } from '@/src/lib/demoData';
import { LegalModal, LegalDocType } from '@/src/components/legal/LegalModal';
import { VyomaLogo, VyomaEmblem } from '@/src/components/brand/VyomaLogo';

interface LandingPageProps {
  onLaunchDemo: (tier: DemoTier) => void;
  onStaffLogin?: () => void;
}

export function LandingPage({ onLaunchDemo, onStaffLogin }: LandingPageProps) {
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [heroPreviewTab, setHeroPreviewTab] = useState<'tables' | 'kds' | 'whatsapp'>('tables');
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [selectedLegalDoc, setSelectedLegalDoc] = useState<LegalDocType>('terms');

  const handleOpenLegal = (doc: LegalDocType) => {
    setSelectedLegalDoc(doc);
    setLegalModalOpen(true);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30 selection:text-primary font-sans overflow-x-hidden">
      {/* Background ambient lighting effects */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/10 blur-[150px] rounded-full opacity-60" />
        <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-amber-600/5 blur-[180px] rounded-full" />
        <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] bg-primary/5 blur-[160px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:32px_32px] opacity-70" />
      </div>

      {/* Top Floating Glass Navigation */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-black/65 border-b border-white/8 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Emblem */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <VyomaLogo variant="horizontal" size={26} subtitle="ScanServe OS" />
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-[0.15em] text-white/70">
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Capabilities
            </button>
            <button
              onClick={() => scrollToSection('architecture')}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Operations
            </button>
            <button
              onClick={() => scrollToSection('metrics')}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Performance
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              FAQ
            </button>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {onStaffLogin && (
              <button
                onClick={onStaffLogin}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <Shield size={13} className="text-primary" />
                Staff Access
              </button>
            )}

            <Button
              onClick={() => onLaunchDemo('brasserie')}
              className="relative group overflow-hidden rounded-xl bg-gradient-to-r from-primary via-[#D4AF37] to-primary text-black font-extrabold text-[11px] uppercase tracking-[0.2em] px-5 py-2.5 shadow-[0_0_25px_rgba(197,160,89,0.3)] hover:shadow-[0_0_35px_rgba(197,160,89,0.5)] transition-all duration-300 active:scale-95 cursor-pointer border border-primary/50"
            >
              <span className="flex items-center gap-2 relative z-10">
                <span className="h-2 w-2 rounded-full bg-black animate-pulse" />
                Live Demo
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center flex flex-col items-center">
          {/* Michelin Telemetry Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(197,160,89,0.15)]"
          >
            <VyomaEmblem size={16} />
            <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.15em] sm:tracking-[0.25em]">
              <span className="sm:hidden">Michelin-Grade POS & KDS</span>
              <span className="hidden sm:inline">The Obsidian Guild • Michelin-Grade Hospitality POS & KDS</span>
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          </motion.div>

          {/* Neoclassical Serif Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08] max-w-5xl"
          >
            Fine Dining Velocity.{' '}
            <span className="italic font-normal text-primary">
              Flawless Floor & Kitchen Synchrony.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg md:text-xl text-white/70 max-w-3xl font-normal leading-relaxed"
          >
            The mission-critical restaurant management operating system. Zero-latency tableside ordering,
            real-time kitchen display routing, automated WhatsApp digital tax invoicing, and seamless
            omnichannel delivery intake engineered for high-tempo luxury hospitality.
          </motion.p>

          {/* Tier-Specific Live Demo Direct Launch Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col items-center gap-3 w-full max-w-3xl"
          >
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary/90 font-bold bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
              Explore Live Demos by Tier:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
              <button
                type="button"
                onClick={() => onLaunchDemo('bistro')}
                className="flex items-center justify-between px-4 py-3.5 rounded-2xl border border-sky-500/30 bg-sky-500/5 hover:bg-sky-500/15 text-white transition-all cursor-pointer active:scale-95 group shadow-sm text-left"
              >
                <div>
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                    <Coffee size={14} className="group-hover:scale-110 transition-transform" />
                    <span>Bistro & Cafe Demo</span>
                  </div>
                  <p className="text-[10px] text-white/70 font-mono mt-0.5">1 KDS • 2 Tablets • Quick Cafe</p>
                </div>
                <ArrowRight size={13} className="text-sky-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0 ml-1" />
              </button>

              <button
                type="button"
                onClick={() => onLaunchDemo('brasserie')}
                className="flex items-center justify-between px-4 py-3.5 rounded-2xl border border-primary bg-gradient-to-r from-primary/15 via-[#1A1810] to-primary/10 hover:from-primary/25 hover:to-primary/20 text-white transition-all cursor-pointer active:scale-95 group shadow-[0_0_25px_rgba(197,160,89,0.2)] ring-1 ring-primary/40 text-left"
              >
                <div>
                  <div className="flex items-center gap-2 text-primary font-bold text-xs">
                    <Sparkles size={14} className="group-hover:rotate-12 transition-transform text-primary" />
                    <span>Grand Brasserie Demo</span>
                  </div>
                  <p className="text-[10px] text-primary/90 font-mono mt-0.5">Multi-KDS • Swiggy • VIP CRM</p>
                </div>
                <ArrowRight size={13} className="text-primary group-hover:translate-x-1 transition-all shrink-0 ml-1" />
              </button>

              <button
                type="button"
                onClick={() => onLaunchDemo('enterprise')}
                className="flex items-center justify-between px-4 py-3.5 rounded-2xl border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/15 text-white transition-all cursor-pointer active:scale-95 group shadow-sm text-left"
              >
                <div>
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                    <Layers size={14} className="group-hover:scale-110 transition-transform" />
                    <span>Enterprise Demo</span>
                  </div>
                  <p className="text-[10px] text-white/70 font-mono mt-0.5">Multi-Outlet • Relay Box • ERP</p>
                </div>
                <ArrowRight size={13} className="text-purple-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0 ml-1" />
              </button>
            </div>
          </motion.div>

          <div className="mt-5 flex items-center gap-2 text-[11px] text-white/75 font-mono">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span>Instant In-Browser Sandboxes • Switch Between Tiers Anytime Inside Dashboard</span>
          </div>

          {/* Interactive Live Teaser Widget */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-14 w-full max-w-5xl rounded-3xl border border-white/10 bg-[#0A0A0E]/90 p-3 sm:p-5 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative group overflow-hidden text-left"
          >
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/15 blur-[90px] rounded-full pointer-events-none" />

            {/* Widget Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/8 px-2">
              <div className="flex items-center gap-2.5">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[11px] font-mono text-white/50 ml-2">
                  live-session // <span className="text-primary font-bold">vyoma-mesh-telemetry</span>
                </span>
              </div>

              {/* View Switcher Tabs */}
              <div 
                role="tablist" 
                aria-label="Interactive live telemetry views"
                className="flex items-center bg-black/60 rounded-xl p-1 border border-white/10 text-[10px] font-bold uppercase tracking-wider overflow-x-auto max-w-full custom-scrollbar touch-pan-x"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={heroPreviewTab === 'tables'}
                  aria-controls="hero-preview-tables"
                  onClick={() => setHeroPreviewTab('tables')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    heroPreviewTab === 'tables'
                      ? 'bg-primary text-black shadow-[0_0_12px_rgba(197,160,89,0.3)]'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Floor Grid
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={heroPreviewTab === 'kds'}
                  aria-controls="hero-preview-kds"
                  onClick={() => setHeroPreviewTab('kds')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    heroPreviewTab === 'kds'
                      ? 'bg-primary text-black shadow-[0_0_12px_rgba(197,160,89,0.3)]'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Live KDS Pass
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={heroPreviewTab === 'whatsapp'}
                  aria-controls="hero-preview-whatsapp"
                  onClick={() => setHeroPreviewTab('whatsapp')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    heroPreviewTab === 'whatsapp'
                      ? 'bg-primary text-black shadow-[0_0_12px_rgba(197,160,89,0.3)]'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  WhatsApp Invoicing
                </button>
              </div>
            </div>

            {/* Teaser Content Views */}
            <div className="py-5 px-2">
              <AnimatePresence mode="wait">
                {heroPreviewTab === 'tables' && (
                  <motion.div
                    key="tables"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
                  >
                    {/* Table 1 */}
                    <div className="rounded-2xl border border-primary/40 bg-gradient-to-b from-primary/10 to-transparent p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-sm font-bold text-primary">TABLE T-04</span>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] font-mono uppercase">
                          Dine-In
                        </Badge>
                      </div>
                      <div className="space-y-1 my-2">
                        <p className="text-xs text-white/90 font-medium truncate">Dr. Rajesh Khanna (VIP)</p>
                        <p className="text-[10px] text-white/50 font-mono">4 Guests • 38 mins seated</p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-white/8 mt-2">
                        <span className="text-[10px] font-mono text-white/40 uppercase">Bill Amount</span>
                        <span className="font-mono text-sm font-bold text-primary">₹ 4,850.00</span>
                      </div>
                    </div>

                    {/* Table 2 */}
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-sm font-bold text-amber-300">TABLE T-07</span>
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[9px] font-mono uppercase">
                          Bill Requested
                        </Badge>
                      </div>
                      <div className="space-y-1 my-2">
                        <p className="text-xs text-white/90 font-medium truncate">Ananya Deshmukh</p>
                        <p className="text-[10px] text-white/50 font-mono">2 Guests • 54 mins seated</p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-white/8 mt-2">
                        <span className="text-[10px] font-mono text-white/40 uppercase">Settlement</span>
                        <span className="font-mono text-sm font-bold text-amber-300">₹ 12,400.00</span>
                      </div>
                    </div>

                    {/* Table 3 */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-sm font-bold text-white/80">TABLE T-09</span>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[9px] font-mono uppercase">
                          Available
                        </Badge>
                      </div>
                      <div className="space-y-1 my-2">
                        <p className="text-xs text-white/60 font-medium">Main Terrace Section</p>
                        <p className="text-[10px] text-white/40 font-mono">Capacity: 6 Seats</p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-white/8 mt-2">
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                          <Check size={11} /> Sanitized & Ready
                        </span>
                      </div>
                    </div>

                    {/* Table 4 */}
                    <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-sm font-bold text-purple-300">TABLE T-12</span>
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[9px] font-mono uppercase">
                          Reserved 8:30 PM
                        </Badge>
                      </div>
                      <div className="space-y-1 my-2">
                        <p className="text-xs text-white/90 font-medium truncate">Lord Somnath Party</p>
                        <p className="text-[10px] text-white/50 font-mono">Private Salon • 8 Guests</p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-white/8 mt-2">
                        <span className="text-[10px] font-mono text-white/40 uppercase">Pre-Auth</span>
                        <span className="font-mono text-sm font-bold text-purple-300">₹ 25,000.00</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {heroPreviewTab === 'kds' && (
                  <motion.div
                    key="kds"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3.5"
                  >
                    {/* Ticket 1 */}
                    <div className="rounded-2xl border border-amber-500/30 bg-[#101116] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono text-xs font-bold">
                          #104 • TABLE T-04
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400">
                          <Clock size={12} /> 04:18
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2">Station: Hot Kitchen</p>
                      <ul className="text-xs space-y-1.5 text-white/85">
                        <li className="flex justify-between"><span>1× Wild Mushroom Truffle Risotto</span></li>
                        <li className="flex justify-between font-mono text-[11px] text-amber-400/90 pl-3">↳ Note: No chives, extra parmesan</li>
                        <li className="flex justify-between"><span>2× Pan-Seared Chilean Sea Bass</span></li>
                      </ul>
                    </div>

                    {/* Ticket 2 */}
                    <div className="rounded-2xl border border-emerald-500/30 bg-[#101116] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
                          #105 • TABLE T-01
                        </span>
                        <Badge className="bg-emerald-500/30 text-emerald-300 text-[9px] font-mono uppercase">
                          Ready for Pass
                        </Badge>
                      </div>
                      <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2">Station: Grill & Char</p>
                      <ul className="text-xs space-y-1.5 text-white/85">
                        <li className="flex justify-between"><span>1× Charcoal Roasted Lamb Chops</span></li>
                        <li className="flex justify-between"><span>1× Rosemary Garlic Naan Basket</span></li>
                      </ul>
                    </div>

                    {/* Ticket 3 */}
                    <div className="rounded-2xl border border-blue-500/30 bg-[#101116] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 font-mono text-xs font-bold">
                          #106 • SWIGGY ONLINE
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-mono text-blue-300">
                          <Clock size={12} /> 01:05
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2">Delivery Aggregator Intake</p>
                      <ul className="text-xs space-y-1.5 text-white/85">
                        <li className="flex justify-between"><span>2× Royal Butter Chicken Meal</span></li>
                        <li className="flex justify-between"><span>2× Dum Gosht Biryani</span></li>
                      </ul>
                    </div>
                  </motion.div>
                )}

                {heroPreviewTab === 'whatsapp' && (
                  <motion.div
                    key="whatsapp"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col sm:flex-row items-center justify-between gap-6 p-4 rounded-2xl bg-gradient-to-r from-[#0C1210] to-[#0A0A0E] border border-emerald-500/20"
                  >
                    <div className="space-y-2 max-w-md">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold">
                        <MessageSquare size={12} /> Automated WhatsApp Delivery Engine
                      </div>
                      <h4 className="font-serif text-lg font-bold text-white">Instant Official Tax PDF to Patron Mobile</h4>
                      <p className="text-xs text-white/60 leading-relaxed">
                        Eliminates lost paper slips. Sends complete GSTIN breakdown, digital payment link, and table summary directly to guest WhatsApp within 1.2 seconds of settlement.
                      </p>
                    </div>

                    <div className="bg-[#121A16] border border-emerald-500/30 rounded-2xl p-4 w-full sm:w-72 shadow-xl">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                        <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <Coffee size={13} className="text-emerald-400" />
                        </div>
                        <span className="text-xs font-bold text-white">Vyoma Concierge Bot</span>
                        <CheckCircle2 size={12} className="text-emerald-400 ml-auto" />
                      </div>
                      <div className="bg-black/50 rounded-xl p-3 text-[11px] font-mono space-y-1 text-white/80">
                        <p className="font-bold text-primary">INVOICE #VYM-2026-904</p>
                        <p>Table T-04 • Total: ₹4,850.00</p>
                        <p className="text-[9px] text-emerald-400">📎 Tax_Invoice_VYM904.pdf (142 KB)</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Demo Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/8 px-2 text-xs">
              <div className="flex items-center gap-3 text-white/60 font-mono text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Realtime WebSocket Connected
                </span>
                <span>•</span>
                <span>Latency: <strong className="text-primary font-bold">34ms</strong></span>
              </div>

              <button
                onClick={() => onLaunchDemo('brasserie')}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary hover:text-[#E8D49E] transition-colors cursor-pointer group"
              >
                Click to enter full interactive playground
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </motion.div>
        </section>

        {/* METRICS & PERFORMANCE STRIP */}
        <section id="metrics" className="border-y border-white/8 bg-[#070709] py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="flex flex-col items-center">
                <span className="font-mono text-3xl sm:text-4xl md:text-5xl font-bold text-primary tracking-tight">
                  &lt; 50ms
                </span>
                <span className="text-xs uppercase tracking-[0.2em] text-white/70 font-bold mt-2">
                  Floor-to-KDS Latency
                </span>
                <p className="text-[11px] text-white/40 mt-1 max-w-[180px]">
                  Real-time WebSocket & SSE event mesh
                </p>
              </div>

              <div className="flex flex-col items-center">
                <span className="font-mono text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
                  3.2×
                </span>
                <span className="text-xs uppercase tracking-[0.2em] text-white/70 font-bold mt-2">
                  Faster Table Turnover
                </span>
                <p className="text-[11px] text-white/40 mt-1 max-w-[180px]">
                  Zero waiter-to-kitchen walk delays
                </p>
              </div>

              <div className="flex flex-col items-center">
                <span className="font-mono text-3xl sm:text-4xl md:text-5xl font-bold text-primary tracking-tight">
                  100%
                </span>
                <span className="text-xs uppercase tracking-[0.2em] text-white/70 font-bold mt-2">
                  Tax & GST Compliant
                </span>
                <p className="text-[11px] text-white/40 mt-1 max-w-[180px]">
                  Thermal 80mm & WhatsApp e-receipts
                </p>
              </div>

              <div className="flex flex-col items-center">
                <span className="font-mono text-3xl sm:text-4xl md:text-5xl font-bold text-emerald-400 tracking-tight">
                  Zero
                </span>
                <span className="text-xs uppercase tracking-[0.2em] text-white/70 font-bold mt-2">
                  Lost Orders
                </span>
                <p className="text-[11px] text-white/40 mt-1 max-w-[180px]">
                  Offline ring buffer resilience
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CORE CAPABILITIES BENTO GRID */}
        <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-primary">
              Core Capabilities
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mt-3 tracking-tight">
              Engineered for High-Pressure Floor & Kitchen Dynamics
            </h2>
            <p className="text-sm sm:text-base text-white/60 mt-4 leading-relaxed">
              Every interface is calibrated for 14-hour restaurant shifts—zero glare in dark dining rooms,
              large 48px tactile hit targets for gloved chefs, and bulletproof offline survivability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1: Captain Ordering */}
            <Card className="rounded-3xl border-white/8 bg-[#0A0A0E] p-6 hover:border-primary/40 transition-all duration-300 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-6 group-hover:scale-110 transition-transform">
                <Smartphone size={24} />
              </div>
              <h3 className="font-serif text-xl font-bold text-white mb-2">Captain Handheld Ordering</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Empower floor captains with quick category carousels, custom dietary notes ("extra spicy, no dairy"),
                split billing, and instant seat allocation on Android tablets and iPads.
              </p>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] font-mono text-primary">
                <span>0-second double-tap zoom delay</span>
              </div>
            </Card>

            {/* Feature 2: Kitchen Display KDS */}
            <Card className="rounded-3xl border-white/8 bg-[#0A0A0E] p-6 hover:border-primary/40 transition-all duration-300 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                <ChefHat size={24} />
              </div>
              <h3 className="font-serif text-xl font-bold text-white mb-2">Multi-Station Kitchen KDS</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Direct tickets to specific kitchen stations (Prep, Grill, Pass, Bar). Ticket aging glows with elapsed timers
                and sounds audible chimes the second a dish is fired or plated.
              </p>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] font-mono text-amber-400">
                <span>Audible sound alerts & glowing timers</span>
              </div>
            </Card>

            {/* Feature 3: Omnichannel Aggregators */}
            <Card className="rounded-3xl border-white/8 bg-[#0A0A0E] p-6 hover:border-primary/40 transition-all duration-300 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                <Globe size={24} />
              </div>
              <h3 className="font-serif text-xl font-bold text-white mb-2">Omnichannel Delivery Hub</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Consolidate incoming orders from Swiggy, Zomato, Magicpin, and Dyno API into a single unified queue.
                Eliminate the counter mess of 6 separate tablet aggregators.
              </p>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] font-mono text-blue-400">
                <span>Direct webhook ingest & live ACK dispatch</span>
              </div>
            </Card>

            {/* Feature 4: WhatsApp Invoicing */}
            <Card className="rounded-3xl border-white/8 bg-[#0A0A0E] p-6 hover:border-primary/40 transition-all duration-300 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare size={24} />
              </div>
              <h3 className="font-serif text-xl font-bold text-white mb-2">Automated WhatsApp Invoicing</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Send professional digital tax invoices with restaurant branding and dynamic payment links directly to
                patrons via WhatsApp Web API. No wasted thermal paper rolls.
              </p>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] font-mono text-emerald-400">
                <span>Instant PDF tax invoice delivery</span>
              </div>
            </Card>

            {/* Feature 5: VIP Loyalty & CRM */}
            <Card className="rounded-3xl border-white/8 bg-[#0A0A0E] p-6 hover:border-primary/40 transition-all duration-300 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
              <h3 className="font-serif text-xl font-bold text-white mb-2">VIP Recognition & Smart Loyalty</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Auto-detects repeat guests by phone number. Automatically marks guests with 3+ visits as VIP patrons
                and applies configured hospitality discounts with zero manual math.
              </p>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] font-mono text-purple-400">
                <span>Automated frequency-based CRM tags</span>
              </div>
            </Card>

            {/* Feature 6: Local Resilience */}
            <Card className="rounded-3xl border-white/8 bg-[#0A0A0E] p-6 hover:border-primary/40 transition-all duration-300 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-6 group-hover:scale-110 transition-transform">
                <Server size={24} />
              </div>
              <h3 className="font-serif text-xl font-bold text-white mb-2">Hybrid On-Premise Resilience</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Local in-memory ring buffer pairs with cloud Supabase replication. If the venue internet cuts out during
                peak rush, floor ordering and KDS printing continue uninterrupted.
              </p>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] font-mono text-primary">
                <span>Zero downtime during cloud outages</span>
              </div>
            </Card>
          </div>
        </section>

        {/* 4-STEP OPERATIONS FLOW */}
        <section id="architecture" className="py-20 border-t border-white/8 bg-gradient-to-b from-[#0A0A0E] to-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-primary">
                Hospitality Architecture
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mt-3 tracking-tight">
                From Seating to Settlement in Minutes
              </h2>
              <p className="text-sm text-white/60 mt-3">
                Experience the synchronized state flow that powers Michelin-grade service velocity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
              {/* Step 1 */}
              <div className="relative rounded-2xl border border-white/8 bg-white/[0.02] p-6 text-left">
                <span className="font-mono text-3xl font-bold text-primary/40">01</span>
                <h4 className="font-serif text-lg font-bold text-white mt-3 mb-2">Floor Seating & Intake</h4>
                <p className="text-xs text-white/60 leading-relaxed">
                  Captain marks table occupied, attaches dietary preferences, and fires orders with a single tap.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative rounded-2xl border border-white/8 bg-white/[0.02] p-6 text-left">
                <span className="font-mono text-3xl font-bold text-amber-400/40">02</span>
                <h4 className="font-serif text-lg font-bold text-white mt-3 mb-2">KDS Station Routing</h4>
                <p className="text-xs text-white/60 leading-relaxed">
                  Dishes split to Grill, Prep, or Bar stations with countdown timers and color-coded ticket aging.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative rounded-2xl border border-white/8 bg-white/[0.02] p-6 text-left">
                <span className="font-mono text-3xl font-bold text-emerald-400/40">03</span>
                <h4 className="font-serif text-lg font-bold text-white mt-3 mb-2">Expedite & Audio Chime</h4>
                <p className="text-xs text-white/60 leading-relaxed">
                  Plated dishes are marked ready. Captain handheld chimes and flashes the ready table token.
                </p>
              </div>

              {/* Step 4 */}
              <div className="relative rounded-2xl border border-white/8 bg-white/[0.02] p-6 text-left">
                <span className="font-mono text-3xl font-bold text-primary/40">04</span>
                <h4 className="font-serif text-lg font-bold text-white mt-3 mb-2">WhatsApp Settlement</h4>
                <p className="text-xs text-white/60 leading-relaxed">
                  Instant thermal print + WhatsApp PDF dispatch. Customer database updates VIP visit tally.
                </p>
              </div>
            </div>

            {/* Sandbox Callout */}
            <div className="mt-14 rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/10 via-black to-primary/10 p-8 sm:p-10 text-center max-w-4xl mx-auto shadow-[0_0_50px_rgba(197,160,89,0.12)] flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-[#0A0A0E] shadow-[0_0_25px_rgba(197,160,89,0.2)] mb-4">
                <VyomaEmblem size={34} />
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                Want to test this live workflow right now?
              </h3>
              <p className="text-xs sm:text-sm text-white/70 max-w-xl mx-auto mt-2 mb-6 leading-relaxed">
                Enter our pre-seeded live demo environment with simulated orders, active restaurant tables,
                and real kitchen tickets.
              </p>
              <Button
                size="lg"
                onClick={() => onLaunchDemo('brasserie')}
                className="h-13 px-8 rounded-xl bg-primary text-black hover:bg-[#D4AF37] font-extrabold text-xs uppercase tracking-[0.25em] shadow-[0_0_25px_rgba(197,160,89,0.3)] active:scale-95 cursor-pointer"
              >
                <Zap size={15} className="mr-2" /> Launch Live Demo Sandbox
              </Button>
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-primary">
              Transparent Investment
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mt-3 tracking-tight">
              Predictable Pricing for Luxury Hospitality
            </h2>
            <p className="text-sm text-white/60 mt-3">
              Zero hidden commission per ticket. Simple monthly or annual subscriptions with hardware compatibility.
            </p>

            {/* Billing Toggle */}
            <div 
              role="radiogroup" 
              aria-label="Billing frequency selection"
              className="mt-8 inline-flex items-center gap-3 bg-[#0A0A0E] p-1.5 rounded-2xl border border-white/10"
            >
              <button
                type="button"
                role="radio"
                aria-checked={billingCycle === 'annual'}
                onClick={() => setBillingCycle('annual')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  billingCycle === 'annual'
                    ? 'bg-primary text-black shadow-[0_0_15px_rgba(197,160,89,0.3)]'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Annual Billing{' '}
                <span className="ml-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono lowercase">
                  save 20%
                </span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={billingCycle === 'monthly'}
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-primary text-black shadow-[0_0_15px_rgba(197,160,89,0.3)]'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Monthly Billing
              </button>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* TIER 1: Bistro & Cafe */}
            <Card className="rounded-3xl border-white/10 bg-[#0A0A0E] p-8 flex flex-col justify-between hover:border-white/20 transition-all">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-white/50">
                  Tier I • Essential
                </span>
                <h3 className="font-serif text-2xl font-bold text-white mt-1">Bistro & Cafe</h3>
                <p className="text-xs text-white/60 mt-2 min-h-[36px]">
                  Ideal for boutique cafes, cloud kitchens & specialty bistros.
                </p>

                <div className="my-6 pb-6 border-b border-white/10">
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-4xl font-bold text-white">
                      ₹{billingCycle === 'annual' ? '2,999' : '3,749'}
                    </span>
                    <span className="text-xs text-white/50 font-mono">/ month</span>
                  </div>
                  <span className="text-[10px] font-mono text-white/40 block mt-1">
                    {billingCycle === 'annual' ? 'Billed ₹35,988 annually' : 'Billed monthly'}
                  </span>
                </div>

                <div className="space-y-3 text-xs text-white/80">
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-primary shrink-0 mt-0.5" />
                    <span>Up to <strong>2 Captain Floor Tablets</strong></span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-primary shrink-0 mt-0.5" />
                    <span><strong>1 Kitchen KDS Terminal</strong></span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-primary shrink-0 mt-0.5" />
                    <span>QR Code Table Menus & Live Sold-Out Toggles</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-primary shrink-0 mt-0.5" />
                    <span>WhatsApp e-Receipts (up to 500/mo)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-primary shrink-0 mt-0.5" />
                    <span>Offline Fallback with Local Ring Buffer</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-primary shrink-0 mt-0.5" />
                    <span>Email & WhatsApp Chat Support</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/8">
                <Button
                  onClick={() => onLaunchDemo('bistro')}
                  variant="outline"
                  className="w-full rounded-xl h-12 border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 font-bold text-xs uppercase tracking-[0.2em] cursor-pointer active:scale-95"
                >
                  <Coffee size={14} className="mr-2" /> Launch Bistro Live Demo
                </Button>
              </div>
            </Card>

            {/* TIER 2: Grand Brasserie (Most Popular) */}
            <Card className="rounded-3xl border-2 border-primary bg-gradient-to-b from-[#14151B] to-[#0A0A0E] p-8 flex flex-col justify-between relative shadow-[0_0_40px_rgba(197,160,89,0.2)]">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-black font-extrabold text-[10px] font-mono uppercase tracking-[0.2em] px-4 py-1 rounded-full shadow-[0_0_15px_rgba(197,160,89,0.4)]">
                  Michelin Recommended
                </Badge>
              </div>

              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-primary">
                  Tier II • High Velocity
                </span>
                <h3 className="font-serif text-2xl font-bold text-white mt-1">Grand Brasserie</h3>
                <p className="text-xs text-white/70 mt-2 min-h-[36px]">
                  Engineered for fine dining rooms, high-volume gastropubs & luxury hotel dining.
                </p>

                <div className="my-6 pb-6 border-b border-white/10">
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-4xl font-bold text-primary">
                      ₹{billingCycle === 'annual' ? '6,999' : '8,749'}
                    </span>
                    <span className="text-xs text-white/50 font-mono">/ month</span>
                  </div>
                  <span className="text-[10px] font-mono text-primary/80 block mt-1">
                    {billingCycle === 'annual' ? 'Billed ₹83,988 annually (Save ₹21,000)' : 'Billed monthly'}
                  </span>
                </div>

                <div className="space-y-3 text-xs text-white/90">
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-primary shrink-0 mt-0.5" />
                    <span><strong>Unlimited Captain Floor Tablets</strong></span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-primary shrink-0 mt-0.5" />
                    <span><strong>Multi-Station KDS</strong> (Prep, Grill, Cold, Pass)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-primary shrink-0 mt-0.5" />
                    <span><strong>Omnichannel Hub</strong> (Swiggy, Zomato, Magicpin, Dyno)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-primary shrink-0 mt-0.5" />
                    <span><strong>VIP Guest Intelligence & Loyalty</strong> (Auto CRM)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-primary shrink-0 mt-0.5" />
                    <span><strong>Unlimited WhatsApp Digital Invoices</strong></span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-primary shrink-0 mt-0.5" />
                    <span>ESC/POS 80mm Thermal Receipt Bridge</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-primary shrink-0 mt-0.5" />
                    <span>Audible Kitchen Sound Alert Engine</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-primary shrink-0 mt-0.5" />
                    <span>24/7 Dedicated Concierge Support</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-primary/20">
                <Button
                  onClick={() => onLaunchDemo('brasserie')}
                  className="w-full rounded-xl h-12 bg-primary text-black hover:bg-[#D4AF37] font-extrabold text-xs uppercase tracking-[0.25em] shadow-[0_0_25px_rgba(197,160,89,0.35)] cursor-pointer active:scale-95"
                >
                  <Zap size={14} className="mr-2 fill-black" /> Launch Grand Brasserie Live Demo
                </Button>
              </div>
            </Card>

            {/* TIER 3: Enterprise */}
            <Card className="rounded-3xl border-white/10 bg-[#0A0A0E] p-8 flex flex-col justify-between hover:border-white/20 transition-all">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-white/50">
                  Tier III • Multi-Property
                </span>
                <h3 className="font-serif text-2xl font-bold text-white mt-1">Enterprise Group</h3>
                <p className="text-xs text-white/60 mt-2 min-h-[36px]">
                  For multi-location restaurant chains, luxury hotel groups & franchises.
                </p>

                <div className="my-6 pb-6 border-b border-white/10">
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-4xl font-bold text-white">
                      ₹{billingCycle === 'annual' ? '14,999' : '18,749'}
                    </span>
                    <span className="text-xs text-white/50 font-mono">/ month</span>
                  </div>
                  <span className="text-[10px] font-mono text-white/40 block mt-1">
                    Multi-outlet centralized billing
                  </span>
                </div>

                <div className="space-y-3 text-xs text-white/80">
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-primary shrink-0 mt-0.5" />
                    <span><strong>Everything in Grand Brasserie</strong></span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-primary shrink-0 mt-0.5" />
                    <span>Centralized Multi-Outlet Menu & Recipe Catalog</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-primary shrink-0 mt-0.5" />
                    <span>Custom ERP & Tally Prime / SAP Accounting Bridges</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-primary shrink-0 mt-0.5" />
                    <span>On-Premise Dedicated Relay Server Hardware</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-primary shrink-0 mt-0.5" />
                    <span>Staff Role-Based Access with Audit Telemetry</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-primary shrink-0 mt-0.5" />
                    <span>Custom 99.99% SLA & Dedicated Account Director</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/8">
                <Button
                  onClick={() => onLaunchDemo('enterprise')}
                  variant="outline"
                  className="w-full rounded-xl h-12 border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-bold text-xs uppercase tracking-[0.2em] cursor-pointer active:scale-95"
                >
                  <Layers size={14} className="mr-2" /> Launch Enterprise Live Demo
                </Button>
              </div>
            </Card>
          </div>

          {/* FEATURE COMPARISON MATRIX */}
          <div className="mt-20 overflow-x-auto rounded-3xl border border-white/8 bg-[#0A0A0E] p-6 sm:p-8 touch-pan-x custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-2xl font-bold text-white">Detailed Plan Comparison</h3>
              <span className="text-[10px] font-mono text-primary/80 uppercase tracking-wider sm:hidden">
                ← Swipe Table →
              </span>
            </div>
            <table className="w-full min-w-[580px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/70 uppercase font-mono text-[10px] tracking-wider">
                  <th className="pb-4 font-normal">Feature / Module</th>
                  <th className="pb-4 font-normal text-center">Bistro</th>
                  <th className="pb-4 font-normal text-center text-primary">Grand Brasserie</th>
                  <th className="pb-4 font-normal text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/85 font-mono">
                <tr>
                  <td className="py-3.5 font-sans font-medium">Captain Tablets Supported</td>
                  <td className="text-center py-3.5">Up to 2</td>
                  <td className="text-center py-3.5 text-primary font-bold">Unlimited</td>
                  <td className="text-center py-3.5">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3.5 font-sans font-medium">Kitchen KDS Stations</td>
                  <td className="text-center py-3.5">1 Screen</td>
                  <td className="text-center py-3.5 text-primary font-bold">Multi-Station (4+)</td>
                  <td className="text-center py-3.5">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3.5 font-sans font-medium">Swiggy & Zomato Aggregator Intake</td>
                  <td className="text-center py-3.5">
                    <span className="text-white/60 font-semibold" aria-hidden="true">—</span>
                    <span className="sr-only">Not Included in Bistro</span>
                  </td>
                  <td className="text-center py-3.5 text-primary font-bold">Included</td>
                  <td className="text-center py-3.5">Included + Custom APIs</td>
                </tr>
                <tr>
                  <td className="py-3.5 font-sans font-medium">Automated WhatsApp PDF Invoicing</td>
                  <td className="text-center py-3.5">500 / month</td>
                  <td className="text-center py-3.5 text-primary font-bold">Unlimited</td>
                  <td className="text-center py-3.5">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3.5 font-sans font-medium">VIP Loyalty & Frequency Tagging</td>
                  <td className="text-center py-3.5">
                    <span className="text-white/60 font-semibold" aria-hidden="true">—</span>
                    <span className="sr-only">Not Included in Bistro</span>
                  </td>
                  <td className="text-center py-3.5 text-primary font-bold">Included</td>
                  <td className="text-center py-3.5">Included + Advanced ML</td>
                </tr>
                <tr>
                  <td className="py-3.5 font-sans font-medium">ESC/POS 80mm Thermal Printer Bridge</td>
                  <td className="text-center py-3.5">Standard</td>
                  <td className="text-center py-3.5 text-primary font-bold">Fast Dual-Print</td>
                  <td className="text-center py-3.5">Enterprise Multi-Lane</td>
                </tr>
                <tr>
                  <td className="py-3.5 font-sans font-medium">Offline In-Memory Ring Buffer</td>
                  <td className="text-center py-3.5">Yes</td>
                  <td className="text-center py-3.5 text-primary font-bold">Yes</td>
                  <td className="text-center py-3.5">Yes + On-Premises Relay</td>
                </tr>
                <tr className="border-t border-white/10">
                  <td className="py-4 font-sans font-bold text-white">Experience Live Sandbox</td>
                  <td className="text-center py-4">
                    <Button onClick={() => onLaunchDemo('bistro')} variant="outline" size="sm" className="text-[10px] uppercase font-bold tracking-wider rounded-lg h-8 border-sky-500/30 text-sky-300 hover:bg-sky-500/10 cursor-pointer">
                      Bistro Demo
                    </Button>
                  </td>
                  <td className="text-center py-4">
                    <Button onClick={() => onLaunchDemo('brasserie')} size="sm" className="text-[10px] uppercase font-bold tracking-wider rounded-lg h-8 bg-primary text-black hover:bg-primary/90 shadow-[0_0_15px_rgba(197,160,89,0.3)] cursor-pointer">
                      Brasserie Demo
                    </Button>
                  </td>
                  <td className="text-center py-4">
                    <Button onClick={() => onLaunchDemo('enterprise')} variant="outline" size="sm" className="text-[10px] uppercase font-bold tracking-wider rounded-lg h-8 border-purple-500/30 text-purple-300 hover:bg-purple-500/10 cursor-pointer">
                      Enterprise Demo
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ ACCORDION SECTION */}
        <section id="faq" className="py-20 border-t border-white/8 bg-[#070709]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-primary">
                Got Questions?
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-2">
                Frequently Answered Inquiries
              </h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: 'What hardware devices do we need to run Vyoma ScanServe?',
                  a: 'Vyoma runs seamlessly on standard off-the-shelf hardware. Captain floor ordering works on any 10-inch Android tablet, iPad, or mobile browser. Kitchen KDS works on any touch monitor or TV. Cashier printing integrates with any standard 80mm ESC/POS USB, Ethernet, or Bluetooth thermal receipt printer.'
                },
                {
                  q: 'How does the offline mode protect our kitchen during Wi-Fi cuts?',
                  a: 'Vyoma utilizes an in-memory ring buffer with local browser SQLite and Server-Sent Events (SSE). If the venue loses internet connection, captains can still fire orders, tickets still print at the kitchen pass, and receipts calculate correctly. Once connectivity restores, everything synchronizes to Supabase cloud automatically.'
                },
                {
                  q: 'How does automated WhatsApp invoice delivery work?',
                  a: 'Upon bill settlement, our headless Baileys WhatsApp bot compiles an official GST-compliant PDF invoice (complete with QR code, tax breakdown, and itemization) and transmits it straight to the patron’s mobile number within 1.2 seconds.'
                },
                {
                  q: 'Can we try the live interactive demo before subscribing?',
                  a: 'Yes! Simply click the "Launch Live Demo" button on this page. It grants instant sandbox access to the full operational dashboard with preloaded fine dining menu items, active tables, and interactive kitchen ticket controls.'
                },
                {
                  q: 'How long does restaurant deployment and staff training take?',
                  a: 'Most venues are fully onboarded within 24 hours. Because our ergonomic UI follows natural restaurant floor intuition, waitstaff master the captain ordering workflow in under 15 minutes.'
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-[#0A0A0E] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    id={`faq-trigger-${idx}`}
                    aria-expanded={activeFaq === idx}
                    aria-controls={`faq-panel-${idx}`}
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left text-sm font-bold text-white hover:text-primary transition-colors cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-primary transition-transform duration-300 ${
                        activeFaq === idx ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  {activeFaq === idx && (
                    <div 
                      id={`faq-panel-${idx}`}
                      role="region"
                      aria-labelledby={`faq-trigger-${idx}`}
                      className="px-6 pb-5 pt-1 text-xs text-white/80 leading-relaxed border-t border-white/5"
                    >
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CONVERSION CTA BANNER */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-3xl border border-primary/40 bg-gradient-to-b from-primary/15 via-[#0C0D12] to-black p-10 sm:p-16 relative overflow-hidden shadow-[0_0_60px_rgba(197,160,89,0.15)]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

            <span className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-primary">
              Ready for Michelin-Grade Service?
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-white mt-4 max-w-3xl mx-auto leading-tight">
              Elevate Your Floor Operations Today.
            </h2>
            <p className="text-sm sm:text-base text-white/70 max-w-xl mx-auto mt-4 leading-relaxed">
              Join leading fine dining venues running zero-latency ordering, synced KDS production, and digital
              WhatsApp settlements.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => onLaunchDemo('brasserie')}
                className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-primary text-black hover:bg-[#D4AF37] font-extrabold text-xs uppercase tracking-[0.25em] shadow-[0_0_35px_rgba(197,160,89,0.4)] transition-all duration-300 active:scale-95 cursor-pointer group"
              >
                <Zap size={16} className="mr-2 fill-black" />
                Launch Live Demo Dashboard
                <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1.5" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => scrollToSection('pricing')}
                className="w-full sm:w-auto h-14 px-8 rounded-2xl border-white/15 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-[0.2em] cursor-pointer"
              >
                View Plans & Pricing
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/8 bg-black py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col gap-8 text-xs text-white/50 font-mono">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/20 via-black to-[#0A0A0E] border border-primary/30 flex items-center justify-center shadow-[0_0_15px_rgba(197,160,89,0.15)]">
              <VyomaEmblem size={18} />
            </div>
            <span className="font-serif text-sm font-bold text-white">Vyoma ScanServe</span>
            <span>&copy; 2026 &bull; The Obsidian Guild</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              All Systems Operational
            </span>
            <span>WebSocket <strong className="text-white">v1.0-PROD</strong></span>
          </div>
        </div>

        {/* Legal & Compliance Links */}
        <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px]">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2">
            <button
              type="button"
              onClick={() => handleOpenLegal('terms')}
              className="py-1.5 px-1 text-white/70 hover:text-primary transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <span className="text-white/40" aria-hidden="true">&bull;</span>
            <button
              type="button"
              onClick={() => handleOpenLegal('privacy')}
              className="py-1.5 px-1 text-white/70 hover:text-primary transition-colors cursor-pointer"
            >
              Privacy Policy (DPDP Act)
            </button>
            <span className="text-white/40" aria-hidden="true">&bull;</span>
            <button
              type="button"
              onClick={() => handleOpenLegal('dpa')}
              className="py-1.5 px-1 text-white/70 hover:text-primary transition-colors cursor-pointer"
            >
              Data Processing (DPA)
            </button>
            <span className="text-white/40" aria-hidden="true">&bull;</span>
            <button
              type="button"
              onClick={() => handleOpenLegal('cookies')}
              className="py-1.5 px-1 text-white/70 hover:text-primary transition-colors cursor-pointer"
            >
              Cookie &amp; Storage Policy
            </button>
            <span className="text-white/40" aria-hidden="true">&bull;</span>
            <button
              type="button"
              onClick={() => handleOpenLegal('gst')}
              className="py-1.5 px-1 text-white/70 hover:text-primary transition-colors cursor-pointer"
            >
              GST Tax Disclaimer
            </button>
          </div>

          <div className="flex items-center gap-2 text-white/70 text-[10px]">
            <ShieldCheck size={13} className="text-primary" />
            <span>DPDP Act 2023 Compliant &bull; ISO 27001 Aligned</span>
          </div>
        </div>
      </footer>

      {/* Compliance & Legal Center Modal */}
      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialDoc={selectedLegalDoc}
      />
    </div>
  );
}
