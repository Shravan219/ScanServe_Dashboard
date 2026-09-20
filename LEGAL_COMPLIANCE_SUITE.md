# Vyoma ScanServe: Complete Legal & Regulatory Compliance Suite
**Effective Date:** September 20, 2026  
**Version:** v2.4-PROD  
**Governing Entity:** Vyoma Hospitality Technologies Private Limited  
**Jurisdiction:** Mumbai, Maharashtra, Republic of India  

---

> [!NOTE]
> **Regulatory Notice**: This document outlines the official contractual, privacy, and statutory compliance framework governing all deployments of the Vyoma ScanServe Restaurant Operating System across web, Android, and on-premises relay environments. Consult with qualified legal counsel for venue-specific regulatory interpretations.

---

## 1. Terms of Service & Master SaaS Agreement

### 1.1 Acceptance of Agreement
By registering, deploying, or utilizing the Vyoma ScanServe software ("Platform", "Service"), the commercial food and beverage establishment ("Merchant", "Customer") enters into a legally binding agreement with Vyoma Hospitality Technologies Private Limited ("Vyoma").

### 1.2 License Grant & Scope of Deployment
Vyoma grants Customer a revocable, non-exclusive, non-transferable subscription license to operate the Platform on authorized point-of-sale terminals, kitchen displays (KDS), captain floor tablets, and administrative devices.
- Customer may not reverse-engineer, decompile, or tamper with the local server relay bus.
- Customer may not resell or sublicense the software to third-party commercial entities without explicit corporate authorization.

### 1.3 Operational Tiers & Feature Entitlements
1. **Bistro & Cafe Tier (₹2,999/mo):** Single-queue KDS, counter ordering, digital WhatsApp thermal invoicing, and cafe floor workflows.
2. **Grand Brasserie Tier (₹7,499/mo):** Multi-station culinary KDS routing (Grill, Saute, Pastry, Pass, Bar), Swiggy & Zomato bi-directional aggregator webhooks, and automated VIP loyalty recognition.
3. **Enterprise Group Tier (₹19,999/mo):** Multi-property franchise mesh, dedicated on-premises relay server synchronization (`0.4ms latency`), multi-outlet consolidated general ledgers, and automated Tally XML & SAP ERP batch export.

### 1.4 Service Level Agreement (SLA) & Offline Mesh Guarantee
- **Cloud Availability Target:** 99.9% monthly uptime for cloud database replication and management analytics.
- **Offline Mesh Resilience:** When broadband fails, the local on-premises server relay and IndexedDB/SQLite local storage maintain uninterrupted table ordering, kitchen ticket printing, and cashier billing without public internet.

### 1.5 Limitation of Liability
Vyoma’s total aggregate liability arising under this Agreement shall under no circumstances exceed the total fees paid by the Customer in the three (3) months immediately preceding the occurrence of the claim. Vyoma assumes no liability for food handling errors, spoilage, or third-party delivery aggregator disruptions.

---

## 2. Privacy Policy (DPDP Act 2023 & GDPR Compliant)

### 2.1 Legislative Compliance Framework
Vyoma processes transactional and personal data in strict compliance with:
- The **Digital Personal Data Protection Act, 2023 (DPDP Act, India)**;
- The **General Data Protection Regulation (EU GDPR 2016/679)**;
- The **Information Technology Act, 2000 (India)**.

### 2.2 Categories of Personal Data Collected
1. **Merchant Identifiers:** Business name, GSTIN, registered dining address, administrator credentials, and settlement bank/UPI IDs.
2. **Staff Credentials:** Captain and cashier display names, salted PINs, role-based access tokens, and shift audit logs.
3. **Patron / Diner Identifiers:** Mobile telephone numbers (collected strictly for direct WhatsApp digital receipt dispatch and VIP loyalty calculation), guest name, seating table, and item dietary preferences.
4. **Telemetry & Hardware Data:** Local relay IP addresses (`192.168.x.x`), device OS versions, and printer socket pings.

### 2.3 Legal Basis & Purposes of Processing
- Statutory tax invoice generation under Section 31 of CGST Act;
- Instant WhatsApp paperless tax invoice delivery with dynamic payment links;
- Automated recognition of repeat patrons (3+ visits) for VIP hospitality discounts;
- Course routing across synchronized kitchen preparation screens.

### 2.4 Data Retention & Deletion Protocols
Patrons retain the statutory right under DPDP Act 2023 to request the erasure of their telephone numbers from the venue's loyalty database. Erasure requests can be lodged at `privacy@vyoma-hospitality.com` and are executed within 7 business days.

---

## 3. Data Processing Agreement (DPA)

### 3.1 Roles of the Parties
- **The Restaurant Operator** acts as the **Data Fiduciary** (DPDP Act) or **Data Controller** (GDPR).
- **Vyoma Hospitality Technologies** acts as the **Data Processor**, processing dining and order data solely on documented merchant instructions.

### 3.2 Technical & Organizational Measures (TOMs)
- **Encryption:** All data in transit is protected via TLS 1.3; data at rest in Supabase/AWS is encrypted using AES-256.
- **Role-Based Access Control (RBAC):** Restricts floor waitstaff to captain views and protects managerial P&L reports.
- **Incident Response:** Vyoma guarantees notification of any confirmed data breach to affected Data Fiduciaries within 72 hours.

---

## 4. Cookie & Local Storage Disclosure

Vyoma ScanServe **DOES NOT use commercial tracking cookies, third-party advertising pixels, or data-broker beacons**.

### Essential Local Storage Inventory:
| Key | Purpose | Duration |
| :--- | :--- | :--- |
| `vyoma_staff_authenticated` | Preserves verified staff login session on floor terminal | Session / Persistent |
| `vyoma_demo_mode` | Controls interactive live demo sandbox state | Persistent until cleared |
| `vyoma_demo_tier` | Preserves active demo tier (`bistro`, `brasserie`, `enterprise`) | Persistent |
| `vyoma_kiosk_locked` | Locks tablet to Captain Ordering view on shared devices | Persistent |
| `vyoma_terminal_server_url` | Remembers local on-premises relay server IP address | Persistent |

---

## 5. GST Compliance & Tax Billing Disclaimer

### 5.1 Statutory Invoicing Mandate
Vyoma ScanServe is engineered to assist restaurants in issuing compliant Tax Invoices under **Section 31 of the Central Goods and Services Tax (CGST) Act, 2017**.

### 5.2 Sole Merchant Responsibility for Tax Configuration
- The Merchant is solely responsible for entering their valid 15-character **GSTIN** and verifying applicable tax rates (5% without ITC, 18% with ITC, alcohol VAT).
- Vyoma functions as an automated calculation engine and **does not provide accounting, financial, or legal tax advice**. Merchants must independently audit their monthly GSTR-1 and GSTR-3B filings.
