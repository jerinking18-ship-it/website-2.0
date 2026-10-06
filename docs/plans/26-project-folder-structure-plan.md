# Project Folder Structure Plan

## Goal

Define the production monorepo folder structure for the grocery ecommerce platform.

The project should be organized clearly so customer website, admin panel, backend API, shared UI, shared types, and utilities can grow without becoming messy.

## Recommended Monorepo Structure

```txt
apps/
  web/
  admin/
  api/
packages/
  ui/
  types/
  config/
  utils/
docs/
  plans/
```

## Root Folder

Recommended root files:

```txt
package.json
pnpm-workspace.yaml
turbo.json
tsconfig.base.json
.env.example
.gitignore
README.md
codex.md
memory.md
```

## `apps/web`

Customer grocery ecommerce website.

Responsibilities:

- Customer homepage.
- Product browsing.
- Category pages.
- Search results.
- Cart drawer.
- Checkout flow.
- Order confirmation.
- Order tracking with Mapbox.
- Customer account.
- Support chatbox.
- PWA experience.

Recommended structure:

```txt
apps/web/
  app/
    page.tsx
    layout.tsx
    categories/
    products/
    search/
    cart/
    checkout/
    orders/
    account/
    support/
    offers/
    about/
    contact/
    policies/
  modules/
    home/
    products/
    categories/
    search/
    cart/
    checkout/
    orders/
    account/
    support-chat/
    delivery-tracking/
  components/
    layout/
    shared/
  lib/
    api-client.ts
    auth.ts
    env.ts
  public/
  styles/
```

## `apps/admin`

Admin panel for store operations.

Responsibilities:

- Admin dashboard.
- Product management.
- Category management.
- Order management.
- Inventory management.
- Supplier management.
- Customer management.
- Coupon management.
- Delivery management.
- Live delivery map.
- Support inbox.
- Notifications.
- Staff and roles.
- Settings.

Recommended structure:

```txt
apps/admin/
  app/
    layout.tsx
    login/
    verify-2fa/
    dashboard/
    products/
    categories/
    orders/
    inventory/
    suppliers/
    customers/
    coupons/
    promotions/
    delivery/
    support/
    notifications/
    staff/
    settings/
  modules/
    dashboard/
    products/
    categories/
    orders/
    inventory/
    suppliers/
    customers/
    coupons/
    delivery/
    support/
    notifications/
    staff/
    settings/
  components/
    layout/
    tables/
    forms/
  lib/
    api-client.ts
    auth.ts
    permissions.ts
    env.ts
  public/
  styles/
```

## `apps/api`

NestJS CQRS backend.

Responsibilities:

- REST APIs.
- CQRS commands and queries.
- WebSocket gateways.
- Prisma database access.
- Authentication.
- RBAC.
- Order processing.
- Inventory.
- Delivery tracking.
- Support chat.
- Notifications.
- Audit logs.

Recommended structure:

```txt
apps/api/
  src/
    main.ts
    app.module.ts
    config/
    common/
      decorators/
      filters/
      guards/
      interceptors/
      pipes/
    database/
      prisma.service.ts
      prisma.module.ts
    modules/
      auth/
      products/
      categories/
      search/
      cart/
      checkout/
      orders/
      payments/
      inventory/
      suppliers/
      customers/
      coupons/
      delivery/
      support/
      notifications/
      admin/
      media/
      audit/
    websocket/
      support.gateway.ts
      delivery.gateway.ts
  prisma/
    schema.prisma
    migrations/
    seed.ts
  test/
```

## API Module Structure

Each backend module should follow a consistent CQRS structure.

Example:

```txt
apps/api/src/modules/products/
  commands/
    create-product.command.ts
    update-product.command.ts
  command-handlers/
    create-product.handler.ts
    update-product.handler.ts
  queries/
    get-product.query.ts
    list-products.query.ts
  query-handlers/
    get-product.handler.ts
    list-products.handler.ts
  events/
    product-created.event.ts
    product-updated.event.ts
  dto/
    create-product.dto.ts
    update-product.dto.ts
  repositories/
    products.repository.ts
  products.controller.ts
  products.module.ts
```

## `packages/ui`

Shared UI component library.

Responsibilities:

- Shared buttons.
- Inputs.
- Dialogs.
- Drawers.
- Tables.
- Badges.
- Cards.
- Form controls.
- Layout primitives.

Recommended structure:

```txt
packages/ui/
  src/
    components/
      button/
      input/
      dialog/
      drawer/
      table/
      badge/
      card/
      form/
      tooltip/
    layouts/
    hooks/
    styles/
    index.ts
```

## `packages/types`

Shared TypeScript types.

Responsibilities:

- Product types.
- Cart types.
- Checkout types.
- Order types.
- Customer types.
- Admin types.
- Support chat types.
- Delivery tracking types.
- Notification types.

Recommended structure:

```txt
packages/types/
  src/
    product.ts
    category.ts
    cart.ts
    checkout.ts
    order.ts
    customer.ts
    admin.ts
    inventory.ts
    delivery.ts
    support.ts
    notification.ts
    api.ts
    index.ts
```

## `packages/config`

Shared configuration package.

Responsibilities:

- TypeScript config.
- ESLint config.
- Prettier config.
- Tailwind config.
- Shared environment rules.

Recommended structure:

```txt
packages/config/
  eslint/
  prettier/
  tailwind/
  typescript/
  env/
```

## `packages/utils`

Shared utility functions.

Responsibilities:

- Price formatting.
- Date formatting.
- Slug helpers.
- Validation helpers.
- Status helpers.
- Permission helpers.
- Map/location helpers.

Recommended structure:

```txt
packages/utils/
  src/
    format-price.ts
    format-date.ts
    slug.ts
    permissions.ts
    status.ts
    location.ts
    validation.ts
    index.ts
```

## Environment Files

Recommended env files:

```txt
.env.example
apps/web/.env.example
apps/admin/.env.example
apps/api/.env.example
```

Important environment values:

- PostgreSQL database URL.
- Redis URL.
- Meilisearch URL and key.
- Mapbox token.
- Email provider keys.
- WhatsApp provider keys.
- SMS provider keys.
- Razorpay keys later.
- Storage provider keys.

## Documentation Folder

Current planning docs live in:

```txt
docs/plans/
```

Future docs can include:

```txt
docs/api/
docs/design/
docs/deployment/
docs/operations/
```

## Build Tooling Recommendation

Use:

- PNPM workspaces.
- Turborepo.
- TypeScript.
- ESLint.
- Prettier.

## Recommended Creation Order

1. Root monorepo config.
2. `packages/types`.
3. `packages/utils`.
4. `packages/ui`.
5. `apps/api`.
6. `apps/web`.
7. `apps/admin`.
8. Shared environment examples.
9. Documentation updates.

