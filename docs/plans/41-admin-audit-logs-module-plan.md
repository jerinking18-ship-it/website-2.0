# Admin Audit Logs Module Plan

## Purpose

The Audit Logs module should be the production accountability and security record for the whole admin panel. It should show who did what, when it happened, where it happened from, which record changed, and what changed before and after.

This module must not be a static log list. It should work like a real compliance and security desk with searchable logs, editable review state, risk alerts, session controls, export tracking, and audit policy settings.

## Recommended Tabs

- Overview
- Activity Logs
- Security Events
- Data Changes
- Admin Sessions
- Exports
- Risk Alerts
- Settings

## Overview

The overview should show a quick control room summary.

Metrics:

- Total admin actions today.
- High-risk actions.
- Failed login attempts.
- 2FA events.
- Data edits today.
- Deleted or archived records.
- Export/download actions.
- Suspicious sessions.
- Most active admin.
- Latest critical event.

Useful overview actions:

- Open activity logs.
- Review high-risk actions.
- Open failed login attempts.
- Review active sessions.
- Export audit report.
- Open audit policy settings.

## Activity Logs

The activity log should track normal admin work across the platform.

Fields:

- Action ID.
- Admin user.
- Admin email.
- Role.
- Module.
- Action type.
- Target record.
- Timestamp.
- Status.
- IP address.
- Device/browser.
- Location.
- Risk level.
- Notes.

Example actions:

- Product created.
- Product stock updated.
- Order status changed.
- Refund approved.
- Coupon edited.
- Delivery rider assigned.
- Customer profile updated.
- Finance settlement reconciled.
- Staff permission changed.
- Settings updated.
- Supplier purchase order created.

Primary actions:

- Open log detail.
- Mark reviewed.
- Add audit note.
- Escalate to owner.
- Open target record.
- Export selected logs.

## Security Events

Security events should cover login, authentication, access, and account risk.

Events:

- Login success.
- Login failure.
- 2FA success.
- 2FA failure.
- Password changed.
- Role changed.
- Permission added.
- Permission removed.
- Suspicious IP detected.
- Session expired.
- Account locked.
- Admin invited.
- Admin deactivated.
- Password reset required.

Fields:

- Event ID.
- Admin user.
- Email.
- Event type.
- Result.
- Timestamp.
- IP address.
- Device.
- Browser.
- Location.
- Risk level.
- Review status.
- Security note.

Primary actions:

- Mark reviewed.
- Force logout session.
- Disable admin account.
- Require password reset.
- Require 2FA reset.
- Block IP/device.
- Escalate to owner.

## Data Changes

Data changes should show before/after values for important edits.

Fields:

- Change ID.
- Module.
- Record ID.
- Record name.
- Field changed.
- Old value.
- New value.
- Changed by.
- Change reason.
- Timestamp.
- Risk level.
- Approval status.
- Review note.

Important modules:

- Products.
- Inventory.
- Orders.
- Refunds.
- Finance.
- Customers.
- Staff.
- Settings.
- Suppliers.
- Promotions.
- Categories.

Primary actions:

- Open change detail.
- Compare before/after.
- Mark reviewed.
- Require approval.
- Escalate to owner.
- Add note.
- Open target record.

## Admin Sessions

Admin sessions should track active and past admin access.

Fields:

- Session ID.
- Admin name.
- Email.
- Role.
- Login time.
- Last activity.
- IP address.
- Device.
- Browser.
- Location.
- Session status.
- 2FA verified.
- Trusted device.
- Risk level.
- Session note.

Session statuses:

- Active.
- Idle.
- Expired.
- Forced logout.
- Blocked.
- Trusted.

Primary actions:

- Force logout.
- Mark trusted device.
- Block device.
- Require re-authentication.
- Mark reviewed.
- Add session note.

## Exports

Exports should track sensitive downloads and report exports.

Fields:

- Export ID.
- Admin user.
- Email.
- Export type.
- Module.
- File format.
- Date range.
- Rows exported.
- Status.
- Download time.
- IP address.
- Reason.
- Review status.

Sensitive export examples:

- Customer list.
- Orders report.
- Finance report.
- Refund report.
- Audit logs report.
- Staff permissions report.
- Inventory valuation report.

Primary actions:

- Open export detail.
- Mark reviewed.
- Add export reason.
- Revoke download.
- Export audit trail.
- Escalate to owner.

## Risk Alerts

Risk alerts should highlight dangerous or sensitive actions.

