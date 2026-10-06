# Admin Refunds And Returns Module Plan

## Purpose

The Refunds and Returns module should be a serious production-level admin area for handling customer refund requests, returned grocery items, payment reconciliation, inventory impact, customer communication, and refund risk review.

This module must not feel like a simple list. It should work like a real operations desk connected to Orders, Payments, Inventory, Delivery, Support, Customers, Finance, and Reports.

## Recommended Admin Tabs

- Overview
- Requests
- Returns
- Approvals
- Finance
- Risk
- Settings

## Overview Dashboard

The overview should show key operational metrics:

- Total refund requests.
- Pending approval.
- Approved refunds.
- Rejected refunds.
- Refunded amount today.
- Refunded amount this week.
- Return pickups pending.
- High-risk refund claims.
- SLA breached requests.
- Finance reconciliation pending.

Useful dashboard actions:

- Create manual refund.
- Open pending approvals.
- Review return pickups.
- Export refund report.
- Open refund settings.

## Refund Request Queue

Each refund request row should include:

- Refund ID.
- Order ID.
- Customer name.
- Customer phone.
- Refund reason.
- Affected items.
- Refund amount.
- Original payment method.
- Refund method.
- Current status.
- SLA timer.
- Risk flag.
- Assigned admin.

Recommended statuses:

- Requested.
- Under review.
- Awaiting customer evidence.
- Approved.
- Rejected.
- Processing refund.
- Refunded.
- Return pickup scheduled.
- Return received.
- Closed.

Primary row actions:

- Open.
- Approve.
- Reject.
- Contact customer.
- Assign reviewer.
- Escalate to owner.

## Refund Detail Form

The refund detail dialog/page should be editable and include:

- Refund ID.
- Linked order ID.
- Customer name.
- Phone.
- Email.
- Refund status.
- Refund reason category.
- Customer note.
- Admin internal note.
- Refund amount.
- Refund method.
- Payment method.
- Gateway transaction ID.
- Evidence status.
- Reviewer.
- Decision note.

Actions:

- Save review.
- Approve refund.
- Reject refund.
- Request more evidence.
- Send WhatsApp update.
- Send SMS update.
- Send email update.
- Open linked order.
- Open support ticket.

## Grocery Refund Reason Categories

Refund reasons should be grocery-specific:

- Wrong item delivered.
- Missing item.
- Damaged packaging.
- Expired product.
- Poor freshness.
- Late delivery.
- Customer cancelled before dispatch.
- Duplicate payment.
- Price mismatch.
- Quality complaint.
- Delivery failed.
- Out of stock after payment.

## Returns Management

The returns tab should manage physical item returns.

Fields:

- Return ID.
- Refund ID.
- Order ID.
- Customer.
- Items to return.
- Return pickup status.
- Pickup slot.
- Assigned rider.
- Pickup address.
- Item condition.
- Restock decision.
- Batch number.
- Expiry date.
- Inventory adjustment note.

Return pickup statuses:

- Not required.
- Pickup pending.
- Pickup scheduled.
- Rider assigned.
- Picked up.
- Return received.
- Return failed.
- Closed.

Item condition values:

- Unopened.
- Damaged.
- Expired.
- Wrong item.
- Missing item.
- Poor freshness.
- Leaked/spoiled.

Restock decisions:

- Restock.
- Quarantine.
- Discard.
- Supplier claim.
- Needs manager review.

## Approval Rules

The approvals tab should help the owner control refund policy.

Recommended approval rules:

- Auto-approve small refunds under a configurable amount.
- Require owner approval above a threshold.
- Require photo evidence for damaged, expired, leaked, or poor freshness claims.
- Require return pickup for high-value products.
- Block refund approval when the customer is flagged for abuse.
- Require finance review for duplicate payment claims.
- Allow wallet credit as a faster refund option.
- Track SLA targets for review and payout.

Approval fields:

- Rule name.
- Trigger condition.
- Refund limit.
- Evidence required.
- Owner approval required.
- Auto-approve enabled.
- SLA target.
- Active/paused state.

## Finance Tracking

The finance tab should track refund money movement.

Fields:

- Refund ID.
- Order ID.
- Customer.
- Refund amount.
- Original payment method.
- Refund method.
- Gateway status.
- Refund transaction ID.
- Manual payout status.
- COD refund status.
- Wallet credit status.
- Finance reconciliation state.
- Processed by.
- Processed time.

