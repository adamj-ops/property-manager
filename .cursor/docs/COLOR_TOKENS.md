# Color Token Reference

> Quick reference for all design system color tokens

## Semantic Colors

### Core Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `background` | Warm off-white | Warm charcoal #262624 | Page backgrounds |
| `foreground` | Warm charcoal | Off-white #f0f0f0 | Primary text |
| `card` | Pure white | Elevated #333333 | Card surfaces |
| `card-foreground` | Warm charcoal | Off-white | Card text |
| `popover` | Pure white | Elevated | Popovers, dropdowns |
| `popover-foreground` | Warm charcoal | Off-white | Popover text |

### Interactive Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `primary` | Dark warm gray | Off-white | Primary buttons, links |
| `primary-foreground` | Off-white | Charcoal | Primary button text |
| `secondary` | Light warm gray | Sidebar tone | Secondary buttons |
| `secondary-foreground` | Warm charcoal | Off-white | Secondary text |
| `muted` | Light warm gray | Sidebar tone | Muted backgrounds |
| `muted-foreground` | Medium gray | #999999 | Placeholder, hints |

### Accent Colors

| Token | HSL Value | Hex Approx | Usage |
|-------|-----------|------------|-------|
| `accent` | 130 31% 56% | #90c695 | Soft green highlights |
| `accent-foreground` | Charcoal | - | Accent text |
| `destructive` | 0 100% 71% | #ff6b6b | Errors, delete |
| `destructive-foreground` | Off-white | - | Destructive text |
| `success` | 130 31% 56% | #90c695 | Success states |
| `success-foreground` | Charcoal | - | Success text |

### UI Elements

| Token | Usage |
|-------|-------|
| `border` | All borders |
| `input` | Input borders (matches border) |
| `ring` | Focus rings (soft green) |

### Chart Colors

| Token | Color | Usage |
|-------|-------|-------|
| `chart-1` | Soft green | Primary data |
| `chart-2` | Soft coral | Secondary data |
| `chart-3` | Medium gray | Tertiary data |
| `chart-4` | Teal | Quaternary data |
| `chart-5` | Dark gray | Quinary data |

### Sidebar Colors

| Token | Usage |
|-------|-------|
| `sidebar` | Sidebar background |
| `sidebar-foreground` | Sidebar text |
| `sidebar-primary` | Sidebar active item |
| `sidebar-primary-foreground` | Sidebar active text |
| `sidebar-accent` | Sidebar hover state |
| `sidebar-accent-foreground` | Sidebar hover text |
| `sidebar-border` | Sidebar dividers |
| `sidebar-ring` | Sidebar focus |

## Usage Examples

### Background Layers

```tsx
// Page background
<div className="bg-background" />

// Elevated card
<div className="bg-card" />

// Muted/subtle section
<div className="bg-muted" />

// Accent highlight
<div className="bg-accent" />
```

### Text Hierarchy

```tsx
// Primary text
<p className="text-foreground" />

// Secondary/subtle text
<p className="text-muted-foreground" />

// Success message
<p className="text-success" />

// Error message
<p className="text-destructive" />
```

### Borders

```tsx
// Standard border
<div className="border border-border" />

// Input border
<input className="border-input" />

// Focus ring
<button className="focus-visible:ring-ring" />
```

### Status Indicators

```tsx
// Success state
<div className="bg-success/10 text-success border-success" />

// Error state
<div className="bg-destructive/10 text-destructive border-destructive" />

// Warning (use chart-2)
<div className="bg-chart-2/10 text-chart-2" />
```

## Color Palette Summary

### Light Mode Palette
- **Background**: Warm off-white (`hsl(40 6% 96%)`)
- **Surface**: Pure white (`hsl(0 0% 100%)`)
- **Text**: Warm charcoal (`hsl(30 3% 14%)`)
- **Accent**: Soft green (`hsl(130 31% 56%)`)
- **Destructive**: Soft coral (`hsl(0 100% 71%)`)

### Dark Mode Palette
- **Background**: Warm charcoal (`hsl(30 3% 14%)`)
- **Surface**: Elevated gray (`hsl(30 2% 18%)`)
- **Text**: Off-white (`hsl(40 6% 94%)`)
- **Accent**: Soft green (`hsl(130 31% 56%)`)
- **Destructive**: Soft coral (`hsl(0 100% 71%)`)

## Switching Themes

To change the color theme, update `tailwind.config.ts`:

```ts
shadcnPreset({ color: 'property-management' }) // Warm gray + green/coral
shadcnPreset({ color: 'zinc' })                 // Neutral gray
shadcnPreset({ color: 'blue' })                 // Blue accent
shadcnPreset({ color: 'green' })                // Green accent
```


