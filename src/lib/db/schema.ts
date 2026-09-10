import { sql } from "drizzle-orm";
import {
  boolean,
  char,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const createdAt = timestamp("created_at", { withTimezone: true })
  .defaultNow()
  .notNull();
const updatedAt = timestamp("updated_at", { withTimezone: true })
  .defaultNow()
  .notNull();

export const productStatusEnum = pgEnum("product_status", [
  "DRAFT",
  "ACTIVE",
  "ARCHIVED",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "NEW",
  "CONTACTED",
  "CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUSED",
  "RETURNED",
]);

export const reservationStatusEnum = pgEnum("reservation_status", [
  "ACTIVE",
  "COMMITTED",
  "RELEASED",
  "EXPIRED",
]);

export const adminRoleEnum = pgEnum("admin_role", [
  "OWNER",
  "MANAGER",
  "FULFILMENT",
  "VIEWER",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "WHATSAPP",
  "EMAIL",
]);

export const notificationKindEnum = pgEnum("notification_kind", [
  "ORDER_RECEIVED",
  "ORDER_STATUS_CHANGED",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "PENDING",
  "PROCESSING",
  "SENT",
  "FAILED",
  "CANCELLED",
]);

export const adminProfiles = pgTable(
  "admin_profiles",
  {
    authUserId: text("auth_user_id").primaryKey(),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    role: adminRoleEnum("role").default("VIEWER").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [index("admin_profiles_role_idx").on(table.role)],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 100 }).notNull(),
    nameFr: varchar("name_fr", { length: 120 }).notNull(),
    nameAr: varchar("name_ar", { length: 120 }),
    descriptionFr: text("description_fr"),
    descriptionAr: text("description_ar"),
    position: integer("position").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("categories_slug_uq").on(table.slug),
    index("categories_active_position_idx").on(table.isActive, table.position),
  ],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    slug: varchar("slug", { length: 140 }).notNull(),
    nameFr: varchar("name_fr", { length: 180 }).notNull(),
    nameAr: varchar("name_ar", { length: 180 }),
    summaryFr: text("summary_fr"),
    summaryAr: text("summary_ar"),
    descriptionFr: text("description_fr"),
    descriptionAr: text("description_ar"),
    benefits: jsonb("benefits").$type<Array<{ fr: string; ar?: string }>>().default([]).notNull(),
    basePrice: integer("base_price").notNull(),
    compareAtPrice: integer("compare_at_price"),
    currency: char("currency", { length: 3 }).default("MAD").notNull(),
    status: productStatusEnum("status").default("DRAFT").notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    tags: text("tags").array().default(sql`ARRAY[]::text[]`).notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("products_slug_uq").on(table.slug),
    index("products_category_status_idx").on(table.categoryId, table.status),
    index("products_featured_idx").on(table.isFeatured, table.publishedAt),
    check("products_base_price_nonnegative", sql`${table.basePrice} >= 0`),
    check(
      "products_compare_price_nonnegative",
      sql`${table.compareAtPrice} IS NULL OR ${table.compareAtPrice} >= 0`,
    ),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    storageProvider: varchar("storage_provider", { length: 40 }).notNull(),
    storageKey: text("storage_key").notNull(),
    publicUrl: text("public_url").notNull(),
    altFr: varchar("alt_fr", { length: 240 }).notNull(),
    altAr: varchar("alt_ar", { length: 240 }),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    position: integer("position").default(0).notNull(),
    isPrimary: boolean("is_primary").default(false).notNull(),
    createdAt,
  },
  (table) => [
    uniqueIndex("product_images_storage_key_uq").on(
      table.storageProvider,
      table.storageKey,
    ),
    index("product_images_product_position_idx").on(
      table.productId,
      table.position,
    ),
    check("product_images_width_positive", sql`${table.width} > 0`),
    check("product_images_height_positive", sql`${table.height} > 0`),
  ],
);

export const productOptions = pgTable(
  "product_options",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 60 }).notNull(),
    nameFr: varchar("name_fr", { length: 100 }).notNull(),
    nameAr: varchar("name_ar", { length: 100 }),
    position: integer("position").default(0).notNull(),
  },
  (table) => [
    uniqueIndex("product_options_product_code_uq").on(
      table.productId,
      table.code,
    ),
  ],
);

