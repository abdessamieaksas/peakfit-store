# Peakfit Store

Peakfit is a mobile-first Moroccan performance-wear commerce platform. One reusable catalog supports changing products and categories without rebuilding the store, while paired Peakfit Day and Peakfit Night themes share the same structure.

The production foundation uses Next.js, TypeScript, Tailwind CSS, Neon Postgres, Neon Auth, Drizzle, and Vercel.

## Local setup

1. Copy `.env.example` to `.env.local` and add development credentials.
2. Install dependencies with `pnpm install`.
3. Run `pnpm dev` and open the local URL printed by Next.js.

## Quality commands

```powershell
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm build
pnpm verify:premium
```

Product, design, UX, and architecture decisions live in `PRODUCT.md`, `DESIGN.md`, `UX-CONTRACT.md`, and `docs/ARCHITECTURE.md`.
