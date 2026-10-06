# Admin Settings Module Plan

## Goal

Create a production-ready store control center for the admin panel. Settings should manage business configuration, delivery rules, payments, checkout behavior, notifications, support, security, inventory policies, legal details, and third-party integrations.

The module should not be a basic settings form. It should give the owner clear control over how the grocery store operates.

## Recommended Tabs

- Store
- Delivery
- Payments
- Checkout
- Notifications
- Security
- Integrations

## Store Profile

Settings to manage:

- Store name
- Logo
- Business email
- Support phone
- GST/tax details
- Store address
- Serviceable city/area
- Store status: Open, Closed, or Maintenance

Useful actions:

- Save profile
- Preview storefront identity
- Switch store status
- Reset profile changes

## Delivery Settings

Settings to manage:

- Delivery zones
- Delivery fees
- Free delivery threshold
- Minimum order value
- Slot timings
- Express delivery toggle
- Rider assignment rules
- Delivery radius
- Map provider settings

Useful actions:

- Add delivery zone
- Update delivery fee
- Enable/disable express delivery
- Save slot timings
- Test map provider

## Payment Settings

Settings to manage:

- COD enable/disable
- Online payment enable/disable
- Payment gateway provider
- UPI settings
- Refund rules
- COD limit
- Failed payment retry rules

Useful actions:

- Save payment rules
- Test payment gateway
- Toggle COD
- Toggle online payment
- Update refund policy

## Checkout Settings

Settings to manage:

- Tax calculation
- Packaging fee
- Handling fee
- Substitution preference
- Address validation rules
- Coupon stacking rule
- Wallet/loyalty usage rules

Useful actions:

- Save checkout rules
- Reset checkout defaults
- Enable/disable substitutions
- Enable/disable wallet usage

## Notification Settings

Settings to manage:

- WhatsApp provider
- SMS provider
- Email provider
- Push notification provider
- Default templates
- Admin alert preferences
- Customer notification toggles

Useful actions:

- Save notification providers
- Test WhatsApp
- Test SMS
- Test email
- Test push notification

## Support Settings

Settings to manage:

- Support working hours
- Auto assignment
- Escalation rules
- SLA timings
- Refund request handling
- WhatsApp support number
- Email support inbox

Useful actions:

- Save support rules
- Toggle auto assignment
- Update SLA timings
- Test support inbox

## Security Settings

Settings to manage:

- Owner 2FA
- Staff 2FA required
- Session timeout
- Login device tracking
- Failed login lockout
- Role permission defaults
- Audit log retention

Useful actions:

- Require staff 2FA
- Reset owner 2FA
- Save session settings
- Export audit log
- Review suspicious login alerts

## Inventory Settings

Settings to manage:

- Low stock threshold
- Expiry alert days
- Batch tracking
- Supplier approval
- Auto reorder rule
- Stock reservation timeout

Useful actions:

- Save inventory rules
- Toggle batch tracking
- Toggle auto reorder
- Update stock thresholds

## Tax And Legal

Settings to manage:

- GST number
- Invoice prefix
- Tax slabs
- FSSAI/license number
- Privacy policy URL
- Terms URL
- Refund policy URL

Useful actions:

- Save legal details
- Preview invoice format
- Validate tax fields

## Integrations

Integrations to manage:

- Mapbox / Google Maps
- WhatsApp Business API
- SMS provider
- Email provider
- Payment gateway
- Analytics
- ERP/accounting software

Each integration should show:

- Provider name
- Connection status
- Last sync
- Health status
- Configure action
- Test action
- Disconnect action

## Recommended Mock Version First

For the frontend mock, build:

- Editable store profile form
- Delivery rules panel
- Payment rules panel
- Checkout rules panel
- Notification provider cards
- Security controls
- Integration status cards
- Save/reset buttons
- Test connection buttons
- Audit feedback after every action

All visible buttons should change mock state, open configuration panels, test a mock provider, reset fields, or show clear admin feedback.
