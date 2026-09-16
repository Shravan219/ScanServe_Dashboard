---
name: Vyoma ScanServe
description: Real-time luxury restaurant POS, kitchen display system & captain service dashboard
colors:
  primary: "#C5A059"
  primary-foreground: "#000000"
  background: "#000000"
  foreground: "#FFFFFF"
  card: "#0A0A0E"
  card-foreground: "#FFFFFF"
  popover: "#0D0E14"
  popover-foreground: "#FFFFFF"
  secondary: "#14161F"
  secondary-foreground: "#F3F4F6"
  muted: "#14161F"
  muted-foreground: "#A1A1AA"
  accent: "rgba(197, 160, 89, 0.12)"
  accent-foreground: "#C5A059"
  destructive: "#EF4444"
  destructive-foreground: "#FFFFFF"
  border: "rgba(255, 255, 255, 0.08)"
  input: "rgba(255, 255, 255, 0.08)"
  ring: "rgba(197, 160, 89, 0.4)"
  status-ready: "#10B981"
  status-progress: "#F59E0B"
  status-dinein: "#0EA5E9"
  status-takeaway: "#8B5CF6"
typography:
  display:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(2rem, 5vw, 3.25rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Karla, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Karla, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.05em"
  caption:
    fontFamily: "Karla, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
  micro:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.625rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.15em"
  nano:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.5625rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.2em"
  pico:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.5rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: "10px 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
    height: "44px"
  card-glass:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.lg}"
    padding: "16px"
  input-field:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "44px"
---

# Design System: Vyoma ScanServe

## Overview

**Creative North Star: "The Obsidian Guild"**

Vyoma ScanServe synthesizes the quiet grandeur of a private dark luxury atelier with the uncompromising speed of a Michelin-caliber culinary command center. Built for high-velocity restaurant operations—from captain table ordering on Android tablets to kitchen display terminals (KDS) and cashier settlement—the interface treats darkness not merely as a theme, but as an infinite obsidian canvas where information illuminates with surgical intent.

Every pixel balances aristocratic refinement against operational ergonomics. Deep obsidian substrates (`#000000`) and translucent glass cards eliminate eye fatigue during grueling 14-hour double shifts, while warm Imperial Gold (`#C5A059`) accents serve as authoritative beacons for decisive action. Neoclassical Cormorant Garamond typography bestows dignity upon order titles and customer receipts, while JetBrains Mono renders prices, token IDs, and order timers with unwavering telemetry precision.

Confirmed Anti-Reference: Vyoma firmly rejects sterile, blinding white SaaS dashboards, rainbow-colored plastic POS buttons, cookie-cutter Bootstrap/Chakra widgets, and cartoonish casual-dining aesthetics. It is built to feel like an expensive precision instrument created specifically for elite hospitality.

**Key Characteristics:**
- **Obsidian Immersion:** Deep pitch-black base canvas (`#000000`) paired with smoky glass cards (`#0A0A0E`) and whisper-quiet 8% white borders.
- **Imperial Gold Discipline:** Reserved strictly for primary focal points, active state highlights, and high-priority actions.
- **Dual Typographic Soul:** Neoclassical serif elegance (`Cormorant Garamond`) paired with high-legibility geometric sans (`Karla`) and telemetry monospace (`JetBrains Mono`).
- **Tactile Ergonomics:** Full WCAG 2.5.5 / 2.5.8 compliance with minimum 44×44px hit bounds, zero-delay touch manipulation, and physical press states.
- **Atmospheric Depth:** Layered backdrop blurs (14px–20px) and soft gold ambient glows rather than muddy opaque drop shadows.

## Colors

The palette pairs an uncompromising obsidian darkness with warm Rajput-inspired Imperial Gold, grounded by dark slate secondary structures and crisp functional status indicators.

### Primary
- **Imperial Gold** (`#C5A059`): The crown accent and unmistakable brand signature. Used for primary CTA buttons, active selection rings, gold glow highlights, and key brand emblems. Never used for large text blocks or full card backgrounds.

### Secondary
- **Slate Onyx** (`#14161F`): Elevated structural surface for inactive segment tabs, button containers, sub-toolbars, and secondary controls. Provides soft tonal separation above pure obsidian.

### Neutral
- **Obsidian Void** (`#000000`): The base canvas background. Ensures true zero-light black on OLED tablet and display panels, reducing power draw and eliminating glare in ambient dining rooms.
- **Night Charcoal** (`#0A0A0E`): Card substrate and table tile background. Creates subtle tonal layering when resting on the obsidian canvas.
- **Deep Night** (`#0D0E14`): Popover, dialog, and floating bottom-sheet backdrop.
- **Pure White** (`#FFFFFF`): Primary headings, customer names, modal titles, and high-priority action labels.
- **Whisper White Line** (`rgba(255, 255, 255, 0.08)`): Ubiquitous 1px divider and container border. Defines spatial hierarchy without visual clutter.
- **Muted Alabaster** (`rgba(255, 255, 255, 0.65)`): Subtitles, helper text, past timestamps, and non-active metadata.