export const productOptionValues = pgTable(
  "product_option_values",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    optionId: uuid("option_id")
      .notNull()
      .references(() => productOptions.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 80 }).notNull(),
    labelFr: varchar("label_fr", { length: 100 }).notNull(),
    labelAr: varchar("label_ar", { length: 100 }),
    swatch: varchar("swatch", { length: 40 }),
    position: integer("position").default(0).notNull(),
  },
  (table) => [
    uniqueIndex("product_option_values_option_code_uq").on(
      table.optionId,
      table.code,
    ),
  ],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: varchar("sku", { length: 100 }).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    priceOverride: integer("price_override"),
    stockQuantity: integer("stock_quantity").default(0).notNull(),
    reservedQuantity: integer("reserved_quantity").default(0).notNull(),
    weightGrams: integer("weight_grams"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("product_variants_sku_uq").on(table.sku),
    index("product_variants_product_active_idx").on(
      table.productId,
      table.isActive,
    ),
    check(
      "product_variants_price_nonnegative",
      sql`${table.priceOverride} IS NULL OR ${table.priceOverride} >= 0`,
    ),
    check("product_variants_stock_nonnegative", sql`${table.stockQuantity} >= 0`),
    check(
      "product_variants_reserved_valid",
      sql`${table.reservedQuantity} >= 0 AND ${table.reservedQuantity} <= ${table.stockQuantity}`,
    ),
    check(
      "product_variants_weight_positive",
      sql`${table.weightGrams} IS NULL OR ${table.weightGrams} > 0`,
    ),
  ],
);

export const variantOptionValues = pgTable(
  "variant_option_values",
  {
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    optionValueId: uuid("option_value_id")
      .notNull()
      .references(() => productOptionValues.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.variantId, table.optionValueId] }),
  ],
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: varchar("full_name", { length: 160 }).notNull(),
    phone: varchar("phone", { length: 30 }).notNull(),
    email: varchar("email", { length: 254 }),
    createdAt,
    updatedAt,
  },
  (table) => [index("customers_phone_idx").on(table.phone)],
);

export type OrderAttribution = {
  firstTouch?: Record<string, string>;
  lastTouch?: Record<string, string>;
  landingPage?: string;
  referrer?: string;
};

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reference: varchar("reference", { length: 32 }).notNull(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    customerName: varchar("customer_name", { length: 160 }).notNull(),
    customerPhone: varchar("customer_phone", { length: 30 }).notNull(),
    customerEmail: varchar("customer_email", { length: 254 }),
    status: orderStatusEnum("status").default("NEW").notNull(),
    currency: char("currency", { length: 3 }).default("MAD").notNull(),
    subtotal: integer("subtotal").notNull(),
    shippingFee: integer("shipping_fee").notNull(),
    total: integer("total").notNull(),
    shippingZoneCode: varchar("shipping_zone_code", { length: 80 }).notNull(),
    shippingZoneName: varchar("shipping_zone_name", { length: 120 }).notNull(),
    estimatedDaysMin: integer("estimated_days_min").notNull(),
    estimatedDaysMax: integer("estimated_days_max").notNull(),
    city: varchar("city", { length: 120 }).notNull(),
    region: varchar("region", { length: 120 }),
    addressLine: text("address_line").notNull(),
    postalCode: varchar("postal_code", { length: 24 }),
    customerNote: text("customer_note"),
    attribution: jsonb("attribution").$type<OrderAttribution>().default({}).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 100 }).notNull(),
    requestFingerprint: char("request_fingerprint", { length: 64 }).notNull(),
    version: integer("version").default(1).notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("orders_reference_uq").on(table.reference),
    uniqueIndex("orders_idempotency_key_uq").on(table.idempotencyKey),
    index("orders_status_created_idx").on(table.status, table.createdAt),
    index("orders_customer_created_idx").on(table.customerId, table.createdAt),
    check("orders_subtotal_nonnegative", sql`${table.subtotal} >= 0`),
    check("orders_shipping_nonnegative", sql`${table.shippingFee} >= 0`),
    check("orders_total_matches", sql`${table.total} = ${table.subtotal} + ${table.shippingFee}`),
    check(
      "orders_estimate_valid",
      sql`${table.estimatedDaysMin} > 0 AND ${table.estimatedDaysMax} >= ${table.estimatedDaysMin}`,
    ),
    check(
      "orders_fingerprint_valid",
      sql`${table.requestFingerprint} ~ '^[0-9a-f]{64}$'`,
    ),
    check("orders_version_positive", sql`${table.version} > 0`),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    productName: varchar("product_name", { length: 180 }).notNull(),
    variantTitle: varchar("variant_title", { length: 180 }).notNull(),
    selectedOptions: jsonb("selected_options")
      .$type<Array<{ code: string; name: string; value: string; label: string }>>()
      .default([])
      .notNull(),
    sku: varchar("sku", { length: 100 }).notNull(),
    imageUrl: text("image_url"),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: integer("line_total").notNull(),
    createdAt,
  },
  (table) => [
    index("order_items_order_idx").on(table.orderId),
    check("order_items_unit_price_nonnegative", sql`${table.unitPrice} >= 0`),
    check("order_items_quantity_positive", sql`${table.quantity} > 0`),
    check(
      "order_items_total_matches",
      sql`${table.lineTotal} = ${table.unitPrice} * ${table.quantity}`,
    ),
  ],
);

