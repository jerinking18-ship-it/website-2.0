# Design System Plan

## Goal

Create a modern, premium, user-friendly design system for the grocery ecommerce website and admin panel.

The design system should support:

- Customer grocery shopping.
- Admin operations.
- Product browsing.
- Cart and checkout.
- Support chat.
- Mobile and PWA experience.

## Design Direction

Use a polished "Zomato-inspired grocery delivery" visual direction.

The UI should feel close to the level of a top food delivery app: fast, bold, app-like, search-first, location-aware, and highly polished. It should not copy Zomato branding exactly, but it should follow a similar design language:

- Strong red primary accent.
- Clean white content surfaces.
- Large location and search entry points.
- Card-based discovery.
- High-quality food and grocery imagery.
- Smooth mobile-first shopping flow.
- Clear delivery promise and live tracking cues.

The customer website should feel:

- Fresh.
- Fast.
- Clean.
- Premium and app-like.
- Easy to shop.
- Similar in polish to Zomato, Zepto, and modern delivery apps.

The admin panel should feel:

- Operational.
- Clear.
- Dense but readable.
- Fast for repeated daily use.
- Less decorative than the customer website.
- Connected to the same red-led brand system without feeling like a consumer app.

## Brand Personality

Suggested personality:

- Fast and confident.
- Modern and premium.
- Friendly without looking childish.
- Local-store trust with food-delivery-app convenience.
- Bold enough for customer excitement, calm enough for grocery trust.
- Familiar to users who already shop through delivery apps.

## Color System

### Primary Colors

- Delivery red: primary buttons, active navigation, offer highlights, and important CTAs.
- Deep charcoal: main text, headings, and strong UI labels.
- White: main surfaces, cards, drawers, modals, and product panels.
- Warm off-white: page background and subtle section separation.

Suggested red direction:

- Primary red: `#e23744` or close.
- Hover red: a slightly deeper red.
- Pale red tint: soft backgrounds for selected states, coupons, and alerts.

### Accent Colors

- Fresh green: in-stock, freshness, delivered, success, and produce quality.
- Citrus yellow: deals, highlights, free delivery progress.
- Blue: support chat, live help, informational states.
- Amber: warnings, low-stock alerts, expiring soon.

### Status Colors

- Green: success, delivered, active, in stock.
- Amber: pending, low stock, needs review.
- Red: cancelled, failed, out of stock, destructive.
- Blue: support, processing, assigned.
- Gray: draft, disabled, archived.

## Typography

Use a modern sans-serif type system.

### Customer Website Typography

- Large, confident headings.
- Clear product names.
- Compact metadata.
- Highly readable body text.
- Strong price typography.

### Admin Typography

- Smaller but readable headings.
- Dense table text.
- Clear labels.
- Strong status labels.
- No oversized marketing text.

## Spacing And Layout

Use consistent spacing tokens:

- `4px`: tiny gaps.
- `8px`: compact component spacing.
- `12px`: product card internals.
- `16px`: standard component spacing.
- `24px`: section spacing.
- `32px`: large layout spacing.
- `48px`: major page sections.

Customer layout should feel like a premium delivery app:

- Strong first viewport with location, search, and immediate shopping sections.
- No oversized marketing-only hero.
- Dense but breathable product discovery.
- Horizontal carousels for categories, offers, bestsellers, and essentials.
- Sticky mobile bottom cart bar.
- Quick scan cards with price, unit, discount, delivery promise, and add button.
- Product detail can open as a page or bottom sheet-style drawer later.

## Corners And Borders

Recommended radius:

- Inputs: 8px.
- Buttons: 8px.
- Product cards: 12px.
- Drawers and panels: 14px.
- Admin tables: 8px.
- Chatbox: 14px.

Use borders lightly:

- Product cards: subtle border.
- Admin tables: clear row separators.
- Inputs: visible but calm border.
- Focus states: obvious and accessible.

## Shadows

Use shadows sparingly.

Recommended shadow use:

- Cart drawer.
- Support chatbox.
- Dropdowns.
- Modals.
- Sticky admin panels.

Avoid heavy shadows on every card.

