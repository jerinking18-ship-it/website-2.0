# Admin Legal And Compliance Module Plan

## Purpose

The Legal & Compliance module should manage business legal data, GST/tax records, licenses, policies, customer consent logs, data export requests, deletion requests, compliance exports, and legal review status.

It protects the business once real customers, payments, policies, and personal data exist in production.

## Recommended Tabs

- Overview
- Business Details
- Licenses
- GST & Tax
- Policies
- Consent Logs
- Data Requests
- Deletion Requests
- Compliance Exports
- Settings

## Overview

Metrics:

- Business profile status.
- GST details status.
- License status.
- Active policies.
- Draft policies.
- Pending data requests.
- Pending deletion requests.
- Consent logs captured.
- Compliance review status.
- Risk alerts.

## Business Details

Fields:

- Legal business name.
- GST number.
- FSSAI/license number if applicable.
- Registered business address.
- Billing address.
- Business owner details.
- Support/legal email.
- Compliance owner.

## Policies

Recommended policies:

- Privacy Policy.
- Terms & Conditions.
- Refund Policy.
- Shipping Policy.
- Cookie Policy.
- Marketing Consent Policy.

Policy fields:

- Policy ID.
- Policy type.
- Version.
- Status.
- Effective date.
- Owner.
- Last reviewed.
- Content.
- Public URL.

Policy statuses:

- Draft.
- Active.
- Archived.

## Data Request Fields

- Request ID.
- Customer.
- Request type.
- Status.
- Submitted date.
- Due date.
- Assigned owner.
- Verification status.
- Notes.

Request types:

- Export.
- Correction.
- Deletion.

## Consent Logs

Track:

- Cookie consent.
- Marketing consent.
- WhatsApp opt-in.
- SMS opt-in.
- Email opt-in.
- Terms acceptance.
- Privacy policy acceptance.

## Actions

- Edit business details.
- Upload license.
- Update GST details.
- Create policy version.
- Publish policy.
- Archive old policy.
- Approve data export request.
- Process deletion request.
- Export consent logs.
- Mark compliance reviewed.
- Assign legal owner.

## Production Rules

- Customer deletion should not break financial, order, audit, or legal records.
- Data exports must verify customer identity.
- Policy versions should be archived, not overwritten.
- Consent records should be immutable.
- Compliance actions must be written to Audit Logs.
- Legal documents shown on the client site should later be connected to Content Manager or client APIs.
- Deletion and export workflows should have deadlines and owner assignment.

## Recommended First Build Scope

- Sidebar navigation item: `Legal`.
- Route: `/legal`.
- Compliance overview.
- Business details editor.
- License upload/status table.
- GST/tax details panel.
- Policy version manager.
- Consent logs table.
- Data requests workflow.
- Customer deletion workflow.
- Compliance exports.
- Settings form.
