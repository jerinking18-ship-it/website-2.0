# Prisma Schema Details Plan

## Goal

Convert the database schema plan into a Prisma-ready model plan.

This file defines the planned Prisma models, enums, relations, indexes, and constraints for the production grocery ecommerce system.

## Prisma Principles

- Use PostgreSQL as the main database.
- Use UUID IDs for major records.
- Use `createdAt` and `updatedAt` consistently.
- Use enums for statuses.
- Use relation fields clearly.
- Add indexes for common filters and lookups.
- Preserve historical order snapshots.
- Avoid deleting business-critical records; prefer status fields or soft delete where needed.

## Common Field Conventions

Most business models should include:

```txt
id          String   @id @default(uuid())
createdAt   DateTime @default(now())
updatedAt   DateTime @updatedAt
```

Soft-deletable models can include:

```txt
deletedAt DateTime?
```

## Core Enums

### `CustomerStatus`

- `ACTIVE`
- `DISABLED`
- `BLOCKED`

### `AdminStatus`

- `ACTIVE`
- `INVITED`
- `DISABLED`

### `ProductStatus`

- `DRAFT`
- `ACTIVE`
- `INACTIVE`
- `OUT_OF_STOCK`

### `InventoryStatus`

- `IN_STOCK`
- `LOW_STOCK`
- `OUT_OF_STOCK`
- `EXPIRING_SOON`
- `EXPIRED`
- `DISABLED`

### `OrderStatus`

- `DRAFT`
- `PLACED`
- `CONFIRMED`
- `PACKED`
- `OUT_FOR_DELIVERY`
- `DELIVERED`
- `CANCELLED`
- `REFUNDED`

### `PaymentStatus`

- `NOT_REQUIRED`
- `COD_PENDING`
- `PENDING`
- `PAID`
- `FAILED`
- `REFUNDED`

### `FulfillmentStatus`

- `NOT_STARTED`
- `PICKING`
- `PACKED`
- `ASSIGNED`
- `OUT_FOR_DELIVERY`
- `DELIVERED`
- `FAILED_DELIVERY`

### `DeliveryAssignmentStatus`

- `UNASSIGNED`
- `ASSIGNED`
- `ACCEPTED`
- `PICKED_UP`
- `OUT_FOR_DELIVERY`
- `NEARBY`
- `DELIVERED`
- `FAILED_DELIVERY`
- `CANCELLED`

### `SupportConversationStatus`

- `OPEN`
- `PENDING`
- `RESOLVED`

### `NotificationChannel`

- `EMAIL`
- `WHATSAPP`
- `SMS`

### `NotificationStatus`

- `QUEUED`
- `PROCESSING`
- `SENT`
- `FAILED`
- `CANCELLED`
- `SKIPPED`

### `DiscountType`

- `PERCENTAGE`
- `FIXED_AMOUNT`

### `PaymentMethod`

- `CASH_ON_DELIVERY`
- `MOCK_ONLINE`
- `RAZORPAY`

## Identity Models

### `Customer`

Fields:

- `id`
- `phone`
- `email`
- `firstName`
- `lastName`
- `status`
- `createdAt`
- `updatedAt`

Relations:

- has many `CustomerAddress`
- has many `Order`
- has many `SupportConversation`
- has many `Cart`

Indexes:

- unique `phone`
- unique optional `email`
- index `status`

### `CustomerAddress`

Fields:

- `id`
- `customerId`
- `label`
- `recipientName`
- `phone`
- `addressLine1`
- `addressLine2`
- `city`
- `state`
- `postalCode`
- `latitude`
- `longitude`
- `isDefault`
- `createdAt`
- `updatedAt`

Relations:

- belongs to `Customer`

Indexes:

- index `customerId`
- index `postalCode`

### `CustomerOtpCode`

Fields:

- `id`
- `phone`
- `codeHash`
- `purpose`
- `expiresAt`
- `consumedAt`
- `attemptCount`
- `createdAt`

Indexes:

- index `phone`
- index `expiresAt`

### `AdminUser`

Fields:

- `id`
- `email`
- `passwordHash`
- `name`
- `status`
- `twoFactorEnabled`
- `lastLoginAt`
- `createdAt`
- `updatedAt`

Relations:

- has many `AdminUserRole`
- has many `AdminAuditLog`

Indexes:

- unique `email`
- index `status`

### `AdminRole`

Fields:

- `id`
- `name`
- `description`
- `createdAt`
- `updatedAt`

Relations:

- has many `AdminUserRole`
- has many `AdminRolePermission`

Indexes:

- unique `name`

### `AdminPermission`

Fields:

- `id`
- `key`
- `description`

Indexes:

- unique `key`

### `AdminUserRole`

Join model between admin users and roles.

Fields:

- `adminUserId`
- `adminRoleId`

Constraints:

- composite unique `adminUserId`, `adminRoleId`

### `AdminRolePermission`

Join model between roles and permissions.

Fields:

- `adminRoleId`
- `adminPermissionId`

Constraints:

- composite unique `adminRoleId`, `adminPermissionId`

## Catalog Models

### `Category`

Fields:

- `id`
- `name`
- `slug`
- `description`
- `parentId`
- `sortOrder`
- `isFeatured`
- `isActive`
- `createdAt`
- `updatedAt`

Relations:

- self relation parent/children
- has many `Product`

Indexes:

- unique `slug`
- index `parentId`
- index `isActive`
- index `sortOrder`

### `Product`

Fields:

- `id`
- `categoryId`
- `name`
- `slug`
- `description`
- `brand`
- `unitLabel`
- `basePrice`
- `salePrice`
- `taxRate`
- `status`
- `isFeatured`
- `isReturnable`
- `createdAt`
- `updatedAt`
- `deletedAt`

Relations:

- belongs to `Category`
- has many `ProductImage`
- has many `ProductVariant`
- has many `ProductBadgeLink`
- has many `ProductReview`
- has many `InventoryItem`

Indexes:

- unique `slug`
- index `categoryId`
- index `status`
- index `isFeatured`

### `ProductImage`

Fields:

- `id`
- `productId`
- `url`
- `altText`
- `sortOrder`
- `isPrimary`
- `createdAt`

Relations:

- belongs to `Product`

Indexes:

- index `productId`
- index `isPrimary`

### `ProductVariant`

Fields:

- `id`
- `productId`
- `name`
- `sku`
- `unitLabel`
- `price`
- `salePrice`
- `status`
- `createdAt`
- `updatedAt`

Relations:

- belongs to `Product`
- has many `InventoryItem`

Indexes:

- unique `sku`
- index `productId`
- index `status`

### `ProductBadge`

Fields:

- `id`
- `name`
- `slug`
- `color`

Indexes:

- unique `slug`

### `ProductBadgeLink`

Join model between products and badges.

Fields:

- `productId`
- `badgeId`

Constraints:

- composite unique `productId`, `badgeId`

## Cart And Checkout Models

### `Cart`

Fields:

- `id`
- `customerId`
- `guestId`
- `status`
- `deliveryZoneId`
- `couponId`
- `createdAt`
- `updatedAt`

Relations:

- optional `Customer`
- has many `CartItem`
- optional `Coupon`

Indexes:

- index `customerId`
- index `guestId`
- index `status`

### `CartItem`

Fields:

- `id`
- `cartId`
- `productId`
- `variantId`
- `quantity`
- `unitPriceSnapshot`
- `createdAt`
- `updatedAt`

Relations:

- belongs to `Cart`
- belongs to `Product`
- optional `ProductVariant`

Indexes:

- index `cartId`
- composite unique `cartId`, `productId`, `variantId`

### `CheckoutSession`

Fields:

- `id`
- `cartId`
- `customerId`
- `guestId`
- `addressId`
- `deliverySlotId`
- `paymentMethod`
- `status`
- `expiresAt`
- `createdAt`
- `updatedAt`

Relations:

- belongs to `Cart`
- optional `Customer`
- optional `CustomerAddress`
- optional `DeliverySlot`

Indexes:

- index `cartId`
- index `customerId`
- index `guestId`
- index `expiresAt`

