# API Endpoint Details Plan

## Goal

Define the main REST API endpoints for the grocery ecommerce platform.

This plan maps frontend and admin screens to backend endpoints, including auth requirements and permissions.

## API Principles

- Use REST APIs first.
- Keep endpoints grouped by module.
- Use server-side permission checks.
- Do not rely only on frontend permissions.
- Use WebSockets only for realtime support chat and live delivery tracking.
- Keep request and response shapes consistent.
- Use pagination for large lists.

## Common API Rules

### Pagination

List endpoints should support:

```txt
page
limit
sort
direction
```

### Filtering

List endpoints should support module-specific filters.

Examples:

```txt
status
category
date_from
date_to
search
```

### Response Format

Recommended success format:

```json
{
  "data": {},
  "meta": {}
}
```

Recommended error format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

## Customer Auth Endpoints

### `POST /api/auth/customer/request-otp`

Purpose:

- Request phone OTP.

Auth:

- Public.

Body:

```json
{
  "phone": "+919999999999",
  "purpose": "login"
}
```

### `POST /api/auth/customer/verify-otp`

Purpose:

- Verify phone OTP and start customer session.

Auth:

- Public.

Body:

```json
{
  "phone": "+919999999999",
  "otp": "123456"
}
```

### `POST /api/auth/customer/logout`

Purpose:

- Logout customer.

Auth:

- Customer.

### `GET /api/auth/customer/me`

Purpose:

- Get current customer profile.

Auth:

- Customer.

## Admin Auth Endpoints

### `POST /api/admin/auth/login`

Purpose:

- Admin email/password login.

Auth:

- Public.

### `POST /api/admin/auth/verify-2fa`

Purpose:

- Verify admin 2FA.

Auth:

- Pending admin auth session.

### `POST /api/admin/auth/logout`

Purpose:

- Logout admin.

Auth:

- Admin.

### `GET /api/admin/auth/me`

Purpose:

- Get current admin user, roles, and permissions.

Auth:

- Admin.

## Public Catalog Endpoints

### `GET /api/categories`

Purpose:

- List active categories.

Auth:

- Public.

### `GET /api/categories/:slug`

Purpose:

- Get category detail.

Auth:

- Public.

### `GET /api/products`

Purpose:

- List products.

Auth:

- Public.

Query:

```txt
category
status
price_min
price_max
badges
in_stock
page
limit
sort
```

### `GET /api/products/:slug`

Purpose:

- Get product detail.

Auth:

- Public.

### `GET /api/search/products`

Purpose:

- Search products using Meilisearch.

Auth:

- Public.

Query:

```txt
q
category
filters
page
limit
sort
```

### `GET /api/offers`

Purpose:

- List public offers and promotions.

Auth:

- Public.

## Cart Endpoints

### `GET /api/cart`

Purpose:

- Get current guest or customer cart.

Auth:

- Guest or customer.

### `POST /api/cart/items`

Purpose:

- Add item to cart.

Auth:

- Guest or customer.

Body:

```json
{
  "product_id": "uuid",
  "variant_id": "uuid",
  "quantity": 1
}
```

### `PATCH /api/cart/items/:itemId`

Purpose:

- Update cart item quantity.

Auth:

- Guest or customer.

### `DELETE /api/cart/items/:itemId`

Purpose:

- Remove cart item.

Auth:

- Guest or customer.

### `POST /api/cart/apply-coupon`

Purpose:

- Apply coupon to cart.

Auth:

- Guest or customer.

### `DELETE /api/cart/coupon`

Purpose:

- Remove coupon from cart.

Auth:

- Guest or customer.

## Checkout Endpoints

### `POST /api/checkout/start`

Purpose:

- Start checkout session.

Auth:

- Guest or customer.

### `PATCH /api/checkout/address`

Purpose:

- Set checkout delivery address.

Auth:

- Guest or customer.

### `GET /api/checkout/delivery-slots`

Purpose:

- List available delivery slots for checkout address/zone.

Auth:

- Guest or customer.

### `PATCH /api/checkout/delivery-slot`

Purpose:

- Select delivery slot.

Auth:

- Guest or customer.

### `PATCH /api/checkout/payment-method`

Purpose:

- Select payment method.

Auth:

- Guest or customer.

### `GET /api/checkout/summary`

Purpose:

- Get checkout summary.

Auth:

- Guest or customer.

### `POST /api/checkout/place-order`

Purpose:

- Validate checkout, reserve inventory/slot, and place order.

Auth:

- Guest or customer.

## Customer Order Endpoints

### `GET /api/orders`

Purpose:

- List current customer's orders.

Auth:

- Customer.

### `GET /api/orders/:orderNumber`

Purpose:

- Get customer order detail.

Auth:

- Customer or secure guest order access.

### `POST /api/orders/:orderNumber/cancel`

Purpose:

