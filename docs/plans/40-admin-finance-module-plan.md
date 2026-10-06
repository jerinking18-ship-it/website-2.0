# Admin Finance Module Plan

## Purpose

The Finance module should be the owner and finance team's control room for money movement across the grocery ecommerce business. It should connect orders, payments, COD collection, refunds, settlements, expenses, taxes, invoices, profit, and reports in one production-level admin area.

This module must not be a static dashboard. Every action should have a proper working state, editable forms, clear status changes, and future backend/CQRS readiness.

## Recommended Finance Tabs

- Overview
- Payments
- COD
- Refunds
- Settlements
- Expenses
- Profit
- Taxes
- Invoices
- Reports

## Overview

The overview should show the current financial health of the store.

Key metrics:

- Today's revenue.
- Net sales.
- Gross sales.
- Refund amount.
- COD pending.
- Online payment received.
- Delivery fees collected.
- Discount cost.
- Profit estimate.
- Settlement pending.
- Failed payments.
- Finance alerts.

Useful overview actions:

- Open payment queue.
- Review COD collections.
- Reconcile settlements.
- Add expense.
- Export finance report.
- Open finance settings.

## Payments

The payments tab should track every order payment.

Fields:

- Payment ID.
- Order ID.
- Customer name.
- Customer phone.
- Payment method.
- Payment status.
- Gateway transaction ID.
- Amount.
- Payment time.
- Gateway name.
- Failure reason.
- Reconciliation status.
- Assigned finance owner.

Payment methods:

- COD.
- UPI.
- Card.
- Wallet.
- Net banking.
- Manual payment.

Payment statuses:

- Paid.
- Pending.
- Failed.
- Refunded.
- Partially refunded.
- COD pending.
- COD collected.
- Reconciled.

Primary actions:

- Open payment.
- Retry payment.
- Mark COD collected.
- Mark failed.
- Reconcile payment.
- Add finance note.
- Contact customer.

## COD Collection

The COD tab should manage rider cash collection and verification.

Fields:

- Collection ID.
- Rider name.
- Rider phone.
- Delivered orders.
- COD amount collected.
- Cash submitted.
- Difference or shortage.
- Collection status.
- Settlement time.
- Proof status.
- Verification owner.
- Finance note.

COD collection statuses:

- Pending collection.
- Collected by rider.
- Submitted to store.
- Short amount.
- Verified.
- Escalated.

Primary actions:

- Open collection.
- Mark cash submitted.
- Verify collection.
- Flag shortage.
- Upload proof.
- Add note.
- Export COD sheet.

Alerts:

- Rider has pending cash.
- Cash submitted is less than collected amount.
- Proof missing.
- COD not submitted by end of day.

## Refunds And Adjustments

The finance refund tab should connect with the Refunds & Returns module.

Fields:

- Refund ID.
- Order ID.
- Customer.
- Approved refund amount.
- Refund method.
- Gateway refund status.
- Wallet credit issued.
- Manual adjustment amount.
- Finance approval status.
- Reconciliation status.
- Refund transaction ID.

Primary actions:

- Open linked refund.
- Approve finance payout.
- Mark refund paid.
- Mark wallet credit issued.
- Create manual adjustment.
- Mark reconciled.
- Export refund finance report.

Important connection:

- Refund details should come from the Refunds & Returns module.
- Finance should control money movement and reconciliation.
- Customer communication should stay connected to notification/support logs.

## Settlements

The settlements tab should track payment gateway and platform settlement batches.

Fields:

- Settlement ID.
- Gateway.
- Settlement batch date.
- Expected settlement date.
- Gross amount.
- Gateway charges.
- Tax or fee deductions.
- Net settled amount.
- Amount received.
- Difference.
- Settlement status.
- Bank reference ID.
- Finance note.

Settlement statuses:

- Expected.
- Pending.
- Received.
- Mismatch.
- Under review.
- Reconciled.

Primary actions:

- Open settlement.
- Mark received.
- Flag mismatch.
- Reconcile settlement.
- Add bank reference.
- Export settlement report.

Alerts:

- Settlement delayed.
- Received amount does not match expected amount.
- Gateway fee spike.
- Bank reference missing.

## Expenses

The expenses tab should track store operating costs.

Expense categories:

- Delivery rider payout.
- Packaging cost.
- Supplier payment.
- Staff salary.
- Marketing discount cost.
- Platform fee.
- Payment gateway fee.
- Store utilities.
- Manual expense.

Fields:

- Expense ID.
- Category.
- Vendor or staff.
- Amount.
- Payment method.
- Paid date.
- Due date.
- Receipt status.
- Approval status.
- Finance note.

Primary actions:

- Add expense.
- Edit expense.
- Upload receipt.
- Approve expense.
- Mark paid.
- Flag missing receipt.
- Export expense report.

## Profit And Margin

The profit tab should help the owner understand actual business performance.

Metrics:

- Gross revenue.
- Net revenue.
- Product cost.
- Gross margin.
- Net margin.
- Discount impact.
- Refund impact.
- Delivery cost impact.
- Payment fee impact.
- Profit by category.
- Profit by product.
- Low-margin product warnings.

Views:

