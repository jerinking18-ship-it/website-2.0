# Modular Architecture Plan

## Goal

Build the grocery ecommerce platform as separate modules so each business area is clear, maintainable, and scalable.

This project should not be built as one large mixed codebase. Products, search, checkout, admin dashboard, support, orders, and every major feature should have its own module.

## Why Modular Architecture

- Easier to build feature by feature.
- Easier to test and maintain.
- Easier to scale later.
- Cleaner separation between customer features and admin features.
- Better fit for CQRS.
- Easier for multiple developers to work on the project.

## Customer Website Modules

### Home Module

Responsibilities:

- Homepage shopping surface.
- Featured categories.
- Featured deals.
- Popular products.
- Personalized sections later.

### Product Module

Responsibilities:

- Product listing.
- Product detail page or drawer.
- Product cards.
- Product images.
- Product badges.
- Product variants later.

### Category Module

Responsibilities:

- Category pages.
- Category navigation.
- Category filters.
- Featured category ordering.

### Search Module

Responsibilities:

- Search bar.
- Search results page.
- Filters.
- Sorting.
- Recent searches.
- Popular searches.
- Voice search placeholder later.

### Cart Module

Responsibilities:

- Add to cart.
- Remove from cart.
- Update quantity.
- Cart drawer.
- Cart summary.
- Free delivery progress.
- Suggested add-ons.

### Checkout Module

Responsibilities:

- Address step.
- Delivery slot step.
- Payment method step.
- Order review step.
- Checkout validation.
- Confirmation state.

### Order Module

Responsibilities:

- Order creation.
- Order history.
- Order status.
- Order tracking later.
- Reorder previous basket.

### Customer Account Module

Responsibilities:

- Customer profile.
- Saved addresses.
- Previous orders.
- Preferences.
- Subscriptions later.

### Support Chat Module

Responsibilities:

- Customer chatbox.
- Start support conversation.
- Send and receive messages.
- Conversation history.
- Typing indicator.
- Read or delivery status.

## Admin Panel Modules

### Admin Dashboard Module

Responsibilities:

- Revenue overview.
- Today's orders.
- Pending deliveries.
- Low-stock alerts.
- Open support chats.
- Top-selling products.

### Admin Product Module

Responsibilities:

- Add product.
- Edit product.
- Upload product image.
- Set price.
- Set discount.
- Set stock.
- Assign category.
- Set badges.
- Activate or deactivate product.

### Admin Category Module

Responsibilities:

- Create category.
- Edit category.
- Reorder categories.
- Mark featured categories.
- Hide inactive categories.

### Admin Order Module

Responsibilities:

- View orders.
- Filter orders by status.
- Open order details.
- Update order status.
- Cancel order.
- Assign delivery slot.
- Handle refund workflow later.

### Admin Inventory Module

Responsibilities:

- View stock levels.
- Update stock.
- Show low-stock alerts.
- Show out-of-stock products.
- Track inventory adjustments.

### Admin Customer Module

Responsibilities:

- View customer list.
- View customer profile.
- View order history.
- View support history.
- Manage customer status.

### Admin Coupon Module

Responsibilities:

- Create coupon.
- Edit coupon.
- Pause coupon.
- Set discount type.
- Set usage limit.
- Set expiry date.
- Connect coupon to products or categories.

### Admin Delivery Module

Responsibilities:

- Manage delivery zones.
- Manage delivery slots.
- Manage delivery fees.
- Manage delivery capacity.
- Pause unavailable slots.

### Admin Support Module

Responsibilities:

- Support inbox.
- Live conversation thread.
- Customer details panel.
- Agent assignment.
- Conversation status.
- Quick replies.
- Search support history.

### Admin Staff Module

Responsibilities:

- Admin users.
- Roles.
- Permissions.
- Staff activity later.

### Admin Settings Module

Responsibilities:

- Store profile.
- Payment settings.
- Tax settings.
- Notification settings.
- Support settings.
- Delivery rules.

## Backend CQRS Modules

The backend should use NestJS modules that match the main business domains.

Recommended backend modules:

- Auth Module
- Products Module
- Categories Module
- Search Module
- Cart Module
- Checkout Module
- Orders Module
- Payments Module
- Inventory Module
- Customers Module
- Coupons Module
- Delivery Module
- Support Module
- Admin Module
- Notifications Module
- Files And Media Module

## CQRS Module Structure

Each backend module should follow a consistent structure.

Example:

```txt
products/
  commands/
    create-product.command.ts
    update-product.command.ts
    delete-product.command.ts
  handlers/
    create-product.handler.ts
    update-product.handler.ts
    delete-product.handler.ts
  queries/
    get-product.query.ts
    list-products.query.ts
    search-products.query.ts
  query-handlers/
    get-product.handler.ts
    list-products.handler.ts
    search-products.handler.ts
  events/
    product-created.event.ts
    product-updated.event.ts
  dto/
    create-product.dto.ts
    update-product.dto.ts
  repositories/
    products.repository.ts
  products.controller.ts
  products.module.ts
```

## Frontend Module Structure

For the customer website:

```txt
apps/web/
  modules/
    home/
    products/
    categories/
    search/
    cart/
    checkout/
    orders/
    account/
    support-chat/
```

For the admin panel:

```txt
apps/admin/
  modules/
    dashboard/
    products/
    categories/
    orders/
    inventory/
    customers/
    coupons/
    delivery/
    support/
    staff/
    settings/
```

## Shared Packages

Use shared packages for reusable logic and UI.

Recommended packages:

```txt
packages/
  ui/
  types/
  config/
  utils/
```

### `packages/ui`

Shared buttons, inputs, tables, dialogs, drawers, badges, cards, and layout primitives.

### `packages/types`

Shared TypeScript types for products, carts, orders, customers, support messages, and admin data.

### `packages/config`

Shared linting, formatting, TypeScript, and Tailwind configuration.

### `packages/utils`

Shared formatting helpers, price utilities, validation helpers, and date utilities.

## Recommended Development Order

1. Build customer home, product, category, search, cart, and checkout modules.
2. Build backend product, category, search, cart, checkout, and order modules.
3. Build admin dashboard, product, order, and inventory modules.
4. Build customer support chat and admin support modules.
5. Build coupon, delivery, customer, staff, settings, and notification modules.

## Future Optional AI Modules

AI shopping is not part of the first production build. If approved later, add separate customer and backend modules for AI cart suggestions, meal-plan-to-cart, smart substitutions, and product recommendations.

## Important Rule

Keep each module responsible for its own feature area. Avoid mixing product logic into checkout, support logic into orders, or admin logic into customer-facing modules.