export const notificationOutbox = pgTable(
  "notification_outbox",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    channel: notificationChannelEnum("channel").notNull(),
    kind: notificationKindEnum("kind").notNull(),
    status: notificationStatusEnum("status").default("PENDING").notNull(),
    recipient: varchar("recipient", { length: 254 }).notNull(),
    templateKey: varchar("template_key", { length: 100 }).notNull(),
    locale: varchar("locale", { length: 16 }).default("fr").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().default({}).notNull(),
    dedupeKey: varchar("dedupe_key", { length: 180 }).notNull(),
    attempts: integer("attempts").default(0).notNull(),
    maxAttempts: integer("max_attempts").default(5).notNull(),
    availableAt: timestamp("available_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    leasedAt: timestamp("leased_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    providerMessageId: varchar("provider_message_id", { length: 200 }),
    lastErrorCode: varchar("last_error_code", { length: 100 }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("notification_outbox_dedupe_uq").on(table.dedupeKey),
    index("notification_outbox_dispatch_idx").on(
      table.status,
      table.availableAt,
    ),
    index("notification_outbox_order_idx").on(table.orderId, table.createdAt),
    check("notification_outbox_attempts_nonnegative", sql`${table.attempts} >= 0`),
    check("notification_outbox_max_attempts_positive", sql`${table.maxAttempts} > 0`),
    check(
      "notification_outbox_attempts_bounded",
      sql`${table.attempts} <= ${table.maxAttempts}`,
    ),
  ],
);

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    fromStatus: orderStatusEnum("from_status"),
    toStatus: orderStatusEnum("to_status").notNull(),
    actorAdminId: text("actor_admin_id").references(
      () => adminProfiles.authUserId,
      { onDelete: "set null" },
    ),
    reason: text("reason"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt,
  },
  (table) => [index("order_status_history_order_created_idx").on(table.orderId, table.createdAt)],
);

export const inventoryReservations = pgTable(
  "inventory_reservations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    status: reservationStatusEnum("status").default("ACTIVE").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    closeReason: text("close_reason"),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("inventory_reservations_order_variant_uq").on(
      table.orderId,
      table.variantId,
    ),
    index("inventory_reservations_expiry_idx").on(table.status, table.expiresAt),
    check("inventory_reservations_quantity_positive", sql`${table.quantity} > 0`),
  ],
);

export const customerNotes = pgTable(
  "customer_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    authorAdminId: text("author_admin_id")
      .notNull()
      .references(() => adminProfiles.authUserId, { onDelete: "restrict" }),
    note: text("note").notNull(),
    createdAt,
  },
  (table) => [index("customer_notes_customer_created_idx").on(table.customerId, table.createdAt)],
);

export const shippingZones = pgTable(
  "shipping_zones",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 80 }).notNull(),
    nameFr: varchar("name_fr", { length: 120 }).notNull(),
    nameAr: varchar("name_ar", { length: 120 }),
    cities: text("cities").array().default(sql`ARRAY[]::text[]`).notNull(),
    fee: integer("fee").notNull(),
    freeShippingThreshold: integer("free_shipping_threshold"),
    estimatedDaysMin: integer("estimated_days_min").notNull(),
    estimatedDaysMax: integer("estimated_days_max").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("shipping_zones_code_uq").on(table.code),
    check("shipping_zones_fee_nonnegative", sql`${table.fee} >= 0`),
    check(
      "shipping_zones_free_threshold_nonnegative",
      sql`${table.freeShippingThreshold} IS NULL OR ${table.freeShippingThreshold} >= 0`,
    ),
    check(
      "shipping_zones_estimate_valid",
      sql`${table.estimatedDaysMin} > 0 AND ${table.estimatedDaysMax} >= ${table.estimatedDaysMin}`,
    ),
  ],
);

export const storeSettings = pgTable("store_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull(),
  updatedByAdminId: text("updated_by_admin_id").references(
    () => adminProfiles.authUserId,
    { onDelete: "set null" },
  ),
  updatedAt,
});

export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
