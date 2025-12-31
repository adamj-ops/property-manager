# Design Rules

## Color Token Usage

Always use semantic color tokens instead of raw colors:

### DO ✅
```tsx
<div className="bg-background text-foreground" />
<div className="bg-card border-border" />
<button className="bg-primary text-primary-foreground" />
<span className="text-muted-foreground" />
<div className="bg-accent text-accent-foreground" />
<div className="bg-destructive text-destructive-foreground" />
<div className="bg-success text-success-foreground" />
```

### DON'T ❌
```tsx
<div className="bg-gray-100 text-gray-900" />
<div className="bg-white border-gray-200" />
<button className="bg-green-500 text-white" />
```

## Component Patterns

### Data Attributes
All components should include `data-slot` for debugging and external styling hooks:

```tsx
<button data-slot="button" data-variant={variant} data-size={size} />
<div data-slot="card" />
<input data-slot="input" />
```

### Focus States
Use the standard focus ring pattern:

```tsx
// For inputs
"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"

// For buttons (already in variant)
"outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
```

### Invalid States
Use aria-invalid for form validation:

```tsx
"aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
```

## Spacing Guidelines

- Use `gap-2.5` for card toolbar items and related groups
- Use `p-5` (1.25rem) for card padding
- Use `min-h-14` (3.5rem) for card headers/footers
- Use `space-y-2` for dashboard-card tight spacing

## Typography Guidelines

- Base font size is 14px (set at html level)
- Use `text-base font-semibold` for card titles
- Use `text-sm text-muted-foreground` for descriptions
- Use `text-xs` for labels, metadata, and dense data

## Border Radius

- Cards: `rounded-xl`
- Buttons: `rounded-md`
- Inputs: `rounded-md`
- Dialogs: `rounded-lg`

## Shadow Usage

- Cards: `shadow-xs` (subtle, refined)
- Popovers: `shadow-md`
- Dialogs/Modals: `shadow-lg`
- Auth forms: `shadow-2xl`

## Button Variants

| Variant | Usage |
|---------|-------|
| `default` | Primary actions |
| `secondary` | Secondary/alternative actions |
| `outline` | Tertiary actions, less emphasis |
| `ghost` | Minimal emphasis, inline actions |
| `destructive` | Delete, remove, cancel |
| `success` | Positive confirmations, completions |
| `link` | Text links within content |
| `high-contrast` | Auth pages, high visibility |

## Card Variants

| Variant | Usage |
|---------|-------|
| `default` | Standard cards with border |
| `accent` | Highlighted cards with muted background, grouped content |

## Dark Mode Considerations

- Dark mode uses stronger shadows for depth perception
- Some variants have explicit dark mode overrides (e.g., `dark:bg-input/30`)
- Destructive colors are slightly muted in dark mode
- Use `dark:` prefix only when necessary for contrast/visibility

## Animation Guidelines

- Default transition: `transition-all duration-200`
- Use `hover:shadow-md` for interactive card hover states
- Auth animations: `auth-fade-in` for form entrance
- Loading states: `animate-shimmer` for skeleton loading


