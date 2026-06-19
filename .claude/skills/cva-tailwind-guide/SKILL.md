---
name: cva-tailwind-guide
description: >
  Enforces consistent UI decisions in recovery-platform, which uses CVA (class-variance-authority)
  + tailwind-merge for component variants and design tokens. Use this skill whenever you build
  or review any UI component, decide whether to use a primitive from src/components/ui/ or
  write raw Tailwind, or add new component variants. Prevents ad-hoc inline styling, duplicate
  components, and design token violations. Triggers on: "should I use the Button component",
  "styling this component", "add a variant", "new input/button/card", "cn() usage", "rp-*
  token", editing any file in src/components/, adding a new page component, any UI work.
---

# cva-tailwind-guide — Recovery Platform

Recovery Platform has a clean, intentional UI system. Unlike trade-harmonizer (which mixes
MUI + Tailwind), this app is **Tailwind-only** with CVA for variant management. There is
no MUI dependency.

---

## The two UI layers

### 1. `src/components/ui/` — primitive components (always check here first)

These are low-level building blocks. Always prefer them over raw HTML elements.

| Component | Import | Variants / Notes |
|---|---|---|
| `Button` | `@/components/ui/button` | `variant`: default, secondary, outline, ghost, destructive, login. `size`: default, sm, lg, icon |
| `Input` | `@/components/ui/input` | Unstyled wrapper — passes className through `cn()` |
| `Label` | `@/components/ui/label` | Accessible `<label>` with `rp-fg` colour |
| `Card` | `@/components/ui/card` | Surface container with `rp-surface` bg and border |
| `Tooltip` | `@/components/ui/tooltip` | Wrapper around Radix Tooltip |
| `FieldInput` | `@/components/ui/field-input` | Input + label + error message combo |

### 2. Raw Tailwind (for layout and one-off styles)

Use Tailwind directly for:
- Page/section layout (`flex`, `grid`, `gap-`, `p-`, `m-`, `w-`, `h-`)
- Responsive breakpoints (`md:`, `lg:`, `xl:`)
- Conditional visibility / overflow / cursor utilities
- Prose styles on paragraphs/headings that don't need a component

---

## Design tokens (rp-* prefix)

All colours and semantic values are defined as CSS custom properties under the `rp-*`
namespace. **Never use raw hex or standard Tailwind colour names** — always use rp tokens.

```
rp-accent         → primary brand colour (CTAs, focus rings, highlights)
rp-accent-dark    → hover state of rp-accent
rp-fg             → foreground text (primary)
rp-muted          → secondary/muted text
rp-disabled       → disabled text and backgrounds
rp-bg             → page background
rp-surface        → card/elevated surface background
rp-border         → border colour
rp-input          → input field background
rp-error          → error states (form validation, alerts)
```

The token values change per-tenant (the `TenantThemeBootstrap` injects CSS variables
from `RecoveryTenantTheme`). This is why hardcoded colours would break white-labeling.

```tsx
// ✅ Correct — uses design token
<div className="bg-rp-surface border border-rp-border rounded-lg p-4">
<p className="text-rp-muted text-sm">

// ❌ Wrong — hardcoded colour, breaks tenant theming
<div className="bg-gray-100 border border-gray-200">
<p className="text-gray-500 text-sm">

// ❌ Wrong — raw hex
<div style={{ backgroundColor: '#f5f5f5' }}>
```

---

## The `cn()` utility

All component styling uses `cn()` from `@/lib/utils` (a tailwind-merge + clsx wrapper).
Use it whenever you have conditional or composable classes.

```tsx
import { cn } from '@/lib/utils'

// Conditional classes
<div className={cn('p-4 rounded-lg', isActive && 'bg-rp-accent text-white')} />

// Accepting className prop (always merge, never concatenate)
export function MyCard({ className, ...props }: { className?: string }) {
  return <div className={cn('bg-rp-surface p-4', className)} {...props} />
}
```

**Why tailwind-merge matters:** Without it, `cn('p-4', 'p-6')` would produce both
classes and the result is unpredictable. `cn()` deduplicates conflicting Tailwind
utilities correctly.

---

## CVA — adding variants to a component

When a component needs more than one visual style, use CVA. Follow the button pattern:

```typescript
// src/components/ui/badge-variants.ts
import { cva } from 'class-variance-authority'

export const badgeVariants = cva(
  // Base classes (always applied)
  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-rp-accent/10 text-rp-accent',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-yellow-100 text-yellow-700',
        error: 'bg-red-100 text-rp-error',
        muted: 'bg-rp-surface text-rp-muted border border-rp-border',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)
```

```tsx
// src/components/ui/badge.tsx
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { badgeVariants } from './badge-variants'

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />
}
```

**Rule:** Keep the `cva()` definition in a separate `-variants.ts` file, matching the
existing `button-variants.ts` pattern. This allows importing just the class generator
without the React component when needed (e.g. for testing or server components).

---

## When to add to `src/components/ui/` vs keeping it local

**Add to `src/components/ui/`** if:
- It's a generic primitive with no domain knowledge (Button, Input, Badge, Spinner)
- It will be used in 3+ different pages/features
- It uses design tokens and CVA variants

**Keep it local to the feature** if:
- It's domain-specific (e.g. `ShipmentStatusBadge`, `InboxDocumentCard`)
- It tightly couples to a specific data shape
- It's unlikely to be reused outside its feature directory

---

## Form pattern

Recovery Platform uses plain React controlled inputs (no Formik/Yup/React Hook Form):

```tsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldInput } from '@/components/ui/field-input'

// Prefer FieldInput for form fields — it bundles label + input + error
<FieldInput
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={error?.email}
/>
```

---

## Anti-patterns

```tsx
// ❌ Raw <button> — always use <Button>
<button className="bg-rp-accent text-white px-4 py-2 rounded">

// ❌ Raw <input> — always use <Input>
<input className="border rounded p-2" />

// ❌ String concatenation for classes
<div className={'p-4 ' + (active ? 'bg-rp-accent' : '')}>

// ❌ Hardcoded colour that breaks tenant theming
<div className="bg-blue-600 text-white">

// ✅ Correct
<Button variant="default" size="lg">Submit</Button>
<Input value={val} onChange={setVal} className="mt-2" />
<div className={cn('p-4', active && 'bg-rp-accent text-white')}>
```
