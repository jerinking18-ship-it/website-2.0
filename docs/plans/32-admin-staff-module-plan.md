# Admin Staff Module Plan

## Goal

Create a professional team and permissions center for the admin panel. The Staff module should help the owner manage employees, shifts, security, access control, invites, and staff activity from one place.

The module should not be a basic staff list. It should support real store operations for order packing, inventory, delivery, support, marketing, and management teams.

## Recommended Tabs

- Overview
- Directory
- Roles
- Shifts
- Activity

## Staff Overview

Show operational summary cards:

- Total staff
- Active today
- On shift
- Pending invites
- 2FA enabled count
- Suspended accounts

Useful quick actions:

- Invite staff
- Open directory
- Review roles
- View activity log

## Staff Directory

Each staff row should show:

- Name
- Role
- Phone/email
- Current shift
- Status
- Assigned zone/module
- Last active
- 2FA status
- Actions: View, Edit, Suspend, Reset password

Important statuses:

- Active
- On shift
- Invited
- Suspended
- Offline

## Roles And Permissions

Roles to support:

- Owner
- Store Manager
- Inventory Manager
- Order Manager
- Delivery Manager
- Support Agent
- Marketing Manager
- Accountant

Permission areas:

- Products
- Orders
- Inventory
- Delivery
- Customers
- Coupons
- Notifications
- Support
- Reports
- Settings

Each role should show:

- Number of users
- Access level
- Permission chips
- Edit permission action
- Duplicate role action

## Shift Management

Track:

- Today's shift roster
- Clock-in/clock-out
- Break status
- Delivery partner availability
- Late staff alerts
- Assigned zones
- Shift completion status

Useful actions:

- Start shift
- End shift
- Mark break
- Assign zone
- Alert staff

## Invites

Admin can:

- Invite new staff
- Choose role
- Choose module access
- Set phone/email
- Send invite through email, SMS, or WhatsApp
- Resend invite
- Cancel invite

Invite form fields:

- Name
- Email
- Phone
- Role
- Assigned module
- Invite channel
- Shift

## Activity Log

Track important staff actions:

- Product edits
- Stock changes
- Order status changes
- Coupon edits
- Refund approvals
- Login activity
- Failed login attempts
- Role changes
- Permission changes

Activity filters:

- Staff member
- Module
- Action type
- Risk level
- Date

## Security

Important security controls:

- 2FA status
- Password reset
- Login device history
- Suspicious login alerts
- Role change history
- Staff suspension
- Failed login attempt review

## Performance

Useful performance metrics for later:

- Orders packed
- Tickets resolved
- Delivery assignments completed
- Inventory updates
- Average response time
- Customer rating for support/delivery

## Recommended Mock Version First

For the frontend mock, build:

- Overview cards
- Staff directory table
- Invite staff form/modal
- Staff profile/details panel
- Role permission cards
- Shift roster
- Activity log
- Security actions
- Performance chips

All visible buttons should change mock state, open a panel/form, filter data, or show clear admin feedback.
