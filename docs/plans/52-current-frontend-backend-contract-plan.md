# Current Frontend Backend Contract Plan

## Goal

Align backend implementation with the client and admin frontend that exists today.

This document is the handoff contract before backend work starts. Backend work should not remove current frontend features. It should replace browser/local dummy state and the file-backed storefront bridge with real APIs, database records, CQRS handlers, validation, authorization, and audit logging.

## Current Frontend Apps

### Client App

Base URL during development:

```txt
http://localhost:3002
```

Important client routes:

```txt
/
/products
/products/:slug
/categories
/categories/:slug
/offers
/wishlist
/orders
/orders/:orderNumber
/support
/contact
/about
/privacy
/terms
/refund-policy
/shipping-policy
/login
/account
/account/profile
/account/addresses
/account/wallet
/account/notifications
/reviews
/serviceability
/search?q=milk
/checkout/address
/checkout/delivery
/checkout/payment
/checkout/review
/checkout/failed
/checkout/confirmation/:orderNumber
```

### Admin App

Base URL during development:

```txt
http://localhost:3001
```

Important admin routes:

```txt
/
/login
/verify-2fa
/dashboard
/products
/categories
/orders
/inventory
/suppliers
/delivery
/support
/customers
/coupons
/promotions
/refunds
/finance
/audit-logs
/content
/account
/reviews
/loyalty
/branches
/integrations
/system-health
/legal
/notifications
/staff
/reports
/settings
```

## Current Temporary Data To Replace

The frontend currently uses local state, `localStorage`, and `.freshcart-store/storefront.json`.

Backend must replace:

- Customer auth status.
- Customer profile.
- Wishlist.
- Cart.
- Reorder cart.
- Delivery slot.
- Checkout address.
- Payment method.
- Recent searches.
- Support tickets/messages.
- Admin module records.
- Storefront categories, coupons, promotions, and banners.

## Final Category Slugs

The backend database should use these final category slugs:

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

Do not create new production records with old slugs such as `dairy-eggs` or `pantry`.

## Storefront Aggregate API

The client needs one fast aggregate endpoint for homepage and shared layout data:

```txt
GET /api/storefront
```

Response should include:

```json
{
  "data": {
    "categories": [],
    "featuredProducts": [],
    "homepageHero": {},
    "promotions": [],
    "coupons": [],
    "couponBanners": [],
    "footer": {},
    "serviceability": {},
    "updatedAt": "2026-10-05T00:00:00.000Z"
  },
  "meta": {}
}
```

Admin writes that affect the client should update the records behind this endpoint.

Admin storefront APIs:

```txt
GET   /api/admin/storefront
PATCH /api/admin/storefront/categories
PATCH /api/admin/storefront/promotions
PATCH /api/admin/storefront/coupons
PATCH /api/admin/storefront/banners
PATCH /api/admin/storefront/homepage
PATCH /api/admin/storefront/footer
POST  /api/admin/storefront/publish
```

CQRS:

- `GetStorefrontQuery`
- `GetAdminStorefrontQuery`
- `UpdateStorefrontCategoriesCommand`
- `UpdateStorefrontPromotionsCommand`
- `UpdateStorefrontCouponsCommand`
- `UpdateStorefrontBannersCommand`
- `UpdateHomepageContentCommand`
- `PublishStorefrontCommand`
- `StorefrontPublishedEvent`

Database models:

- `StorefrontPlacement`
- `HomepageSection`
- `Promotion`
- `Coupon`
- `Category`
- `ContentBlock`

## Client API Contract

### Auth And Account

```txt
POST /api/auth/customer/request-otp
POST /api/auth/customer/verify-otp
POST /api/auth/customer/google
POST /api/auth/customer/logout
GET  /api/auth/customer/me
PATCH /api/account/profile
GET  /api/account/addresses
POST /api/account/addresses
PATCH /api/account/addresses/:id
DELETE /api/account/addresses/:id
PATCH /api/account/addresses/:id/default
GET  /api/account/notifications
PATCH /api/account/notifications
GET  /api/account/wallet
GET  /api/account/loyalty
```

Frontend routes served:

- `/login`
- `/account`
- `/account/profile`
- `/account/addresses`
- `/account/wallet`
- `/account/notifications`

CQRS:

- `RequestCustomerOtpCommand`
- `VerifyCustomerOtpCommand`
- `CustomerGoogleLoginCommand`
- `UpdateCustomerProfileCommand`
- `CreateCustomerAddressCommand`
- `UpdateCustomerAddressCommand`
- `SetDefaultCustomerAddressCommand`
- `UpdateCustomerNotificationPreferencesCommand`
- `GetCurrentCustomerQuery`
- `ListCustomerAddressesQuery`
- `GetCustomerWalletQuery`

### Catalog, Categories, Search, And Offers

