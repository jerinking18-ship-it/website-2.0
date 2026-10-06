# Technical Architecture

## Architecture Recommendation

Build the production system with a CQRS architecture so shopping actions, order processing, product browsing, support chat, and admin workflows stay cleanly separated.

For a first clickable prototype, a static or front-end-only version can still be created quickly. For the full ecommerce platform, use the stack below.

## Recommended Production Stack

- Frontend: Next.js, React, TypeScript.
- Styling: Tailwind CSS and shadcn/ui.
- Backend: NestJS with CQRS module.
- Database: PostgreSQL.
- ORM: Prisma.
- Cache and sessions: Redis.
- Queue: BullMQ with Redis, or RabbitMQ for larger scale.
- Search: Meilisearch first, Algolia if managed hosted search is preferred.
- Storage: Cloudflare R2 or AWS S3 for product images.
- Payments: Razorpay, Stripe, and optional cash on delivery.
- Realtime communication: NestJS WebSocket Gateway.

## Frontend App Structure

For a professional production build, use a structure that separates the customer storefront, admin panel, backend, and shared packages.

Recommended monorepo structure:

- `apps/web`: customer grocery ecommerce website.
- `apps/admin`: admin panel.
- `apps/api`: NestJS CQRS backend.
- `packages/ui`: shared UI components.
- `packages/types`: shared TypeScript types.

For a faster first build, the customer and admin routes can start in one Next.js app and be separated later.

## Modular Architecture

The project should be built as separate modules for each major business area.

Customer-facing modules:

- Home.
- Products.
- Categories.
- Search.
- Cart.
- Checkout.
- Orders.
- Customer account.
- Support chat.

Admin modules:

- Dashboard.
- Products.
- Categories.
- Orders.
- Inventory.
- Customers.
- Coupons.
- Delivery.
- Support.
- Staff.
- Settings.

Backend CQRS modules:

- Auth.
- Products.
- Categories.
- Search.
- Cart.
- Checkout.
- Orders.
- Payments.
- Inventory.
- Customers.
- Coupons.
- Delivery.
- Support.
- Admin.
- Notifications.
- Files and media.

See [Modular Architecture Plan](./10-modular-architecture-plan.md) for the full module breakdown.

AI shopping is future optional only and should not be included in the first production architecture.

## Admin Panel Technical Needs

The admin panel should use:

- Next.js and TypeScript.
- Tailwind CSS and shadcn/ui.
- TanStack Table for products, orders, inventory, customers, and support lists.
- React Hook Form and Zod for admin forms.
- Role-based access control.
- Protected admin routes.
- Realtime support inbox through WebSockets.
- Optimistic updates for fast operational actions where appropriate.

## CQRS Plan

CQRS separates write operations from read operations.

### Command Side

The command side handles actions that change data:

- Create cart.
- Add item to cart.
- Remove item from cart.
- Apply coupon.
- Create order.
- Reserve inventory.
- Confirm payment.
- Cancel order.
- Update product.
- Update inventory.
- Select delivery slot.
- Start support conversation.
- Send support message.
- Assign support agent.
- Resolve support conversation.

### Query Side

The query side handles fast reads:

- Product listing.
- Product search.
- Product details.
- Category pages.
- Cart summary.
- Checkout summary.
- Order history.
- Admin dashboard metrics.
- Inventory views.
- Support inbox.
- Conversation messages.
- Unread support counts.

## Customer Support Chat Architecture

Use WebSocket communication for live chat between customers and support staff.

### Customer Chatbox

The customer-facing website should include:

- Floating support chatbox.
- Start conversation flow.
- Live message sending and receiving.
- Typing indicator.
- Message delivery or read status.
- Conversation history.

### Admin Support Inbox

The admin panel should include:

- Live support inbox.
- Open, pending, and resolved conversation filters.
- Customer conversation timeline.
- Agent assignment.
- Reply box.
- Unread message indicators.
- Conversation search.

### Chat Data Storage

PostgreSQL should store:

- Support conversations.
- Support messages.
- Support agents.
- Support assignments.
- Message read receipts.

Redis can support:

- Online presence.
- Typing state.
- Fast unread counters.
- WebSocket scaling.

## Future Production Stack Options

If the client wants a full operational grocery platform, future phases can add:

- Product database.
- Admin dashboard.
- Customer accounts.
- Inventory management.
- Payment gateway.
- Order management.
- Delivery management.
- Email and SMS notifications.

## Data Strategy

Product data should live in PostgreSQL for the production version. For early demos, product data can be mocked in code.

Later admin-friendly product updates can be managed through:

- A database.
- A CMS.
- Airtable.
- Google Sheets.
- A custom admin panel.

## Payment Strategy

Version 1 should use a checkout preview. Production checkout can integrate:

- Stripe.
- Razorpay.
- Cash on delivery.
- UPI.
- Card payments.

## Deployment Strategy

The first version should be deployed as a private preview. After client approval, it can be moved to a custom domain.

## Recommended Build Approach

1. Build a clickable ecommerce prototype first.
2. Build the production backend with NestJS CQRS.
3. Add PostgreSQL schema and Prisma models.
4. Add product, cart, order, and checkout modules.
5. Add customer support chatbox.
6. Add admin support inbox.
7. Add admin dashboard, product management, order management, and inventory management.
8. Add payment and inventory workflows.
9. Deploy staging, then production.