### Status Accents
- **Emerald Vitality** (`#10B981`): Order ready status, bill settled state, vacant/available table indicators.
- **Amber Warmth** (`#F59E0B`): Kitchen in-progress state, chef notes, delayed order warnings.
- **Sky Cerulean** (`#0EA5E9`): Dine-in channel badges and live active table markers.
- **Royal Violet** (`#8B5CF6`): Takeaway orders and delivery dispatch channel markers.
- **Crimson Fire** (`#EF4444`): Order cancellation, destructive actions, offline warnings, and urgent alerts.

### Named Rules
**The Rarity of Gold Rule.** Imperial Gold (`#C5A059`) must never occupy more than 10% of any given screen or card. Its visual authority derives entirely from its rarity; when everything glows, nothing is urgent.
**The Pitch Canvas Rule.** Background surfaces must never drift into washed grays or muddy mid-tones. Deep obsidian (`#000000`) remains the non-negotiable anchor for the entire ecosystem.

## Typography

The typographic system fuses three distinct voices: aristocratic serif headlines for hospitality elegance, clean geometric sans for UI text, and monospaced digits for high-speed numerical telemetry.

**Display Font:** Cormorant Garamond (with Georgia, serif fallback)
**Body Font:** Karla (with ui-sans-serif, system-ui, sans-serif fallback)
**Label/Mono Font:** JetBrains Mono (with ui-monospace, SFMono-Regular fallback)

**Character:** A deliberate synthesis of Old-World editorial craftsmanship and mission-critical telemetry precision.

### Hierarchy
- **Display** (SemiBold 600, `clamp(2rem, 5vw, 3.25rem)`, line-height 1.1, tracking -0.02em): Hero dashboard headers, grand receipt titles, luxury brand headings.
- **Headline** (SemiBold 600, `1.75rem` (28px), line-height 1.2, tracking -0.01em): Dialog headers, primary sheet headers, major operational section titles.
- **Title** (SemiBold 600, `1.125rem` (18px), line-height 1.3): Order card headers, table numbers, modal subtitles.
- **Body** (Regular 400 & Medium 500, `0.875rem` (14px), line-height 1.5): Dish names, special cooking instructions, customer details, list items.
- **Label / Telemetry** (Bold 700 & SemiBold 600, `0.75rem` (12px), line-height 1, tracking 0.05em–0.25em uppercase): Order token badges, currency amounts (`₹`), seat counts, timer countdowns, and micro-badges.

### Named Rules
**The Telemetry Clarity Rule.** Every currency figure, token sequence (`#104`), table code (`T-04`), timer (`04:12`), and item count multiplier must be rendered in `JetBrains Mono` with tabular numbers (`tnum`) for instant glanceability.
**The Restrained Nobility Rule.** Cormorant Garamond is strictly reserved for primary section headers, modal banners, and receipt branding. It must never be used for micro-labels, dense tabular grids, or form inputs.

## Layout

Vyoma employs a modular grid designed for both desktop POS terminals and handheld Android tablets running in high-pace kitchen and dining environments.

- **Ergonomic Touch Boundaries:** On coarse touch pointers, every interactive button, tab, and stepper satisfies a strict minimum 44×44px hit boundary. Compact badges utilize `.touch-target` pseudo-elements to expand touch area without diluting layout density.
- **Spatial Rhythm:** Multiples of 4px and 8px (`8px`, `12px`, `16px`, `24px`, `32px`). Container cards maintain an internal padding of `16px` (`p-4`), scaling down to `12px` (`p-3`) on mobile compact sheets.
- **Safe-Area Insets:** Dynamic support for `--sat`, `--sar`, `--sab`, `--sal` (`env(safe-area-inset-*)`) ensures flawless rendering on notched mobile devices and edge-to-edge Android tablets.
- **Density Control:** High-density live status grids with sticky header navigation, scrollable item lists, and prominent bottom-anchored action drawers.

### Named Rules
**The Miss-Proof Touch Rule.** In active service environments, hands may be wet, rushed, or gloved. No interactive element may be rendered with a hit area smaller than 44×44px on touchscreens.

## Elevation & Depth

Rather than relying on heavy, opaque drop shadows that muddy dark themes, Vyoma conveys elevation through luminous glassmorphism, translucent boundary strokes, and ambient gold halos.

### Shadow & Depth Vocabulary
- **Base Substrate:** Pure flat `#000000` canvas at rest.
- **Glass Panel (`.glass-panel`):** `background: rgba(10, 10, 14, 0.78); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08)`. Used for navigation headers, drawers, and overlay sheets.
- **Glass Card (`.glass-card`):** `background: rgba(13, 14, 20, 0.82); backdrop-filter: blur(14px); border: 1px solid rgba(255, 255, 255, 0.07)`. Used for KDS order tiles and table status cards.
- **Luxury Card (`.luxury-card`):** `background: linear-gradient(180deg, rgba(16, 17, 24, 0.95) 0%, rgba(9, 10, 14, 0.98) 100%); border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.6)`. Used for primary VIP order cards and settlement summaries.
- **Gold Glow (`.gold-glow`):** `box-shadow: 0 0 20px rgba(197, 160, 89, 0.18)`. Applied to active order cards, primary CTA buttons, and highlighted tokens.
- **Gold Focus Aura (`--color-ring`):** `box-shadow: 0 0 0 2px rgba(197, 160, 89, 0.75); outline-offset: 2px`. Applied on keyboard focus and active touch states.

