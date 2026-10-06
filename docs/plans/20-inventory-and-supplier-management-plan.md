# Inventory And Supplier Management Plan

## Goal

Define detailed inventory and supplier management for the grocery ecommerce platform.

Because grocery products can expire, run out quickly, and come from multiple suppliers, inventory must be more detailed than a simple stock count.

The system should support:

- Stock counts.
- Reserved stock.
- Low-stock alerts.
- Out-of-stock status.
- Batch tracking.
- Expiry dates.
- Supplier tracking.
- Purchase entries.
- Stock adjustments.
- Inventory audit logs.
- Admin inventory workflows.

## Inventory Principles

- Inventory should be accurate before checkout.
- Inventory should reserve stock during order placement.
- Expiry dates must be visible for perishable products.
- Admins should be able to adjust stock with a reason.
- Stock changes should be auditable.
- Low-stock and out-of-stock states should update product visibility and search.
- Batch tracking should support first-expiry-first-out fulfillment.

## Inventory Concepts

### Stock Quantity

The total available quantity for a product or variant.

### Reserved Quantity

Quantity temporarily held for carts, checkout sessions, or confirmed orders that are not fulfilled yet.

### Available Quantity

Calculated as:

```txt
available_quantity = stock_quantity - reserved_quantity
```

### Low-Stock Threshold

The minimum quantity before the system alerts inventory staff.

### Batch

A batch represents a received group of products from a supplier.

Batch data can include:

- Batch code.
- Supplier.
- Quantity.
- Received date.
- Expiry date.
- Cost price.

## Supplier Management

### Supplier Profiles

Each supplier should include:

- Supplier name.
- Contact person.
- Phone.
- Email.
- Address.
- Status.
- Notes.

### Supplier Statuses

Recommended statuses:

- Active.
- Paused.
- Disabled.

### Supplier Use Cases

Admins should be able to:

- Add supplier.
- Edit supplier.
- Disable supplier.
- View products connected to supplier.
- View purchase history.

## Product And Inventory Relationship

Inventory can belong to:

- Product.
- Product variant.

For example:

- Product: Organic Milk.
- Variant: 500 ml bottle.
- Variant: 1 L bottle.

Each variant can have its own SKU, stock, batches, and expiry dates.

## Purchase Entry Flow

Purchase entries track stock received from suppliers.

Flow:

1. Admin creates purchase entry.
2. Admin selects supplier.
3. Admin adds products or variants.
4. Admin enters quantity, cost price, batch code, and expiry date.
5. System increases stock.
6. System creates inventory batch records.
7. System writes inventory audit log.

## Stock Adjustment Flow

Admins can adjust stock for reasons such as damage, spoilage, correction, or manual count.

Flow:

1. Admin opens inventory item.
2. Admin selects adjustment type.
3. Admin enters quantity change.
4. Admin enters reason.
5. System updates stock.
6. System stores adjustment record.
7. System writes audit log.

## Adjustment Types

Recommended adjustment types:

- Manual correction.
- Damaged.
- Spoiled.
- Expired.
- Returned.
- Lost.
- Found.
- Internal use.

## Batch And Expiry Management

Batch tracking is important for grocery products.

Admin should see:

- Batch code.
- Product.
- Supplier.
- Quantity.
- Received date.
- Expiry date.
- Expiring soon status.

## Expiry Rules

Recommended rules:

- Products past expiry should not be sellable.
- Products expiring soon should be visible to admins.
- Admin can mark expired stock as removed.
- Fulfillment should prefer earliest expiry first.

## Inventory Reservation

Inventory reservation protects stock during checkout and order processing.

Reservation flow:

1. Customer places order.
2. System checks available quantity.
3. System reserves quantity.
4. Order is confirmed.
5. Reserved quantity is reduced from real stock during fulfillment or confirmation.
6. Reservation is released if checkout/payment fails.

## Order Fulfillment Inventory Flow

1. Order is placed.
2. Inventory is reserved.
3. Staff picks products.
4. Staff can confirm picked quantity.
5. If item is unavailable, staff can mark issue.
6. Admin can contact customer or substitute item.
7. Inventory is reduced.
8. Order moves to packed.

## Low-Stock Flow

1. Product quantity falls below threshold.
2. System emits low-stock event.
3. Admin dashboard shows alert.
4. Inventory staff receives notification.
5. Product can remain sellable if available quantity is above zero.

## Out-Of-Stock Flow

1. Available quantity reaches zero.
2. Product becomes out of stock.
3. Customer product card shows out-of-stock state.
4. Product is marked unavailable in search.
5. Admin dashboard shows alert.

## Admin Inventory Screens

### Inventory Overview

Should show:

- Product.
- SKU.
- Stock quantity.
- Reserved quantity.
- Available quantity.
- Low-stock threshold.
- Status.
- Expiry warning.

### Inventory Item Detail

Should show:

- Product details.
- Stock summary.
- Batch list.
- Adjustment history.
- Purchase history.
- Order reservation history.

### Batch Management

Should show:

- Batch code.
- Supplier.
- Quantity.
- Expiry date.
- Received date.
- Cost price.

### Purchase Entries

Should show:

- Supplier.
- Reference number.
- Total cost.
- Received date.
- Products received.
- Status.

### Stock Adjustments

Should show:

- Product.
- Quantity change.
- Reason.
- Admin user.
- Date.

## Inventory Statuses

Recommended inventory statuses:

- In stock.
- Low stock.
- Out of stock.
- Expiring soon.
- Expired.
- Disabled.

## Admin Permissions

Inventory staff can:

- View inventory.
- Create stock adjustments.
- Create purchase entries.
- View suppliers.

Store manager can:

- Manage inventory.
- Manage suppliers.
- Review audit logs.

Owner can:

- Full inventory access.
- Delete or disable records when allowed.
- View sensitive cost data.

## Search And Product Visibility

Inventory changes should update:

- Product stock state.
- Product listing availability.
- Meilisearch stock status.
- Product card button state.

Customer UI behavior:

- In stock: show add button.
- Low stock: show limited stock label.
- Out of stock: disable add button.
- Expired: never sell.

## Notifications And Alerts

Send alerts for:

- Low stock.
- Out of stock.
- Expiring soon.
- Expired batch.
- Large manual adjustment.

Recipients:

- Owner.
- Store manager.
- Inventory staff.

## Reports

Future inventory reports can include:

- Low-stock report.
- Expiry report.
- Supplier purchase report.
- Inventory adjustment report.
- Product movement report.
- Stock valuation report.

## Important Audit Events

Audit these events:

- Stock adjusted.
- Purchase entry created.
- Batch created.
- Batch expired.
- Supplier changed.
- Low-stock threshold changed.
- Product disabled due to stock.

## Recommended First Implementation Order

1. Supplier profiles.
2. Inventory items.
3. Purchase entries.
4. Batch tracking.
5. Stock adjustments.
6. Low-stock alerts.
7. Out-of-stock product behavior.
8. Expiry warnings.
9. Inventory dashboard.
10. Inventory audit logs.

