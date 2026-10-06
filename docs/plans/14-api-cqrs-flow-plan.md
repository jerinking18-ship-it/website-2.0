# API And CQRS Flow Plan

## Goal

Define the backend API and CQRS flows for the grocery ecommerce platform.

The backend should use NestJS with CQRS. Commands handle writes. Queries handle reads. Events describe important business changes and trigger side effects.

## CQRS Principles

- Commands change system state.
- Queries read system state.
- Events are emitted after important changes.
- Command handlers should validate business rules.
- Query handlers should return UI-friendly read models.
- Side effects such as emails, WhatsApp, SMS, search indexing, and notifications should be event-driven where possible.

## Backend Module List

- Auth Module
- Products Module
- Categories Module
- Search Module
- Cart Module
- Checkout Module
- Orders Module
- Payments Module
- Inventory Module
- Customers Module
- Coupons Module
- Delivery Module
- Support Module
- Notifications Module
- Admin Module
- Files And Media Module
- Audit Module

## API Style

Use REST APIs first because they are simple, stable, and easy to connect with Next.js.

Recommended path style:

```txt
/api/products
/api/categories
/api/cart
/api/checkout
/api/orders
/api/admin/products
/api/admin/orders
/api/support
```

WebSockets should be used for:

- Customer support chat.
- Admin support inbox.
- Typing indicators.
- Realtime unread counts.
- Optional delivery/order status updates later.

## Auth Module

### Commands

- `RequestCustomerOtpCommand`
- `VerifyCustomerOtpCommand`
- `CreateCustomerSessionCommand`
- `LogoutCustomerCommand`
- `AdminLoginCommand`
- `VerifyAdminTwoFactorCommand`
- `CreateAdminUserCommand`
- `AssignAdminRoleCommand`
- `UpdateAdminPermissionsCommand`

### Queries

- `GetCurrentCustomerQuery`
- `GetCurrentAdminQuery`
- `ListAdminRolesQuery`
- `ListAdminPermissionsQuery`

### Events

- `CustomerOtpRequestedEvent`
- `CustomerLoggedInEvent`
- `AdminLoggedInEvent`
- `AdminRoleAssignedEvent`

## Products Module

### Commands

- `CreateProductCommand`
- `UpdateProductCommand`
- `DeactivateProductCommand`
- `UploadProductImageCommand`
- `SetProductBadgesCommand`
- `UpdateProductPriceCommand`
- `UpdateProductCategoryCommand`

### Queries

- `GetProductQuery`
- `ListProductsQuery`
- `ListFeaturedProductsQuery`
- `ListProductsByCategoryQuery`
- `ListRelatedProductsQuery`
- `GetProductForAdminQuery`
- `ListProductsForAdminQuery`

### Events

- `ProductCreatedEvent`
- `ProductUpdatedEvent`
- `ProductPriceChangedEvent`
- `ProductImageUploadedEvent`
- `ProductDeactivatedEvent`

### Side Effects

- Update Meilisearch product index.
- Update cache.
- Write audit log for admin changes.

## Categories Module

### Commands

- `CreateCategoryCommand`
- `UpdateCategoryCommand`
- `ReorderCategoriesCommand`
- `DeactivateCategoryCommand`

### Queries

- `ListCategoriesQuery`
- `GetCategoryQuery`
- `ListFeaturedCategoriesQuery`
- `ListCategoriesForAdminQuery`

### Events

- `CategoryCreatedEvent`
- `CategoryUpdatedEvent`
- `CategoryReorderedEvent`

## Search Module

### Commands

- `CreateSearchSynonymCommand`
- `UpdateSearchSynonymCommand`
- `CreateSearchRedirectCommand`
- `ReindexProductsCommand`

### Queries

- `SearchProductsQuery`
- `GetSearchSuggestionsQuery`
- `ListSearchSynonymsQuery`
- `ListSearchRedirectsQuery`

### Events

- `ProductSearchIndexedEvent`
- `SearchSynonymUpdatedEvent`

## Cart Module

### Commands