### Named Rules
**The Luminous Glass Rule.** Surfaces achieve depth via translucency, backdrop blurring, and whisper-thin white borders (8% opacity), never via muddy gray dropshadows. Shadows exist only as luminous ambient halos responding to user state.

## Shapes

Vyoma employs a crisp, geometric form language softened by refined border radii that mirror modern luxury hardware.

- **Small Radius (6px / 8px):** Stepper buttons, quantity selectors, secondary chips (`rounded-md` / `rounded-lg`).
- **Standard Card Radius (12px):** Order cards, table tiles, menu item listings (`rounded-xl`).
- **Container / Sheet Radius (16px):** Dialog modals, slide-over order builder sheets, drawer corners (`rounded-2xl`).
- **Pill Radius (9999px):** Status badges, channel indicators, token pills, and scrollbar thumbs (`rounded-full`).

### Named Rules
**The Capsule Status Rule.** Status indicators and dining channel markers must always take the form of full pills (`rounded-full`) with semi-transparent tinted fills, instantly distinguishing functional metadata from rectangular structural cards.

## Components

### Buttons
- **Primary Action Button:** Solid Imperial Gold background (`#C5A059`), pure pitch black text (`#000000`), bold uppercase tracking (`tracking-[0.25em]`), rounded-xl (12px), minimum height 44px, subtle gold glow shadow (`0 0 20px rgba(197, 160, 89, 0.2)`), active state scale `0.95`.
- **Outline / Ghost Button:** Transparent background, whisper white border (`rgba(255, 255, 255, 0.15)`), white/80 text, hover border shift to `primary/40` and gold text, minimum height 44px.
- **Secondary / Segment Button:** Dark slate onyx (`#14161F`), light gray text (`#F3F4F6`), subtle border, active state highlight.
- **Micro-Stepper Controls (`+` / `-`):** 36×36px visual button with `.touch-target` expanding hit boundary to 44×44px, dark glass background, crisp white symbol.

### Cards & Tiles
- **Order Card (`OrderCard`):** Modular glass card featuring token header, channel badge pill, customer info with one-tap phone copy, segmented order items list with quantity chips, notes highlight container, and bottom bar with large serif total (`₹`) and dual primary actions.
- **Table Status Tile (`TableStatusGrid`):** Responsive grid card showing table code in serif, seating capacity stepper, elapsed occupancy timer with color-coded alerts, active guest count, and immediate "Take Order" / "Occupy" action trigger.

### Inputs & Selects
- **Form Input / Search:** Dark glass well with 8% white border, gold caret (`caret-[#C5A059]`), white placeholder text at 40% opacity, transitioning to gold ring focus aura on activation. Minimum height 44px.

### Navigation & Segmented Tabs
- **Segment Filters (`All`, `Dine-In`, `Takeaway`):** Dark container with pill/rounded triggers. Active tab illuminates with gold border or solid white text and gold underline; inactive tabs recede into `white/60`.

### Signature Component: Live KDS Token Tile
- High-visibility order token indicator featuring bold monospaced token number (`#104`), glowing channel badge, pulse animation on unaccepted tickets, and large 44px tactile action button (`Accept`, `Mark Ready`, `Serve`).

## Do's and Don'ts

### Do:
- **Do** maintain a strict 44×44px touch target on all interactive controls when viewed on tablets or mobile devices.
- **Do** use `JetBrains Mono` with tabular numbers for all prices, quantities, table codes, and elapsed timers.
- **Do** reserve `Cormorant Garamond` for prominent headlines, dialog titles, and brand statements.
- **Do** keep background canvases completely black (`#000000`) for maximum contrast and OLED battery efficiency.
- **Do** use `.touch-target` to preserve dense visual layouts while honoring accessibility tap standards.
- **Do** provide immediate tactile feedback (`active:scale-95`, `touch-action: manipulation`) on all buttons.

### Don't:
- **Don't** use Imperial Gold (`#C5A059`) for background washes, body copy, or more than 10% of any viewport.
- **Don't** use standard opaque gray drop shadows; use backdrop blur and 8% white borders for elevation.
- **Don't** introduce bright pastel or neon colors outside of established functional status colors (Emerald, Amber, Sky, Violet, Crimson).
- **Don't** display raw, unformatted phone numbers without copy affordances or privacy protection options.
- **Don't** use serif typography for micro-labels, dense spreadsheets, or form input fields.
- **Don't** allow double-tap zoom delays on touch terminals; always apply `touch-action: manipulation`.
