# Comprehensive Business Case: Vyoma ScanServe
**Document Version:** 1.0 (Investor-Ready)  
**Date:** September 20, 2026  
**Company:** Vyoma Hospitality Technologies  
**Product:** ScanServe POS & KDS Hospitality Operating System  
**Stage:** Seed / Early Commercialization  
**Funding Ask:** $1.50M USD (₹12.50 Crore INR)  

---

## 1. Executive Summary

### 1.1 Company Overview
**Vyoma ScanServe** is a mission-critical, offline-resilient restaurant management operating system combining luxury-tier cloud POS, multi-station Kitchen Display Systems (KDS), captain floor tablets, WhatsApp digital invoicing, and multi-unit franchise enterprise mesh architecture. 

### 1.2 The Problem
The Indian food services industry is valued at **₹5.69 Lakh Crore ($68.3B USD)** and growing rapidly, yet restaurants struggle with fragile broadband infrastructure, high aggregator commission burdens (22%–30%), paper receipt waste, and clunky, legacy desktop software that crashes during internet interruptions.

### 1.3 The Solution
Vyoma solves food service operational downtime with an **offline-first hybrid-edge architecture** featuring local mesh relays (`0.4ms ping`), zero-hardware lock-in (running on standard commercial Android tablets and browsers), automated course-by-course kitchen routing, and paperless WhatsApp tax e-invoicing that captures 100% verified guest mobile numbers for direct loyalty marketing.

### 1.4 Market Sizing Snapshot
- **TAM (Total Addressable Market):** **$585.6M USD / year** (₹4,878 Cr / yr across 500,000 Indian F&B locations).
- **SAM (Serviceable Available Market):** **$124.9M USD / year** (₹1,040 Cr / yr across 98,000 organized restaurants in Top 25 Metros).
- **SOM (Year 3 Projection):** **$3.12M USD ARR** (₹26.04 Cr ARR, 2,450 locations).
- **SOM (Year 5 Projection):** **$6.49M USD ARR** (₹54.12 Cr ARR, 5,100 locations).

### 1.5 3-Year Financial Snapshot

| Metric | Current / Launch | Year 1 | Year 2 | Year 3 |
| :--- | :--- | :--- | :--- | :--- |
| **Active Subscribed Outlets** | 35 (Pilots) | 350 | 1,050 | **2,450** |
| **Annual Recurring Revenue (ARR)** | ₹24.8 Lakh ($30K) | ₹2.26 Crore ($271K) | ₹7.14 Crore ($857K) | **₹26.04 Crore ($3.12M)** |
| **Gross Margin (%)** | 82% | 84% | 86% | **88%** |
| **EBITDA Margin (%)** | (45%) | (28%) | (8%) | **+18.5% (Profitable)** |
| **Blended CAC (Cost of Acquisition)**| ₹18,500 ($222) | ₹14,200 ($170) | ₹11,800 ($141) | **₹9,800 ($117)** |
| **Blended LTV (3-Year Horizon)** | ₹1,08,000 ($1,296)| ₹1,18,000 ($1,416)| ₹1,35,000 ($1,620)| **₹1,56,000 ($1,872)** |
| **LTV : CAC Ratio** | 5.8x | 8.3x | 11.4x | **15.9x** |
| **Team Headcount** | 6 | 16 | 32 | **52** |

### 1.6 Funding Ask & Key Milestones
- **Target Raise:** **$1.50M USD (₹12.50 Crore INR)** via Seed Equity or SAFE Note.
- **Runway:** 20–24 months to cash-flow breakeven.
- **Key Milestones:**
  1. Expand active merchant footprint from 35 to 2,450 outlets across Mumbai, Delhi-NCR, Bengaluru, Hyderabad, and Pune.
  2. Scale embedded UPI/card payment processing to ₹2,500 Crore annualized GMV.
  3. Prepare localized multi-currency engine for Dubai/GCC expansion (Phase 3).

---

## 2. Problem Statement & Market Opportunity

```
┌────────────────────────────────────────────────────────────────────────┐
│                        THE HOSPITALITY BOTTLENECK                      │
├───────────────────┬────────────────────────────┬───────────────────────┤
│ INFRASTRUCTURE    │ MARGIN COMPRESSION         │ GUEST RETENTION       │
│ Internet Drops    │ 22-30% Aggregator Cuts     │ Anonymous Walk-ins    │
│ Thermal Paper Loss│ Clunky Hardware Lock-in    │ No Owned Re-targeting │
└───────────────────┴────────────────────────────┴───────────────────────┘
```

