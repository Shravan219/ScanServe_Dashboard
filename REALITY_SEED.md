# REALITY SEED: VYOMA SCANSERVE RESTAURANT OS & CAPTAIN DASHBOARD
**Document Version:** 1.0.0-PROD  
**Target Ingestion Engine:** MiroFish Swarm Intelligence / GraphRAG Engine  
**System Class:** Michelin-Grade Luxury Restaurant Point-of-Sale (POS), Kitchen Display System (KDS), & Captain Operations Mesh  
**Primary Domain:** High-Velocity Luxury Hospitality & Omnichannel Food Service Operations  

---

## 1. SYSTEM IDENTITY & STRATEGIC MISSION

### 1.1 Architectural North Star: "The Obsidian Guild"
Vyoma ScanServe is an ultra-low-latency, mission-critical restaurant management ecosystem engineered for high-paced fine dining and luxury hospitality. It unifies front-of-house floor operations (Captain ordering tablets), back-of-house culinary production (Kitchen Display Systems), administrative cash settlement, and multi-channel delivery aggregator intake (Swiggy, Zomato, Magicpin, Dyno API) into a synchronized real-time state machine.

The visual and functional design follows strict "Dark Luxury" principles:
- **Base Canvas:** Deep pitch-black OLED void (`#000000`) engineered for zero glare in ambient dining environments and minimal battery drain on handheld floor tablets during 14-hour shifts.
- **Accent Hierarchy:** Imperial Gold (`#C5A059`) restricted to <10% viewport surface to preserve visual urgency for primary actions, active tokens, and VIP alerts.
- **Structural Elevation:** Smoky obsidian glass cards (`#0A0A0E` / `#0D0E14`), 14px–20px backdrop blurring, and 8% white boundary strokes (`rgba(255, 255, 255, 0.08)`).
- **Typographic Telemetry:** Neoclassical serifs (*Cormorant Garamond*) for hospitality titles; geometric sans (*Karla*) for UI controls; monospaced tabular fonts (*JetBrains Mono*) for order tokens (`#104`), elapsed prep timers (`04:12`), and currency calculations (`₹`).
- **Tactile Ergonomics:** Zero double-tap zoom delay (`touch-action: manipulation`) and strict 44×44px hit bounds (WCAG 2.5.5) with `.touch-target` expansion for rushed, gloved, or wet kitchen/floor operations.

---

## 2. TECHNICAL SPECIFICATIONS & RUNTIME TOPOLOGY

### 2.1 Technology Stack Matrix
- **Core Frontend:** React 19, TypeScript 5.8, Vite 6.2, Tailwind CSS 4.
- **UI & Animation Framework:** Motion (Framer Motion 12), Lucide React, Shadcn/Radix/Base-UI primitives, Sonner notifications.
- **Backend & API Layer:** Node.js, Express 4.21, TypeScript runtime (`tsx` / `esbuild`).
- **Database & Realtime Engine:** Supabase PostgreSQL 15+ with Realtime WebSocket replication, Row-Level Security (RLS), and PL/pgSQL triggers.
- **Local Resilience & Caching:** In-memory circular ring buffer (`orderStore.ts`, max 100 historical webhook traces) paired with Server-Sent Events (SSE) broadcast to bypass external cloud latency on local networks.
- **Outbound Automation & Messaging:** Baileys WhatsApp Web API engine (`@whiskeysockets/baileys`) for direct-to-patron digital PDF tax receipt dispatch.
- **Document & Print Generation:** Server-side and client-side PDF synthesis (`jspdf`), ESC/POS thermal printing bridge (`react-to-print`).
- **Cross-Platform Deployments:**
  - *Web Terminal:* Progressive Web App / Vercel SPA.
  - *Desktop Kiosk:* Electron 43 portable Windows executable (`electron.cjs`).
  - *Floor Tablets:* Native Capacitor 8.5 Android package (`android/`, APK debug build).

### 2.2 Operational Hardware Footprint
- **Captain Floor Nodes:** 10-inch Android handheld tablets (Capacitor runtime with native wake-lock, forced landscape/portrait adaptation, and software keyboard avoidance).
- **Kitchen Display Terminals (KDS):** Wall-mounted 21-inch touchscreen monitors positioned across Prep, Grill, and Pass stations.
- **Cashier / POS Host:** Windows terminal connected to 80mm ESC/POS thermal receipt printer, barcode/QR scanner, and local Express microservice.

---

## 3. DOMAIN ENTITIES & KNOWLEDGE GRAPH RELATIONSHIPS

```
[Customer] ────(places / associated with)────► [Order] ◄────(monitors / prepares)──── [KDS Station]
     │                                           │
     ▼ (upserts via trigger)                     ▼ (contains)
[Loyalty Profile]                         [OrderItem] ────(references)────► [MenuItem]
     │                                           │
     ▼                                           ▼
[VIP Tier & Discount]                     [Special Cooking Notes]
     ▲                                           ▲
     │                                           │
[Captain Staff] ────(takes order / updates)──────┴───► [Restaurant Table]
```

### 3.1 Core Entity Definitions
1. **Order (`public.orders`):**
   - Attributes: `id` (UUID PK), `created_at` (Timestamp), `placed_at_ist` (ISO IST string), `token` (e.g., `#101` to `#999`), `status` (`pending`, `preparing`, `ready`, `waiting for payment`, `completed`, `cancelled`), `total` (Numeric 10,2), `items` (JSONB array), `customer_name`, `customer_phone`, `table_id`, `gstin`, `order_type` (`dine_in`, `takeaway`, `delivery`, `aggregator`), `aggregator_platform` (`swiggy`, `zomato`, `magicpin`, `ubereats`), `notes`, `custom_instructions`.
