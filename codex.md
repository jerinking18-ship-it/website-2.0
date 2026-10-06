# Codex Project Guide

This file gathers the planning documents for the grocery website project into one central guide.

## Important Working Rule

Do not start a new task or make project changes unless the user asks first.

## Production Quality Rule

The user repeated that this project must not be treated as a mock or disposable demo. All client and admin work must be handled like real production work, with no dead buttons, broken flows, placeholder-only screens, silent clicks, or obvious loopholes.

The full rule lives in [Production Quality Standard](./docs/plans/38-production-quality-standard.md).

## Approved Architecture Direction

The user approved a production direction that includes:

- CQRS architecture.
- Customer support chatbox.
- Admin support inbox for support agents.
- Next.js frontend.
- NestJS backend.
- PostgreSQL database.
- Prisma ORM.
- Redis for cache, realtime support, and queues.
- WebSockets for live customer support communication.

## AI Scope Decision

The user does not want AI shopping features in the first production version. AI shopping should be treated as future optional only, and no active first-build routes, modules, database tables, or UI should depend on it.

## Approved Admin Panel Direction

The user also requested an admin panel.

Planned admin areas:

- Dashboard.
- Product management.
- Order management.
- Inventory management.
- Customer management.
- Coupons and offers.
- Delivery slots.
- Support inbox.
- Settings.

## Approved Modular Architecture Direction

The user requested different modules for everything, including product pages, search results, checkout, admin dashboard, and all major feature areas.

The project should be organized into separate modules for:

- Customer website features.
- Admin panel features.
- Backend CQRS domains.
- Shared UI and types.

The full module plan lives in [Modular Architecture Plan](./docs/plans/10-modular-architecture-plan.md).

## Created Project Foundation

The monorepo foundation has been created with:

- `apps/web`
- `apps/admin`
- `apps/api`
- `packages/ui`
- `packages/types`
- `packages/config`
- `packages/utils`

Dependencies have not been installed yet. Do not install dependencies, start servers, or continue implementation unless the user approves the next step.

## Source Planning Files

- [Project Overview](./docs/plans/01-project-overview.md)
- [Website Pages And User Flow](./docs/plans/02-pages-and-user-flow.md)
- [Feature Plan](./docs/plans/03-feature-plan.md)
- [Design And Brand Direction](./docs/plans/04-design-and-brand-direction.md)
- [Product Catalog And Content Plan](./docs/plans/05-product-catalog-and-content-plan.md)
- [Technical Architecture](./docs/plans/06-technical-architecture.md)
- [Development Roadmap](./docs/plans/07-development-roadmap.md)
- [Deployment And Launch Plan](./docs/plans/08-deployment-and-launch-plan.md)
- [Client Questions](./docs/plans/09-client-questions.md)
- [Modular Architecture Plan](./docs/plans/10-modular-architecture-plan.md)
- [Production Scope Plan](./docs/plans/11-production-scope-plan.md)
- [Database Schema Plan](./docs/plans/12-database-schema-plan.md)
- [Frontend Routes Plan](./docs/plans/13-frontend-routes-plan.md)
- [API And CQRS Flow Plan](./docs/plans/14-api-cqrs-flow-plan.md)
- [Design System Plan](./docs/plans/15-design-system-plan.md)
- [Authentication And Roles Plan](./docs/plans/16-authentication-and-roles-plan.md)
- [Order And Checkout Flow Plan](./docs/plans/17-order-and-checkout-flow-plan.md)
- [Support Chat Flow Plan](./docs/plans/18-support-chat-flow-plan.md)
- [Notifications Plan](./docs/plans/19-notifications-plan.md)
- [Inventory And Supplier Management Plan](./docs/plans/20-inventory-and-supplier-management-plan.md)
- [Delivery And Fulfillment Plan](./docs/plans/21-delivery-and-fulfillment-plan.md)
- [Admin Panel Detailed Screens Plan](./docs/plans/22-admin-panel-detailed-screens-plan.md)
- [Customer Website Detailed Screens Plan](./docs/plans/23-customer-website-detailed-screens-plan.md)
- [API Endpoint Details Plan](./docs/plans/24-api-endpoint-details-plan.md)
- [Prisma Schema Details Plan](./docs/plans/25-prisma-schema-details-plan.md)
- [Project Folder Structure Plan](./docs/plans/26-project-folder-structure-plan.md)
- [Testing And QA Strategy Plan](./docs/plans/27-testing-and-qa-strategy-plan.md)
- [Deployment And DevOps Strategy Plan](./docs/plans/28-deployment-and-devops-strategy-plan.md)
- [Development Milestones And Timeline Plan](./docs/plans/29-development-milestones-and-timeline-plan.md)
- [Coupons And Promotions Plan](./docs/plans/30-coupons-and-promotions-plan.md)
- [Admin Notifications Module Plan](./docs/plans/31-admin-notifications-plan.md)
- [Admin Staff Module Plan](./docs/plans/32-admin-staff-module-plan.md)
- [Admin Settings Module Plan](./docs/plans/33-admin-settings-module-plan.md)
- [Admin Reports Module Plan](./docs/plans/34-admin-reports-module-plan.md)
- [Admin Suppliers Module Plan](./docs/plans/35-admin-suppliers-module-plan.md)
- [Admin Categories Module Plan](./docs/plans/36-admin-categories-module-plan.md)
- [Admin Promotions Module Plan](./docs/plans/37-admin-promotions-module-plan.md)
- [Production Quality Standard](./docs/plans/38-production-quality-standard.md)
- [Admin Refunds And Returns Module Plan](./docs/plans/39-admin-refunds-returns-module-plan.md)
- [Admin Finance Module Plan](./docs/plans/40-admin-finance-module-plan.md)
- [Admin Audit Logs Module Plan](./docs/plans/41-admin-audit-logs-module-plan.md)
- [Admin Content Manager Module Plan](./docs/plans/42-admin-content-manager-module-plan.md)
- [Admin Account Module Plan](./docs/plans/43-admin-account-module-plan.md)
- [Admin Reviews And Ratings Module Plan](./docs/plans/44-admin-reviews-ratings-module-plan.md)
- [Admin Loyalty And Wallet Module Plan](./docs/plans/45-admin-loyalty-wallet-module-plan.md)
- [Admin Store Locations And Branches Module Plan](./docs/plans/46-admin-store-locations-branches-module-plan.md)
- [Admin Integrations Module Plan](./docs/plans/47-admin-integrations-module-plan.md)
- [Admin System Health Module Plan](./docs/plans/48-admin-system-health-module-plan.md)
- [Admin Legal And Compliance Module Plan](./docs/plans/49-admin-legal-compliance-module-plan.md)
- [Admin Production Readiness Gap Plan](./docs/plans/50-admin-production-readiness-gap-plan.md)
- [Client Production Completion Plan](./docs/plans/51-client-production-completion-plan.md)
- [Current Frontend Backend Contract Plan](./docs/plans/52-current-frontend-backend-contract-plan.md)
- [Backend Implementation Phases Plan](./docs/plans/53-backend-implementation-phases-plan.md)

