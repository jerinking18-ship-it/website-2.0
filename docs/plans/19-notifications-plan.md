# Notifications Plan

## Goal

Define the notification system for the grocery ecommerce platform.

The system should support:

- Email notifications.
- WhatsApp notifications.
- SMS notifications.
- OTP delivery.
- Order updates.
- Delivery updates.
- Support chat alerts.
- Admin alerts.
- Retry handling.
- Notification templates.
- Customer preferences.

## Notification Principles

- Notifications should be reliable and trackable.
- Critical messages should have fallback channels.
- Templates should be reusable and manageable.
- Notifications should be sent through queues.
- Failed notifications should be retried.
- Customers should not receive unnecessary spam.
- Admins should be alerted only for meaningful operational events.

## Channels

### Email

Use for:

- Order confirmation.
- Order receipt.
- Support message summaries.
- Account/security messages.
- Admin reports.
- Refund confirmations.

### WhatsApp

Use for:

- Order confirmation.
- Delivery updates.
- Support replies.
- Important customer alerts.
- COD reminders.

### SMS

Use for:

- OTP.
- Critical delivery alerts.
- Fallback when WhatsApp fails.
- Urgent support updates.

## Notification Categories

## OTP Notifications

Used for:

- Customer phone login.
- Checkout phone verification.
- Admin 2FA fallback only if approved later.

Rules:

- OTP should expire quickly.
- OTP should be rate-limited.
- OTP should never be logged in plain text.
- OTP messages should be short and clear.

## Order Notifications

Send to customer when:

- Order is placed.
- Order is confirmed.
- Order is packed.
- Order is out for delivery.
- Order is delivered.
- Order is cancelled.
- Refund is created.
- Payment fails.

Channels:

- WhatsApp for important updates.
- Email for receipt and order summary.
- SMS for critical fallback.

## Delivery Notifications

Send to customer when:

- Delivery slot is confirmed.
- Delivery staff is assigned.
- Order is out for delivery.
- Delivery is delayed.
- Delivery is completed.
- Delivery fails.

Send to delivery staff when:

- New delivery is assigned.
- Delivery assignment changes.
- Delivery is cancelled.

## Support Notifications

Send to admin/support when:

- New support conversation starts.
- Customer sends message while no agent is online.
- Conversation remains unassigned too long.
- Customer replies to pending conversation.

Send to customer when:

- Agent replies while customer is offline.
- Conversation is marked pending.
- Conversation is resolved.
- Support message requires customer action.

Channels:

- Realtime WebSocket first.
- Email for summaries.
- WhatsApp for important updates.
- SMS for urgent fallback.

## Admin Notifications

Notify admins when:

- New order is placed.
- Payment fails.
- Product goes out of stock.
- Inventory becomes low.
- Delivery slot is full.
- Support conversation is unassigned.
- Refund requires review.

Admin notification surfaces:

- Admin top-bar notification menu.
- Email for high-priority alerts.
- Optional WhatsApp/SMS for urgent operational alerts.

## Inventory Notifications

Send alerts when:

- Product reaches low-stock threshold.
- Product becomes out of stock.
- Batch is expiring soon.
- Inventory adjustment is unusually large.

Recipients:

- Owner.
- Store manager.
- Inventory staff.

## Payment Notifications

Send notifications for:

- Mock payment success/failure during development.
- Cash on delivery selected.
- COD payment collected.
- Razorpay payment success later.
- Razorpay payment failure later.
- Refund created.
- Refund completed.

## Notification Templates

Templates should support:

- Channel.
- Template name.
- Subject for email.
- Body.
- Variables.
- Active/inactive status.

Example variables:

- `customer_name`
- `order_number`
- `delivery_slot`
- `order_total`
- `support_conversation_id`
- `store_name`

## Example Templates

### OTP SMS

Purpose:

- Customer login or checkout verification.

Variables:

- `otp_code`
- `expires_in_minutes`

### Order Confirmation Email

Purpose:

- Send order receipt and summary.

Variables:

- `customer_name`
- `order_number`
- `order_total`
- `delivery_slot`

### WhatsApp Out For Delivery

Purpose:

- Notify customer that order is out for delivery.

Variables:

- `order_number`
- `delivery_staff_name`
- `support_link`

### Support Reply Notification

Purpose:

- Notify customer when support replies while they are offline.

Variables:

- `customer_name`
- `message_preview`
- `conversation_link`

## Notification Queue

Use BullMQ with Redis for notification jobs.

Job data should include:

- Channel.
- Recipient.
- Template ID.
- Payload.
- Priority.
- Scheduled time.
- Retry count.
- Related resource type.
- Related resource ID.

## Retry Rules

Retry failed notifications with backoff.

Recommended retry behavior:

- Retry transient provider failures.
- Do not retry invalid phone/email.
- Stop after max retry count.
- Mark as failed with reason.
- Alert admin for repeated critical failures.

## Fallback Rules

Example fallback:

1. Try WhatsApp.
2. If WhatsApp fails and message is critical, send SMS.
3. Email can still be sent as receipt/history.

Critical fallback examples:

- OTP.
- Out for delivery.
- Payment failure.
- Delivery failed.

## Customer Preferences

Customers should be able to control non-critical notifications later.

Preferences can include:

- Order updates.
- Promotional messages.
- Support updates.
- Email enabled.
- WhatsApp enabled.
- SMS enabled.

Critical transactional notifications should still be allowed where legally permitted.

## Admin Preferences

Admins can control:

- New order alerts.
- Low-stock alerts.
- Support alerts.
- Delivery alerts.
- Daily summary reports.

## Notification Statuses

Recommended statuses:

- `queued`
- `processing`
- `sent`
- `failed`
- `cancelled`
- `skipped`

## Notification Providers

Provider choices can be decided during implementation.

Possible providers:

- Email: Resend, SendGrid, Amazon SES, or SMTP.
- SMS: Twilio, MSG91, or local SMS provider.
- WhatsApp: Twilio WhatsApp, Meta WhatsApp Cloud API, or local provider.

## Security And Compliance

- Do not log OTP values in plain text.
- Do not expose customer contact details unnecessarily.
- Validate notification recipients.
- Store provider response IDs.
- Respect opt-out preferences for marketing.
- Separate transactional and promotional messages.

## Recommended First Implementation Order

1. Notification templates.
2. Notification job table.
3. Queue worker.
4. OTP SMS.
5. Order confirmation email.
6. Order WhatsApp updates.
7. Support message notifications.
8. Admin notification menu.
9. Retry and fallback handling.
10. Customer/admin preferences.