- `CreateCartCommand`
- `AddCartItemCommand`
- `UpdateCartItemQuantityCommand`
- `RemoveCartItemCommand`
- `ApplyCouponToCartCommand`
- `RemoveCouponFromCartCommand`
- `ClearCartCommand`

### Queries

- `GetCartQuery`
- `GetCartSummaryQuery`
- `ListCartRecommendationsQuery`

### Events

- `CartCreatedEvent`
- `CartItemAddedEvent`
- `CartItemQuantityUpdatedEvent`
- `CartItemRemovedEvent`
- `CouponAppliedToCartEvent`

## Checkout Module

### Commands

- `StartCheckoutCommand`
- `SetCheckoutAddressCommand`
- `SetCheckoutDeliverySlotCommand`
- `SetCheckoutPaymentMethodCommand`
- `ValidateCheckoutCommand`
- `PlaceOrderCommand`

### Queries

- `GetCheckoutSessionQuery`
- `GetCheckoutSummaryQuery`
- `ListAvailableDeliverySlotsForCheckoutQuery`

### Events

- `CheckoutStartedEvent`
- `CheckoutAddressSetEvent`
- `CheckoutDeliverySlotSetEvent`
- `CheckoutValidatedEvent`
- `CheckoutCompletedEvent`

## Orders Module

### Commands

- `CreateOrderCommand`
- `UpdateOrderStatusCommand`
- `CancelOrderCommand`
- `MarkOrderPackedCommand`
- `MarkOrderOutForDeliveryCommand`
- `MarkOrderDeliveredCommand`
- `AttachOrderNoteCommand`

### Queries

- `GetOrderQuery`
- `GetOrderByNumberQuery`
- `ListCustomerOrdersQuery`
- `ListOrdersForAdminQuery`
- `GetOrderDetailForAdminQuery`
- `GetRecentOrdersQuery`

### Events

- `OrderCreatedEvent`
- `OrderStatusChangedEvent`
- `OrderCancelledEvent`
- `OrderPackedEvent`
- `OrderOutForDeliveryEvent`
- `OrderDeliveredEvent`

### Side Effects

- Reserve or reduce inventory.
- Send order confirmation notification.
- Update admin dashboard metrics.
- Trigger delivery assignment workflow where applicable.

## Payments Module

### Commands

- `CreatePaymentAttemptCommand`
- `ConfirmMockPaymentCommand`
- `MarkCashOnDeliveryCommand`
- `HandleRazorpayWebhookCommand`
- `CreateRefundCommand`

### Queries

- `GetPaymentStatusQuery`
- `ListPaymentsForOrderQuery`
- `ListRefundsForOrderQuery`

### Events

- `PaymentAttemptCreatedEvent`
- `PaymentSucceededEvent`
- `PaymentFailedEvent`
- `CashOnDeliverySelectedEvent`
- `RefundCreatedEvent`

## Inventory Module

### Commands

- `CreateInventoryItemCommand`
- `UpdateStockCommand`
- `ReserveInventoryCommand`
- `ReleaseInventoryReservationCommand`
- `ReduceInventoryForOrderCommand`
- `CreateInventoryBatchCommand`
- `CreateInventoryAdjustmentCommand`
- `CreatePurchaseEntryCommand`

### Queries

- `GetInventoryItemQuery`
- `ListInventoryItemsQuery`
- `ListLowStockItemsQuery`
- `ListOutOfStockItemsQuery`
- `ListInventoryBatchesQuery`
- `ListInventoryAdjustmentsQuery`

### Events

- `InventoryItemCreatedEvent`
- `InventoryReservedEvent`
- `InventoryReservationReleasedEvent`
- `InventoryReducedEvent`
- `InventoryAdjustedEvent`
- `InventoryBatchCreatedEvent`
- `LowStockDetectedEvent`
- `ProductOutOfStockEvent`

### Important Rules

- Inventory should be reserved during checkout/order creation.
- Inventory should be reduced when an order is confirmed.
- Inventory reservation should be released if checkout expires or payment fails.
- Batch and expiry data should be preserved.

## Customers Module

### Commands

