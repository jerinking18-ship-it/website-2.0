# Admin System Health Module Plan

## Purpose

The System Health module should monitor backend services, APIs, queues, jobs, webhooks, notifications, payments, database, storage, backups, and incidents.

It should help the owner and technical admin detect production issues before they harm customers or operations.

## Recommended Tabs

- Overview
- API Health
- Queue Health
- Jobs
- Webhooks
- Notifications
- Payments
- Database
- Storage
- Backups
- Incidents
- Settings

## Overview

Metrics:

- API uptime.
- API latency.
- Error rate.
- Failed requests.
- Queue size.
- Failed jobs.
- Redis status.
- Database status.
- Database connection pool.
- Backup status.
- Last backup time.
- Storage status.
- Payment webhook failures.
- Notification delivery failures.
- Cron job status.
- Realtime/WebSocket status.
- Incident timeline.
- System alerts.

## Health Fields

- Service name.
- Status.
- Last checked.
- Latency.
- Error count.
- Owner.
- Notes.

Service statuses:

- Healthy.
- Warning.
- Down.
- Degraded.

## Job Fields

- Job ID.
- Queue name.
- Job type.
- Status.
- Attempts.
- Last error.
- Created at.
- Processed at.

Job statuses:

- Waiting.
- Active.
- Completed.
- Failed.
- Retrying.
- Cancelled.

## Incident Fields

- Incident ID.
- Title.
- Service.
- Severity.
- Status.
- Owner.
- Started at.
- Resolved at.
- Customer impact.
- Resolution note.

## Actions

- Retry failed job.
- Re-run webhook.
- Clear resolved alert.
- Mark incident resolved.
- Trigger backup.
- Download error log.
- Test notification delivery.
- Test payment webhook.
- Open related order/payment.
- Export health report.

## Production Rules

- Failed payments, failed notifications, and failed jobs should be visible.
- Retry actions should not create duplicate customer charges or duplicate messages.
- Incidents should have owner, status, and resolution note.
- Critical system alerts should notify owner.
- System health actions should write to Audit Logs.
- Health data should later come from real service checks, queue metrics, and logs.

## Recommended First Build Scope

- Sidebar navigation item: `System Health`.
- Route: `/system-health`.
- Health overview metrics.
- Service status table.
- Queue and jobs table.
- Webhook failure table.
- Notification delivery health.
- Payment webhook health.
- Database/storage/backup panels.
- Incident log.
- Retry, test, backup, resolve, and export actions.
