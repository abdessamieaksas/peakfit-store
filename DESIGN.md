---
version: alpha
name: "Peakfit"
description: "A high-contrast Moroccan performance-wear storefront that shifts between editorial daylight and focused training-night modes without changing its structure."
colors:
  primary: "#8C6BFF"
  day-background: "#F3F2EF"
  day-surface: "#FFFFFF"
  day-foreground: "#0B0B0D"
  day-muted: "#67636D"
  day-border: "#D9D5DE"
  night-background: "#09090B"
  night-surface: "#131217"
  night-raised: "#1B1921"
  night-foreground: "#F7F6F8"
  night-muted: "#A7A2AE"
  night-border: "#2D2934"
  accent: "#B8A2FF"
  accent-strong: "#8C6BFF"
  on-accent: "#100C18"
  success: "#1F7A4D"
  warning: "#A85E00"
  danger: "#B42318"
  focus: "#6F4DDB"
typography:
  display:
    fontFamily: "Barlow Condensed Variable, Arial Narrow, sans-serif"
    fontSize: "9rem"
    lineHeight: "0.82"
  sans:
    fontFamily: "Manrope Variable, Arial, sans-serif"
    fontSize: "1rem"
    lineHeight: "1.55"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace"
rounded:
  DEFAULT: "0.375rem"
  sm: "0.125rem"
  md: "0.375rem"
  lg: "0.75rem"
  pill: "999px"
spacing:
  control: "0.75rem"
  cluster: "1.25rem"
  section-gap: "6rem"
  page-gutter: "clamp(1rem, 3vw, 3rem)"
  page-max: "90rem"
components:
  button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-accent}"
    typography: "{typography.sans}"
    rounded: "{rounded.md}"
    height: "2.75rem"
    padding: "0.75rem"
  product-card:
    backgroundColor: "{colors.day-surface}"
    textColor: "{colors.day-foreground}"
    rounded: "{rounded.sm}"
  header:
    backgroundColor: "{colors.day-background}"
    textColor: "{colors.day-foreground}"
    height: "5rem"
  dialog:
    backgroundColor: "{colors.day-surface}"
    textColor: "{colors.day-foreground}"
    rounded: "{rounded.lg}"
---

# Peakfit Design System

## Overview

### Creative North Star

Peakfit should feel like an editorial training journal laid over a precision equipment catalog: oversized condensed declarations, honest product photography, hard black-and-white contrast, and one ultraviolet accent that behaves like reflected gym light. It is expressive at the campaign edge and disciplined wherever a customer must compare, choose, or pay.

### Product context and register

- **Audience and primary job:** Moroccan gym and running customers choosing performance apparel quickly on mobile, plus staff processing COD orders accurately.
- **Target market and evidence:** Morocco, defined by the product contract's MAD pricing, COD checkout, city-based delivery, WhatsApp support, and French/Arabic readiness.
- **Locales:** French is the launch language. Arabic content fields and RTL-safe layout are foundation requirements; customer-facing Arabic copy requires native review before launch.
- **Usage scene:** primarily one-handed mobile browsing and checkout, with desktop product comparison and a denser desktop admin workspace.
- **Register:** hybrid. Storefront campaign sections are brand-led; catalog, product, cart, checkout, account feedback, and admin are product-led.
- **Memorable signature:** very large compressed headlines crossing a strict product grid, with ultraviolet used as a narrow signal rather than a wash.
- **Restraint:** product information, forms, totals, status, stock, tables, and confirmations remain flat, legible, and familiar.
- **Anti-references:** generic neon-gym gradients, glassmorphism, copied competitor marks, overly rounded SaaS cards, and ornamental dashboard chrome.
- **Token ownership/runtime mapping:** hand-authored semantic variables in `src/app/globals.css` are runtime-canonical. This file mirrors their accepted values and intent. Theme selectors remap semantic roles; components never consume raw palette literals.

## Colors

