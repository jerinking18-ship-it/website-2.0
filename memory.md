# Project Memory

## Current Project

- Workspace: `/Users/jerinnadar/website2.0`
- Project type: Premium grocery website for a client.
- Current phase: Frontend mock implementation and UI polish.
- Working brand placeholder: FreshCart Market.
- Goal: Create a modern grocery website with shopping, search, filters, cart, delivery slot selection, and checkout preview.
- Architecture direction approved by user: CQRS with customer support chatbox and admin support inbox.
- Admin panel requested by user and added to the planning docs.
- Modular architecture requested by user and added as `docs/plans/10-modular-architecture-plan.md`.
- Production scope decisions added as `docs/plans/11-production-scope-plan.md`.
- Database schema planning added as `docs/plans/12-database-schema-plan.md`.
- Frontend route planning added as `docs/plans/13-frontend-routes-plan.md`.
- API and CQRS flow planning added as `docs/plans/14-api-cqrs-flow-plan.md`.
- Design system planning added as `docs/plans/15-design-system-plan.md`.
- Authentication and roles planning added as `docs/plans/16-authentication-and-roles-plan.md`.
- Order and checkout flow planning added as `docs/plans/17-order-and-checkout-flow-plan.md`.
- Support chat flow planning added as `docs/plans/18-support-chat-flow-plan.md`.
- Notifications planning added as `docs/plans/19-notifications-plan.md`.
- Inventory and supplier management planning added as `docs/plans/20-inventory-and-supplier-management-plan.md`.
- Delivery and fulfillment planning added as `docs/plans/21-delivery-and-fulfillment-plan.md`.
- Admin panel detailed screens planning added as `docs/plans/22-admin-panel-detailed-screens-plan.md`.
- Customer website detailed screens planning added as `docs/plans/23-customer-website-detailed-screens-plan.md`.
- API endpoint details planning added as `docs/plans/24-api-endpoint-details-plan.md`.
- Prisma schema details planning added as `docs/plans/25-prisma-schema-details-plan.md`.
- Project folder structure planning added as `docs/plans/26-project-folder-structure-plan.md`.
- Testing and QA strategy planning added as `docs/plans/27-testing-and-qa-strategy-plan.md`.
- Deployment and DevOps strategy planning added as `docs/plans/28-deployment-and-devops-strategy-plan.md`.
- Development milestones and timeline planning added as `docs/plans/29-development-milestones-and-timeline-plan.md`.
- Admin reports module planning added as `docs/plans/34-admin-reports-module-plan.md`.
- Admin suppliers module planning added as `docs/plans/35-admin-suppliers-module-plan.md`.
- Admin categories module planning added as `docs/plans/36-admin-categories-module-plan.md`, including admin category controls and how category changes affect the client website.
- Admin promotions module planning added as `docs/plans/37-admin-promotions-module-plan.md`, including campaign controls and how admin promotions connect to the client website through the backend.
- Admin suppliers module upgraded according to the plan with tabs, supplier stats, directory, add/edit/profile modals, purchase orders, payments, performance scorecards, reviews, and working dummy-state actions.
- Admin reports module implemented in the admin frontend with `/reports`, sidebar navigation, KPI cards, tabs, chart, tables, insights, exports, and working dummy-state actions.
- Admin reports module controls are now interactive: KPI cards, filters, chart bars, table row open/export/module actions, export detail/download/cancel, processing-to-ready refresh, and insight owner-summary scheduling.
- Admin routes `/categories`, `/suppliers`, `/promotions`, and `/verify-2fa` are now real pages. Categories, Suppliers, and Promotions are connected to the admin sidebar and AdminConsole; Verify 2FA is a standalone security page.
- Monorepo foundation structure created with `apps/web`, `apps/admin`, `apps/api`, `packages/ui`, `packages/types`, `packages/config`, and `packages/utils`.
- Customer frontend mock has been built in `apps/web` with dummy data first, before backend work.
- Admin frontend mock exists separately and has been viewed around `http://localhost:3001/dashboard` and `http://localhost:3001/coupons`.
- Customer frontend is running/viewed around `http://localhost:3002/`.

## Important User Instruction

Do not do any new task or make any new project changes without asking the user first.

Before starting implementation, editing files, running deployments, or adding features, ask the user what they want to do next and wait for confirmation.

Exception: if the user gives an explicit direct instruction in the current turn, do only that requested task and keep the scope tight.

## Existing Planning Files

- `docs/plans/README.md`
- `docs/plans/01-project-overview.md`
- `docs/plans/02-pages-and-user-flow.md`
- `docs/plans/03-feature-plan.md`
- `docs/plans/04-design-and-brand-direction.md`
- `docs/plans/05-product-catalog-and-content-plan.md`
- `docs/plans/06-technical-architecture.md`
- `docs/plans/07-development-roadmap.md`
- `docs/plans/08-deployment-and-launch-plan.md`
- `docs/plans/09-client-questions.md`
- `docs/plans/10-modular-architecture-plan.md`
- `docs/plans/11-production-scope-plan.md`
- `docs/plans/12-database-schema-plan.md`
- `docs/plans/13-frontend-routes-plan.md`
- `docs/plans/14-api-cqrs-flow-plan.md`
- `docs/plans/15-design-system-plan.md`
- `docs/plans/16-authentication-and-roles-plan.md`
- `docs/plans/17-order-and-checkout-flow-plan.md`
- `docs/plans/18-support-chat-flow-plan.md`
- `docs/plans/19-notifications-plan.md`
- `docs/plans/20-inventory-and-supplier-management-plan.md`
- `docs/plans/21-delivery-and-fulfillment-plan.md`
- `docs/plans/22-admin-panel-detailed-screens-plan.md`
- `docs/plans/23-customer-website-detailed-screens-plan.md`
- `docs/plans/24-api-endpoint-details-plan.md`
- `docs/plans/25-prisma-schema-details-plan.md`
- `docs/plans/26-project-folder-structure-plan.md`
- `docs/plans/27-testing-and-qa-strategy-plan.md`
- `docs/plans/28-deployment-and-devops-strategy-plan.md`
- `docs/plans/29-development-milestones-and-timeline-plan.md`
- `docs/plans/30-coupons-and-promotions-plan.md`
- `docs/plans/31-admin-notifications-plan.md`
- `docs/plans/32-admin-staff-module-plan.md`
- `docs/plans/33-admin-settings-module-plan.md`
- `docs/plans/34-admin-reports-module-plan.md`
- `docs/plans/35-admin-suppliers-module-plan.md`
- `codex.md`

## Planned Website Direction

- Premium, fresh, trustworthy grocery shopping experience.
- First screen should expose real shopping controls, not only a marketing hero.
- Recommended production stack: Next.js, TypeScript, Tailwind CSS, shadcn/ui, NestJS, PostgreSQL, Prisma, Redis, WebSockets, and CQRS.
- Customer support chatbox is planned for user-to-server communication.
- Admin support inbox is planned so staff can reply to customers in real time.
- Admin panel is planned with dashboard, products, orders, inventory, customers, coupons, delivery slots, support inbox, and settings.
- Project should be organized into separate modules for customer website, admin panel, backend CQRS domains, shared UI, and shared types.
- User does not want an MVP demo. Plan a full production-level system from the start.
- Approved production choices: full modular monorepo, guest checkout, cash on delivery plus mock online payment first, Razorpay later, customer phone OTP, admin email/password with 2FA, detailed inventory, advanced delivery, admin chat plus email/WhatsApp/SMS notifications, RBAC, PostgreSQL plus Redis plus Meilisearch, responsive website plus PWA.
- Delivery tracking should be premium, similar to Zepto/Zomato, using Mapbox for live map tracking.
- Updated UI direction: customer website should use a Zomato-inspired grocery delivery style with delivery red as the primary action/brand color, app-like location/search-first layout, horizontal discovery rails, premium product cards, sticky cart/checkout actions, and green reserved for freshness/status signals.
- User does not want AI shopping features in the first production version. AI shopping is future optional only.
- Future versions may include real payments, accounts, inventory, optional AI shopping assistant, and delivery tracking.

