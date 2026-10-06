# Testing And QA Strategy Plan

## Goal

Define the testing and quality assurance strategy for the grocery ecommerce platform.

The system includes customer shopping, admin operations, CQRS backend, checkout, inventory, delivery tracking, support chat, notifications, and Mapbox live tracking. Testing must cover both user experience and business-critical workflows.

## Testing Principles

- Test business-critical flows first.
- Automate repeatable checks.
- Manually review high-touch UI flows before launch.
- Keep checkout, inventory, order, payment, support, and delivery flows especially strict.
- Test role permissions on both frontend and backend.
- Test mobile behavior as a first-class experience.
- Treat production launch QA as a separate checklist.

## Test Types

### Unit Tests

Use for:

- Utility functions.
- Price calculations.
- Discount calculations.
- Delivery fee calculation.
- Inventory availability calculation.
- Permission helpers.
- Validation rules.

### Integration Tests

Use for:

- API + database workflows.
- CQRS command handlers.
- CQRS query handlers.
- Prisma repositories.
- Cart and checkout logic.
- Inventory reservation.
- Order creation.
- Notification queue behavior.

### End-To-End Tests

Use for:

- Customer shopping flow.
- Checkout flow.
- Admin product management.
- Admin order processing.
- Support chat flow.
- Delivery tracking flow.

### Manual QA

Use for:

- Visual polish.
- Mobile layout.
- Mapbox live tracking behavior.
- Admin table usability.
- Chat UX.
- Checkout clarity.
- PWA install experience.

## Customer Website QA

Test:

- Home page loads correctly.
- Search returns relevant products.
- Category filters work.
- Product detail page works.
- Add to cart works.
- Quantity update works.
- Remove from cart works.
- Coupon application works.
- Checkout address step works.
- Delivery slot selection works.
- Payment method selection works.
- Order review is accurate.
- Order confirmation appears.
- Order tracking page works.
- Support chatbox opens and sends messages.

## Checkout QA

Checkout must be tested carefully.

Scenarios:

- Guest checkout.
- Customer checkout after OTP login.
- Cash on delivery order.
- Mock online payment success.
- Mock online payment failure.
- Coupon valid.
- Coupon expired.
- Item out of stock.
- Delivery area unavailable.
- Delivery slot full.
- OTP expired.

Expected checks:

- Totals are correct.
- Inventory is reserved.
- Failed checkout releases reservation.
- Delivery slot capacity is respected.
- Order snapshots are preserved.
- Confirmation page uses correct order number.

## Admin Panel QA

Test:

- Admin login.
- Admin 2FA.
- Dashboard cards load.
- Product table filters work.
- Add product works.
- Edit product works.
- Product image upload flow works.
- Category management works.
- Order list filters work.
- Order detail opens.
- Order status update works.
- Inventory stock adjustment works.
- Supplier creation works.
- Coupon creation works.
- Delivery assignment works.
- Support inbox works.
- Notification jobs list works.
- Staff role assignment works.
- Settings forms save correctly.

## Inventory QA

Test:

- Stock update.
- Reserved stock calculation.
- Available stock calculation.
- Low-stock alert.
- Out-of-stock state.
- Batch creation.
- Expiry warning.
- Purchase entry creation.
- Stock adjustment audit log.
- Product visibility updates after stock changes.

## Delivery And Map QA

Test:

- Delivery zone selection.
- Delivery slot capacity.
- Cutoff time behavior.
- Delivery staff assignment.
- Delivery status updates.
- Mapbox map loads.
- Delivery staff location updates.
- Customer tracking page shows current location.
- Admin active delivery map shows active deliveries.
- Location sharing stops after delivery.
- Offline or unavailable location state appears correctly.

## Support Chat QA

Test:

- Customer starts conversation.
- Customer sends message.
- Admin receives message in realtime.
- Admin replies.
- Customer receives reply.
- Typing indicator works.
- Unread counts update.
- Agent assignment works.
- Pending status works.
- Resolved status works.
- Email/WhatsApp/SMS notification jobs are queued when needed.

## Notification QA

Test:

- OTP notification.
- Order confirmation email.
- WhatsApp order update.
- SMS fallback behavior.
- Support reply notification.
- Delivery update notification.
- Failed notification retry.
- Notification template variables render correctly.

## API QA

Test:

- Public product endpoints.
- Search endpoint.
- Cart endpoints.
- Checkout endpoints.
- Order endpoints.
- Admin product endpoints.
- Admin order endpoints.
- Inventory endpoints.
- Delivery endpoints.
- Support endpoints.
- Notification endpoints.
- Staff/roles endpoints.

Security checks:

- Unauthorized users cannot access protected endpoints.
- Support agents cannot access unrelated restricted data.
- Delivery staff can only access assigned deliveries.
- Admin permissions are enforced server-side.

## WebSocket QA

Test:

- Support socket authentication.
- Delivery socket authentication.
- Message delivery.
- Reconnect behavior.
- Typing events.
- Read events.
- Delivery location events.
- Admin live map updates.
- Customer tracking updates.

## PWA QA

Test:

- Mobile layout.
- Install prompt.
- App-like navigation.
- Touch target sizes.
- Cart bottom bar.
- Checkout on mobile.
- Tracking map on mobile.
- Support chatbox on mobile.

## Browser And Device QA

Minimum browsers:

- Chrome.
- Safari.
- Edge.
- Mobile Safari.
- Chrome on Android.

Viewport checks:

- Mobile small.
- Mobile large.
- Tablet.
- Desktop.
- Wide desktop.

## Performance QA

Check:

- Home page load speed.
- Product listing speed.
- Search responsiveness.
- Cart update speed.
- Checkout response time.
- Admin table loading speed.
- Map tracking performance.

## Accessibility QA

Check:

- Keyboard navigation.
- Visible focus states.
- Form labels.
- Button labels.
- Color contrast.
- Status labels not relying only on color.
- Chatbox accessibility.
- Admin table readability.

## Launch QA Checklist

Before production launch:

- Customer shopping flow works.
- Checkout works.
- Admin login works.
- Admin can add product.
- Admin can update stock.
- Admin can process order.
- Delivery tracking works.
- Support chat works.
- Notifications work.
- Role permissions work.
- Products and prices are correct.
- Delivery fees are correct.
- Legal pages exist.
- Contact details are correct.
- No unapproved placeholder text remains.

## Recommended Tooling

Suggested tools:

- Vitest for unit tests.
- Supertest or equivalent for API integration tests.
- Playwright for end-to-end tests.
- Prisma test database for backend flows.
- Mock providers for notifications and payments.
- Manual QA checklist for visual and operational review.

## Recommended First Testing Order

1. Unit tests for utilities and calculations.
2. API tests for products, cart, checkout, and orders.
3. API tests for admin products, inventory, and orders.
4. E2E test for customer checkout.
5. E2E test for admin order processing.
6. WebSocket test for support chat.
7. Delivery tracking test.
8. Notification queue test.
9. Mobile and visual QA.
10. Final launch QA checklist.