- Request order cancellation when allowed.

Auth:

- Customer or secure guest order access.

## Customer Support Endpoints

### `GET /api/support/conversations`

Purpose:

- List customer support conversations.

Auth:

- Customer or guest support token.

### `POST /api/support/conversations`

Purpose:

- Start support conversation.

Auth:

- Guest or customer.

### `GET /api/support/conversations/:id/messages`

Purpose:

- List support messages.

Auth:

- Conversation participant.

### `POST /api/support/conversations/:id/messages`

Purpose:

- Send support message.

Auth:

- Conversation participant.

## Delivery Tracking Endpoints

### `GET /api/orders/:orderNumber/tracking`

Purpose:

- Get order tracking state for customer.

Auth:

- Customer or secure guest order access.

### `GET /api/orders/:orderNumber/tracking/map-token`

Purpose:

- Get scoped Mapbox token or configuration if needed.

Auth:

- Customer or secure guest order access.

## Admin Dashboard Endpoints

### `GET /api/admin/dashboard/summary`

Purpose:

- Get dashboard cards.

Auth:

- Admin.

Permission:

- `dashboard.read`

### `GET /api/admin/dashboard/recent-orders`

Purpose:

- Get recent orders list.

Auth:

- Admin.

## Admin Product Endpoints

### `GET /api/admin/products`

Purpose:

- List products for admin.

Permission:

- `products.read`

### `POST /api/admin/products`

Purpose:

- Create product.

Permission:

- `products.create`

### `GET /api/admin/products/:id`

Purpose:

- Get product detail for admin.

Permission:

- `products.read`

### `PATCH /api/admin/products/:id`

Purpose:

- Update product.

Permission:

- `products.update`

### `DELETE /api/admin/products/:id`

Purpose:

- Deactivate product.

Permission:

- `products.delete`

### `POST /api/admin/products/:id/images`

Purpose:

- Attach product image.

Permission:

- `products.upload_image`

## Admin Category Endpoints

### `GET /api/admin/categories`

Permission:

- `categories.manage`

### `POST /api/admin/categories`

Permission:

- `categories.manage`

### `PATCH /api/admin/categories/:id`

Permission:

- `categories.manage`

### `POST /api/admin/categories/reorder`

Permission:

- `categories.manage`

## Admin Order Endpoints

### `GET /api/admin/orders`

Purpose:

- List orders with filters.

Permission:

- `orders.read`

### `GET /api/admin/orders/:id`

Purpose:

- Get order detail.

Permission:

- `orders.read`

### `PATCH /api/admin/orders/:id/status`

Purpose:

- Update order status.

Permission:

- `orders.update_status`

### `POST /api/admin/orders/:id/cancel`

Purpose:

- Cancel order.

Permission:

- `orders.cancel`

### `POST /api/admin/orders/:id/assign-delivery`

Purpose:

- Assign delivery staff.

Permission:

- `orders.assign_delivery`

## Admin Inventory Endpoints

### `GET /api/admin/inventory`

Purpose:

- List inventory items.

Permission:

- `inventory.read`

### `GET /api/admin/inventory/:id`

Purpose:

- Get inventory item detail.

Permission:

- `inventory.read`

### `POST /api/admin/inventory/:id/adjustments`

Purpose:

- Create stock adjustment.

Permission:

- `inventory.adjust`

### `GET /api/admin/inventory/batches`

Purpose:

- List inventory batches.

Permission:

- `inventory.read`

### `POST /api/admin/inventory/batches`

Purpose:

- Create inventory batch.

Permission:

- `inventory.create_batch`

## Admin Supplier Endpoints

### `GET /api/admin/suppliers`

Permission:

- `inventory.manage_suppliers`

### `POST /api/admin/suppliers`

Permission:

- `inventory.manage_suppliers`

### `PATCH /api/admin/suppliers/:id`

Permission:

- `inventory.manage_suppliers`

## Admin Delivery Endpoints

### `GET /api/admin/delivery/zones`

Permission:

- `delivery.manage_zones`

### `POST /api/admin/delivery/zones`

Permission:

- `delivery.manage_zones`

### `GET /api/admin/delivery/slots`

Permission:

- `delivery.manage_slots`

### `POST /api/admin/delivery/slots`

Permission:

- `delivery.manage_slots`

### `GET /api/admin/delivery/assignments`

Permission:

- `delivery.read`

### `POST /api/admin/delivery/assignments`

Permission:

- `delivery.assign_staff`

### `PATCH /api/admin/delivery/assignments/:id/status`

Permission:

- `delivery.update_status`

## Delivery Staff Endpoints

### `GET /api/delivery-staff/assignments`

Purpose:

- List assigned deliveries for delivery staff.

Auth:

- Delivery staff.

### `POST /api/delivery-staff/assignments/:id/accept`

Purpose:

- Accept delivery assignment.

Auth:

- Delivery staff.

### `PATCH /api/delivery-staff/assignments/:id/status`

Purpose:

- Update delivery status.

Auth:

- Delivery staff.

### `POST /api/delivery-staff/assignments/:id/location`

Purpose:

- Send current delivery staff location.

Auth:

- Delivery staff.

## Admin Support Endpoints

### `GET /api/admin/support/conversations`

Permission:

- `support.read`

### `GET /api/admin/support/conversations/:id`

Permission:

- `support.read`

### `POST /api/admin/support/conversations/:id/messages`

Permission:

- `support.reply`

### `POST /api/admin/support/conversations/:id/assign`

Permission:

- `support.assign`

### `POST /api/admin/support/conversations/:id/resolve`

Permission:

- `support.resolve`

### `POST /api/admin/support/conversations/:id/pending`

Permission:

- `support.reply`

## Admin Customer Endpoints

### `GET /api/admin/customers`

Permission:

- `customers.read`

### `GET /api/admin/customers/:id`

Permission:

- `customers.read`

### `PATCH /api/admin/customers/:id`

Permission:

- `customers.update`

## Admin Coupon And Promotion Endpoints

### `GET /api/admin/coupons`

Permission:

- `coupons.read`

### `POST /api/admin/coupons`

Permission:

- `coupons.create`

### `PATCH /api/admin/coupons/:id`

Permission:

- `coupons.update`

### `POST /api/admin/coupons/:id/pause`

Permission:

- `coupons.pause`

### `GET /api/admin/promotions`

Permission:

- `promotions.manage`

### `POST /api/admin/promotions`

Permission:

- `promotions.manage`

## Admin Notification Endpoints

### `GET /api/admin/notifications/jobs`

Permission:

- `notifications.read`

### `POST /api/admin/notifications/jobs/:id/retry`

Permission:

- `notifications.retry`

### `GET /api/admin/notifications/templates`

Permission:

- `notifications.manage_templates`

### `PATCH /api/admin/notifications/templates/:id`

Permission:

- `notifications.manage_templates`

## Admin Staff And Role Endpoints

### `GET /api/admin/staff`

Permission:

- `staff.read`

### `POST /api/admin/staff`

Permission:

- `staff.create`

### `PATCH /api/admin/staff/:id`

Permission:

- `staff.update`

### `POST /api/admin/staff/:id/roles`

Permission:

- `staff.assign_roles`

### `GET /api/admin/roles`

Permission:

- `staff.read`

### `GET /api/admin/permissions`

Permission:

- `staff.read`

## Admin Settings Endpoints

### `GET /api/admin/settings/store`

Permission:

- `settings.store`

### `PATCH /api/admin/settings/store`

Permission:

- `settings.store`

### `GET /api/admin/settings/payments`

Permission:

- `settings.payments`

### `PATCH /api/admin/settings/payments`

Permission:

- `settings.payments`

### `GET /api/admin/settings/delivery`

Permission:

- `settings.delivery`

### `PATCH /api/admin/settings/delivery`

Permission:

- `settings.delivery`

## File And Media Endpoints

### `POST /api/admin/media/upload-url`

Purpose:

- Create upload URL for product images.

Permission:

- `products.upload_image`

### `DELETE /api/admin/media/:id`

Purpose:

- Delete media asset.

Permission:

- `products.upload_image`

## WebSocket Namespaces

### `/ws/support`

Purpose:

- Customer and admin support chat.

Auth:

- Customer, guest support token, or admin.

### `/ws/delivery`

Purpose:

- Live delivery tracking.

Auth:

- Customer order access, delivery staff, or admin.

## Recommended Next API Step

After approval, convert this into OpenAPI documentation with detailed schemas, status codes, examples, and error codes.

## Current Frontend Alignment Addendum

The latest frontend/admin build requires the backend to include every endpoint in [Current Frontend Backend Contract Plan](./52-current-frontend-backend-contract-plan.md).

Important additions beyond the original endpoint outline:

- `GET /api/storefront` for the full client homepage/layout aggregate.
- Admin storefront publishing endpoints for categories, coupons, promotions, banners, homepage content, and footer content.
- Wishlist endpoints for saved products, price watch, and back-in-stock alerts.
- Account endpoints for profile, saved addresses, wallet, loyalty, and notification preferences.
- Serviceability endpoints for pincode/area checks, branch availability, and product availability by branch.
- Contact form endpoint.
- Legal/content page endpoints for about, privacy, terms, refund policy, and shipping policy.
- Review image upload and helpful-vote endpoints.
- Order confirmation, tracking, invoice, cancel, reorder, refund, and return endpoints.
- WebSocket support for customer support chat, admin support inbox, unread counts, delivery tracking, and delivery location updates.

Final category slugs for API and database records:

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

Do not use old route slugs such as `dairy-eggs` or `pantry` in new backend records.