## Current Frontend Mock State

- Main customer UI file: `apps/web/modules/customer/customer-experience.tsx`.
- Main customer styling file: `apps/web/styles/globals.css`.
- Shared dummy catalog data is in `apps/web/modules/catalog/data`.
- Customer modules currently include home, categories, products/listing, search/offers, wishlist, product details, checkout, orders/tracking, support, cart drawer, promotion banner, and footer.
- Cart should not be a separate page. It should open as a right-side drawer when the user clicks the cart icon.
- Cart width was adjusted several times and currently intended around `450px`.
- Product grid on desktop should show 5 product cards in a row.
- Theme colors selected by user:
  - Primary: `#660b05`
  - Secondary: `#f5ca99ff`
- Border radius preference: Tailwind-style rounded feel, final requested radius was `0.5rem`.
- User requested all bold-looking typography to be softened to semibold where practical.
- User wants a Zomato-inspired grocery UI, but for grocery ecommerce, not a copy.
- User repeatedly prefers stylish, premium, attractive, modern, user-friendly design.
- User often rejects designs as "ugly"; when continuing, inspect current UI visually and improve the exact section mentioned instead of making broad unrelated changes.

## Recently Completed UI Work

- Navbar was redesigned multiple times with icon cart and heart wishlist link.
- Wishlist page was added and improved with working heart state, quick add, price watch, and back-in-stock style actions.
- Product cards have wishlist heart icons, images, compact add/quantity controls, and responsive 5-column layout.
- Product details page was improved with:
  - Multiple thumbnails beside the big product image.
  - Clicked thumbnail updates the big image.
  - Customer reviews and ratings.
  - Gold/yellow filled star styling.
  - Similar products row using the same product card style as home.
  - View all link navigating to the same category.
- Checkout page was restyled and made functional across address, delivery, payment, and review steps.
- Saved address, delivery slot, payment, review summary, and order totals were repeatedly restyled.
- Tracking page was restyled with a premium delivery-tracking direction and a map-like section.
- Support page was improved and "Open support" should navigate to `/support`.
- Home banner was restyled while keeping the image placement unchanged.
- Footer was added, then repeatedly restyled.
- Promotion banner was added above footer.

## Latest Work Before Stopping

- User said: "we will continue tomorrow".
- User then asked to save everything in `memory.md`.
- Last active UI focus before stopping: promotion banner and footer still need design approval. The user previously said it was ugly, and latest implementation changed it to a cleaner white coupon-style promo above a light footer.
- Latest edited files:
  - `apps/web/modules/customer/customer-experience.tsx`
  - `apps/web/styles/globals.css`
- Latest validation passed:
  - `pnpm typecheck`
  - `/usr/bin/curl -I http://localhost:3002/` returned `200 OK`.

## Known User Preferences For Tomorrow

- Ask before doing the next task.
- Continue with small, visible UI improvements section-by-section.
- Do not create unrelated pages or features unless user explicitly asks.
- If user says something looks ugly, inspect the current component and improve spacing, hierarchy, alignment, colors, and interaction states.
- Keep UI compact and app-like, not oversized landing-page style.
- Use primary color for important brand/action accents and secondary color for soft highlight backgrounds.
- Avoid huge cards, awkward circles, badly aligned text, large review boxes, and overly bold typography.
- Buttons should have centered text/icons and look polished.
- Product, category, checkout, cart, tracking, support, footer, and promo sections should all feel consistent.

## Next Step To Ask User

Ask the user what section they want to continue tomorrow. Suggested next options:

1. Continue fixing the footer and promotion banner.
2. Polish the mobile layout/header because the current narrow screenshot looked cramped.
3. Polish product cards and home page spacing.
4. Polish checkout/cart/tracking/support modules.
5. Move from frontend mock toward backend planning/implementation.

## Admin Suppliers Work - 2026-09-15

- Suppliers admin route exists at `/suppliers` and returns `200`.
- Suppliers admin module now has working mock-state actions for directory status changes, purchase order detail opening, purchase order status updates, invoice detail opening, marking supplier payments paid, stats navigation, and supplier list exports.
- Added purchase-order and invoice detail dialogs for supplier operations.
- Export supplier list now creates a visible export card, and Download changes it to Downloaded.
- Validation passed after supplier changes:
  - `pnpm typecheck`
  - `/usr/bin/curl -s -o /tmp/admin-suppliers-final.html -w "%{http_code}\n" http://localhost:3001/suppliers` returned `200`
- Browser sanity checked `/suppliers`: opened purchase order dialog, marked PO delayed, opened invoice dialog, generated export, and downloaded export successfully.

## Admin Categories Work - 2026-09-15

- Categories admin module was upgraded according to `docs/plans/36-admin-categories-module-plan.md`.
- `/categories` now has tabs for Overview, Directory, Subcategories, Homepage Order, Product Mapping, Offers, and SEO.
- Category data now includes storefront badge, sales, orders, top product, out-of-stock count, offer text, banner text, SEO title, SEO description, keywords, and OG image.
- Working mock-state actions include add/edit category, open category profile, feature/unfeature, hide/activate, move homepage order, add subcategory, move mapped product between categories, create/toggle category offers, and edit/save SEO metadata.
- Product mapping changes now also update category product counts so the admin numbers stay consistent.
- Final working pass added distinct Homepage preview Up/Down/Open controls and a real Bulk assign action that moves all products from the same source category together.
- Validation passed:
  - `pnpm typecheck`
  - `/usr/bin/curl -s -o /tmp/admin-categories-final.html -w "%{http_code}\n" http://localhost:3001/categories` returned `200`
- Browser sanity checked `/categories`: opened category profile, created a category offer, moved a product category mapping, opened SEO, and saved SEO.
- Additional browser sanity checked add category, edit category, homepage reorder, feature/remove, add subcategory, bulk product assignment, offer go-live, and offer duplicate.

## Admin Promotions Work - 2026-09-15

- Promotions admin module was upgraded according to `docs/plans/37-admin-promotions-module-plan.md`.
- `/promotions` now has tabs for Overview, Campaigns, Placements, Audience, Product Mapping, Coupons, Schedule, Analytics, and Risk.
- Promotion data now includes type, offer value, coupon, target URL, schedule, budget used, views, clicks, conversions, revenue, ROI, discount cost, risk, mapped target, and image code.
- Working mock-state actions include create/edit promotion, preview client placement, go live/pause, duplicate campaign, reorder placement priority, connect coupon, pause linked promo, schedule/expire/start campaign, open analytics, approve risk, pause risky campaign, and sync client cache notice.
- Fixed promotion KPI rupee parsing so values like `Rs. 2.4L` calculate correctly.
- Final working pass added visible client sync history and visible coupon connection state. `Sync client` now appends a sync event, and `Connect coupon` changes coupon state to `Synced` in the Coupons tab.
- Validation passed:
  - `pnpm typecheck`
  - `/usr/bin/curl -s -o /tmp/admin-promotions-final.html -w "%{http_code}\n" http://localhost:3001/promotions` returned `200`
- Browser sanity checked `/promotions`: created a promotion, opened preview, went live, opened placements, paused linked coupon promo, opened schedule, expired campaign, opened risk, and approved risk.
- Additional browser sanity checked visible Sync client event creation and coupon state changing from Connected to Synced.

## Admin Panel Completion And Final QA - 2026-09-19