Finance statuses:

- Not started.
- Queued.
- Processing.
- Refunded.
- Failed.
- Manual payout required.
- Reconciled.

Finance actions:

- Mark refunded.
- Retry gateway refund.
- Create manual payout.
- Add transaction ID.
- Mark reconciled.
- Export finance report.

## Customer Communication

The module should include customer communication actions:

- Send WhatsApp update.
- Send SMS update.
- Send email update.
- Open support chat.
- Add internal note.
- Request evidence.
- Notify refund approved.
- Notify refund rejected.
- Notify pickup scheduled.
- Notify refund processed.

Messages should be template-based but editable before sending.

## Risk And Fraud Signals

The risk tab should help catch refund abuse without blocking genuine customers.

Risk signals:

- Customer refund history.
- Refund ratio compared with total orders.
- Repeat reason pattern.
- High-value claims.
- Same product repeated claims.
- Too many freshness complaints.
- Address mismatch.
- Payment mismatch.
- Multiple accounts using the same phone/address.
- Manual review flag.

Risk actions:

- Mark low risk.
- Mark medium risk.
- Mark high risk.
- Require owner review.
- Block auto-approval.
- Add internal risk note.
- Open customer profile.

## Reports

Refund reports should include:

- Refund rate by category.
- Refund amount by product.
- Most returned products.
- Supplier quality issues.
- Delivery-related refund causes.
- Payment-related refund causes.
- Finance pending refunds.
- Customer abuse watchlist.
- Refund SLA performance.
- Return restock/discard cost.

## Backend And CQRS Plan

Recommended commands:

- `CreateRefundRequestCommand`
- `UpdateRefundRequestCommand`
- `ApproveRefundCommand`
- `RejectRefundCommand`
- `RequestRefundEvidenceCommand`
- `ScheduleReturnPickupCommand`
- `UpdateReturnStatusCommand`
- `ProcessRefundPaymentCommand`
- `MarkRefundReconciledCommand`
- `AddRefundNoteCommand`
- `SendRefundMessageCommand`
- `UpdateRefundRiskCommand`

Recommended queries:

- `GetRefundDashboardQuery`
- `ListRefundRequestsQuery`
- `GetRefundDetailQuery`
- `ListReturnPickupsQuery`
- `ListRefundApprovalsQuery`
- `ListRefundFinanceItemsQuery`
- `ListRefundRiskItemsQuery`
- `GetRefundReportsQuery`
- `GetRefundSettingsQuery`

Recommended events:

- `RefundRequested`
- `RefundUpdated`
- `RefundApproved`
- `RefundRejected`
- `RefundEvidenceRequested`
- `ReturnPickupScheduled`
- `ReturnReceived`
- `RefundPaymentProcessed`
- `RefundPaymentFailed`
- `RefundReconciled`
- `RefundRiskUpdated`
- `RefundCustomerMessageSent`

## Database Entities

Recommended tables/entities:

- `refund_requests`
- `refund_items`
- `return_pickups`
- `refund_evidence`
- `refund_notes`
- `refund_communications`
- `refund_payment_transactions`
- `refund_risk_reviews`
- `refund_approval_rules`
- `refund_settings`

Important relationships:

- Refund request belongs to an order.
- Refund request belongs to a customer.
- Refund request can have many refund items.
- Refund request can have one or more payment transactions.
- Refund request can create inventory adjustments.
- Return pickup can link to delivery/rider data.
- Refund communications should link to notification logs.
- Refund notes should be visible in support/customer history.

## UI Requirements

The Refunds and Returns UI must follow the current admin production rule:

- No static-only dialogs.
- Detail views should have editable form fields.
- Every button should update state, open a form, navigate to a real route, or show clear admin feedback.
- Status changes must be visible immediately.
- Forms should use the same input styling as the rest of the admin panel.
- Tables should have useful actions, not decorative buttons.
- Risk and finance actions should be explicit and traceable.

## Recommended First Frontend Build

For the admin frontend, build:

- Sidebar navigation item: `Refunds`.
- Route: `/refunds`.
- Overview stats.
- Refund request queue with filters.
- Editable refund detail modal.
- Returns pickup table.
- Approval rules panel.
- Finance reconciliation table.
- Risk review panel.
- Settings form.

All frontend actions should update local state first. Backend persistence should be added after API and database work begins.

