# ShadCN UI Setup Guide

This project now includes minimal ShadCN-like components in `components/ui/`. To replace them with official ShadCN UI components, follow these steps:

## 1. Initialize ShadCN UI

Run the interactive CLI (it will ask a few questions; accept defaults or choose your preferences):

```bash
npx shadcn@latest init
```

Answer the prompts:
- **Style**: Default
- **Base color**: Slate (or your preference)
- **CSS variables**: Yes

This will create `components.json` and update your Tailwind config.

## 2. Add Official Components

Replace the minimal components with official ones:

```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add badge
npx shadcn@latest add select
npx shadcn@latest add sheet
npx shadcn@latest add table
```

Or add all at once:

```bash
npx shadcn@latest add button input badge select sheet table
```

## 3. Update Imports

After installation, the official components will be in `components/ui/` with the same names. Your existing code imports from `@/components/ui/button`, etc., so they should work automatically.

## 4. Optional: Additional Components

You may want to add more components as you build out features:

```bash
npx shadcn@latest add toast dialog dropdown-menu tabs card
```

## Notes

- The current minimal components use `class-variance-authority`, `clsx`, and `tailwind-merge` (already installed).
- Official ShadCN components use the same utilities, so the transition is seamless.
- TypeScript types and variants are richer in the official components.
- Your existing App Router pages and API routes are unaffected.

## Troubleshooting

If you see TypeScript errors after adding components:
- Ensure `tsconfig.json` has `jsx: "react-jsx"` (already set).
- Run `npm run dev` to regenerate type definitions.
- Check that `@/components/ui/*` paths resolve correctly in your editor.