## Order And Payment Models

### `Order`

Fields:

- `id`
- `orderNumber`
- `customerId`
- `guestPhone`
- `status`
- `paymentStatus`
- `fulfillmentStatus`
- `subtotal`
- `discountTotal`
- `deliveryFee`
- `taxTotal`
- `grandTotal`
- `deliveryAddressSnapshot`
- `deliverySlotId`
- `createdAt`
- `updatedAt`

Relations:

- optional `Customer`
- has many `OrderItem`
- has many `Payment`
- has many `OrderStatusHistory`
- optional `DeliverySlot`
- has many `DeliveryAssignment`
- has many `SupportConversation`

Indexes:

- unique `orderNumber`
- index `customerId`
- index `guestPhone`
- index `status`
- index `paymentStatus`
- index `fulfillmentStatus`
- index `createdAt`

### `OrderItem`

Fields:

- `id`
- `orderId`
- `productId`
- `variantId`
- `productNameSnapshot`
- `unitLabelSnapshot`
- `quantity`
- `unitPrice`
- `lineTotal`

Relations:

- belongs to `Order`
- optional `Product`
- optional `ProductVariant`

Indexes:

- index `orderId`
- index `productId`

### `OrderStatusHistory`

Fields:

- `id`
- `orderId`
- `fromStatus`
- `toStatus`
- `changedByAdminId`
- `note`
- `createdAt`

Indexes:

- index `orderId`
- index `changedByAdminId`

### `Payment`

Fields:

- `id`
- `orderId`
- `provider`
- `method`
- `status`
- `amount`
- `providerPaymentId`
- `providerOrderId`
- `paidAt`
- `createdAt`
- `updatedAt`

Relations:

- belongs to `Order`
- has many `Refund`

Indexes:

- index `orderId`
- index `status`
- index `providerPaymentId`

### `Refund`

Fields:

- `id`
- `paymentId`
- `orderId`
- `amount`
- `reason`
- `status`
- `providerRefundId`
- `createdAt`
- `updatedAt`

Indexes:

- index `paymentId`
- index `orderId`
- index `status`

## Inventory And Supplier Models

### `Supplier`

Fields:

- `id`
- `name`
- `contactName`
- `phone`
- `email`
- `status`
- `notes`
- `createdAt`
- `updatedAt`

Indexes:

- index `status`
- index `name`

### `InventoryItem`

Fields:

- `id`
- `productId`
- `variantId`
- `sku`
- `stockQuantity`
- `reservedQuantity`
- `lowStockThreshold`
- `status`
- `createdAt`
- `updatedAt`

Relations:

- belongs to `Product`
- optional `ProductVariant`
- has many `InventoryBatch`
- has many `InventoryAdjustment`

Indexes:

- unique `sku`
- index `productId`
- index `variantId`
- index `status`

### `InventoryBatch`

Fields:

- `id`
- `inventoryItemId`
- `supplierId`
- `batchCode`
- `quantity`
- `receivedAt`
- `expiresAt`
- `costPrice`
- `createdAt`

Relations:

- belongs to `InventoryItem`
- optional `Supplier`

Indexes:

- index `inventoryItemId`
- index `supplierId`
- index `expiresAt`
- index `batchCode`

### `InventoryAdjustment`

Fields:

- `id`
- `inventoryItemId`
- `batchId`
- `adjustmentType`
- `quantityDelta`
- `reason`
- `createdByAdminId`
- `createdAt`

Indexes:

- index `inventoryItemId`
- index `batchId`
- index `createdByAdminId`

### `PurchaseEntry`

Fields:

- `id`
- `supplierId`
- `referenceNumber`
- `status`
- `totalCost`
- `receivedAt`
- `createdAt`
- `updatedAt`

Relations:

- belongs to `Supplier`
- has many `PurchaseEntryItem`

Indexes:

- index `supplierId`
- index `referenceNumber`
- index `status`

### `PurchaseEntryItem`

Fields:

- `id`
- `purchaseEntryId`
- `inventoryItemId`
- `quantity`
- `costPrice`
- `batchCode`
- `expiresAt`