### 2.1 The Critical Operational Problems
1. **Network Outages & Floor Paralysis:** Traditional cloud POS systems require constant internet connectivity. When urban fiber links drop, table captains cannot fire tickets, KDS queues stop updating, and card settlement halts.
2. **Aggregator Commission Disintermediation:** Independent restaurants pay between 22% and 30% of gross order value to delivery aggregators (Swiggy, Zomato). They have virtually zero direct contact info for their diners.
3. **Kitchen Ticket Bottlenecks & Order Discrepancies:** Paper kitchen slips get lost, soaked, or misread during peak dinner rushes, leading to wrong items delivered and table turn delays averaging 18 minutes per turnaround.
4. **Thermal Receipt Cost & Environmental Waste:** A high-volume restaurant consumes ₹4,000 to ₹8,000 monthly in thermal paper rolls that contain BPA toxins and are non-recyclable.
5. **Multi-Branch Accounting Disconnect:** Franchise groups operate on disparate databases, requiring tedious manual re-entry into Tally or SAP ERP, causing delayed reconciliation and GST tax discrepancies.

### 2.2 Market Landscape & Structural Shifts
- **The Organized Sector Surge:** The NRAI Food Services Report 2024 projects organized dining in India to expand from **43.8% in FY24 to 52.9% by FY28**, growing at **13.2% CAGR**.
- **The Toast ($TOST) Paradigm:** In the US, Toast proved that combining intuitive Android hardware, multi-station KDS, and financial services commands a $15B+ public market cap. India and emerging markets lack an equivalent luxury modern operating system with native GST and WhatsApp capabilities.

---

## 3. Product & Technology Architecture

Vyoma ScanServe is built as a cloud-native, edge-cached progressive architecture designed for extreme uptime and modern culinary workflows.

```
┌───────────────────────────────────────────────────────────────────────┐
│                     VYOMA ARCHITECTURAL MESH                          │
│                                                                       │
│   [ Captain Floor Tablets ]   [ QR Guest Ordering ]   [ Online Feeds ]│
│        (Android/Capacitor)          (Mobile Web)       (Swiggy/Zomato)│
│                 │                        │                     │      │
│                 ▼                        ▼                     ▼      │
│   ┌───────────────────────────────────────────────────────────────┐   │
│   │           ON-PREMISES LOCAL RELAY SERVER (0.4ms PING)          │   │
│   │   • Local SQLite/Dexie Offline Store • Real-Time SSE Bus      │   │
│   └──────────────────────────────┬────────────────────────────────┘   │
│                                  │                                    │
│        ┌─────────────────────────┴─────────────────────────┐          │
│        ▼                                                   ▼          │
│  [ Kitchen KDS Hub ]                             [ Cloud Synchronization ]
│  • Station 1: Grill & Sauté                      • Supabase Cloud DB   │
│  • Station 2: Pastry & Cold Larder               • Automated WhatsApp  │
│  • Station 3: Pass & Expediter                     Tax Invoice Gateway │
│  • Station 4: Bar Dispense                       • SAP / Tally Bridge  │
└───────────────────────────────────────────────────────────────────────┘
```

### 3.1 Key Product Modules
1. **Captain Service Desk:** Dynamic table status matrix (`occupied`, `billed`, `available`), visual floor mapping, course-by-course order firing, and split-billing.
2. **Multi-Station Kitchen KDS:** Real-time routing by culinary station. Items tagged as "Grill" route directly to the Grill station tablet; beverages route to the Bar screen. Elapsed preparation timers trigger visual color-coded warnings and acoustic audio alerts.
3. **Paperless WhatsApp E-Invoicing:** Generates India-compliant GST thermal receipts formatted with HSN codes, CGST/SGST breakdowns, and QR payment links sent directly to the guest's WhatsApp. Captures 100% verified customer mobile numbers with zero manual paper handling.
4. **Automated VIP CRM Loyalty Engine:** Identifies repeat phone numbers in real time, computes historical visit count and average spend, and applies automated tiered VIP discounts (10%–15%) without manager intervention.
5. **Enterprise Multi-Property Mesh:** Centralized franchise dashboard with instant outlet switching, live consolidated revenue telemetry, and batch general ledger export to **SAP ERP** and **Tally Prime XML**.

