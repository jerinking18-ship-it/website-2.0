# Authentication And Roles Plan

## Goal

Define authentication, authorization, guest checkout, admin security, and role-based access control for the grocery ecommerce platform.

The system should support:

- Guest shopping.
- Guest checkout.
- Customer phone OTP login.
- Admin email/password login.
- Admin two-factor authentication.
- Role-based access control.
- Protected customer and admin routes.

## Authentication Principles

- Customers should not be forced to create an account before shopping.
- Guest checkout should be allowed.
- Phone OTP should be the primary customer login method.
- Admin accounts must be more secure than customer accounts.
- Admin users should use email/password plus two-factor authentication.
- Admin permissions should be role-based.
- Sensitive admin actions should be audited.

## Customer Authentication

### Guest Shopping

Customers can:

- Browse products.
- Search products.
- Add products to cart.
- Use the cart.
- Start checkout.

### Guest Checkout

Guests can place orders by providing:

- Name.
- Phone number.
- Delivery address.
- Delivery slot.
- Payment method.

Phone verification may be required before final order placement.

### Phone OTP Login

Customer login should use phone OTP.

Flow:

1. Customer enters phone number.
2. System sends OTP.
3. Customer enters OTP.
4. System verifies OTP.
5. Customer session starts.

OTP rules:

- OTP expires after a short time.
- OTP attempts are limited.
- OTP requests are rate-limited.
- OTP values are stored as hashes.
- Expired OTPs cannot be reused.

### Customer Session

Customer session should support:

- Current customer profile.
- Saved addresses.
- Order history.
- Support conversations.
- Preferences.

### Account Creation After Checkout

After order confirmation, the website should encourage the guest customer to create or complete an account.

The system can link the order to the customer phone number.

## Admin Authentication

### Admin Login

Admin login should use:

- Email.
- Password.
- Two-factor authentication.

Flow:

1. Admin enters email and password.
2. System verifies credentials.
3. System requests 2FA code.
4. Admin enters 2FA code.
5. Admin session starts.

### Password Rules

Admin passwords should require:

- Minimum length.
- Strong hashing.
- No plain-text storage.
- Password reset flow later.

### Two-Factor Authentication

Admin 2FA should support:

- Authenticator app first.
- Email-based fallback only if approved later.

2FA should be required for:

- Owner.
- Store manager.
- Product manager.
- Inventory staff.
- Support agent.
- Delivery staff.

### Admin Session Security

Admin sessions should include:

- Secure cookies.
- Session expiration.
- Re-authentication for sensitive settings later.
- Logout from current device.
- Optional logout from all devices later.

## Role-Based Access Control

RBAC should be included from the start.

### Planned Roles

- Owner.
- Store manager.
- Product manager.
- Inventory staff.
- Support agent.
- Delivery staff.

## Role Responsibilities

### Owner

Full access to:

- Dashboard.
- Products.
- Orders.
- Inventory.
- Customers.
- Coupons.
- Delivery.
- Support.
- Notifications.
- Staff.
- Settings.
- Audit logs.

### Store Manager

Access to:

- Dashboard.
- Orders.
- Inventory.
- Products.
- Coupons.
- Delivery.
- Support.
- Customers.

Restrictions:

- Cannot manage owner account.
- Cannot change critical payment settings unless allowed.

### Product Manager

Access to:

- Products.
- Categories.
- Product images.
- Promotions.
- Search settings.

Restrictions:

- Cannot access payments.
- Cannot manage staff.
- Cannot change delivery operations.

### Inventory Staff

Access to:

- Inventory.
- Suppliers.
- Stock adjustments.
- Purchase entries.
- Low-stock alerts.

Restrictions:

- Cannot edit payment settings.
- Cannot manage staff.
- Cannot access sensitive customer data beyond what is required.

### Support Agent

Access to:

- Support inbox.
- Customer support history.
- Order context needed for support.
- Quick replies.

Restrictions:

- Cannot edit products.
- Cannot edit inventory.
- Cannot change payment settings.
- Cannot manage staff.

### Delivery Staff

Access to:

- Assigned deliveries.
- Delivery status updates.
- Customer delivery address and phone for assigned orders only.

Restrictions:

- Cannot access full admin dashboard.
- Cannot edit products or inventory.
- Cannot view unrelated customer records.

## Permission Groups

### Product Permissions

- `products.read`
- `products.create`
- `products.update`
- `products.delete`
- `products.upload_image`
- `categories.manage`

### Order Permissions

- `orders.read`
- `orders.update_status`
- `orders.cancel`
- `orders.refund`
- `orders.assign_delivery`

### Inventory Permissions

- `inventory.read`
- `inventory.adjust`
- `inventory.create_batch`
- `inventory.manage_suppliers`
- `inventory.view_audit`

### Customer Permissions

- `customers.read`
- `customers.update`
- `customers.view_orders`
- `customers.view_support`

### Support Permissions

- `support.read`
- `support.reply`
- `support.assign`
- `support.resolve`
- `support.manage_quick_replies`

### Coupon Permissions

- `coupons.read`
- `coupons.create`
- `coupons.update`
- `coupons.pause`
- `promotions.manage`

### Delivery Permissions

- `delivery.read`
- `delivery.manage_zones`
- `delivery.manage_slots`
- `delivery.assign_staff`
- `delivery.update_status`

### Staff Permissions

- `staff.read`
- `staff.create`
- `staff.update`
- `staff.assign_roles`
- `staff.disable`

### Settings Permissions

- `settings.store`
- `settings.payments`
- `settings.taxes`
- `settings.support`
- `settings.delivery`
- `settings.security`

### Audit Permissions

- `audit.read`

## Route Protection

### Public Customer Routes

No login required:

- Home.
- Product listing.
- Category pages.
- Product detail.
- Search.
- Offers.
- About.
- Contact.
- Policy pages.

### Guest Checkout Routes

Accessible without login:

- Cart.
- Checkout address.
- Checkout delivery.
- Checkout payment.
- Checkout review.

Phone verification may be required before placing order.

### Customer Protected Routes

Customer login required:

- Account.
- Saved addresses.
- Order history.
- Preferences.
- Support conversation history.

### Admin Public Routes

No admin session required:

- Admin login.
- Admin 2FA verification during login.

### Admin Protected Routes

Admin session required:

- Admin dashboard.
- Admin products.
- Admin orders.
- Admin inventory.
- Admin customers.
- Admin coupons.
- Admin delivery.
- Admin support.
- Admin notifications.
- Admin staff.
- Admin settings.

## Future Optional AI Permissions

AI permissions are not part of the first production version. If AI shopping is approved later, possible permissions include:

- `ai.read_sessions`
- `ai.manage_settings`
- `ai.review_suggestions`

Permissions should be checked per route and per action.

## Sensitive Actions

Sensitive actions should require permission checks and audit logs.

Examples:

- Create admin user.
- Assign admin role.
- Change payment settings.
- Cancel order.
- Create refund.
- Adjust inventory.
- Delete product.
- Change delivery fee.
- Export customer data.

## Audit Requirements

Audit logs should capture:

- Admin user.
- Action.
- Resource type.
- Resource ID.
- Timestamp.
- Metadata.
- IP address if available.

## Security Rules

- Hash passwords securely.
- Hash OTP codes.
- Rate-limit OTP requests.
- Rate-limit login attempts.
- Use secure cookies.
- Validate admin permissions on the server.
- Do not trust client-side role checks.
- Protect WebSocket events with session authentication.
- Restrict support agents to allowed conversations.
- Restrict delivery staff to assigned orders only.

## Recommended First Implementation Order

1. Customer guest session.
2. Customer phone OTP.
3. Admin login.
4. Admin 2FA.
5. RBAC roles and permissions.
6. Protected admin routes.
7. Audit logs.
8. Fine-grained support and delivery restrictions.