- `CreateCustomerCommand`
- `UpdateCustomerProfileCommand`
- `AddCustomerAddressCommand`
- `UpdateCustomerAddressCommand`
- `DeleteCustomerAddressCommand`
- `UpdateCustomerPreferencesCommand`

### Queries

- `GetCustomerProfileQuery`
- `ListCustomerAddressesQuery`
- `ListCustomersForAdminQuery`
- `GetCustomerDetailForAdminQuery`

### Events

- `CustomerCreatedEvent`
- `CustomerProfileUpdatedEvent`
- `CustomerAddressAddedEvent`

## Coupons Module

### Commands

- `CreateCouponCommand`
- `UpdateCouponCommand`
- `PauseCouponCommand`
- `ValidateCouponCommand`
- `RedeemCouponCommand`
- `CreatePromotionCommand`
- `UpdatePromotionCommand`

### Queries

- `GetCouponQuery`
- `ListCouponsForAdminQuery`
- `ListActivePromotionsQuery`
- `GetCouponUsageQuery`

### Events

- `CouponCreatedEvent`
- `CouponRedeemedEvent`
- `CouponPausedEvent`
- `PromotionCreatedEvent`

## Delivery Module

### Commands

- `CreateDeliveryZoneCommand`
- `UpdateDeliveryZoneCommand`
- `CreateDeliverySlotCommand`
- `UpdateDeliverySlotCommand`
- `ReserveDeliverySlotCommand`
- `ReleaseDeliverySlotReservationCommand`
- `AssignDeliveryStaffCommand`
- `UpdateDeliveryStatusCommand`

### Queries

- `ListDeliveryZonesQuery`
- `ListAvailableDeliverySlotsQuery`
- `ListDeliveryAssignmentsQuery`
- `GetDeliveryAssignmentQuery`

### Events

- `DeliveryZoneCreatedEvent`
- `DeliverySlotCreatedEvent`
- `DeliverySlotReservedEvent`
- `DeliveryStaffAssignedEvent`
- `DeliveryStatusChangedEvent`

## Support Module

### Commands

- `StartSupportConversationCommand`
- `SendSupportMessageCommand`
- `AssignSupportConversationCommand`
- `MarkSupportConversationPendingCommand`
- `ResolveSupportConversationCommand`
- `MarkSupportMessageReadCommand`
- `CreateSupportQuickReplyCommand`

### Queries

- `GetSupportConversationQuery`
- `ListCustomerSupportConversationsQuery`
- `ListSupportInboxQuery`
- `GetSupportUnreadCountQuery`
- `ListSupportQuickRepliesQuery`

### Events

- `SupportConversationStartedEvent`
- `SupportMessageSentEvent`
- `SupportConversationAssignedEvent`
- `SupportConversationResolvedEvent`
- `SupportMessageReadEvent`

### WebSocket Events

- `support:conversation_started`
- `support:message_sent`
- `support:message_received`
- `support:typing_started`
- `support:typing_stopped`
- `support:message_read`
- `support:conversation_assigned`
- `support:conversation_resolved`

### Side Effects

- Send email, WhatsApp, and SMS notifications based on conversation rules.
- Update unread counts in Redis.
- Update admin support inbox in realtime.

## Notifications Module

### Commands

- `CreateNotificationTemplateCommand`
- `UpdateNotificationTemplateCommand`
- `QueueNotificationCommand`
- `SendNotificationCommand`
- `RetryFailedNotificationCommand`

### Queries

- `ListNotificationTemplatesQuery`
- `ListNotificationJobsQuery`
- `GetNotificationJobQuery`

### Events

- `NotificationQueuedEvent`
- `NotificationSentEvent`
- `NotificationFailedEvent`

### Channels

- Email.
- WhatsApp.
- SMS.

## Future Optional AI Assistant Module

AI shopping is not part of the first production version. The commands, queries, and events below should only be planned further if AI shopping is approved later.

### Commands

- `StartAiShoppingSessionCommand`
- `SendAiShoppingMessageCommand`
- `GenerateWeeklyCartCommand`
- `GenerateMealPlanCartCommand`
- `GenerateProductSubstitutionsCommand`
- `AcceptAiCartSuggestionCommand`
- `RejectAiCartSuggestionCommand`