## Customer Website Components

### Header

Should include:

- Logo.
- Prominent delivery location selector.
- Large search bar similar to food delivery apps.
- Account button.
- Cart button with item count.

Behavior:

- Sticky on desktop and mobile.
- Search should be the main visual control after location.
- Cart should always be easy to access.
- Mobile header should stack location above search, like an app home screen.

### Category Navigation

Use a Zomato-like horizontal discovery rail.

Each category should support:

- Circular or rounded food/grocery visual.
- Name.
- Active state.
- Mobile scrolling.
- Featured category ordering.
- Compact "See all" entry.

### Product Card

Each product card should include:

- Product image.
- Product badge.
- Product name.
- Unit size.
- Price.
- Original price when discounted.
- Rating or freshness signal.
- Stock state.
- Add button.
- Quantity stepper after adding.
- Delivery time or express label.
- Clear discount/savings label when available.

States:

- Default.
- Hover.
- Added to cart.
- Out of stock.
- Discounted.
- Loading.

Visual style:

- White cards on warm off-white background.
- Real product imagery or strong grocery visual.
- Minimal border, soft shadow only on hover or sticky surfaces.
- Red "Add" action.
- Green only for freshness and stock signals.
- Compact enough to scan many items quickly.

### Product Detail

Product details can use a page or drawer.

Should include:

- Image gallery.
- Product name.
- Price.
- Unit.
- Badges.
- Description.
- Delivery promise.
- Stock state.
- Related products.
- Add-to-cart controls.

### Search UI

Search should include:

- Large Zomato-style search input with strong placeholder examples.
- Suggestions.
- Recent searches.
- Popular searches.
- Search result count.
- Filters.
- Sorting.
- Empty result state.
- Sticky search on mobile.
- Voice search placeholder can be added later if approved.

### Filter UI

Suggested filters:

- Category.
- Price.
- Offers.
- Organic.
- Local.
- Express delivery.
- Dietary preferences.
- In stock.

### Cart Drawer

Desktop:

- Sticky right-side cart panel or drawer with red checkout CTA.

Mobile:

- Bottom cart bar similar to delivery apps.
- Full-height cart drawer after tap.

Cart should include:

- Cart items.
- Quantity controls.
- Remove action.
- Savings.
- Delivery fee.
- Free delivery progress.
- Delivery slot selector.
- Suggested add-ons.
- Checkout button.
- Delivery estimate.
- Coupon prompt.
- Savings summary.

### Checkout UI

Use a step-based flow:

1. Address.
2. Delivery.
3. Payment.
4. Review.

Each step should show:

- Progress.
- Clear actions.
- Inline validation.
- Order summary.
- Back and continue buttons.
- Red primary CTA.
- Compact sticky order summary on mobile.
- Clear COD and mock online payment choices.

### Order Confirmation

Should include:

- Success state.
- Order number.
- Estimated delivery.
- Order summary.
- Track order action.
- Create account prompt.
- Support chat access.
- Food-delivery-style order progress card.

## Support Chat UI

### Customer Chatbox

Placement:

- Bottom-right on desktop.
- Bottom area on mobile, above cart bar.

Should include:

- Floating chat button.
- Welcome message.
- Conversation thread.
- Message input.
- Typing indicator.
- Delivery/read state.
- Quick actions.
- Attachment button placeholder.
- Quick topics styled like app action chips.
- Red accent for primary send/action button.

### Admin Support Inbox

Layout:

- Left: conversation list.
- Center: message thread.
- Right: customer/order context panel.

Should include:

- Open, pending, resolved filters.
- Unread badges.
- Agent assignment.
- Quick replies.
- Internal notes later.
- Search conversations.

## Admin Panel Components

### Admin Layout

Use:

- Left sidebar.
- Top bar.
- Main content area.
- Optional right detail panel.

Admin style should be inspired by the customer brand but not decorative:

- Neutral background.
- Red primary actions.
- Green, amber, blue, and red only for meaningful status.
- Dense operational tables.
- Clear filters and status tabs.
- Drawer-first add/edit workflows.

Sidebar should include:

