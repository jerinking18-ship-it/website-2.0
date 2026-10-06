# Admin Reviews And Ratings Module Plan

## Purpose

The Reviews & Ratings module should control product reputation, customer trust, moderation, and quality feedback across the grocery ecommerce website.

It should help admins approve reviews, handle reported reviews, reply to customers, identify low-rated products, and connect serious complaints with Support, Products, and Audit Logs.

## Recommended Tabs

- Overview
- Review Queue
- Product Reviews
- Reported Reviews
- Store Replies
- Rating Analytics
- Moderation Rules
- Review Settings

## Overview

Metrics:

- Total reviews.
- Average store rating.
- Average product rating.
- Pending reviews.
- Reported reviews.
- Low-rated products.
- Verified purchase reviews.
- Reviews with images.
- Reviews needing reply.
- Rating trend by week/month.

## Review Fields

- Review ID.
- Product name.
- Product SKU.
- Customer name.
- Customer phone/email.
- Order ID.
- Rating.
- Review title.
- Review message.
- Review images.
- Verified purchase status.
- Review status.
- Report reason.
- Admin reply.
- Moderator note.
- Created date.

Review statuses:

- Pending.
- Approved.
- Rejected.
- Hidden.
- Reported.
- Featured.

Report reasons:

- Abuse.
- Fake review.
- Spam.
- Offensive content.
- Unrelated content.
- Competitor abuse.

## Actions

- Approve review.
- Reject review.
- Hide review.
- Feature review.
- Reply to review.
- Edit admin reply.
- Mark verified.
- Escalate to support.
- Open customer.
- Open product.
- Open order.
- Export reviews.

## Analytics

- Product-wise rating breakdown.
- Category-wise rating breakdown.
- Customer review history.
- Rating trends.
- Review reply rate.
- Low-rated product alerts.
- Review sentiment tags later if needed.

## Production Rules

- Admin should not edit the customer's original review text.
- Admin can hide, reject, report, or reply.
- Every moderation action should be written to Audit Logs.
- Low ratings should optionally create Support tickets.
- Verified purchase status should come from real order history later.
- Fake/spam review detection should be a future backend rule, not a fake UI label only.

## Recommended First Build Scope

- Sidebar navigation item: `Reviews`.
- Route: `/reviews`.
- Overview metrics.
- Review queue table.
- Reported reviews table.
- Product rating analytics.
- Reply editor.
- Moderation settings.
- Editable review moderation dialogs.
- Working approve, reject, hide, feature, reply, escalate, and export states.
