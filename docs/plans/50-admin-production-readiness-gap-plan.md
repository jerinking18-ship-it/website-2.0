# Admin Production Readiness Gap Plan

## Purpose

This document records what is still left to add or strengthen in the admin panel before it can be considered a real production-grade grocery ecommerce admin system.

The current admin panel has broad frontend coverage and editable local state, but production readiness requires backend persistence, security, integrations, validation, and operational hardening.

## Current Status

The admin panel currently includes major modules for:

- Dashboard.
- Products.
- Categories.
- Orders.
- Inventory.
- Suppliers.
- Delivery.
- Support.
- Customers.
- Coupons.
- Promotions.
- Refunds and returns.
- Finance.
- Audit logs.
- Content manager.
- Admin account.
- Reviews and ratings.
- Loyalty and wallet.
- Store locations and branches.
- Integrations.
- System health.
- Legal and compliance.
- Notifications.
- Staff.
- Reports.
- Settings.

The frontend now supports editable forms, working actions, route coverage, and browser-level local persistence. This is useful for product flow and client review, but it is not enough for final production launch.

## Remaining Production Work

### 1. Backend Connection

The admin frontend must connect to real CQRS APIs and database persistence.

Required work:

- Commands for create, update, approve, reject, assign, export, publish, archive, retry, refund, reconcile, and delete operations.
- Queries for list views, detail views, search, filters, dashboards, analytics, and reports.
- Server-side validation for every admin form.
- Server-generated IDs instead of frontend-only IDs.
- Database persistence through PostgreSQL and Prisma.
- Proper API error handling and retries.

### 2. RBAC And Permissions

The admin panel needs proper role-based access control.

Required roles:

- Owner.
- Store manager.
- Product manager.
- Inventory staff.
- Supplier manager.
- Order manager.
- Delivery manager.
- Support agent.
- Finance manager.
- Marketing manager.
- Compliance manager.
- Read-only auditor.

Required behavior:

- Hide or disable restricted actions.
- Prevent unauthorized API access server-side.
- Require owner approval for sensitive actions.
- Log permission-denied attempts.

### 3. Real Authentication

Admin access needs production security.

Required work:

- Protected admin routes.
- Admin login connected to backend auth.
- 2FA verification.
- Password reset and recovery.
- Session expiry.
- Trusted devices.
- Device and IP tracking.
- Failed login lockout.
- Logout from all devices.

### 4. Bulk Operations

Admin teams need efficient bulk tools.

Required bulk tools:

- Bulk product upload.
- Bulk image upload.
- Bulk price update.
- Bulk stock update.
- Bulk category mapping.
- Bulk coupon import.
- Bulk order status update.
- Bulk customer segment update.
- Bulk notification send.
- Bulk export downloads.

### 5. Advanced Product Pricing

Product pricing needs deeper grocery-specific controls.

Required pricing fields:

- MRP.
- Selling price.
- Sale price.
- Margin.
- Tax slab.
- Unit price.
- Weight and pack variants.
- Combo packs.
- Substitution settings.
- Branch-wise price.
- Time-based offers.

### 6. Warehouse And Purchase Flow

Inventory needs full operational flow beyond simple stock updates.

Required work:

- Purchase order creation.
- Goods received note.
- Vendor invoice matching.
- Batch tracking.
- Expiry control.
- Wastage.
- Shrinkage.
- Damaged stock.
- Stock transfer between branches.
- Supplier claims.
- Low-stock reorder rules.

### 7. Order Exception Center

Production order management needs a dedicated exception workflow.

Exceptions to handle:

- Failed payment.
- Delayed order.
- Missing item.
- Rider issue.
- Customer unreachable.
- Address problem.
- Partial delivery.
- Cancellation approval.
- Replacement request.
- Refund escalation.

### 8. Customer Segmentation

Customer management needs stronger segmentation.

Segments to support:

- VIP customers.
- High-value customers.
- Inactive customers.
- New customers.
- COD-heavy customers.
- Complaint-heavy customers.
- Wallet-heavy customers.
- Location-based customers.
- Coupon-abuse risk customers.
- Subscription or repeat buyers.

### 9. Live Operations Wall

The admin dashboard should include a real-time operational command wall.

Live signals:

- Today orders.
- Packing queue.
- Rider assignment.
- Delayed deliveries.
- Live delivery map.
- Support SLA.
- Refund SLA.
- Stockouts.
- Low inventory.
- Failed payment queue.
- High-risk events.

### 10. Real Reports

Reports must be generated from real database records.

Required reports:

- Sales report.
- GST and tax report.
- Inventory report.
- Customer report.
- Campaign report.
- Wallet and loyalty report.
- Refund report.
- Branch report.
- Delivery report.
- Staff performance report.
- Supplier report.
- Audit export.

### 11. Security Hardening

Admin actions must be protected and traceable.

Required controls:

- Immutable audit logs.
- Suspicious login detection.
- Sensitive export approval.
- IP and device monitoring.
- Masking for sensitive customer data.
- Owner approval for high-risk changes.
- Rate limits for destructive actions.
- Server-side permission checks.

### 12. Backend Integrations

Production requires real service providers.

Likely integrations:

- Razorpay or Stripe for payments.
- WhatsApp Business API.
- SMS provider.
- Email provider.
- Maps provider.
- Push notifications.
- GST or invoice service.
- Analytics.
- Storage/CDN.
- Error monitoring.
- Logging and observability.

### 13. Production QA

Every admin module needs proper product quality states.

Required states:

- Loading.
- Empty.
- Error.
- Success.
- Validation error.
- Permission denied.
- Confirmation required.
- Undo or recovery where needed.
- Network failure.
- Optimistic update rollback.

### 14. Admin Design Overhaul

The admin panel is functional, but a true premium 2026 admin still needs deeper UI polish.

Required design improvements:

- Better dashboard information architecture.
- Denser professional tables.
- Cleaner forms.
- Stronger visual hierarchy.
- Better empty states.
- More realistic charts and metrics.
- More consistent action placement.
- Better responsive behavior.
- Cleaner admin navigation grouping.
- Production-grade review of spacing, typography, and states.

## Priority Order

1. Backend CQRS APIs and Prisma persistence.
2. Authentication, 2FA, sessions, and protected routes.
3. RBAC and server-side permissions.
4. Server-side validation and error handling.
5. Audit logs and sensitive action tracking.
6. Real integrations for payment, notifications, maps, and storage.
7. Production reporting.
8. Live operations dashboard.
9. Bulk operations.
10. Final admin UI overhaul and QA pass.

## Production Definition

The admin panel should not be called production-ready until:

- Data is stored in the real database.
- Every important action calls a backend command.
- Every list view is loaded from backend queries.
- Auth and RBAC are enforced server-side.
- Audit logs are immutable.
- Sensitive actions require confirmation and permission.
- Forms have validation and error states.
- Reports are generated from real data.
- Integrations are connected to real providers.
- Full QA is completed across all admin routes.