---

# 1. Project Overview

## Goal

Create a top-level grocery website for a client that feels modern, premium, fast, and trustworthy. The website should let customers browse groceries, discover offers, build a cart, select delivery options, and move toward checkout with minimal friction.

## Working Brand Placeholder

FreshCart Market

This name is temporary. It can be replaced once the client provides the final brand name.

## Target Audience

- Busy families who want fast weekly grocery delivery.
- Working professionals who reorder essentials often.
- Health-conscious shoppers looking for fresh produce and curated staples.
- Local customers who want dependable delivery slots and clear pricing.

## Product Positioning

The site should feel like a premium grocery service: fresh, organized, fast, and easy to trust. It should avoid looking like a generic template or simple food landing page.

## Primary Customer Promise

Fresh groceries, smart deals, and reliable delivery in one clean shopping experience.

## Success Criteria

- Customers can understand the store and start shopping immediately.
- Products are easy to search, filter, compare, and add to cart.
- The cart and delivery flow feel realistic enough for client review.
- The website looks polished on mobile, tablet, and desktop.
- The project is structured so real products, payments, and backend features can be added later.

---

# 2. Website Pages And User Flow

## Main Pages

### Home And Shopping Page

The first screen should immediately show the shopping experience, not just a marketing hero. It should include:

- Search bar.
- Delivery location or delivery promise.
- Category navigation.
- Featured grocery products.
- Cart access.
- Current deals or savings.

### Product Listing Area

Customers should be able to browse products by:

- Fresh produce.
- Dairy and eggs.
- Bakery.
- Pantry.
- Beverages.
- Frozen foods.
- Household essentials.
- Organic picks.

### Product Details

Each product should show:

- Product name.
- Price.
- Unit size.
- Category.
- Rating or popularity signal.
- Availability.
- Add to cart button.
- Optional tags such as organic, local, bestseller, or express delivery.

### Cart

The cart should include:

- Product quantity controls.
- Item subtotal.
- Delivery fee.
- Savings.
- Estimated total.
- Suggested add-ons.
- Checkout button.

### Checkout Preview

For the first version, checkout can be a polished front-end flow with:

- Customer details.
- Delivery address.
- Delivery slot.
- Payment method placeholder.
- Order summary.
- Confirmation state.

### About Or Trust Section

