# Customer Website Detailed Screens Plan

## Goal

Define the detailed customer-facing website screens for the grocery ecommerce platform.

The customer website should feel modern, premium, fast, and easy to shop. It should prioritize product discovery, quick cart building, reliable checkout, live delivery tracking, and support access.

Updated UI direction: use a Zomato-inspired grocery delivery experience. The interface should be red-led, app-like, location-first, search-first, image-rich, and optimized for fast shopping on mobile. It should be inspired by the polish of delivery apps without copying any exact Zomato branding or assets.

## Customer UI Principles

- Show shopping controls immediately.
- Make location and search prominent.
- Keep cart access visible.
- Make product cards easy to scan.
- Optimize for mobile first.
- Keep checkout simple and step-based.
- Show delivery information clearly.
- Make support easy to reach.
- Avoid unnecessary landing-page fluff.
- Use red primary CTAs and green only for freshness, stock, success, and delivered states.
- Use app-like horizontal rails for categories, offers, and popular sections.

## Global Customer Layout

### Header

Should include:

- Logo.
- Prominent delivery location selector.
- Large search bar with grocery examples.
- Account button.
- Cart button with item count.

Desktop behavior:

- Sticky top header.
- Search bar centered and prominent.
- Cart button always visible.

Mobile behavior:

- Compact header.
- Location and search visible near top.
- Cart accessible through bottom bar or icon.
- App-like vertical rhythm similar to delivery apps.

### Global Surfaces

- Cart drawer.
- Floating support chatbox.
- Mobile bottom cart bar.
- PWA install prompt later.

## Home Shopping Screen

Route:

```txt
/
```

Purpose:

- Let customers start shopping immediately.

First viewport should include:

- Delivery promise.
- Location selector.
- Large search input.
- Horizontal category navigation.
- Featured deals.
- Product grid preview.
- Cart access.

Sections:

- Featured categories.
- Today's deals.
- Popular products.
- Fresh produce picks.
- Essentials.
- Trust/freshness promise.
- Express delivery picks.
- Reorder essentials later.

Actions:

- Search.
- Select category.
- Add product to cart.
- Open cart.
- Open support chat.

## Category Listing Screen

Route:

```txt
/categories/[slug]
```

Purpose:

- Let customers browse products by category.

Screen elements:

- Category title.
- Category description.
- Category filters.
- Sorting.
- Product grid.
- Related categories.
- Horizontal subcategory rail.
- Sticky search/filter row on mobile.

Filters:

- Offers.
- Organic.
- Local.
- Express delivery.
- Price range.
- In stock.

## All Products Screen

Route:

```txt
/products
```

Purpose:

- Let customers browse the full catalog.

Screen elements:

- Product grid.
- Filters.
- Sorting.
- Category chips.
- Search within products.

## Product Detail Screen

Route:

```txt
/products/[slug]
```

Purpose:

- Give customers enough information to confidently add a product.

Screen elements:

- Product image gallery.
- Product name.
- Unit size.
- Price.
- Original price when discounted.
- Badges.
- Stock state.
- Delivery promise.
- Product description.
- Quantity stepper.
- Add-to-cart button.
- Similar products.
- Support link for product question.
- Delivery ETA.
- Freshness and return policy microcopy.
- Similar products carousel.

States:

- In stock.
- Low stock.
- Out of stock.
- Discounted.
- Loading.

## Search Results Screen

Route:

```txt
/search?q=milk
```

Purpose:

- Show fast, useful product search results.

Screen elements:

- Search input.
- Result count.
- Product grid.
- Filters.
- Sorting.
- Search suggestions.
- No-results state.

No-results state should show:

- Helpful message.
- Suggested categories.
- Popular products.
- Support link if customer cannot find something.

## Offers Screen

Route:

```txt
/offers
```

Purpose:

- Show active deals, coupons, and promotions.

Screen elements:

- Deal banners.
- Coupon cards.
- Discounted product grid.
- Expiry labels.
- Apply coupon action.

## Cart Drawer

Global customer surface.

Desktop:

- Right-side drawer or sticky cart panel.

Mobile:

- Bottom cart bar.
- Full cart drawer when opened.

Cart should show:

- Items.
- Quantity controls.
- Remove item.
- Item subtotal.
- Savings.
- Coupon entry.
- Delivery fee estimate.
- Free delivery progress.
- Suggested add-ons.
- Checkout button.

Empty cart state:

- Friendly empty message.
- Suggested essentials.
- Continue shopping action.

## Checkout Screens

Checkout should be step-based.

### Checkout Shell

Route:

```txt
/checkout
```

Purpose:

- Maintain checkout layout and progress.

### Address Step

Route:

```txt
/checkout/address
```

Fields:

- Recipient name.
- Phone.
- Address line 1.
- Address line 2.
- City.
- State.
- Postal code.
- Landmark optional.

Actions:

- Use saved address.
- Continue to delivery.

### Delivery Step

Route:

```txt
/checkout/delivery
```

Screen elements:

- Available delivery slots.
- Same-day delivery label.
- Delivery fee.
- Slot capacity warning when relevant.
- Cutoff time note.

Actions:

- Select slot.
- Continue to payment.

### Payment Step

Route:

```txt
/checkout/payment
```

Options:

- Cash on delivery.
- Mock online payment for development/testing.
- Razorpay later.

Actions:

- Select payment method.
- Continue to review.

### Review Step

Route:

```txt
/checkout/review
```

Screen elements:

- Order items.
- Address summary.
- Delivery slot.
- Payment method.
- Coupon.
- Subtotal.
- Discount.
- Delivery fee.
- Tax.
- Grand total.

Actions:

- Place order.
- Edit address.
- Edit delivery slot.
- Edit payment.

## Order Confirmation Screen

Route:

```txt
/checkout/confirmation/[orderNumber]
```

Screen elements:

- Success message.
- Order number.
- Delivery estimate.
- Payment method.
- Order summary.
- Track order button.
- Support chat button.
- Create account prompt for guest customers.

## Order Tracking Screen

Route:

```txt
/orders/[orderNumber]
```

Purpose:

- Let customers track order status and live delivery location.

Before out for delivery:

- Status timeline.
- Delivery slot.
- Order summary.
- Support button.

When out for delivery:

- Mapbox live map.
- Delivery staff current location.
- Animated delivery marker.
- Route line.
- ETA.
- Status timeline.
- Call/support actions.

Tracking states:

- Order placed.
- Confirmed.
- Packed.
- Out for delivery.
- Nearby.
- Delivered.
- Delayed.
- Failed delivery.

Map error states:

- Location unavailable.
- Delivery staff offline.
- ETA unavailable.
- Map failed to load.

## Account Screens

### Account Overview

Route:

```txt
/account
```

Shows:

- Profile summary.
- Recent orders.
- Saved addresses.
- Notification preferences.

### Profile

Route:

```txt
/account/profile
```

Fields:

- Name.
- Phone.
- Email.

### Addresses

Route:

```txt
/account/addresses
```

Actions:

- Add address.
- Edit address.
- Delete address.
- Set default.

### Order History

Route:

```txt
/orders
```

Shows:

- Previous orders.
- Status.
- Total.
- Reorder action later.
- Support link.

## Support Page And Chatbox

### Support Page

Route:

```txt
/support
```

Shows:

- Support topics.
- Conversation history.
- Contact options.
- FAQ links.

### Floating Chatbox

Available globally.

Features:

- Welcome state.
- Quick topics.
- Active conversation.
- Message input.
- Typing indicator.
- Read status.
- Offline state.
- Link to order.

## Static Trust Pages

### About Page

Route:

```txt
/about
```

Content:

- Brand story.
- Freshness promise.
- Supplier quality.
- Delivery reliability.

### Contact Page

Route:

```txt
/contact
```

Content:

- Support contact.
- Delivery area information.
- Business hours.

### Policy Pages

Routes:

```txt
/policies/privacy
/policies/terms
/policies/refund
```

## Mobile Experience

Mobile priorities:

- Search must be easy to reach.
- Category chips should scroll horizontally.
- Product cards should be thumb-friendly.
- Add button should be easy to tap.
- Cart bottom bar should remain accessible.
- Checkout should feel like an app flow.
- Chatbox should not block checkout or cart.
- Order tracking map should fill the available screen cleanly.

## PWA Experience

PWA should include:

- Install prompt.
- Home screen icon later.
- App-like mobile navigation.
- Offline-friendly error states later.
- Fast repeated visits.

## Loading States

Use skeletons for:

- Home product grid.
- Category listing.
- Search results.
- Product detail.
- Cart drawer.
- Checkout summary.
- Order tracking.

## Empty States

Important empty states:

- Empty cart.
- No products in category.
- No search results.
- No previous orders.
- No saved addresses.
- No support conversations.

Each empty state should include a useful next action.

## Error States

Important error states:

- Product unavailable.
- Cart item no longer available.
- Delivery area unavailable.
- Delivery slot full.
- OTP expired.
- Payment failed.
- Support message failed.
- Tracking unavailable.

## Recommended First Implementation Order

1. Global layout, header, and search.
2. Home shopping screen.
3. Product cards and product grid.
4. Category and search results.
5. Product detail.
6. Cart drawer.
7. Checkout flow.
8. Order confirmation.
9. Order tracking with Mapbox.
10. Support chatbox.
11. Account and order history.
12. Static trust and policy pages.