Day mode uses warm training-studio white rather than sterile pure white. Night mode uses near-black and plum-charcoal layers without turning every surface into a floating card. `accent` is expressive and interactive; `success`, `warning`, and `danger` are semantic and must include text or icon meaning. Focus uses `focus` with a two-pixel visible ring. Forced-colors mode returns control of contrast to the platform.

## Typography

`display` is reserved for campaign headlines, collection titles, and compact numeric callouts. `sans` owns product names, navigation, forms, prices, and operational UI. Headlines use uppercase sparingly and may tighten tracking; body copy never imitates the display face. Prices and quantities use tabular numerals. Arabic receives a locale-capable system fallback and relaxed line height when introduced; italic styling is not used for Arabic content.

## Layout

The storefront sits inside a `90rem` maximum canvas with fluid page gutters. Campaign sections may break the content grid internally, but controls and product lists align to stable columns. Desktop catalog grids use four columns, small laptops three, and phones two when product names remain readable. Checkout and product-detail content become single-column on phones. Media reserves aspect ratio before loading. The app has one vertical scroll owner per route; sticky controls never hide focused content.

## Elevation & Depth

Hierarchy comes from tonal surfaces, borders, scale, and controlled overlap. Static product cards have no drop shadow. Drawers and dialogs receive one soft shadow only because they leave the document plane. Sticky headers use an opaque or lightly translucent tokenized surface with a border, not heavy blur.

## Shapes

The system is predominantly squared with small softened edges. Product media uses `sm`; fields and standard buttons use `md`; dialogs use `lg`; only chips, tiny merchandising labels, and the theme switch may use `pill`. Circular icon containers are avoided unless the control itself is universally understood.

## Components

### Foundational visual states

All interactive primitives define default, hover, focus-visible, active, selected, disabled, busy, success, warning, and error states. Hover strengthens contrast without moving geometry. Busy controls reserve their label width. Loading indicators occupy stable regions; product image skeletons are allowed only when they exactly reserve final media geometry.

### Buttons and actions

Buttons combine intent and emphasis. Solid black/white or accent is reserved for the primary safe action in a decision area. Outline and ghost handle secondary actions. Recoverable cancellation uses warning treatment; irreversible deletion uses danger. Icon-only buttons must have localized accessible names and 44px practical touch targets in storefront journeys.

### Navigation and data display

Store navigation is a desktop horizontal bar and a modal left drawer on phones. Route-backed catalog filters live in the URL. Product cards keep media geometry stable and expose a real link; quick actions do not turn the whole card into a click handler. Admin datasets use semantic tables with visible overflow on narrow screens and a stacked-record alternative only when comparison is not required.

### Forms and overlays

Fields use persistent labels, clear help/error association, app-owned validation, and `noValidate`. Authored Radix/shadcn listboxes own popup geometry. Dialogs, drawers, toasts, tooltips, and menus use the shared layer scale. Upload controls always provide a visible picker in addition to drag and drop. Customer checkout avoids accounts and unnecessary fields.

### Iconography

Lucide is the shared icon family, using 1.75–2px strokes at 16, 20, or 24px. Icons reinforce text; unfamiliar and consequential actions retain labels. The Peakfit wordmark is typographic until a final licensed vector mark is approved.

### Motion

Motion explains state and hierarchy. Control feedback is 120–180ms; drawers and dialogs use 200–260ms ease-out; initial campaign reveal may use one restrained stagger. Reduced motion removes transforms and stagger, leaving immediate state changes or a brief opacity transition.

### Content and data visualization

The storefront voice is direct, physical, and specific. French action labels use real verbs. Operational copy distinguishes submitted, confirmed, shipped, delivered, refused, and returned. MAD uses locale-aware formatting with `DH` in compact display contexts. Charts never merge submitted order value with delivered revenue.

## Do's and Don'ts

- **Do:** let product photography, proportion, and condensed type create energy.
- **Do:** keep day and night layouts structurally identical and token-driven.
- **Don't:** hardcode a page around the initial three products or categories.
- **Don't:** use purple gradients, glass cards, copied brand marks, or decorative metrics where transaction clarity should lead.
