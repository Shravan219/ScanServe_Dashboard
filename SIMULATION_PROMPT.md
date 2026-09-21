# MIROFISH SIMULATION PROMPT: VYOMA SCANSERVE EFFICIENCY & RESILIENCE STRESS-TEST
**Target Engine:** MiroFish Swarm Intelligence Platform (Multi-Agent Simulation Harness)  
**Execution Mode:** Parallel Swarm Simulation with GraphRAG Ingestion  
**Objective:** Stress-test system throughput, order lifecycle latency, human-machine handoff bottlenecks, and edge-case failure modes across peak-hour restaurant operations.

---

```yaml
simulation_id: "vyoma-scanserve-efficiency-benchmark-01"
system_under_test: "Vyoma ScanServe (React 19 + Supabase + Express + Android Captain POS + KDS)"
time_horizon: "2.5 Hours (19:30 - 22:00 Friday Dinner Peak)"
time_step_resolution: "30 Seconds"
total_agent_population: 68
```

## 1. AGENT SWARM TOPOLOGY & PERSONA ROLES

Deploy a synthetic population of 68 interacting agents mapped across the following personas:

### A. Front-of-House (Floor Staff)
- **4x CaptainAgents (`CAPTAIN_01` to `CAPTAIN_04`):**
  - *Device:* 10-inch Android Tablet running Capacitor ScanServe APK.
  - *Behavioral Profile:* Fast-paced, handling 5 tables each. Prone to input errors when tables have more than 6 guests or complex dietary custom instructions.
  - *Tasks:* Seating guests, taking orders via `OrderBuilderSheet`, monitoring `ReadyOrdersBanner`, delivering dishes, handling table status transitions (`available` -> `occupied` -> `cleaning`).

### B. Back-of-House (Culinary Operations)
- **3x ChefAgents (`CHEF_HEAD`, `CHEF_GRILL`, `CHEF_PREP`):**
  - *Terminal:* 21-inch KDS touch display.
  - *Behavioral Profile:* Working in high-heat environment. Prioritizes cooking over screen tapping; sometimes batches "Mark Ready" taps instead of tapping immediately upon plating.
  - *Tasks:* Ticket acknowledgment (`Accept`), tracking elapsed prep timers, marking items `Ready`, triggering 86'd stockouts (`is_sold_out: true`).

### C. Cashier & Floor Management
- **1x CashierAgent (`CASHIER_HOST`):**
  - *Terminal:* Desktop POS terminal with ESC/POS printer & Baileys WhatsApp bot.
  - *Behavioral Profile:* Handles bill print requests, split payments, loyalty discount overrides, and invoice generation. Sensitive to checkout counter queue buildup.

### D. Patron Swarm (Customers)
- **45x CustomerAgents (`GUEST_01` to `GUEST_45`):**
  - *Attributes:* Varied party sizes (parties of 2, 4, and 8). 20% repeat patrons (eligible for `loyal_vip` 10% discount). 15% corporate diners requiring formal GSTIN invoices.
  - *Patience Threshold:* 12 minutes max for drink delivery; 25 minutes max for mains; 4 minutes max for bill settlement.

### E. Delivery Aggregator Fleet
- **12x AggregatorDeliveryAgents (`DELIVERY_SWIGGY_01` to `DELIVERY_ZOMATO_06`):**
  - *Behavioral Profile:* Inbound online orders injected via Dyno/Webhook API. Arrive at restaurant dispatch counter 15 minutes after order injection. Impatient if food is delayed.

### F. Environment & Chaos Orchestrator
- **1x ChaosSystemAgent (`CHAOS_MONITOR`):**
  - Injects stochastic latency, network jitter, Wi-Fi packet drops, and sudden inventory exhaustions.

---

## 2. MULTI-PHASE PEAK-HOUR SCENARIOS

Simulate the 150-minute dinner window across three escalating stress waves:

### Phase 1: Baseline Ingestion & Dine-In Spike (Minutes 0 - 45)
- Occupancy surges from 30% to 90% across all 20 tables (`T-01` to `T-20`).
- 25 dine-in orders fired within 20 minutes.
- Concurrent arrival of 8 aggregator orders via `/api/webhooks`.
- *Observe:* Order token sequencing integrity (`#101` upward), Supabase WebSocket fan-out latency, KDS queue rendering performance.

### Phase 2: Kitchen Station Saturation & Stockout Cascade (Minutes 45 - 90)
- Grill station hits 100% capacity; prep timers exceed 20 minutes (Amber warnings activate on KDS).
- Chef triggers 86 stockout (`is_sold_out: true`) on top-selling dish "Truffle Mushroom Risotto".
- *Inject Test:* `CAPTAIN_02` attempts to place an order for the sold-out dish 15 seconds after the chef marks it sold out.
- *Observe:* Real-time cache propagation speed from Supabase to Android floor tablets, conflict resolution, table renegotiation delay.

### Phase 3: Hardware & Network Friction Stress (Minutes 90 - 150)
- `CHAOS_MONITOR` simulates a 45-second Wi-Fi drop on floor tablets (forcing reliance on local memory cache / reconnection loop).
- Cashier experiences a surge of 6 tables requesting bill settlement simultaneously (3 cash, 2 split UPI, 1 corporate GST invoice).
- Express server fires 12 automated WhatsApp receipt PDFs via Baileys bot in a 60-second burst.
- *Observe:* Local SSE vs WebSocket failover behavior, Baileys socket stability, thermal print queue delays, table turnover cycle latency.

---

## 3. EFFICIENCY METRICS & TELEMETRY REQUIREMENTS

The simulation must log, quantify, and report on the following Key Performance Indicators (KPIs):

1. **Order Capture-to-KDS Latency ($L_{fire}$):**
   Time from Captain tapping "Submit Order" to visual render on kitchen KDS screen (Target: $< 800\text{ ms}$).
2. **KDS Plating-to-Floor Handoff Gap ($L_{handoff}$):**
   Time elapsed between Chef tapping "Mark Ready" and Captain picking up plates from the kitchen pass (Target: $< 90\text{ s}$).
3. **Table Turnover Cycle Efficiency ($T_{turnover}$):**
   Total elapsed duration from table seating (`occupied`) through dining, billing, settlement, and `cleaning` reset (Benchmark vs. Optimal: $65\text{ min}$).
4. **Sold-Out Race Condition Error Rate ($E_{86}$):**
   Frequency of orders containing sold-out items submitted after stockout toggle.
5. **Settlement Throughput ($R_{settle}$):**
   Average seconds required per billing transaction (calculating loyalty discount + GST invoice + thermal print + WhatsApp PDF dispatch).
6. **System Resilience & Degradation Index ($S_{uptime}$):**
   Data loss percentage, duplicate order rate, or dropped webhook events during network jitter and socket reconnections.

---

## 4. REPORT AGENT SYNTHESIS DIRECTIVES

Upon simulation completion, task the **MiroFish ReportAgent** to deliver a structured Diagnostic Report containing:

1. **Executive Scorecard:** Overall System Efficiency Grade (A–F) with latency distribution percentiles (p50, p95, p99).
2. **Operational Heatmap:** Floor vs. Kitchen vs. Cashier bottleneck timeline highlighting friction zones.
3. **Architecture Stress Assessment:** Supabase WebSocket load, Express in-memory ring buffer utilization, and Baileys WhatsApp bot reliability under peak burst.
4. **Strategic Optimization Roadmap:** Top 3 architectural refinements and top 3 operational workflow adjustments to maximize table turnover and eliminate revenue leakage.
