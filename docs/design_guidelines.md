# TickerHub Design Guidelines

## Design Approach
**System:** Custom "Cyber Matrix" futuristic blockchain aesthetic - drawing inspiration from modern crypto platforms like Etherscan, with a distinctive neon-cyberpunk visual identity that emphasizes data visualization and real-time information.

## Core Design Principles
- **Futuristic & Tech-Forward:** Embrace blockchain's cutting-edge nature through glowing effects, animated gradients, and digital aesthetics
- **Data Clarity:** Despite visual richness, ensure data remains scannable and hierarchical
- **Real-time Vitality:** Use subtle animations to convey live data updates and platform activity
- **Professional Depth:** Balance cyberpunk aesthetics with enterprise-grade credibility

---

## Typography

### Font Families
- **Primary (UI/Data):** 'Inter', sans-serif (Google Fonts)
- **Monospace (Addresses/Hashes):** 'JetBrains Mono', monospace (Google Fonts)

### Type Scale
- **Hero Display:** text-5xl/text-6xl, font-bold, tracking-tight
- **Section Headers:** text-3xl/text-4xl, font-bold
- **Card Titles:** text-xl/text-2xl, font-semibold
- **Body Text:** text-base, font-normal
- **Data Labels:** text-sm, font-medium, uppercase tracking-wide
- **Captions/Meta:** text-xs, text-secondary

---

## Layout System

### Spacing Units
Primary units: **4, 8, 16, 24, 32** (p-4, m-8, gap-16, py-24, etc.)

### Container Widths
- **Full Dashboard:** max-w-[1600px] mx-auto px-6
- **Content Sections:** max-w-7xl mx-auto
- **Data Tables:** w-full with horizontal scroll on mobile

### Grid Systems
- **Dashboard Cards:** grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- **Statistics:** grid-cols-2 lg:grid-cols-4 gap-4
- **Block Lists:** Single column table with responsive horizontal scroll

---

## Component Library

### Navigation
- **Header:** Fixed top, backdrop-blur-md bg-surface/80, border-b border-border with glow effect
- **Logo:** Neon cyan text with subtle glow (text-shadow)
- **Search Bar:** Prominent center placement, rounded-xl, focus:ring-2 ring-primary-glow
- **Chain Selector:** Pill-style tabs with active state glow

### Cards & Surfaces
- **Base Card:** rounded-xl, bg-surface, border border-border, p-6, subtle inner glow on hover
- **Elevated Card:** bg-surface-elevated, shadow-lg with colored shadow (cyan/purple)
- **Stat Cards:** Compact, large numbers with glowing indicators for trends (+green, -red)

### Data Display
- **Tables:** Dark striped rows (hover:bg-surface-light), monospace for hashes/addresses, right-aligned numbers
- **Price Indicators:** Large bold numbers, color-coded changes (+accent/-danger), with arrow icons
- **Block/Transaction Lists:** Condensed rows, hash truncation with copy button, timestamp relative format
- **Charts:** Dark background, gradient fills, cyan/purple lines, grid lines with low opacity

### Interactive Elements
- **Primary Buttons:** bg-primary, text-background, rounded-lg, hover:brightness-110, with glow shadow
- **Secondary Buttons:** border border-primary, text-primary, bg-transparent, hover:bg-primary/10
- **Links:** text-primary, hover:text-primary-light, underline-offset-4
- **Copy Buttons:** Small icon buttons next to hashes/addresses, success feedback animation

### Overlays
- **Modals:** Centered, bg-surface, rounded-2xl, backdrop-blur-xl, max-w-2xl
- **Tooltips:** Small, rounded-lg, bg-surface-elevated, text-xs, with arrow pointer
- **Loading States:** Shimmer effect on skeleton screens, pulsing dots for live data

---

## Visual Effects

### Glow Effects
- **Card Hover:** Subtle cyan/purple glow on border (box-shadow with primary-glow)
- **Active States:** Intensified glow on selected chain/tab
- **Data Updates:** Brief flash animation when values change

### Backgrounds
- **Primary:** Deep navy gradient (from-[#0A0E27] to-[#141B3D])
- **Animated Layer:** CSS gradient animation (slow 15s ease-in-out infinite)
- **Particle Overlay:** Optional: Subtle grid pattern or dot matrix (opacity-5)

### Transitions
- All interactions: transition-all duration-200 ease-out
- Hover states: transform scale-[1.02] for cards
- NO complex page transitions - keep focus on data clarity

---

## Images

### Hero Section (Landing Page)
- **Large Background Image:** Abstract blockchain network visualization or digital data flow
  - Treatment: Dark overlay (bg-black/60), blur backdrop
  - Positioning: Full-width, 70vh height
  - Content: Centered text overlaid with blurred background buttons

### Dashboard
- **No hero image** - focus on data cards and real-time information
- **Chain Icons:** Small SVG icons (24x24) for Bitcoin, Ethereum, Solana in card headers
- **Status Icons:** Heroicons for success/pending/failed states

---

## Page-Specific Layouts

### Landing Page
1. Hero: Full-width with background image, centered headline + CTA, live ticker bar below
2. Features: 3-column grid (lg) showcasing key capabilities with icons
3. Live Stats: 4-column counter cards (blocks processed, transactions tracked)
4. CTA: Centered "Explore Dashboard" with subtle animation

### Dashboard
- **Top Bar:** Network selector pills + global search
- **Stats Row:** 4 cards (BTC price, ETH gas, network status, 24h volume)
- **Main Grid:** 2-column (Recent Blocks left, Price Chart right)
- **Bottom:** Market overview table (10 rows, full-width)

### Block Explorer
- **Search Prominent:** Full-width search bar with chain filter
- **Table View:** Paginated list, sticky header, 25 rows
- **Sidebar:** Mini network stats panel (right side, lg screens only)

### Transaction/Address Pages
- **Header Card:** Large, primary info (status, value, addresses)
- **Metadata Grid:** 2-column detail rows
- **Timeline:** Vertical for confirmations/events
- **Related Transactions:** Table below

---

## Accessibility & Performance
- Maintain 4.5:1 contrast for text on backgrounds
- Focus rings visible on all interactive elements (ring-2 ring-primary)
- Monospace fonts for all cryptographic data (addresses, hashes, hex values)
- Lazy load charts and heavy data tables
- Real-time updates throttled to prevent jank