# Admin Panel Detailed Screens Plan

## Goal

Define the detailed admin panel screens for store operations.

The admin panel should be clear, fast, and operational. It should help staff manage products, orders, inventory, delivery, support, customers, coupons, notifications, staff, and settings.

## Admin UI Principles

- Use a professional SaaS-style layout.
- Prioritize speed and clarity over decoration.
- Tables should be dense but readable.
- Filters should be easy to access.
- Important alerts should be visible on the dashboard.
- Create/edit flows should use clear forms.
- Destructive actions should require confirmation.
- Role permissions should control visible actions.

## Global Admin Layout

### Sidebar Navigation

Items:

- Dashboard.
- Products.
- Categories.
- Orders.
- Inventory.
- Suppliers.
- Customers.
- Coupons.
- Promotions.
- Delivery.
- Support.
- Notifications.
- Staff.
- Settings.

### Top Bar

Should include:

- Global search.
- Notifications menu.
- Current admin profile.
- Role label.
- Logout.

### Global Search

Search should find:

- Products.
- Orders.
- Customers.
- Support conversations.

## Dashboard Screen

Route:

```txt
/admin/dashboard
```

Cards:

- Today's revenue.
- Today's orders.
- Pending orders.
- Packed orders.
- Out-for-delivery orders.
- Open support chats.
- Low-stock products.
- COD collection due.

Charts:

- Revenue trend.
- Orders by status.
- Top-selling categories.

Tables/Lists:

- Recent orders.
- Low-stock alerts.
- Unassigned support chats.
- Active deliveries.

Actions:

- View orders.
- View inventory.
- Open support inbox.
- Open active delivery map.

## Products Screen

Route:

```txt
/admin/products
```

Table columns:

- Product image.
- Product name.
- SKU.
- Category.
- Price.
- Sale price.
- Stock status.
- Badges.
- Status.
- Updated date.

Filters:

- Category.
- Status.
- In stock.
- Low stock.
- Out of stock.
- Badge.
- Price range.

Actions:

- Add product.
- Edit product.
- Upload image.
- Activate/deactivate.
- Bulk status update.
- Bulk category update.

## Product Create/Edit Screen

Routes:

```txt
/admin/products/new
/admin/products/[id]
```

Sections:

- Basic details.
- Category.
- Pricing.
- Images.
- Badges.
- Inventory link.
- SEO/search fields.
- Availability.

Fields:

- Product name.
- Slug.
- Description.
- Brand.
- Unit label.
- Base price.
- Sale price.
- Tax rate.
- Category.
- Badges.
- Status.
- Featured.

Actions:

- Save draft.
- Publish.
- Deactivate.
- Upload image.
- Preview product page.

## Categories Screen

Route:

```txt
/admin/categories
```

Features:

- Category table.
- Parent/child categories.
- Drag reorder.
- Featured category toggle.
- Active/inactive status.

Actions:

- Add category.
- Edit category.
- Reorder.
- Deactivate.

## Orders Screen

Route:

```txt
/admin/orders
```

Table columns:

- Order number.
- Customer.
- Phone.
- Order total.
- Payment status.
- Order status.
- Fulfillment status.
- Delivery slot.
- Assigned delivery staff.
- Created time.

Filters:

- Order status.
- Payment status.
- Fulfillment status.
- Delivery slot.
- Delivery zone.
- COD.
- Date range.

Actions:

- Open order.
- Update status.
- Assign delivery.
- Cancel order.
- Print picking list later.

## Order Detail Screen

Route:

```txt
/admin/orders/[id]
```

Sections:

- Order summary.
- Customer details.
- Delivery address.
- Delivery slot.
- Payment details.
- Order items.
- Status timeline.
- Inventory reservation.
- Support conversations.

Actions:

- Confirm order.
- Mark packed.
- Assign delivery staff.
- Mark out for delivery.
- Mark delivered.
- Cancel order.
- Contact customer.
- Open support conversation.

## Inventory Screen

Route:

```txt
/admin/inventory
```

Table columns:

- Product.
- SKU.
- Stock quantity.
- Reserved quantity.
- Available quantity.
- Low-stock threshold.
- Expiry warning.
- Status.

Filters:

- Low stock.
- Out of stock.
- Expiring soon.
- Category.
- Supplier.

Actions:

- Adjust stock.
- Add purchase entry.
- View batches.
- Update threshold.

## Inventory Detail Screen

Sections:

- Stock summary.
- Batch list.
- Adjustment history.
- Purchase entries.
- Related orders.

Actions:

- Create adjustment.
- Add batch.
- Mark expired stock removed.

## Suppliers Screen

Route:

```txt
/admin/suppliers
```

Table columns:

