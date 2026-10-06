# Admin Notifications Module Plan

## Goal

Create a professional admin notification command center for managing customer messages, automated alerts, marketing broadcasts, and internal store alerts across WhatsApp, SMS, email, push, and in-app notifications.

The module should not feel like an empty settings page. It should help the admin quickly understand what was sent, what failed, what is scheduled, and what needs attention.

## Recommended Page Structure

Use four main tabs:

- Overview
- Create
- Scheduled
- History

This keeps the page simple for the admin while still supporting advanced notification operations.

## Notification Overview

Show high-level performance cards:

- Total notifications sent today
- Failed notifications
- Scheduled notifications
- Open/read rate
- WhatsApp delivery status
- SMS delivery status
- Email delivery status
- In-app notification activity

Recommended quick actions:

- Create campaign
- Retry failed
- View scheduled
- Open templates

## Create Notification

Allow admin to create and send:

- Push notification
- Email campaign
- WhatsApp message
- SMS message
- In-app notification

Suggested form fields:

- Notification title
- Message body
- Audience
- Channel
- Schedule time
- CTA button text
- Target page, product, category, or offer
- Priority
- Expiry time
- Test recipient

Supported send modes:

- Send now
- Schedule for later
- Save as draft
- Send test

## Audience Targeting

Admin should be able to target:

- All customers
- New customers
- Repeat buyers
- Inactive customers
- COD users
- High cart value users
- Customers with abandoned carts
- Customers by category interest
- Customers by location or delivery zone
- Customers with failed payments

Useful audience insights:

- Estimated recipient count
- Preferred channels
- Last campaign response
- Risk warning for over-messaging

## Notification Templates

Reusable templates should include:

- Order confirmed
- Order packed
- Out for delivery
- Delivered
- Coupon available
- Flash sale
- Back in stock
- Payment reminder
- Abandoned cart reminder
- Loyalty reward
- Refund update
- Support follow-up

Each template should store:

- Template name
- Channel
- Message copy
- Variables
- CTA
- Last used date
- Performance

Example variables:

- Customer name
- Order ID
- Delivery slot
- Coupon code
- Product name
- Cart total

## Scheduled Notifications

Show a table or calendar with:

- Campaign name
- Channel
- Audience
- Scheduled time
- Status
- Owner/admin
- Recipient count
- Edit action
- Pause action
- Cancel action

Statuses:

- Draft
- Scheduled
- Sending
- Sent
- Paused
- Failed

## Notification History

Admin should be able to review:

- Sent message
- Customer or audience
- Channel
- Delivery status
- Time sent
- Open/read status
- Click status
- Failed reason
- Retry option

Recommended filters:

- Channel
- Status
- Date
- Audience
- Campaign
- Customer

## Automation Rules

Important automation rules for production:

- Send WhatsApp after order confirmation
- Send SMS when order is out for delivery
- Send email invoice after payment
- Send abandoned cart reminder after 30 minutes
- Send back-in-stock alert
- Send coupon after first order
- Send delivery delay alert
- Send refund status update
- Send low-stock alert to admin
- Send urgent support ticket alert to admin

Each rule should support:

- Trigger
- Channel
- Audience
- Template
- Delay
- Active/inactive status
- Last run
- Failure count

## Failed Delivery Center

This section should help the admin fix communication problems quickly.

Track:

- Failed WhatsApp messages
- Failed SMS messages
- Bounced emails
- Push notification failures
- Invalid phone numbers
- Invalid email addresses
- Provider errors

Actions:

- Retry
- Edit customer contact
- Switch channel
- Mark resolved
- Export failed list

## Admin Alerts

Internal store alerts should include:

- Low stock alert
- New order alert
- Delivery delayed
- Refund request
- Support ticket urgent
- High coupon abuse risk
- Payment failure spike
- Delivery partner unavailable

These alerts should be separate from customer campaigns so the admin team can react quickly.

## Production API Integrations Needed Later

Likely integrations:

- WhatsApp Business API
- SMS provider such as Twilio, MSG91, or Textlocal
- Email provider such as Resend, SendGrid, Postmark, or AWS SES
- Push notification provider such as Firebase Cloud Messaging
- Internal in-app notification service
- Webhook system for delivery receipts
- Queue system for bulk sending

## Recommended Mock Version First

For the frontend mock, build these working sections first:

- Overview cards
- Create notification modal/form
- Channel cards for WhatsApp, SMS, email, push, and in-app
- Scheduled notification list
- Notification history table
- Failed delivery panel
- Template cards
- Automation rule toggles

All buttons should change mock state, open dialogs, filter data, or show clear admin feedback.
