export interface LegalSection {
  id: string;
  title: string;
  content: string;
}

export interface LegalDocument {
  title: string;
  subtitle: string;
  effectiveDate: string;
  version: string;
  sections: LegalSection[];
}

export const LEGAL_DISCLAIMER_NOTICE = 
  "Notice: This legal document is published for contractual governance and regulatory compliance across Vyoma ScanServe software deployments. Consult with qualified legal counsel for jurisdiction-specific advisory.";

export const TERMS_OF_SERVICE: LegalDocument = {
  title: "Terms of Service & SaaS Agreement",
  subtitle: "Master Subscription Agreement for Restaurant Operators & Franchise Groups",
  effectiveDate: "September 20, 2026",
  version: "v2.4-PROD",
  sections: [
    {
      id: "acceptance",
      title: "1. Acceptance of Terms & Eligibility",
      content: `By registering, deploying, or accessing the Vyoma ScanServe Restaurant Operating System ("Software", "Service", or "Platform"), you ("Customer", "Merchant", or "Operator") enter into a legally binding agreement with Vyoma Hospitality Technologies Private Limited ("Vyoma", "Company", "we", or "us"). 
      
If you are entering into this Agreement on behalf of a restaurant company, franchise group, or commercial entity, you represent and warrant that you possess full corporate authorization to bind that entity to these Terms. If you do not accept all clauses of this Agreement, you must not access or utilize the Service.`
    },
    {
      id: "license",
      title: "2. Software License Grant & Scope of Use",
      content: `Subject to compliance with these Terms and timely subscription fee payment, Vyoma grants Customer a non-exclusive, non-transferable, revocable, worldwide right to access and utilize the Platform on designated point-of-sale terminals, kitchen displays (KDS), captain floor tablets, and administrative consoles.

Customer agrees not to:
(a) Reverse engineer, decompile, disassemble, or derive the source code of the Service;
(b) Sub-license, resell, lease, or commercially exploit the Platform to unauthorized third-party establishments;
(c) Tamper with or bypass offline ring buffers, local server relay telemetry, or staff role security permissions;
(d) Utilize the Platform in any manner that violates Indian laws, FSSAI hygiene standards, or international trade regulations.`
    },
    {
      id: "tiers",
      title: "3. Subscription Tiers & Service Level Architecture",
      content: `Vyoma ScanServe offers three distinct operational tiers:
• Bistro & Cafe Tier: Single-queue KDS, counter ordering, and digital WhatsApp billing for independent cafes and specialty coffee shops.
• Grand Brasserie Tier: Multi-station KDS routing (Grill, Saute, Pastry, Pass, Bar), Swiggy & Zomato bi-directional webhooks, and automated VIP loyalty CRM.
• Enterprise Group Tier: Multi-property franchise mesh, dedicated local relay server synchronization (sub-millisecond local latency), consolidated multi-outlet ledgers, and automated Tally XML & SAP ERP batch export.

Upgrades between tiers take effect instantaneously with prorated billing adjustments.`
    },
    {
      id: "sla",
      title: "4. Service Level Agreement (SLA) & Offline Mesh Warranty",
      content: `(a) Cloud Uptime: Vyoma targets a 99.9% monthly uptime for cloud database synchronization, menu synchronization, and centralized reporting consoles.
(b) Offline Mesh Resilience: In the event of public internet or broadband disconnection, Vyoma's local LAN edge relay and client-side IndexedDB/SQLite caching guarantee uninterrupted floor ordering, kitchen ticket firing, and local terminal operation.
(c) Scheduled Maintenance: Maintenance windows are scheduled outside peak dinner rush hours (typically between 02:00 and 05:00 IST) with at least 48 hours advance administrative notice.`
    },
    {
      id: "merchant-duties",
      title: "5. Merchant Responsibilities & Tax Compliance",
      content: `Customer maintains sole responsibility for:
(a) Ensuring menu prices, statutory levies, and Goods & Services Tax (GST) rates (CGST, SGST, IGST) accurately reflect applicable taxation laws;
(b) Securing manager access passwords and staff terminal PINs to prevent unauthorized table voids or bill cancellations;
(c) Verifying physical food preparation and allergen compliance. Vyoma provides order dispatch software and assumes no responsibility for food preparation errors, spoilage, or kitchen handling.`
    },
    {
      id: "whatsapp",
      title: "6. WhatsApp Digital Invoicing & Third-Party APIs",
      content: `Vyoma integrates with third-party telecommunications gateways, including the Meta Platforms / WhatsApp Cloud API, Swiggy, Zomato, and Dyno API services. Customer acknowledges that delivery of digital invoices to patron handsets is subject to Meta's acceptable use policies, patron network connectivity, and spam prevention guidelines. Customer agrees never to utilize the WhatsApp dispatch tool for unsolicited promotional spam outside lawful hospitality transactional receipts.`
    },
    {
      id: "liability",
      title: "7. Limitation of Liability",
      content: `TO THE MAXIMUM EXTENT PERMITTED UNDER APPLICABLE LAW, IN NO EVENT SHALL VYOMA, ITS DIRECTORS, EMPLOYEES, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF RESTAURANT REVENUE, FOOD SPOILAGE, TABLE DISPUTES, OR THIRD-PARTY DELIVERY CHARGES.

VYOMA'S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THIS AGREEMENT SHALL UNDER NO CIRCUMSTANCES EXCEED THE TOTAL FEES ACTUALLY PAID BY CUSTOMER TO VYOMA IN THE THREE (3) MONTHS IMMEDIATELY PRECEDING THE CLAIM.`
    },
    {
      id: "governing-law",
      title: "8. Governing Law & Dispute Resolution",
      content: `This Agreement shall be governed, construed, and enforced in accordance with the laws of the Republic of India. Any dispute, controversy, or claim arising out of or relating to this contract shall be submitted to the exclusive jurisdiction of the competent civil courts in Mumbai, Maharashtra, India.`
    }
  ]
};