---

## 4. Competitive Analysis & Matrix

```
                 HIGH ACV / ENTERPRISE
                           ▲
                           │        Restroworks (Posist)
                           │        [Complex setup, high lock-in]
                           │
                           │   ★ VYOMA ENTERPRISE GROUP
                           │   [0.4ms Relay • Automated ERP Bridge]
                           │
LOW TECH / CLUNKY          ┼───────────────────────────────► MODERN LUXURY UX
LEGACY WINDOWS             │   ★ VYOMA GRAND BRASSERIE & BISTRO
                           │   ["The Obsidian Guild" Luxury UI • WhatsApp CRM]
                           │
      Petpooja             │
      [Budget SME focus]   │
                           ▼
                  LOW ACV / BUDGET SME
```

### 4.1 Detailed Competitive Comparison

| Feature / Metric | Vyoma ScanServe | Petpooja | Restroworks (Posist) | Toast Inc. (US Benchmark) |
| :--- | :--- | :--- | :--- | :--- |
| **Target Segment** | Cafes, Casual & Fine Dining, Multi-Unit Chains | Budget QSRs & Street Outlets | Multi-National Enterprise Chains | US/EU Full Service & QSR |
| **Offline Performance** | **Edge LAN Relay (`0.4ms`), Local Storage** | Local Windows Client | Cloud-heavy, partial sync | Offline payments & local queue |
| **UI / Aesthetics** | **"The Obsidian Guild" Luxury OLED Dark Theme** | Utility-oriented, legacy UI | Dense enterprise menus | Modern Android clean UI |
| **Kitchen KDS Routing**| **Multi-station (Grill, Saute, Pass, Bar) with sound chimes** | Single screen or basic token | Multi-station KDS | Leading Multi-Station KDS |
| **Guest Invoicing** | **Instant WhatsApp E-Receipt + Thermal Print** | Thermal print, SMS link | Thermal print, email | Email/SMS receipt |
| **Hardware Agnostic**| **Runs on any tablet, Android, iPad, PC** | Windows PC dependent | Proprietary / PC setup | Proprietary hardware terminals |
| **Pricing Architecture**| **₹2,999 to ₹19,999 / mo (Transparent Tiers)** | ₹10,000–₹15,000 / yr entry | Custom Enterprise Quotes | $69–$165/mo + high card fees |

### 4.2 Defensibility & Moats
- **Zero-Hardware Dependency:** Operators can deploy Vyoma in 10 minutes on existing consumer Android tablets ($120) or iPads without buying proprietary $1,500 POS hardware.
- **WhatsApp Customer Data Flywheel:** By replacing paper slips with WhatsApp invoices, Vyoma captures real-world dining frequency data that traditional cash registers fail to track.
- **High Switching Costs:** Once a restaurant configures custom table layouts, multi-station KDS kitchen rules, and staff permission pins, switching POS platforms requires retraining entire floor and kitchen crews.

---

## 5. Business Model & Go-to-Market Strategy

### 5.1 Revenue Model

Vyoma utilizes a high-margin recurring SaaS subscription model supplemented by transactional fintech revenue:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        THREE-TIER SAAS PRICING                         │
├───────────────────┬────────────────────────────┬───────────────────────┤
│ BISTRO & CAFE     │ GRAND BRASSERIE            │ ENTERPRISE GROUP      │
│ ₹2,999 / month    │ ₹7,499 / month             │ ₹19,999 / month       │
│ (₹35,988 / year)  │ (₹89,988 / year)           │ (₹2,39,988 / year)    │
│ Fast-Casual, Cafes│ Fine Dining, Restobars     │ Chains & Multi-Unit   │
└───────────────────┴────────────────────────────┴───────────────────────┘
```

#### Secondary Revenue Streams:
1. **Embedded Payments & Soundbox Processing:** 0.15%–0.30% margin on card and QR payments.
2. **WhatsApp Direct Marketing Credits:** Tiered packages for automated re-engagement broadcasts to past diners.
3. **Enterprise Custom Integrations:** ERP bridge setup and dedicated server relay deployment fees.

### 5.2 Go-to-Market Execution

```
Phase 1: City Density Wedge (Months 1–9)
Focus: Mumbai & Delhi-NCR
Target: High-visibility independent cafes, microbreweries, and premium bistros.
Tactics: Direct field sales reps, local chef network referrals, 14-day zero-risk trial.
           │
           ▼