### Queries

- `GetAiShoppingSessionQuery`
- `ListAiCartSuggestionsQuery`
- `ListAiSubstitutionSuggestionsQuery`
- `GetPersonalizedProductRecommendationsQuery`

### Events

- `AiShoppingSessionStartedEvent`
- `AiCartSuggestionsGeneratedEvent`
- `AiSuggestionAcceptedEvent`
- `AiSuggestionRejectedEvent`

### Rules

- AI should only suggest available products.
- AI should respect dietary preferences when known.
- AI should not directly place orders without customer confirmation.

## Files And Media Module

### Commands

- `CreateUploadUrlCommand`
- `AttachProductImageCommand`
- `DeleteMediaAssetCommand`

### Queries

- `GetMediaAssetQuery`
- `ListProductImagesQuery`

### Events

- `MediaAssetUploadedEvent`
- `ProductImageAttachedEvent`

## Audit Module

### Commands

- `WriteAuditLogCommand`

### Queries

- `ListAuditLogsQuery`
- `GetAuditLogQuery`

### Events

- `AuditLogWrittenEvent`

## Main Business Flows

## Checkout And Order Flow

1. Customer adds products to cart.
2. Customer starts checkout.
3. Customer enters address.
4. System lists available delivery slots.
5. Customer selects delivery slot.
6. System validates cart, coupon, delivery zone, and inventory.
7. System reserves inventory and delivery slot.
8. Customer selects payment method.
9. Customer places order.
10. System creates order.
11. System confirms payment or marks cash on delivery.
12. System sends order confirmation.
13. Admin sees order in dashboard.

## Inventory Flow

1. Admin creates product.
2. Admin creates inventory item.
3. Admin records purchase batch.
4. System updates stock count.
5. Customer checkout reserves inventory.
6. Confirmed order reduces inventory.
7. Low stock triggers alert.
8. Out-of-stock products are removed or marked unavailable in search.

## Support Chat Flow

1. Customer opens chatbox.
2. Customer starts conversation.
3. Customer sends message.
4. Server stores message.
5. Admin inbox receives realtime update.
6. Agent replies.
7. Customer receives realtime reply.
8. Notifications are sent through email, WhatsApp, or SMS when needed.
9. Agent marks conversation pending or resolved.

## Future Optional AI Shopping Flow

AI shopping is not part of the first production version.

1. Customer opens AI shopping assistant.
2. Customer enters request such as weekly groceries or meal plan.
3. AI reads available product catalog.
4. AI generates cart suggestions.
5. Customer accepts or rejects suggestions.
6. Accepted items are added to cart.
7. Customer checks out normally.

## Admin Product Flow

1. Admin creates product.
2. Admin uploads product images.
3. Admin sets price, category, badges, and inventory.
4. Product is indexed in Meilisearch.
5. Product appears on customer website.

## Admin Order Flow

1. Admin opens orders page.
2. Admin filters pending orders.
3. Admin opens order detail.
4. Admin updates status.
5. System emits order status event.
6. Customer receives notification.
7. Dashboard metrics update.

## Recommended Next API Planning Step

After approval, create a detailed API endpoint plan with exact REST endpoints, request bodies, response shapes, auth requirements, and role permissions.

## Current Frontend Alignment Addendum

Before backend implementation starts, use [Current Frontend Backend Contract Plan](./52-current-frontend-backend-contract-plan.md) as the screen-to-API contract.

The current frontend requires CQRS coverage for these additional areas:

- Storefront aggregate and admin publishing.
- Wishlist and saved product alerts.
- Account profile, addresses, wallet, loyalty, and notification preferences.
- Serviceability checks and branch availability.
- Contact messages and legal/content pages.
- Review images and helpful votes.
- Order tracking, invoice, reorder, cancel, refund, and return requests.
- Delivery location pings and realtime customer tracking.

Final category slugs for commands, queries, seed data, and frontend URLs:

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

Do not implement new backend records with old slugs such as `dairy-eggs` or `pantry`.
