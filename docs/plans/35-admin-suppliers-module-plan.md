# Admin Suppliers Module Plan

## Goal

Create a production-ready supplier control center inside the admin panel. The Suppliers module should help the admin manage all vendors who provide grocery stock, track purchase history, monitor supplier quality, manage payment status, and identify supplier delays before they affect inventory.

This module should connect closely with products, inventory, stock purchase entries, batch tracking, and reports.

## Main Sections

### Supplier Overview

Show quick stats:

- Total suppliers
- Active suppliers
- Suppliers under review
- Pending payments
- Delayed suppliers
- Average supplier rating

Useful actions:

- Open active supplier list
- Review delayed suppliers
- Review pending payments
- Export supplier overview

### Supplier Directory

The supplier directory should show:

- Supplier name
- Contact person
- Phone
- Email
- Product categories supplied
- Status: Active, Review, or Paused
- Last purchase date
- Payment status
- Quality rating

Useful actions:

- Open supplier profile
- Edit supplier
- Approve supplier
- Pause supplier
- Export supplier list

### Add And Edit Supplier

Form fields:

- Supplier name
- Contact person
- Phone number
- Email
- Business address
- GST/tax number
- Supplied categories
- Payment terms
- Delivery schedule
- Internal notes

Useful actions:

- Save supplier
- Update supplier
- Approve supplier
- Pause supplier
- Reset form

### Purchase History

For each supplier, track:

- Purchase order ID
- Products supplied
- Quantity
- Purchase amount
- Order date
- Delivery date
- Payment status
- Received, pending, or delayed status

Useful actions:

- Create purchase order
- Open purchase order
- Mark received
- Mark delayed
- Export purchase history

### Supplier Performance

Track:

- On-time delivery rate
- Quality rating
- Rejected stock count
- Delayed purchase orders
- Average delivery time
- Payment pending amount

Useful actions:

- Review performance
- Flag supplier for review
- Open rejected stock details
- Export performance report

### Supplier Payments

Manage:

- Paid invoices
- Pending invoices
- Partial payments
- Payment due date
- Total outstanding amount
- Payment method
- Invoice reference

Useful actions:

- Mark payment paid
- Open invoice
- Review pending amount
- Export payment report

## Recommended Tabs

- Overview
- Directory
- Purchase Orders
- Payments
- Performance
- Reviews

## Supplier Actions

All important buttons should work in the frontend mock:

- Add supplier
- Open supplier profile
- Edit supplier
- Approve supplier
- Pause supplier
- Create purchase order
- View purchase history
- Mark payment paid
- Export supplier list
- Export purchase history
- Export payment report

## Recommended Frontend Mock Version First

For the first admin frontend version, build:

- Supplier stats cards
- Supplier directory table
- Add supplier modal
- Supplier profile modal
- Purchase history panel
- Payment status actions
- Supplier performance cards
- Working approve, pause, payment, purchase, export, and profile buttons with dummy data

## Future Backend Requirements

When backend work starts, the Suppliers module should connect to:

- Supplier entity
- Supplier contact entity
- Supplier category mapping
- Purchase order entity
- Purchase order item entity
- Supplier invoice entity
- Supplier payment entity
- Inventory batch entity
- Stock movement ledger
- Admin audit log

## Future API Needs

Recommended future endpoints:

- `GET /admin/suppliers`
- `POST /admin/suppliers`
- `GET /admin/suppliers/:id`
- `PATCH /admin/suppliers/:id`
- `PATCH /admin/suppliers/:id/status`
- `GET /admin/suppliers/:id/purchase-orders`
- `POST /admin/suppliers/:id/purchase-orders`
- `PATCH /admin/purchase-orders/:id/status`
- `GET /admin/suppliers/:id/payments`
- `PATCH /admin/supplier-payments/:id`
- `GET /admin/suppliers/:id/performance`
- `POST /admin/suppliers/export`

## Design Direction

The Suppliers screen should feel operational and professional:

- Compact supplier stats
- Dense but readable directory table
- Clear supplier status labels
- Payment and quality signals visible at a glance
- Quick actions in every row
- Supplier profile modal with purchase, payment, and performance context
- Primary color for important actions
- Secondary color for soft status backgrounds

## Priority For First Build

Build the mock in this order:

1. Add supplier stats cards.
2. Improve supplier directory table.
3. Add supplier profile modal.
4. Add add/edit supplier modal.
5. Add purchase history section.
6. Add payment actions.
7. Add performance/review section.
8. Make all buttons update dummy state.