- User confirmed that the admin panel frontend phase is completed and asked to save the final state in `memory.md`.
- Admin panel should now be treated as frontend-complete for the current pre-backend phase.
- Current admin URL: `http://localhost:3001`
- Current customer URL remains around: `http://localhost:3002/`
- Main admin file: `apps/admin/modules/admin-console.tsx`
- Main admin stylesheet: `apps/admin/styles/globals.css`

### Final Admin Modules Completed

The admin panel now includes real routes and frontend working state for:

- Dashboard.
- Products.
- Categories.
- Orders.
- Inventory.
- Suppliers.
- Delivery.
- Support.
- Customers.
- Coupons.
- Promotions.
- Refunds and returns.
- Finance.
- Audit logs.
- Content manager.
- Admin account.
- Reviews and ratings.
- Loyalty and wallet.
- Store locations and branches.
- Integrations.
- System health.
- Legal and compliance.
- Notifications.
- Staff.
- Reports.
- Settings.
- Login.
- Verify 2FA.

### Recent Plans Created

- Created `docs/plans/44-admin-reviews-ratings-module-plan.md`.
- Created `docs/plans/45-admin-loyalty-wallet-module-plan.md`.
- Created `docs/plans/46-admin-store-locations-branches-module-plan.md`.
- Created `docs/plans/47-admin-integrations-module-plan.md`.
- Created `docs/plans/48-admin-system-health-module-plan.md`.
- Created `docs/plans/49-admin-legal-compliance-module-plan.md`.
- Created `docs/plans/50-admin-production-readiness-gap-plan.md`.
- Updated `docs/plans/README.md` and `codex.md` with the new planning links.

### Final Six Admin Expansion Modules

- Added `/reviews` for Reviews and Ratings.
- Added `/loyalty` for Loyalty and Wallet.
- Added `/branches` for Store Locations and Branches.
- Added `/integrations` for Integrations.
- Added `/system-health` for System Health.
- Added `/legal` for Legal and Compliance.
- These modules are connected to sidebar navigation, admin search, page titles, icons, and route pages.
- Each of these modules has tabs, search/filter controls, stats, module-specific command buttons, editable records, settings forms, row actions, export records, and local frontend persistence.
- Replaced generic buttons like `Open queue`, `Settings`, and `Export report` with module-specific commands:
  - Reviews: New moderation rule, Moderation queue, Reported reviews, Export reviews.
  - Loyalty: Manual adjustment, Wallet ledger, Reward rules, Export ledger.
  - Branches: Add branch, Service areas, Branch inventory, Export branches.
  - Integrations: Add provider, API keys, Webhook logs, Export logs.
  - System Health: Create incident, API health, Backups, Export health log.
  - Legal: New policy version, Data requests, Compliance exports, Export compliance pack.

### Admin Production-Like Frontend State

- Added browser-level local persistence for most editable admin data using `localStorage`.
- Editable admin changes now survive browser refresh during the frontend phase.
- Persisted areas include products, categories, suppliers, promotions, orders, inventory, delivery, support, customers, coupons, refunds, finance, audit logs, content manager, account, notifications, staff, settings, reports, and the six new admin expansion modules.
- Important caveat: this is still frontend/browser persistence only. Real production still requires backend APIs, CQRS commands/queries, PostgreSQL, Prisma, authentication, RBAC enforcement, and server-side audit logging.

### Staff Roles And Permissions Final Update

- Staff roles and permissions were updated to match the full admin panel, not the older smaller admin scope.
- Added/updated role vocabulary:
  - Owner.
  - Store Manager.
  - Product Manager.
  - Inventory Manager.
  - Supplier Manager.
  - Order Manager.
  - Delivery Manager.
  - Support Agent.
  - Marketing Manager.
  - Finance Manager.
  - Compliance Manager.
  - Content Manager.
  - System Admin.
  - Read-only Auditor.
- Staff roles now include permission labels for every admin module:
  - Dashboard, Products, Categories, Orders, Inventory, Suppliers, Delivery, Support, Customers, Coupons, Promotions, Refunds, Finance, Audit Logs, Content Manager, Admin Account, Reviews, Loyalty and Wallet, Branches, Integrations, System Health, Legal and Compliance, Notifications, Staff, Reports, Settings.
- Added a real editable role permissions dialog with checkboxes for all admin modules.
- Added seeded staff examples for Finance Manager, Compliance Manager, Content Manager, and System Admin.
- Versioned Staff localStorage keys so the new role matrix appears instead of old saved roles.

### Final Pre-Backend Admin QA

- Performed a final admin QA pass before backend activity.
- Checked admin route/view/sidebar navigation consistency.
- Checked internal admin links and form actions.
- Checked that every admin route has a page and renders.
- Checked forms for input fields without names, controlled state, or read-only handling.
- Checked buttons for explicit button types.
- Checked staff role/permission module coverage.
- Found and fixed one real issue in Products:
  - Product image upload accepted a file but did not save/display the selected filename.
  - Fixed by storing the selected image filename on the product record and showing it in the product table.
- Final route sweep passed for:
  - `/dashboard`
  - `/products`
  - `/categories`
  - `/orders`
  - `/inventory`
  - `/suppliers`
  - `/delivery`
  - `/support`
  - `/customers`
  - `/coupons`
  - `/promotions`
  - `/refunds`
  - `/finance`
  - `/audit-logs`
  - `/content`
  - `/account`
  - `/reviews`
  - `/loyalty`
  - `/branches`
  - `/integrations`
  - `/system-health`
  - `/legal`
  - `/notifications`
  - `/staff`
  - `/reports`
  - `/settings`
  - `/login`
  - `/verify-2fa`

### Final Validation Passed

- `pnpm typecheck` passed.
- `pnpm --filter @freshcart/admin build` passed.
- Admin production build generated 32 routes successfully.
- Final admin dev server was restarted on port `3001`.
- Final browser/server route sweep returned `200` for all admin routes listed above.

### Backend Handoff Reminder

- Admin frontend is complete for the current pre-backend phase.
- Next major project phase should be backend activity.
- Backend should connect the admin frontend to:
  - NestJS CQRS commands and queries.
  - PostgreSQL database.
  - Prisma schema and migrations.
  - Server-side validation.
  - Real authentication and protected routes.
  - Admin RBAC enforcement.
  - Immutable audit logs.
  - Real integrations for payments, WhatsApp/SMS/email, maps, storage/CDN, analytics, and monitoring.
- Do not claim the project is fully production-ready until backend persistence, security, validation, and integrations are implemented.

## End Of Day Summary - 2026-09-15

- User ended the day and explicitly asked to save every detail in `memory.md` so the project context is not lost during compaction.
- Main work focus today was the admin panel, especially production-level planning and making modules actually work with frontend mock state.
- Important standing instruction remains: do not start any new task without the user asking first. When the user gives a direct instruction, keep scope tight and implement only that request.

### Planning Created Today

- Created `docs/plans/36-admin-categories-module-plan.md`.
  - Covers category directory, add/edit category, subcategories, homepage category control, product mapping, category offers, performance, SEO, and client website impact.
  - Explains how admin category changes affect the client homepage category row, listing pages, search filters, product placement, offers, SEO metadata, and hidden categories.
- Created `docs/plans/37-admin-promotions-module-plan.md`.
  - Covers promotions overview, campaigns, placements, audience targeting, product/category mapping, coupon connections, scheduling, analytics, risk, and budget controls.
  - Explains how admin promotions connect to the client through backend APIs such as `GET /promotions/active?placement=homepage-banner`.
  - Defines the admin/backend/client flow: admin creates promotion, backend stores and filters it, client displays only active valid promotions.
- Updated planning indexes:
  - `docs/plans/README.md`
  - `codex.md`
  - `memory.md`

### Admin Suppliers Completed Today