- Dashboard.
- Products.
- Categories.
- Orders.
- Inventory.
- Customers.
- Coupons.
- Delivery.
- Support.
- Notifications.
- Staff.
- Settings.

### Admin Dashboard Cards

Cards should show:

- Today's orders.
- Revenue.
- Pending deliveries.
- Low stock.
- Open support chats.
- Top products.
- COD collection due.
- Active deliveries.
- Unassigned packed orders.

### Admin Tables

Tables should support:

- Search.
- Filters.
- Sort.
- Pagination.
- Bulk actions.
- Status badges.
- Row actions.
- Empty states.
- Loading states.

Important tables:

- Products.
- Orders.
- Inventory.
- Customers.
- Coupons.
- Delivery slots.
- Support conversations.
- Staff.

### Admin Forms

Forms should use:

- Clear labels.
- Helpful placeholders.
- Inline validation.
- Save/cancel actions.
- Section grouping.
- Upload controls for images.

Important forms:

- Product form.
- Category form.
- Coupon form.
- Delivery zone form.
- Delivery slot form.
- Staff user form.
- Settings forms.

### Status Badges

Order statuses:

- Pending.
- Confirmed.
- Packed.
- Out for delivery.
- Delivered.
- Cancelled.

Inventory statuses:

- In stock.
- Low stock.
- Out of stock.
- Expiring soon.

Support statuses:

- Open.
- Pending.
- Resolved.
- Assigned.

Payment statuses:

- Cash on delivery.
- Pending.
- Paid.
- Failed.
- Refunded.

## Mobile Rules

The customer website must be mobile-first.

Mobile priorities:

- Search is easy to reach.
- Cart is always accessible.
- Product cards fit cleanly.
- Add buttons are touch-friendly.
- Checkout is step-based.
- Chatbox does not block cart.

Zomato-like mobile priorities:

- Location and search must be reachable in the first screen.
- Category and offer rows should scroll horizontally.
- Product add controls should be thumb-friendly.
- Checkout CTA should stay sticky.
- Tracking map should feel full-screen and app-like.

Admin mobile:

- Admin panel should be usable on tablet and basic mobile.
- Dense admin work is optimized for desktop first.
- Critical actions such as order updates and support replies should work on mobile.

## PWA UI Rules

PWA should include:

- Install prompt.
- App-like navigation.
- Mobile-friendly header.
- Offline-friendly empty/error states later.
- Home screen icon later.

## Accessibility Rules

- Strong contrast for text and controls.
- Visible focus states.
- Buttons and inputs must have accessible labels.
- Do not rely only on color for status.
- Product cards and cart controls should be keyboard usable.
- Chat should announce new messages where possible.
- Admin tables should remain readable at different zoom levels.

## Empty States

Important empty states:

- Empty cart.
- No search results.
- No orders.
- No support conversations.
- No low-stock items.
- No coupons.
- No delivery slots.

Each empty state should include:

- Clear message.
- Helpful next action.
- No filler text.

## Loading States

Use skeleton loading for:

- Product grid.
- Product detail.
- Cart summary.
- Checkout summary.
- Admin tables.
- Support inbox.

Avoid layout shift while loading.

## Error States

Error states should be clear and recoverable.

Examples:

- Product unavailable.
- Delivery slot full.
- Payment failed.
- OTP expired.
- Support message failed.
- Search unavailable.

## Recommended Component Library

Use:

- Tailwind CSS.
- shadcn/ui.
- lucide-react icons.
- TanStack Table for admin tables.
- React Hook Form and Zod for forms.

## First Design Build Order

1. Design tokens and base layout.
2. Zomato-inspired customer header with location and search.
3. Category, offer, and essentials discovery rails.
4. Product card and product grid.
5. Cart drawer, bottom cart bar, and checkout steps.
6. Support chatbox.
7. Admin sidebar and top bar.
8. Admin dashboard cards.
9. Admin tables.
10. Admin forms.

## Future Optional AI UI

AI shopping UI is not part of the first production design system. If approved later, it can add an assistant page, prompt input, generated product suggestions, and accept/reject controls.
