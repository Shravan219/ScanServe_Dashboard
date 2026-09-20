# Graph Report - ScanServe_Dashboard-main  (2026-09-19)

## Corpus Check
- 189 files · ~161,266 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 81 file(s) not represented in the graph (top: .csv 51, .xml 11, (none) 4)

## Summary
- 2661 nodes · 3685 edges · 193 communities (149 shown, 44 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a60d8f46`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- orderStore.ts
- CaptainDashboard.tsx
- gray
- cip/core.py
- color
- scripts/core.py
- card
- slide_search_core.py
- spacing
- TestTailwindConfigGenerator
- design_system.py
- html-token-validator.py
- compilerOptions
- logo/core.py
- components.json
- generate-slide.py
- .test_validate_config_valid
- TailwindConfigGenerator
- fetch-background.py
- icon/generate.py
- fontSize
- TestShadcnInstaller
- .generate
- _palette_is_dark
- .check_shadcn_config
- _filter_anti_patterns_for_mode
- .test_add_all_components_success
- TestGeneratedConfigIsValidJs
- test_design_system_mode.py
- ErrorBoundary
- dependencies
- Tailwind CSS Utility Reference
- primitive
- ._base_config
- pathlib
- lib/dispatch-status.ts
- ErrorBoundary
- .generate_config_string
- _select_palette_for_mode
- lib/dyno-adapter.ts
- react
- Brand Guidelines v1.0
- Design
- ExampleInstrumentedTest.java
- Canvas Design System
- Prerequisites
- Form & Input Components
- package.json
- Color Semantics
- gradlew
- cip/generate.py
- app.json
- electron.cjs
- extract-colors.cjs
- validate-asset.cjs
- ShadcnInstaller
- .__init__
- Tailwind CSS Responsive Design
- MainActivity.java
- vercel.json
- ref_path
- .test_add_components_dry_run
- 1. AGENT SWARM TOPOLOGY & PERSONA ROLES
- Token Architecture
- DesignSystemGenerator
- .test_list_installed_no_config
- .test_init_default_project_root
- Primitive Tokens
- validate-tokens.cjs
- .test_get_installed_components_with_files
- devDependencies
- .test_add_breakpoints
- .test_recommend_plugins
- .test_generate_typescript_config
- scripts
- Brand
- .test_init_javascript
- inject-brand-context.cjs
- embed-tokens.cjs
- Component Tokens
- .test_add_colors
- capacitor.config.ts
- vite.config.ts
- dotenv
- generate-tokens.cjs
- Typography Specifications
- Logo Usage Rules
- Component Specifications
- shadcn/ui Accessibility Patterns
- Design System: Vyoma ScanServe
- Asset Approval Checklist
- Logo AI Prompt Engineering
- Color Palette Management
- CIP Deliverable Guide
- States and Variants
- UI Styling Skill
- Workflow
- Design System
- Tailwind CSS Customization
- ServerConnectionModal.tsx
- Routing by Task Type
- shadcn/ui Theming & Customization
- whatsapp.ts
- Asset Organization Guide
- Primary Color Meanings
- Core Logo Types
- Brand Consistency Checklist
- CIP Mockup Prompt Engineering
- BM25
- Design System Master File
- Design Principles
- Design Principles
- CIP Design Reference
- Icon Design Reference
- Copywriting Formulas
- sync-brand-to-tokens.cjs
- Copywriting Formulas
- Banner Design - Multi-Format Creative Banner System
- Messaging Framework
- Brand Voice Framework
- Layout Patterns
- Tailwind Integration
- Layout Patterns
- update.md
- Logo Design Reference
- Core Visual Elements
- CIP Design Style Guide
- SimulateOrderModal.tsx
- Slide Strategies
- Slide Strategies
- soundService
- Slides Reference
- HTML Slide Template
- HTML Slide Template
- test_core.py
- BM25
- Slides
- Brand Guidelines Template
- radius
- Vyoma - Dashboard
- build
- shadow
- lg
- graphify.md
- slides-create.md
- graphify/SKILL.md
- create.md
- compilerOptions
- main.tsx
- none
- ._apply_reasoning
- .test_add_components_no_config
- .test_list_installed_with_components
- .test_init_custom_project_root
- .test_check_shadcn_config_exists
- .test_check_shadcn_config_not_exists
- .test_get_installed_components_no_config
- .test_add_colors_multiple_times
- .test_add_plugins_no_duplicates
- .test_recommend_plugins_nextjs
- .test_init_default_typescript
- .test_generate_config_with_colors
- .test_write_config_creates_content
- .test_full_configuration_typescript
- .test_init_framework
- .test_custom_output_path
- button
- input
- authService.ts
- semantic
- Vyompos
- $type
- radius
- padding-y
- xl
- 3
- 4
- 5
- 8
- destructive
- foreground
- muted-foreground
- primary
- secondary
- secondary-foreground
- dist_server

## God Nodes (most connected - your core abstractions)
1. `TailwindConfigGenerator` - 58 edges
2. `cn()` - 37 edges
3. `TestTailwindConfigGenerator` - 35 edges
4. `ShadcnInstaller` - 34 edges
5. `TestShadcnInstaller` - 26 edges
6. `react` - 25 edges
7. `DesignSystemGenerator` - 21 edges
8. `lucide-react` - 20 edges
9. `MenuItem` - 17 edges
10. `UI Styling Skill` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Interaction (App)` --references--> `Button()`  [INFERRED]
  .agents/skills/ui-ux-pro-max/SKILL.md → components/ui/button.tsx
- `5. SYSTEM CONSTRAINTS, FRICTION POINTS & EFFICIENCY VECTORS` --references--> `MenuItem`  [INFERRED]
  REALITY_SEED.md → src/types.ts
- `Cards & Tiles` --references--> `OrderCard()`  [INFERRED]
  DESIGN.md → src/App.tsx
- `Cards & Tiles` --references--> `TableStatusGrid()`  [INFERRED]
  DESIGN.md → src/components/captain/TableStatusGrid.tsx
- `3.1 Core Entity Definitions` --references--> `RestaurantTable`  [INFERRED]
  REALITY_SEED.md → src/types.ts

## Import Cycles
- None detected.

## Communities (193 total, 44 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.12
Nodes (27): Card(), CardAction(), CardContent(), CardDescription(), CardFooter(), CardHeader(), CardTitle(), DialogOverlay() (+19 more)

### Community 1 - "orderStore.ts"
Cohesion: 0.06
Nodes (57): handler(), handler(), handler(), formatIST(), getSupabaseClient(), handler(), handler(), safeUUID() (+49 more)

### Community 2 - "CaptainDashboard.tsx"
Cohesion: 0.12
Nodes (33): 4.1 Floor Service (Dine-In) State Machine, ref_motion_react, A. Front-of-House (Floor Staff), CaptainDashboard(), CaptainDashboardProps, DEFAULT_TABLES, OrderBuilderSheet(), OrderBuilderSheetProps (+25 more)

### Community 3 - "gray"
Cohesion: 0.05
Nodes (53): $type, $value, $type, $value, $type, $value, $type, $value (+45 more)

### Community 4 - "cip/core.py"
Cohesion: 0.10
Nodes (30): detect_domain(), get_cip_brief(), _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection, Search across all domains and combine results (+22 more)

### Community 5 - "color"
Cohesion: 0.10
Nodes (20): $type, $value, background, destructive-foreground, muted, primary-foreground, primary-hover, ring (+12 more)

### Community 6 - "scripts/core.py"
Cohesion: 0.16
Nodes (15): _domain_keywords(), _load_csv(), _load_product_keywords(), Load CSV and return list of dicts, with mtime-based caching., Core search function using BM25. Returns (results, bm25_or_none)., Nearest known vocabulary terms for a query that returned 0 hits, so the caller…, UI/UX Pro Max Core - BM25 search engine for UI/UX style guides, Search stack-specific guidelines (+7 more)

### Community 7 - "card"
Cohesion: 0.20
Nodes (12): $type, $value, bg, bg, padding, shadow, card, bg (+4 more)

### Community 8 - "slide_search_core.py"
Cohesion: 0.08
Nodes (38): format_context(), format_result(), main(), Format a single search result for display, Slide Search CLI - Search slide design databases for strategies, layouts, copy,…, Format contextual recommendations for display., BM25, calculate_pattern_break() (+30 more)

### Community 9 - "spacing"
Cohesion: 0.09
Nodes (22): $type, $value, $type, $value, $type, $value, $type, $value (+14 more)

### Community 10 - "TestTailwindConfigGenerator"
Cohesion: 0.07
Nodes (15): Test adding full color palette., Test adding custom fonts., Test adding custom spacing., Test TailwindConfigGenerator class., Test generating JavaScript configuration., Test validating config with empty theme extensions., Test writing configuration to file., Test writing config to invalid path. (+7 more)

### Community 11 - "design_system.py"
Cohesion: 0.08
Nodes (31): main(), Tailwind CSS Configuration Generator Generate tailwind.config.js/ts with custom…, ansi_ljust(), _detect_page_type(), format_ascii_box(), format_master_md(), format_page_override_md(), _generate_intelligent_overrides() (+23 more)

### Community 12 - "html-token-validator.py"
Cohesion: 0.12
Nodes (25): get_context(), is_allowed_exception(), is_allowed_rgba(), is_inside_block(), load_css_variables(), main(), print_result(), print_summary() (+17 more)

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module, moduleDetection (+10 more)

### Community 14 - "logo/core.py"
Cohesion: 0.15
Nodes (17): detect_domain(), _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection, Search across all domains and combine results, Logo Design Core - BM25 search engine for logo design guidelines (+9 more)

### Community 15 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 16 - "generate-slide.py"
Cohesion: 0.13
Nodes (21): _e(), generate_chart_slide(), generate_cta_slide(), generate_deck(), generate_metrics_slide(), generate_problem_slide(), generate_solution_slide(), generate_testimonial_slide() (+13 more)

### Community 18 - "TailwindConfigGenerator"
Cohesion: 0.08
Nodes (13): Add custom font families. Args: fonts: Dict of font_type: [font_names] e.g.,…, Add custom spacing values. Args: spacing: Dict of name: value e.g., {'18':…, Add custom breakpoints. Args: breakpoints: Dict of name: width e.g., {'3xl':…, Add plugin requirements. Args: plugins: List of plugin names e.g.,…, Get plugin recommendations based on configuration. Returns: List of recommended…, Generate Tailwind CSS configuration files., Validate configuration. Returns: Tuple of (valid, message), Add custom colors to theme. Args: colors: Dict of color_name: color_value Value… (+5 more)

### Community 19 - "fetch-background.py"
Cohesion: 0.16
Nodes (18): generate_css_for_background(), get_background_image(), get_curated_images(), get_overlay_css(), get_pexels_search_url(), load_backgrounds_config(), load_brand_colors(), main() (+10 more)

### Community 20 - "icon/generate.py"
Cohesion: 0.09
Nodes (32): apply_color(), apply_viewbox_size(), extract_svgs(), generate_batch(), generate_icon(), generate_sizes(), load_env(), main() (+24 more)

### Community 21 - "fontSize"
Cohesion: 0.12
Nodes (16): $type, $value, $type, $value, $type, $value, $type, $value (+8 more)

### Community 22 - "TestShadcnInstaller"
Cohesion: 0.12
Nodes (10): Test adding components that are already installed., Test ShadcnInstaller class., Test adding all components without config., Test adding all components in dry run mode., Create temporary project structure., Test initialization with dry run mode., Test getting installed components when none exist., Test adding components with empty list. (+2 more)

### Community 23 - ".generate"
Cohesion: 0.20
Nodes (6): Execute searches across multiple domains., Select best matching result based on priority keywords., Extract results list from search result dict., Generate complete design system recommendation. variance/motion/density are…, Bucket a 1-10 dial value into its tier config. Returns None if value is None., _resolve_dial()

### Community 24 - "_palette_is_dark"
Cohesion: 0.27
Nodes (5): _palette_is_dark(), WCAG relative luminance of a #RRGGBB string, or None if unparseable., True when a colors.csv row's Background is a dark surface., _relative_luminance(), TestLuminance

### Community 25 - ".check_shadcn_config"
Cohesion: 0.21
Nodes (6): Add all available shadcn/ui components. Args: overwrite: If True, overwrite…, List installed components. Returns: Tuple of (success, message with component…, Check if shadcn is initialized in project. Returns: True if components.json…, Get list of already installed components. Returns: List of installed component…, Read shadcn version from project package.json; fall back to a pinned default., Add shadcn/ui components. Args: components: List of component names to add…

### Community 26 - "_filter_anti_patterns_for_mode"
Cohesion: 0.43
Nodes (3): _filter_anti_patterns_for_mode(), Drop "avoid dark mode" advice once dark mode is the resolved answer., TestAntiPatternGating

### Community 27 - ".test_add_all_components_success"
Cohesion: 0.22
Nodes (5): Test successful component addition., Test component addition with subprocess error., Test component addition when npx is not found., Test successful addition of all components., patch

### Community 28 - "TestGeneratedConfigIsValidJs"
Cohesion: 0.25
Nodes (7): Reduce a generated TS/JS config to a bare assignable object so it can be handed…, Regression guard for the missing-comma bug between the ``theme`` block and…, The property preceding ``plugins`` must end with a comma (pure-Python check, so…, The emitted config parses as valid JS via ``node --check``., _strip_to_object(), TestGeneratedConfigIsValidJs, parametrize

### Community 29 - "test_design_system_mode.py"
Cohesion: 0.21
Nodes (9): _query_wants_dark(), True when a styles.csv row describes itself as dark-first., True when the query explicitly asks for a dark theme., Resolve the mode the rest of the output has to agree with., _resolve_color_mode(), _style_is_dark_primary(), Regression tests for color-mode coherence in design_system.py (issue #428).…, TestModeResolution (+1 more)

### Community 31 - "dependencies"
Cohesion: 0.05
Nodes (38): dependencies, @base-ui/react, @capacitor/android, @capacitor/app, @capacitor/core, @capacitor/keyboard, @capacitor/screen-orientation, @capacitor/status-bar (+30 more)

### Community 32 - "Tailwind CSS Utility Reference"
Cohesion: 0.05
Nodes (43): Arbitrary Values, Aspect Ratio, Background Colors, Border Color, Border Radius, Border Style, Border Width, Borders (+35 more)

### Community 33 - "primitive"
Cohesion: 0.14
Nodes (13): dark, fast, normal, slow, $type, $value, $type, $value (+5 more)

### Community 34 - "._base_config"
Cohesion: 0.22
Nodes (6): Path, Initialize generator. Args: typescript: If True, generate .ts config, else .js…, Determine default output path., Create base configuration structure., Get default content paths for framework., Any

### Community 35 - "pathlib"
Cohesion: 0.13
Nodes (17): Regression test for sync-brand-to-tokens.cjs. The color parser required a…, main(), Slide Token Validator (Legacy Wrapper) Now delegates to html-token-validator.py…, Delegate to unified html-token-validator.py with --type slides., Path, Regression tests for validate-tokens.cjs. The validator used to skip any line…, A hardcoded hex on the same line as a var() token is still a violation., A line that references only tokens produces no false positives. (+9 more)

### Community 36 - "lib/dispatch-status.ts"
Cohesion: 0.28
Nodes (7): dispatchOrderStatus(), DispatchOrderStatusParams, DispatchResult, DynoMappedStatus, getEnvVar(), mapStatusToDyno(), OrderStatus

### Community 37 - "ErrorBoundary"
Cohesion: 0.22
Nodes (3): ErrorBoundary, Props, State

### Community 38 - ".generate_config_string"
Cohesion: 0.20
Nodes (6): Generate configuration file content. Returns: Configuration file as string, Generate TypeScript configuration., Generate JavaScript configuration., Format plugins array for config. Validates each plugin name against a strict…, Add indentation to JSON string., Write configuration to file. Returns: Tuple of (success, message)

### Community 39 - "_select_palette_for_mode"
Cohesion: 0.43
Nodes (3): Pick the highest-ranked palette matching the resolved mode. Only the dark case…, _select_palette_for_mode(), TestPaletteSelection

### Community 40 - "lib/dyno-adapter.ts"
Cohesion: 0.33
Nodes (3): DynoCustomer, DynoItem, NormalizedDynoOrder

### Community 41 - "react"
Cohesion: 0.13
Nodes (27): Button(), buttonVariants, Dialog(), DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogTitle() (+19 more)

### Community 42 - "Brand Guidelines v1.0"
Cohesion: 0.05
Nodes (37): 1. Color Palette, 2. Typography, 3. Logo Usage, 4. Voice & Tone, 5. Imagery Guidelines, 6. Design Components, Accessibility, AI Image Generation (+29 more)

### Community 43 - "Design"
Cohesion: 0.06
Nodes (35): Banner Design (Built-in), Banner: Design Rules, Banner: Quick Size Reference, Banner: Top Art Styles, Banner: Workflow, CIP Design (Built-in), CIP: Generate Brief, CIP: Generate Mockups (+27 more)

### Community 44 - "ExampleInstrumentedTest.java"
Cohesion: 0.24
Nodes (8): ExampleInstrumentedTest, ExampleUnitTest, androidx.test.ext.junit.runners.AndroidJUnit4, assert, context, instrumentationregistry, org.junit.runner.RunWith, org.junit.Test

### Community 45 - "Canvas Design System"
Cohesion: 0.06
Nodes (35): 1. Visual Communication First, 2. Minimal Text Integration, 3. Expert Craftsmanship, 4. Systematic Patterns, Analog Meditation, Approach, Canvas Boundaries, Canvas Design System (+27 more)

### Community 46 - "Prerequisites"
Cohesion: 0.06
Nodes (33): Accessibility, Available Domains, Available Stacks, Common Rules for Professional UI, Common Sticking Points, Example Workflow, How to Use This Skill, Icons & Visual Elements (+25 more)

### Community 47 - "Form & Input Components"
Cohesion: 0.06
Nodes (32): Accordion, Alert, Alert Dialog, Avatar, Badge, Button, Card, Checkbox (+24 more)

### Community 48 - "package.json"
Cohesion: 0.06
Nodes (35): main, name, private, type, version, autoprefixer, @base-ui/react, @capacitor/android (+27 more)

### Community 49 - "Color Semantics"
Cohesion: 0.11
Nodes (17): Accent, Applying Semantic Tokens, Background & Foreground, Border & Ring, Color Semantics, Dark Mode Overrides, Destructive, Interactive States (+9 more)

### Community 50 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 51 - "cip/generate.py"
Cohesion: 0.21
Nodes (14): build_cip_prompt(), check_logo_required(), generate_cip_set(), generate_with_nano_banana(), load_env(), load_logo_image(), main(), Generate image using Gemini Nano Banana (native image generation) Supports two… (+6 more)

### Community 52 - "app.json"
Cohesion: 0.09
Nodes (21): capabilities, cef, auto_install, dir, description, display_name, action, icons (+13 more)

### Community 53 - "electron.cjs"
Cohesion: 0.22
Nodes (7): c_users_anay0216_documents_coding_scanserve_dashboard_main_dist_server_cjs, c_users_anay0216_documents_coding_scanserve_dashboard_main_dist_server_startserver, { app, BrowserWindow }, { app, BrowserWindow, shell }, { startServer }, { startServer }, electron

### Community 54 - "extract-colors.cjs"
Cohesion: 0.22
Nodes (11): calculateCompliance(), colorDistance(), displayPalette(), extractHexColors(), findNearestBrandColor(), fs, generateImageMagickCommand(), hexToRgb() (+3 more)

### Community 55 - "validate-asset.cjs"
Cohesion: 0.25
Nodes (13): checkManifest(), formatBytes(), formatOutput(), fs, main(), parseFilename(), path, RULES (+5 more)

### Community 56 - "ShadcnInstaller"
Cohesion: 0.20
Nodes (8): main(), Handle shadcn/ui component installation., shadcn/ui Component Installer Add shadcn/ui components to project with…, ShadcnInstaller, Tests for shadcn_add.py, Test adding components with overwrite flag., Test listing installed components when none exist., unittest_mock

### Community 58 - "Tailwind CSS Responsive Design"
Cohesion: 0.06
Nodes (32): 1. Mobile-First Design, 2. Consistent Breakpoint Usage, 3. Test at Breakpoint Boundaries, 4. Use Container for Content Width, 5. Progressive Enhancement, 6. Avoid Too Many Breakpoints, Best Practices, Breakpoint System (+24 more)

### Community 61 - "ref_path"
Cohesion: 0.15
Nodes (9): ref_child_process, ref_fs, ref_path, adbPath, { execSync, spawn }, fs, path, whatsAppBot (+1 more)

### Community 63 - "1. AGENT SWARM TOPOLOGY & PERSONA ROLES"
Cohesion: 0.14
Nodes (13): 1. AGENT SWARM TOPOLOGY & PERSONA ROLES, 2. MULTI-PHASE PEAK-HOUR SCENARIOS, 3. EFFICIENCY METRICS & TELEMETRY REQUIREMENTS, 4. REPORT AGENT SYNTHESIS DIRECTIVES, B. Back-of-House (Culinary Operations), C. Cashier & Floor Management, D. Patron Swarm (Customers), E. Delivery Aggregator Fleet (+5 more)

### Community 64 - "Token Architecture"
Cohesion: 0.15
Nodes (12): Categories, Dark Mode, File Organization, Layer 1: Primitive Tokens, Layer 2: Semantic Tokens, Layer 3: Component Tokens, Layer Overview, Migration from Flat Tokens (+4 more)

### Community 65 - "DesignSystemGenerator"
Cohesion: 0.23
Nodes (6): DesignSystemGenerator, Generates design system recommendations from aggregated searches., Load reasoning rules from CSV., TestReasoningMatch, The exact reproduction from issue #428., TestEndToEndCoherence

### Community 68 - "Primitive Tokens"
Cohesion: 0.17
Nodes (11): Border Radius, Color Scales, Gray Scale, Motion / Duration, Primary Colors (Blue), Primitive Tokens, Shadows, Spacing Scale (+3 more)

### Community 69 - "validate-tokens.cjs"
Cohesion: 0.24
Nodes (11): extensions, formatReport(), fs, getFiles(), main(), parseArgs(), path, patterns (+3 more)

### Community 71 - "devDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, autoprefixer, @capacitor/cli, concurrently, cross-env, dotenv-cli, electron, electron-builder (+4 more)

### Community 75 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, apk:build, apk:devices, apk:install, build, cap:sync, clean, dev (+4 more)

### Community 76 - "Brand"
Cohesion: 0.05
Nodes (31): Brand, Brand Sync Workflow, Quick Start, References, Routing, Scripts, Subcommands, Templates (+23 more)

### Community 78 - "inject-brand-context.cjs"
Cohesion: 0.31
Nodes (10): extractColorsFromTable(), extractCoreAttributes(), extractHexColors(), extractImageStyle(), extractTypography(), extractVoice(), fs, generatePromptAddition() (+2 more)

### Community 79 - "embed-tokens.cjs"
Cohesion: 0.18
Nodes (8): args, fs, minimal, MINIMAL_TOKENS, path, projectRoot, tokensPath, wrapStyle

### Community 80 - "Component Tokens"
Cohesion: 0.20
Nodes (9): Alert Tokens, Badge Tokens, Button Tokens, Card Tokens, Component Tokens, Dialog/Modal Tokens, Input Tokens, Table Tokens (+1 more)

### Community 83 - "vite.config.ts"
Cohesion: 0.40
Nodes (3): @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 91 - "generate-tokens.cjs"
Cohesion: 0.36
Nodes (9): flattenTokens(), fs, generateCSS(), generateTailwind(), main(), parseArgs(), path, resolveReference() (+1 more)

### Community 92 - "Typography Specifications"
Cohesion: 0.06
Nodes (30): Accessibility, Base System, Best Practices, Clean & Modern, Common Font Pairings, Contrast Requirements, CSS Implementation, Editorial (+22 more)

### Community 93 - "Logo Usage Rules"
Cohesion: 0.07
Nodes (28): Absolute Don'ts, Approved Backgrounds, Before Using Logo, Clear Space, Co-branding, Color Rules, Color Usage, Color Variants (+20 more)

### Community 94 - "Component Specifications"
Cohesion: 0.07
Nodes (28): Alert, Anatomy, Anatomy, Anatomy, Anatomy, Anatomy, Badge, Button (+20 more)

### Community 95 - "shadcn/ui Accessibility Patterns"
Cohesion: 0.07
Nodes (28): Accordion, Alert, ARIA Labels, Checkbox and Radio, Color Contrast, Command Palette Navigation, Component-Specific Patterns, Dialog/Modal Navigation (+20 more)

### Community 96 - "Design System: Vyoma ScanServe"
Cohesion: 0.07
Nodes (27): Buttons, Cards & Tiles, Colors, Components, Design System: Vyoma ScanServe, Do:, Do's and Don'ts, Don't: (+19 more)

### Community 97 - "Asset Approval Checklist"
Cohesion: 0.08
Nodes (25): Accessibility, Archival, Asset Approval Checklist, Automation Support, Color Compliance, Common Issues & Fixes, Content Accessibility, Content Quality (+17 more)

### Community 98 - "Logo AI Prompt Engineering"
Cohesion: 0.08
Nodes (25): Common Pitfalls, Core Prompt Structure, Detailed Brief, Eco/Sustainable, Effective Keywords by Style, Fashion Brand, Healthcare, Industry-Specific Prompts (+17 more)

### Community 99 - "Color Palette Management"
Cohesion: 0.08
Nodes (24): Accessibility Requirements, Brand Compliance Validation, Checking Contrast, Color Documentation Format, Color Extraction, Color Palette Examples, Color Palette Management, Color System Structure (+16 more)

### Community 100 - "CIP Deliverable Guide"
Cohesion: 0.08
Nodes (24): Apparel, Business Card, Car/Sedan, CIP Deliverable Guide, Core Identity, Digital Assets, Email Signature, Envelope (+16 more)

### Community 101 - "States and Variants"
Cohesion: 0.08
Nodes (24): Accessibility, Accessibility Requirements, ARIA States, Color Contrast, Color Variants, Disabled States, Error Messages, Error States (+16 more)

### Community 102 - "UI Styling Skill"
Cohesion: 0.08
Nodes (24): Accessibility Patterns, Alternative: Tailwind-Only Setup, Best Practices, Common Patterns, Component Layer: shadcn/ui, Component Library Guide, Component + Styling Setup, Core Stack (+16 more)

### Community 103 - "Workflow"
Cohesion: 0.08
Nodes (23): Art Direction Styles (Reuse from Banner), Color & Contrast, Design Best Practices, HTML Design Rules, HTML Template Structure, Option A: Chrome Headless CLI (Recommended — zero dependencies), Option B: chrome-devtools skill, Option C: Playwright script (+15 more)

### Community 104 - "Design System"
Cohesion: 0.09
Nodes (22): Best Practices, Chart.js Integration, Command, Component Spec Pattern, Contextual Decision Flow, Decision System CSVs, Design System, Integration (+14 more)

### Community 105 - "Tailwind CSS Customization"
Cohesion: 0.09
Nodes (22): @apply Directive, Best Practices, Color Customization, Complete Tailwind Config, Configuration Examples, Content Configuration, Custom Color Palette, Custom Font Sizes (+14 more)

### Community 106 - "ServerConnectionModal.tsx"
Cohesion: 0.22
Nodes (16): Input(), ref_base_ui_react_input, @capacitor/core, getOrderPlatform(), OnlineOrdersView(), ServerConnectionModal(), ServerConnectionModalProps, getApiBaseUrl() (+8 more)

### Community 107 - "Routing by Task Type"
Cohesion: 0.10
Nodes (19): Banner Design Tasks, Brand Identity Tasks, Component Creation, Corporate Identity Program Tasks, Design Routing Guide, Design System Migration, Icon Design Tasks, Implementation Tasks (+11 more)

### Community 108 - "shadcn/ui Theming & Customization"
Cohesion: 0.08
Nodes (20): Base Color Presets, Best Practices, Color Customization, Color Format, Component Customization, CSS Variable System, Customize Styles, Customize Variants (+12 more)

### Community 109 - "whatsapp.ts"
Cohesion: 0.13
Nodes (24): jspdf, fs, generatePdf(), checkPageBreak(), drawHeaderFooter(), { jsPDF }, path, generateReceiptPdfBuffer() (+16 more)

### Community 110 - "Asset Organization Guide"
Cohesion: 0.11
Nodes (18): Asset Entry (manifest.json), Asset Organization Guide, By Campaign, By Status, By Type, Cleanup Workflow, Components, Directory Structure (+10 more)

### Community 111 - "Primary Color Meanings"
Cohesion: 0.11
Nodes (18): Accessibility Considerations, Analogous, Black, Blue, Color Combinations by Industry, Color Harmony Types, Complementary, Green (+10 more)

### Community 112 - "Core Logo Types"
Cohesion: 0.11
Nodes (18): 1. Wordmark (Logotype), 2. Lettermark (Monogram), 3. Pictorial Mark (Brand Mark), 4. Abstract Mark, 5. Mascot, 6. Emblem, 7. Combination Mark, Aesthetic Styles (+10 more)

### Community 113 - "Brand Consistency Checklist"
Cohesion: 0.11
Nodes (17): Audit Frequency, Brand Consistency Checklist, Channel Audit, Collateral, Colors, Common Issues, Email, Imagery (+9 more)

### Community 114 - "CIP Mockup Prompt Engineering"
Cohesion: 0.11
Nodes (17): Apparel (Polo/T-Shirt), Base Prompt Structure, Business Card, CIP Mockup Prompt Engineering, Context Modifiers, Corporate Minimal, Deliverable-Specific Modifiers, Letterhead (+9 more)

### Community 115 - "BM25"
Cohesion: 0.09
Nodes (16): BM25, BM25 ranking algorithm for text search, Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query, BM25, _get_bm25(), _normalize() (+8 more)

### Community 116 - "Design System Master File"
Cohesion: 0.12
Nodes (16): Additional Forbidden Patterns, Anti-Patterns (Do NOT Use), Buttons, Cards, Color Palette, Component Specs, Design System Master File, Global Rules (+8 more)

### Community 117 - "Design Principles"
Cohesion: 0.12
Nodes (15): 22 Art Direction Styles, Banner Sizes & Art Direction Styles Reference, Complete Banner Sizes, CTA Rules, Design Principles, Pinterest Research Queries, Print, Print Specs (+7 more)

### Community 118 - "Design Principles"
Cohesion: 0.12
Nodes (15): 22 Art Direction Styles, Banner Sizes & Art Direction Styles Reference, Complete Banner Sizes, CTA Rules, Design Principles, Pinterest Research Queries, Print, Print Specs (+7 more)

### Community 119 - "CIP Design Reference"
Cohesion: 0.13
Nodes (14): CIP Brief (Start Here), CIP Design Reference, Commands, Deliverable Categories, Design Styles, Detailed References, Generate Mockups, HTML Presentation Features (+6 more)

### Community 120 - "Icon Design Reference"
Cohesion: 0.13
Nodes (14): Available Styles, CLI Options, Commands, Generate Batch Variations, Generate Multiple Sizes, Generate Single Icon, Icon Categories, Icon Design Reference (+6 more)

### Community 121 - "Copywriting Formulas"
Cohesion: 0.13
Nodes (14): AIDA (Attention-Interest-Desire-Action), Before-After-Bridge, Contrast Patterns, Copywriting Formulas, Core Formulas, Cost of Inaction, FAB (Features-Advantages-Benefits), Formula-to-Slide Mapping (+6 more)

### Community 122 - "sync-brand-to-tokens.cjs"
Cohesion: 0.33
Nodes (8): adjustBrightness(), { execFileSync }, extractColorsFromMarkdown(), fs, generateColorScale(), main(), path, updateDesignTokens()

### Community 123 - "Copywriting Formulas"
Cohesion: 0.13
Nodes (14): AIDA (Attention-Interest-Desire-Action), Before-After-Bridge, Contrast Patterns, Copywriting Formulas, Core Formulas, Cost of Inaction, FAB (Features-Advantages-Benefits), Formula-to-Slide Mapping (+6 more)

### Community 124 - "Banner Design - Multi-Format Creative Banner System"
Cohesion: 0.14
Nodes (13): Art Direction Styles (Top 10), Banner Design - Multi-Format Creative Banner System, Banner Size Quick Reference, Design Rules, Prerequisites, Security, Step 1: Gather Requirements (AskUserQuestion), Step 2: Research & Art Direction (+5 more)

### Community 125 - "Messaging Framework"
Cohesion: 0.14
Nodes (13): Core Statements, Elevator Pitches, Framework Structure, Message Architecture, Message by Audience, Message Testing, Messaging Framework, Mission Statement (+5 more)

### Community 126 - "Brand Voice Framework"
Cohesion: 0.14
Nodes (13): Brand Voice Framework, Character Spectrum, Emotion Spectrum, Language Spectrum, Step 1: Define Personality Traits, Step 2: Create Voice Chart, Step 3: Context Adaptation, Tone Spectrum (+5 more)

### Community 127 - "Layout Patterns"
Cohesion: 0.14
Nodes (13): Card Styles, Component Variants, CSS Structures, Feature Grid (3 columns), Layout Decision Flow, Layout Patterns, Layout Selection by Use Case, Metric Styles (+5 more)

### Community 128 - "Tailwind Integration"
Cohesion: 0.14
Nodes (13): Animation Tokens, Base Layer, Button Example, Component Classes, CSS Variables Setup, Dark Mode Toggle, HSL Format Benefits, shadcn/ui Alignment (+5 more)

### Community 129 - "Layout Patterns"
Cohesion: 0.14
Nodes (13): Card Styles, Component Variants, CSS Structures, Feature Grid (3 columns), Layout Decision Flow, Layout Patterns, Layout Selection by Use Case, Metric Styles (+5 more)

### Community 130 - "update.md"
Cohesion: 0.15
Nodes (12): Color Presets, Examples, Files Modified, Important, Overview, Skills Used, Step 1: Gather Brand Input, Step 2: Update Brand Guidelines (+4 more)

### Community 131 - "Logo Design Reference"
Cohesion: 0.15
Nodes (12): Available Styles, Color Psychology, Commands, Design Brief (Start Here), Detailed References, Generate Logo, Industry Defaults, Logo Design Reference (+4 more)

### Community 132 - "Core Visual Elements"
Cohesion: 0.18
Nodes (10): Color Palette, Colors, Core Visual Elements, Logo, Logo, Quick Checks, Typography, Typography (+2 more)

### Community 133 - "CIP Design Style Guide"
Cohesion: 0.18
Nodes (10): Bold Dynamic, CIP Design Style Guide, Classic Traditional, Color Psychology, Corporate Minimal, Fresh Modern, Luxury Premium, Modern Tech (+2 more)

### Community 134 - "SimulateOrderModal.tsx"
Cohesion: 0.17
Nodes (13): Badge(), badgeVariants, Tabs(), TabsContent(), TabsList(), tabsListVariants, TabsTrigger(), ref_base_ui_react_merge_props (+5 more)

### Community 135 - "Slide Strategies"
Cohesion: 0.20
Nodes (9): Common Structures, Duarte Sparkline Pattern, Matching Strategy to Context, Product Demo (6 slides), Sales Pitch (9 slides), Search Commands, Slide Strategies, Strategy Selection (+1 more)

### Community 136 - "Slide Strategies"
Cohesion: 0.20
Nodes (9): Common Structures, Duarte Sparkline Pattern, Matching Strategy to Context, Product Demo (6 slides), Sales Pitch (9 slides), Search Commands, Slide Strategies, Strategy Selection (+1 more)

### Community 138 - "Slides Reference"
Cohesion: 0.29
Nodes (6): Key Features, Knowledge Base, Slides Reference, Usage, When to Use, Workflow

### Community 139 - "HTML Slide Template"
Cohesion: 0.29
Nodes (6): Animation Classes, Background Images, Base Structure, Chart.js Integration, CSS Variables Reference, HTML Slide Template

### Community 140 - "HTML Slide Template"
Cohesion: 0.29
Nodes (6): Animation Classes, Background Images, Base Structure, Chart.js Integration, CSS Variables Reference, HTML Slide Template

### Community 141 - "test_core.py"
Cohesion: 0.11
Nodes (15): detect_domain(), Auto-detect the most relevant domain from query. Matches are weighted by…, Main search function with auto-domain detection, search(), format_markdown(), generate_design_system(), Format design system as markdown., Main entry point for design system generation. Args: query: Search query (e.g.,… (+7 more)

### Community 142 - "BM25"
Cohesion: 0.28
Nodes (5): BM25, BM25 ranking algorithm for text search, Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query

### Community 143 - "Slides"
Cohesion: 0.33
Nodes (5): References (Knowledge Base), Routing, Slides, Subcommands, When to Use

### Community 144 - "Brand Guidelines Template"
Cohesion: 0.40
Nodes (4): Brand Guidelines Template, Document Structure, Extractable Fields, Usage

### Community 145 - "radius"
Cohesion: 0.29
Nodes (8): $type, $value, $type, $value, radius, full, md, md

### Community 146 - "Vyoma - Dashboard"
Cohesion: 0.40
Nodes (4): Deployment on Vercel, Local Development, Tech Stack, Vyoma - Dashboard

### Community 147 - "build"
Cohesion: 0.25
Nodes (8): build, appId, directories, files, productName, win, output, target

### Community 148 - "shadow"
Cohesion: 0.27
Nodes (10): $type, $value, sm, shadow, default, sm, default, sm (+2 more)

### Community 149 - "lg"
Cohesion: 0.60
Nodes (5): lg, $type, $value, lg, lg

### Community 154 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, exactOptionalPropertyTypes, isolatedModules, lib, module, moduleResolution, noEmit (+7 more)

### Community 155 - "main.tsx"
Cohesion: 0.22
Nodes (9): @capacitor/app, @capacitor/status-bar, ref_react_dom_client, react-router-dom, src_index, initializeCapacitorAdaptations(), setupWakeLock(), ErrorBoundaryProps (+1 more)

### Community 156 - "none"
Cohesion: 0.67
Nodes (4): $type, $value, none, none

### Community 173 - "button"
Cohesion: 0.20
Nodes (10): fg, font-size, hover-bg, button, $type, $value, $type, $value (+2 more)

### Community 174 - "input"
Cohesion: 0.25
Nodes (9): padding-x, component, input, $type, $value, focus-ring, padding-x, $type (+1 more)

### Community 175 - "authService.ts"
Cohesion: 0.31
Nodes (7): DEFAULT_ADMIN_PASSWORDS, DEFAULT_STAFF_PASSWORDS, VerifyResult, verifyStaffPassword(), withTimeout(), isSupabaseConfigured, supabase

### Community 176 - "semantic"
Cohesion: 0.25
Nodes (8): $type, $value, $type, $value, semantic, spacing, component, section

### Community 177 - "Vyompos"
Cohesion: 0.33
Nodes (5): Editor support, Requirements, The loop, Try the core loop, Vyompos

### Community 178 - "$type"
Cohesion: 0.60
Nodes (5): $type, $value, border, border, border

### Community 179 - "radius"
Cohesion: 0.60
Nodes (5): radius, radius, radius, $type, $value

### Community 180 - "padding-y"
Cohesion: 0.67
Nodes (4): padding-y, padding-y, $type, $value

### Community 181 - "xl"
Cohesion: 0.67
Nodes (4): xl, xl, $type, $value

### Community 182 - "3"
Cohesion: 0.67
Nodes (3): $type, $value, 3

### Community 183 - "4"
Cohesion: 0.67
Nodes (3): $type, $value, 4

### Community 184 - "5"
Cohesion: 0.67
Nodes (3): $type, $value, 5

### Community 185 - "8"
Cohesion: 0.67
Nodes (3): $type, $value, 8

### Community 186 - "destructive"
Cohesion: 0.67
Nodes (3): destructive, $type, $value

### Community 187 - "foreground"
Cohesion: 0.67
Nodes (3): foreground, $type, $value

### Community 188 - "muted-foreground"
Cohesion: 0.67
Nodes (3): muted-foreground, $type, $value

### Community 189 - "primary"
Cohesion: 0.67
Nodes (3): primary, $type, $value

### Community 190 - "secondary"
Cohesion: 0.67
Nodes (3): secondary, $type, $value

### Community 191 - "secondary-foreground"
Cohesion: 0.67
Nodes (3): secondary-foreground, $type, $value

## Knowledge Gaps
- **1184 isolated node(s):** `fs`, `path`, `fs`, `path`, `fs` (+1179 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1564 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **44 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ShadcnInstaller` connect `ShadcnInstaller` to `.test_init_custom_project_root`, `.test_check_shadcn_config_exists`, `.test_check_shadcn_config_not_exists`, `.test_get_installed_components_no_config`, `.test_init_default_project_root`, `.test_list_installed_no_config`, `.test_get_installed_components_with_files`, `.test_list_installed_with_components`, `.test_add_components_no_config`, `TestShadcnInstaller`, `.check_shadcn_config`, `.test_add_all_components_success`, `.test_add_components_dry_run`, `.__init__`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `App.tsx`, `CaptainDashboard.tsx`, `ErrorBoundary`, `SimulateOrderModal.tsx`, `ServerConnectionModal.tsx`, `package.json`, `main.tsx`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `primitive` connect `primitive` to `gray`, `spacing`, `radius`, `shadow`, `fontSize`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `TailwindConfigGenerator` (e.g. with `TestGeneratedConfigIsValidJs` and `TestTailwindConfigGenerator`) actually correct?**
  _`TailwindConfigGenerator` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `fs`, `path`, `fs` to the rest of the system?**
  _1184 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12121212121212122 - nodes in this community are weakly interconnected._
- **Should `orderStore.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0625694187338023 - nodes in this community are weakly interconnected._