- Route: `/suppliers`
- Main file: `apps/admin/modules/admin-console.tsx`
- Suppliers module now works as a detailed supplier operations center.
- Completed working mock-state features:
  - Directory status actions.
  - Supplier profile opening.
  - Add/edit supplier.
  - Purchase order creation.
  - Purchase order detail modal.
  - Mark PO received/delayed.
  - Supplier invoice modal.
  - Mark payment paid.
  - Stats navigation.
  - Supplier export creation and download state.
- Verified:
  - `pnpm typecheck`
  - `/suppliers` returned `200`
  - Browser tested PO open/update, invoice open, export create/download.

### Supplier Purchase Order Form Fix

- User asked why they could not type/create details in supplier "Create purchase order".
- Cause: the purchase-order modal was still a mock shortcut with only supplier summary and `Create mock PO`, not an editable form.
- Fixed in `apps/admin/modules/admin-console.tsx`:
  - `SupplierPurchaseModal` is now a real form.
  - Admin can type products, quantity, amount, delivery date, payment state, and PO status.
  - Submit creates a purchase order using typed values and sends admin to the Purchase Orders tab.
  - Supplier profile `Create purchase order` now opens the editable PO form instead of instantly creating a dummy PO.
  - PO numbering was corrected so after initial `PO-501` to `PO-504`, the next fresh PO becomes `PO-505`.
- Validation passed:
  - `pnpm typecheck`
  - `/suppliers` returned `200`
  - Browser tested typed PO creation with custom products, quantity, amount, and delivery date.

### Admin Categories Completed Today

- Route: `/categories`
- Planning file: `docs/plans/36-admin-categories-module-plan.md`
- Main files:
  - `apps/admin/modules/admin-console.tsx`
  - `apps/admin/styles/globals.css`
- Categories module now works as a storefront category control center.
- Added tabs:
  - Overview
  - Directory
  - Subcategories
  - Homepage Order
  - Product Mapping
  - Offers
  - SEO
- Expanded category data with:
  - Badge
  - Sales
  - Orders
  - Top product
  - Out-of-stock count
  - Offer text
  - Banner text
  - SEO title
  - SEO description
  - Keywords
  - Open graph image
- Completed working mock-state features:
  - Add category.
  - Edit category.
  - Open category profile.
  - Feature/unfeature.
  - Hide/activate.
  - Homepage order up/down.
  - Homepage preview open.
  - Add subcategory.
  - Move one product mapping.
  - Bulk assign all products from one source category.
  - Product mapping updates category product counts.
  - Create/toggle category offers.
  - Edit/save SEO metadata.
- Verified:
  - `pnpm typecheck`
  - `/categories` returned `200`
  - Browser tested add/edit category, profile, homepage order, feature/remove, subcategory creation, product mapping, bulk assignment, offer actions, SEO open/save.

### Admin Promotions Completed Today

- Route: `/promotions`
- Planning file: `docs/plans/37-admin-promotions-module-plan.md`
- Main files:
  - `apps/admin/modules/admin-console.tsx`
  - `apps/admin/styles/globals.css`
- Promotions module now works as a marketing control center.
- Added tabs:
  - Overview
  - Campaigns
  - Placements
  - Audience
  - Product Mapping
  - Coupons
  - Schedule
  - Analytics
  - Risk
- Expanded promotion data with:
  - Promotion type
  - Offer value
  - Coupon
  - Coupon state
  - Target URL
  - Schedule
  - Budget used
  - Views
  - Clicks
  - Conversions
  - Revenue
  - ROI
  - Discount cost
  - Risk level
  - Risk note
  - Mapped target
  - Image code
- Completed working mock-state features:
  - Create promotion.
  - Edit promotion.
  - Preview client placement.
  - Go live/pause.
  - Duplicate campaign.
  - Reorder placement priority.
  - Connect coupon.
  - Coupon state changes to `Synced`.
  - Pause linked promo from coupon tab.
  - Schedule/expire/start campaign.
  - Open analytics modal.
  - Open risk modal.
  - Approve risk.
  - Pause risky campaign.
  - Sync client action creates visible sync history events.
- Fixed promotion KPI parsing for rupee values like `Rs. 2.4L`.
- Verified:
  - `pnpm typecheck`
  - `/promotions` returned `200`
  - Browser tested create, preview, go-live, placements, coupons, schedule, analytics/risk, risk approval, client sync event creation, and coupon state changing to `Synced`.

### Current Technical State

- Admin app is running around `http://localhost:3001`.
- Client app has previously been viewed around `http://localhost:3002`.
- The project folder is not currently a Git repository, so `git status` is unavailable.
- Latest validation commands that passed today:
  - `pnpm typecheck`
  - `/usr/bin/curl -s -o /tmp/admin-suppliers-final.html -w "%{http_code}\n" http://localhost:3001/suppliers`
  - `/usr/bin/curl -s -o /tmp/admin-categories-final.html -w "%{http_code}\n" http://localhost:3001/categories`
  - `/usr/bin/curl -s -o /tmp/admin-promotions-final.html -w "%{http_code}\n" http://localhost:3001/promotions`

### Production Quality Rule Added

- New planning file: `docs/plans/38-production-quality-standard.md`
- The user repeated that the project must not be treated as a mock.
- Future client and admin work must be handled like real production work.
- No dead buttons, broken flows, placeholder-only screens, silent clicks, or obvious loopholes should remain.
- Before calling a module done, check route loading, UI quality, working interactions, feedback states, and TypeScript validation after code changes.

### Admin Production Fixes

- Fixed inventory `Add purchase entry`.
  - It now opens a real purchase-entry modal instead of silently changing the first item.
  - The modal includes supplier, received quantity, computed new stock, computed new available, threshold, batch, and expiry.
  - Invalid received quantity shows a form error.
  - Saving updates inventory totals, available stock, status, expiry, and admin notice.
- Added working global admin topbar search.
  - Search now uses real admin data across modules, orders, products, inventory, delivery, support, customers, categories, suppliers, coupons, promotions, notifications, staff, reports, and settings.
  - Typing shows route results.
  - Clicking a result navigates to the correct admin module.
  - Pressing Enter opens the best matching result.
- Removed production-facing mock language from admin auth/data labels.
- Verified after changes:
  - `pnpm typecheck`
  - All admin routes returned `200`.
  - Browser tested `/inventory` purchase entry: opened modal, saved 24 units, stock changed from 114 to 138, and item status changed to `In stock`.
  - Browser tested topbar search with `Rohan`: showed order/customer results and navigated to `/orders`.
- Fixed product admin production issues called out by user:
  - Removed duplicate `Create category` from Products because Categories is a separate admin module.
  - Replaced it with `Open categories`, which routes to `/categories`.
  - Product add/edit category field now selects from existing admin categories instead of free-typing a new category.
  - Rebuilt `Bulk status update` as a real modal with scope, product status, stock status, and audit reason.
  - Fixed bulk affected count so the notice reports the real number of updated products.
  - Browser tested `/products` bulk update: modal opened, saved, notice showed `3 products updated`, active count changed to 3, paused count changed to 0.
  - Verified with `pnpm typecheck` and admin route checks.

### Recommended Next Step For Tomorrow

- Ask the user which admin module to plan or improve next before doing anything.
- Good next options:
  - Make everything work in any remaining admin module that still feels incomplete.
  - Continue admin UI polish for professional 2026-level design.
  - Start backend planning for connecting admin modules to client data.
  - Start backend CQRS implementation only after user confirms.

## Frontend Final Handoff - 2026-09-19

### User Direction

- The user wants the client and admin panel treated like real production work, not a mock.
- Every route, button, dialog, input field, search, filter, editable form, and navigation flow should work before backend work starts.
- The client UI must feel like a premium 2026 grocery ecommerce experience, using the selected brand colors:
  - Primary: `#660b05`
  - Secondary: `#f5ca99ff`
