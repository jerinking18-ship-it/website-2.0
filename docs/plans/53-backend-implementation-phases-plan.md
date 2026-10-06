# Backend Implementation Phases Plan

## Goal

Define the proper backend implementation phases for the FreshCart grocery ecommerce platform.

This plan must match the current frontend and admin panel. Backend work should replace frontend local state and dummy/browser persistence with real APIs, database persistence, CQRS commands/queries, validation, authorization, audit logging, and production-ready integrations.

## Current Rule

- Build locally first.
- No paid services are required for the first backend implementation.
- Use local PostgreSQL, local Redis, mock payment, and placeholder notification providers until production setup is approved.
- Do not remove current client/admin features while connecting backend.
- Follow the current frontend contract in `docs/plans/52-current-frontend-backend-contract-plan.md`.

## Phase 1: Backend Foundation

Purpose:

Create the real backend base before connecting any screens.

Work:

- Confirm NestJS app structure.
- Add proper environment config.
- Add PostgreSQL connection through Prisma.
- Add Redis config placeholder.
- Define shared response format.
- Define shared error format.
- Add request validation setup.
- Add global exception handling.
- Add health check endpoint.
- Add CQRS module/folder pattern.
- Add initial Prisma schema.
- Add seed structure.

First APIs:

```txt
GET /api/health
GET /api/version
```

Result:

Backend runs cleanly and is ready for real modules.

## Phase 2: Database Schema And Seed Data

Purpose:

Create database models matching the current client and admin modules.

Core schema areas:

- Customers.
- Customer addresses.
- Admin users.
- Roles and permissions.
- Categories.
- Products.
- Product images.
- Inventory.
- Branches.
- Cart.
- Wishlist.
- Checkout sessions.
- Orders.
- Payments.
- Coupons.
- Promotions.
- Support conversations.
- Notifications.
- Audit logs.
- Content pages.
- Storefront placements.

Seed data must include current frontend category slugs:

```txt
fresh-produce
dairy-and-eggs
staples
beverages
bakery
frozen
household
organic
snacks
personal-care
```

Result:

Database has real production-shaped tables and seed data matching the current frontend.

## Phase 3: Authentication, Sessions, And Permissions

Purpose:

Make customer and admin login real.

Customer auth:

- Phone OTP request.
- OTP verification.
- Customer session.
- Customer logout.
- Current customer profile.
- Google login can be added after base auth.

Admin auth:

- Email/password login.
- Two-factor verification.
- Admin session.
- Admin logout.
- Current admin profile.
- Role and permission checks.

Permissions:

- Products.
- Categories.
- Orders.
- Inventory.
- Suppliers.
- Delivery.
- Support.
- Coupons.
- Promotions.
- Refunds.
- Finance.
- Reports.
- Settings.
- Staff.
- Legal.
- Content.

Result:

Protected admin APIs and customer account APIs work securely.

## Phase 4: Catalog And Storefront APIs

Purpose:

Connect homepage, categories, products, product details, offers, and search to backend data.

Customer APIs:

```txt
GET /api/storefront
GET /api/categories
GET /api/categories/:slug
GET /api/products
GET /api/products/:slug
GET /api/products/:slug/related
GET /api/products/:slug/frequently-bought-together
GET /api/search/products
GET /api/search/suggestions
GET /api/offers
```

Admin APIs:

```txt
GET /api/admin/products
POST /api/admin/products
PATCH /api/admin/products/:id
PATCH /api/admin/products/:id/status
POST /api/admin/products/bulk-status
GET /api/admin/categories
POST /api/admin/categories
PATCH /api/admin/categories/:id
POST /api/admin/categories/reorder
POST /api/admin/categories/publish-storefront
GET /api/admin/storefront
PATCH /api/admin/storefront/categories
PATCH /api/admin/storefront/promotions
PATCH /api/admin/storefront/coupons
PATCH /api/admin/storefront/banners
POST /api/admin/storefront/publish
```

Result:

Client storefront and admin catalog are database-backed.

## Phase 5: Cart, Wishlist, And Customer Account

