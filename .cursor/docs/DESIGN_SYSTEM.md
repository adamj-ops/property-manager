# Design System Specification

> **Property Management App Design System**
> Derived from Rehab Planner Pro to ensure visual consistency across products.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Border Radius](#border-radius)
6. [Shadows](#shadows)
7. [Component Patterns](#component-patterns)
8. [Animations](#animations)
9. [Accessibility](#accessibility)

---

## Design Philosophy

The design system follows these core principles:

- **Warm & Professional**: Warm gray palette with soft green/coral accents creates approachable yet professional feel
- **Data-Dense**: Optimized 14px base font for dashboard-heavy applications
- **Subtle Refinement**: Understated border radius and shadows (Mira-style polish)
- **Dark Mode First**: Designed with dark mode as primary, light mode as alternative
- **Consistent Tokens**: CSS custom properties for all design decisions

---

## Color System

### OKLCH-Based Color Tokens

We use OKLCH color space for perceptually uniform colors. This ensures consistent luminance across hues.

#### Light Mode

| Token | OKLCH Value | Description |
|-------|-------------|-------------|
| `--background` | `oklch(0.97 0.003 85)` | Warm off-white (#f5f5f4) |
| `--foreground` | `oklch(0.21 0.005 85)` | Warm charcoal (#262624) |
| `--card` | `oklch(1.0 0 0)` | Pure white |
| `--primary` | `oklch(0.35 0.005 85)` | Dark warm gray |
| `--secondary` | `oklch(0.93 0.003 85)` | Light warm gray |
| `--accent` | `oklch(0.75 0.10 145)` | Soft green (#90c695) |
| `--destructive` | `oklch(0.70 0.18 25)` | Soft coral (#ff6b6b) |
| `--success` | `oklch(0.75 0.10 145)` | Soft green |
| `--border` | `oklch(0.85 0.005 85)` | Light warm gray border |
| `--ring` | `oklch(0.75 0.10 145)` | Soft green focus ring |

#### Dark Mode

| Token | OKLCH Value | Description |
|-------|-------------|-------------|
| `--background` | `oklch(0.21 0.005 85)` | Warm charcoal (#262624) |
| `--foreground` | `oklch(0.95 0.002 85)` | Off-white (#f0f0f0) |
| `--card` | `oklch(0.27 0.003 85)` | Elevated surface (#333333) |
| `--primary` | `oklch(0.95 0.002 85)` | Off-white text |
| `--secondary` | `oklch(0.25 0.004 85)` | Sidebar tone (#30302e) |
| `--accent` | `oklch(0.75 0.10 145)` | Soft green (#90c695) |
| `--destructive` | `oklch(0.70 0.18 25)` | Soft coral (#ff6b6b) |
| `--success` | `oklch(0.75 0.10 145)` | Soft green |
| `--border` | `oklch(0.30 0.003 85)` | Border (#3d3d3d) |
| `--ring` | `oklch(0.75 0.10 145)` | Soft green focus ring |

### Chart Colors

For data visualization consistency:

| Token | Purpose |
|-------|---------|
| `--chart-1` | Primary data (soft green) |
| `--chart-2` | Secondary data (soft coral) |
| `--chart-3` | Tertiary data (medium gray) |
| `--chart-4` | Quaternary data (teal accent) |
| `--chart-5` | Quinary data (dark gray) |

---

## Typography

### Font Stack

```css
--font-sans: 'Roboto', ui-sans-serif, system-ui, sans-serif;
--font-mono: 'Roboto Mono', ui-monospace, monospace;
```

For TanStack Start, we use Inter Variable as the sans-serif alternative:

```css
--font-sans: 'Inter Variable', 'Noto Sans TC Variable', ui-sans-serif, system-ui, sans-serif;
--font-mono: 'JetBrains Mono Variable', ui-monospace, monospace;
```

### Base Font Size

```css
html {
  font-size: 14px; /* Data-dense dashboard optimization */
}

body {
  line-height: 1.6; /* Optimal readability for smaller base font */
}
```

### Type Scale

| Class | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-xs` | 0.75rem (10.5px) | 400 | Labels, metadata |
| `text-sm` | 0.875rem (12.25px) | 400 | Secondary text, descriptions |
| `text-base` | 1rem (14px) | 400 | Body text |
| `text-lg` | 1.125rem (15.75px) | 500 | Subheadings |
| `text-xl` | 1.25rem (17.5px) | 600 | Section headers |
| `text-2xl` | 1.5rem (21px) | 700 | Card titles, metrics |
| `text-3xl` | 1.875rem (26.25px) | 700 | Page titles |

---

## Spacing & Layout

### Base Spacing Unit

```css
--spacing: 0.25rem; /* 3.5px at 14px base */
```

### Common Spacing Values

| Token | Value | Usage |
|-------|-------|-------|
| `gap-1` | 0.25rem | Tight inline spacing |
| `gap-1.5` | 0.375rem | Icon + text pairs |
| `gap-2` | 0.5rem | Related items |
| `gap-2.5` | 0.625rem | Card toolbar items |
| `gap-4` | 1rem | Section spacing |
| `gap-5` | 1.25rem | Card padding |
| `gap-6` | 1.5rem | Section separation |

### Layout Patterns

- **Card padding**: `p-5` (1.25rem)
- **Card header min-height**: `min-h-14` (3.5rem)
- **Section spacing**: `space-y-4` to `space-y-6`
- **Grid gaps**: `gap-2.5` for dense, `gap-4` for standard

---

## Border Radius

### Subtle Polish Approach

```css
--radius: 0.375rem; /* Subtle, refined corners */

--radius-sm: calc(var(--radius) - 2px);  /* 0.25rem */
--radius-md: var(--radius);               /* 0.375rem */
--radius-lg: calc(var(--radius) + 2px);  /* 0.5rem */
--radius-xl: calc(var(--radius) + 4px);  /* 0.625rem */
```

### Component Radii

| Component | Radius |
|-----------|--------|
| Button | `rounded-md` |
| Card | `rounded-xl` |
| Input | `rounded-md` |
| Badge | `rounded-md` |
| Dialog | `rounded-lg` |

---

## Shadows

### Light Mode

```css
--shadow-2xs: 0 1px 2px 0 rgb(0 0 0 / 0.03);
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
```

### Dark Mode (Stronger for Depth)

```css
--shadow-2xs: 0 1px 2px 0 rgb(0 0 0 / 0.2);
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.25);
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3);
/* ... stronger opacity values */
```

---

## Component Patterns

### Data Attributes

All components use `data-slot` attributes for styling hooks:

```tsx
<Comp data-slot="button" data-variant={variant} data-size={size} />
```

### Button Variants

| Variant | Usage |
|---------|-------|
| `default` | Primary actions |
| `secondary` | Secondary actions |
| `outline` | Tertiary actions |
| `ghost` | Minimal emphasis |
| `destructive` | Delete/remove actions |
| `link` | Inline text links |
| `high-contrast` | Auth pages (dark on light, inverts in dark mode) |

### Button Sizes

| Size | Height | Padding |
|------|--------|---------|
| `sm` | 2rem (h-8) | px-3 |
| `default` | 2.25rem (h-9) | px-4 |
| `lg` | 2.5rem (h-10) | px-6 |
| `icon` | 2.25rem (size-9) | - |
| `icon-sm` | 2rem (size-8) | - |
| `icon-lg` | 2.5rem (size-10) | - |

### Card Variants

| Variant | Usage |
|---------|-------|
| `default` | Standard cards with border |
| `accent` | Highlighted cards with muted background |

### Focus States

```css
focus-visible:border-ring
focus-visible:ring-ring/50
focus-visible:ring-[3px]
```

### Invalid States

```css
aria-invalid:ring-destructive/20
dark:aria-invalid:ring-destructive/40
aria-invalid:border-destructive
```

---

## Animations

### Transition Defaults

```css
transition-all duration-200
```

### Common Animations

```css
/* Shimmer for loading states */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

/* Auth form fade-in */
@keyframes auth-fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Gradient shift for marketing backgrounds */
@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
```

---

## Accessibility

### Focus Visibility

All interactive elements must have visible focus indicators:

```css
outline-none
focus-visible:ring-[3px]
focus-visible:ring-ring/50
```

### Color Contrast

- Text on background: minimum 4.5:1 ratio
- Interactive elements: minimum 3:1 ratio
- Large text (18px+): minimum 3:1 ratio

### Motion Preferences

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Utility Classes

### Dashboard-Specific

```css
/* Compact mode for data-dense sections */
.compact {
  font-size: 0.9em;
  line-height: 1.4;
}

/* High-density tables and lists */
.data-dense {
  @apply text-xs leading-tight;
}

/* Tighter spacing for dashboard cards */
.dashboard-card {
  @apply space-y-2;
}

/* Card hover effect for interactive cards */
.card-hover {
  @apply transition-shadow duration-200 hover:shadow-md;
}

/* Mira-style polished cards */
.mira-card {
  @apply bg-card border border-border shadow-sm;
}
```

---

## Related Files

- `src/styles/global.css` - CSS custom properties and base styles
- `tailwind.config.ts` - Tailwind configuration
- `plugins/tailwind/shadcn-preset.ts` - Component theme preset
- `components.json` - shadcn/ui configuration


