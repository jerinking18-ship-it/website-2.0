# Delivery And Fulfillment Plan

## Goal

Define delivery, fulfillment, and premium live order tracking for the grocery ecommerce platform.

The delivery experience should feel premium and modern, similar to high-quality grocery and food delivery apps.

The system should support:

- Delivery zones.
- Delivery fees.
- Delivery slots.
- Slot capacity.
- Same-day delivery.
- Order cutoff times.
- Delivery staff assignment.
- Delivery status tracking.
- Live delivery map.
- Delivery staff current location.
- Customer ETA.
- Admin active delivery monitoring.

## Map Provider Decision

Use Mapbox as the planned premium map provider for live delivery tracking.

Reasons:

- Premium visual quality.
- Smooth custom map styles.
- Strong live marker experience.
- Good fit for Zepto/Zomato-style tracking.
- Flexible UI customization.

Google Maps can remain a future fallback if the client specifically requests it.

## Delivery Principles

- Customers should know when their order will arrive.
- Admins should know which orders are delayed or unassigned.
- Delivery staff should have a mobile-friendly delivery workflow.
- Live tracking should start only when the order is out for delivery.
- Location sharing should stop after delivery is complete.
- The system should handle weak network and GPS failures gracefully.

## Delivery Zones

Delivery zones define where the business can deliver.

Each zone should include:

- Zone name.
- Postal codes or map boundaries.
- Base delivery fee.
- Free delivery minimum.
- Same-day delivery availability.
- Active/inactive status.

## Delivery Fees

Delivery fees can depend on:

- Delivery zone.
- Cart total.
- Same-day delivery.
- Peak delivery slots.
- Free delivery threshold.

Customer UI should show delivery fee clearly before order placement.

## Delivery Slots

Delivery slots define available delivery windows.

Each slot should include:

- Date.
- Start time.
- End time.
- Delivery zone.
- Capacity.
- Reserved count.
- Cutoff time.
- Active/inactive status.

## Slot Capacity

Capacity prevents overbooking.

Flow:

1. Customer selects delivery slot.
2. System checks capacity.
3. Checkout temporarily reserves slot.
4. Order confirmation finalizes slot.
5. Failed checkout releases slot hold.

## Cutoff Time

Cutoff time controls when a slot becomes unavailable.

Example:

- Same-day 6 PM - 8 PM slot may close at 4 PM.

## Same-Day Delivery

Same-day delivery should depend on:

- Delivery zone.
- Current time.
- Slot capacity.
- Inventory availability.
- Store operating hours.

## Delivery Staff

Delivery staff should have:

- Name.
- Phone number.
- Active/inactive status.
- Assigned orders.
- Current delivery status.

Delivery staff can be represented as admin users with delivery permissions or as a separate delivery staff profile linked to an admin user.

## Delivery Assignment

Orders can be assigned to delivery staff by:

- Manual admin assignment first.
- Auto-assignment later.

Assignment flow:

1. Order is packed.
2. Admin assigns delivery staff.
3. Delivery staff receives assignment.
4. Delivery staff accepts assignment.
5. Order moves to out for delivery.
6. Live tracking begins.

## Delivery Statuses

Recommended statuses:

- `unassigned`
- `assigned`
- `accepted`
- `picked_up`
- `out_for_delivery`
- `nearby`
- `delivered`
- `failed_delivery`
- `cancelled`

## Customer Live Tracking

Customer order tracking should include:

- Live Mapbox map.
- Delivery staff current location.
- Animated delivery marker.
- Route line.
- Estimated arrival time.
- Delivery status timeline.
- Order summary.
- Delivery staff first name.
- Call/support action.

Tracking should be available from:

- Order confirmation page.
- Order detail page.
- Notification link.

## Delivery Staff Location Sharing

Delivery staff location sharing should:

- Ask for device location permission.
- Start when order is out for delivery.
- Send live GPS updates while delivery is active.
- Pause or stop after delivery completion.
- Show error if location permission is denied.
- Handle weak network with retry behavior.