High-risk examples:

- Owner permission changed.
- Finance payout edited.
- Refund approved above threshold.
- Staff role changed.
- Settings changed.
- Bulk product deleted.
- Customer data exported.
- Login from unknown device.
- Multiple failed login attempts.
- Audit log export requested.
- Supplier payment changed.
- Tax settings edited.

Fields:

- Alert ID.
- Alert type.
- Module.
- Target record.
- Trigger reason.
- Risk level.
- Admin user.
- Timestamp.
- Current status.
- Owner note.

Primary actions:

- Mark reviewed.
- Escalate to owner.
- Add internal note.
- Lock account.
- Require re-authentication.
- Open linked log.
- Open linked session.

## Settings

Audit settings should control how much information is captured and who can access it.

Settings:

- Audit log retention period.
- Track IP address.
- Track approximate location.
- Track device/browser.
- Track before/after changes.
- Require reason for sensitive changes.
- Require owner approval for critical actions.
- Alert owner on high-risk events.
- Allow audit export only to owner.
- Mask customer personal data in logs.
- Auto-lock admin after suspicious activity.
- Keep security events immutable.

Primary actions:

- Save audit policy.
- Reset policy to recommended defaults.
- Export policy.
- Test high-risk alert.

## Filters And Search

Filters must work for:

- Admin user.
- Role.
- Module.
- Action type.
- Risk level.
- Status.
- Date range.
- IP address.
- Record ID.
- Event type.
- Review state.

Search should find:

- Order ID.
- Product SKU.
- Refund ID.
- Payment ID.
- Admin email.
- Customer name.
- IP address.
- Action ID.
- Event ID.
- Export ID.
- Session ID.

## Production UI Requirements

The Audit Logs module should follow the admin production quality rule:

- No dead buttons.
- No static-only dialogs.
- Every log detail dialog should have editable review fields.
- Every primary action should update visible state.
- Search should work.
- Filters should work.
- Risk review actions should be visible and clear.
- Session controls should update session status.
- Export review actions should update export state.
- Settings should save visible state.
- Dialogs should use the same admin input style as other modules.
- Logs may begin with frontend seeded state, but review state and actions must work inside the UI.

## CQRS Backend Plan

Future commands:

- `CreateAuditLogCommand`
- `MarkAuditLogReviewedCommand`
- `AddAuditLogNoteCommand`
- `EscalateAuditLogCommand`
- `MarkSecurityEventReviewedCommand`
- `ForceLogoutAdminSessionCommand`
- `BlockAdminDeviceCommand`
- `RequireAdminReauthenticationCommand`
- `RequireAdminPasswordResetCommand`
- `RequireAdminTwoFactorResetCommand`
- `MarkDataChangeReviewedCommand`
- `ApproveSensitiveDataChangeCommand`
- `MarkExportReviewedCommand`
- `RevokeAuditExportCommand`
- `UpdateAuditSettingsCommand`
- `ExportAuditReportCommand`

Future queries:

- `GetAuditDashboardQuery`
- `ListActivityLogsQuery`
- `GetActivityLogDetailQuery`
- `ListSecurityEventsQuery`
- `ListDataChangesQuery`
- `ListAdminSessionsQuery`
- `ListAuditExportsQuery`
- `ListRiskAlertsQuery`
- `GetAuditSettingsQuery`
- `SearchAuditLogsQuery`

Future events:

- `AuditLogCreated`
- `AuditLogReviewed`
- `AuditLogEscalated`
- `SecurityEventReviewed`
- `AdminSessionForcedLogout`
- `AdminDeviceBlocked`
- `AdminReauthenticationRequired`
- `AdminPasswordResetRequired`
- `AdminTwoFactorResetRequired`
- `DataChangeReviewed`
- `SensitiveDataChangeApproved`
- `AuditExportReviewed`
- `AuditExportRevoked`
- `AuditSettingsUpdated`
- `AuditReportExported`

## Recommended First Build Scope

For the first frontend admin implementation, build:

- Sidebar navigation item: `Audit Logs`.
- Route: `/audit-logs`.
- Overview metrics.
- Searchable activity log table.
- Security events table with review actions.
- Data-change table with before/after detail.
- Admin sessions table with session controls.
- Export tracking table.
- Risk alert review queue.
- Audit settings form.
- Editable detail dialogs for activity logs, security events, data changes, sessions, exports, and risk alerts.

This will make the admin panel feel much more production-grade because every important admin action becomes traceable and reviewable.