- The user prefers rounded corners around `0.5rem`, clean spacing, professional form UI, and no AI-slop/basic-looking screens.
- The user does not want AI shopping features.

### Current App URLs

- Client app: `http://localhost:3002`
- Admin app: `http://localhost:3001`
- If an old browser tab shows an error, open a fresh tab or refresh because fresh route checks passed.

### Core Frontend Files

- Client main experience:
  - `apps/web/modules/customer/customer-experience.tsx`
- Client catalog data:
  - `apps/web/modules/catalog/data.ts`
- Client global styling:
  - `apps/web/styles/globals.css`
- Client storefront API route:
  - `apps/web/app/api/storefront/route.ts`
- Admin main console:
  - `apps/admin/modules/admin-console.tsx`
- Admin storefront API route:
  - `apps/admin/app/api/storefront/route.ts`
- Shared storefront contract:
  - `packages/utils/src/storefront.ts`
- Shared storefront server bridge:
  - `packages/utils/src/storefront-server.ts`
- Shared local bridge data file:
  - `.freshcart-store/storefront.json`

### Admin-To-Client Storefront Bridge

- A local file-backed bridge connects admin-managed storefront data to the client before the real backend is created.
- Admin publishes storefront data into `.freshcart-store/storefront.json`.
- Client reads the same storefront data through `/api/storefront`.
- This is a temporary production-style bridge for frontend validation before real backend/database integration.
- The bridge currently supports:
  - Categories
  - Promotions
  - Coupons
  - Home hero/banner content
  - Promo banner content
  - Client-facing offer placements
- Client refreshes storefront data:
  - On page focus
  - Every 8 seconds
- Both admin and client storefront routes export `dynamic = "force-dynamic"`.

### Client Storefront Connection Details

- Admin categories feed the client category rail and category pages.
- Admin promotions feed the client home hero, offer cards, and promotional placements.
- Admin coupons feed:
  - Offers page
  - Cart coupon strip
  - Footer promotion
  - Checkout coupon validation
- Checkout coupon validation now uses active storefront coupons instead of only a hardcoded coupon.
- Footer and home promotion banner read active storefront coupon/promotion/banner data.
- Client category slug support includes:
  - `/categories/fresh-produce`
  - `/categories/dairy-and-eggs`
  - `/categories/staples`
  - `/categories/beverages`
  - `/categories/bakery`
  - `/categories/frozen`
  - `/categories/household`
  - `/categories/organic`
  - `/categories/snacks`
  - `/categories/personal-care`
- Category alias is currently used until real backend category-product mapping exists:
  - `Staples` maps to `Pantry` for product filtering.
- Client updates the active category after async storefront categories load.
- Home category strip has 10 active featured categories:
  - Fresh Produce
  - Dairy And Eggs
  - Staples
  - Beverages
  - Bakery
  - Frozen
  - Household
  - Organic
  - Snacks
  - Personal Care
- Client falls back to all active categories if featured categories are fewer than 6 so the strip stays filled.

### Client Navigation And Header

- Navbar search works and redirects to `/search?q=...`.
- Recent searches were added to navbar search:
  - Uses `localStorage` key `freshcart-recent-searches`.
  - Shows up to 6 recent searches on focus.
  - Has a clear action.
  - Uses a styled dropdown with search-again rows.
- Header action order is:
  - Cart icon
  - Wishlist/heart icon
  - Account dropdown
- Cart and heart icons were changed to cleaner matching SVG icons.
- Cart and heart action buttons are visually matched.
- Cart opens a right-side drawer instead of a separate page.
- Account dropdown includes:
  - User name/email block linked to account/profile area
  - My Orders
  - Addresses
  - Account
  - Wallet & loyalty
  - Reviews
  - Products
  - Deals/Offers
  - Contact
  - Admin Panel
  - Support
  - Logout/Sign in
- Contact was added to shop/category navigation and account dropdown.

### Client Home Page

- Home hero/banner was redesigned multiple times and currently should keep the image placement unchanged.
- The unwanted left line in the home banner was removed.
- Promotion banner above footer is homepage-only.
- Promotion components have spacing above and below.
- Home strip/categories were filled with more categories.
- Offer/discount cards were reduced and styled.
- Category row includes images.
- Product cards show:
  - Product image
  - Heart/wishlist action
  - Price/details
  - Add controls
  - Product navigation
- Product card image sizing was adjusted to be taller and cleaner.
- Filter strip on home/products/categories was adjusted after user feedback to be closer to the earlier better look.

### Client Product Listing

- Products page supports production-style listing UX:
  - Search/filter behavior
  - Category browsing
  - Sort/filter-ready sections
  - Stock/offer/organic/dietary style chips
  - Empty/no-result state support
- Product card add button and quantity controls were resized and positioned according to user feedback.
- Product-card heart action exists and uses a rounded circular background.
- Product cards are intended to show 5 cards per row on desktop.

### Client Product Detail Page

- Product details page includes:
  - Large product image
  - 4 small thumbnails beside the big image
  - Clicking a thumbnail changes the big image to the exact clicked image
  - Rating stars in gold/yellow
  - Reviews and ratings
  - Customer comments
  - Add controls
  - Buy Now button
  - Similar products row
  - View all link to same category
  - Frequently bought together section
  - Nutrition/details tab/section
  - Batch and expiry information
  - Replacement policy
  - Branch/seller availability
  - Write review flow
- Similar products uses home-style product cards and should show a full 5-column style on desktop.
- Reviews/rating area was restyled repeatedly and should keep modern spacing between product details, ratings, and similar products.
- Write review was reverted once after the user disliked the redesign; preserve the preferred simpler style unless asked again.

### Client Cart

- Cart is a right-side drawer, not a separate cart page.
- Cart drawer target width is around `450px`.
- Cart design was moved toward a Zomato-style compact cart.
- Cart includes:
  - Item list
  - Quantity controls
  - Coupon/promo strip from storefront data
  - Delivery slot select
  - Cart summary at top area with white background style
  - Checkout navigation
- Quantity plus/minus uses the secondary color with reduced opacity.
- Cart icon opens the drawer.

### Client Wishlist

- Wishlist page exists and works.
- Product cards have heart icons.
- Wishlist actions include:
  - Add/remove wishlist items
  - Quick add
  - Price watch
  - Back in stock style actions
- Heart background on product cards/dropdowns should be fully rounded like a circle.
- Wishlist top image was removed after user request.

### Client Checkout

- Checkout flow exists across:
  - `/checkout/address`
  - `/checkout/delivery`
  - `/checkout/payment`
  - `/checkout/review`
  - `/checkout/failed`
  - `/checkout/confirmation/FC-10482`
- Checkout includes:
  - Saved address selection
  - Address validation style UI
  - Delivery slot selection
  - Delivery instructions
  - Payment method validation
  - Coupon input and storefront coupon validation
  - Review step
  - Order summary
  - Order confirmation summary
- Step indicator `1 2 3 4` was styled after user feedback.
- Address, delivery slot, payment, and review sections were restyled repeatedly to remove ugly static-box appearance.
- Order confirmation page is a separate page with working order summary/actions.

### Client Orders

- My Orders page exists and was added to shop/category product navigation and account dropdown.
- My Orders page includes:
  - Order history
  - Order detail navigation
  - Invoice download button
  - Reorder action
  - Cancel/order actions where applicable
  - Status and summary display
- User requested removal of refund reason/request refund note from My Orders, and it was removed.
- Buttons such as reorder and invoice should show reduced-opacity secondary hover styling.

### Client Tracking

- Tracking page was restyled.
- Premium tracking goal is Zepto/Zomato-like.
- Tracking includes:
  - Map area
  - Delivery-boy current location concept
  - Order placed/confirmed/packed/out-for-delivery style progress
  - Support navigation
- Open Support action navigates to Support page.