This should support credibility without becoming the main experience:

- Freshness guarantee.
- Delivery standards.
- Local supplier message.
- Customer support promise.

### Contact Or Support

Include:

- Contact form placeholder.
- Support email placeholder.
- Delivery area information.
- FAQ items.

## Primary User Flow

1. Customer lands on the website.
2. Customer searches or selects a category.
3. Customer adds products to cart.
4. Customer adjusts quantities.
5. Customer selects a delivery slot.
6. Customer reviews total.
7. Customer continues to checkout.
8. Customer sees a confirmation state.

---

# 3. Feature Plan

## Core Features For Version 1

### Product Search

Search should filter visible products instantly by name, category, and tags.

### Category Filters

Customers should be able to switch between grocery categories quickly.

### Smart Cart

The cart should update in real time when customers add, remove, or change product quantities.

### Delivery Slot Selection

Customers should be able to choose a delivery window such as:

- Today, 6 PM - 8 PM.
- Tomorrow, 8 AM - 10 AM.
- Tomorrow, 6 PM - 8 PM.

### Deals And Savings

The website should show current offers and calculate visible savings where possible.

### Product Badges

Use badges for meaningful shopping cues:

- Organic.
- Local.
- Bestseller.
- Express.
- New.
- Limited stock.

### Recommended Add-Ons

The cart can suggest common add-ons based on grocery shopping behavior.

### Mobile Shopping Experience

Mobile must be treated as a primary experience. The cart, search, filters, and checkout should be easy to use with one hand.

## Modern 2026 Features To Consider

### Future Optional AI Shopping Assistant

AI shopping is not part of the first production version. A future version can include an assistant that helps users build a cart from prompts like "weekly breakfast groceries for a family of four" only if approved later.

### Personalized Reordering

Returning customers can reorder weekly essentials.

### Smart Substitutions

If an item is unavailable, the site can suggest similar products.

### Voice Search

Customers can search products by voice on supported devices.

### Diet And Lifestyle Filters

Filters can include vegan, gluten-free, keto, organic, low-sugar, and high-protein.

### Subscription Essentials

Customers can subscribe to recurring items such as milk, eggs, bread, and produce boxes.

### Real-Time Delivery Tracking

A production version can show order status and delivery tracking.

## Not In Version 1 Unless Requested

- Real payment processing.
- Real inventory management.
- Real customer accounts.
- Admin dashboard.
- Driver tracking.
- Supplier management.

---

# 4. Design And Brand Direction

## Design Goal

The website should feel premium, fresh, fast, and trustworthy. It should look suitable for a serious client presentation, not like a basic template.

## Visual Direction

Use a clean grocery-commerce interface with strong product browsing, calm spacing, and vivid fresh-food accents.

## Suggested Palette

- Deep forest green for trust and freshness.
- Crisp white for cleanliness.
- Charcoal for readable text.
- Tomato red for offers and urgent deals.
- Citrus yellow for highlights.
- Soft mint or pale green for quiet background areas.

## Typography

Use a modern sans-serif type system with:

- Strong headings.
- Readable body text.
- Clear product names.
- Compact cart and product metadata.

## Layout Principles

- Shopping controls should appear early.
- Product cards should be easy to scan.
- Cart should stay accessible.
- Use clean sections rather than oversized marketing blocks.
- Avoid decorative clutter.

## Visual Assets

The site should use high-quality grocery imagery, especially for:

- Hero produce scene.
- Product or category visuals.
- Freshness and delivery trust sections.

## Interaction Style

- Buttons should feel responsive and confident.
- Cart updates should be immediate.
- Filters should not reload the page.
- Checkout steps should feel simple and guided.

## Accessibility Direction

- Text should be readable on mobile and desktop.
- Buttons should have clear labels.
- Keyboard navigation should work for interactive controls.
- Color should not be the only way to understand status.

---

# 5. Product Catalog And Content Plan

## Starter Product Categories

- Fresh Produce
- Dairy And Eggs
- Bakery
- Pantry
- Beverages
- Frozen
- Household
- Organic

## Starter Product Fields

Each product should include:

- ID
- Name
- Category
- Price
- Original price when discounted
- Unit size
- Image or visual treatment
- Tags
- Rating
- Stock status
- Delivery eligibility

## Example Products

- Organic Bananas
- Roma Tomatoes
- Hass Avocados
- Farm Eggs
- Whole Milk
- Sourdough Bread
- Greek Yogurt
- Brown Rice
- Cold Brew Coffee
- Sparkling Water
- Frozen Berries
- Olive Oil

## Content Tone

Use clear customer-first copy:

- Short labels.
- Useful product details.
- No exaggerated claims.
- No filler marketing lines.

## Client Content Needed Later