- Category margin table.
- Product margin table.
- Daily margin trend.
- Discount impact summary.
- Refund impact summary.

Primary actions:

- Open product margin detail.
- Flag low-margin product.
- Export margin report.
- Send margin issue to product team.

## Taxes

The taxes tab should prepare finance data for GST and invoice reporting.

Fields and reports:

- GST collected.
- Taxable sales.
- Exempt sales.
- GST by category.
- HSN/SAC summary.
- Invoice count.
- Credit note count.
- Tax report by date range.
- GST return preparation view.

Primary actions:

- Export GST report.
- Export invoice register.
- Export credit note register.
- Open invoice.
- Mark invoice reviewed.

Alerts:

- Tax invoice missing.
- GST mismatch.
- HSN/SAC missing.
- Credit note not linked to refund.

## Invoices

The invoices tab should manage customer invoices, supplier invoices, and credit notes.

Invoice types:

- Customer invoice.
- Supplier invoice.
- Refund credit note.
- Manual credit note.

Fields:

- Invoice ID.
- Order or supplier reference.
- Customer or supplier.
- Invoice type.
- Amount.
- Tax amount.
- Invoice date.
- Status.
- Download URL.
- Sent status.

Invoice statuses:

- Generated.
- Sent.
- Downloaded.
- Failed.
- Cancelled.
- Credit note issued.

Primary actions:

- Open invoice.
- Download invoice.
- Resend invoice.
- Create credit note.
- Regenerate invoice.
- Mark reviewed.

## Reports

Finance reports should be exportable and filterable.

Recommended reports:

- Daily sales report.
- Payment reconciliation report.
- COD collection report.
- Refund finance report.
- Profit and loss report.
- Tax report.
- Settlement report.
- Expense report.
- Invoice register.
- Gateway fee report.

Report export formats:

- CSV.
- PDF.
- XLSX.

Filters:

- Date range.
- Payment method.
- Status.
- Gateway.
- Rider.
- Category.
- Customer segment.
- Finance owner.

## Finance Alerts

The module should show alerts that require action:

- COD not submitted by rider.
- Online payment failed but order exists.
- Settlement mismatch.
- Refund approved but payout pending.
- High discount cost today.
- Negative margin products.
- Gateway fee spike.
- Tax invoice missing.
- Supplier payment overdue.
- Expense without receipt.
- Manual adjustment awaiting approval.

## Production UI Requirements

The Finance module should follow the admin production quality rule:

- No dead buttons.
- No static-only dialogs.
- Every form should have editable input fields.
- Every primary action should update visible state.
- Every table row should have meaningful actions.
- Filters should work.
- Search should work.
- Export buttons should show export state now and later connect to real files.
- Dialogs should use the same admin input style as the rest of the panel.
- Changes can remain local frontend state until backend persistence is built, but they must behave correctly inside the UI.

## CQRS Backend Plan

Future commands:

- `CreateFinancePaymentCommand`
- `UpdateFinancePaymentCommand`
- `RetryPaymentCommand`
- `MarkCodCollectedCommand`
- `VerifyCodCollectionCommand`
- `FlagCodShortageCommand`
- `ApproveFinanceRefundCommand`
- `MarkRefundPaidCommand`
- `CreateManualAdjustmentCommand`
- `CreateSettlementCommand`
- `ReconcileSettlementCommand`
- `CreateExpenseCommand`
- `ApproveExpenseCommand`
- `MarkExpensePaidCommand`
- `CreateInvoiceCommand`
- `ResendInvoiceCommand`
- `CreateCreditNoteCommand`
- `ExportFinanceReportCommand`

Future queries:

- `GetFinanceDashboardQuery`
- `ListPaymentsQuery`
- `GetPaymentDetailQuery`
- `ListCodCollectionsQuery`
- `ListFinanceRefundsQuery`
- `ListSettlementsQuery`
- `ListExpensesQuery`
- `GetProfitAndMarginQuery`
- `GetTaxSummaryQuery`
- `ListInvoicesQuery`
- `GetFinanceReportsQuery`
- `GetFinanceAlertsQuery`

Future events:

- `PaymentUpdated`
- `PaymentReconciled`
- `CodCollected`
- `CodCollectionVerified`
- `CodShortageFlagged`
- `FinanceRefundApproved`
- `RefundPaid`
- `ManualAdjustmentCreated`
- `SettlementReceived`
- `SettlementMismatchFlagged`
- `SettlementReconciled`
- `ExpenseCreated`
- `ExpenseApproved`
- `ExpensePaid`
- `InvoiceGenerated`
- `CreditNoteCreated`
- `FinanceReportExported`

## Recommended First Build Scope

For the first frontend admin implementation, build:

- Sidebar navigation item: `Finance`.
- Route: `/finance`.
- Overview with finance metrics and alerts.
- Payments table with editable payment dialog.
- COD collection table with editable collection dialog.
- Refund finance table linked conceptually to Refunds & Returns.
- Settlements table with reconciliation actions.
- Expenses table with add/edit expense dialog.
- Profit and margin cards/table.
- Taxes summary and export controls.
- Invoices table with resend/download/credit note actions.
- Reports export panel.

This will make Finance feel like a serious grocery ecommerce back-office module and prepare it for real backend persistence later.
