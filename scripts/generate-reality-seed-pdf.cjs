const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

function generatePdf() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  function checkPageBreak(neededHeight) {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawHeaderFooter();
    }
  }

  function drawHeaderFooter() {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text('VYOMA SCANSERVE - REALITY SEED (MIROFISH ENGINE)', margin, 10);
    doc.text('PAGE ' + doc.internal.getNumberOfPages(), pageWidth - margin, 10, { align: 'right' });
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(margin, 12, pageWidth - margin, 12);
  }

  // Cover / Header Banner
  doc.setFillColor(15, 15, 20); // Dark luxury slate
  doc.rect(margin, y, contentWidth, 26, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(218, 165, 32); // Gold accent
  doc.text('VYOMA SCANSERVE: REALITY SEED', margin + 6, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(230, 230, 230);
  doc.text('High-Velocity Restaurant OS, KDS & Captain Operations Mesh', margin + 6, y + 17);
  doc.setFontSize(7.5);
  doc.setTextColor(170, 170, 170);
  doc.text('Target: MiroFish Prediction Engine | Version: 1.0.0-PROD | Formats: PDF, MD, TXT', margin + 6, y + 22);

  y += 32;

  const sections = [
    {
      title: '1. SYSTEM IDENTITY & STRATEGIC MISSION',
      content: [
        'Vyoma ScanServe is an ultra-low-latency, mission-critical restaurant management ecosystem engineered for high-paced fine dining and luxury hospitality. It unifies front-of-house floor operations (Captain ordering tablets), back-of-house culinary production (Kitchen Display Systems), administrative cash settlement, and multi-channel delivery aggregator intake (Swiggy, Zomato, Magicpin, Dyno API) into a synchronized real-time state machine.',
        'Architectural North Star ("The Obsidian Guild"):',
        '• Base Canvas: Deep pitch-black OLED void (#000000) for zero glare in ambient dining and low power draw on handheld floor tablets during 14-hour double shifts.',
        '• Accent Hierarchy: Imperial Gold (#C5A059) restricted to <10% surface area to preserve visual urgency for primary actions, active tokens, and VIP alerts.',
        '• Structural Elevation: Smoky obsidian glass cards (#0A0A0E / #0D0E14), 14px-20px backdrop blurring, and 8% white boundary strokes (rgba(255, 255, 255, 0.08)).',
        '• Typographic Telemetry: Neoclassical serifs (Cormorant Garamond) for titles; geometric sans (Karla) for controls; monospaced tabular fonts (JetBrains Mono) for tokens (#104), elapsed timers (04:12), and currency calculations (Rs/INR).',
        '• Tactile Ergonomics: Zero double-tap zoom delay (touch-action: manipulation) and strict 44x44px hit bounds (WCAG 2.5.5) with .touch-target expansion for rushed, gloved, or wet kitchen/floor operations.'
      ]
    },
    {
      title: '2. TECHNICAL SPECIFICATIONS & RUNTIME TOPOLOGY',
      content: [
        'Technology Stack Matrix:',
        '• Core Frontend: React 19, TypeScript 5.8, Vite 6.2, Tailwind CSS 4.',
        '• UI & Animation: Motion (Framer Motion 12), Lucide React, Shadcn/Radix/Base-UI.',
        '• Backend & API Layer: Node.js, Express 4.21, TypeScript runtime (tsx / esbuild).',
        '• Database & Realtime Engine: Supabase PostgreSQL 15+ with Realtime WebSocket replication, Row-Level Security (RLS), and PL/pgSQL triggers.',
        '• Local Resilience & Caching: In-memory circular ring buffer (orderStore.ts, max 100 historical webhook traces) paired with Server-Sent Events (SSE) broadcast to bypass external cloud latency on local networks.',
        '• Outbound Messaging: Baileys WhatsApp Web API engine (@whiskeysockets/baileys) for direct-to-patron digital PDF tax receipt dispatch.',
        '• Document & Print: Server-side and client-side PDF synthesis (jspdf), ESC/POS thermal printing bridge (react-to-print).',
        '• Cross-Platform Deployments: Web Terminal (Vercel SPA), Desktop Kiosk (Electron 43 portable Windows executable), Floor Tablets (Native Capacitor 8.5 Android package).',
        'Hardware Footprint:',
        '• Captain Floor Nodes: 10-inch Android handheld tablets (Capacitor runtime with native wake-lock, orientation locking, and software keyboard avoidance).',
        '• Kitchen Display Terminals (KDS): Wall-mounted 21-inch touchscreen monitors positioned across Prep, Grill, and Pass stations.',
        '• Cashier / POS Host: Windows terminal connected to 80mm ESC/POS thermal receipt printer, barcode/QR scanner, and local Express microservice.'
      ]
    },
    {
      title: '3. DOMAIN ENTITIES & KNOWLEDGE GRAPH RELATIONSHIPS',
      content: [
        'Core Entities & Schema Mapping:',
        '• Order (public.orders): id (UUID PK), token (#101-#999), status (pending, preparing, ready, waiting for payment, completed, cancelled), total, items (JSONB), customer_name, customer_phone, table_id, gstin, order_type (dine_in, takeaway, delivery, aggregator), aggregator_platform (swiggy, zomato, magicpin, ubereats).',
        '• OrderItem: id, name, quantity (>=1), price, item_notes (cooking instructions).',
        '• RestaurantTable: id, table_number (T-01 to T-20), capacity (2-12), status (available, occupied, reserved, cleaning), section, occupancy_timer.',
        '• Customer (public.customers): phone (PK), name, order_count, loyal_vip, discount, gstin, computed metrics (totalSpent, favoriteItems, lastOrder).',
        '• MenuItem (public.menu_items): id, name, category, price, discount_price, is_sold_out.',
        '• InboundWebhookLog: Circular buffer recording method, path, ip, headers, raw_body, platform, duration_ms, status_code, success.'
      ]
    },
    {
      title: '4. END-TO-END OPERATIONAL WORKFLOWS',
      content: [
        'Dine-In State Machine:',
        '1. Table Allocation: Hostess/Captain marks table Occupied on TableStatusGrid.',
        '2. Order Capture: Captain selects dishes on OrderBuilderSheet, inputs guest notes.',
        '3. Order Firing: System writes order to Supabase, generates sequence token (#104).',
        '4. CRM Sync: PostgreSQL trigger trg_sync_customer_from_order upserts customer, computes visit count, and sets loyal_vip = true if visits >= 3.',
        '5. Kitchen KDS: Ticket appears instantly on KDS with timer. Chef taps Accept.',
        '6. Expedite & Handoff: Plated food marked Ready. Captain tablets ring audio chime and flash ReadyOrdersBanner with table ID and token.',
        '7. Service & Bill Settlement: Captain serves dishes. Cashier opens InvoicesView / Receipt.tsx, applies loyalty discount, validates GSTIN, prints 80mm thermal bill.',
        '8. WhatsApp Delivery: Headless Baileys bot sends PDF receipt to customer phone.',
        '9. Turnover & Reset: Cashier marks order Completed. Table shifts to Cleaning, then Available.',
        'Online Aggregator Inbound Flow:',
        '1. Inbound JSON webhook arrives at /api/webhooks from Swiggy/Zomato/Dyno API.',
        '2. Deep parser processWebhook.ts sanitizes body, extracts items, assigns token.',
        '3. Order stored in local memory ring buffer, broadcast via SSE, and written to Supabase.',
        '4. Kitchen accepts ticket; outboundWebhook.ts acknowledges aggregator API.'
      ]
    },
    {
      title: '5. SYSTEM CONSTRAINTS, FRICTION POINTS & EFFICIENCY VECTORS',
      content: [
        'Simulation Vectors for Multi-Agent Swarm Modeling:',
        '1. Network Fluctuations & Split-Brain Risks: Wi-Fi dead zones cause disconnects. Local in-memory ring buffer (orderStore.ts) and SSE operate alongside cloud Supabase. Out-of-sync states between local cache and database can cause duplicate tickets or dropped updates.',
        '2. Peak-Hour Kitchen Latency Bottlenecks: When 15+ tables order concurrently alongside 10 aggregator orders, KDS ticket queue overflows screen real estate. Chef cognitive overload delays "Mark Ready" taps, distorting prep analytics and delaying floor service.',
        '3. Front-of-House Serving Handoff Lag: Time elapsed between kitchen marking order "Ready" and floor captain picking up food from the pass. Food cools down if captains are occupied taking new orders.',
        '4. Instant 86\'ing (Sold-Out Propagation): When kitchen runs out of a key item, chef toggles "is_sold_out". Delays in real-time propagation to captain tablets cause captains to take invalid orders, wasting 5-10 minutes renegotiating at the table.',
        '5. WhatsApp Bot Lifecycle & Rate Limiting: WhatsApp Baileys socket disconnections, QR expirations, or invalid customer phone numbers cause automated digital invoice failures.',
        '6. Billing & Split Settlement Delays: Customers splitting payments (cash, UPI QR, corporate GSTIN) during peak turnover create front-desk queues, delaying table turnaround time.'
      ]
    }
  ];

  for (const section of sections) {
    checkPageBreak(18);

    // Section title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 40);
    doc.text(section.title, margin, y);
    y += 2;
    doc.setDrawColor(218, 165, 32);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + 40, y);
    y += 5;

    // Section body
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 50);

    for (const p of section.content) {
      const isBullet = p.startsWith('•') || p.startsWith('1.') || p.startsWith('2.') || p.startsWith('3.') || p.startsWith('4.') || p.startsWith('5.') || p.startsWith('6.') || p.startsWith('7.') || p.startsWith('8.') || p.startsWith('9.');
      const isSubhead = p.endsWith(':');

      if (isSubhead) {
        checkPageBreak(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text(p, margin, y);
        y += 4.5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
      } else {
        const indent = isBullet ? 4 : 0;
        const textLines = doc.splitTextToSize(p, contentWidth - indent);
        checkPageBreak(textLines.length * 4.2 + 2);
        doc.text(textLines, margin + indent, y);
        y += textLines.length * 4.2 + 2;
      }
    }
    y += 4;
  }

  // Final footer check
  const pdfBytes = doc.output('arraybuffer');
  const outputPath = path.join(__dirname, '..', 'REALITY_SEED.pdf');
  fs.writeFileSync(outputPath, Buffer.from(pdfBytes));
  console.log('Successfully generated:', outputPath);
}

generatePdf();