Purpose:

Replace browser-only shopping/account state with real persistence.

Customer APIs:

```txt
GET /api/cart
POST /api/cart/items
PATCH /api/cart/items/:id
DELETE /api/cart/items/:id
POST /api/cart/apply-coupon
DELETE /api/cart/coupon
GET /api/wishlist
POST /api/wishlist/items
DELETE /api/wishlist/items/:productId
POST /api/wishlist/items/:productId/price-watch
POST /api/wishlist/items/:productId/back-in-stock
GET /api/auth/customer/me
PATCH /api/account/profile
GET /api/account/addresses
POST /api/account/addresses
PATCH /api/account/addresses/:id
DELETE /api/account/addresses/:id
PATCH /api/account/addresses/:id/default
GET /api/account/wallet
GET /api/account/loyalty
GET /api/account/notifications
PATCH /api/account/notifications
```

Result:

Cart, wishlist, account, saved addresses, wallet, loyalty, and notifications survive refresh and devices.

## Phase 6: Checkout And Orders

Purpose:

Make checkout and order creation real.

Checkout APIs:

```txt
POST /api/checkout/start
PATCH /api/checkout/address
PATCH /api/checkout/delivery-slot
PATCH /api/checkout/instructions
PATCH /api/checkout/payment-method
POST /api/checkout/validate-coupon
POST /api/checkout/validate
POST /api/checkout/place-order
GET /api/checkout/:checkoutId
GET /api/checkout/:checkoutId/summary
```

Order APIs:

```txt
GET /api/orders
GET /api/orders/:orderNumber
GET /api/orders/:orderNumber/tracking
GET /api/orders/:orderNumber/invoice
POST /api/orders/:orderNumber/cancel
POST /api/orders/:orderNumber/reorder
POST /api/orders/:orderNumber/refund-request
POST /api/orders/:orderNumber/return-request
```

Rules:

- Validate address.
- Validate coupon.
- Validate delivery slot capacity.
- Reserve inventory before order placement.
- Release reservations on failed payment or expired checkout.
- Preserve order item snapshots.

Result:

Customer can place, confirm, view, track, cancel, reorder, and request refund/return for real orders.

## Phase 7: Inventory, Branches, Suppliers, And Serviceability

Purpose:

Make grocery operations real.

Admin APIs:

```txt
GET /api/admin/inventory
POST /api/admin/inventory/purchase-entries
POST /api/admin/inventory/adjustments
POST /api/admin/inventory/batches
GET /api/admin/inventory/ledger
GET /api/admin/suppliers
POST /api/admin/suppliers
PATCH /api/admin/suppliers/:id
POST /api/admin/suppliers/:id/purchase-orders
PATCH /api/admin/purchase-orders/:id
PATCH /api/admin/supplier-payments/:id
GET /api/admin/branches
POST /api/admin/branches
PATCH /api/admin/branches/:id
```

Customer APIs:

```txt
GET /api/serviceability/check
GET /api/serviceability/branches
GET /api/serviceability/products/:productId
POST /api/serviceability/save-location
```

Result:

Stock, batches, expiry, suppliers, purchase orders, branches, and pincode/area serviceability work from database records.

## Phase 8: Admin Operations

Purpose:

Power all admin modules with real query and command handlers.

Admin APIs:

```txt
GET /api/admin/dashboard/summary
GET /api/admin/dashboard/operations
GET /api/admin/dashboard/alerts
GET /api/admin/orders
GET /api/admin/orders/:id
PATCH /api/admin/orders/:id/status
POST /api/admin/orders/:id/confirm
POST /api/admin/orders/:id/mark-packed
POST /api/admin/orders/:id/assign-delivery
GET /api/admin/customers
GET /api/admin/customers/:id
PATCH /api/admin/customers/:id/status
GET /api/admin/coupons
POST /api/admin/coupons
PATCH /api/admin/coupons/:id
GET /api/admin/promotions
POST /api/admin/promotions
PATCH /api/admin/promotions/:id
GET /api/admin/refunds
PATCH /api/admin/refunds/:id
GET /api/admin/reports
POST /api/admin/reports/export
GET /api/admin/settings
PATCH /api/admin/settings/:section
```

