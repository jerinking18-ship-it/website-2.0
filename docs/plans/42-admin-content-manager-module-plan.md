# Admin Content Manager Module Plan

## Purpose

The Content Manager module should let the store owner control customer-facing website content without touching code. It should manage homepage content, banners, static pages, media, SEO, announcements, navigation, schedules, and content rules.

This module is important because it becomes the bridge between the admin panel and the client website. Admin changes should later flow into the client website through backend APIs, database records, cache revalidation, and a preview/publish workflow.

## Recommended Tabs

- Overview
- Homepage
- Banners
- Pages
- Media Library
- SEO
- Announcements
- Navigation
- Content Schedule
- Settings

## Client Website Connection

Content Manager should be connected with the client website in production.

Expected flow:

- Admin creates or edits content in Content Manager.
- Backend saves the content in the database.
- Client website reads content from APIs or server queries.
- Client website updates homepage, banners, pages, SEO, navigation, announcements, and footer automatically.

Examples:

- Admin changes homepage hero banner -> client homepage hero changes.
- Admin adds promotion banner -> client homepage, footer, or category banner shows it.
- Admin changes category image/title -> client category row updates.
- Admin edits Privacy Policy -> client privacy page updates.
- Admin adds announcement -> client site shows top alert or promo strip.
- Admin updates SEO title/meta -> client page metadata changes.
- Admin hides nav link -> client navbar/footer updates.

Frontend-first stage:

- The admin UI can begin with editable local state.
- Every button and form should work visibly.
- Later, backend/CQRS APIs and database persistence will make the content permanent and connected to the client app.

Production connection requirements:

- Database tables for content entries.
- CQRS commands and queries.
- Client-facing content APIs.
- Cache revalidation after publish.
- Image/media storage.
- Preview before publish.
- Draft, approval, schedule, publish, pause, archive workflow.

## Overview

The overview should show content health and quick actions.

Metrics:

- Live homepage sections.
- Active banners.
- Scheduled content.
- Draft content.
- SEO issues.
- Missing images.
- Expiring banners.
- Recently updated pages.
- Most clicked banner.
- Content awaiting approval.

Useful actions:

- Create banner.
- Edit homepage.
- Upload media.
- Create page.
- Schedule content.
- Run SEO check.
- Open content awaiting approval.

## Homepage

The homepage tab should control all homepage sections.

Manageable sections:

- Hero banner.
- Promotion banner.
- Category row.
- Featured products.
- Similar products row.
- Deals section.
- Delivery promise strip.
- Footer promotion banner.
- Testimonials/reviews.
- Seasonal campaign area.

Each section should include:

- Section ID.
- Section type.
- Title.
- Subtitle.
- Image.
- CTA text.
- CTA link.
- Placement/order.
- Visibility toggle.
- Start date.
- End date.
- Target audience.
- Status.
- Last updated by.

Section statuses:

- Draft.
- Live.
- Scheduled.
- Paused.
- Archived.

Primary actions:

- Open section.
- Edit content.
- Reorder section.
- Show/hide section.
- Schedule section.
- Publish section.
- Pause section.
- Preview section.

## Banners

The banners tab should manage all marketing and promotional banners across the client website.

Fields:

- Banner ID.
- Banner title.
- Placement.
- Desktop image.
- Mobile image.
- CTA label.
- CTA URL.
- Discount code link.
- Background color.
- Text color.
- Start date.
- End date.
- Status.
- Views.
- Clicks.
- Conversions.
- Owner.

Banner placements:

- Home hero.
- Promo strip.
- Category page.
- Product detail.
- Checkout.
- Footer.
- Account page.
- Support page.

Primary actions:

- Create banner.
- Edit banner.
- Duplicate banner.
- Pause/resume banner.
- Preview banner.
- Delete/archive banner.
- Schedule banner.
- Link banner to coupon or promotion.

## Pages

The pages tab should manage static and informational pages.

Recommended pages:

- About.
- Contact.
- FAQ.
- Privacy Policy.
- Terms & Conditions.
- Refund Policy.
- Shipping Policy.
- Store Locations.
- Careers.
- Blog/articles later if needed.

Fields:

- Page ID.
- Page title.
- Slug.
- Meta title.
- Meta description.
- Content body.
- Hero image.
- Status.
- Last updated.
- Author.
- Approval status.
- SEO score.

Primary actions:

- Create page.
- Edit page.
- Preview page.
- Publish page.
- Unpublish page.
- Save draft.
- Request approval.
- Archive page.

## Media Library

The media library should store reusable images and files.

Fields:

- Media ID.
- File name.
- File type.
- Category.
- Alt text.
- Used in.
- Uploaded by.
- Upload date.
- File size.
- Dimensions.
- Status.
- URL.

Primary actions:

- Upload media.
- Edit alt text.
- Replace file.
- Delete/archive media.
- Copy URL.
- Preview media.
- Filter unused media.
- Mark media approved.

## SEO

The SEO tab should control search and social metadata.

SEO areas:

- Homepage SEO.
- Category SEO.
- Product SEO.
- Static page SEO.
- Open Graph image.
- Sitemap visibility.

Fields:

- SEO record ID.
- Page/module.
- Slug.
- Meta title.
- Meta description.
- Keywords.
- Canonical URL.
- Robots setting.
- Open Graph title.
- Open Graph description.
- Open Graph image.
- Sitemap enabled.
- SEO score.

SEO checks:

- Missing meta title.
- Meta description too long.
- Missing alt text.
- Duplicate slug.
- Missing OG image.
- Low content length.
- Broken CTA link.
- Missing canonical URL.

Primary actions:

- Open SEO record.
- Edit SEO fields.
- Run SEO check.
- Fix issue.
- Preview search snippet.
- Preview social card.
- Publish SEO changes.