Indexes:

- index `purchaseEntryId`
- index `inventoryItemId`

## Delivery Models

### `DeliveryZone`

Fields:

- `id`
- `name`
- `postalCodes`
- `baseFee`
- `freeDeliveryMinimum`
- `sameDayEnabled`
- `isActive`
- `createdAt`
- `updatedAt`

Indexes:

- index `isActive`

### `DeliverySlot`

Fields:

- `id`
- `deliveryZoneId`
- `startsAt`
- `endsAt`
- `capacity`
- `reservedCount`
- `cutoffAt`
- `isActive`
- `createdAt`
- `updatedAt`

Relations:

- belongs to `DeliveryZone`

Indexes:

- index `deliveryZoneId`
- index `startsAt`
- index `cutoffAt`

### `DeliveryStaff`

Fields:

- `id`
- `adminUserId`
- `name`
- `phone`
- `status`
- `createdAt`
- `updatedAt`

Relations:

- optional `AdminUser`
- has many `DeliveryAssignment`

Indexes:

- index `adminUserId`
- index `status`

### `DeliveryAssignment`

Fields:

- `id`
- `orderId`
- `deliveryStaffId`
- `status`
- `assignedAt`
- `acceptedAt`
- `pickedUpAt`
- `outForDeliveryAt`
- `deliveredAt`
- `createdAt`
- `updatedAt`

Relations:

- belongs to `Order`
- optional `DeliveryStaff`
- has many `DeliveryLocationHistory`

Indexes:

- index `orderId`
- index `deliveryStaffId`
- index `status`

### `DeliveryLocationHistory`

Optional model for location audit/history.

Fields:

- `id`
- `deliveryAssignmentId`
- `deliveryStaffId`
- `latitude`
- `longitude`
- `accuracy`
- `heading`
- `speed`
- `recordedAt`

Indexes:

- index `deliveryAssignmentId`
- index `deliveryStaffId`
- index `recordedAt`

## Coupon And Promotion Models

### `Coupon`

Fields:

- `id`
- `code`
- `discountType`
- `discountValue`
- `minimumOrderValue`
- `usageLimit`
- `startsAt`
- `expiresAt`
- `status`
- `createdAt`
- `updatedAt`

Indexes:

- unique `code`
- index `status`
- index `expiresAt`

### `CouponRedemption`

Fields:

- `id`
- `couponId`
- `customerId`
- `orderId`
- `discountAmount`
- `createdAt`

Indexes:

- index `couponId`
- index `customerId`
- index `orderId`

### `Promotion`

Fields:

- `id`
- `name`
- `type`
- `startsAt`
- `endsAt`
- `status`
- `createdAt`
- `updatedAt`

### `PromotionTarget`

Fields:

- `id`
- `promotionId`
- `productId`
- `categoryId`

Indexes:

- index `promotionId`
- index `productId`
- index `categoryId`

## Support Models

### `SupportConversation`

Fields:

- `id`
- `customerId`
- `guestId`
- `orderId`
- `status`
- `assignedAdminId`
- `lastMessageAt`
- `createdAt`
- `updatedAt`

Indexes:

- index `customerId`
- index `guestId`
- index `orderId`
- index `status`
- index `assignedAdminId`
- index `lastMessageAt`

### `SupportMessage`

Fields:

- `id`
- `conversationId`
- `senderType`
- `senderCustomerId`
- `senderAdminId`
- `body`
- `messageType`
- `deliveredAt`
- `readAt`
- `createdAt`

Indexes:

- index `conversationId`
- index `senderCustomerId`
- index `senderAdminId`
- index `createdAt`

### `SupportAttachment`

Fields:

- `id`
- `messageId`
- `url`
- `fileName`
- `mimeType`
- `size`
- `createdAt`

### `SupportQuickReply`

Fields:

- `id`
- `title`
- `body`
- `isActive`
- `createdAt`
- `updatedAt`

### `SupportConversationEvent`

Fields:

- `id`
- `conversationId`
- `eventType`
- `adminUserId`
- `metadata`
- `createdAt`

## Notification Models

### `NotificationTemplate`