### Client Support And Contact

- Support page exists and was styled.
- Support interactions should work and not be static-only.
- Contact page was planned and implemented for the client, not admin.
- Contact page should include:
  - Store/contact details
  - Support channels
  - Contact form
  - Issue/category selection
  - Response SLA expectations
  - Location/service details
- Contact is linked in account dropdown and navigation/product list area.

### Client Account Area

- Account page exists at `/account`.
- Profile page exists at `/account/profile`.
- Addresses page exists at `/account/addresses`.
- Wallet/loyalty page exists at `/account/wallet`.
- Notifications preferences page exists at `/account/notifications`.
- Reviews page exists at `/reviews`.
- Serviceability page exists at `/serviceability`.
- Account area includes/editable features:
  - Profile fields
  - Saved addresses
  - Wallet/loyalty information
  - Notification preferences
  - Support tickets
  - Security/privacy preferences
  - Payment method style controls
  - Account actions
- Account name/email block in dropdown should open account/profile area.
- User specifically liked an earlier account UI better; avoid unnecessary redesign unless requested.

### Client Reviews

- Reviews page exists and was restyled.
- Review box top line was removed.
- Reviews page should include:
  - Write review flow
  - Product image support concept
  - Rating filter
  - Helpful action
  - Review list
  - Modern card layout
- The review page had multiple rounds of user feedback saying it looked ugly; keep improving with a polished production style if touched again.

### Client Serviceability

- Serviceability page exists.
- It should represent the future branch/pincode/area serviceability flow.
- Future backend should connect serviceability to branch stock and unavailable product logic.
- Current frontend should allow area/pincode style checks and show friendly serviceability status.

### Client Legal Pages

- Client legal/service pages exist:
  - `/about`
  - `/contact`
  - `/privacy`
  - `/terms`
  - `/refund-policy`
  - `/shipping-policy`
- Privacy page includes client-facing privacy policy style content.
- Terms page includes client-facing terms and conditions content.
- Refund policy page includes client-facing refund policy content.
- Delivery/shipping policy page includes client-facing delivery policy content.
- Delivery policy UI had a circle removed from boxes after user request.
- The user clarified these legal/service pages must be for client pages, not admin pages.

### Client Auth

- Login page exists.
- Login is planned for both user and admin.
- Google login was added visually/flow-wise.
- Real backend auth/session/OAuth still belongs to the backend phase.

### Client Empty, Loading, And Error States

- Planned/implemented client state coverage includes:
  - Empty cart
  - Empty wishlist
  - No search results
  - Payment failed
  - Product unavailable
  - Support offline
- These should be preserved and expanded during backend integration.

### Admin Panel Frontend Summary

- Admin is considered frontend-complete enough to move toward backend planning after final checks.
- Admin modules include:
  - Dashboard
  - Products
  - Categories
  - Orders
  - Inventory
  - Suppliers
  - Delivery
  - Support
  - Customers
  - Coupons
  - Promotions
  - Refunds & Returns
  - Finance
  - Audit Logs
  - Content Manager
  - Admin Account
  - Reviews & Ratings
  - Loyalty & Wallet
  - Branches / Store Locations
  - Integrations / System Health
  - Legal & Compliance
  - Notifications
  - Staff
  - Reports
  - Settings
  - Verify 2FA
- Admin pages were upgraded from static dialogs to editable/form-backed flows.
- Products no longer create categories directly because Categories is a separate module.
- Products use existing admin categories in add/edit flows.
- Bulk status update is a real modal with scope/status/audit reason.
- Inventory purchase entry is a real editable modal.
- Admin global search works across modules and navigates to results.
- Staff roles/permissions were updated according to the current admin panel modules.

### Client Routes Verified

- Fresh route scan returned `200 OK` for:
  - `/`
  - `/products`
  - `/products/organic-bananas`
  - `/categories`
  - `/categories/fresh-produce`
  - `/categories/dairy-and-eggs`
  - `/categories/staples`
  - `/categories/beverages`
  - `/categories/bakery`
  - `/categories/frozen`
  - `/categories/household`
  - `/categories/organic`
  - `/categories/snacks`
  - `/categories/personal-care`
  - `/offers`
  - `/wishlist`
  - `/orders`
  - `/orders/FC-10482`
  - `/support`
  - `/contact`
  - `/about`
  - `/privacy`
  - `/terms`
  - `/refund-policy`
  - `/shipping-policy`
  - `/login`
  - `/account`
  - `/account/profile`
  - `/account/addresses`
  - `/account/wallet`
  - `/account/notifications`
  - `/reviews`
  - `/serviceability`
  - `/search?q=milk`
  - `/checkout/address`
  - `/checkout/delivery`
  - `/checkout/payment`
  - `/checkout/review`
  - `/checkout/failed`
  - `/checkout/confirmation/FC-10482`
  - `/api/storefront`

### Admin Routes Verified

- Fresh route scan returned `200 OK` for:
  - `/`
  - `/login`
  - `/dashboard`
  - `/products`
  - `/categories`
  - `/orders`
  - `/inventory`
  - `/suppliers`
  - `/delivery`
  - `/support`
  - `/customers`
  - `/coupons`
  - `/promotions`
  - `/refunds`
  - `/finance`
  - `/audit-logs`
  - `/content`
  - `/account`
  - `/reviews`
  - `/loyalty`
  - `/branches`
  - `/integrations`
  - `/system-health`
  - `/legal`
  - `/notifications`
  - `/staff`
  - `/reports`
  - `/settings`
  - `/verify-2fa`
  - `/api/storefront`

### Link Fixes Completed

- Fixed admin content/client target links:
  - `/deals` changed to `/offers`
  - `/category/dairy` changed to `/categories/dairy-and-eggs`
  - `/faq` changed to `/support`
  - `/tracking` changed to `/orders/FC-10482`
  - `/checkout` changed to `/checkout/address`
- Internal link scan after fixes:
  - Client broken links: `0`
  - Admin/client-target broken links: `0`

### Browser/UI Verification

- Client account page checked at `http://localhost:3002/account`:
  - Editable inputs visible.
  - Selects visible.
  - Checkboxes visible.
  - Address fields visible.
  - Support ticket creation visible.
  - Account save controls visible.
  - Cart visible.
  - Footer visible.
  - Navigation links visible.
- Client home page checked at `http://localhost:3002/`:
  - Admin-fed home hero visible.
  - 10 category buttons visible.
  - Offers visible.
  - Product cards/actions visible.
  - Promo banner visible.
  - Footer links visible.
- Cart drawer checked:
  - Cart icon opens drawer.
  - Quantity controls visible.
  - Delivery slot select visible.
  - Coupon strip visible.
  - Summary visible.
  - Checkout link visible.
- Admin products page checked at `http://localhost:3001/products`:
  - Sidebar routes visible.
  - Search inputs visible.
  - Add product visible.
  - Bulk status visible.
  - Upload image visible.
  - Edit/Stock buttons visible.
- Admin Add Product dialog checked:
  - Product name field
  - SKU field
  - Category dropdown
  - Price field
  - Sale price field
  - Badge field
  - Cancel button
  - Save changes button
  - Category dropdown options include Fresh Produce, Dairy And Eggs, Staples, Beverages, Bakery, Frozen, Household, Organic, Snacks, Personal Care.

### Typecheck Verification

- `apps/web`: `npm run typecheck` passed.
- `apps/admin`: `npm run typecheck` passed.
- `packages/utils`: `npm run typecheck` passed.
- `packages/utils/tsconfig.json` excludes `src/storefront-server.ts` from standalone utils typecheck because it uses Node APIs.
- Apps typecheck the server bridge through route imports.

### Backend Handoff Notes

