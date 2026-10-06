# Admin Integrations Module Plan

## Purpose

The Integrations module should manage all external services connected to the ecommerce platform, including payments, messaging, maps, email, storage, analytics, webhooks, and API keys.

It should let the owner see integration health, test providers, rotate keys, retry failed webhooks, and safely manage provider configuration.

## Recommended Tabs

- Overview
- Payments
- Messaging
- Maps
- Email
- Storage
- Analytics
- Webhooks
- API Keys
- Logs
- Settings

## Overview

Metrics:

- Payment gateway status.
- WhatsApp provider status.
- SMS provider status.
- Email provider status.
- Maps provider status.
- Push notification status.
- Storage/media provider status.
- Analytics status.
- API key status.
- Webhook delivery status.
- Last successful sync.
- Failed webhook count.
- Retry queue.
- Provider latency.
- Environment mode.

Modes:

- Test.
- Live.

## Integration Fields

- Integration ID.
- Provider name.
- Category.
- Status.
- Mode.
- Masked API key.
- Webhook URL.
- Last sync.
- Error message.
- Owner.
- Notes.

Integration statuses:

- Connected.
- Disconnected.
- Error.
- Testing.
- Disabled.

## Recommended Providers

Payments:

- Razorpay.
- Stripe.
- Cashfree.

Messaging:

- WhatsApp Business API.
- Interakt.
- Gupshup.
- MSG91.
- Twilio.

Email:

- Resend.
- SendGrid.
- Amazon SES.

Maps:

- Mapbox.
- Google Maps.

Push:

- Firebase.

Storage:

- S3.
- Cloudinary.

Analytics:

- Google Analytics.
- Meta Pixel.

## Actions

- Connect provider.
- Edit config.
- Test connection.
- Send test message.
- Rotate API key.
- Disable integration.
- Retry failed webhook.
- View logs.
- Switch test/live mode.
- Save webhook URL.

## Production Rules

- API keys should be masked.
- Secret values should not be exposed after saving.
- Key rotation must be written to Audit Logs.
- Failed payment and notification webhooks must be retryable.
- Retried webhook actions must be idempotent.
- Test mode should be visually clear.
- Disabled integrations should block dependent workflows or show warnings.

## Recommended First Build Scope

- Sidebar navigation item: `Integrations`.
- Route: `/integrations`.
- Provider health overview.
- Payment provider controls.
- Messaging provider controls.
- Map/email/storage/analytics controls.
- Webhook retry queue.
- API key manager with masked values.
- Integration logs.
- Test connection actions.