Recommended update behavior:

- Send location update every few seconds while moving.
- Reduce update frequency when stationary.
- Stop updates after delivery is completed.

## Admin Active Delivery Map

Admin should see:

- Active deliveries on map.
- Delivery staff current locations.
- Order status.
- Delivery zone.
- Delayed deliveries.
- Unassigned packed orders.
- ETA where available.

Admin actions:

- Assign delivery staff.
- Reassign delivery staff.
- View order details.
- Contact customer.
- Contact delivery staff.
- Mark delivery issue.

## Live Tracking Architecture

### WebSocket

Use WebSocket for realtime tracking updates.

Events:

- `delivery:location_update`
- `delivery:location_received`
- `delivery:staff_online`
- `delivery:staff_offline`
- `delivery:status_changed`
- `delivery:eta_updated`

### Redis

Use Redis for:

- Latest delivery staff location.
- Active delivery sessions.
- Online/offline delivery staff presence.
- Temporary ETA cache.

### PostgreSQL

Use PostgreSQL for:

- Delivery zones.
- Delivery slots.
- Delivery staff.
- Delivery assignments.
- Delivery status history.
- Optional location history.

### Optional Location History

Store location history only if needed for:

- Delivery proof.
- Dispute resolution.
- Operational analytics.

Avoid storing excessive location history by default.

## Location Data

Live location update should include:

- Delivery assignment ID.
- Delivery staff ID.
- Latitude.
- Longitude.
- Accuracy.
- Heading.
- Speed.
- Timestamp.

## Customer Privacy And Safety

- Show only assigned delivery staff location for the customer's own order.
- Do not expose other delivery staff.
- Stop location sharing after delivery.
- Do not show exact staff phone unless business approves.
- Protect tracking routes with secure order access.

## Delivery Staff Mobile UI

Delivery staff interface should include:

- Assigned orders.
- Accept delivery.
- Pickup confirmation.
- Start delivery.
- Map/navigation link.
- Customer address.
- Customer contact action.
- Mark delivered.
- Report issue.

This should work well on mobile/PWA.

## Delivery Issue Flow

Delivery staff can report:

- Customer unavailable.
- Address issue.
- Payment issue.
- Vehicle issue.
- Product damaged.
- Other delay.

Admin should see delivery issue alerts.

## Proof Of Delivery

Future proof of delivery can include:

- Delivery photo.
- Customer OTP.
- Customer signature.
- COD collected confirmation.

For first production planning, customer OTP or simple delivered confirmation can be considered.

## Notifications

Send notifications when:

- Delivery slot is confirmed.
- Delivery staff is assigned.
- Order is picked up.
- Order is out for delivery.
- Delivery staff is nearby.
- Order is delivered.
- Delivery is delayed.
- Delivery fails.

Channels:

- WhatsApp.
- SMS for urgent fallback.
- Email for summaries.
- Realtime app/web update.

## Admin Dashboard Signals

Delivery should update:

- Pending deliveries.
- Assigned deliveries.
- Out-for-delivery count.
- Delayed deliveries.
- Failed deliveries.
- Delivery staff availability.

## Error And Fallback States

Customer tracking errors:

- Delivery location unavailable.
- Delivery staff offline.
- ETA unavailable.
- Map failed to load.

Delivery staff errors:

- GPS permission denied.
- Weak network.
- Location update failed.
- Assignment no longer active.

Admin errors:

- Staff unavailable.
- Delivery assignment failed.
- Map data delayed.

Each state should show a clear next action.

## Recommended First Implementation Order

1. Delivery zones.
2. Delivery slots and capacity.
3. Delivery staff profiles.
4. Manual delivery assignment.
5. Delivery status flow.
6. Customer delivery tracking page.
7. Mapbox map integration.
8. Delivery staff location sharing.
9. WebSocket live tracking.
10. Redis latest-location cache.
11. Admin active delivery map.
12. Delivery notifications.
13. Delivery issue reporting.

