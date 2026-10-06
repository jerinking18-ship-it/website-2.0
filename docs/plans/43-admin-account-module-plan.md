# Admin Account Module Plan

## Purpose

The Admin Account module should be the personal control center for the logged-in owner, manager, or staff admin. It should handle profile details, security, 2FA, sessions, permissions visibility, notifications, preferences, personal activity, and account recovery.

This module should feel like a production-grade account area, not a simple profile card. Every form and action should have a visible working state and be ready for backend/CQRS persistence later.

## Recommended Tabs

- Overview
- Profile
- Security
- Sessions
- Permissions
- Notifications
- Preferences
- Activity
- Recovery

## Overview

The overview should show account health at a glance.

Fields and metrics:

- Admin name.
- Role.
- Email.
- Phone.
- 2FA status.
- Last login.
- Active sessions.
- Permission level.
- Security risk status.
- Pending security actions.
- Recent account activity.

Primary actions:

- Edit profile.
- Change password.
- Manage 2FA.
- Review sessions.
- Open permissions.
- Update notification preferences.

## Profile

The profile tab should allow the admin to edit personal details.

Editable fields:

- Full name.
- Display name.
- Email.
- Phone.
- Avatar initials/image.
- Job title.
- Department.
- Assigned store/location.
- Timezone.
- Language.
- Emergency contact.
- Internal note.

Primary actions:

- Save profile.
- Change avatar.
- Verify email.
- Verify phone.

## Security

The security tab should manage account protection.

Fields and controls:

- Current password.
- New password.
- Confirm password.
- 2FA enabled/disabled.
- 2FA method.
- Backup codes status.
- Trusted devices.
- Security questions if needed.
- Require re-authentication.
- Login alerts.
- Password last changed.
- Failed login count.
- Account lock status.

2FA methods:

- Authenticator app.
- SMS.
- Email.

Primary actions:

- Update password.
- Enable 2FA.
- Disable 2FA.
- Reset 2FA.
- Generate backup codes.
- Revoke trusted devices.
- Send login alert test.
- Lock account if owner/admin.

## Sessions

The sessions tab should manage the admin's active sessions.

Fields:

- Session ID.
- Device.
- Browser.
- IP address.
- Location.
- Login time.
- Last activity.
- 2FA verified.
- Trusted device.
- Session status.

Session statuses:

- Active.
- Idle.
- Expired.
- Logged out.
- Re-auth required.
- Trusted.

Primary actions:

- Logout session.
- Logout all other sessions.
- Mark device trusted.
- Remove trusted device.
- Require re-authentication.

## Permissions

The permissions tab should show what the admin can access.

This tab should mostly be read-only for the current admin unless the logged-in user is the owner editing another staff member from the Staff module.

Fields:

- Role.
- Access level.
- Allowed modules.
- Restricted modules.
- Can approve refunds.
- Can access finance.
- Can export customer data.
- Can manage staff.
- Can change settings.
- Can publish content.
- Can view audit logs.

Primary actions:

- View permission details.
- Request access.
- Contact owner.
- Open Staff module if owner.

## Notifications

The notifications tab should manage personal admin alert preferences.

Notification types:

- Order alerts.
- Inventory alerts.
- Support alerts.
- Refund alerts.
- Finance alerts.
- Security alerts.
- Staff alerts.
- Content approval alerts.
- Daily summary.
- Weekly report.

Channels:

- In-app.
- Email.
- SMS.
- WhatsApp.

Primary actions:

- Save preferences.
- Send test notification.
- Mute non-critical alerts.
- Enable security-only mode.

## Preferences

The preferences tab should control personal admin UI behavior.

Fields:

- Theme preference.
- Compact/dense mode.
- Default landing page.
- Default admin module.
- Table row density.
- Currency display.
- Date/time format.
- Language.
- Timezone.
- Sidebar pinned modules.
- Search behavior.

Primary actions:

- Save preferences.
- Reset defaults.

## Activity

The activity tab should show the current admin's personal account activity.

Activity examples:

- Recent logins.
- Profile edits.
- Password changes.
- 2FA changes.
- Permission changes.
- Export downloads.
- Sensitive actions.
- Failed login attempts.

Primary actions:

- Open audit log.
- Mark activity reviewed.
- Report suspicious activity.

## Recovery

The recovery tab should manage account recovery and backup access.

Fields:

- Recovery email.
- Recovery phone.
- Backup codes status.
- Emergency owner contact.
- Account recovery questions if needed.
- Last recovery update.
- Recovery lock status.

Primary actions:

- Update recovery email.
- Update recovery phone.
- Regenerate backup codes.
- Download backup codes.
- Request account recovery.
- Lock recovery changes for 24 hours.

## Production UI Requirements

The Admin Account module should follow the admin production quality rule:

- No dead buttons.
- No static-only dialogs.
- Every form should be editable where appropriate.
- Every primary action should update visible state.
- Profile save should update visible profile data.
- Security actions should update security state.
- Session actions should update session status.
- Notification preferences should save visible state.
- Preferences should save visible state.
- Recovery actions should update recovery state.
- Activity review actions should update review state.
- Dialogs should use the same admin input style as the rest of the panel.
- The first UI can use frontend state, but it should be ready for backend persistence.

## Security And Permission Notes

- Owners can manage their own account and review high-risk actions.
- Non-owner admins should not be able to increase their own permissions.
- Permission visibility should not imply permission editing.
- Sensitive actions should require re-authentication later.
- Password, 2FA, trusted-device, and recovery changes should be written to audit logs later.
- Session logout and trusted-device controls should connect to backend session storage later.

## CQRS Backend Plan

Future commands:

- `UpdateAdminProfileCommand`
- `VerifyAdminEmailCommand`
- `VerifyAdminPhoneCommand`
- `UpdateAdminPasswordCommand`
- `EnableAdminTwoFactorCommand`
- `DisableAdminTwoFactorCommand`
- `ResetAdminTwoFactorCommand`
- `GenerateAdminBackupCodesCommand`
- `RevokeTrustedAdminDeviceCommand`
- `LogoutAdminSessionCommand`
- `LogoutOtherAdminSessionsCommand`
- `TrustAdminDeviceCommand`
- `RequireAdminReauthenticationCommand`
- `UpdateAdminNotificationPreferencesCommand`
- `SendAdminTestNotificationCommand`
- `UpdateAdminUiPreferencesCommand`
- `ResetAdminUiPreferencesCommand`
- `MarkAdminActivityReviewedCommand`
- `ReportSuspiciousAdminActivityCommand`
- `UpdateAdminRecoveryEmailCommand`
- `UpdateAdminRecoveryPhoneCommand`
- `RequestAdminAccountRecoveryCommand`
- `LockAdminRecoveryChangesCommand`

Future queries:

- `GetAdminAccountOverviewQuery`
- `GetAdminProfileQuery`
- `GetAdminSecurityQuery`
- `ListAdminSessionsQuery`
- `GetAdminPermissionsQuery`
- `GetAdminNotificationPreferencesQuery`
- `GetAdminUiPreferencesQuery`
- `ListAdminAccountActivityQuery`
- `GetAdminRecoverySettingsQuery`

Future events:

- `AdminProfileUpdated`
- `AdminEmailVerificationRequested`
- `AdminPhoneVerificationRequested`
- `AdminPasswordUpdated`
- `AdminTwoFactorEnabled`
- `AdminTwoFactorDisabled`
- `AdminTwoFactorReset`
- `AdminBackupCodesGenerated`
- `AdminTrustedDeviceRevoked`
- `AdminSessionLoggedOut`
- `AdminOtherSessionsLoggedOut`
- `AdminDeviceTrusted`
- `AdminReauthenticationRequired`
- `AdminNotificationPreferencesUpdated`
- `AdminUiPreferencesUpdated`
- `AdminActivityReviewed`
- `SuspiciousAdminActivityReported`
- `AdminRecoveryEmailUpdated`
- `AdminRecoveryPhoneUpdated`
- `AdminAccountRecoveryRequested`
- `AdminRecoveryChangesLocked`

## Recommended First Build Scope

For the first frontend admin implementation, build:

- Sidebar or account dropdown route: `/account`.
- Overview account health.
- Profile editor.
- Security and 2FA manager.
- Session manager.
- Permission visibility panel.
- Notification preferences.
- UI preferences.
- Personal activity trail.
- Recovery controls.
- Editable forms for profile, security, notification preferences, UI preferences, and recovery.
- Working session actions.
- Working activity review/report actions.

This will make the admin panel feel more complete and secure, especially for owner login, 2FA, sessions, and role-based access visibility.
