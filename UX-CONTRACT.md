# Peakfit UX Contract

## Product context

- Audience: Moroccan performance-wear shoppers and Peakfit operations staff.
- Primary jobs: find the right product variant, submit a trustworthy COD order, and move orders through fulfilment without inventory mistakes.
- Target market: Morocco.
- Active locales: French at launch; Arabic-ready content and RTL-safe layout.
- Language/content register and native-review policy: direct French storefront copy; Arabic requires native review before publication.
- Timezone/calendar policy: `Africa/Casablanca`, Gregorian calendar; timestamps stored as UTC and displayed in the active locale.
- Accessibility target: WCAG 2.2 AA.

## Business-context sources

| Domain / scope | Authoritative source | Source type | Reviewed date |
|---|---|---|---|
| Product and commercial model | `PRODUCT.md` | Product contract | 2026-09-08 |
| Architecture and permissions | `docs/ARCHITECTURE.md` | Architecture decision | 2026-09-08 |
| Data lifecycle and authorization | `drizzle/0000_peakfit_foundation.sql` | Database contract | 2026-09-08 |
| Deletion / retention | `docs/ARCHITECTURE.md` | Architecture decision | 2026-09-08 |
| Payments | `PRODUCT.md` | Product contract | 2026-09-08 |
| Market / content conventions | `PRODUCT.md` and `DESIGN.md` | Product and design contracts | 2026-09-08 |

## Visual contract

- Project `DESIGN.md`: `DESIGN.md`.
- Token ownership model: runtime CSS variables are canonical; `DESIGN.md` mirrors accepted values.
- Runtime source: `src/app/globals.css`.
- Mapping/adapters: Tailwind v4 `@theme inline` maps stable semantic CSS variables into utilities.
- Token drift gate: DESIGN.md lint, premium audit, theme screenshots, and raw-color search.
- Supported themes: Peakfit Day and Peakfit Night; system preference on first visit, then explicit saved choice.
- Review policy: any shared token or primitive change updates runtime, `DESIGN.md`, and relevant visual evidence in one change.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Table Selection | `DataTableSelection` | this contract | page / all-results | component + E2E |
| Select/Listbox | shared shadcn/Radix `Select` | this contract + `DESIGN.md` | authored | keyboard + popup geometry |
| Date | shared typed `DateField`; authored picker only if later required | this contract | typed / authored | locale + keyboard + E2E |
| Form | shared `FormField` + Zod adapter | this contract | create / edit / checkout | validation E2E |
| Scrollbar | `src/app/globals.css` | `DESIGN.md` | geometry exceptions | computed style |
| Toast | shared `Toaster` provider | this contract | success / warning / info / error | live-region test |
| CRUD | feature service + route helpers | this contract + domain lifecycle | return / stay-inline | full-flow E2E |

## Component behavior

| Component | Default | Hover | Focus | Active | Disabled | Busy | Error |
|---|---|---|---|---|---|---|---|
| Button | semantic intent | contrast shift | visible ring | pressed tone | non-interactive + reason where needed | stable spinner + label | persistent contextual message |
| Icon button | named control | surface shift | visible ring | pressed tone | non-interactive | reserved icon slot | contextual message |
| Input | labeled border | stronger border | ring + border | n/a | readable muted | adornment slot | `aria-invalid` + described text |
| Secret input | masked | standard field | ring | reveal is separate button | readable muted | submit owns pending | generic auth recovery |
| Search | clear + 300ms debounce | standard field | ring | Enter guarded for IME | reason | reserved progress | retry in search region |
| Textarea | resize none | stronger border | ring | n/a | readable muted | submit owns pending | inline described text |
| Table/list | stable rows | row emphasis | controls visible | selection explicit | actions explained | stable overlay/rows | retry without discarding filters |

## Dataset navigation

- Admin tables: server pagination with URL-backed search, filter, sort, page, and page size.
- Exploratory catalog lists: explicit load more, with item count and Back/scroll restoration.
- Page size: 20 by default for admin; supported values 20, 50, and 100.
- Empty/no-results/error/loading: distinct states; no-results provides clear filters, failures provide retry, loading reserves layout.
- Selection: page selection by default; all-results requires an explicit second action and exact count. Changing filters clears selection and announces it.

## Flow ledger

