# Admin Loyalty And Wallet Module Plan

## Purpose

The Loyalty & Wallet module should manage customer rewards, wallet balances, cashback, referrals, loyalty tiers, and manual adjustments.

It should support customer retention while protecting the business from wallet abuse, incorrect credits, and unapproved manual adjustments.

## Recommended Tabs

- Overview
- Customer Wallets
- Points Ledger
- Loyalty Tiers
- Cashback
- Referrals
- Manual Adjustments
- Reward Rules
- Risk Review
- Reports

## Overview

Metrics:

- Total wallet balance liability.
- Points issued.
- Points redeemed.
- Cashback issued.
- Cashback pending.
- Expiring points.
- Active loyalty customers.
- Tier distribution.
- Referral rewards pending.
- Manual adjustment queue.
- Suspicious wallet activity.

## Customer Wallet Fields

- Customer ID.
- Customer name.
- Phone/email.
- Wallet balance.
- Points balance.
- Loyalty tier.
- Lifetime spend.
- Last wallet transaction.
- Risk status.
- Hold status.
- Notes.

## Transaction Fields

- Transaction ID.
- Customer.
- Type.
- Amount/points.
- Source order/refund.
- Status.
- Expiry date.
- Approved by.
- Note.

Transaction types:

- Credit.
- Debit.
- Cashback.
- Refund.
- Referral.
- Adjustment.

Transaction statuses:

- Pending.
- Approved.
- Completed.
- Rejected.
- Reversed.

## Loyalty Tiers

Recommended tiers:

- Starter.
- Silver.
- Gold.
- Platinum.

Tier rules should include:

- Minimum lifetime spend.
- Points earning multiplier.
- Cashback percentage.
- Free delivery benefits.
- Priority support.
- Early campaign access.

## Actions

- Add wallet credit.
- Debit wallet.
- Add points.
- Deduct points.
- Approve adjustment.
- Reject adjustment.
- Put wallet on hold.
- Release wallet hold.
- Upgrade/downgrade tier.
- Create cashback rule.
- Create referral rule.
- Export wallet ledger.

## Production Rules

- Manual wallet adjustments must require admin reason.
- Large wallet credits should require owner approval.
- Wallet changes must write to Audit Logs.
- Refund wallet credits must connect with Refunds & Returns and Finance.
- Wallet balance should be a ledger-derived value later, not manually trusted.
- Suspicious wallet activity should create risk alerts.

## Recommended First Build Scope

- Sidebar navigation item: `Loyalty`.
- Route: `/loyalty`.
- Wallet overview metrics.
- Customer wallet table.
- Points ledger table.
- Loyalty tier manager.
- Cashback/referral rules.
- Manual adjustment workflow.
- Risk review queue.
- Reports/export panel.
