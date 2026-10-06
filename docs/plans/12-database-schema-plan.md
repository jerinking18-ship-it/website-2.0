# Database Schema Plan

## Goal

Define the production database structure for the grocery ecommerce platform.

The main database should be PostgreSQL. Redis and Meilisearch support performance, queues, realtime state, and product search, but PostgreSQL remains the source of truth.

## Database Principles

- Use clear domain-based tables.
- Keep customer, admin, catalog, order, inventory, delivery, support, and audit data separated.
- Use UUID primary keys for major business records.
- Track `created_at` and `updated_at` on most tables.
- Use soft delete where business history matters.
- Preserve order, payment, inventory, and support history.
- Design for CQRS by keeping write models clean and allowing optimized read models later.

## Core Entity Groups

1. Identity and access.
2. Catalog.
3. Search indexing.
4. Cart and checkout.
5. Orders and payments.
6. Inventory and suppliers.
7. Delivery.
8. Coupons and promotions.
9. Customer support.
10. Notifications.
11. Audit logs.

## Identity And Access Tables

### `customers`

Stores customer profiles.

Important fields:

- `id`
- `phone`
- `email`
- `first_name`
- `last_name`
- `status`
- `created_at`
- `updated_at`

### `customer_addresses`

Stores saved delivery addresses.

Important fields:

- `id`
- `customer_id`
- `label`
- `recipient_name`
- `phone`
- `address_line_1`
- `address_line_2`
- `city`
- `state`
- `postal_code`
- `latitude`
- `longitude`
- `is_default`

### `customer_otp_codes`

Stores short-lived phone OTP records.

Important fields:

- `id`
- `phone`
- `code_hash`
- `purpose`
- `expires_at`
- `consumed_at`
- `attempt_count`

### `admin_users`

Stores admin and staff accounts.

Important fields:

- `id`
- `email`
- `password_hash`
- `name`
- `status`
- `two_factor_enabled`
- `last_login_at`

### `admin_roles`

Stores admin role definitions.

Example roles:

- Owner.
- Store manager.
- Product manager.
- Inventory staff.
- Support agent.
- Delivery staff.

### `admin_permissions`

Stores permission definitions.

Examples:

- `products.create`
- `orders.update_status`
- `inventory.adjust`
- `support.reply`
- `settings.update`

### `admin_user_roles`

Join table between admin users and roles.

### `admin_role_permissions`

Join table between roles and permissions.

## Catalog Tables

### `categories`

Stores grocery categories.

Important fields:

- `id`
- `name`
- `slug`
- `description`
- `parent_id`
- `sort_order`
- `is_featured`
- `is_active`

### `products`

Stores main product records.

Important fields:

- `id`
- `category_id`
- `name`
- `slug`
- `description`
- `brand`
- `unit_label`
- `base_price`
- `sale_price`
- `tax_rate`
- `status`
- `is_featured`
- `is_returnable`

### `product_images`

Stores product image metadata.

Important fields:

- `id`
- `product_id`
- `url`
- `alt_text`
- `sort_order`
- `is_primary`

### `product_badges`

Stores badge definitions such as organic, local, express, bestseller, and new.

### `product_badge_links`

Join table between products and badges.

### `product_variants`

Stores product variants when a product has size or package options.

Important fields:

- `id`
- `product_id`
- `name`
- `sku`
- `unit_label`
- `price`
- `sale_price`
- `status`

### `product_reviews`

Stores customer product reviews if enabled.

Important fields:

- `id`
- `product_id`
- `customer_id`
- `rating`
- `title`
- `body`
- `status`

## Search Tables

### `search_synonyms`

Stores custom search synonyms.

Examples:

- tomato, tomatoes.
- curd, yogurt.
- coriander, cilantro.

### `search_redirects`

Stores search terms that should redirect to specific categories or products.

### `product_search_index_jobs`

Tracks product indexing jobs for Meilisearch.

## Cart And Checkout Tables

### `carts`

Stores active carts.

Important fields:

- `id`
- `customer_id`
- `guest_id`
- `status`
- `delivery_zone_id`
- `coupon_id`

### `cart_items`

Stores items in a cart.

Important fields:

- `id`
- `cart_id`
- `product_id`
- `variant_id`
- `quantity`
- `unit_price_snapshot`

### `checkout_sessions`

Stores checkout progress.

Important fields:

- `id`
- `cart_id`
- `customer_id`
- `guest_id`
- `address_id`
- `delivery_slot_id`
- `payment_method`
- `status`

## Orders And Payments Tables

### `orders`

Stores placed orders.

Important fields:

- `id`
- `order_number`
- `customer_id`
- `guest_phone`
- `status`
- `payment_status`
- `fulfillment_status`
- `subtotal`
- `discount_total`
- `delivery_fee`
- `tax_total`
- `grand_total`
- `delivery_address_snapshot`
- `delivery_slot_id`

### `order_items`

Stores purchased items.

Important fields:

- `id`
- `order_id`
- `product_id`
- `variant_id`
- `product_name_snapshot`
- `unit_label_snapshot`
- `quantity`
- `unit_price`
- `line_total`

### `order_status_history`

Tracks order status changes.

Important fields:

- `id`
- `order_id`
- `from_status`
- `to_status`
- `changed_by_admin_id`
- `note`

### `payments`

Stores payment attempts and results.

Important fields:

- `id`
- `order_id`
- `provider`
- `method`
- `status`
- `amount`
- `provider_payment_id`
- `provider_order_id`
- `paid_at`

### `refunds`

Stores refund requests and refund records.

Important fields:

- `id`
- `payment_id`
- `order_id`
- `amount`
- `reason`
- `status`
- `provider_refund_id`

## Inventory And Supplier Tables

### `suppliers`

