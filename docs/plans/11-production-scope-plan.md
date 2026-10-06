# Production Scope Plan

## Project Direction

This project will be planned as a full production-level grocery ecommerce platform, not an MVP demo.

The system should support a modern customer shopping website, a complete admin panel, CQRS backend architecture, detailed inventory, advanced delivery, realtime customer support, and scalable database/search infrastructure.

## Repository Structure

Use a full modular monorepo.

```txt
apps/
  web/
  admin/
  api/
packages/
  ui/
  types/
  config/
  utils/
```

## Customer Checkout

Customers should be allowed to checkout as guests.

Recommended flow:

1. Customer shops without logging in.
2. Customer enters phone number during checkout.
3. Customer verifies by OTP when required.
4. Customer places order.
5. Customer is encouraged to create an account after order confirmation.

## Payments

Initial production planning:

- Cash on delivery.
- Mock online payment flow for development and testing.

Later payment upgrade:

- Razorpay.
- Cash on delivery.

## Authentication

### Customer Authentication

- Phone OTP login.
- Guest checkout allowed.
- Optional account creation after checkout.

### Admin Authentication

- Email and password.
- Two-factor authentication.
- Role-based access control.

## Product Images

Admins should be able to upload and manage product images from the admin panel.

Development approach:

- Use placeholder or local images while building.

Production approach:

- Store product images in Cloudflare R2 or AWS S3.

## Inventory

Use detailed inventory from the start.

Inventory should include:

- Stock count.
- Low-stock alerts.
- Out-of-stock status.
- Stock adjustments.
- Purchase entries.
- Supplier tracking.
- Batch tracking.
- Expiry dates.
- Inventory audit logs.

## Delivery

Use advanced delivery planning.

Delivery should include:

- Delivery zones.
- Delivery fees.
- Slot capacity.
- Same-day delivery.
- Order cutoff time.
- Delivery staff assignment.
- Delivery status tracking.
- Admin delivery management.

## Customer Support

Support should include admin chat, email notifications, WhatsApp notifications, and SMS notifications.

Support scope:

- Customer chatbox.
- Admin support inbox.
- Realtime messages.
- Email notifications.
- WhatsApp notifications.
- SMS notifications.
- Unread message counts.
- Conversation assignment.
- Pending and resolved statuses.

## Future Optional AI Features

AI shopping features are not part of the first production version.

They can be considered later only if the user/client approves them.

Possible future AI features:

- AI weekly cart builder.
- Meal-plan-to-cart.
- Smart substitutions.
- Dietary shopping assistant.
- Product recommendations.

## Admin Roles

Role-based access control should be included from the start.

Planned roles:

- Owner.
- Store manager.
- Product manager.
- Inventory staff.
- Support agent.
- Delivery staff.

## Data, Cache, And Search

Use PostgreSQL, Redis, and Meilisearch from the start.

### PostgreSQL

Primary relational database for:

- Products.
- Categories.
- Customers.
- Orders.
- Inventory.
- Payments.
- Coupons.
- Delivery.
- Support conversations.
- Admin users.
- Audit logs.

### Redis

Use Redis for:

- Cache.
- Cart/session support.
- Realtime support state.
- Queues.
- Rate limiting.
- OTP expiry.

### Meilisearch

Use Meilisearch for:

- Product search.
- Filters.
- Sorting.
- Typo-tolerant search.
- Fast category search.

## Website And App Experience

First production launch should include:

- Responsive website.
- PWA support.

Native mobile app can be planned later if the client needs it.

## First Production Build Priorities

1. Customer storefront.
2. Product catalog.
3. Category and search.
4. Cart.
5. Checkout.
6. Guest checkout and phone OTP.
7. Orders.
8. Admin panel.
9. Product management.
10. Detailed inventory.
11. Advanced delivery.
12. Support chat and notifications.
13. RBAC.
14. PWA support.

## Important Note

This scope is large and production-grade. Before coding begins, the next planning documents should define the database schema, routes, CQRS commands/queries/events, design system, authentication rules, order flow, and support flow in more detail.
