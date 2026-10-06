# Admin Promotions Module Plan

## Goal

Create a production-level promotions control center for the admin panel. Promotions should control what offers customers see, where they see them, who sees them, and when each campaign starts or expires.

The promotions module should manage banners, offer cards, category campaigns, product badges, cart drawer offers, checkout messaging, coupon connections, audience targeting, performance, and budget risk.

## Recommended Tabs

Use these tabs:

- Overview.
- Campaigns.
- Placements.
- Audience.
- Product Mapping.
- Coupons.
- Schedule.
- Analytics.
- Risk.

## Promotion Dashboard

The overview should show:

- Total live promotions.
- Scheduled promotions.
- Paused promotions.
- Total promotion revenue.
- Coupon usage.
- Budget usage.
- Conversion rate.
- Best performing placement.
- Campaigns needing review.

## Promotion Directory

Each promotion should show:

- Promotion title.
- Promotion type.
- Placement.
- Audience.
- Status.
- Priority.
- Budget.
- Start date.
- End date.
- CTA text.
- Target link.

## Create And Edit Promotion

Admin should be able to create and update promotions with:

- Promotion title.
- Promotion type.
- Banner image or visual content.
- Placement.
- Audience.
- Offer value.
- Budget.
- Start date.
- End date.
- CTA text.
- Target URL.
- Coupon link.
- Priority.
- Active, paused, scheduled, or expired status.

Promotion types:

- Homepage banner.
- Footer promotion banner.
- Category offer.
- Cart drawer offer.
- Product badge.
- Delivery offer.
- Checkout discount message.
- Flash sale.

## Homepage And Banner Placements

Admin should manage all visible client placement areas:

- Homepage hero promotion.
- Homepage offer strip.
- Category banner.
- Product listing banner.
- Cart drawer offer.
- Checkout message.
- Footer promotion banner.
- Search results offer label.

Required controls:

- Preview client-side placement.
- Set banner priority.
- Reorder banners.
- Pause or activate placement.
- Schedule placement.

## Audience Targeting

Admin should choose who sees a promotion.

Audience examples:

- All users.
- New users.
- Returning customers.
- VIP customers.
- COD users.
- High cart value users.
- Cart abandoners.
- Inactive users.
- Category buyers.
- Product repeat buyers.

## Category And Product Promotion Mapping

Admin should attach promotions to:

- Categories.
- Subcategories.
- Individual products.
- Product collections.
- Search result groups.

Examples:

- Flat 20% on Fresh Produce.
- Dairy Morning Deal.
- Free Delivery Over Rs. 999.
- Organic Picks Sale.
- Weekend Snacks Offer.

## Coupon Connection

Promotions should connect with coupons when needed.

Required behavior:

- Link promotion with coupon code.
- Track coupon usage.
- Pause coupon when promotion pauses if linked.
- Show coupon on client UI automatically.
- Keep coupon discount cap and promotion budget aligned.

## Scheduling

Admin should be able to schedule campaigns with:

- Start date.
- End date.
- Start time.
- End time.
- Recurring schedule.
- Weekend promotion mode.
- Festival campaign mode.
- Flash sale timer.
- Auto-expire after end date.

## Performance Analytics

Each promotion should track:

- Views.
- Clicks.
- Conversion rate.
- Revenue.
- Orders created.
- Coupon redemptions.
- Discount cost.
- ROI.
- Best performing placement.
- Best performing audience.

## Risk And Budget Control

Promotions should include budget and abuse protection:

- Max discount cap.
- Total budget limit.
- Per-user use limit.
- Coupon abuse risk.
- Low margin warning.
- Duplicate promotion warning.
- Auto-pause when budget is crossed.
- Owner approval for high-risk campaigns.

## Admin To Client Connection

Admin promotions connect to the client website through the backend.

### 1. Admin Creates Promotion

Admin creates or edits a promotion in the admin panel with:

- Title.
- Banner image or text.
- Placement.
- Audience.
- Coupon.
- Start date.
- End date.
- Status.
- Priority.
- Target URL.

### 2. Backend Saves Promotion

The backend stores promotion data in the database.

Example `Promotion` model fields:

- `id`
- `title`
- `type`
- `placement`
- `audience`
- `status`
- `priority`
- `startsAt`
- `endsAt`
- `couponId`
- `targetUrl`
- `budgetLimit`
- `discountCap`
- `createdBy`
- `updatedAt`

### 3. Client Requests Active Promotions

The client website requests active promotion data from the backend.

Example API:

```txt
GET /promotions/active?placement=homepage-banner
```

The backend should return only promotions that are:

- Live or active.
- Valid for the current date and time.
- Matching the requested placement.
- Matching the customer audience if the user is logged in.
- Within budget limits.
- Sorted by priority.

### 4. Client Displays Promotion

The client website displays the promotion wherever the placement says it should appear.

Client placements include:

- Homepage banner.
- Footer promotion banner.
- Offer cards.
- Category banners.
- Product badges.
- Search result offer labels.
- Cart drawer offers.
- Checkout discount messaging.

### 5. Updates And Cache

For production:

- Admin saves promotion.
- Backend updates the database.
- Backend clears promotion cache.
- Client receives the latest promotion on refresh.
- Optional WebSocket or SSE can push instant promotion updates.

### Example Flow

Admin creates:

```txt
Title: Flat 20% on Fresh Produce
Placement: homepage-banner
Audience: all-users
Status: Live
Target: /categories/fresh-produce
```

Client homepage calls:

```txt
GET /promotions/active?placement=homepage-banner
```

Backend returns the active promotion, and the homepage banner appears automatically.

## Recommendation

Build Promotions as the marketing control center for the grocery website. Admin should control campaigns, backend should be the source of truth, and the client website should only display active promotion data returned by the backend.