- Frontend/admin are connected through a local file-backed bridge only.
- Real backend work still needs:
  - Database schema
  - CQRS command/query structure
  - Real authentication and sessions
  - Google OAuth integration
  - Admin/user authorization and permissions enforcement
  - Real product/category/promotion/coupon APIs
  - Real cart and checkout persistence
  - Payment gateway integration
  - Invoice generation
  - Refund/return workflow APIs
  - Delivery partner/location tracking APIs
  - WhatsApp/SMS/email providers
  - Customer support chat backend
  - Image upload/storage
  - Audit logging
  - Server-side validation
  - Rate limiting/security hardening
  - Deployment configuration
- Before backend work starts, preserve the current frontend/admin behavior as the expected contract.
- Do not remove or simplify modules during backend integration unless the user explicitly asks.

## Backend Contract Alignment - 2026-10-05

- User asked to make the backend architecture/API/database plan match the current frontend before backend implementation.
- Added new planning document: `docs/plans/52-current-frontend-backend-contract-plan.md`.
- The new contract maps current client and admin routes to backend APIs, CQRS commands/queries, WebSocket needs, and database additions.
- Updated planning index and guide:
  - `docs/plans/README.md`
  - `codex.md`
- Updated backend planning docs with current frontend alignment addendums:
  - `docs/plans/14-api-cqrs-flow-plan.md`
  - `docs/plans/24-api-endpoint-details-plan.md`
  - `docs/plans/25-prisma-schema-details-plan.md`
- Fixed frontend/backend category slug alignment:
  - Final category slug: `dairy-and-eggs`, not `dairy-eggs`.
  - Final category slug: `staples`, not `pantry`.
  - Updated shared storefront defaults in `packages/utils/src/storefront.ts`.
  - Updated client catalog defaults in `apps/web/modules/catalog/data.ts`.
  - Updated category artwork and quick-link hrefs in `apps/web/modules/customer/customer-experience.tsx`.
  - Updated current bridge banner targets in `.freshcart-store/storefront.json`.
- Backend must replace current frontend local state and the file-backed storefront bridge with real persisted APIs.
- New backend contract requires explicit support for:
  - `GET /api/storefront`.
  - Admin storefront publishing endpoints.
  - Wishlist APIs.
  - Account/profile/address/wallet/loyalty/notification APIs.
  - Serviceability and branch availability APIs.
  - Contact/legal/content APIs.
  - Review image/helpful-vote APIs.
  - Order tracking/invoice/reorder/cancel/refund/return APIs.
  - Support chat and delivery tracking WebSockets.

## Backend Phases Plan - 2026-10-05

- User asked for proper backend phases and requested them to be stored in an md file.
- Added `docs/plans/53-backend-implementation-phases-plan.md`.
- Linked the new plan in:
  - `docs/plans/README.md`
  - `codex.md`
- Backend phases are now:
  1. Backend Foundation.
  2. Database Schema And Seed Data.
  3. Authentication, Sessions, And Permissions.
  4. Catalog And Storefront APIs.
  5. Cart, Wishlist, And Customer Account.
  6. Checkout And Orders.
  7. Inventory, Branches, Suppliers, And Serviceability.
  8. Admin Operations.
  9. Support Chat And Notifications.
  10. Delivery Tracking.
  11. Payments, Refunds, Wallet, And Finance.
  12. Content, Legal, Integrations, And System Health.
  13. Production Hardening.
- Recommended implementation order starts with Phase 1 through Phase 5 before external paid integrations.

## Backend Implementation Started - 2026-10-05

- User explicitly approved starting backend implementation.
- Backend stack in use:
  - NestJS API in `apps/api`.
  - Prisma ORM with PostgreSQL planned as the production database.
  - CQRS query handlers introduced for storefront/catalog reads.
  - Redis remains planned but is not configured locally yet.
- Expanded `apps/api/prisma/schema.prisma` into a production-shaped grocery ecommerce schema covering:
  - Customers, addresses, OTP, notification preferences.
  - Admin users, roles, permissions, sessions.
  - Categories, products, product variants, product images, reviews, review images, helpful votes.
  - Branches, service areas, serviceability zones.
  - Detailed inventory, batches, stock ledger, suppliers, purchase orders, supplier payments.
  - Cart, wishlist, checkout sessions, orders, order items, order status history.
  - Payments, refund/return requests.
  - Coupons, promotions, storefront placements, homepage sections, content pages, footer links.
  - Delivery slots, delivery partners, delivery assignments, live delivery location pings.
  - Support conversations/messages, contact messages, notification jobs.
  - Wallet, loyalty, search history, file assets, audit logs, system events.
- Added backend common response/error structure:
  - `apps/api/src/common/api-response.ts`
  - `apps/api/src/common/http-exception.filter.ts`
- Added health module:
  - `GET /api/health`
  - `GET /api/version`
  - Health reports degraded when PostgreSQL is not running instead of crashing the API.
- Added storefront module:
  - `GET /api/storefront`
  - Uses Prisma-backed data when DB is available.
  - Falls back to backend default storefront data when DB is unavailable or empty.
- Added catalog module:
  - `GET /api/categories`
  - `GET /api/categories/:slug`
  - `GET /api/products`
  - `GET /api/products/:slug`
  - Product list supports `category`, `search`/`q`, `in_stock`, `page`, and `limit`.
  - Uses Prisma-backed data when DB is available.
  - Falls back to backend default catalog data when DB is unavailable.
- Added seed script:
  - `apps/api/prisma/seed.cjs`
  - `pnpm --filter @freshcart/api prisma:seed`
  - Seed prepares branch, categories, frontend-aligned products, images, inventory, `FRESH20` coupon, promotion, and homepage hero placement.
- Updated API app wiring:
  - `apps/api/src/app.module.ts` imports health, storefront, and catalog modules.
  - `apps/api/src/main.ts` enables CORS for local client/admin ports and registers the global error filter.
  - `apps/api/tsconfig.json` now sets `rootDir: "src"` so Nest build output is clean.
  - `apps/api/scripts/clean-dist.cjs` runs before API builds to remove stale `dist` output and the incremental TypeScript build cache.
- Local verification completed:
  - Prisma schema validation passed.
  - Prisma client generation passed.
  - `pnpm --filter @freshcart/api typecheck` passed.
  - `pnpm --filter @freshcart/api build` passed.
  - `pnpm typecheck` passed for all 7 workspace packages.
  - `pnpm build` passed for all 7 workspace packages.
- API runtime check completed on local port `4000`:
  - `/api/version` returned `200`.
  - `/api/health` returned `200` with `status: degraded` because PostgreSQL is not running locally.
  - `/api/storefront` returned `200` using fallback backend data.
  - `/api/categories/dairy-and-eggs` returned `200`.
  - `/api/categories/staples` returned `200`.
  - `/api/products` returned `200`.
  - `/api/products?category=fresh-produce` returned `200`.
  - `/api/products/organic-bananas` returned `200`.
- Cleaned generated JavaScript artifacts from `packages/utils/src` because they confused the Next production build:
  - Removed `packages/utils/src/index.js`.
  - Removed `packages/utils/src/storefront.js`.
- Cleaned stale nested API build output; current `apps/api/dist` now emits only the active API build files.
- Important current limitation:
  - PostgreSQL is not currently running, so migrations/seeding were prepared but not applied to a live local database.
  - Next backend step should be to start/configure PostgreSQL, run Prisma migrate/seed, then implement authentication/session/RBAC APIs.

## Backend Auth And RBAC Foundation - 2026-10-05

- User approved continuing backend implementation.
- No local Docker/PostgreSQL CLI was available in the environment, so live migration/seed could not be run yet.
- Added persisted auth/session schema:
  - `CustomerSession`
  - `AdminLoginChallenge`
  - Relations from `Customer` and `AdminUser` to sessions/challenges.
  - Relation from `AdminSession` back to `AdminUser`.
