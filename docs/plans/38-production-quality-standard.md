# Production Quality Standard

## User Direction

The user repeated this rule clearly:

> Again I am saying, do not treat this as mock. Treat this as real production work. I want everything to be perfect from client to admin panel without any loopholes.

## Required Working Standard

All future work on this grocery ecommerce project must be handled as production-grade work, not as a temporary mockup or throwaway demo.

This applies to both major surfaces:

- Customer website.
- Admin panel.

## What This Means

- Every visible button, link, tab, form, filter, modal, drawer, and action must either work correctly or be intentionally removed until it can work.
- No dead controls, placeholder actions, fake navigation, empty pages, broken route links, or silent clicks should remain.
- UI should be judged like a client-ready 2026 production product, not a basic sample screen.
- Admin modules should behave like real operational tools for products, stock, orders, delivery, support, customers, coupons, promotions, staff, suppliers, categories, reports, and settings.
- Customer pages should feel complete, polished, responsive, and trustworthy across home, category, product details, wishlist, cart, checkout, tracking, support, login, and account flows.
- Any planned production dependency, such as backend APIs, auth, payments, maps, notifications, chat, or WhatsApp/SMS/email integrations, should be clearly marked until implemented.
- Before saying a feature is done, it should be checked for route loading, visible UI quality, working interactions, and obvious edge cases.

## Definition Of Done

A module is only considered done when:

- The route loads successfully.
- The layout is polished and responsive.
- Primary and secondary actions work.
- Forms accept user input and give clear feedback.
- State changes are visible to the user.
- Empty, loading, success, error, and edge states are considered where relevant.
- The module follows the approved primary color `#660b05` and secondary color `#f5ca99ff` without looking flat or unfinished.
- There are no obvious loopholes, dead ends, or mock-only labels in the user-facing experience.
- TypeScript validation passes after code changes.

## Development Reminder

Do not rush features just to make screens look filled. The project should keep moving toward a real production grocery ecommerce platform with client-ready customer and admin experiences.