Stores supplier information.

Important fields:

- `id`
- `name`
- `contact_name`
- `phone`
- `email`
- `status`

### `inventory_items`

Stores inventory state per product or variant.

Important fields:

- `id`
- `product_id`
- `variant_id`
- `sku`
- `stock_quantity`
- `reserved_quantity`
- `low_stock_threshold`
- `status`

### `inventory_batches`

Stores batch and expiry information.

Important fields:

- `id`
- `inventory_item_id`
- `supplier_id`
- `batch_code`
- `quantity`
- `received_at`
- `expires_at`
- `cost_price`

### `inventory_adjustments`

Tracks manual inventory changes.

Important fields:

- `id`
- `inventory_item_id`
- `batch_id`
- `adjustment_type`
- `quantity_delta`
- `reason`
- `created_by_admin_id`

### `purchase_entries`

Stores supplier purchase records.

Important fields:

- `id`
- `supplier_id`
- `reference_number`
- `status`
- `total_cost`
- `received_at`

### `purchase_entry_items`

Stores items inside supplier purchase records.

## Delivery Tables

### `delivery_zones`

Stores delivery areas.

Important fields:

- `id`
- `name`
- `postal_codes`
- `base_fee`
- `free_delivery_minimum`
- `is_active`

### `delivery_slots`

Stores delivery windows.

Important fields:

- `id`
- `delivery_zone_id`
- `starts_at`
- `ends_at`
- `capacity`
- `reserved_count`
- `cutoff_at`
- `is_active`

### `delivery_staff`

Stores delivery staff profiles.

Important fields:

- `id`
- `admin_user_id`
- `name`
- `phone`
- `status`

### `delivery_assignments`

Stores order-to-delivery-staff assignments.

Important fields:

- `id`
- `order_id`
- `delivery_staff_id`
- `status`
- `assigned_at`
- `picked_up_at`
- `delivered_at`

## Coupons And Promotions Tables

### `coupons`

Stores coupon codes.

Important fields:

- `id`
- `code`
- `discount_type`
- `discount_value`
- `minimum_order_value`
- `usage_limit`
- `starts_at`
- `expires_at`
- `status`

### `coupon_redemptions`

Tracks coupon usage.

Important fields:

- `id`
- `coupon_id`
- `customer_id`
- `order_id`
- `discount_amount`

### `promotions`

Stores product or category promotions.

Important fields:

- `id`
- `name`
- `type`
- `starts_at`
- `ends_at`
- `status`

### `promotion_targets`

Stores product or category links for promotions.

## Customer Support Tables

### `support_conversations`

Stores customer support conversations.

Important fields:

- `id`
- `customer_id`
- `guest_id`
- `order_id`
- `status`
- `assigned_admin_id`
- `last_message_at`

### `support_messages`

Stores support chat messages.

Important fields:

- `id`
- `conversation_id`
- `sender_type`
- `sender_customer_id`
- `sender_admin_id`
- `body`
- `message_type`
- `delivered_at`
- `read_at`

### `support_attachments`

Stores support chat attachment metadata.

### `support_quick_replies`

Stores reusable support replies.

### `support_conversation_events`

Tracks assignment, status changes, and internal notes.

## Notifications Tables

### `notification_templates`

Stores templates for email, WhatsApp, and SMS.

### `notification_jobs`

Stores queued notification records.

Important fields:

- `id`
- `channel`
- `recipient`
- `template_id`
- `payload`
- `status`
- `scheduled_at`
- `sent_at`

### `notification_preferences`

Stores customer notification preferences.

## Future Optional AI Shopping Tables

AI shopping is not part of the first production version. The tables below should only be added later if AI shopping is approved.

### `ai_sessions`

Stores AI shopping sessions.

Important fields:

- `id`
- `customer_id`
- `guest_id`
- `session_type`
- `status`

### `ai_messages`

Stores customer and assistant messages for AI shopping.

### `ai_cart_suggestions`

Stores generated product suggestions.

Important fields:

- `id`
- `ai_session_id`
- `product_id`
- `variant_id`
- `reason`
- `quantity`
- `accepted_at`
- `rejected_at`

### `ai_substitution_suggestions`

Stores substitution recommendations for unavailable products.

## Audit Tables

### `admin_audit_logs`

Tracks sensitive admin actions.

Important fields:

- `id`
- `admin_user_id`
- `action`
- `resource_type`
- `resource_id`
- `metadata`
- `created_at`

### `system_events`

Stores important system-level events.

Examples:

- Order placed.
- Payment failed.
- Inventory reserved.
- Delivery assigned.
- Support conversation resolved.

## Suggested Relationships

- Customer has many addresses.
- Customer has many orders.
- Customer has many support conversations.
- Category has many products.
- Product has many images, badges, variants, reviews, and inventory records.
- Cart has many cart items.
- Order has many order items, payments, status history, and delivery assignments.
- Inventory item has many batches and adjustments.
- Delivery zone has many delivery slots.
- Support conversation has many support messages and events.
- Admin user has many roles through `admin_user_roles`.
- Role has many permissions through `admin_role_permissions`.

## Data To Mirror Into Meilisearch

Meilisearch should index:

- Product ID.
- Product name.
- Slug.
- Description.
- Category.
- Brand.
- Unit label.
- Price.
- Sale price.
- Badges.
- Stock status.
- Featured status.
- Search keywords.

## Data To Keep In Redis

Redis can support:

- OTP expiry.
- Rate limits.
- Cart/session cache.
- Chat presence.
- Typing indicators.
- Unread counters.
- BullMQ queues.
- Temporary delivery slot holds.

## Next Schema Step

After approval, convert this plan into a Prisma schema plan with exact models, enums, relations, indexes, and constraints.