2. **OrderItem (Nested JSONB & Normalized Object):**
   - Attributes: `id` (String), `name` (String), `quantity` (Integer >= 1), `price` (Numeric), `item_notes` (String: e.g., "Extra spicy, no cilantro").
3. **RestaurantTable (`RestaurantTable`):**
   - Attributes: `id`, `table_number` (e.g., "T-01" to "T-20"), `capacity` (2 to 12 seats), `status` (`available`, `occupied`, `reserved`, `cleaning`), `section` (Main Dining, Patio, Private Lounge), `active_order_id`, `customer_name`, `total_amount`, `occupancy_timer`.
4. **Customer (`public.customers`):**
   - Attributes: `phone` (Normalized digits PK), `name`, `order_count` (Integer), `loyal_vip` (Boolean), `discount` (Percentage BigInt), `gstin` (Tax ID), `created_at`, dynamic computed telemetry: `totalSpent`, `favoriteItems` (frequency map), `lastOrder`.
5. **MenuItem (`public.menu_items`):**
   - Attributes: `id` (UUID PK), `name`, `description`, `price`, `discount_price`, `category` (`starter`, `main`, `dessert`, `beverage`, `coffee`, `pizza`, `pasta`), `image`, `is_sold_out` (Boolean toggle).
6. **InboundWebhookLog (`orderStore.ts`):**
   - Circular buffer recording `method`, `path`, `ip`, `headers`, `raw_body`, `detected_platform`, `detected_source`, `duration_ms`, `status_code`, and `success`.

---

## 4. END-TO-END OPERATIONAL WORKFLOWS

### 4.1 Floor Service (Dine-In) State Machine
1. **Seating & Table Allocation:** Hostess/Captain seats guests at a table. Table status shifts from `available` to `occupied` on `TableStatusGrid`.
2. **Order Capture:** Captain launches `OrderBuilderSheet` on tablet. Selects category filters, adjusts quantities, records guest dietary notes, and reviews bill summary.
3. **Order Firing:** Captain submits order. System writes record to `public.orders` (via Supabase REST/WebSocket) and assigns daily sequence token (`#104`).
4. **CRM Sync (Database Trigger):** PL/pgSQL trigger `trg_sync_customer_from_order` intercepts order creation, upserts customer phone into `public.customers`, computes historical order count, and marks `loyal_vip = true` if threshold (>=3 orders) is met.
5. **Kitchen KDS Processing:** Order appears instantly on Kitchen Display screen with glowing token badge and elapsed timer. Chef taps `Accept` (status -> `preparing`).
6. **Expedite & Handoff:** Once dishes are plated, chef taps `Mark Ready` (status -> `ready`). Audio chime (`soundService`) triggers on Captain tablets; top `ReadyOrdersBanner` flashes table number and order token.
7. **Service & Settlement:** Captain serves dishes. When guests request bill, cashier opens `InvoicesView` or `Receipt.tsx`, applies loyalty discount, validates GSTIN, and prints physical 80mm thermal receipt.
8. **WhatsApp Delivery:** System calls `/api/whatsapp/send-receipt`, triggering headless Baileys bot to compile and transmit official PDF invoice to customer's mobile device.
9. **Turnover & Reset:** Cashier marks order `completed` (status -> `completed`). Table shifts to `cleaning`, then resets to `available`.

### 4.2 Aggregator / Online Inbound Flow (Swiggy / Zomato / Dyno API)
1. Inbound JSON webhook arrives at `/api/webhooks` or `/api/webhook`.
2. `server/processWebhook.ts` sanitizes deeply nested payloads, extracts items, customer details, and external platform IDs.
3. Order is pushed into in-memory `orderStore` ring buffer, broadcast over Server-Sent Events (`broadcastEvent('order_created')`), and persisted to Supabase `orders` table.
4. Kitchen accepts ticket; `server/outboundWebhook.ts` sends real-time acknowledgement back to aggregator dispatch endpoints.

---

## 5. SYSTEM CONSTRAINTS, FRICTION POINTS & EFFICIENCY VECTORS

For multi-agent swarm modeling, the following real-world constraints and operational bottlenecks govern project efficiency:

1. **Network Fluctuations & Split-Brain Risks:**
   - Restaurants suffer from Wi-Fi dead zones in basements and kitchen galleys.
   - Fallback architecture uses local in-memory storage (`orderStore.ts`) and SSE alongside Supabase cloud. Out-of-sync states between local client cache and Supabase PostgreSQL can cause duplicate tickets or dropped status updates.
2. **Peak-Hour Kitchen Latency Bottlenecks:**
   - When 15+ tables order concurrently within a 10-minute window alongside 10 aggregator delivery orders, ticket queue depth on KDS exceeds screen real estate.
   - Chef cognitive overload results in delayed "Mark Ready" taps, distorting preparation analytics and causing captain floor delays.
3. **Front-of-House Serving Handoff Lag:**
   - Time elapsed between kitchen marking order `ready` and floor captain delivering food to table. If captains are occupied taking orders, food sits on the pass warming rack.
4. **Instant 86'ing (Sold-Out Propagation):**
   - If the grill station runs out of a key protein, chef toggles `is_sold_out: true` on `MenuItem`.
   - Any delay in real-time propagation to captain tablets can lead to captains taking orders for sold-out items, requiring embarrassing return visits to customer tables to renegotiate orders.
5. **WhatsApp Bot Lifecycle & Rate Limiting:**
   - WhatsApp Baileys engine runs a headless multi-device socket. QR code disconnections, Meta rate limiting, or invalid customer phone number formats can stall automated digital receipt distribution.
6. **Billing & Split Settlement Delays:**
   - Guests splitting payments (part cash, part UPI QR, part corporate GST invoice) create front-desk queues, holding table turnover times hostage during peak dessert/coffee cycles.
