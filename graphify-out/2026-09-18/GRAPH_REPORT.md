# Graph Report - .  (2026-09-18)

## Corpus Check
- 195 files · ~140,958 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1149 nodes · 1887 edges · 92 communities (59 shown, 33 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 135 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Invoices & Billing
- Invoices & Billing
- Captain Floor Operations
- Component Type
- Component Core
- Component Starter
- Express Server & API Routes
- Order Lifecycle & Sync
- Component Slides
- Component Type
- Component 101
- Component System
- Component Validator
- Component Ref
- Component Core
- Component Components
- Component Slide
- Component Tailwindconfiggenerator
- Component Main
- Component Background
- Component Generate
- Component Type
- Component 104
- Component Designsystemgenerator
- Component Dark
- Component Main
- Component Generate
- Component Shadcninstaller
- Component Gen
- Component Dark
- Android Capacitor Integration
- Component Generate
- Component Type
- Component Fast
- Component Path
- Component Tokens
- Order Lifecycle & Sync
- Component Errorboundary
- Component 203
- Component 156
- Order Lifecycle & Sync
- WhatsApp Notification Bot
- Component Type
- Component Type
- Android Capacitor Integration
- Component Type
- Component Type
- Component Type
- Component Data
- Android Capacitor Integration
- Component Gradlew
- Supabase Client & Data Models
- Supabase Client & Data Models
- Express Server & API Routes
- Component Tokens
- Component Validator
- Component Add
- Component Path
- Component Search
- Component Mainactivity
- Component Vercel
- Component 124
- Component 147
- Component 158
- Component 195
- Component 205
- Component 240
- Component Root
- Component Run
- Component Empty
- Component Files
- Component Components
- Component 151
- Component 182
- Component 197
- Component 206
- Component 239
- Component Javascript
- Component 282
- Component React
- Component Vue
- Component Colors
- Android Capacitor Integration
- Order Lifecycle & Sync

## God Nodes (most connected - your core abstractions)
1. `TailwindConfigGenerator` - 57 edges
2. `cn()` - 37 edges
3. `TestTailwindConfigGenerator` - 35 edges
4. `ShadcnInstaller` - 33 edges
5. `DesignSystemGenerator` - 27 edges
6. `TestShadcnInstaller` - 26 edges
7. `color` - 15 edges
8. `getApiBaseUrl()` - 15 edges
9. `compilerOptions` - 15 edges
10. `Order` - 14 edges

## Surprising Connections (you probably didn't know these)
- `handler()` --calls--> `app`  [EXTRACTED]
  api/index.ts → server/app.ts
- `handler()` --calls--> `app`  [EXTRACTED]
  api/invoices.ts → server/app.ts
- `handler()` --calls--> `app`  [EXTRACTED]
  api/orders.ts → server/app.ts
- `handler()` --calls--> `app`  [EXTRACTED]
  api/webhooks/index.ts → server/app.ts
- `CardAction()` --calls--> `cn()`  [EXTRACTED]
  components/ui/card.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Communities (92 total, 33 thin omitted)

### Community 0 - "Invoices & Billing"
Cohesion: 0.07
Nodes (59): Badge(), badgeVariants, Button(), buttonVariants, Card(), CardAction(), CardContent(), CardDescription() (+51 more)

### Community 1 - "Invoices & Billing"
Cohesion: 0.06
Nodes (52): handler(), handler(), handler(), handler(), safeUUID(), sanitizeStatus(), handler(), app (+44 more)

### Community 2 - "Captain Floor Operations"
Cohesion: 0.07
Nodes (50): CaptainDashboard(), CaptainDashboardProps, DEFAULT_TABLES, OrderBuilderSheet(), OrderBuilderSheetProps, QUICK_INSTRUCTION_TAGS, ReadyOrdersBanner(), ReadyOrdersBannerProps (+42 more)

### Community 3 - "Component Type"
Cohesion: 0.05
Nodes (53): $type, $value, $type, $value, $type, $value, $type, $value (+45 more)

### Community 4 - "Component Core"
Cohesion: 0.06
Nodes (42): BM25, detect_domain(), get_cip_brief(), _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection (+34 more)

### Community 5 - "Component Starter"
Cohesion: 0.04
Nodes (48): $type, $value, background, destructive, destructive-foreground, foreground, muted, muted-foreground (+40 more)

### Community 6 - "Express Server & API Routes"
Cohesion: 0.07
Nodes (28): BM25, detect_domain(), _domain_keywords(), _get_bm25(), _load_csv(), _load_product_keywords(), _normalize(), Apply synonym substitution before tokenizing. (+20 more)

### Community 7 - "Order Lifecycle & Sync"
Cohesion: 0.06
Nodes (45): $type, $value, $type, $value, bg, fg, font-size, hover-bg (+37 more)

### Community 8 - "Component Slides"
Cohesion: 0.08
Nodes (36): format_context(), format_result(), main(), Format a single search result for display, Format contextual recommendations for display., BM25, calculate_pattern_break(), detect_domain() (+28 more)

### Community 9 - "Component Type"
Cohesion: 0.06
Nodes (34): $type, $value, $type, $value, $type, $value, $type, $value (+26 more)

### Community 10 - "Component 101"
Cohesion: 0.07
Nodes (15): Test adding colors multiple times., Test adding full color palette., Test adding custom spacing., Test TailwindConfigGenerator class., Test that adding same plugin twice doesn't duplicate., Test plugin recommendations for Next.js., Test initialization with default settings., Test generating config with custom colors. (+7 more)

### Community 11 - "Component System"
Cohesion: 0.10
Nodes (25): ansi_ljust(), _detect_page_type(), format_ascii_box(), format_markdown(), format_master_md(), format_page_override_md(), generate_design_system(), _generate_intelligent_overrides() (+17 more)

### Community 12 - "Component Validator"
Cohesion: 0.14
Nodes (24): get_context(), is_allowed_exception(), is_allowed_rgba(), is_inside_block(), load_css_variables(), main(), print_result(), print_summary() (+16 more)

### Community 13 - "Component Ref"
Cohesion: 0.08
Nodes (25): ./*, DOM, DOM.Iterable, ES2022, ./lib/*, node, ./src/lib/*, vite/client (+17 more)

### Community 14 - "Component Core"
Cohesion: 0.11
Nodes (19): BM25, detect_domain(), _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection, Search across all domains and combine results (+11 more)

### Community 15 - "Component Components"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 16 - "Component Slide"
Cohesion: 0.15
Nodes (19): _e(), generate_chart_slide(), generate_cta_slide(), generate_deck(), generate_metrics_slide(), generate_problem_slide(), generate_solution_slide(), generate_testimonial_slide() (+11 more)

### Community 17 - "Component Tailwindconfiggenerator"
Cohesion: 0.10
Nodes (11): Generate Tailwind CSS configuration files., Add full color palette (50-950 shades) for a base color.          Args:, TailwindConfigGenerator, Test adding custom fonts., Test validating valid configuration., Test generating complete TypeScript configuration., Test initialization with different frameworks., Test default output path for TypeScript. (+3 more)

### Community 18 - "Component Main"
Cohesion: 0.11
Nodes (10): main(), Add custom font families.          Args:             fonts: Dict of font_type: [, Add custom spacing values.          Args:             spacing: Dict of name: val, Add custom breakpoints.          Args:             breakpoints: Dict of name: wi, Add plugin requirements.          Args:             plugins: List of plugin name, Get plugin recommendations based on configuration.          Returns:, Generate configuration file content.          Returns:             Configuration, Write configuration to file.          Returns:             Tuple of (success, me (+2 more)

### Community 19 - "Component Background"
Cohesion: 0.17
Nodes (17): generate_css_for_background(), get_background_image(), get_curated_images(), get_overlay_css(), get_pexels_search_url(), load_backgrounds_config(), load_brand_colors(), main() (+9 more)

### Community 20 - "Component Generate"
Cohesion: 0.20
Nodes (15): apply_color(), apply_viewbox_size(), extract_svgs(), generate_batch(), generate_icon(), generate_sizes(), load_env(), main() (+7 more)

### Community 21 - "Component Type"
Cohesion: 0.12
Nodes (16): $type, $value, $type, $value, $type, $value, $type, $value (+8 more)

### Community 22 - "Component 104"
Cohesion: 0.12
Nodes (9): Test adding components without shadcn config., Test adding components that are already installed., Test ShadcnInstaller class., Test adding all components in dry run mode., Create temporary project structure., Test successful addition of all components., Test listing installed components when none exist., Test checking for non-existent shadcn config. (+1 more)

### Community 23 - "Component Designsystemgenerator"
Cohesion: 0.16
Nodes (8): DesignSystemGenerator, Generates design system recommendations from aggregated searches., Load reasoning rules from CSV., Execute searches across multiple domains., Find matching reasoning rule for a category., Apply reasoning rules to search results., Extract results list from search result dict., TestReasoningMatch

### Community 24 - "Component Dark"
Cohesion: 0.17
Nodes (7): _palette_is_dark(), WCAG relative luminance of a #RRGGBB string, or None if unparseable., True when a colors.csv row's Background is a dark surface., _relative_luminance(), The exact reproduction from issue #428., TestEndToEndCoherence, TestLuminance

### Community 25 - "Component Main"
Cohesion: 0.22
Nodes (7): main(), Add all available shadcn/ui components.          Args:             overwrite: If, List installed components.          Returns:             Tuple of (success, mess, Check if shadcn is initialized in project.          Returns:             True if, Get list of already installed components.          Returns:             List of, Read shadcn version from project package.json; fall back to a pinned default., Add shadcn/ui components.          Args:             components: List of compone

### Community 26 - "Component Generate"
Cohesion: 0.19
Nodes (7): _filter_anti_patterns_for_mode(), Drop "avoid dark mode" advice once dark mode is the resolved answer., Select best matching result based on priority keywords., Generate complete design system recommendation.          variance/motion/density, Bucket a 1-10 dial value into its tier config. Returns None if value is None., _resolve_dial(), TestAntiPatternGating

### Community 27 - "Component Shadcninstaller"
Cohesion: 0.17
Nodes (7): Handle shadcn/ui component installation., ShadcnInstaller, Test component addition with subprocess error., Test listing installed components when they exist., Test initialization with custom project root., Test checking for existing shadcn config., Test getting installed components without config.

### Community 28 - "Component Gen"
Cohesion: 0.20
Nodes (7): Tests for tailwind_config_gen.py, Reduce a generated TS/JS config to a bare assignable object so it can be     han, Regression guard for the missing-comma bug between the ``theme`` block and     `, The property preceding ``plugins`` must end with a comma (pure-Python         ch, The emitted config parses as valid JS via ``node --check``., _strip_to_object(), TestGeneratedConfigIsValidJs

### Community 29 - "Component Dark"
Cohesion: 0.24
Nodes (7): _query_wants_dark(), True when a styles.csv row describes itself as dark-first., True when the query explicitly asks for a dark theme., Resolve the mode the rest of the output has to agree with., _resolve_color_mode(), _style_is_dark_primary(), TestModeResolution

### Community 30 - "Android Capacitor Integration"
Cohesion: 0.22
Nodes (5): initializeCapacitorAdaptations(), setupWakeLock(), ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState

### Community 31 - "Component Generate"
Cohesion: 0.29
Nodes (9): enhance_prompt(), generate_batch(), generate_logo(), load_env(), main(), Enhance the logo prompt with style and industry modifiers, Generate a logo using Gemini models with image generation      Args:         asp, Generate multiple logo variants with different styles (+1 more)

### Community 32 - "Component Type"
Cohesion: 0.24
Nodes (10): $type, $value, $type, $value, primitive, radius, shadow, default (+2 more)

### Community 33 - "Component Fast"
Cohesion: 0.20
Nodes (10): fast, normal, slow, $type, $value, $type, $value, duration (+2 more)

### Community 34 - "Component Path"
Cohesion: 0.22
Nodes (6): Path, Initialize generator.          Args:             typescript: If True, generate ., Determine default output path., Create base configuration structure., Get default content paths for framework., Any

### Community 35 - "Component Tokens"
Cohesion: 0.28
Nodes (8): Path, Regression tests for validate-tokens.cjs.  The validator used to skip any line c, A hardcoded hex on the same line as a var() token is still a violation., A line that references only tokens produces no false positives., _run(), test_flags_hardcoded_hex_sharing_line_with_token(), test_token_only_line_reports_no_violation(), CompletedProcess

### Community 36 - "Order Lifecycle & Sync"
Cohesion: 0.28
Nodes (7): dispatchOrderStatus(), DispatchOrderStatusParams, DispatchResult, DynoMappedStatus, getEnvVar(), mapStatusToDyno(), OrderStatus

### Community 37 - "Component Errorboundary"
Cohesion: 0.22
Nodes (3): ErrorBoundary, Props, State

### Community 38 - "Component 203"
Cohesion: 0.29
Nodes (4): Generate TypeScript configuration., Generate JavaScript configuration., Format plugins array for config.          Validates each plugin name against a s, Add indentation to JSON string.

### Community 39 - "Component 156"
Cohesion: 0.43
Nodes (3): Pick the highest-ranked palette matching the resolved mode.      Only the dark c, _select_palette_for_mode(), TestPaletteSelection

### Community 40 - "Order Lifecycle & Sync"
Cohesion: 0.33
Nodes (3): DynoCustomer, DynoItem, NormalizedDynoOrder

### Community 42 - "Component Type"
Cohesion: 0.60
Nodes (5): lg, $type, $value, lg, lg

### Community 43 - "Component Type"
Cohesion: 0.60
Nodes (5): sm, sm, sm, $type, $value

### Community 44 - "Android Capacitor Integration"
Cohesion: 0.60
Nodes (3): ExampleInstrumentedTest, Test, RunWith

### Community 45 - "Component Type"
Cohesion: 0.67
Nodes (4): xl, xl, $type, $value

### Community 46 - "Component Type"
Cohesion: 0.67
Nodes (4): $type, $value, md, md

### Community 47 - "Component Type"
Cohesion: 0.67
Nodes (4): $type, $value, none, none

### Community 48 - "Component Data"
Cohesion: 0.83
Nodes (3): _check_file(), main(), _read_rows()

### Community 50 - "Component Gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 51 - "Supabase Client & Data Models"
Cohesion: 0.83
Nodes (3): formatIST(), getSupabaseClient(), handler()

### Community 52 - "Supabase Client & Data Models"
Cohesion: 0.83
Nodes (3): formatIST(), getSupabaseClient(), handler()

## Knowledge Gaps
- **175 isolated node(s):** `$schema`, `$value`, `$type`, `$value`, `$type` (+170 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `primitive` connect `Component Type` to `Component Fast`, `Component Type`, `Component Starter`, `Component Type`, `Component Type`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `color` connect `Component Type` to `Component Type`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `WhatsAppBotService` connect `WhatsApp Notification Bot` to `Invoices & Billing`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 36 inferred relationships involving `TailwindConfigGenerator` (e.g. with `TestGeneratedConfigIsValidJs` and `.test_node_check_parses_generated_config()`) actually correct?**
  _`TailwindConfigGenerator` has 36 INFERRED edges - model-reasoned connections that need verification._
- **Are the 23 inferred relationships involving `ShadcnInstaller` (e.g. with `TestShadcnInstaller` and `.test_add_all_components_dry_run()`) actually correct?**
  _`ShadcnInstaller` has 23 INFERRED edges - model-reasoned connections that need verification._
- **Are the 16 inferred relationships involving `DesignSystemGenerator` (e.g. with `TestDomainDetection` and `TestPersistence`) actually correct?**
  _`DesignSystemGenerator` has 16 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `$value`, `$type` to the rest of the system?**
  _175 weakly-connected nodes found - possible documentation gaps or missing edges._