| Operation | Trigger | Pending | Success destination | Success feedback | Failure recovery | Focus outcome | Source ref |
|---|---|---|---|---|---|---|---|
| Create product | `Créer le produit` | stable busy button | product list | `Produit créé` | preserve fields + inline/banner errors | new row/list heading | `PRODUCT.md` |
| Edit product | `Enregistrer` | stable busy button | product list | `Modifications enregistrées` | preserve form and retry | updated row/list heading | `PRODUCT.md` |
| Submit COD order | `Confirmer la commande` | pessimistic busy state | thank-you route | reference + next steps | preserve non-sensitive checkout data | confirmation heading | `PRODUCT.md` |
| Search | search field | stable list loading | same URL-backed route | result count region | retain query + retry | input or result heading | this contract |
| Bulk order action | named status action | busy toolbar/dialog | same list | exact succeeded/failed counts | preserve failures | surviving row/list heading | order lifecycle |
| Upload media | `Ajouter des images` | per-file progress | same product form | per-file status | keep valid files + retry failed file | upload summary | `PRODUCT.md` |
| Cancel/back | `Annuler` / `Retour` | none | origin | none | unsaved dialog if dirty | originating context | this contract |
| Archive product | `Archiver` | warning confirmation | product list | toast with restore when honest | dialog stays open on failure | next row/list heading | architecture |
| Hard-delete | unavailable in routine UI | n/a | n/a | n/a | privileged maintenance only | n/a | architecture |

## Navigation and responsive behavior

- Route title: `{Page} — Peakfit`, localized; product detail uses `{Product} — Peakfit`.
- 403 explains the Admin requirement and links to an allowed route; 404 states the resource is missing; errors keep navigation and offer retry.
- Catalog route state is shareable in URL. Tabs are in-page only when views share one context.
- Desktop store navigation becomes a modal left drawer on phones. Admin uses persistent desktop sidebar and modal mobile drawer.
- Tables horizontally scroll when comparisons matter; independent order records may stack on narrow screens with all labels/actions preserved.
- Focus is restored after overlays and never hidden under sticky UI; routes focus the main heading after client navigation when appropriate.

## Overlays and feedback

- Dialog primitive: shared Radix/shadcn dialog and alert dialog with focus trap, Escape, restore, responsive bounds, and inert backdrop.
- Recoverable archive/cancel uses warning; irreversible actions use danger and explicit consequences.
- Toasts: top-right desktop, top-center mobile, 5-second routine duration, persistent errors, two-second deduplication, maximum four.
- Alerts remain inline while the condition is true. Tooltips open after 300ms, work on focus, dismiss on Escape, and never contain essential actions.
- Dirty admin forms use an app-owned in-app discard dialog and a narrow `beforeunload` guard.
- Layers: sticky 100, dropdown 200, popover 300, header 400, backdrop 500, dialog 600, sheet 700, command 800, toast 900.

## Async and resilience

- Inventory, orders, permissions, destructive actions, and external notifications are pessimistic.
- COD submission uses an idempotency key; repeated requests resolve to one order where possible.
- Checkout preserves non-sensitive data after recoverable failures. Admin drafts are not auto-saved in Phase 1.
- Readable stale catalog content may remain visible during refresh; offline writes are not queued.
- Safe reads use bounded exponential retry; mutations expose explicit retry and verify uncertain completion before re-submission.
- Status mutations compare `updated_at`; conflicts refresh authoritative state and explain the change.
- Session expiry preserves non-sensitive admin input through re-authentication and returns to the interrupted route.
- Stale reads are cancelled or ignored by request identity. A mutation's owner alone may clear its pending state.

## Validation

- Zod schemas are shared by client forms and server actions/route handlers; the database remains the final integrity boundary.
- Validate on submit, then on change/blur for fields already in error.
- Long forms receive a summary and inline associated errors. The first invalid field is focused.
- Server field errors map to fields; system failures stay in a persistent form banner without exposing raw errors.
- Passwords and tokens are never persisted in drafts or analytics. All product forms use `noValidate` and prevent duplicate submit.

## Permission and clipboard

- Storefront routes are public. Admin navigation is hidden for non-admins; actions visible to read-only staff are disabled with an accessible explanation; forbidden direct routes return 403 UI.
- Server authorization, database role separation, and capability checks are mandatory; client hiding is never security.
- Sensitive values are masked/truncated, copied through a named control, and never repeated in a toast or telemetry.

## Verification

- Static commands: lint, typecheck, unit tests, production build, strict premium audit, DESIGN.md lint, and anti-pattern searches.
- Browser matrix: latest Chromium at 390x844, 768x1024, 1280x800, and 1440x1000 in both themes; Arabic/RTL smoke test when copy exists.
- Accessibility: keyboard-only critical journey, visible focus, semantic landmarks, dialog focus behavior, live regions, contrast, reduced motion, and 200% zoom for checkout/admin.
- Visual regression: home day/night, product, cart, checkout, admin list, admin form, error, empty, and loading states as phases land.
- CRUD evidence: product create/edit/archive and order status E2E tests before admin release.
- Failure evidence: checkout duplicate, stock conflict, upload failure, session expiry, and stale status mutation tests before production launch.