Fields:

- `id`
- `channel`
- `name`
- `subject`
- `body`
- `variables`
- `isActive`
- `createdAt`
- `updatedAt`

Indexes:

- index `channel`
- unique `channel`, `name`

### `NotificationJob`

Fields:

- `id`
- `channel`
- `recipient`
- `templateId`
- `payload`
- `status`
- `scheduledAt`
- `sentAt`
- `retryCount`
- `providerMessageId`
- `failureReason`
- `createdAt`
- `updatedAt`

Indexes:

- index `channel`
- index `status`
- index `scheduledAt`
- index `templateId`

### `NotificationPreference`

Fields:

- `id`
- `customerId`
- `emailEnabled`
- `whatsAppEnabled`
- `smsEnabled`
- `orderUpdates`
- `supportUpdates`
- `promotions`
- `createdAt`
- `updatedAt`

Indexes:

- unique `customerId`

## Audit Models

### `AdminAuditLog`

Fields:

- `id`
- `adminUserId`
- `action`
- `resourceType`
- `resourceId`
- `metadata`
- `ipAddress`
- `createdAt`

Indexes:

- index `adminUserId`
- index `resourceType`, `resourceId`
- index `createdAt`

### `SystemEvent`

Fields:

- `id`
- `eventType`
- `resourceType`
- `resourceId`
- `metadata`
- `createdAt`

Indexes:

- index `eventType`
- index `resourceType`, `resourceId`
- index `createdAt`

## JSON Fields

Use JSON fields for:

- `deliveryAddressSnapshot`
- notification `payload`
- audit `metadata`
- system event `metadata`
- template `variables`
- delivery zone `postalCodes` if stored as an array-like value.

## Important Indexes

High-priority indexes:

- `Product.slug`
- `Product.categoryId`
- `Product.status`
- `Order.orderNumber`
- `Order.customerId`
- `Order.status`
- `Order.createdAt`
- `InventoryItem.sku`
- `InventoryItem.status`
- `DeliverySlot.deliveryZoneId`
- `DeliverySlot.startsAt`
- `SupportConversation.status`
- `SupportConversation.assignedAdminId`
- `SupportConversation.lastMessageAt`
- `NotificationJob.status`
- `NotificationJob.scheduledAt`

## Constraints And Rules

- Product slugs must be unique.
- Category slugs must be unique.
- Coupon codes must be unique.
- SKU values must be unique.
- Order numbers must be unique.
- Admin emails must be unique.
- Customer phone numbers must be unique when account exists.
- Cart item should be unique by cart, product, and variant.
- Inventory cannot sell expired batches.
- Order items must preserve product snapshots.
- Deleting products should not break historical orders.

## Future Optional AI Models

AI shopping is not part of the first production version.

If approved later, possible models:

- `AiSession`
- `AiMessage`
- `AiCartSuggestion`
- `AiSubstitutionSuggestion`

Do not include these in the first implementation unless explicitly approved.

## Current Frontend Alignment Addendum

The current frontend requires the database to support the full client/admin contract in [Current Frontend Backend Contract Plan](./52-current-frontend-backend-contract-plan.md).

Add or confirm these models during Prisma implementation:

- `Wishlist`
- `WishlistItem`
- `CustomerNotificationPreference`
- `Wallet`
- `WalletTransaction`
- `LoyaltyAccount`
- `LoyaltyTransaction`
- `ReviewImage`
- `ReviewHelpfulVote`
- `ContactMessage`
- `ServiceabilityZone`
- `BranchServiceArea`
- `StorefrontPlacement`
- `HomepageSection`
- `ContentPage`
- `FooterLinkGroup`
- `FooterLink`
- `SearchHistory`
- `DeliveryLocationPing`

Final category seed records must use these slugs:

```txt
fresh-produce
dairy-and-eggs
staples
beverages
bakery
frozen
household
organic
snacks
personal-care
```

The backend should treat `Category.slug`, `Product.slug`, `Coupon.code`, `Order.orderNumber`, `InventoryItem.sku`, `AdminUser.email`, and customer phone numbers as unique production identifiers.