```txt
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

Frontend routes served:

- `/products`
- `/products/:slug`
- `/categories`
- `/categories/:slug`
- `/search`
- `/offers`

Required filters:

```txt
category
search
price_min
price_max
brand
dietary_tags
badges
in_stock
sort
page
limit
```

Product detail response must include:

- Product core data.
- Images and thumbnails.
- Price and sale price.
- Stock state.
- Ratings summary.
- Reviews preview.
- Nutrition facts.
- Batch and expiry info.
- Replacement policy.
- Branch availability.
- Similar products.
- Frequently bought together products.

### Wishlist

```txt
GET    /api/wishlist
POST   /api/wishlist/items
DELETE /api/wishlist/items/:productId
POST   /api/wishlist/items/:productId/price-watch
POST   /api/wishlist/items/:productId/back-in-stock
```

Frontend route served:

- `/wishlist`

CQRS:

- `AddWishlistItemCommand`
- `RemoveWishlistItemCommand`
- `EnableWishlistPriceWatchCommand`
- `EnableBackInStockAlertCommand`
- `GetWishlistQuery`

Database models:

- `Wishlist`
- `WishlistItem`

### Cart

```txt
GET    /api/cart
POST   /api/cart/items
PATCH  /api/cart/items/:id
DELETE /api/cart/items/:id
POST   /api/cart/apply-coupon
DELETE /api/cart/coupon
GET    /api/cart/recommendations
```

Current frontend behavior:

- Right-side cart drawer.
- Quantity controls.
- Coupon strip.
- Delivery slot selector.
- Summary.
- Checkout CTA.

CQRS:

- `CreateCartCommand`
- `AddCartItemCommand`
- `UpdateCartItemQuantityCommand`
- `RemoveCartItemCommand`
- `ApplyCouponToCartCommand`
- `RemoveCouponFromCartCommand`
- `GetCartQuery`
- `GetCartSummaryQuery`

### Checkout

```txt
POST  /api/checkout/start
PATCH /api/checkout/address
PATCH /api/checkout/delivery-slot
PATCH /api/checkout/instructions
PATCH /api/checkout/payment-method
POST  /api/checkout/validate-coupon
POST  /api/checkout/validate
POST  /api/checkout/place-order
GET   /api/checkout/:checkoutId
GET   /api/checkout/:checkoutId/summary
```

Frontend routes served:

- `/checkout/address`
- `/checkout/delivery`
- `/checkout/payment`
- `/checkout/review`
- `/checkout/failed`
- `/checkout/confirmation/:orderNumber`

Rules:

- Address must be validated server-side.
- Coupon must be validated server-side.
- Slot capacity must be checked server-side.
- Inventory must be reserved before final order confirmation.
- Failed payment must release inventory reservation.

### Orders, Tracking, Returns, And Invoices

```txt
GET  /api/orders
GET  /api/orders/:orderNumber
GET  /api/orders/:orderNumber/tracking
GET  /api/orders/:orderNumber/invoice
POST /api/orders/:orderNumber/cancel
POST /api/orders/:orderNumber/reorder
POST /api/orders/:orderNumber/refund-request
POST /api/orders/:orderNumber/return-request
```

Frontend routes served:

- `/orders`
- `/orders/:orderNumber`
- `/checkout/confirmation/:orderNumber`

Tracking response must support:

- Status timeline.
- Current delivery assignment.
- Map/location coordinates when available.
- ETA.
- Support handoff.

### Reviews

```txt
GET  /api/reviews
GET  /api/products/:productId/reviews
POST /api/products/:productId/reviews
POST /api/reviews/:id/helpful
POST /api/reviews/:id/images
```

Frontend route served:

- `/reviews`

Rules:

- Only customers who purchased a product should be able to write a verified review.
- Uploaded review images must be stored through the media service.
- Admin moderation must control visibility.

### Support And Contact

```txt
GET  /api/support/conversations
POST /api/support/conversations
GET  /api/support/conversations/:id/messages
POST /api/support/conversations/:id/messages
POST /api/contact/messages
```

WebSocket namespace:

```txt
/ws/support
```

Frontend routes served:

- `/support`
- `/contact`

Realtime support must include:

- Customer messages.
- Admin replies.
- Typing state.
- Read/unread state.
- Conversation status.

### Serviceability

```txt
GET  /api/serviceability/check
GET  /api/serviceability/branches
GET  /api/serviceability/products/:productId
POST /api/serviceability/save-location
```

Frontend route served:

- `/serviceability`

Rules:

- Check pincode/area against active branch zones.
- Return nearest branch.
- Return whether delivery is available.
- Later, hide or mark unavailable products by branch stock.

### Legal And Static Content

```txt
GET /api/content/pages/about
GET /api/content/pages/privacy
GET /api/content/pages/terms
GET /api/content/pages/refund-policy
GET /api/content/pages/shipping-policy
```

Frontend routes served:

- `/about`
- `/privacy`
- `/terms`
- `/refund-policy`
- `/shipping-policy`

Admin content manager and legal compliance modules should own these records.

## Admin API Contract

Every admin module must load from backend query endpoints and write through command endpoints.

### Dashboard

```txt
GET /api/admin/dashboard/summary
GET /api/admin/dashboard/operations
GET /api/admin/dashboard/alerts
```

### Products

```txt
GET    /api/admin/products
POST   /api/admin/products
GET    /api/admin/products/:id
PATCH  /api/admin/products/:id
PATCH  /api/admin/products/:id/status
PATCH  /api/admin/products/:id/stock
POST   /api/admin/products/:id/images
POST   /api/admin/products/bulk-status
```

### Categories

```txt
GET   /api/admin/categories
POST  /api/admin/categories
PATCH /api/admin/categories/:id
PATCH /api/admin/categories/:id/visibility
POST  /api/admin/categories/reorder
POST  /api/admin/categories/publish-storefront
```

### Orders

```txt
GET   /api/admin/orders
GET   /api/admin/orders/:id
PATCH /api/admin/orders/:id/status
POST  /api/admin/orders/:id/confirm
POST  /api/admin/orders/:id/mark-packed
POST  /api/admin/orders/:id/assign-delivery
POST  /api/admin/orders/:id/contact-customer
```

### Inventory

```txt
GET  /api/admin/inventory
POST /api/admin/inventory/purchase-entries
POST /api/admin/inventory/adjustments
POST /api/admin/inventory/batches
GET  /api/admin/inventory/ledger
```

### Suppliers

```txt
GET   /api/admin/suppliers
POST  /api/admin/suppliers
PATCH /api/admin/suppliers/:id
POST  /api/admin/suppliers/:id/purchase-orders
PATCH /api/admin/purchase-orders/:id
PATCH /api/admin/supplier-payments/:id
```

### Delivery

```txt
GET   /api/admin/delivery/assignments
POST  /api/admin/delivery/assignments
PATCH /api/admin/delivery/assignments/:id
GET   /api/admin/delivery/partners
POST  /api/admin/delivery/partners
GET   /api/admin/delivery/live-map
```

WebSocket namespace:

```txt
/ws/delivery
```

### Support

```txt
GET   /api/admin/support/conversations
GET   /api/admin/support/conversations/:id
POST  /api/admin/support/conversations/:id/messages
PATCH /api/admin/support/conversations/:id/status
PATCH /api/admin/support/conversations/:id/assignee
```

### Customers

```txt
GET   /api/admin/customers
GET   /api/admin/customers/:id
PATCH /api/admin/customers/:id/status
GET   /api/admin/customers/:id/orders
GET   /api/admin/customers/:id/wallet
```

### Coupons And Promotions

```txt
GET   /api/admin/coupons
POST  /api/admin/coupons
PATCH /api/admin/coupons/:id
PATCH /api/admin/coupons/:id/status
GET   /api/admin/promotions
POST  /api/admin/promotions
PATCH /api/admin/promotions/:id
PATCH /api/admin/promotions/:id/status
POST  /api/admin/promotions/:id/publish
```

### Refunds, Finance, And Reports

```txt
GET   /api/admin/refunds
PATCH /api/admin/refunds/:id
POST  /api/admin/refunds/:id/approve
POST  /api/admin/refunds/:id/reject
GET   /api/admin/finance/summary
GET   /api/admin/finance/payments
PATCH /api/admin/finance/payments/:id
GET   /api/admin/finance/invoices
GET   /api/admin/reports
POST  /api/admin/reports/export
```

### Audit, Content, Legal, Settings, And Staff

```txt
GET   /api/admin/audit-logs
POST  /api/admin/audit-logs/export
GET   /api/admin/content
POST  /api/admin/content
PATCH /api/admin/content/:id
POST  /api/admin/content/:id/publish
GET   /api/admin/legal
PATCH /api/admin/legal/:id
GET   /api/admin/settings
PATCH /api/admin/settings/:section
GET   /api/admin/staff
POST  /api/admin/staff
PATCH /api/admin/staff/:id
PATCH /api/admin/staff/:id/roles
```

### Reviews, Loyalty, Branches, Integrations, And System Health

```txt
GET   /api/admin/reviews
PATCH /api/admin/reviews/:id/moderation
GET   /api/admin/loyalty
PATCH /api/admin/loyalty/rules
GET   /api/admin/branches
POST  /api/admin/branches
PATCH /api/admin/branches/:id
GET   /api/admin/integrations
PATCH /api/admin/integrations/:id
GET   /api/admin/system-health
POST  /api/admin/system-health/checks/run
```

## Database Additions Required By Current Frontend

The current frontend requires these models in addition to the original schema plan:

- `Wishlist`
- `WishlistItem`
- `CustomerNotificationPreference`
- `Wallet`
- `WalletTransaction`
- `LoyaltyAccount`
- `LoyaltyTransaction`
- `ReviewImage`
- `ReviewHelpfulVote`
- `ContactMessage`
- `ServiceabilityZone`
- `BranchServiceArea`
- `StorefrontPlacement`
- `HomepageSection`
- `ContentPage`
- `FooterLinkGroup`
- `FooterLink`
- `SearchHistory`
- `DeliveryLocationPing`

## Implementation Rule

When backend coding starts, do not build endpoints in isolation. For each frontend/admin screen:

1. Create or confirm database models.
2. Add command/query classes.
3. Add handlers.
4. Add controller endpoints.
5. Add validation DTOs.
6. Add auth and permission checks.
7. Add audit events for admin writes.
8. Replace the corresponding frontend local state call with API calls.
9. Re-run typecheck, build, route scan, and key interaction checks.