export const PRIVACY_POLICY: LegalDocument = {
  title: "Privacy Policy & Data Protection",
  subtitle: "Compliance with India DPDP Act 2023, GDPR & Global Privacy Frameworks",
  effectiveDate: "September 20, 2026",
  version: "v2.4-PROD",
  sections: [
    {
      id: "scope",
      title: "1. Scope & Legislative Framework",
      content: `Vyoma Hospitality Technologies is committed to the highest standards of data governance. This Privacy Policy outlines how we collect, process, store, and protect personal and transactional data across our POS terminals, Captain Tablets, Kitchen Displays, and digital invoice portals in strict compliance with:
• India's Digital Personal Data Protection Act, 2023 (DPDP Act);
• General Data Protection Regulation (EU GDPR 2016/679);
• Information Technology Act, 2000 (India) and Reasonable Security Practices Rules.`
    },
    {
      id: "data-collected",
      title: "2. Categories of Information We Process",
      content: `(a) Merchant Business Information: Entity legal name, trade name, GSTIN, registered dining address, business email, bank account/UPI identifiers for settlements, and authorized manager credentials.
(b) Staff Operational Identifiers: Staff member names, terminal login PINs, role permissions (Captain, Cashier, Chef, Admin), and shift audit timestamps.
(c) Patron / Diner Information: Customer mobile telephone number, patron display name, table seating number, order item preferences, dietary notes, and computed visit frequency for VIP recognition.
(d) Telemetry & Technical Data: On-premises relay IP addresses, device operating system versions (Capacitor/Android/iOS/Web), printer network socket addresses, and terminal ping latencies.`
    },
    {
      id: "purposes",
      title: "3. Legal Basis & Purpose of Processing",
      content: `We process data strictly for lawful purposes essential to restaurant operations:
• Generating legally compliant tax invoices with mandatory CGST/SGST/HSN disclosures;
• Dispatching digital e-receipts and payment confirmation links directly to patrons via WhatsApp;
• Recognizing frequent diners to apply authorized merchant loyalty rewards and VIP discounts;
• Route culinary courses across synchronized kitchen display queues;
• Providing consolidated general ledger audit files for corporate accounting and tax audits.`
    },
    {
      id: "storage",
      title: "4. Data Storage, Edge Caching & International Transfers",
      content: `Vyoma employs a hybrid data architecture:
• Primary Cloud Records: Stored in high-security cloud facilities (Supabase Cloud / AWS Asia-Pacific Mumbai Region) with 256-bit AES encryption at rest and TLS 1.3 encryption in transit.
• Local Edge Caching: Transactional orders and active tables are temporarily cached on the venue's local relay server and tablet memory via IndexedDB and SQLite to maintain zero-latency operation during internet interruptions.
• Zero Cross-Border Transfer Without Safeguards: Patron records originating in India remain hosted within India, compliant with national data sovereignty standards.`
    },
    {
      id: "rights",
      title: "5. Data Principal Rights & Deletion Protocols",
      content: `Under the DPDP Act 2023 and GDPR, patrons and merchants retain clear rights:
(a) Right to Access & Confirmation: Patrons may request a summary of their dining transactions;
(b) Right to Correction & Erasure: Patrons may request the removal of their telephone number from the merchant's loyalty CRM database;
(c) Grievance Redressal: Requests can be filed directly with our Data Protection Officer at privacy@vyoma-hospitality.com. Verified requests are executed within 7 business days.`
    }
  ]
};

