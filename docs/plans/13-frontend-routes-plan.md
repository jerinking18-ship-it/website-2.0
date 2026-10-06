# Frontend Routes Plan

## Goal

Define the production frontend routes for the customer grocery website, admin panel, authentication flows, support chat, and future PWA behavior.

The project uses a modular monorepo:

```txt
apps/web
apps/admin
apps/api
packages/ui
packages/types
```

## Customer Website Routes

### `/`

Home shopping page.

Purpose:

- Show the primary grocery shopping experience.
- Display search, location, categories, deals, product grid, cart access, and support chat.

Key modules:

- Home.
- Products.
- Categories.
- Search.
- Cart.
- Support chat.

### `/categories`

All categories page.

Purpose:

- Show grocery categories and featured collections.

### `/categories/[slug]`

Category product listing page.

Purpose:

- Show products in one category.
- Support filters, sorting, quick add, and pagination or infinite scroll.

Example:

```txt
/categories/fresh-produce
/categories/dairy-and-eggs
/categories/staples
```

### `/products`

All products listing page.

Purpose:

- Browse all products.
- Support filters and sorting.

### `/products/[slug]`

Product detail page.

Purpose:

- Show product details, images, price, stock, delivery info, related products, and add-to-cart controls.

### `/search`

Search results page.

Purpose:

- Show product search results.
- Support query, filters, sort, category filter, and typo-tolerant results from Meilisearch.

Example:

```txt
/search?q=milk
```

### `/cart`

Cart page.

Purpose:

- Show cart items, quantity controls, savings, delivery fee, free delivery progress, and suggested add-ons.

Note:

- The site should also use a cart drawer for quick access.

### `/checkout`

Checkout shell route.

Purpose:

- Guide the customer through checkout.

### `/checkout/address`

Address step.

Purpose:

- Enter or select delivery address.

### `/checkout/delivery`

Delivery step.

Purpose:

- Select delivery slot and delivery zone.

### `/checkout/payment`

Payment step.

Purpose:

- Select cash on delivery or mock online payment during development.
- Support Razorpay later.

### `/checkout/review`

Review step.

Purpose:

- Review cart, address, delivery slot, payment method, and total.

### `/checkout/confirmation/[orderNumber]`

Order confirmation page.

Purpose:

- Show order success.
- Encourage account creation.
- Show delivery estimate and support access.

### `/orders`

Customer order history page.

Purpose:

- Show past orders for logged-in customers.

### `/orders/[orderNumber]`

Customer order detail page.

Purpose:

- Show order items, status, delivery info, payment status, and support link.

### `/account`

Customer account overview.

Purpose:

- Show profile, saved addresses, orders, preferences, and subscriptions later.

### `/account/profile`

Customer profile page.

### `/account/addresses`

Saved addresses page.

### `/account/preferences`

Customer preferences page.

Purpose:

- Dietary preferences.
- Notification preferences.

### `/support`

Customer support page.

Purpose:

- Show support options and conversation history.

Note:

- A floating chatbox should be available globally.

### `/offers`

Deals and promotions page.

Purpose:

- Show active discounts, coupons, and offers.

### `/about`

About page.

Purpose:

- Brand story, freshness guarantee, supplier promise, and delivery standards.

### `/contact`

Contact page.

Purpose:

- Contact details, support information, and delivery area information.

### `/policies/privacy`

Privacy policy page.

### `/policies/terms`

Terms and conditions page.

### `/policies/refund`

Refund and freshness policy page.

## Customer Authentication Routes

### `/auth/phone`

Phone login route.

Purpose:

- Enter phone number.
- Request OTP.

### `/auth/verify`

OTP verification route.

Purpose:

- Verify phone OTP.

### `/auth/logout`

Logout route.

## Admin Panel Routes

Admin routes live in `apps/admin`.

### `/admin/login`

Admin login page.

Purpose:

- Email and password login.
- Start 2FA flow.

### `/admin/verify-2fa`

Admin 2FA verification page.

### `/admin/dashboard`

Admin dashboard page.

Purpose:

