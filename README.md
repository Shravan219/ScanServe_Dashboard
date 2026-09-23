# Vyoma ScanServe Dashboard

A luxury-themed, real-time **POS + Kitchen Display System (KDS)** for restaurants. Built as a single hybrid app that runs in the browser, as a Windows desktop executable, and as an Android (Capacitor) application.

Staff authenticate with a secure access password, then manage orders, menus, customers, GST invoices, and online deliveries from one dark, glassmorphism UI.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [NPM Scripts](#npm-scripts)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [API Routes](#api-routes)
- [Database](#database)
- [Design System](#design-system)
- [Deployment](#deployment)
  - [Vercel (Web)](#vercel-web)
  - [Windows Desktop (.exe)](#windows-desktop-exe)
  - [Android (APK)](#android-apk)
- [Integrations](#integrations)
- [Crawlers & robots.txt](#crawlers--robotstxt)
- [Troubleshooting](#troubleshooting)

---

## Overview

Vyoma ScanServe is an all-in-one restaurant operations dashboard:

| View | Purpose |
|------|---------|
| **Captain** | Table status grid, order builder, ready-order banner — for floor captains |
| **Counter** | Live order queue for front-of-house staff |
| **Kitchen** | KDS board with prep timing, sound chimes, and status transitions |
| **Pickup** | Takeaway / delivery orders ready for handoff |
| **Payments** | Settlement tracking and payment collection |
| **Menu** | Menu catalog with images, categories, pricing, and stock toggles |
| **Customers** | Customer CRM with phone masking and VIP/loyalty handling |
| **Online** | Aggregator / online order feed (PetPooja, Dyno, and generic webhooks) |
| **Invoices** | GSTIN-compliant invoice creation, history, PDF export, and thermal printing |

The app opens directly on a **password-entry screen** (no public landing page). A **kiosk lock mode** restricts terminals to the Captain view.

---

## Features

- **Staff access control** — password gate backed by Supabase (`authService`)
- **Admin actions** — kiosk lock/unlock requires a separate admin password
- **Real-time updates** — Supabase realtime subscriptions + SSE (`/api/orders/events`) + 3.5s polling fallback
- **Offline resilience** — local cache, offline banner, retry connection, visibility-change sync
- **GST invoicing** — GSTIN validation (15-char Indian format), configurable tax rate, jsPDF export, thermal receipt printing
- **Menu management** — image cards, category filters, bulk importer, menu engineering analytics
- **Sound alerts** — kitchen chimes with mute toggle
- **POS terminal linking** — point the dashboard at a local POS server (`ServerConnectionModal`) or run standalone/cloud
- **WhatsApp receipts** — optional outbound receipt sending (Baileys integration)
- **Table QR codes** — generate Wi-Fi + menu QR sheets for tables
- **Order simulation** — admin modal to inject test orders
- **Responsive + safe-area aware** — desktop sidebar navigation, mobile top bar and bottom sheets
- **Glassmorphism UI** — frosted panels, ambient aurora background, gold (`#C5A059`) luxury accents
- **Reduced-motion support** — respects `prefers-reduced-motion`
- **Bot blocking** — `public/robots.txt` disallows all crawlers and major AI/SEO bots

---

## Tech Stack

| Layer | Technologies |
|-------|----------------|
| **UI** | React 19, TypeScript ~5.8, Vite 6 |
| **Routing** | React Router 7 (`HashRouter`) |
| **Styling** | Tailwind CSS 4, shadcn/ui, Radix-style components, Motion (Framer Motion) |
| **Icons** | Lucide React |
| **Backend API** | Express 4 (`server/`), serverless functions on Vercel (`api/`) |
| **Database** | Supabase (PostgreSQL + Realtime) |
| **Auth** | Custom password verification against Supabase (`/api/auth`) |
| **Desktop** | Electron 43 + electron-packager |
| **Mobile** | Capacitor 8 (Android) |
| **PDF / Print** | jsPDF, react-to-print |
| **Integrations** | PetPooja & Dyno webhooks, WhatsApp (Baileys), Google GenAI (optional) |

---

## Prerequisites

- **Node.js** 18+ (20 LTS recommended)
- **npm** 9+
- A **Supabase** project (URL + anon key; service role key for server routes)
- Optional: Android Studio / JDK for APK builds, Windows for `.exe` packaging

---

## Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/Shravan219/ScanServe_Dashboard.git
cd ScanServe_Dashboard

# 2. Install dependencies
npm install

# 3. Configure environment
copy .env.example .env        # Windows
# cp .env.example .env        # macOS/Linux
# Fill in your Supabase credentials

# 4. Start the dev server (Express + Vite via tsx)
npm run dev
```

Open the URL printed in the terminal (typically `http://localhost:3000`), enter the staff access password, and you will land on the **Captain** view. Use the sidebar to switch views.

### Type checking

```bash
npm run lint    # tsc --noEmit
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values:

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL (client) |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anon key (client) |
| `SUPABASE_URL` | ✅ (server) | Same URL for Express/serverless |
| `SUPABASE_ANON_KEY` | ✅ (server) | Anon key for server routes |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ (server) | Service role key — **never expose to the client** |
| `DYNO_API_KEY` | optional | Dyno outbound status dispatcher key |
| `DYNO_API_URL` | optional | Defaults to `https://dynoapis.com/api/v1/orders/status` |
| `TESTER_CALLBACK_URL` | optional | Debug callback for outbound webhooks |
| `VITE_TESTER_CALLBACK_URL` | optional | Client-side tester callback |

> Never commit `.env`. It is git-ignored.

---

## NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `tsx server.ts` | Run Express dev server (serves API + Vite middleware) |
| `build` | `vite build && esbuild server.ts ...` | Production client bundle + `dist/server.cjs` |
| `start` | `node dist/server.cjs` | Run production server |
| `preview` | `vite preview` | Preview the built client |
| `lint` | `tsc --noEmit` | TypeScript type check |
| `clean` | `rimraf dist release` | Remove build outputs |
| `pack:win` | clean → build → electron-packager | Produce `release/Vyoma-win32-x64/Vyoma.exe` |
| `cap:sync` | `vite build && cap sync android` | Sync web build into Capacitor Android project |
| `apk:build` | cap sync + Gradle assembleDebug | Build debug APK into `apk/` |
| `apk:install` | `node scripts/install-apk.cjs` | Install APK on connected device |
| `apk:devices` | `node scripts/install-apk.cjs --devices-only` | List connected devices |

---

## Project Structure

```
.
├── api/                      # Vercel serverless functions
│   ├── index.ts
│   ├── orders.ts
│   ├── invoices.ts
│   └── webhooks/             # petpooja, dyno, aggregator, receiver
├── components/ui/            # shadcn/ui primitives (button, card, dialog, tabs…)
├── server/                   # Express app, routers (auth, orders, customers, webhooks)
├── server.ts                 # Dev/prod server entry (static + SPA fallback)
├── src/
│   ├── main.tsx              # React entry: ErrorBoundary → HashRouter → App
│   ├── App.tsx               # Auth gate, layout, sidebar, all top-level views
│   ├── index.css             # Tailwind 4 theme, glassmorphism, print styles
│   ├── types.ts
│   ├── components/
│   │   ├── captain/          # CaptainDashboard, OrderBuilderSheet, TableStatusGrid…
│   │   ├── menu/             # MenuImporterModal, MenuEngineeringModal
│   │   ├── payments/         # PaymentsView
│   │   ├── invoices/         # InvoiceCreator, InvoiceHistory, InvoicesView…
│   │   ├── tables/           # TableQrModal
│   │   ├── admin/            # SimulateOrderModal
│   │   ├── brand/            # VyomaLogo
│   │   ├── legal/            # LegalModal
│   │   ├── OnlineOrdersView.tsx
│   │   ├── Receipt.tsx
│   │   └── ServerConnectionModal.tsx
│   └── lib/
│       ├── supabase.ts       # Client
│       ├── authService.ts    # Staff/admin password verification
│       ├── apiConfig.ts      # Global API proxy interceptor
│       ├── capacitorSetup.ts # Native status bar, wake lock, back button
│       ├── orderSync.ts      # SSE + polling orchestration
│       ├── sound.ts          # Kitchen chimes
│       ├── whatsapp.ts
│       ├── dyno-adapter.ts
│       └── demoData.ts
├── public/
│   ├── robots.txt            # Blocks all crawlers & AI bots
│   ├── sitemap.xml
│   └── favicon.svg
├── android/                  # Capacitor Android project
├── apk/                      # Built APKs
├── assets/icon.ico           # Windows icon
├── electron.cjs              # Electron main process
├── capacitor.config.ts
├── vercel.json               # SPA + /api rewrites
├── supabase_schema.sql       # Database schema
└── .env.example
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Clients                                               │
│  Web (Vite) · Electron (Windows) · Capacitor (Android) │
└───────────────┬─────────────────────────────────────────┘
                │  fetch / SSE  (apiConfig interceptor
                │  can retarget to a local POS terminal)
┌───────────────▼─────────────────────────────────────────┐
│  Express (server.ts + server/)  or  Vercel api/        │
│  /api/auth · /api/orders · /api/customers              │
│  /api/invoices · /api/webhooks/* · /api/whatsapp/*     │
└───────────────┬─────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────┐
│  Supabase (PostgreSQL + Realtime)                      │
│  orders · menu_items · customers · invoices · staff    │
└─────────────────────────────────────────────────────────┘
```

**Realtime strategy**

1. Supabase realtime channel on `orders`
2. Server-Sent Events stream at `/api/orders/events`
3. Polling every ~3.5 seconds as a safety net
4. `visibilitychange` refetch when the tab regains focus

**Navigation**

- Desktop: **sidebar only** (`NavItem` list); the top header shows the current view title, live metrics, sound toggle, and connection status
- Content switching is driven by Radix-style `Tabs` values without a visible top tab strip

---

## API Routes

Mounted under `/api` (Express in dev/prod; Vercel functions in serverless):

| Route | Description |
|-------|-------------|
| `GET /api/health` | Health check |
| `POST /api/auth/...` | Staff / admin password verification |
| `GET|POST /api/orders` | List / create orders |
| `GET /api/orders/events` | SSE stream of order updates |
| `GET|POST /api/customers` | Customer directory |
| `GET|POST /api/invoices` | GST invoice CRUD |
| `POST /api/webhooks/petpooja` | PetPooja order intake |
| `POST /api/webhooks/dyno` | Dyno order intake |
| `POST /api/webhooks/aggregator` | Generic aggregator intake |
| `GET /api/whatsapp/status` | WhatsApp connection status |
| `GET /api/whatsapp/qr` | Pairing QR |
| `POST /api/whatsapp/send-receipt` | Send receipt to a guest |

Exact handlers live in `server/routes/` and `api/`.

---

## Database

Schema is provided in [`supabase_schema.sql`](./supabase_schema.sql).

1. Create a Supabase project
2. Run the SQL file in the Supabase SQL editor
3. Create staff/admin password rows expected by `authService`
4. Copy URL + keys into `.env`

---

## Design System

- **Palette**: obsidian black background, gold primary `#C5A059`, soft white text, emerald/red status accents
- **Typography**: *Cormorant Garamond* (serif display) + *Karla* (sans body) + *JetBrains Mono* (numerals)
- **Glassmorphism utilities** (in `src/index.css`):
  - `.glass-panel` — sidebar & login shell
  - `.glass-card` — footer buttons
  - `.glass-tile` / `.luxury-stat-tile` — metric tiles
  - `.glass-header` — top & mobile headers
  - `.glass-nav-item` — inactive sidebar hover
  - `.glass-input` — focused inputs
  - `.glass-aurora` — fixed ambient background (painted at `z-index: -1` so it never veils text)
- **Print**: `.no-print` / `.print-only` helpers for thermal receipts
- **Accessibility**: focus-visible gold outlines, 44px touch targets, reduced-motion overrides

Detailed design docs: [`DESIGN.md`](./DESIGN.md), `design-system/`.

---

## Deployment

### Vercel (Web)

1. Push the repo to GitHub
2. Import the project at [vercel.com](https://vercel.com)
3. Add environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, plus server keys if using `api/`
4. Deploy — `vercel.json` routes `/api/*` to serverless functions and everything else to the SPA

### Windows Desktop (.exe)

```bash
npm run pack:win
```

Output: `release/Vyoma-win32-x64/Vyoma.exe`  
Uses `electron-packager` with `assets/icon.ico`.

### Android (APK)

```bash
npm run apk:build     # builds debug APK into apk/
npm run apk:install   # install on a connected device
```

Requires Android Studio SDK + JDK. Uses Capacitor 8.

---

## Integrations

| Integration | Direction | Notes |
|-------------|-----------|-------|
| **PetPooja** | Inbound webhook | Normalizes aggregator orders into `orders` |
| **Dyno** | Inbound + outbound | Receives orders; dispatches status via `DYNO_API_*` |
| **Generic aggregator** | Inbound webhook | Catch-all payload adapter |
| **WhatsApp (Baileys)** | Outbound | Receipt delivery; QR pairing endpoints |
| **Local POS terminal** | Peer | Dashboard can proxy API calls to a LAN POS via `apiConfig` |

---

## Crawlers & robots.txt

[`public/robots.txt`](./public/robots.txt) **disallows all user agents** and explicitly blocks major AI crawlers (GPTBot, ClaudeBot, CCBot, Google-Extended, PerplexityBot, Bytespider, …), SEO bots (AhrefsBot, SemrushBot), and search spiders (Googlebot, Bingbot, YandexBot, Baiduspider).

> Note: `robots.txt` is a voluntary protocol — well-behaved crawlers will obey it, but it is not a security boundary. Do not rely on it to protect private data; the password gate and server auth are the real protections.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `require is not defined` / `__dirname` errors in `server.ts` | File is ESM — it uses `import.meta.url` and `process.cwd()` for the dist path; run via `npm run dev` or `npm run build && npm start` |
| Blank page after deploy | Confirm `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are set in the host environment |
| Orders not updating | Check Supabase realtime is enabled; verify SSE endpoint reachable; watch the Online/Offline banner |
| `pack:win` fails | Run `npm run clean` first; ensure `assets/icon.ico` exists |
| APK build fails | Verify `ANDROID_HOME`, JDK 17, and that `npm run cap:sync` succeeds before Gradle |
| Text ghosting on cards | Ensure `.glass-aurora::before` remains `z-index: -1` in `src/index.css` |
| Active sidebar label invisible | `.glass-nav-item` must only apply to **inactive** items (it would override `bg-primary`) |

---

## License

Private / all rights reserved unless otherwise stated by the project owner.