Result:

Admin panel becomes real operations software instead of local editable state.

## Phase 9: Support Chat And Notifications

Purpose:

Make customer support and notifications production-ready.

Support APIs:

```txt
GET /api/support/conversations
POST /api/support/conversations
GET /api/support/conversations/:id/messages
POST /api/support/conversations/:id/messages
GET /api/admin/support/conversations
GET /api/admin/support/conversations/:id
POST /api/admin/support/conversations/:id/messages
PATCH /api/admin/support/conversations/:id/status
PATCH /api/admin/support/conversations/:id/assignee
POST /api/contact/messages
```

WebSocket namespace:

```txt
/ws/support
```

Notification channels:

- In-app.
- Email.
- WhatsApp.
- SMS.

Result:

Customer support chat works live between customer and admin, with notification history.

## Phase 10: Delivery Tracking

Purpose:

Build premium tracking like Zepto/Zomato.

Admin APIs:

```txt
GET /api/admin/delivery/assignments
POST /api/admin/delivery/assignments
PATCH /api/admin/delivery/assignments/:id
GET /api/admin/delivery/partners
POST /api/admin/delivery/partners
GET /api/admin/delivery/live-map
```

Customer APIs:

```txt
GET /api/orders/:orderNumber/tracking
```

WebSocket namespace:

```txt
/ws/delivery
```

Data:

- Delivery assignment.
- Delivery partner.
- Location pings.
- ETA.
- Timeline.
- Nearby state.

Result:

Customer can see delivery location and order movement in real time.

## Phase 11: Payments, Refunds, Wallet, And Finance

Purpose:

Make money movement real and auditable.

Payment flow:

- COD first.
- Mock online payment for development.
- Razorpay later.

APIs:

```txt
POST /api/payments/mock/start
POST /api/payments/mock/confirm
POST /api/webhooks/razorpay
GET /api/admin/finance/summary
GET /api/admin/finance/payments
PATCH /api/admin/finance/payments/:id
GET /api/admin/finance/invoices
POST /api/admin/refunds/:id/approve
POST /api/admin/refunds/:id/reject
```

Result:

Payments, COD collection, refunds, wallet credits, invoices, and finance reports are tracked properly.

## Phase 12: Content, Legal, Integrations, And System Health

Purpose:

Let admin control content and operational settings without code changes.

APIs:

```txt
GET /api/content/pages/about
GET /api/content/pages/privacy
GET /api/content/pages/terms
GET /api/content/pages/refund-policy
GET /api/content/pages/shipping-policy
GET /api/admin/content
POST /api/admin/content
PATCH /api/admin/content/:id
POST /api/admin/content/:id/publish
GET /api/admin/legal
PATCH /api/admin/legal/:id
GET /api/admin/integrations
PATCH /api/admin/integrations/:id
GET /api/admin/system-health
POST /api/admin/system-health/checks/run
```

Result:

Website content, legal pages, integrations, and health checks are managed from admin.

## Phase 13: Production Hardening

Purpose:

Prepare backend for real launch.

Work:

- DTO validation for every endpoint.
- Rate limiting.
- Security headers.
- CORS rules.
- Admin audit logging.
- Structured logging.
- Error monitoring.
- Database backups.
- Migration process.
- OpenAPI documentation.
- Integration tests.
- Load testing for major APIs.
- Staging and production environment separation.

Result:

Backend is safe enough for production deployment planning.

## Recommended Build Order

Start in this order:

1. Phase 1: Backend Foundation.
2. Phase 2: Database Schema And Seed Data.
3. Phase 3: Authentication, Sessions, And Permissions.
4. Phase 4: Catalog And Storefront APIs.
5. Phase 5: Cart, Wishlist, And Customer Account.

Do not start integrations like Razorpay, WhatsApp, SMS, maps, or cloud storage until the core database and APIs are stable.
