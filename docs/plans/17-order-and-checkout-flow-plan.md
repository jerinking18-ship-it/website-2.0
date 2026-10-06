# Order And Checkout Flow Plan

## Goal

Define the complete customer checkout and order lifecycle for the grocery ecommerce platform.

The flow should support:

- Guest checkout.
- Customer phone OTP.
- Cart validation.
- Coupon validation.
- Delivery slot selection.
- Inventory reservation.
- Cash on delivery.
- Mock online payment during development.
- Razorpay later.
- Order confirmation.
- Admin order processing.
- Customer order status tracking.

## Checkout Principles

- Customers should be able to shop before logging in.
- Checkout should be clear, step-based, and mobile-friendly.
- Inventory and delivery slots should be validated before order placement.
- Prices, product names, address, and totals should be snapshotted at order time.
- Customers should receive clear confirmation after placing an order.
- Admins should immediately see new orders in the admin panel.

## Customer Checkout Steps

### Step 1: Cart Review

Customer reviews:

- Cart items.
- Quantity.
- Price.
- Discounts.
- Delivery fee estimate.
- Free delivery progress.
- Suggested add-ons.

System validates:

- Product availability.
- Quantity limits.
- Current pricing.
- Coupon eligibility.

### Step 2: Customer Details

Guest customer enters:

- Name.
- Phone number.
- Email optional.

Logged-in customer can use saved profile details.

### Step 3: Phone OTP Verification

Phone OTP may be required before final order placement.

Flow:

1. Customer enters phone number.
2. System sends OTP.
3. Customer enters OTP.
4. System verifies OTP.
5. Checkout continues.

### Step 4: Delivery Address

Customer enters or selects:

- Recipient name.
- Phone.
- Address line 1.
- Address line 2.
- City.
- State.
- Postal code.
- Landmark optional.

System checks:

- Delivery zone availability.
- Delivery fee.
- Free delivery threshold.

### Step 5: Delivery Slot

Customer selects:

- Delivery date.
- Delivery time window.

System checks:

- Slot availability.
- Slot capacity.
- Cutoff time.
- Same-day delivery eligibility.

### Step 6: Payment Method

Initial methods:

- Cash on delivery.
- Mock online payment for development/testing.

Later:

- Razorpay.

### Step 7: Review Order

Customer reviews:

- Items.
- Address.
- Delivery slot.
- Payment method.
- Subtotal.
- Discount.
- Delivery fee.
- Tax.
- Grand total.

Customer confirms order.

### Step 8: Confirmation

System shows:

- Order number.
- Delivery estimate.
- Payment method.
- Order summary.
- Track order link.
- Support chat access.
- Create account prompt for guest users.

## Cart Validation Rules

Before checkout:

- Product must be active.
- Product must be in stock.
- Quantity must be valid.
- Sale price must still be valid.
- Coupon must still be active.
- Delivery address must be serviceable.
- Delivery slot must have capacity.

If validation fails:

- Show clear customer message.
- Update cart automatically where safe.
- Ask customer to choose replacement or remove unavailable items.

## Inventory Reservation Flow

Inventory should be reserved during order placement.

Flow:

1. Customer reviews checkout.
2. System validates stock.
3. System reserves inventory.
4. System creates order.
5. If payment succeeds or COD is selected, inventory is reduced.
6. If payment fails or checkout expires, reservation is released.

For grocery products with batches:

- Prefer earliest expiry batch first.
- Track batch used for order fulfillment.
- Prevent expired batch allocation.

## Delivery Slot Reservation Flow

Delivery slots should have capacity.

Flow:

1. Customer selects delivery slot.
2. System checks capacity and cutoff time.
3. System temporarily reserves slot during checkout.
4. Order confirmation finalizes slot reservation.
5. Failed or expired checkout releases slot hold.

## Payment Flow

## Cash On Delivery

Flow:

1. Customer selects cash on delivery.
2. System marks payment status as `cod_pending`.
3. Order is confirmed.
4. Admin processes order.
5. Delivery staff collects payment.
6. Admin or delivery staff marks payment collected later.

## Mock Online Payment

Development/testing flow:

1. Customer selects mock online payment.
2. System simulates payment success or failure.
3. Successful mock payment confirms order.
4. Failed mock payment releases reservations.

## Razorpay Later

Future Razorpay flow:

1. System creates Razorpay payment order.
2. Customer completes payment.
3. Razorpay webhook confirms payment.
4. System verifies webhook.
5. Order is confirmed.
6. Failed payment releases inventory and slot reservations.

## Order Statuses

Recommended order statuses:

- `draft`
- `placed`
- `confirmed`
- `packed`
- `out_for_delivery`
- `delivered`
- `cancelled`
- `refunded`

## Payment Statuses

Recommended payment statuses:

- `not_required`
- `cod_pending`
- `pending`
- `paid`
- `failed`
- `refunded`

## Fulfillment Statuses

Recommended fulfillment statuses:

- `not_started`
- `picking`
- `packed`
- `assigned`
- `out_for_delivery`
- `delivered`
- `failed_delivery`

## Admin Order Processing Flow

1. New order appears in admin orders page.
2. Admin opens order detail.
3. Admin reviews customer, items, payment, and delivery slot.
4. Admin confirms order.
5. Inventory staff picks and packs items.
6. Admin updates order to packed.
7. Delivery staff is assigned.
8. Order moves out for delivery.
9. Delivery staff completes delivery.
10. Payment is collected if cash on delivery.
11. Order is marked delivered.

## Customer Order Tracking Flow

Customer can see:

- Order placed.
- Order confirmed.
- Packed.
- Out for delivery.
- Delivered.
- Cancelled if applicable.

Customer can contact support from the order detail page.

## Cancellation Rules

Customers may cancel only before a certain status.

Suggested customer cancellation allowed while:

- `placed`
- `confirmed`

Admin cancellation may be allowed until:

- `packed`
- `out_for_delivery`, only with special permission.

Cancellation should:

- Release inventory when applicable.
- Release delivery slot when applicable.
- Trigger refund if payment was already collected.
- Notify customer.

## Substitution Flow

For unavailable grocery items:

1. System detects item unavailable.
2. System suggests similar product.
3. Customer accepts or rejects substitution.
4. Admin can also suggest substitution during fulfillment.

## Notifications

Send notifications for:

- OTP.
- Order confirmation.
- Payment status.
- Order packed.
- Out for delivery.
- Delivered.
- Cancellation.
- Refund.
- Support updates.

Channels:

- Email.
- WhatsApp.
- SMS.

## Admin Dashboard Signals

Orders should update:

- Today's order count.
- Revenue.
- Pending orders.
- Packed orders.
- Out-for-delivery count.
- COD collection due.
- Low-stock alerts.

## Important Data Snapshots

At order creation, snapshot:

- Product name.
- Product unit.
- Product price.
- Discount.
- Tax.
- Delivery address.
- Delivery slot.
- Payment method.

This protects historical order accuracy if product data changes later.

## Error States

Customer-facing errors should include:

- Item out of stock.
- Quantity no longer available.
- Delivery slot full.
- Delivery area unavailable.
- Coupon expired.
- Payment failed.
- OTP expired.

Each error should show the next best action.

## Recommended First Implementation Order

1. Cart validation.
2. Checkout session.
3. Address and delivery zone validation.
4. Delivery slot selection.
5. Inventory reservation.
6. Cash on delivery order placement.
7. Mock payment order placement.
8. Order confirmation page.
9. Admin order list and detail.
10. Order status updates.
11. Notifications.
12. Razorpay integration later.