Phase 2: Regional Metro Scale (Months 10–18)
Focus: Bengaluru, Hyderabad, Pune, Kolkata
Target: Multi-unit casual dining chains (3–10 outlets).
Tactics: F&B consultancy partnerships, kitchen equipment vendor bundles.
           │
           ▼
Phase 3: GCC & International Expansion (Months 19–24)
Focus: Dubai, Abu Dhabi, Riyadh, Singapore
Target: Luxury Indian and international restaurants seeking WhatsApp digital invoicing.
```

---

## 6. Comprehensive Financial Model (3-Year Forecast)

### 6.1 P&L Projections (INR in Crores)

| Line Item | Year 1 | Year 2 | Year 3 |
| :--- | :--- | :--- | :--- |
| **Subscribed Outlets (Ending)** | **350** | **1,050** | **2,450** |
| SaaS License Revenue | ₹2.26 Cr | ₹7.14 Cr | ₹26.04 Cr |
| Payment Processing & WhatsApp Revenue | ₹0.18 Cr | ₹0.72 Cr | ₹3.10 Cr |
| **Total Gross Revenue** | **₹2.44 Cr ($293K)** | **₹7.86 Cr ($944K)** | **₹29.14 Cr ($3.50M)** |
| Cost of Goods Sold (Cloud hosting, WhatsApp API, Support) | ₹0.39 Cr | ₹1.18 Cr | ₹3.50 Cr |
| **Gross Profit** | **₹2.05 Cr (84.0%)** | **₹6.68 Cr (85.0%)** | **₹25.64 Cr (88.0%)** |
| Engineering & Product R&D | ₹1.20 Cr | ₹2.40 Cr | ₹4.80 Cr |
| Sales, Field Demos & Marketing | ₹1.10 Cr | ₹3.20 Cr | ₹9.20 Cr |
| General, Administrative & Operations | ₹0.45 Cr | ₹0.90 Cr | ₹2.10 Cr |
| **Total Operating Expenses (OpEx)** | **₹2.75 Cr** | **₹6.50 Cr** | **₹16.10 Cr** |
| **EBITDA / Operating Income** | **(₹0.70 Cr) [-28.7%]**| **(₹0.18 Cr) [-2.3%]** | **+₹9.54 Cr [+32.7%]** |
| Net Tax / Profit | (₹0.70 Cr) | (₹0.18 Cr) | **+₹7.15 Cr ($858K)** |

### 6.2 Key Unit Economics

$$\text{Blended LTV} = \frac{\text{Average Monthly ARPU} \times \text{Gross Margin \%}}{\text{Monthly Churn \%}} = \frac{₹6,800 \times 86\%}{1.25\%} = ₹4,67,840 \quad (\approx \$5,616\text{ USD})$$

- **Blended CAC:** **₹11,800 ($141 USD)** by Year 2.
- **LTV / CAC Ratio:** **39.6x** (Conservative 36-month horizon capped LTV: ₹1,35,000 $\rightarrow$ **11.4x**).
- **CAC Payback Period:** **2.1 months** (Industry benchmark is < 12 months).
- **Monthly Net Revenue Retention (NRR):** **108%** (driven by outlet expansion and tier upgrades).

---

## 7. Organization & Headcount Evolution

```
Founding Core (6 FTE) ──► Year 1 (16 FTE) ──► Year 2 (32 FTE) ──► Year 3 (52 FTE)
```

| Department | Current | Year 1 | Year 2 | Year 3 | Focus Area |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Engineering & Product** | 4 | 7 | 12 | 18 | Edge sync, KDS latency, ERP bridges, offline DB |
| **Field Sales & Business Dev** | 1 | 5 | 11 | 18 | City-level feet-on-street merchant onboarding |
| **Customer Success & Support** | 1 | 3 | 7 | 12 | 24/7 dinner rush hotline & physical setup |
| **Operations, Legal & Finance** | 0 | 1 | 2 | 4 | Billing, compliance, partner integrations |
| **Total Headcount** | **6** | **16** | **32** | **52** | High ARR per employee ($67K/employee by Y3) |

---

## 8. Traction & Execution Milestones

### 8.1 Current Status & Milestones Achieved
- **Complete Product Core Built:** POS, Multi-Station KDS, Captain floor ordering, and WhatsApp e-invoicing active.
- **Production Multi-Tier Demo Environments:** Live Bistro, Grand Brasserie, and Enterprise testbeds operational with real-time switching and telemetry.
- **Native Android Tablet Build:** Capacitor packaging verified with native camera QR scanning and thermal USB/network printer compatibility.
- **Pilots Deployed:** 35 active pilot establishments operating across fast-casual cafes and fine dining restaurants.

### 8.2 Upcoming 18-Month Milestones

```
Month 3: Roll out Embedded UPI Soundbox & Payment Acquiring
Month 6: Reach 150 Paid Outlets in Mumbai & Delhi-NCR (₹1 Cr ARR Run Rate)
Month 12: Reach 500 Outlets across 5 Metros (₹3.5 Cr ARR Run Rate)
Month 18: Cross 1,050 Outlets; Achieve Operating Cash-Flow Breakeven
Month 24: Launch Dubai / GCC Pilot Network (Phase 3)
```

---

## 9. Risk Assessment & Mitigation Framework

| Risk Factor | Probability | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **1. Aggressive Pricing by Incumbents (Petpooja)** | High | Medium | Do not compete on bottom-barrel price. Compete on visual luxury, multi-station KDS routing, offline reliability, and WhatsApp customer acquisition where Petpooja lacks modern UI capabilities. |
| **2. Merchant Churn Due to Restaurant Failure** | Medium | High | Industry mortality for new restaurants is high. Vyoma balances portfolio risk by targeting established casual/fine dining operators and multi-unit chains with >3 years of operation. |
| **3. WhatsApp API Fee Fluctuations** | Medium | Low | Bundle a generous base quota (1,000 monthly utility receipts included) and charge micro-fees on marketing broadcast campaigns where merchants derive direct revenue. |
| **4. On-Site Deployment & Hardware Support Overhead** | Medium | Medium | Maintain a hardware-agnostic architecture. Restaurants use standard off-the-shelf Android tablets easily replaced locally without waiting for proprietary POS technicians. |

---

## 10. Funding Request & Use of Proceeds

Vyoma Hospitality Technologies is raising **$1.50M USD (₹12.50 Crore INR)** in Seed funding.

### 10.1 Allocation of Proceeds

```
┌────────────────────────────────────────────────────────────────────────┐
│                        USE OF PROCEEDS ($1.50M)                        │
├────────────────────────────────┬───────────────┬───────────────────────┤
│ CATEGORY                       │ AMOUNT (USD)  │ PERCENTAGE            │
├────────────────────────────────┼───────────────┼───────────────────────┤
│ Sales & Go-to-Market Expansion │ $600,000      │ 40.0%                 │
│ Engineering & Edge R&D         │ $600,000      │ 40.0%                 │
│ Customer Success & Ops Support │ $150,000      │ 10.0%                 │
│ Working Capital & 18-Mo Runway │ $150,000      │ 10.0%                 │
└────────────────────────────────┴───────────────┴───────────────────────┘
```

1. **Sales & Go-to-Market Expansion ($600K / 40%):**
   - Hire 10 field sales specialists across Mumbai, Delhi-NCR, and Bengaluru.
   - Run hyper-targeted restaurateur roundtables and referral incentive programs.
2. **Engineering & Edge R&D ($600K / 40%):**
   - Expand backend and systems engineering to solidify the edge relay protocol.
   - Deepen native bi-directional aggregator webhooks (Swiggy, Zomato, Deliveroo) and enterprise accounting connectors (SAP, Tally, Oracle NetSuite).
3. **Customer Success & 24/7 Emergency Floor Ops ($150K / 10%):**
   - Dedicated dinner-rush support team providing immediate resolution during 8 PM–12 AM service windows.
4. **Working Capital ($150K / 10%):**
   - General buffer providing a comfortable 20–24 month cash runway.

---

## 11. Conclusion & Investment Summary

Vyoma ScanServe addresses a critical gap in emerging market hospitality technology: providing a **Toast-level, Michelin-grade dining and kitchen management suite** without proprietary hardware lock-in, fortified by **offline LAN edge resilience** and **instant WhatsApp tax billing**.

With unit economics demonstrating **85%+ gross margins**, **< 3-month CAC payback**, and a clearly mapped route to **₹54.1 Crore ($6.5M USD) ARR by Year 5**, Vyoma represents a high-conviction venture investment at the ground floor of India's organized restaurant revolution.