## Announcements

Announcements should manage store-wide customer messages.

Examples:

- Free delivery announcement.
- Weather delay alert.
- Festival sale message.
- Stock delay message.
- Service area notice.
- App/banner notice.

Fields:

- Announcement ID.
- Announcement title.
- Message.
- Placement.
- Icon/type.
- CTA label.
- CTA URL.
- Audience.
- Start date.
- End date.
- Status.
- Priority.

Primary actions:

- Create announcement.
- Edit announcement.
- Pause/resume announcement.
- Schedule announcement.
- Preview announcement.
- Archive announcement.

## Navigation

The navigation tab should manage customer website menus.

Areas:

- Header navigation links.
- Footer links.
- Category menu order.
- Mobile menu.
- Account dropdown links.
- Support links.

Fields:

- Navigation item ID.
- Label.
- URL.
- Icon.
- Parent menu.
- Order.
- Visibility.
- Role/audience.
- Status.

Primary actions:

- Add link.
- Edit link.
- Reorder links.
- Hide/show link.
- Validate link.
- Open linked page.

## Content Schedule

The content schedule should show planned and expiring content.

Items:

- Scheduled banners.
- Scheduled announcements.
- Scheduled homepage changes.
- Campaign start/end dates.
- Expiring content.
- Approval deadlines.

Fields:

- Schedule ID.
- Content type.
- Content title.
- Start date.
- End date.
- Status.
- Owner.
- Approval state.

Primary actions:

- Open scheduled item.
- Reschedule.
- Publish now.
- Pause.
- Archive expired content.
- Request approval.

## Settings

Content settings should control publishing rules and media standards.

Settings:

- Require approval before publish.
- Require image alt text.
- Auto-archive expired banners.
- Owner approval for homepage hero.
- SEO checks before publish.
- Allowed media file types.
- Max upload size.
- Default Open Graph image.
- Brand tone guidelines.
- Footer legal content owner.
- Preview URL.
- Revalidation mode.

Primary actions:

- Save content settings.
- Reset recommended defaults.
- Run content health check.
- Test client preview.

## Filters And Search

Filters should work for:

- Content type.
- Status.
- Placement.
- Audience.
- Owner.
- Date range.
- Approval state.
- SEO issue level.
- Media type.

Search should find:

- Banner title.
- Page slug.
- Media file name.
- SEO record.
- Announcement title.
- Navigation label.
- CTA URL.
- Content ID.

## Production UI Requirements

The Content Manager module should follow the admin production quality rule:

- No dead buttons.
- No static-only dialogs.
- Every content detail should have editable forms.
- Every action should update visible state.
- Search should work.
- Filters should work.
- Preview actions should provide visible preview state.
- Publish/pause/archive actions should update status.
- Schedule actions should update schedule state.
- Settings should save visible state.
- Dialogs should use the same admin input style as other modules.
- The first UI can use frontend state, but it should be ready to connect to backend persistence.

## CQRS Backend Plan

Future commands:

- `CreateContentSectionCommand`
- `UpdateContentSectionCommand`
- `PublishContentSectionCommand`
- `PauseContentSectionCommand`
- `ArchiveContentSectionCommand`
- `ReorderHomepageSectionsCommand`
- `CreateBannerCommand`
- `UpdateBannerCommand`
- `DuplicateBannerCommand`
- `ScheduleBannerCommand`
- `CreatePageCommand`
- `UpdatePageCommand`
- `PublishPageCommand`
- `ArchivePageCommand`
- `UploadMediaCommand`
- `UpdateMediaMetadataCommand`
- `ReplaceMediaFileCommand`
- `ArchiveMediaCommand`
- `UpdateSeoRecordCommand`
- `RunSeoCheckCommand`
- `CreateAnnouncementCommand`
- `UpdateAnnouncementCommand`
- `ScheduleAnnouncementCommand`
- `UpdateNavigationItemCommand`
- `ReorderNavigationItemsCommand`
- `UpdateContentSettingsCommand`
- `RevalidateClientContentCommand`

Future queries:

- `GetContentDashboardQuery`
- `ListHomepageSectionsQuery`
- `ListBannersQuery`
- `GetBannerDetailQuery`
- `ListPagesQuery`
- `GetPageDetailQuery`
- `ListMediaAssetsQuery`
- `ListSeoRecordsQuery`
- `ListAnnouncementsQuery`
- `ListNavigationItemsQuery`
- `ListContentScheduleQuery`
- `GetContentSettingsQuery`
- `GetClientContentQuery`

Future events:

- `ContentSectionCreated`
- `ContentSectionUpdated`
- `ContentSectionPublished`
- `ContentSectionPaused`
- `ContentSectionArchived`
- `HomepageSectionsReordered`
- `BannerCreated`
- `BannerUpdated`
- `BannerScheduled`
- `PageCreated`
- `PagePublished`
- `MediaUploaded`
- `MediaMetadataUpdated`
- `SeoRecordUpdated`
- `SeoCheckCompleted`
- `AnnouncementCreated`
- `AnnouncementScheduled`
- `NavigationItemUpdated`
- `ContentSettingsUpdated`
- `ClientContentRevalidated`

## Recommended First Build Scope

For the first frontend admin implementation, build:

- Sidebar navigation item: `Content`.
- Route: `/content`.
- Overview dashboard with content health.
- Homepage section manager.
- Banner manager.
- Pages manager.
- Media library.
- SEO manager.
- Announcements manager.
- Navigation manager.
- Content schedule.
- Settings form.
- Editable dialogs for each content type.
- Working search/filter state.
- Working publish, pause, archive, preview, duplicate, and schedule actions.

This will let the client manage the customer-facing website professionally without needing a developer for every banner, page, SEO change, navigation update, or homepage edit.
