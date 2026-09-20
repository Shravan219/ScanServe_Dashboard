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
  HelpCircle,
  Activity
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
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-black/65 border-b border-white/[0.08] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Emblem */}
          <button
            type="button"
            aria-label="Vyoma ScanServe - Return to top of page"
            className="flex items-center gap-3 cursor-pointer group text-left border-none bg-transparent p-1 -m-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl active:scale-95 touch-manipulation transition-all"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <VyomaLogo variant="horizontal" size={26} subtitle="ScanServe OS" />
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-[0.15em] text-white/70">
            <a
              href="#features"
              onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}
              className="hover:text-primary transition-colors cursor-pointer active:scale-95 touch-manipulation focus-visible:outline-none focus-visible:text-primary"
            >
              Capabilities
            </a>
            <a
              href="#architecture"
              onClick={(e) => { e.preventDefault(); scrollToSection('architecture'); }}
              className="hover:text-primary transition-colors cursor-pointer active:scale-95 touch-manipulation focus-visible:outline-none focus-visible:text-primary"
            >
              Operations
            </a>
            <a
              href="#metrics"
              onClick={(e) => { e.preventDefault(); scrollToSection('metrics'); }}
              className="hover:text-primary transition-colors cursor-pointer active:scale-95 touch-manipulation focus-visible:outline-none focus-visible:text-primary"
            >
              Performance
            </a>
            <a
              href="#pricing"
              onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }}
              className="hover:text-primary transition-colors cursor-pointer active:scale-95 touch-manipulation focus-visible:outline-none focus-visible:text-primary"
            >
              Pricing
            </a>
            <a
              href="#faq"
              onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }}
              className="hover:text-primary transition-colors cursor-pointer active:scale-95 touch-manipulation focus-visible:outline-none focus-visible:text-primary"
            >
              FAQ
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {onStaffLogin && (
              <button
                onClick={onStaffLogin}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-white/80 hover:text-white hover:bg-white/10 active:scale-95 touch-manipulation transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
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
          {/* Michelin Telemetry Badge & Station Coordinates */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary mb-8 backdrop-blur-md shadow-[0_0_25px_rgba(197,160,89,0.2)]"
          >
            <VyomaEmblem size={16} />
            <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.15em] sm:tracking-[0.25em]">
              <span className="sm:hidden">Michelin-Grade POS & KDS</span>
              <span className="hidden sm:inline">The Obsidian Guild • Michelin-Grade Hospitality POS & KDS</span>
            </span>
            <span className="hidden md:inline text-primary/40 font-mono text-[10px]">•</span>
            <span className="hidden md:inline font-mono text-[10px] text-primary/80 tracking-widest">[28.6139° N, 77.2090° E // MESH-NODE-01]</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          </motion.div>

          {/* Monumental Neoclassical Serif Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[1.03] max-w-5xl drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)]"
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
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 sm:mt-8 text-base sm:text-lg md:text-xl text-white/80 max-w-3xl font-normal leading-relaxed text-balance"
          >
            The mission-critical restaurant management operating system. Zero-latency tableside ordering,
            real-time kitchen display routing, automated WhatsApp digital tax invoicing, and seamless
            omnichannel delivery intake engineered for high-tempo luxury hospitality.
          </motion.p>

          {/* Tier-Specific Live Demo Direct Launch Bar with Flagship Pedestal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 sm:mt-12 flex flex-col items-center gap-3 w-full max-w-4xl"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary/90 font-bold bg-primary/10 border border-primary/20 px-3.5 py-1 rounded-full shadow-sm">
                Explore Live Interactive Sandboxes by Tier:
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full items-center">
              {/* Bistro Tier Button */}
              <button
                type="button"
                aria-label="Launch Bistro & Cafe Demo (1 KDS, 2 Tablets)"
                onClick={() => onLaunchDemo('bistro')}
                className="flex items-center justify-between px-4 py-4 rounded-2xl border border-sky-500/25 bg-sky-500/5 hover:bg-sky-500/15 text-white transition-all cursor-pointer active:scale-95 group shadow-sm text-left touch-manipulation focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-500/50"
              >
                <div>
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                    <Coffee size={14} className="group-hover:scale-110 transition-transform" />
                    <span>Bistro & Cafe Demo</span>
                  </div>
                  <p className="text-[10px] text-white/70 font-mono mt-0.5">1 KDS • 2 Tablets • Fast Casual</p>
                </div>
                <ArrowRight size={14} className="text-sky-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0 ml-1" />
              </button>

              {/* Grand Brasserie Flagship Pedestal Button */}
              <button
                type="button"
                aria-label="Launch Grand Brasserie Flagship Demo (Multi-KDS, Swiggy, VIP CRM)"
                onClick={() => onLaunchDemo('brasserie')}
                className="relative flex items-center justify-between px-5 py-4 sm:py-5 rounded-2xl border-2 border-primary bg-gradient-to-b from-[#1C1810] via-primary/15 to-[#0F0E0A] hover:from-[#241F14] hover:to-[#15130D] text-white transition-all cursor-pointer active:scale-95 group shadow-[0_0_35px_rgba(197,160,89,0.3)] ring-1 ring-primary/50 text-left sm:-translate-y-1 sm:scale-[1.03] z-10 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-primary text-black font-mono font-extrabold text-[9px] uppercase tracking-widest shadow-md">
                  Flagship Experience
                </div>
                <div>
                  <div className="flex items-center gap-2 text-primary font-bold text-xs sm:text-sm">
                    <Sparkles size={15} className="group-hover:rotate-12 transition-transform text-primary shrink-0" />
                    <span>Grand Brasserie Demo</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-primary/90 font-mono mt-0.5">Multi-KDS • Swiggy • VIP CRM</p>
                </div>
                <ArrowRight size={15} className="text-primary group-hover:translate-x-1 transition-all shrink-0 ml-1" />
              </button>

              {/* Enterprise Tier Button */}
              <button
                type="button"
                aria-label="Launch Enterprise Demo (Multi-Outlet, Relay Box, ERP)"
                onClick={() => onLaunchDemo('enterprise')}
                className="flex items-center justify-between px-4 py-4 rounded-2xl border border-purple-500/25 bg-purple-500/5 hover:bg-purple-500/15 text-white transition-all cursor-pointer active:scale-95 group shadow-sm text-left touch-manipulation focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500/50"
              >
                <div>
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                    <Layers size={14} className="group-hover:scale-110 transition-transform" />
                    <span>Enterprise Demo</span>
                  </div>
                  <p className="text-[10px] text-white/70 font-mono mt-0.5">Multi-Outlet • Relay Box • ERP</p>
                </div>
                <ArrowRight size={14} className="text-purple-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0 ml-1" />
              </button>
            </div>
          </motion.div>

          <div className="mt-5 flex items-center gap-2 text-[11px] text-white/75 font-mono">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span>Instant In-Browser Sandboxes • Switch Between Tiers Anytime Inside Dashboard</span>
          </div>

          {/* Interactive Live Telemetry Command Center */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-14 sm:mt-16 w-full max-w-5xl rounded-3xl border border-white/15 bg-[#08080C]/95 p-3.5 sm:p-6 backdrop-blur-2xl shadow-[0_25px_80px_rgba(0,0,0,0.9)] relative group overflow-hidden text-left ring-1 ring-white/5"
          >
            <div className="absolute -top-32 -right-32 w-72 h-72 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

            {/* Console Top Telemetry Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.08] px-1 sm:px-2">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5" aria-hidden="true">
                  <div className="h-3 w-3 rounded-full bg-red-500/80 border border-red-400/40" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80 border border-amber-400/40" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80 border border-emerald-400/40" />
                </div>
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-[11px] font-mono text-white/50">
                    mesh-telemetry // <span className="text-primary font-bold">vyoma-node-01</span>
                  </span>
                  <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    PASS: ONLINE
                  </span>
                  <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono font-semibold">
                    KDS 1-4: SYNCED
                  </span>
                </div>
              </div>

              {/* View Switcher Tabs */}
              <div 
                role="tablist" 
                aria-label="Interactive live telemetry views"
                className="flex items-center bg-black/70 rounded-xl p-1 border border-white/10 text-[10px] font-bold uppercase tracking-wider overflow-x-auto max-w-full custom-scrollbar touch-pan-x"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={heroPreviewTab === 'tables'}
                  aria-controls="hero-preview-tables"
                  onClick={() => setHeroPreviewTab('tables')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer active:scale-95 touch-manipulation focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 ${
                    heroPreviewTab === 'tables'
                      ? 'bg-primary text-black font-extrabold shadow-[0_0_15px_rgba(197,160,89,0.35)]'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <span>Floor Grid</span>
                  <span className={`text-[9px] font-mono px-1 rounded ${heroPreviewTab === 'tables' ? 'bg-black/20 text-black' : 'bg-white/10 text-white/60'}`}>4</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={heroPreviewTab === 'kds'}
                  aria-controls="hero-preview-kds"
                  onClick={() => setHeroPreviewTab('kds')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer active:scale-95 touch-manipulation focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 ${
                    heroPreviewTab === 'kds'
                      ? 'bg-primary text-black font-extrabold shadow-[0_0_15px_rgba(197,160,89,0.35)]'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <span>Live KDS Pass</span>
                  <span className={`text-[9px] font-mono px-1 rounded ${heroPreviewTab === 'kds' ? 'bg-black/20 text-black' : 'bg-white/10 text-white/60'}`}>3</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={heroPreviewTab === 'whatsapp'}
                  aria-controls="hero-preview-whatsapp"
                  onClick={() => setHeroPreviewTab('whatsapp')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer active:scale-95 touch-manipulation focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 ${
                    heroPreviewTab === 'whatsapp'
                      ? 'bg-primary text-black font-extrabold shadow-[0_0_15px_rgba(197,160,89,0.35)]'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <span>WhatsApp Invoicing</span>
                  <span className={`text-[9px] font-mono px-1 rounded ${heroPreviewTab === 'whatsapp' ? 'bg-black/20 text-black' : 'bg-white/10 text-white/60'}`}>1.2s</span>
                </button>
              </div>
            </div>

            {/* Teaser Content Views */}
            <div className="py-5 px-1 sm:px-2">
              <AnimatePresence mode="wait">
                {heroPreviewTab === 'tables' && (
                  <motion.div
                    key="tables"
                    id="hero-preview-tables"
                    role="tabpanel"
                    aria-label="Floor Grid Telemetry"
                    initial={{ opacity: 0, scale: 0.98, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -4 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
                  >
                    {/* Table 1 - Active VIP Dine-In */}
                    <div className="rounded-2xl border border-primary/40 bg-gradient-to-b from-primary/10 via-[#0F0F14] to-black/80 p-4 flex flex-col justify-between shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="font-mono text-sm font-bold text-primary">TABLE T-04</span>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] font-mono uppercase">
                          VIP Dine-In
                        </Badge>
                      </div>
                      <div className="space-y-1 my-2">
                        <p className="text-xs text-white/95 font-semibold truncate">Dr. Rajesh Khanna</p>
                        <p className="text-[10px] text-white/60 font-mono">4 Guests • 38m seated</p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-white/[0.08] mt-2">
                        <span className="text-[10px] font-mono text-white/40 uppercase">Live Bill</span>
                        <span className="font-mono text-sm font-bold text-primary">₹ 4,850.00</span>
                      </div>
                    </div>

                    {/* Table 2 - Settlement Pending */}
                    <div className="rounded-2xl border border-amber-500/35 bg-gradient-to-b from-amber-500/10 via-[#120F0A] to-black/80 p-4 flex flex-col justify-between shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                          <span className="font-mono text-sm font-bold text-amber-300">TABLE T-07</span>
                        </div>
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[9px] font-mono uppercase">
                          Bill Requested
                        </Badge>
                      </div>
                      <div className="space-y-1 my-2">
                        <p className="text-xs text-white/95 font-semibold truncate">Ananya Deshmukh</p>
                        <p className="text-[10px] text-white/60 font-mono">2 Guests • 54m seated</p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-white/[0.08] mt-2">
                        <span className="text-[10px] font-mono text-white/40 uppercase">Settlement</span>
                        <span className="font-mono text-sm font-bold text-amber-300">₹ 12,400.00</span>
                      </div>
                    </div>

                    {/* Table 3 - Available & Sanitized */}
                    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-black/80 p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-sm font-bold text-white/80">TABLE T-09</span>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[9px] font-mono uppercase">
                          Available
                        </Badge>
                      </div>
                      <div className="space-y-1 my-2">
                        <p className="text-xs text-white/70 font-medium">Main Terrace Section</p>
                        <p className="text-[10px] text-white/40 font-mono">Capacity: 6 Seats</p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-white/[0.08] mt-2">
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                          <Check size={12} /> Ready for Seating
                        </span>
                      </div>
                    </div>

                    {/* Table 4 - Reserved Evening VIP */}
                    <div className="rounded-2xl border border-purple-500/35 bg-gradient-to-b from-purple-500/10 via-[#100A16] to-black/80 p-4 flex flex-col justify-between shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-purple-400" />
                          <span className="font-mono text-sm font-bold text-purple-300">TABLE T-12</span>
                        </div>
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[9px] font-mono uppercase">
                          Reserved 8:30 PM
                        </Badge>
                      </div>
                      <div className="space-y-1 my-2">
                        <p className="text-xs text-white/95 font-semibold truncate">Lord Somnath Party</p>
                        <p className="text-[10px] text-white/60 font-mono">Private Salon • 8 Guests</p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-white/[0.08] mt-2">
                        <span className="text-[10px] font-mono text-white/40 uppercase">Pre-Auth</span>
                        <span className="font-mono text-sm font-bold text-purple-300">₹ 25,000.00</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {heroPreviewTab === 'kds' && (
                  <motion.div
                    key="kds"
                    id="hero-preview-kds"
                    role="tabpanel"
                    aria-label="Live Kitchen Display System Pass"
                    initial={{ opacity: 0, scale: 0.98, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -4 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3.5"
                  >
                    {/* Ticket 1 - Hot Kitchen */}
                    <div className="rounded-2xl border border-amber-500/35 bg-[#0D0F14] p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/30">
                            #104 • TABLE T-04
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400 font-semibold">
                            <Clock size={12} /> 04:18
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400/90 uppercase tracking-wider mb-2.5">
                          <Activity size={12} /> Station 1: Hot Kitchen
                        </div>
                        <ul className="text-xs space-y-1.5 text-white/90">
                          <li className="flex justify-between"><span>1× Wild Mushroom Truffle Risotto</span></li>
                          <li className="flex justify-between font-mono text-[11px] text-amber-400/90 pl-3">↳ Note: Extra shaved parmesan</li>
                          <li className="flex justify-between"><span>2× Pan-Seared Chilean Sea Bass</span></li>
                        </ul>
                      </div>
                      <div className="pt-3 border-t border-white/[0.08] mt-4 flex items-center justify-between text-[10px] font-mono text-white/50">
                        <span>Course: Mains</span>
                        <span className="text-amber-400 font-bold">In Prep (3/3 items)</span>
                      </div>
                    </div>

                    {/* Ticket 2 - Grill & Char (Pass Ready) */}
                    <div className="rounded-2xl border border-emerald-500/35 bg-[#0A110E] p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/30">
                            #105 • TABLE T-01
                          </span>
                          <Badge className="bg-emerald-500/30 text-emerald-300 border-emerald-500/40 text-[9px] font-mono uppercase">
                            Ready for Pass
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400/90 uppercase tracking-wider mb-2.5">
                          <Flame size={12} /> Station 2: Grill & Char
                        </div>
                        <ul className="text-xs space-y-1.5 text-white/90">
                          <li className="flex justify-between"><span>1× Charcoal Roasted Lamb Chops</span></li>
                          <li className="flex justify-between"><span>1× Rosemary Garlic Naan Basket</span></li>
                        </ul>
                      </div>
                      <div className="pt-3 border-t border-white/[0.08] mt-4 flex items-center justify-between text-[10px] font-mono text-white/50">
                        <span>Server: Marco B.</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 size={11} /> Expedite
                        </span>
                      </div>
                    </div>

                    {/* Ticket 3 - Online Delivery Intake */}
                    <div className="rounded-2xl border border-blue-500/35 bg-[#0C1017] p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 font-mono text-xs font-bold border border-blue-500/30">
                            #106 • SWIGGY ONLINE
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-mono text-blue-300 font-semibold">
                            <Clock size={12} /> 01:05
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-blue-400/90 uppercase tracking-wider mb-2.5">
                          <Zap size={12} /> Aggregator Intake
                        </div>
                        <ul className="text-xs space-y-1.5 text-white/90">
                          <li className="flex justify-between"><span>2× Royal Butter Chicken Meal</span></li>
                          <li className="flex justify-between"><span>2× Dum Gosht Biryani</span></li>
                        </ul>
                      </div>
                      <div className="pt-3 border-t border-white/[0.08] mt-4 flex items-center justify-between text-[10px] font-mono text-white/50">
                        <span>Rider Arriving (4m)</span>
                        <span className="text-blue-300 font-bold">Auto-Accepted</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {heroPreviewTab === 'whatsapp' && (
                  <motion.div
                    key="whatsapp"
                    id="hero-preview-whatsapp"
                    role="tabpanel"
                    aria-label="Automated WhatsApp Tax Invoicing"
                    initial={{ opacity: 0, scale: 0.98, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -4 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col sm:flex-row items-center justify-between gap-6 p-5 rounded-2xl bg-gradient-to-r from-[#0B1510] via-[#09100C] to-[#0A0A0E] border border-emerald-500/25 shadow-lg"
                  >
                    <div className="space-y-2.5 max-w-md">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                        <MessageSquare size={12} /> Automated WhatsApp Delivery Engine
                      </div>
                      <h4 className="font-serif text-xl font-bold text-white">Instant Official Tax PDF to Patron Mobile</h4>
                      <p className="text-xs text-white/70 leading-relaxed">
                        Eliminates paper waste and lost slips. Dispatches complete GSTIN itemization, digital payment confirmation, and table bill directly to patron WhatsApp in 1.2 seconds.
                      </p>
                    </div>

                    <div className="bg-[#121A16] border border-emerald-500/40 rounded-2xl p-4 w-full sm:w-80 shadow-2xl">
                      <div className="flex items-center gap-2.5 mb-2.5 pb-2.5 border-b border-white/10">
                        <div className="h-7 w-7 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                          <Coffee size={14} className="text-emerald-400" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">Vyoma Concierge Bot</span>
                          <span className="text-[9px] text-emerald-400/90 font-mono">Official Verified Business</span>
                        </div>
                        <CheckCircle2 size={13} className="text-emerald-400 ml-auto" />
                      </div>
                      <div className="bg-black/60 rounded-xl p-3 text-[11px] font-mono space-y-1.5 text-white/85 border border-white/5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-primary">INVOICE #VYM-2026-904</span>
                          <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Paid via UPI</span>
                        </div>
                        <p className="text-white/70">Table T-04 • Total: ₹4,850.00</p>
                        <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[9px] text-emerald-300">
                          <span className="flex items-center gap-1">📎 Tax_Invoice_VYM904.pdf</span>
                          <span>142 KB</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Telemetry Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-white/[0.08] px-1 sm:px-2 text-xs">
              <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 text-white/60 font-mono text-[11px]">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Mesh SSE Realtime
                </span>
                <span className="text-white/30">•</span>
                <span>Latency: <strong className="text-primary font-bold">34ms</strong></span>
                <span className="hidden sm:inline text-white/30">•</span>
                <span className="hidden sm:inline">Active Nodes: <strong className="text-white/90">4 Pass + 1 Bar</strong></span>
              </div>

              <button
                type="button"
                aria-label="Enter full interactive playground with Grand Brasserie demo"
                onClick={() => onLaunchDemo('brasserie')}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary hover:text-[#E8D49E] active:scale-95 touch-manipulation transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 rounded-md py-1 px-1.5"
              >
                <span>Enter Full Interactive Playground</span>
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </motion.div>
        </section>

        {/* METRICS & PERFORMANCE STRIP */}
        <section id="metrics" className="border-y border-white/[0.08] bg-[#070709] py-14">
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
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-primary">
              Core Capabilities
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mt-3 tracking-tight">
              Engineered for High-Pressure Floor & Kitchen Dynamics
            </h2>
            <p className="text-sm sm:text-base text-white/75 mt-4 leading-relaxed">
              Every interface is calibrated for 14-hour restaurant shifts—zero glare in dark dining rooms,
              large 48px tactile hit targets for gloved chefs, and bulletproof offline survivability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1: Captain Ordering */}
            <Card className="rounded-3xl border-white/[0.08] bg-[#0A0A0E] p-6 hover:border-primary/40 transition-all duration-300 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-6 group-hover:scale-110 transition-transform">
                <Smartphone size={24} />
              </div>
              <h3 className="font-serif text-xl font-bold text-white mb-2">Captain Handheld Ordering</h3>
              <p className="text-xs text-white/75 leading-relaxed">
                Empower floor captains with quick category carousels, custom dietary notes ("extra spicy, no dairy"),
                split billing, and instant seat allocation on Android tablets and iPads.
              </p>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] font-mono text-primary">
                <span>0-second double-tap zoom delay</span>
              </div>
            </Card>

            {/* Feature 2: Kitchen Display KDS */}
            <Card className="rounded-3xl border-white/[0.08] bg-[#0A0A0E] p-6 hover:border-primary/40 transition-all duration-300 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                <ChefHat size={24} />
              </div>
              <h3 className="font-serif text-xl font-bold text-white mb-2">Multi-Station Kitchen KDS</h3>
              <p className="text-xs text-white/75 leading-relaxed">
                Direct tickets to specific kitchen stations (Prep, Grill, Pass, Bar). Ticket aging glows with elapsed timers
                and sounds audible chimes the second a dish is fired or plated.
              </p>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] font-mono text-amber-400">
                <span>Audible sound alerts & glowing timers</span>
              </div>
            </Card>

            {/* Feature 3: Omnichannel Aggregators */}
            <Card className="rounded-3xl border-white/[0.08] bg-[#0A0A0E] p-6 hover:border-primary/40 transition-all duration-300 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                <Globe size={24} />
              </div>
              <h3 className="font-serif text-xl font-bold text-white mb-2">Omnichannel Delivery Hub</h3>
              <p className="text-xs text-white/75 leading-relaxed">
                Consolidate incoming orders from Swiggy, Zomato, Magicpin, and Dyno API into a single unified queue.
                Eliminate the counter mess of 6 separate tablet aggregators.
              </p>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] font-mono text-blue-400">
                <span>Direct webhook ingest & live ACK dispatch</span>
              </div>
            </Card>

            {/* Feature 4: WhatsApp Invoicing */}
            <Card className="rounded-3xl border-white/[0.08] bg-[#0A0A0E] p-6 hover:border-primary/40 transition-all duration-300 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare size={24} />
              </div>
              <h3 className="font-serif text-xl font-bold text-white mb-2">Automated WhatsApp Invoicing</h3>
              <p className="text-xs text-white/75 leading-relaxed">
                Send professional digital tax invoices with restaurant branding and dynamic payment links directly to
                patrons via WhatsApp Web API. No wasted thermal paper rolls.
              </p>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] font-mono text-emerald-400">
                <span>Instant PDF tax invoice delivery</span>
              </div>
            </Card>

            {/* Feature 5: VIP Loyalty & CRM */}
            <Card className="rounded-3xl border-white/[0.08] bg-[#0A0A0E] p-6 hover:border-primary/40 transition-all duration-300 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
              <h3 className="font-serif text-xl font-bold text-white mb-2">VIP Recognition & Smart Loyalty</h3>
              <p className="text-xs text-white/75 leading-relaxed">
                Auto-detects repeat guests by phone number. Automatically marks guests with 3+ visits as VIP patrons
                and applies configured hospitality discounts with zero manual math.
              </p>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] font-mono text-purple-400">
                <span>Automated frequency-based CRM tags</span>
              </div>
            </Card>

            {/* Feature 6: Local Resilience */}
            <Card className="rounded-3xl border-white/[0.08] bg-[#0A0A0E] p-6 hover:border-primary/40 transition-all duration-300 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-6 group-hover:scale-110 transition-transform">
                <Server size={24} />
              </div>
              <h3 className="font-serif text-xl font-bold text-white mb-2">Hybrid On-Premise Resilience</h3>
              <p className="text-xs text-white/75 leading-relaxed">
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
        <section id="architecture" className="py-20 border-t border-white/[0.08] bg-gradient-to-b from-[#0A0A0E] to-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-primary">
                Hospitality Architecture
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mt-3 tracking-tight">
                From Seating to Settlement in Minutes
              </h2>
              <p className="text-sm text-white/75 mt-3 leading-relaxed">
                Experience the synchronized state flow that powers Michelin-grade service velocity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
              {/* Step 1 */}
              <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 text-left">
                <span className="font-mono text-3xl font-bold text-primary/40">01</span>
                <h4 className="font-serif text-lg font-bold text-white mt-3 mb-2">Floor Seating & Intake</h4>
                <p className="text-xs text-white/75 leading-relaxed">
                  Captain marks table occupied, attaches dietary preferences, and fires orders with a single tap.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 text-left">
                <span className="font-mono text-3xl font-bold text-amber-400/40">02</span>
                <h4 className="font-serif text-lg font-bold text-white mt-3 mb-2">KDS Station Routing</h4>
                <p className="text-xs text-white/75 leading-relaxed">
                  Dishes split to Grill, Prep, or Bar stations with countdown timers and color-coded ticket aging.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 text-left">
                <span className="font-mono text-3xl font-bold text-emerald-400/40">03</span>
                <h4 className="font-serif text-lg font-bold text-white mt-3 mb-2">Expedite & Audio Chime</h4>
                <p className="text-xs text-white/75 leading-relaxed">
                  Plated dishes are marked ready. Captain handheld chimes and flashes the ready table token.
                </p>
              </div>

              {/* Step 4 */}
              <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 text-left">
                <span className="font-mono text-3xl font-bold text-primary/40">04</span>
                <h4 className="font-serif text-lg font-bold text-white mt-3 mb-2">WhatsApp Settlement</h4>
                <p className="text-xs text-white/75 leading-relaxed">
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

              <div className="mt-8 pt-6 border-t border-white/[0.08]">
                <Button
                  onClick={() => onLaunchDemo('bistro')}
                  variant="outline"
                  className="w-full rounded-xl h-12 border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 font-bold text-xs uppercase tracking-[0.2em] cursor-pointer active:scale-95 touch-manipulation"
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

              <div className="mt-8 pt-6 border-t border-white/[0.08]">
                <Button
                  onClick={() => onLaunchDemo('enterprise')}
                  variant="outline"
                  className="w-full rounded-xl h-12 border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-bold text-xs uppercase tracking-[0.2em] cursor-pointer active:scale-95 touch-manipulation"
                >
                  <Layers size={14} className="mr-2" /> Launch Enterprise Live Demo
                </Button>
              </div>
            </Card>
          </div>

          {/* FEATURE COMPARISON MATRIX */}
          <div className="mt-20 overflow-x-auto rounded-3xl border border-white/[0.08] bg-[#0A0A0E] p-6 sm:p-8 touch-pan-x custom-scrollbar">
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
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 font-sans font-medium">Captain Tablets Supported</td>
                  <td className="text-center py-3.5">Up to 2</td>
                  <td className="text-center py-3.5 text-primary font-bold">Unlimited</td>
                  <td className="text-center py-3.5">Unlimited</td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 font-sans font-medium">Kitchen KDS Stations</td>
                  <td className="text-center py-3.5">1 Screen</td>
                  <td className="text-center py-3.5 text-primary font-bold">Multi-Station (4+)</td>
                  <td className="text-center py-3.5">Unlimited</td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 font-sans font-medium">Swiggy & Zomato Aggregator Intake</td>
                  <td className="text-center py-3.5">
                    <span className="text-white/60 font-semibold" aria-hidden="true">—</span>
                    <span className="sr-only">Not Included in Bistro</span>
                  </td>
                  <td className="text-center py-3.5 text-primary font-bold">Included</td>
                  <td className="text-center py-3.5">Included + Custom APIs</td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 font-sans font-medium">Automated WhatsApp PDF Invoicing</td>
                  <td className="text-center py-3.5">500 / month</td>
                  <td className="text-center py-3.5 text-primary font-bold">Unlimited</td>
                  <td className="text-center py-3.5">Unlimited</td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 font-sans font-medium">VIP Loyalty & Frequency Tagging</td>
                  <td className="text-center py-3.5">
                    <span className="text-white/60 font-semibold" aria-hidden="true">—</span>
                    <span className="sr-only">Not Included in Bistro</span>
                  </td>
                  <td className="text-center py-3.5 text-primary font-bold">Included</td>
                  <td className="text-center py-3.5">Included + Advanced ML</td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 font-sans font-medium">ESC/POS 80mm Thermal Printer Bridge</td>
                  <td className="text-center py-3.5">Standard</td>
                  <td className="text-center py-3.5 text-primary font-bold">Fast Dual-Print</td>
                  <td className="text-center py-3.5">Enterprise Multi-Lane</td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 font-sans font-medium">Offline In-Memory Ring Buffer</td>
                  <td className="text-center py-3.5">Yes</td>
                  <td className="text-center py-3.5 text-primary font-bold">Yes</td>
                  <td className="text-center py-3.5">Yes + On-Premises Relay</td>
                </tr>
                <tr className="border-t border-white/10 hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 font-sans font-bold text-white">Experience Live Sandbox</td>
                  <td className="text-center py-4">
                    <Button onClick={() => onLaunchDemo('bistro')} variant="outline" size="sm" className="text-[10px] uppercase font-bold tracking-wider rounded-lg h-8 border-sky-500/30 text-sky-300 hover:bg-sky-500/10 active:scale-95 touch-manipulation cursor-pointer">
                      Bistro Demo
                    </Button>
                  </td>
                  <td className="text-center py-4">
                    <Button onClick={() => onLaunchDemo('brasserie')} size="sm" className="text-[10px] uppercase font-bold tracking-wider rounded-lg h-8 bg-primary text-black hover:bg-primary/90 active:scale-95 touch-manipulation shadow-[0_0_15px_rgba(197,160,89,0.3)] cursor-pointer">
                      Brasserie Demo
                    </Button>
                  </td>
                  <td className="text-center py-4">
                    <Button onClick={() => onLaunchDemo('enterprise')} variant="outline" size="sm" className="text-[10px] uppercase font-bold tracking-wider rounded-lg h-8 border-purple-500/30 text-purple-300 hover:bg-purple-500/10 active:scale-95 touch-manipulation cursor-pointer">
                      Enterprise Demo
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ ACCORDION SECTION */}
        <section id="faq" className="py-20 border-t border-white/[0.08] bg-[#070709]">
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
                    className="w-full px-6 py-5 flex items-center justify-between text-left text-sm font-bold text-white hover:text-primary active:scale-[0.99] touch-manipulation transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
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
                      className="px-6 pb-5 pt-2 text-sm text-white/85 leading-relaxed border-t border-white/5 max-w-prose"
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
                className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-primary text-black hover:bg-[#D4AF37] font-extrabold text-xs uppercase tracking-[0.25em] shadow-[0_0_35px_rgba(197,160,89,0.4)] transition-all duration-300 active:scale-95 touch-manipulation cursor-pointer group"
              >
                <Zap size={16} className="mr-2 fill-black" />
                Launch Live Demo Dashboard
                <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1.5" />
              </Button>

              <a
                href="#pricing"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('pricing');
                }}
                className="inline-flex items-center justify-center w-full sm:w-auto h-14 px-8 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 active:scale-95 touch-manipulation text-white font-bold text-xs uppercase tracking-[0.2em] transition-all cursor-pointer"
              >
                View Plans & Pricing
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.08] bg-black py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col gap-8 text-xs text-white/50 font-mono">
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
              className="py-1.5 px-1 text-white/70 hover:text-primary active:scale-95 touch-manipulation transition-colors cursor-pointer focus-visible:outline-none focus-visible:text-primary"
            >
              Terms of Service
            </button>
            <span className="text-white/40" aria-hidden="true">&bull;</span>
            <button
              type="button"
              onClick={() => handleOpenLegal('privacy')}
              className="py-1.5 px-1 text-white/70 hover:text-primary active:scale-95 touch-manipulation transition-colors cursor-pointer focus-visible:outline-none focus-visible:text-primary"
            >
              Privacy Policy (DPDP Act)
            </button>
            <span className="text-white/40" aria-hidden="true">&bull;</span>
            <button
              type="button"
              onClick={() => handleOpenLegal('dpa')}
              className="py-1.5 px-1 text-white/70 hover:text-primary active:scale-95 touch-manipulation transition-colors cursor-pointer focus-visible:outline-none focus-visible:text-primary"
            >
              Data Processing (DPA)
            </button>
            <span className="text-white/40" aria-hidden="true">&bull;</span>
            <button
              type="button"
              onClick={() => handleOpenLegal('cookies')}
              className="py-1.5 px-1 text-white/70 hover:text-primary active:scale-95 touch-manipulation transition-colors cursor-pointer focus-visible:outline-none focus-visible:text-primary"
            >
              Cookie &amp; Storage Policy
            </button>
            <span className="text-white/40" aria-hidden="true">&bull;</span>
            <button
              type="button"
              onClick={() => handleOpenLegal('gst')}
              className="py-1.5 px-1 text-white/70 hover:text-primary active:scale-95 touch-manipulation transition-colors cursor-pointer focus-visible:outline-none focus-visible:text-primary"
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