- Added shared auth crypto helpers:
  - `apps/api/src/common/security/auth-crypto.ts`
  - Uses Node `crypto` scrypt password hashing, secure random bearer tokens, token hashing, numeric OTP generation, and expiry helpers.
- Added auth module:
  - `apps/api/src/modules/auth/auth.module.ts`
  - `apps/api/src/modules/auth/auth.controller.ts`
  - `apps/api/src/modules/auth/auth.service.ts`
- Auth API routes now exist:
  - `POST /api/auth/customer/request-otp`
  - `POST /api/auth/customer/verify-otp`
  - `GET /api/auth/customer/me`
  - `POST /api/auth/customer/logout`
  - `POST /api/auth/admin/login`
  - `POST /api/auth/admin/verify-2fa`
  - `GET /api/auth/admin/me`
  - `POST /api/auth/admin/logout`
  - `GET /api/auth/admin/permissions`
- Customer auth behavior:
  - Phone OTP request stores a hashed OTP.
  - OTP verify consumes the OTP, upserts customer account, creates notification preferences, wallet, loyalty account, wishlist, and customer session.
  - Local development may return `devCode`; production suppresses it.
- Admin auth behavior:
  - Admin email/password login verifies scrypt password hash.
  - If 2FA is enabled, login returns an opaque challenge token.
  - `POST /api/auth/admin/verify-2fa` consumes the challenge and creates an admin session.
  - Admin sessions are bearer-token based and stored by token hash.
  - Admin login/logout writes audit logs when DB is available.
- Seed script now creates admin RBAC foundation:
  - Owner role.
  - Permissions for every current admin module.
  - Development owner admin: `owner@freshcart.local`.
  - Default development password: `Freshcart@12345` unless `SEED_ADMIN_PASSWORD` is set.
  - 2FA is enabled for the seeded owner; local development 2FA code defaults to `123456` unless `ADMIN_DEV_2FA_CODE` is set.
- Global API error filter now maps database connection failures to:
  - HTTP `503`
  - error code `DATABASE_UNAVAILABLE`
  - message: `Database is unavailable. Start PostgreSQL and run migrations before using this endpoint.`
- Local auth route smoke checks with DB down:
  - `POST /api/auth/customer/request-otp` returns `503 SERVICE_UNAVAILABLE`.
  - `POST /api/auth/admin/login` returns `503 DATABASE_UNAVAILABLE`.
  - `GET /api/version` still returns `200`.
- Validation completed:
  - Prisma schema validation passed.
  - Prisma client generation passed.
  - `pnpm --filter @freshcart/api typecheck` passed.
  - `pnpm --filter @freshcart/api build` passed.
  - `pnpm build` passed for all 7 packages.
  - `pnpm typecheck` passed for all 7 packages when run after the build.
- Next backend step:
  - Install/start PostgreSQL, run `pnpm --filter @freshcart/api prisma:migrate`, run `pnpm --filter @freshcart/api prisma:seed`, then test the full login + 2FA + session flow against the real database.

## Local Backend Runtime Setup Attempt - 2026-10-05

- User asked to install PostgreSQL, Docker, and everything needed.
- System inspection:
  - macOS arm64.
  - Xcode Command Line Tools are installed.
  - `brew`, `docker`, `colima`, `docker-compose`, and `psql` were not available in `PATH`.
  - User is in the admin group, but passwordless sudo is not available.
- Attempted official Homebrew install in non-interactive mode:
  - Command failed because the session lacks sudo/password access to install into `/opt/homebrew`.
  - Result: `Insufficient permissions to install Homebrew to "/opt/homebrew".`
- Added project local runtime setup:
  - `docker-compose.yml` with PostgreSQL 16, Redis 7, and Meilisearch.
  - Root `.env` for local development.
  - `apps/api/.env` for Prisma/API commands.
  - Updated `.env.example` and `apps/api/.env.example` to match Compose credentials.
  - Added API env loader: `apps/api/src/common/env/load-env.ts`.
  - API now loads `.env` automatically from app/root paths.
  - Added root scripts:
    - `pnpm infra:up`
    - `pnpm infra:down`
    - `pnpm infra:logs`
    - `pnpm db:migrate`
    - `pnpm db:seed`
    - `pnpm db:studio`
  - Added setup guide: `docs/operations/local-backend-runtime.md`.
- Docker runtime remains blocked until the user installs Homebrew/Docker manually with their Mac password.
- Exact command for user to run in Terminal:
  - `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
  - Then:
    - `brew install docker docker-compose colima`
    - `colima start --cpu 2 --memory 4`
    - `cd /Users/jerinnadar/website2.0`
    - `pnpm infra:up`
    - `pnpm db:migrate`
    - `pnpm db:seed`
- Verification after project runtime setup:
  - Prisma schema validation passed and loaded env from `apps/api/.env`.
  - `pnpm --filter @freshcart/api typecheck` passed.
  - `pnpm --filter @freshcart/api build` passed.
  - `pnpm build` passed.
  - `pnpm typecheck` passed.
  - `pnpm infra:up` failed only because `docker` is not installed yet.

## Local Backend Runtime Installed And Verified - 2026-10-05

- User enabled passwordless sudo successfully.
- Installed Homebrew into `/opt/homebrew`.
- Added Homebrew shellenv to `/Users/jerinnadar/.zprofile`.
- Installed local Docker runtime tooling through Homebrew:
  - `docker`
  - `docker-compose`
  - `colima`
  - `lima`
- Configured Docker Compose plugin path in `/Users/jerinnadar/.docker/config.json`.
- Started Colima:
  - `colima start --cpu 2 --memory 4`
  - Docker context is `colima`.
- Verified Docker:
  - Docker client/server working.
  - Docker Compose working.
  - Colima running on macOS Virtualization Framework.
- Started project services with `pnpm infra:up`:
  - `freshcart-postgres`
  - `freshcart-redis`
  - `freshcart-meilisearch`
- Verified services:
  - PostgreSQL container is healthy and accepting connections.
  - Redis container is healthy.
  - Meilisearch health endpoint returned `{"status":"available"}`.
- Applied Prisma migration:
  - Migration name: `20261005070039_init_backend_schema`.
  - Migration file: `apps/api/prisma/migrations/20261005070039_init_backend_schema/migration.sql`.
  - Database is now in sync with Prisma schema.
- Seeded database with:
  - 10 categories.
  - 10 products.
  - 1 owner admin.
  - 24 admin permissions.
  - Owner role and admin role permissions.
  - Branch, inventory, coupon, promotion, storefront placement.
- Restarted API watcher after migration/seed so it picked up the real `.env`.
- API now reports:
  - `GET /api/health`: `status: ok`, `database: up`.
  - `GET /api/storefront`: reads seeded PostgreSQL data.
  - `GET /api/products?category=fresh-produce`: reads seeded PostgreSQL products.
- Real customer auth tested end-to-end:
  - Requested OTP for `+919876543210`.
  - Dev OTP code returned as `111111`.
  - Verified OTP and created customer session.
  - `GET /api/auth/customer/me` returned customer profile, notification preferences, wallet, and loyalty.
- Real admin auth tested end-to-end:
  - Login email: `owner@freshcart.local`.
  - Password: `Freshcart@12345`.
  - 2FA challenge returned.
  - Verified 2FA with code `123456`.
  - `GET /api/auth/admin/me` returned owner role and 24 permissions.
- Final verification passed:
  - `pnpm build`.
  - `pnpm typecheck`.
- API dev watcher is running on `http://localhost:4000`.
- Useful local commands now:
  - `pnpm infra:up`
  - `pnpm infra:down`
  - `pnpm infra:logs`
  - `pnpm db:migrate`
  - `pnpm db:seed`
  - `pnpm --filter @freshcart/api dev`
