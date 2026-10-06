# Admin Categories Module Plan

## Goal

Create a production-level category management module for the admin panel. Categories should not be only a static list. They should control how grocery categories appear on the customer website, how products are grouped, how category offers work, and how category pages perform in search.

## Admin Panel Features

### Category Directory

The admin should be able to view and manage all categories from one table or card list.

Each category should show:

- Category name.
- Category image or icon.
- URL slug.
- Parent category.
- Product count.
- Active, hidden, scheduled, draft, or archived status.
- Featured category state.
- Homepage display order.

### Add And Edit Category

Admin should be able to create and update categories with:

- Category name.
- Category image upload.
- Parent category selection.
- URL slug.
- SEO title.
- SEO description.
- Search keywords.
- Display order.
- Visibility status.
- Featured category toggle.

### Subcategories

Categories should support parent-child grouping so grocery browsing feels professional.

Examples:

- Fruits And Vegetables
  - Fresh Fruits
  - Leafy Vegetables
  - Exotic Vegetables
- Dairy
  - Milk
  - Cheese
  - Curd
- Pantry
  - Rice
  - Atta
  - Dal

### Homepage Category Control

Admin should control what appears in the customer homepage category row.

Required controls:

- Feature or unfeature category.
- Reorder homepage categories.
- Add category badges such as Popular, Seasonal, Fresh, Best Seller, or Organic.
- Preview how categories will appear on the client homepage.

### Product Mapping

Admin should be able to manage which products belong to each category.

Required controls:

- View all products inside a category.
- Move products from one category to another.
- Bulk assign products to a category.
- Show uncategorized products.
- Detect empty categories.
- Detect hidden categories that still contain active products.

### Category Offers

Admin should be able to attach campaigns and coupons to a category.

Examples:

- 20% off Fruits.
- Fresh Dairy Deals.
- Weekend Snacks Offer.
- Organic Picks Sale.

Required controls:

- Attach coupon to category.
- Add category banner.
- Schedule category offer.
- Pause or activate category offer.

### Category Performance

Admin should see how each category performs.

Useful metrics:

- Total sales per category.
- Total orders per category.
- Conversion rate.
- Top products in category.
- Low-performing categories.
- Out-of-stock product count.
- Category return or refund issues.

### Category SEO

Each category should control its own SEO fields.

Required fields:

- Meta title.
- Meta description.
- URL slug.
- Search keywords.
- Open graph image.
- Canonical URL if needed.

## Recommended Tabs

The category module should use these tabs:

- Overview.
- Directory.
- Subcategories.
- Homepage Order.
- Product Mapping.
- Offers.
- SEO.

## Client Website Impact

Admin category changes should directly affect the customer website.

### Homepage Category Row

Featured categories and display order from admin should control the category row on the homepage.

If the admin changes the image, label, badge, or order, the homepage should update automatically.

### Product Listing Pages

If admin edits a category name, image, slug, or status, the client category page should update automatically.

If a category is hidden, the category page should not be visible to customers.

### Search And Filters

Categories and subcategories from admin should appear as filters in:

- Search results.
- Product listing pages.
- Category pages.
- Offer pages.

### Product Cards And Product Placement

If products are moved between categories in admin, they should show under the new category on the customer website.

This affects:

- Product listing pages.
- Category rails.
- Similar products.
- Search filters.
- Offer collections.

### Category Offers

Category-level offers from admin should show on the client website as:

- Category banners.
- Product badges.
- Offer rails.
- Coupon messaging.
- Cart savings messages when applicable.

### SEO Pages

Category SEO fields from admin should control:

- Browser page title.
- Meta description.
- Category URL slug.
- Social share preview image.
- Search keywords.

### Hidden Categories

If admin hides a category, it should disappear from:

- Homepage category row.
- Navigation menus.
- Search filters.
- Product listing pages.
- Category URLs.

Products inside hidden categories should either move to another visible category or stay searchable only if they also belong to another active category.

## Recommendation

Build Categories as a real control center for the client storefront. The admin should decide what categories customers see, how they are ordered, which products belong inside them, what offers are attached, and how each category page appears in search.