export const DATA_PROCESSING_AGREEMENT: LegalDocument = {
  title: "Data Processing Agreement (DPA)",
  subtitle: "Contractual Data Controller & Data Processor Schedule",
  effectiveDate: "September 20, 2026",
  version: "v2.4-PROD",
  sections: [
    {
      id: "roles",
      title: "1. Roles of the Parties",
      content: `For the purposes of applicable data protection legislation:
• The Restaurant Merchant acts as the "Data Fiduciary" (DPDP Act) or "Data Controller" (GDPR) determining the purposes and means of patron data collection.
• Vyoma acts as the "Data Processor" processing transactional orders, patron telephone numbers, and receipt deliveries solely upon documented merchant instructions.`
    },
    {
      id: "security",
      title: "2. Technical & Organizational Security Measures (TOMs)",
      content: `Vyoma maintains rigorous technical safeguards:
• End-to-End Cryptographic Encryption: All communication between floor tablets, kitchen displays, and cloud databases utilizes TLS 1.3 protocols.
• Salted Password Hashing: Staff access PINs and administrative credentials are cryptographically salted and hashed.
• Automated Database Backups: Daily automated database snapshots with point-in-time recovery capabilities.
• Role-Based Access Control (RBAC): Floor captains cannot access administrative gross margin reports; kitchen chefs cannot alter pricing tables.`
    },
    {
      id: "subprocessors",
      title: "3. Authorized Sub-Processors",
      content: `Customer grants general authorization to Vyoma to engage the following sub-processors:
• Meta Platforms Ireland Ltd. (WhatsApp Cloud API infrastructure for transactional invoice delivery);
• Supabase Inc. (PostgreSQL cloud database hosting and real-time event streaming);
• Cloudflare Inc. (DDoS protection, DNS routing, and edge SSL termination).
Vyoma imposes contractual data protection obligations upon each sub-processor no less protective than those defined herein.`
    }
  ]
};

export const COOKIE_POLICY: LegalDocument = {
  title: "Cookie & Local Storage Policy",
  subtitle: "Transparency Disclosure on Terminal State & Session Management",
  effectiveDate: "September 20, 2026",
  version: "v2.4-PROD",
  sections: [
    {
      id: "cookies-overview",
      title: "1. How Vyoma Uses Local Storage & Cookies",
      content: `Unlike advertising-driven websites, Vyoma ScanServe DOES NOT utilize third-party tracking cookies, behavioral ad retargeting pixels, or commercial data-broker beacons. 

Our application strictly utilizes standard browser LocalStorage and SessionStorage technologies to maintain essential terminal state, staff session persistence, and offline ticket stability.`
    },
    {
      id: "cookie-keys",
      title: "2. Inventory of Local Storage Keys",
      content: `The following essential keys are stored on merchant terminals:
• vyoma_staff_authenticated: Retains verified staff authentication token for floor access.
• vyoma_demo_mode & vyoma_demo_tier: Controls interactive sandbox preview environments (Bistro, Brasserie, Enterprise).
• vyoma_kiosk_locked: Enforces floor lock restricting waitstaff to Captain View on shared venue tablets.
• vyoma_frequent_discount_enabled: Stores local preference for automated VIP customer reward thresholds.
• vyoma_terminal_server_url: Retains on-premise relay IP address for sub-millisecond local LAN printing.`
    },
    {
      id: "management",
      title: "3. Controlling & Clearing Stored Data",
      content: `Terminal operators can clear stored preferences at any time by clicking "Lock Terminal" in the sidebar or clearing site data via browser settings. Note that clearing storage will require re-authentication with the venue access password.`
    }
  ]
};

export const GST_DISCLAIMER: LegalDocument = {
  title: "GST Compliance & Tax Billing Disclaimer",
  subtitle: "Statutory Tax Governance under Section 31 of CGST Act 2017",
  effectiveDate: "September 20, 2026",
  version: "v2.4-PROD",
  sections: [
    {
      id: "gst-mandate",
      title: "1. Statutory Invoicing Architecture",
      content: `Vyoma ScanServe includes automated thermal printing and digital WhatsApp receipt generators designed to assist food and beverage establishments in issuing valid Tax Invoices under Section 31 of the Central Goods and Services Tax (CGST) Act, 2017 and respective State GST enactments.`
    },
    {
      id: "merchant-liability",
      title: "2. Sole Merchant Responsibility for Tax Rates & Filings",
      content: `The Merchant is exclusively responsible for:
(a) Entering and verifying their valid 15-character Goods and Services Tax Identification Number (GSTIN);
(b) Configuring the correct tax slabs (e.g. 5% without ITC for standard restaurant services, 18% with ITC for outdoor catering or hotel-bundled venues, and relevant alcohol VAT/excise duties);
(c) Reconciling monthly GSTR-1 outward supply statements and GSTR-3B tax returns.

Vyoma functions purely as an automated mathematical calculation engine based on merchant configuration and DOES NOT provide legal, accounting, tax, or financial advisory services.`
    },
    {
      id: "audit-records",
      title: "3. Audit Logs & Digital Ledger Exports",
      content: `Vyoma provides automated CSV, JSON, and Tally/SAP XML export formats for external accounting reconciliation. The Merchant must independently verify accounting ledgers before submitting statutory tax filings to the GST Network (GSTN) or state tax authorities.`
    }
  ]
};