- Supplier name.
- Contact person.
- Phone.
- Email.
- Status.
- Last purchase.

Actions:

- Add supplier.
- Edit supplier.
- Disable supplier.
- View purchase history.

## Customers Screen

Route:

```txt
/admin/customers
```

Table columns:

- Name.
- Phone.
- Email.
- Orders.
- Total spent.
- Last order.
- Status.

Filters:

- Status.
- Order count.
- Date joined.
- Delivery zone.

Actions:

- View customer.
- View orders.
- View support history.

## Customer Detail Screen

Route:

```txt
/admin/customers/[id]
```

Sections:

- Profile.
- Addresses.
- Order history.
- Support conversations.
- Notification preferences.

Actions:

- Update profile.
- Disable customer if needed.
- Start support conversation.

## Coupons Screen

Route:

```txt
/admin/coupons
```

Table columns:

- Code.
- Discount type.
- Discount value.
- Minimum order.
- Usage count.
- Usage limit.
- Starts at.
- Expires at.
- Status.

Actions:

- Create coupon.
- Edit coupon.
- Pause coupon.
- Duplicate coupon.

## Delivery Screen

Route:

```txt
/admin/delivery
```

Dashboard sections:

- Active deliveries.
- Unassigned packed orders.
- Delayed deliveries.
- Delivery staff availability.
- Delivery zones.
- Delivery slot capacity.

Actions:

- Open live delivery map.
- Assign delivery staff.
- Manage slots.
- Manage zones.

## Admin Live Delivery Map

Route:

```txt
/admin/delivery/assignments
```

Features:

- Mapbox map.
- Active delivery markers.
- Delivery staff markers.
- Delayed order indicators.
- Assignment side panel.
- Order detail drawer.

Actions:

- Assign staff.
- Reassign staff.
- Contact staff.
- Contact customer.
- Mark delivery issue.

## Support Inbox Screen

Route:

```txt
/admin/support
```

Layout:

- Left conversation list.
- Center chat thread.
- Right customer/order context.

Conversation filters:

- Open.
- Pending.
- Resolved.
- Assigned to me.
- Unassigned.
- Order-linked.

Actions:

- Reply.
- Assign conversation.
- Mark pending.
- Resolve conversation.
- Use quick reply.
- Open linked order.

## Notifications Screen

Route:

```txt
/admin/notifications
```

Sections:

- Notification jobs.
- Templates.
- Failed notifications.
- Provider status later.

Actions:

- Retry notification.
- Edit template.
- Disable template.
- View payload.

## Staff Screen

Route:

```txt
/admin/staff
```

Table columns:

- Name.
- Email.
- Role.
- Status.
- 2FA status.
- Last login.

Actions:

- Add staff user.
- Assign role.
- Disable account.
- Reset 2FA.

## Settings Screens

Routes:

```txt
/admin/settings/store
/admin/settings/payments
/admin/settings/taxes
/admin/settings/support
/admin/settings/delivery
```

Store settings:

- Store name.
- Contact email.
- Support phone.
- Address.
- Business hours.

Payment settings:

- Cash on delivery.
- Mock payment.
- Razorpay later.

Tax settings:

- Tax rates.
- Tax labels.

Support settings:

- Support hours.
- Notification channels.
- Quick reply settings.

Delivery settings:

- Default delivery fee.
- Free delivery threshold.
- Same-day delivery.
- Cutoff rules.

## Forms And Modals

Common modals:

- Confirm deactivate.
- Confirm cancel order.
- Confirm stock adjustment.
- Assign delivery staff.
- Mark conversation resolved.

Common drawers:

- Product quick edit.
- Order quick view.
- Customer quick view.
- Inventory adjustment.

## Role-Based UI Behavior

Owner:

- See all screens and actions.

Store manager:

- See operations screens.
- Limited settings access.

Product manager:

- Products, categories, promotions.

Inventory staff:

- Inventory, suppliers, purchase entries.

Support agent:

- Support inbox and limited customer/order context.

Delivery staff:

- Assigned delivery view only.

## Admin Empty States

Important empty states:

- No products.
- No orders.
- No low-stock items.
- No active deliveries.
- No support conversations.
- No coupons.
- No staff users.

Each empty state should include a useful action.

## Admin Loading States

Use skeletons for:

- Dashboard cards.
- Tables.
- Order detail.
- Support inbox.
- Delivery map.

## Recommended First Implementation Order

1. Admin layout.
2. Dashboard.
3. Products and categories.
4. Orders and order detail.
5. Inventory and suppliers.
6. Delivery and live map.
7. Support inbox.
8. Customers.
9. Coupons and promotions.
10. Notifications.
11. Staff and settings.

