# Peakfit Product Contract

Peakfit is a mobile-first Moroccan performance-wear store for compression tops, graphic training shirts, and running sets. The storefront is reusable: products, categories, media, variants, prices, inventory, and merchandising labels come from data rather than page-specific markup.

## Commercial model

- Currency: Moroccan dirham (`MAD` / `DH`).
- Checkout: guest checkout with cash on delivery as the initial payment method.
- Fulfilment: configurable shipping rates by Moroccan city or region.
- Languages: French first, with Arabic-ready content fields and right-to-left support planned from the foundation.
- Customer support: WhatsApp deep links with editable message templates.

## Product principles

1. A product change must never require rebuilding the storefront layout.
2. The same information hierarchy must work in Peakfit Day and Peakfit Night themes.
3. Product media must be original or licensed; inspiration images are not production assets.
4. Prices, stock, shipping, and order totals are calculated and validated on the server.
5. Submitted COD orders are not the same as confirmed or delivered orders in analytics.

## Primary journeys

1. Discover a category or featured product.
2. Review product media, benefits, size, color, stock, delivery, and returns.
3. Add an exact variant and quantity to the cart.
4. Submit a guest COD order with Moroccan address and phone details.
5. Receive a reference number, status explanation, and optional WhatsApp confirmation.
6. Admins confirm, prepare, ship, deliver, cancel, refuse, or return orders from a protected workspace.

## Order lifecycle

`NEW -> CONTACTED -> CONFIRMED -> PREPARING -> SHIPPED -> DELIVERED`

Terminal or exception paths: `CANCELLED`, `REFUSED`, and `RETURNED`. Every transition is appended to immutable status history. Inventory reservations expire if a new order is not confirmed within the configured window; confirmation commits stock, while eligible cancellations release it.

## Success measures

- Product view to add-to-cart rate.
- Checkout start to COD submission rate.
- Submitted to confirmed order rate.
- Confirmed to delivered order rate.
- Refused and returned order rates.
- Revenue counted from delivered orders, reported separately from submitted order value.

## Delivery phases

- Phase 1: production foundation, architecture, schema, environment validation, design system, and reusable storefront shell.
- Phase 2: catalog, product detail, cart, and shipping estimate.
- Phase 3: COD checkout, order creation, reservation, thank-you, WhatsApp, and email notifications.
- Phase 4: Neon Auth admin workspace, product/media management, inventory, order operations, and settings.
- Phase 5: analytics events, UTM attribution, Meta/GA verification, SEO, performance, accessibility, and deployment hardening.