- Today's orders.
- Revenue.
- Pending deliveries.
- Low-stock products.
- Open support chats.
- Recent orders.
- Top products.

### `/admin/products`

Product management page.

Purpose:

- Product table.
- Filters.
- Search.
- Add product.
- Edit product.
- Bulk actions.

### `/admin/products/new`

Create product page.

### `/admin/products/[id]`

Product detail and edit page.

### `/admin/categories`

Category management page.

Purpose:

- Create, edit, reorder, and activate categories.

### `/admin/orders`

Order management page.

Purpose:

- View and filter orders.
- Update status.
- Open order details.

### `/admin/orders/[id]`

Order detail page.

Purpose:

- Order items.
- Customer details.
- Payment status.
- Delivery details.
- Status history.
- Support link.

### `/admin/inventory`

Inventory overview page.

Purpose:

- Stock levels.
- Low-stock alerts.
- Out-of-stock products.
- Quick adjustments.

### `/admin/inventory/batches`

Inventory batch page.

Purpose:

- Batch tracking.
- Expiry dates.
- Supplier entries.

### `/admin/inventory/adjustments`

Inventory adjustment history.

### `/admin/suppliers`

Supplier management page.

### `/admin/customers`

Customer management page.

### `/admin/customers/[id]`

Customer detail page.

Purpose:

- Profile.
- Addresses.
- Orders.
- Support history.
- Preferences.

### `/admin/coupons`

Coupon management page.

### `/admin/coupons/new`

Create coupon page.

### `/admin/promotions`

Promotions management page.

### `/admin/delivery`

Delivery overview page.

Purpose:

- Delivery zones.
- Slot capacity.
- Delivery fees.
- Same-day settings.

### `/admin/delivery/zones`

Delivery zones management page.

### `/admin/delivery/slots`

Delivery slots management page.

### `/admin/delivery/assignments`

Delivery staff assignments page.

### `/admin/support`

Support inbox page.

Purpose:

- Live support conversation list.
- Chat thread.
- Customer/order context panel.
- Assignment.
- Pending/resolved states.

### `/admin/support/[conversationId]`

Support conversation detail route.

### `/admin/notifications`

Notifications page.

Purpose:

- Email, WhatsApp, and SMS notification jobs.
- Notification templates.

### `/admin/staff`

Staff management page.

Purpose:

- Admin users.
- Roles.
- Permissions.

### `/admin/settings`

Settings overview.

### `/admin/settings/store`

Store profile settings.

### `/admin/settings/payments`

Payment settings.

### `/admin/settings/taxes`

Tax settings.

### `/admin/settings/support`

Support settings.

### `/admin/settings/delivery`

Delivery settings.

## Global UI Surfaces

### Customer Website Global Surfaces

- Header.
- Search bar.
- Location selector.
- Cart drawer.
- Floating support chatbox.
- Mobile bottom cart bar.
- PWA install prompt.

### Admin Global Surfaces

- Sidebar.
- Top bar.
- Global admin search.
- Notifications menu.
- User profile menu.
- Table filters.
- Detail drawers.
- Create/edit modals.

## Route Protection

### Public Routes

- `/`
- `/categories`
- `/categories/[slug]`
- `/products`
- `/products/[slug]`
- `/search`
- `/offers`
- `/about`
- `/contact`
- policy pages

### Guest Checkout Routes

Checkout routes are accessible to guests, but phone verification may be required before final order placement.

### Customer Protected Routes

- `/account`
- `/orders`
- saved addresses
- preferences

### Admin Protected Routes

All `/admin/*` routes except `/admin/login` and `/admin/verify-2fa`.

## Recommended First Route Build Order

1. Customer home and product browsing.
2. Search and category pages.
3. Cart and checkout.
4. Customer order confirmation and order detail.
5. Admin login and dashboard.
6. Admin products and categories.
7. Admin orders and inventory.
8. Customer support chat and admin support inbox.
9. Delivery, coupons, and notifications routes.
10. Settings, staff, and audit-related screens.

## Future Optional AI Routes

AI shopping routes are not part of the first production version. If approved later, possible routes include:

- `/ai-shopping`
- `/admin/ai`