- Final business name.
- Logo.
- Brand colors.
- Real product categories.
- Real product list and pricing.
- Delivery areas.
- Support email and phone number.
- Refund and freshness policy.
- Payment methods.
- Legal pages.

---

# 6. Technical Architecture

## Version 1 Recommendation

Start with a fast static front-end website that includes realistic shopping interactions using browser-side JavaScript.

This keeps the first client-ready version fast to build, easy to deploy, and easy to review.

## Initial Stack

- HTML
- CSS
- JavaScript
- Static assets
- Local browser state for cart behavior

## Why Start Static

- Faster first version.
- Lower deployment complexity.
- Easy client preview.
- No backend cost at the beginning.
- Simple to upgrade later.

## Future Production Stack Options

If the client wants a full operational grocery platform, future phases can add:

- Product database.
- Admin dashboard.
- Customer accounts.
- Inventory management.
- Payment gateway.
- Order management.
- Delivery management.
- Email and SMS notifications.

## Data Strategy

Version 1 can use an in-code product list. Later versions can move product data to:

- A database.
- A CMS.
- Airtable.
- Google Sheets.
- A custom admin panel.

## Payment Strategy

Version 1 should use a checkout preview. Production checkout can integrate:

- Stripe.
- Razorpay.
- Cash on delivery.
- UPI.
- Card payments.

## Deployment Strategy

The first version should be deployed as a private preview. After client approval, it can be moved to a custom domain.

---

# 7. Development Roadmap

## Phase 1: Planning

- Confirm client goals.
- Confirm brand name.
- Confirm required pages.
- Confirm product categories.
- Confirm launch timeline.

## Phase 2: First Website Build

- Create project structure.
- Build home and shopping page.
- Add product catalog.
- Add search and filters.
- Add cart behavior.
- Add delivery slot selection.
- Add checkout preview.
- Make layout responsive.

## Phase 3: Polish

- Improve product card design.
- Add final imagery.
- Refine mobile experience.
- Add animations and interaction states.
- Improve copy and trust messaging.

## Phase 4: Client Review

- Share preview link.
- Collect feedback.
- Update brand details.
- Update products and prices.
- Fix content issues.

## Phase 5: Deployment

- Build production version.
- Deploy private preview.
- Connect custom domain if requested.
- Prepare handoff notes.

## Phase 6: Future Enhancements

- Customer accounts.
- Real checkout.
- Admin panel.
- Inventory system.
- Optional AI shopping assistant, only if approved later.
- Delivery tracking.
- Loyalty program.

---

# 8. Deployment And Launch Plan

## Deployment Goal

Deploy a professional grocery website that the client can review on a live URL.

## First Deployment

The first deployment should be a private preview so the client can approve design, content, and shopping flow before public launch.

## Pre-Launch Checklist

- Website builds successfully.
- Main shopping flow works.
- Cart updates correctly.
- Checkout preview works.
- Mobile layout works.
- Product prices are correct.
- Contact details are correct.
- Delivery policy is correct.
- Images load properly.
- No placeholder text remains unless approved.

## Launch Checklist

- Connect final domain.
- Confirm SSL is active.
- Confirm analytics if needed.
- Confirm contact form destination.
- Confirm legal pages.
- Confirm payment setup if real checkout is included.
- Confirm support email and phone.

## Post-Launch Checklist

- Test ordering flow.
- Check mobile performance.
- Review customer feedback.
- Monitor broken links.
- Update products and offers.
- Plan phase 2 features.

## Domain Plan

Possible domain examples:

- clientbrand.com
- shopclientbrand.com
- clientbrandmarket.com

The final domain should be chosen by the client.

---

# 9. Client Questions

Use these questions before final development or before replacing placeholder content.

## Brand

1. What is the final business name?
2. Do you already have a logo?
3. Do you have brand colors?
4. Should the website feel premium, budget-friendly, organic, local, or family-focused?

## Products

1. How many products should be listed at launch?
2. What are the main grocery categories?
3. Do you have product photos?
4. Do prices include taxes?
5. Should discounts and offers be shown?

## Delivery

1. Which cities or areas do you deliver to?
2. What are the delivery charges?
3. Is there free delivery above a certain cart amount?
4. What delivery slots are available?
5. Do you support same-day delivery?

## Checkout

1. Should the first version include real payments?
2. Which payment methods do you want?
3. Do you support cash on delivery?
4. Do customers need accounts to order?

## Business Operations

1. Who will update products and prices?
2. Do you need an admin dashboard?
3. Do you need inventory tracking?
4. Do you need order notifications by email, WhatsApp, or SMS?

## Launch

1. Do you already own a domain?
2. Should the site be public immediately or private for review first?
3. What is the target launch date?
4. Who approves the final website?
