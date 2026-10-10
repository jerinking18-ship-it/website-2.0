import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import {
  AdminStatus,
  DeliveryAssignmentStatus,
  DiscountType,
  FulfillmentStatus,
  NotificationChannel,
  NotificationStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  ProductStatus,
  PromotionStatus,
  RefundStatus,
  SupportConversationStatus
} from "@prisma/client";
import { hashToken } from "../../common/security/auth-crypto";
import { MediaStorageService } from "../../common/media/media-storage.service";
import { SearchIndexService } from "../../common/search/search-index.service";
import { PrismaService } from "../../database/prisma.service";

type BodyRecord = Record<string, unknown>;
type AdminWithPermissions = Prisma.AdminUserGetPayload<{
  include: {
    roles: {
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true;
              };
            };
          };
        };
      };
    };
  };
}>;

const rupee = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const adminStatePermissionByPrefix: Record<string, string | undefined> = {
  account: undefined,
  audit: "audit.read",
  branches: "branches.manage",
  categories: "categories.manage",
  content: "content.manage",
  coupons: "coupons.manage",
  customers: "customers.manage",
  dashboard: "dashboard.read",
  delivery: "delivery.manage",
  finance: "finance.manage",
  inventory: "inventory.manage",
  legal: "legal.manage",
  loyalty: "loyalty.manage",
  notifications: "notifications.manage",
  orders: "orders.manage",
  products: "products.manage",
  promotions: "promotions.manage",
  refunds: "refunds.manage",
  reports: "reports.read",
  reviews: "reviews.manage",
  settings: "settings.manage",
  staff: "staff.manage",
  suppliers: "suppliers.manage",
  support: "support.manage"
};

@Injectable()
export class AdminService {
  constructor(
    private readonly mediaStorage: MediaStorageService,
    private readonly searchIndex: SearchIndexService,
    private readonly prisma: PrismaService
  ) {}

  async getAdminState(authorization: string | undefined, key: string) {
    const admin = await this.requireAdmin(authorization, this.permissionForAdminState(key));
    const routedState = await this.readRoutedAdminState(key, admin.id);
    if (routedState.handled) {
      return { key, state: routedState.state, updatedAt: new Date().toISOString(), source: routedState.source };
    }

    const normalizedKey = this.normalizeStateKey(key);
    const record = await this.prisma.adminState.findUnique({ where: { key: normalizedKey } });
    return { key, state: record?.payload ?? null, updatedAt: record?.updatedAt?.toISOString() ?? null, source: "adminState" };
  }

  async saveAdminState(authorization: string | undefined, key: string, input: unknown) {
    const admin = await this.requireAdmin(authorization, this.permissionForAdminState(key));
    const body = this.asRecord(input);
    const state = body.state ?? body;
    const routedState = await this.writeRoutedAdminState(admin.id, key, state);
    if (routedState.handled) {
      return { key, state: routedState.state, updatedAt: new Date().toISOString(), source: routedState.source };
    }

    const normalizedKey = this.normalizeStateKey(key);
    const record = await this.prisma.adminState.upsert({
      where: { key: normalizedKey },
      update: { payload: state as Prisma.InputJsonValue },
      create: {
        key: normalizedKey,
        payload: state as Prisma.InputJsonValue
      }
    });
    await this.recordAudit(admin.id, "ADMIN_STATE_SAVED", "AdminState", record.id, { key });
    return { key, state: record.payload, updatedAt: record.updatedAt.toISOString() };
  }

  async processNotifications(authorization: string | undefined, input: unknown) {
    const admin = await this.requireAdmin(authorization, "notifications.manage");
    const body = this.asRecord(input);
    const ids = this.arrayStrings(body.ids);
    const limit = Math.min(Math.max(this.integerFromInput(body.limit) || 25, 1), 100);
    const now = new Date();
    const jobs = await this.prisma.notificationJob.findMany({
      where: ids.length
        ? { id: { in: ids } }
        : {
            status: { in: [NotificationStatus.QUEUED, NotificationStatus.PROCESSING, NotificationStatus.FAILED] },
            OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }]
          },
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
      take: ids.length ? ids.length : limit
    });
    const results = [];
    for (const job of jobs) results.push(await this.dispatchNotificationJob(job.id));
    await this.recordAudit(admin.id, "NOTIFICATIONS_PROCESSED", "NotificationJob", undefined, {
      processed: results.length,
      sent: results.filter((result) => result.status === "SENT").length,
      failed: results.filter((result) => result.status === "FAILED").length
    });
    return {
      processed: results.length,
      sent: results.filter((result) => result.status === "SENT").length,
      failed: results.filter((result) => result.status === "FAILED").length,
      notifications: await this.listNotificationState(),
      failures: await this.listNotificationFailureState()
    };
  }

  async sendNotification(authorization: string | undefined, id: string) {
    const admin = await this.requireAdmin(authorization, "notifications.manage");
    const result = await this.dispatchNotificationJob(id);
    await this.recordAudit(admin.id, "NOTIFICATION_SENT_MANUALLY", "NotificationJob", id, result);
    return {
      result,
      notifications: await this.listNotificationState(),
      failures: await this.listNotificationFailureState()
    };
  }

  async reindexSearch(authorization: string | undefined) {
    const admin = await this.requireAdmin(authorization, "products.manage");
    const result = await this.searchIndex.reindexAll();
    await this.recordAudit(admin.id, "SEARCH_REINDEXED", "SearchIndex", undefined, result);
    return result;
  }

  async listProducts(authorization?: string) {
    await this.requireAdmin(authorization, "products.manage");
    const products = await this.prisma.product.findMany({
      where: { deletedAt: null },
      include: { category: true, images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } },
      orderBy: { updatedAt: "desc" }
    });
    return { products: products.map((product) => this.toAdminProduct(product)) };
  }

  async createProduct(authorization: string | undefined, input: unknown) {
    const admin = await this.requireAdmin(authorization, "products.manage");
    const body = this.asRecord(input);
    const name = this.requiredString(body.name, "Product name");
    const sku = this.requiredString(body.sku, "SKU").toUpperCase();
    const categoryId = await this.resolveCategoryId(body.categoryId, body.category, body.categorySlug);
    const slug = this.slugify(this.optionalString(body.slug) || name);
    const price = this.moneyFromInput(body.price, "Price");
    const salePrice = this.optionalMoneyFromInput(body.sale ?? body.salePrice);

    const product = await this.prisma.product.create({
      data: {
        name,
        sku,
        slug: await this.uniqueSlug("product", slug),
        categoryId,
        unit: this.optionalString(body.unit) || "1 unit",
        description: this.optionalString(body.description) || `FreshCart grocery item: ${name}.`,
        price,
        salePrice,
        badge: this.optionalString(body.badge) || null,
        status: this.toProductStatus(body.status),
        stockStatus: this.toInventoryStatus(body.stock),
        supplierName: this.optionalString(body.supplierName) || null,
        tags: this.csvList(body.tags),
        dietaryTags: this.csvList(body.dietaryTags)
      },
      include: { category: true, images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } }
    });
    await this.syncProductImage(product.id, body.imageFile ?? body.imageUrl);
    const savedProduct = await this.findProductWithRelations(product.id);
    await this.searchIndex.syncProduct(savedProduct.id);
    await this.recordAudit(admin.id, "PRODUCT_CREATED", "Product", product.id, { sku });
    return { product: this.toAdminProduct(savedProduct) };
  }

  async updateProduct(authorization: string | undefined, id: string, input: unknown) {
    const admin = await this.requireAdmin(authorization, "products.manage");
    const body = this.asRecord(input);
    const current = await this.findProduct(id);
    const categoryId =
      body.categoryId || body.category || body.categorySlug
        ? await this.resolveCategoryId(body.categoryId, body.category, body.categorySlug)
        : current.categoryId;

    const product = await this.prisma.product.update({
      where: { id: current.id },
      data: {
        name: this.optionalString(body.name) ?? current.name,
        sku: (this.optionalString(body.sku) || current.sku).toUpperCase(),
        categoryId,
        unit: this.optionalString(body.unit) ?? current.unit,
        description: this.optionalString(body.description) ?? current.description,
        price: body.price === undefined ? current.price : this.moneyFromInput(body.price, "Price"),
        salePrice: body.sale === undefined && body.salePrice === undefined ? current.salePrice : this.optionalMoneyFromInput(body.sale ?? body.salePrice),
        badge: this.optionalString(body.badge) ?? current.badge,
        status: body.status === undefined ? current.status : this.toProductStatus(body.status),
        stockStatus: body.stock === undefined ? current.stockStatus : this.toInventoryStatus(body.stock),
        supplierName: this.optionalString(body.supplierName) ?? current.supplierName,
        tags: body.tags === undefined ? current.tags : this.csvList(body.tags),
        dietaryTags: body.dietaryTags === undefined ? current.dietaryTags : this.csvList(body.dietaryTags)
      },
      include: { category: true, images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } }
    });
    await this.syncProductImage(product.id, body.imageFile ?? body.imageUrl);
    const savedProduct = await this.findProductWithRelations(product.id);
    await this.searchIndex.syncProduct(savedProduct.id);
    await this.recordAudit(admin.id, "PRODUCT_UPDATED", "Product", product.id, { sku: product.sku });
    return { product: this.toAdminProduct(savedProduct) };
  }

  async bulkUpdateProducts(authorization: string | undefined, input: unknown) {
    const admin = await this.requireAdmin(authorization, "products.bulk-status");
    const body = this.asRecord(input);
    const skus = Array.isArray(body.skus) ? body.skus.map(String).filter(Boolean) : [];
    const status = body.status === undefined ? undefined : this.toProductStatus(body.status);
    const stockStatus = body.stock === undefined || body.stock === "Keep current" ? undefined : this.toInventoryStatus(body.stock);
    const data: Prisma.ProductUpdateManyMutationInput = {};
    if (status) data.status = status;
    if (stockStatus) data.stockStatus = stockStatus;
    if (skus.length === 0) throw new BadRequestException("Select at least one product for the bulk update.");
    if (Object.keys(data).length === 0) throw new BadRequestException("Select a product status or stock state to update.");

    const result = await this.prisma.product.updateMany({
      where: { sku: { in: skus }, deletedAt: null },
      data
    });
    const products = await this.prisma.product.findMany({ where: { sku: { in: skus }, deletedAt: null }, select: { id: true } });
    await Promise.all(products.map((product) => this.searchIndex.syncProduct(product.id)));
    await this.recordAudit(admin.id, "PRODUCT_BULK_STATUS_UPDATED", "Product", undefined, { count: result.count });
    return { updated: result.count };
  }

  async listCategories(authorization?: string) {
    await this.requireAdmin(authorization, "categories.manage");
    const categories = await this.prisma.category.findMany({
      where: { deletedAt: null },
      include: { _count: { select: { products: true } }, products: { take: 1, orderBy: { updatedAt: "desc" } } },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }]
    });
    return { categories: categories.map((category) => this.toAdminCategory(category)) };
  }

  async createCategory(authorization: string | undefined, input: unknown) {
    const admin = await this.requireAdmin(authorization, "categories.manage");
    const body = this.asRecord(input);
    const name = this.requiredString(body.name, "Category name");
    const slug = await this.uniqueSlug("category", this.slugify(this.optionalString(body.slug) || name));
    const category = await this.prisma.category.create({
      data: {
        name,
        slug,
        note: this.optionalString(body.banner) || this.optionalString(body.note) || null,
        image: (await this.mediaStorage.storeImage(body.image, "categories")) || null,
        status: this.toCategoryStatus(body.status),
        featured: this.booleanFromInput(body.featured),
        sortOrder: Number(body.order) || 0,
        seoTitle: this.optionalString(body.seoTitle) || `${name} Online`,
        seoDescription: this.optionalString(body.seoDescription) || `Shop ${name} online with fast grocery delivery.`
      },
      include: { _count: { select: { products: true } }, products: { take: 1, orderBy: { updatedAt: "desc" } } }
    });
    await this.searchIndex.syncCategory(category.id);
    await this.recordAudit(admin.id, "CATEGORY_CREATED", "Category", category.id);
    return { category: this.toAdminCategory(category) };
  }

  async updateCategory(authorization: string | undefined, id: string, input: unknown) {
    const admin = await this.requireAdmin(authorization, "categories.manage");
    const body = this.asRecord(input);
    const current = await this.findCategory(id);
    const category = await this.prisma.category.update({
      where: { id: current.id },
      data: {
        name: this.optionalString(body.name) ?? current.name,
        slug: this.optionalString(body.slug) ?? current.slug,
        note: this.optionalString(body.banner) ?? this.optionalString(body.note) ?? current.note,
        image: body.image === undefined ? current.image : (await this.mediaStorage.storeImage(body.image, "categories")) || current.image,
        status: body.status === undefined ? current.status : this.toCategoryStatus(body.status),
        featured: body.featured === undefined ? current.featured : this.booleanFromInput(body.featured),
        sortOrder: Number(body.order) || current.sortOrder,
        seoTitle: this.optionalString(body.seoTitle) ?? current.seoTitle,
        seoDescription: this.optionalString(body.seoDescription) ?? current.seoDescription
      },
      include: { _count: { select: { products: true } }, products: { take: 1, orderBy: { updatedAt: "desc" } } }
    });
    await this.searchIndex.syncCategory(category.id);
    const products = await this.prisma.product.findMany({ where: { categoryId: category.id, deletedAt: null }, select: { id: true } });
    await Promise.all(products.map((product) => this.searchIndex.syncProduct(product.id)));
    await this.recordAudit(admin.id, "CATEGORY_UPDATED", "Category", category.id);
    return { category: this.toAdminCategory(category) };
  }

  async deleteCategory(authorization: string | undefined, id: string) {
    const admin = await this.requireAdmin(authorization, "categories.manage");
    const category = await this.findCategory(id);
    const productCount = await this.prisma.product.count({ where: { categoryId: category.id, deletedAt: null } });
    if (productCount > 0) throw new BadRequestException("Move or remove products before deleting this category.");

    await this.prisma.category.update({
      where: { id: category.id },
      data: {
        deletedAt: new Date(),
        featured: false,
        status: ProductStatus.INACTIVE
      }
    });
    await this.searchIndex.syncCategory(category.id);
    await this.recordAudit(admin.id, "CATEGORY_DELETED", "Category", category.id);
    return { deleted: true, id: category.id };
  }

  async listCoupons(authorization?: string) {
    await this.requireAdmin(authorization, "coupons.manage");
    const coupons = await this.prisma.coupon.findMany({ orderBy: [{ status: "asc" }, { updatedAt: "desc" }] });
    return { coupons: coupons.map((coupon) => this.toAdminCoupon(coupon)) };
  }

  async createCoupon(authorization: string | undefined, input: unknown) {
    const admin = await this.requireAdmin(authorization, "coupons.manage");
    const body = this.asRecord(input);
    const code = this.requiredString(body.code, "Coupon code").toUpperCase();
    const coupon = await this.prisma.coupon.create({
      data: {
        code,
        campaign: this.requiredString(body.campaign, "Campaign"),
        discountType: this.toDiscountType(body.type),
        value: this.moneyFromInput(body.value, "Discount value"),
        minCart: this.optionalMoneyFromInput(body.minCart),
        maxDiscount: this.optionalMoneyFromInput(body.maxDiscount),
        status: this.toPromotionStatus(body.status),
        segment: this.optionalString(body.segment) || "All customers",
        startsAt: this.optionalDate(body.startsAt),
        endsAt: this.optionalDate(body.endsAt)
      }
    });
    await this.recordAudit(admin.id, "COUPON_CREATED", "Coupon", coupon.id, { code });
    return { coupon: this.toAdminCoupon(coupon) };
  }

  async updateCoupon(authorization: string | undefined, code: string, input: unknown) {
    const admin = await this.requireAdmin(authorization, "coupons.manage");
    const body = this.asRecord(input);
    const current = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!current) throw new NotFoundException("Coupon was not found.");
    const coupon = await this.prisma.coupon.update({
      where: { id: current.id },
      data: {
        code: this.optionalString(body.code)?.toUpperCase() ?? current.code,
        campaign: this.optionalString(body.campaign) ?? current.campaign,
        discountType: body.type === undefined ? current.discountType : this.toDiscountType(body.type),
        value: body.value === undefined ? current.value : this.moneyFromInput(body.value, "Discount value"),
        minCart: body.minCart === undefined ? current.minCart : this.optionalMoneyFromInput(body.minCart),
        maxDiscount: body.maxDiscount === undefined ? current.maxDiscount : this.optionalMoneyFromInput(body.maxDiscount),
        status: body.status === undefined ? current.status : this.toPromotionStatus(body.status),
        segment: this.optionalString(body.segment) ?? current.segment,
        startsAt: body.startsAt === undefined ? current.startsAt : this.optionalDate(body.startsAt),
        endsAt: body.endsAt === undefined ? current.endsAt : this.optionalDate(body.endsAt)
      }
    });
    await this.recordAudit(admin.id, "COUPON_UPDATED", "Coupon", coupon.id, { code: coupon.code });
    return { coupon: this.toAdminCoupon(coupon) };
  }

  async listPromotions(authorization?: string) {
    await this.requireAdmin(authorization, "promotions.manage");
    const promotions = await this.prisma.promotion.findMany({ include: { coupon: true }, orderBy: [{ priority: "asc" }, { updatedAt: "desc" }] });
    return { promotions: promotions.map((promotion) => this.toAdminPromotion(promotion)) };
  }

  async createPromotion(authorization: string | undefined, input: unknown) {
    const admin = await this.requireAdmin(authorization, "promotions.manage");
    const body = this.asRecord(input);
    const coupon = await this.resolveCoupon(body.coupon);
    const promotion = await this.prisma.promotion.create({
      data: {
        title: this.requiredString(body.title, "Promotion title"),
        type: this.optionalString(body.type) || "Homepage banner",
        placement: this.optionalString(body.placement) || "Homepage hero",
        audience: this.optionalString(body.audience) || "All customers",
        status: this.toPromotionStatus(body.status),
        priority: Number(body.priority) || 0,
        cta: this.optionalString(body.cta) || "Shop now",
        targetUrl: this.optionalString(body.targetUrl) || "/products",
        valueLabel: this.optionalString(body.value) || "Offer",
        mappedTo: this.optionalString(body.mappedTo) || "Storefront",
        startsAt: this.optionalDate(body.startsAt),
        endsAt: this.optionalDate(body.endsAt),
        couponId: coupon?.id
      },
      include: { coupon: true }
    });
    await this.recordAudit(admin.id, "PROMOTION_CREATED", "Promotion", promotion.id);
    return { promotion: this.toAdminPromotion(promotion) };
  }

  async updatePromotion(authorization: string | undefined, id: string, input: unknown) {
    const admin = await this.requireAdmin(authorization, "promotions.manage");
    const body = this.asRecord(input);
    const current = await this.prisma.promotion.findFirst({ where: { OR: [{ id }, { title: id }] } });
    if (!current) throw new NotFoundException("Promotion was not found.");
    const coupon = body.coupon === undefined ? undefined : await this.resolveCoupon(body.coupon);
    const promotion = await this.prisma.promotion.update({
      where: { id: current.id },
      data: {
        title: this.optionalString(body.title) ?? current.title,
        type: this.optionalString(body.type) ?? current.type,
        placement: this.optionalString(body.placement) ?? current.placement,
        audience: this.optionalString(body.audience) ?? current.audience,
        status: body.status === undefined ? current.status : this.toPromotionStatus(body.status),
        priority: Number(body.priority) || current.priority,
        cta: this.optionalString(body.cta) ?? current.cta,
        targetUrl: this.optionalString(body.targetUrl) ?? current.targetUrl,
        valueLabel: this.optionalString(body.value) ?? current.valueLabel,
        mappedTo: this.optionalString(body.mappedTo) ?? current.mappedTo,
        startsAt: body.startsAt === undefined ? current.startsAt : this.optionalDate(body.startsAt),
        endsAt: body.endsAt === undefined ? current.endsAt : this.optionalDate(body.endsAt),
        couponId: body.coupon === undefined ? current.couponId : coupon?.id ?? null
      },
      include: { coupon: true }
    });
    await this.recordAudit(admin.id, "PROMOTION_UPDATED", "Promotion", promotion.id);
    return { promotion: this.toAdminPromotion(promotion) };
  }

  async listCouponBanners(authorization?: string) {
    await this.requireAdmin(authorization, "coupons.manage");
    const banners = await this.prisma.storefrontPlacement.findMany({
      where: { placement: { in: ["Homepage hero", "Category banner", "Cart banner", "Footer banner"] } },
      orderBy: [{ priority: "asc" }, { updatedAt: "desc" }]
    });
    return { banners: banners.map((banner) => this.toAdminBanner(banner)) };
  }

  async createCouponBanner(authorization: string | undefined, input: unknown) {
    const admin = await this.requireAdmin(authorization, "coupons.manage");
    const body = this.asRecord(input);
    const banner = await this.prisma.storefrontPlacement.create({
      data: {
        key: this.slugify(`${this.optionalString(body.placement) || "banner"}-${Date.now()}`),
        title: this.requiredString(body.title, "Banner title"),
        placement: this.optionalString(body.placement) || "Homepage hero",
        status: this.toPromotionStatus(body.status),
        priority: Number(body.priority) || 0,
        payload: {
          audience: this.optionalString(body.audience) || "All customers",
          cta: this.optionalString(body.cta) || "Shop now",
          target: this.optionalString(body.target) || "/products",
          image: await this.mediaStorage.storeImage(body.image, "banners")
        }
      }
    });
    await this.recordAudit(admin.id, "COUPON_BANNER_CREATED", "StorefrontPlacement", banner.id);
    return { banner: this.toAdminBanner(banner) };
  }

  async updateCouponBanner(authorization: string | undefined, id: string, input: unknown) {
    const admin = await this.requireAdmin(authorization, "coupons.manage");
    const body = this.asRecord(input);
    const current = await this.prisma.storefrontPlacement.findFirst({ where: { OR: [{ id }, { title: id }] } });
    if (!current) throw new NotFoundException("Coupon banner was not found.");
    const payload = current.payload && typeof current.payload === "object" && !Array.isArray(current.payload) ? current.payload : {};
    const banner = await this.prisma.storefrontPlacement.update({
      where: { id: current.id },
      data: {
        title: this.optionalString(body.title) ?? current.title,
        placement: this.optionalString(body.placement) ?? current.placement,
        status: body.status === undefined ? current.status : this.toPromotionStatus(body.status),
        priority: Number(body.priority) || current.priority,
        payload: {
          ...payload,
          audience: this.optionalString(body.audience) ?? this.readPayload(current.payload, "audience", "All customers"),
          cta: this.optionalString(body.cta) ?? this.readPayload(current.payload, "cta", "Shop now"),
          target: this.optionalString(body.target) ?? this.readPayload(current.payload, "target", "/products"),
          image: body.image === undefined ? this.readPayload(current.payload, "image", "") : await this.mediaStorage.storeImage(body.image, "banners")
        }
      }
    });
    await this.recordAudit(admin.id, "COUPON_BANNER_UPDATED", "StorefrontPlacement", banner.id);
    return { banner: this.toAdminBanner(banner) };
  }

  private async requireAdmin(authorization?: string, permissionKey?: string) {
    const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";
    if (!token) throw new UnauthorizedException("Bearer token is required.");
    const session = await this.prisma.adminSession.findFirst({
      where: { tokenHash: hashToken(token), revokedAt: null, expiresAt: { gt: new Date() } },
      include: {
        adminUser: {
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    if (!session || session.adminUser.status !== "ACTIVE") throw new UnauthorizedException("Admin session is invalid or expired.");
    if (permissionKey && !this.hasAdminPermission(session.adminUser, permissionKey)) {
      throw new ForbiddenException(`Admin permission is required: ${permissionKey}`);
    }
    return session.adminUser;
  }

  private hasAdminPermission(admin: AdminWithPermissions, permissionKey: string) {
    return admin.roles.some(({ role }) => role.name === "Owner" || role.permissions.some(({ permission }) => permission.key === permissionKey || permission.key === "*"));
  }

  private async assertAdminPermission(adminUserId: string, permissionKey: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminUserId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });
    if (!admin || admin.status !== AdminStatus.ACTIVE) throw new UnauthorizedException("Admin session is invalid or expired.");
    if (!this.hasAdminPermission(admin, permissionKey)) {
      throw new ForbiddenException(`Admin permission is required: ${permissionKey}`);
    }
  }

  private permissionForAdminState(key: string) {
    const prefix = this.normalizeStateKey(key).split(":")[0] || "";
    return adminStatePermissionByPrefix[prefix] ?? "settings.manage";
  }

  private async recordAudit(adminUserId: string, action: string, resourceType: string, resourceId?: string, metadata?: Prisma.InputJsonValue) {
    await this.prisma.adminAuditLog.create({ data: { adminUserId, action, resourceType, resourceId, metadata } });
  }

  private async findProduct(id: string) {
    const product = await this.prisma.product.findFirst({ where: { OR: [{ id }, { sku: id }, { slug: id }] } });
    if (!product) throw new NotFoundException("Product was not found.");
    return product;
  }

  private async findProductWithRelations(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } }
    });
    if (!product) throw new NotFoundException("Product was not found.");
    return product;
  }

  private async syncProductImage(productId: string, value: unknown) {
    const url = await this.mediaStorage.storeImage(value, "products");
    if (!url) return;
    await this.prisma.productImage.deleteMany({ where: { productId } });
    await this.prisma.productImage.create({
      data: {
        productId,
        url,
        altText: "Product image",
        sortOrder: 0,
        isPrimary: true
      }
    });
  }

  private async findCategory(id: string) {
    const category = await this.prisma.category.findFirst({ where: { deletedAt: null, OR: [{ id }, { slug: id }] } });
    if (!category) throw new NotFoundException("Category was not found.");
    return category;
  }

  private async resolveCategoryId(categoryId: unknown, categoryName: unknown, categorySlug: unknown) {
    const rawId = this.optionalString(categoryId);
    if (rawId) return (await this.findCategory(rawId)).id;
    const slug = this.optionalString(categorySlug) || this.slugify(this.optionalString(categoryName) || "");
    if (!slug) throw new BadRequestException("Category is required.");
    return (await this.findCategory(slug)).id;
  }

  private async resolveCoupon(value: unknown) {
    const code = this.optionalString(value)?.toUpperCase();
    if (!code || code === "NOCOUPON") return null;
    return this.prisma.coupon.findUnique({ where: { code } });
  }

  private toAdminProduct(product: Prisma.ProductGetPayload<{ include: { category: true; images: true } }>) {
    const sale = product.salePrice ? `Rs. ${rupee.format(Number(product.salePrice))}` : "-";
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      sku: product.sku,
      category: product.category.name,
      categorySlug: product.category.slug,
      price: `Rs. ${rupee.format(Number(product.price))}`,
      sale,
      stock: this.fromInventoryStatus(product.stockStatus),
      status: this.fromProductStatus(product.status),
      badge: product.badge ?? "Fresh",
      imageFile: product.images[0]?.url ?? ""
    };
  }

  private toAdminCategory(
    category: Prisma.CategoryGetPayload<{ include: { _count: { select: { products: true } }; products: { take: 1; orderBy: { updatedAt: "desc" } } } }>
  ) {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      parent: "Root",
      products: category._count.products,
      image: category.image ?? "",
      status: this.fromProductStatus(category.status) === "Paused" ? "Hidden" : this.fromProductStatus(category.status),
      featured: category.featured,
      order: category.sortOrder,
      badge: category.featured ? "Featured" : "Fresh",
      sales: "Rs. 0",
      orders: 0,
      topProduct: category.products[0]?.name ?? "No top product yet",
      outOfStock: 0,
      offer: category.note ?? "No offer attached",
      banner: category.note ?? `${category.name} collection`,
      seoTitle: category.seoTitle ?? `${category.name} Online`,
      seoDescription: category.seoDescription ?? `Shop ${category.name} online with fast grocery delivery.`,
      keywords: category.name.toLowerCase(),
      ogImage: `${category.slug}-og.jpg`
    };
  }

  private toAdminCoupon(coupon: Prisma.CouponGetPayload<object>) {
    return {
      code: coupon.code,
      campaign: coupon.campaign,
      type: coupon.discountType === "PERCENTAGE" ? "Percent" : coupon.discountType === "FREE_DELIVERY" ? "Free delivery" : "Flat",
      value: coupon.discountType === "PERCENTAGE" ? `${Number(coupon.value)}%` : coupon.discountType === "FREE_DELIVERY" ? "Delivery" : `Rs. ${rupee.format(Number(coupon.value))}`,
      minCart: coupon.minCart ? `Rs. ${rupee.format(Number(coupon.minCart))}` : "No minimum",
      maxDiscount: coupon.maxDiscount ? `Rs. ${rupee.format(Number(coupon.maxDiscount))}` : "No cap",
      usage: 0,
      limit: 1000,
      segment: coupon.segment ?? "All customers",
      status: this.fromPromotionStatus(coupon.status) as "Active" | "Scheduled" | "Paused" | "Expired",
      valid: this.formatValidity(coupon.startsAt, coupon.endsAt),
      revenue: "Rs. 0",
      risk: "Healthy"
    };
  }

  private toAdminPromotion(promotion: Prisma.PromotionGetPayload<{ include: { coupon: true } }>) {
    return {
      id: promotion.id,
      title: promotion.title,
      type: promotion.type,
      placement: promotion.placement,
      audience: promotion.audience,
      status: this.fromPromotionStatus(promotion.status),
      priority: promotion.priority,
      cta: promotion.cta ?? "Shop now",
      budget: "Rs. 0",
      budgetUsed: "Rs. 0",
      value: promotion.valueLabel ?? promotion.coupon?.code ?? "Offer",
      coupon: promotion.coupon?.code ?? "NOCOUPON",
      couponState: promotion.couponId ? "Connected" : "Needs setup",
      targetUrl: promotion.targetUrl ?? "/products",
      startsAt: this.dateLabel(promotion.startsAt),
      endsAt: this.dateLabel(promotion.endsAt),
      views: 0,
      clicks: 0,
      conversions: 0,
      revenue: "Rs. 0",
      roi: "-",
      discountCost: "Rs. 0",
      risk: "Low",
      riskNote: "Connected to backend promotion controls.",
      mappedTo: promotion.mappedTo ?? "Storefront",
      image: promotion.title.slice(0, 2).toUpperCase()
    };
  }

  private toAdminBanner(banner: Prisma.StorefrontPlacementGetPayload<object>) {
    return {
      id: banner.id,
      title: banner.title,
      placement: banner.placement,
      audience: this.readPayload(banner.payload, "audience", "All customers"),
      cta: this.readPayload(banner.payload, "cta", "Shop now"),
      target: this.readPayload(banner.payload, "target", "/products"),
      image: this.readPayload(banner.payload, "image", ""),
      status: this.fromPromotionStatus(banner.status),
      priority: banner.priority
    };
  }

  private async readRoutedAdminState(key: string, adminUserId?: string): Promise<{ handled: boolean; source?: string; state?: unknown }> {
    if (key === "products:catalog") return { handled: true, source: "products", state: await this.listProductCatalogState() };
    if (key === "categories:items") return { handled: true, source: "categories", state: await this.listCategoryItemsState() };
    if (key === "categories:mappings") return { handled: true, source: "categoryProductMappings", state: await this.listCategoryMappingState() };
    if (key === "categories:offers") return { handled: true, source: "categoryOfferPlacements", state: await this.listCategoryOfferState() };
    if (key === "coupons:list") return { handled: true, source: "coupons", state: await this.listCouponState() };
    if (key === "coupons:banners") return { handled: true, source: "storefrontPlacements", state: await this.listCouponBannerState() };
    if (key === "promotions:items") return { handled: true, source: "promotions", state: await this.listPromotionState() };
    if (key === "promotions:sync-events") return { handled: true, source: "promotionSyncEventRecords", state: await this.listPromotionSyncEventState() };
    if (key === "orders:queue") return { handled: true, source: "orders", state: await this.listOrderQueueState() };
    if (key === "inventory:stock-items") return { handled: true, source: "inventoryItems", state: await this.listInventoryState() };
    if (key === "delivery:queue") return { handled: true, source: "deliveryAssignments", state: await this.listDeliveryState() };
    if (key === "support:queue") return { handled: true, source: "supportConversations", state: await this.listSupportState() };
    if (key === "customers:list") return { handled: true, source: "customers", state: await this.listCustomerState() };
    if (key === "suppliers:items") return { handled: true, source: "suppliers", state: await this.listSupplierState() };
    if (key === "suppliers:purchase-orders") return { handled: true, source: "purchaseOrders", state: await this.listPurchaseOrderState() };
    if (key === "suppliers:payments") return { handled: true, source: "supplierPayments", state: await this.listSupplierPaymentState() };
    if (key === "suppliers:exports") return { handled: true, source: "supplierExportRecords", state: await this.listSupplierExportState() };
    if (key === "refunds:requests") return { handled: true, source: "refundRequests", state: await this.listRefundState() };
    if (key === "refunds:returns") return { handled: true, source: "refundReturnPickups", state: await this.listRefundReturnState() };
    if (key === "refunds:rules") return { handled: true, source: "refundApprovalRules", state: await this.listRefundRuleState() };
    if (key === "refunds:settings") return { handled: true, source: "refundSettings", state: await this.getRefundSettingsState() };
    if (key === "finance:payments") return { handled: true, source: "payments", state: await this.listFinancePaymentState() };
    if (key === "finance:cod-collections") return { handled: true, source: "financeCodCollections", state: await this.listFinanceCodState() };
    if (key === "finance:refunds") return { handled: true, source: "refundRequests", state: await this.listFinanceRefundState() };
    if (key === "finance:settlements") return { handled: true, source: "financeSettlements", state: await this.listFinanceSettlementState() };
    if (key === "finance:expenses") return { handled: true, source: "financeExpenses", state: await this.listFinanceExpenseState() };
    if (key === "finance:invoices") return { handled: true, source: "financeInvoices", state: await this.listFinanceInvoiceState() };
    if (key === "finance:reports") return { handled: true, source: "financeReportExports", state: await this.listFinanceReportState() };
    if (key === "finance:tax-settings") return { handled: true, source: "financeTaxSettings", state: await this.getFinanceTaxSettingsState() };
    if (key === "notifications:items") return { handled: true, source: "notificationJobs", state: await this.listNotificationState() };
    if (key === "notifications:failures") return { handled: true, source: "notificationFailures", state: await this.listNotificationFailureState() };
    if (key === "notifications:automation-rules") return { handled: true, source: "notificationAutomationRules", state: await this.listNotificationAutomationRuleState() };
    if (key === "content:items") return { handled: true, source: "contentPages", state: await this.listContentState() };
    if (key === "content:settings") return { handled: true, source: "systemSettings", state: await this.getSystemSettingState(key) };
    if (key === "staff:team:v2") return { handled: true, source: "adminUsers", state: await this.listStaffState() };
    if (key === "staff:roles:v2") return { handled: true, source: "adminRoles", state: await this.listStaffRoleState() };
    if (key === "staff:shifts") return { handled: true, source: "adminStaffShifts", state: await this.listStaffShiftState() };
    if (key === "staff:activities") return { handled: true, source: "adminStaffActivities", state: await this.listStaffActivityState() };
    if (key === "audit:activity-logs") return { handled: true, source: "adminAuditLogs", state: await this.listAuditState() };
    if (key === "audit:security-events") return { handled: true, source: "auditSecurityEvents", state: await this.listAuditSecurityState() };
    if (key === "audit:data-changes") return { handled: true, source: "auditDataChanges", state: await this.listAuditDataChangeState() };
    if (key === "audit:sessions") return { handled: true, source: "auditAdminSessionRecords", state: await this.listAuditSessionState() };
    if (key === "audit:exports") return { handled: true, source: "auditExportRecords", state: await this.listAuditExportState() };
    if (key === "audit:risk-alerts") return { handled: true, source: "auditRiskAlerts", state: await this.listAuditRiskAlertState() };
    if (key === "audit:settings") return { handled: true, source: "auditSettings", state: await this.getAuditSettingsState() };
    if (key === "reports:range") return { handled: true, source: "businessReportPreferences", state: await this.getReportRangeState() };
    if (key === "reports:filters") return { handled: true, source: "businessReportPreferences", state: await this.getReportFilterState() };
    if (key === "reports:exports") return { handled: true, source: "businessReportExports", state: await this.listReportExportState() };
    if (key === "account:profile" && adminUserId) return { handled: true, source: "adminUsers", state: await this.getAccountProfileState(adminUserId) };
    if (key === "account:security" && adminUserId) return { handled: true, source: "adminUsers", state: await this.getAccountSecurityState(adminUserId) };
    if (key === "account:sessions" && adminUserId) return { handled: true, source: "adminSessions", state: await this.listAccountSessionState(adminUserId) };
    if (key === "account:activity" && adminUserId) return { handled: true, source: "adminAuditLogs", state: await this.listAccountActivityState(adminUserId) };
    if (key === "account:notifications") return { handled: true, source: "systemSettings", state: await this.getSystemSettingState(key) };
    if (key === "account:preferences") return { handled: true, source: "systemSettings", state: await this.getSystemSettingState(key) };
    if (key === "account:recovery") return { handled: true, source: "systemSettings", state: await this.getSystemSettingState(key) };
    if (key.startsWith("settings:")) return { handled: true, source: "systemSettings", state: await this.getSystemSettingState(key) };
    return { handled: false };
  }

  private async writeRoutedAdminState(adminUserId: string, key: string, state: unknown): Promise<{ handled: boolean; source?: string; state?: unknown }> {
    if (key === "products:catalog") return { handled: true, source: "products", state: await this.listProductCatalogState() };
    if (key === "categories:items") return { handled: true, source: "categories", state: await this.listCategoryItemsState() };
    if (key === "categories:mappings") return { handled: true, source: "categoryProductMappings", state: await this.saveCategoryMappingState(adminUserId, state) };
    if (key === "categories:offers") return { handled: true, source: "categoryOfferPlacements", state: await this.saveCategoryOfferState(adminUserId, state) };
    if (key === "coupons:list") return { handled: true, source: "coupons", state: await this.listCouponState() };
    if (key === "coupons:banners") return { handled: true, source: "storefrontPlacements", state: await this.listCouponBannerState() };
    if (key === "promotions:items") return { handled: true, source: "promotions", state: await this.listPromotionState() };
    if (key === "promotions:sync-events") return { handled: true, source: "promotionSyncEventRecords", state: await this.savePromotionSyncEventState(adminUserId, state) };
    if (key === "orders:queue") return { handled: true, source: "orders", state: await this.saveOrderQueueState(adminUserId, state) };
    if (key === "inventory:stock-items") return { handled: true, source: "inventoryItems", state: await this.saveInventoryState(adminUserId, state) };
    if (key === "delivery:queue") return { handled: true, source: "deliveryAssignments", state: await this.saveDeliveryState(adminUserId, state) };
    if (key === "support:queue") return { handled: true, source: "supportConversations", state: await this.saveSupportState(adminUserId, state) };
    if (key === "customers:list") return { handled: true, source: "customers", state: await this.saveCustomerState(adminUserId, state) };
    if (key === "suppliers:items") return { handled: true, source: "suppliers", state: await this.saveSupplierState(adminUserId, state) };
    if (key === "suppliers:purchase-orders") return { handled: true, source: "purchaseOrders", state: await this.savePurchaseOrderState(adminUserId, state) };
    if (key === "suppliers:payments") return { handled: true, source: "supplierPayments", state: await this.saveSupplierPaymentState(adminUserId, state) };
    if (key === "suppliers:exports") return { handled: true, source: "supplierExportRecords", state: await this.saveSupplierExportState(adminUserId, state) };
    if (key === "refunds:requests") return { handled: true, source: "refundRequests", state: await this.saveRefundState(adminUserId, state) };
    if (key === "refunds:returns") return { handled: true, source: "refundReturnPickups", state: await this.saveRefundReturnState(adminUserId, state) };
    if (key === "refunds:rules") return { handled: true, source: "refundApprovalRules", state: await this.saveRefundRuleState(adminUserId, state) };
    if (key === "refunds:settings") return { handled: true, source: "refundSettings", state: await this.saveRefundSettingsState(adminUserId, state) };
    if (key === "finance:payments") return { handled: true, source: "payments", state: await this.saveFinancePaymentState(adminUserId, state) };
    if (key === "finance:cod-collections") return { handled: true, source: "financeCodCollections", state: await this.saveFinanceCodState(adminUserId, state) };
    if (key === "finance:refunds") return { handled: true, source: "refundRequests", state: await this.saveFinanceRefundState(adminUserId, state) };
    if (key === "finance:settlements") return { handled: true, source: "financeSettlements", state: await this.saveFinanceSettlementState(adminUserId, state) };
    if (key === "finance:expenses") return { handled: true, source: "financeExpenses", state: await this.saveFinanceExpenseState(adminUserId, state) };
    if (key === "finance:invoices") return { handled: true, source: "financeInvoices", state: await this.saveFinanceInvoiceState(adminUserId, state) };
    if (key === "finance:reports") return { handled: true, source: "financeReportExports", state: await this.saveFinanceReportState(adminUserId, state) };
    if (key === "finance:tax-settings") return { handled: true, source: "financeTaxSettings", state: await this.saveFinanceTaxSettingsState(adminUserId, state) };
    if (key === "notifications:items") return { handled: true, source: "notificationJobs", state: await this.saveNotificationState(adminUserId, state) };
    if (key === "notifications:failures") return { handled: true, source: "notificationFailures", state: await this.saveNotificationFailureState(adminUserId, state) };
    if (key === "notifications:automation-rules") return { handled: true, source: "notificationAutomationRules", state: await this.saveNotificationAutomationRuleState(adminUserId, state) };
    if (key === "content:items") return { handled: true, source: "contentPages", state: await this.saveContentState(adminUserId, state) };
    if (key === "content:settings") return { handled: true, source: "systemSettings", state: await this.saveSystemSettingState(adminUserId, key, state) };
    if (key === "staff:team:v2") return { handled: true, source: "adminUsers", state: await this.saveStaffState(adminUserId, state) };
    if (key === "staff:roles:v2") return { handled: true, source: "adminRoles", state: await this.saveStaffRoleState(adminUserId, state) };
    if (key === "staff:shifts") return { handled: true, source: "adminStaffShifts", state: await this.saveStaffShiftState(adminUserId, state) };
    if (key === "staff:activities") return { handled: true, source: "adminStaffActivities", state: await this.saveStaffActivityState(adminUserId, state) };
    if (key === "audit:activity-logs") return { handled: true, source: "auditActivityReviews", state: await this.saveAuditActivityState(adminUserId, state) };
    if (key === "audit:security-events") return { handled: true, source: "auditSecurityEvents", state: await this.saveAuditSecurityState(adminUserId, state) };
    if (key === "audit:data-changes") return { handled: true, source: "auditDataChanges", state: await this.saveAuditDataChangeState(adminUserId, state) };
    if (key === "audit:sessions") return { handled: true, source: "auditAdminSessionRecords", state: await this.saveAuditSessionState(adminUserId, state) };
    if (key === "audit:exports") return { handled: true, source: "auditExportRecords", state: await this.saveAuditExportState(adminUserId, state) };
    if (key === "audit:risk-alerts") return { handled: true, source: "auditRiskAlerts", state: await this.saveAuditRiskAlertState(adminUserId, state) };
    if (key === "audit:settings") return { handled: true, source: "auditSettings", state: await this.saveAuditSettingsState(adminUserId, state) };
    if (key === "reports:range") return { handled: true, source: "businessReportPreferences", state: await this.saveReportRangeState(adminUserId, state) };
    if (key === "reports:filters") return { handled: true, source: "businessReportPreferences", state: await this.saveReportFilterState(adminUserId, state) };
    if (key === "reports:exports") return { handled: true, source: "businessReportExports", state: await this.saveReportExportState(adminUserId, state) };
    if (key === "account:profile") return { handled: true, source: "adminUsers", state: await this.saveAccountProfileState(adminUserId, state) };
    if (key === "account:security") return { handled: true, source: "adminUsers", state: await this.saveAccountSecurityState(adminUserId, state) };
    if (key === "account:sessions") return { handled: true, source: "adminSessions", state: await this.saveAccountSessionState(adminUserId, state) };
    if (key === "account:activity") return { handled: true, source: "adminAuditLogs", state: await this.saveAccountActivityState(adminUserId, state) };
    if (key === "account:notifications") return { handled: true, source: "systemSettings", state: await this.saveSystemSettingState(adminUserId, key, state) };
    if (key === "account:preferences") return { handled: true, source: "systemSettings", state: await this.saveSystemSettingState(adminUserId, key, state) };
    if (key === "account:recovery") return { handled: true, source: "systemSettings", state: await this.saveSystemSettingState(adminUserId, key, state) };
    if (key.startsWith("settings:")) return { handled: true, source: "systemSettings", state: await this.saveSystemSettingState(adminUserId, key, state) };
    return { handled: false };
  }

  private async getSystemSettingState(key: string) {
    const record = await this.prisma.systemSetting.findUnique({ where: { key: this.normalizeStateKey(key) } });
    return record?.payload ?? null;
  }

  private async saveSystemSettingState(adminUserId: string, key: string, state: unknown) {
    const normalizedKey = this.normalizeStateKey(key);
    const record = await this.prisma.systemSetting.upsert({
      where: { key: normalizedKey },
      update: { payload: state as Prisma.InputJsonValue },
      create: { key: normalizedKey, payload: state as Prisma.InputJsonValue }
    });
    await this.recordAudit(adminUserId, "SYSTEM_SETTING_SAVED", "SystemSetting", record.id, { key });
    return record.payload;
  }

  private async listProductCatalogState() {
    const products = await this.prisma.product.findMany({
      where: { deletedAt: null },
      include: { category: true, images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } },
      orderBy: { updatedAt: "desc" }
    });
    return products.map((product) => this.toAdminProduct(product));
  }

  private async listCategoryItemsState() {
    const categories = await this.prisma.category.findMany({
      where: { deletedAt: null },
      include: { _count: { select: { products: true } }, products: { take: 1, orderBy: { updatedAt: "desc" } } },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }]
    });
    return categories.map((category) => this.toAdminCategory(category));
  }

  private async listCategoryMappingState() {
    const [products, mappings] = await Promise.all([
      this.prisma.product.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" }
      }),
      this.prisma.categoryProductMapping.findMany({ orderBy: { updatedAt: "desc" } })
    ]);
    const mappingBySku = new Map(mappings.map((mapping) => [mapping.sku.toUpperCase(), mapping]));
    const productSkus = new Set(products.map((product) => product.sku.toUpperCase()));
    const productRows = products.map((product) => {
      const mapping = mappingBySku.get(product.sku.toUpperCase());
      return {
        sku: product.sku,
        product: mapping?.product ?? product.name,
        categoryId: mapping?.categoryId ?? product.categoryId,
        status: mapping?.status ?? this.categoryMappingStatus(product.stockStatus),
        sales: mapping?.sales ?? "Rs. 0"
      };
    });
    const manualRows = mappings
      .filter((mapping) => !productSkus.has(mapping.sku.toUpperCase()))
      .map((mapping) => ({
        sku: mapping.sku,
        product: mapping.product,
        categoryId: mapping.categoryId,
        status: mapping.status,
        sales: mapping.sales ?? "Rs. 0"
      }));
    return [...productRows, ...manualRows];
  }

  private async saveCategoryMappingState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const sku = this.requiredString(item.sku, "Product SKU").toUpperCase();
      const productName = this.requiredString(item.product, "Product name");
      const categoryId = this.requiredString(item.categoryId, "Category");
      await this.findCategory(categoryId);
      const status = this.optionalString(item.status) || "Active";
      await this.prisma.categoryProductMapping.upsert({
        where: { sku },
        update: {
          product: productName,
          categoryId,
          status,
          sales: this.optionalString(item.sales) || "Rs. 0"
        },
        create: {
          sku,
          product: productName,
          categoryId,
          status,
          sales: this.optionalString(item.sales) || "Rs. 0"
        }
      });
      await this.prisma.product
        .update({
          where: { sku },
          data: {
            name: productName,
            categoryId,
            stockStatus: this.categoryMappingInventoryStatus(status)
          }
        })
        .catch(() => undefined);
    }
    await this.recordAudit(adminUserId, "CATEGORY_PRODUCT_MAPPINGS_SAVED", "CategoryProductMapping", undefined, { count: this.arrayRecords(state).length });
    return this.listCategoryMappingState();
  }

  private async listCategoryOfferState() {
    const offers = await this.prisma.categoryOfferPlacement.findMany({ orderBy: [{ updatedAt: "desc" }] });
    return offers.map((offer) => ({
      id: offer.id,
      categoryId: offer.categoryId,
      title: offer.title,
      placement: offer.placement,
      status: offer.status,
      valid: offer.valid ?? "Next campaign window"
    }));
  }

  private async saveCategoryOfferState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const id = this.optionalString(item.id) || `CO-${Date.now()}`;
      const categoryId = this.requiredString(item.categoryId, "Category");
      await this.findCategory(categoryId);
      await this.prisma.categoryOfferPlacement.upsert({
        where: { id },
        update: {
          categoryId,
          title: this.requiredString(item.title, "Offer title"),
          placement: this.optionalString(item.placement) || "Category banner",
          status: this.optionalString(item.status) || "Scheduled",
          valid: this.optionalString(item.valid) || null
        },
        create: {
          id,
          categoryId,
          title: this.requiredString(item.title, "Offer title"),
          placement: this.optionalString(item.placement) || "Category banner",
          status: this.optionalString(item.status) || "Scheduled",
          valid: this.optionalString(item.valid) || null
        }
      });
    }
    await this.recordAudit(adminUserId, "CATEGORY_OFFERS_SAVED", "CategoryOfferPlacement", undefined, { count: this.arrayRecords(state).length });
    return this.listCategoryOfferState();
  }

  private async listCouponState() {
    const coupons = await this.prisma.coupon.findMany({ orderBy: [{ status: "asc" }, { updatedAt: "desc" }] });
    return coupons.map((coupon) => this.toAdminCoupon(coupon));
  }

  private async listPromotionState() {
    const promotions = await this.prisma.promotion.findMany({
      include: { coupon: true },
      orderBy: [{ priority: "asc" }, { updatedAt: "desc" }]
    });
    return promotions.map((promotion) => this.toAdminPromotion(promotion));
  }

  private async listPromotionSyncEventState() {
    const events = await this.prisma.promotionSyncEventRecord.findMany({ orderBy: { updatedAt: "desc" }, take: 25 });
    return events.map((event) => ({
      id: event.id,
      message: event.message,
      time: event.time
    }));
  }

  private async savePromotionSyncEventState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const id = this.optionalString(item.id) || `SYNC-${Date.now()}`;
      await this.prisma.promotionSyncEventRecord.upsert({
        where: { id },
        update: {
          message: this.requiredString(item.message, "Sync message"),
          time: this.optionalString(item.time) || "Just now"
        },
        create: {
          id,
          message: this.requiredString(item.message, "Sync message"),
          time: this.optionalString(item.time) || "Just now"
        }
      });
    }
    await this.recordAudit(adminUserId, "PROMOTION_SYNC_EVENTS_SAVED", "PromotionSyncEventRecord", undefined, { count: this.arrayRecords(state).length });
    return this.listPromotionSyncEventState();
  }

  private async listCouponBannerState() {
    const banners = await this.prisma.storefrontPlacement.findMany({
      where: { placement: { in: ["Homepage hero", "Category banner", "Cart banner", "Footer banner"] } },
      orderBy: [{ priority: "asc" }, { updatedAt: "desc" }]
    });
    return banners.map((banner) => this.toAdminBanner(banner));
  }

  private async listOrderQueueState() {
    const orders = await this.prisma.order.findMany({
      include: { customer: true },
      orderBy: { updatedAt: "desc" },
      take: 100
    });
    return orders.map((order) => ({
      id: order.orderNumber,
      customer: this.customerName(order.customer),
      phone: order.customer?.phone ?? this.snapshotValue(order.deliveryAddressSnapshot, "phone", ""),
      status: this.orderStatusToLabel(order.status),
      fulfillment: this.fulfillmentStatusToLabel(order.fulfillmentStatus),
      payment: this.paymentStatusToLabel(order.paymentStatus),
      slot: this.snapshotValue(order.deliveryAddressSnapshot, "slot", "No slot selected"),
      total: this.formatMoney(order.total)
    }));
  }

  private async saveOrderQueueState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const orderNumber = this.requiredString(item.id, "Order number");
      const customer = await this.findOrCreateCustomerByUi(item.customer, item.phone);
      await this.prisma.order.upsert({
        where: { orderNumber },
        update: {
          customerId: customer.id,
          status: this.labelToOrderStatus(item.status),
          paymentStatus: this.labelToPaymentStatus(item.payment),
          fulfillmentStatus: this.labelToFulfillmentStatus(item.fulfillment),
          total: this.moneyFromInput(item.total, "Order total"),
          deliveryAddressSnapshot: this.orderSnapshot(item)
        },
        create: {
          orderNumber,
          customerId: customer.id,
          status: this.labelToOrderStatus(item.status),
          paymentStatus: this.labelToPaymentStatus(item.payment),
          fulfillmentStatus: this.labelToFulfillmentStatus(item.fulfillment),
          subtotal: this.moneyFromInput(item.total, "Order total"),
          total: this.moneyFromInput(item.total, "Order total"),
          deliveryAddressSnapshot: this.orderSnapshot(item)
        }
      });
    }
    await this.recordAudit(adminUserId, "ORDERS_STATE_SAVED", "Order", undefined, { count: this.arrayRecords(state).length });
    return this.listOrderQueueState();
  }

  private async listInventoryState() {
    const items = await this.prisma.inventoryItem.findMany({
      include: { product: true, branch: true, batches: { orderBy: { receivedAt: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
      take: 100
    });
    return items.map((item) => ({
      sku: item.sku,
      product: item.product.name,
      stock: item.onHand,
      reserved: item.reserved,
      available: Math.max(0, item.onHand - item.reserved),
      threshold: item.threshold,
      status: this.fromInventoryStatus(item.status),
      expiry: item.batches[0]?.expiresAt ? `Expires ${this.dateOnly(item.batches[0].expiresAt)}` : "No active batch",
      batch: item.batches[0]?.batchCode ?? "No active batch",
      supplier: item.product.supplierName ?? "No supplier"
    }));
  }

  private async saveInventoryState(adminUserId: string, state: unknown) {
    const branch = await this.defaultBranch();
    const fallbackCategory = await this.defaultCategory();
    for (const item of this.arrayRecords(state)) {
      const sku = this.requiredString(item.sku, "SKU").toUpperCase();
      const onHand = this.integerFromInput(item.stock);
      const reserved = this.integerFromInput(item.reserved);
      const threshold = this.integerFromInput(item.threshold);
      const requestedStatus = this.toInventoryStatus(item.status);
      const inventoryStatus = this.deriveInventoryStatus(onHand, reserved, threshold, requestedStatus);
      const product = await this.prisma.product.upsert({
        where: { sku },
        update: { name: this.optionalString(item.item) ?? sku, supplierName: this.optionalString(item.supplier) ?? null, stockStatus: inventoryStatus },
        create: {
          sku,
          slug: await this.uniqueSlug("product", this.slugify(this.optionalString(item.item) || sku)),
          name: this.optionalString(item.item) || sku,
          categoryId: fallbackCategory.id,
          unit: "1 unit",
          description: `Inventory item ${this.optionalString(item.item) || sku}`,
          price: new Prisma.Decimal(0),
          status: ProductStatus.ACTIVE,
          stockStatus: inventoryStatus,
          supplierName: this.optionalString(item.supplier) ?? null
        }
      });
      const previousInventory = await this.prisma.inventoryItem.findUnique({ where: { branchId_sku: { branchId: branch.id, sku } } });
      const inventory = await this.prisma.inventoryItem.upsert({
        where: { branchId_sku: { branchId: branch.id, sku } },
        update: {
          productId: product.id,
          onHand,
          reserved,
          threshold,
          status: inventoryStatus
        },
        create: {
          branchId: branch.id,
          productId: product.id,
          sku,
          onHand,
          reserved,
          threshold,
          status: inventoryStatus
        }
      });
      const stockDelta = onHand - (previousInventory?.onHand ?? 0);
      if (stockDelta !== 0) {
        await this.prisma.stockLedger.create({
          data: {
            inventoryItemId: inventory.id,
            type: stockDelta > 0 ? "ADMIN_STOCK_INCREASE" : "ADMIN_STOCK_DECREASE",
            quantity: stockDelta,
            note: this.optionalString(item.note) || "Admin inventory save",
            referenceType: "AdminUser",
            referenceId: adminUserId
          }
        });
      }
      const reservedDelta = reserved - (previousInventory?.reserved ?? 0);
      if (reservedDelta !== 0) {
        await this.prisma.stockLedger.create({
          data: {
            inventoryItemId: inventory.id,
            type: "ADMIN_RESERVED_ADJUSTMENT",
            quantity: reservedDelta,
            note: "Admin reserved quantity adjustment",
            referenceType: "AdminUser",
            referenceId: adminUserId
          }
        });
      }
      const batchCode = this.optionalString(item.batch);
      if (batchCode && batchCode !== "No active batch") {
        await this.prisma.inventoryBatch.create({
          data: { inventoryItemId: inventory.id, batchCode, quantity: Math.max(stockDelta, onHand) }
        });
      }
    }
    await this.recordAudit(adminUserId, "INVENTORY_STATE_SAVED", "InventoryItem", undefined, { count: this.arrayRecords(state).length });
    return this.listInventoryState();
  }

  private async listSupplierState() {
    const suppliers = await this.prisma.supplier.findMany({ orderBy: { updatedAt: "desc" } });
    return suppliers.map((supplier) => ({
      id: supplier.id,
      name: supplier.name,
      contact: supplier.contactName ?? "",
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      status: this.supplierStatusToLabel(supplier.status),
      lastPurchase: "From purchase orders",
      rating: "-",
      payment: "From supplier payments",
      categories: supplier.categories.join(", "),
      address: "",
      gst: "",
      terms: "Net 7",
      schedule: "Weekly",
      notes: "",
      onTime: "-",
      rejected: 0,
      delayed: 0,
      averageDelivery: "-",
      outstanding: "Rs. 0"
    }));
  }

  private async saveSupplierState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const id = this.optionalString(item.id);
      const data = {
        name: this.requiredString(item.name, "Supplier name"),
        contactName: this.optionalString(item.contact) ?? null,
        phone: this.optionalString(item.phone) ?? null,
        email: this.optionalString(item.email) ?? null,
        status: (this.optionalString(item.status) || "Active").toUpperCase(),
        categories: this.csvList(item.categories)
      };
      if (id && !id.startsWith("SUP-")) {
        await this.prisma.supplier.update({ where: { id }, data });
      } else {
        await this.prisma.supplier.upsert({
          where: { email: data.email ?? `supplier-${this.slugify(data.name)}@freshcart.local` },
          update: data,
          create: data
        } as never);
      }
    }
    await this.recordAudit(adminUserId, "SUPPLIERS_STATE_SAVED", "Supplier", undefined, { count: this.arrayRecords(state).length });
    return this.listSupplierState();
  }

  private async listPurchaseOrderState() {
    const orders = await this.prisma.purchaseOrder.findMany({ include: { items: true }, orderBy: { updatedAt: "desc" } });
    return orders.map((order) => ({
      id: order.poNumber,
      supplierId: order.supplierId,
      products: order.items.map((item) => item.name).join(", ") || "No items",
      quantity: `${order.items.reduce((total, item) => total + item.quantity, 0)} units`,
      amount: this.formatMoney(order.totalAmount),
      orderDate: this.dateOnly(order.createdAt),
      deliveryDate: order.expectedAt ? this.dateOnly(order.expectedAt) : "Not scheduled",
      payment: "Pending",
      status: this.purchaseOrderStatusToLabel(order.status)
    }));
  }

  private async savePurchaseOrderState(adminUserId: string, state: unknown) {
    const suppliers = await this.prisma.supplier.findMany({ take: 1 });
    const fallbackSupplier = suppliers[0];
    if (!fallbackSupplier) throw new BadRequestException("Create a supplier before creating purchase orders.");
    for (const item of this.arrayRecords(state)) {
      const poNumber = this.requiredString(item.id, "PO number");
      const supplierId = this.optionalString(item.supplierId) || fallbackSupplier.id;
      const amount = this.moneyFromInput(item.amount, "Purchase amount");
      await this.prisma.purchaseOrder.upsert({
        where: { poNumber },
        update: { supplierId, status: this.labelToPurchaseOrderStatus(item.status), totalAmount: amount, expectedAt: this.optionalDate(item.deliveryDate) },
        create: { poNumber, supplierId, status: this.labelToPurchaseOrderStatus(item.status), totalAmount: amount, expectedAt: this.optionalDate(item.deliveryDate) }
      });
    }
    await this.recordAudit(adminUserId, "PURCHASE_ORDERS_STATE_SAVED", "PurchaseOrder", undefined, { count: this.arrayRecords(state).length });
    return this.listPurchaseOrderState();
  }

  private async listSupplierPaymentState() {
    const payments = await this.prisma.supplierPayment.findMany({ include: { purchaseOrder: true }, orderBy: { createdAt: "desc" } });
    return payments.map((payment) => ({
      id: payment.id,
      supplierId: payment.purchaseOrder.supplierId,
      invoice: payment.purchaseOrder.poNumber,
      amount: this.formatMoney(payment.amount),
      due: payment.paidAt ? `Paid ${this.dateOnly(payment.paidAt)}` : "Pending",
      status: this.paymentStatusToSupplierLabel(payment.status),
      method: "Bank transfer"
    }));
  }

  private async saveSupplierPaymentState(adminUserId: string, state: unknown) {
    const fallbackPurchaseOrder = await this.defaultPurchaseOrder();
    for (const item of this.arrayRecords(state)) {
      const id = this.optionalString(item.id);
      const data = {
        purchaseOrderId: fallbackPurchaseOrder.id,
        amount: this.moneyFromInput(item.amount, "Supplier payment amount"),
        status: this.labelToPaymentStatus(item.status),
        paidAt: this.optionalString(item.status) === "Paid" ? new Date() : null
      };
      if (id && !id.startsWith("PAY-")) {
        await this.prisma.supplierPayment.update({ where: { id }, data });
      } else {
        await this.prisma.supplierPayment.create({ data });
      }
    }
    await this.recordAudit(adminUserId, "SUPPLIER_PAYMENTS_STATE_SAVED", "SupplierPayment", undefined, { count: this.arrayRecords(state).length });
    return this.listSupplierPaymentState();
  }

  private async listSupplierExportState() {
    const exports = await this.prisma.supplierExportRecord.findMany({ orderBy: { updatedAt: "desc" } });
    return exports.map((item) => ({
      id: item.id,
      title: item.title,
      format: item.format,
      status: item.status,
      time: item.time ?? "Ready"
    }));
  }

  private async saveSupplierExportState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const id = this.optionalString(item.id) || `SX-${Date.now()}`;
      await this.prisma.supplierExportRecord.upsert({
        where: { id },
        update: {
          title: this.requiredString(item.title, "Export title"),
          format: this.optionalString(item.format) || "CSV",
          status: this.optionalString(item.status) || "Ready",
          time: this.optionalString(item.time) || null
        },
        create: {
          id,
          title: this.requiredString(item.title, "Export title"),
          format: this.optionalString(item.format) || "CSV",
          status: this.optionalString(item.status) || "Ready",
          time: this.optionalString(item.time) || null
        }
      });
    }
    await this.recordAudit(adminUserId, "SUPPLIER_EXPORTS_STATE_SAVED", "SupplierExportRecord", undefined, { count: this.arrayRecords(state).length });
    return this.listSupplierExportState();
  }

  private async listDeliveryState() {
    const deliveries = await this.prisma.deliveryAssignment.findMany({
      include: { order: true, deliveryPartner: true, pings: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
      take: 100
    });
    return deliveries.map((delivery) => ({
      id: delivery.id,
      order: delivery.order.orderNumber,
      rider: delivery.deliveryPartner?.name ?? "Unassigned",
      status: this.deliveryStatusToLabel(delivery.status),
      eta: delivery.eta ? `${Math.max(0, Math.round((delivery.eta.getTime() - Date.now()) / 60000))} min` : "Needs assignment",
      zone: this.snapshotValue(delivery.order.deliveryAddressSnapshot, "zone", "Primary zone"),
      latitude: delivery.pings[0]?.latitude ? String(delivery.pings[0].latitude) : "",
      longitude: delivery.pings[0]?.longitude ? String(delivery.pings[0].longitude) : "",
      heading: delivery.pings[0]?.heading ? String(delivery.pings[0].heading) : "",
      speed: delivery.pings[0]?.speed ? String(delivery.pings[0].speed) : ""
    }));
  }

  private async saveDeliveryState(adminUserId: string, state: unknown) {
    const items = this.arrayRecords(state);
    if (items.some((item) => this.labelToDeliveryStatus(item.status) === DeliveryAssignmentStatus.DELIVERED)) {
      await this.assertAdminPermission(adminUserId, "delivery.complete");
    }

    for (const item of items) {
      const order = await this.findOrCreateOrderByNumber(this.optionalString(item.order) || this.optionalString(item.id) || `FC-${Date.now()}`);
      const rider = this.optionalString(item.rider);
      const deliveryPartner =
        rider && rider !== "Unassigned"
          ? await this.findOrCreateDeliveryPartner(rider)
          : null;
      const deliveryStatus = this.labelToDeliveryStatus(item.status);
      const orderStatus = this.deliveryStatusToOrderStatus(deliveryStatus);
      const fulfillmentStatus = this.deliveryStatusToFulfillmentStatus(deliveryStatus);
      const assignment = await this.prisma.deliveryAssignment.upsert({
        where: { orderId: order.id },
        update: { deliveryPartnerId: deliveryPartner?.id ?? null, status: deliveryStatus, eta: this.etaFromLabel(item.eta) },
        create: { orderId: order.id, deliveryPartnerId: deliveryPartner?.id ?? null, status: deliveryStatus, eta: this.etaFromLabel(item.eta) }
      });
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: orderStatus,
          fulfillmentStatus,
          ...(deliveryStatus === DeliveryAssignmentStatus.DELIVERED && order.paymentStatus === PaymentStatus.COD_PENDING ? { paymentStatus: PaymentStatus.PAID } : {}),
          statusHistory: { create: { status: orderStatus, note: `Delivery ${this.deliveryStatusToLabel(deliveryStatus)} from admin dispatch` } }
        }
      });
      if (deliveryStatus === DeliveryAssignmentStatus.DELIVERED && order.paymentStatus === PaymentStatus.COD_PENDING) {
        await this.prisma.payment.updateMany({
          where: { orderId: order.id, status: PaymentStatus.COD_PENDING },
          data: { status: PaymentStatus.PAID, paidAt: new Date(), metadata: { collectedBy: rider || "Delivery", codCollected: true } }
        });
      }
      if (order.customerId) {
        const customer = await this.prisma.customer.findUnique({ where: { id: order.customerId } });
        if (customer) {
          await this.queueCustomerNotification(customer, {
            event: `DELIVERY_${deliveryStatus}`,
            title: `Delivery ${this.deliveryStatusToLabel(deliveryStatus).toLowerCase()} for ${order.orderNumber}`,
            message: this.deliveryNotificationMessage(order.orderNumber, deliveryStatus, rider),
            target: `/orders/${order.orderNumber}/tracking`,
            orderNumber: order.orderNumber
          });
        }
      }
      const latitude = this.optionalNumber(item.latitude) ?? 19.076;
      const longitude = this.optionalNumber(item.longitude) ?? 72.8777;
      await this.prisma.deliveryLocationPing.create({
        data: {
          deliveryAssignmentId: assignment.id,
          latitude,
          longitude,
          heading: this.optionalNumber(item.heading),
          speed: this.optionalNumber(item.speed)
        }
      });
    }
    await this.recordAudit(adminUserId, "DELIVERY_STATE_SAVED", "DeliveryAssignment", undefined, { count: items.length });
    return this.listDeliveryState();
  }

  private async listSupportState() {
    const [tickets, contacts] = await Promise.all([
      this.prisma.supportConversation.findMany({
        include: {
          assignedAdmin: true,
          customer: { include: { orders: { orderBy: { placedAt: "desc" }, take: 1 } } },
          messages: { orderBy: { createdAt: "asc" }, take: 20 }
        },
        orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
        take: 100
      }),
      this.prisma.contactMessage.findMany({
        where: { status: { not: "ARCHIVED" } },
        orderBy: { updatedAt: "desc" },
        take: 50
      })
    ]);
    const supportTickets = tickets.map((ticket) => {
      const customerMessages = ticket.messages.filter((message) => message.senderType === "CUSTOMER");
      const agentMessages = ticket.messages.filter((message) => message.senderType !== "CUSTOMER");
      const latestMessage = ticket.messages[ticket.messages.length - 1];
      const linkedOrder = ticket.customer?.orders[0]?.orderNumber ?? ticket.id;
      return {
        id: ticket.id,
        source: ticket.channel,
        customer: this.customerName(ticket.customer),
        topic: ticket.subject,
        order: linkedOrder,
        state: this.supportStatusToLabel(ticket.status),
        time: ticket.lastMessageAt ? this.dateOnly(ticket.lastMessageAt) : this.dateOnly(ticket.updatedAt),
        agent: ticket.assignedAdmin?.name ?? "Unassigned",
        customerMessage: customerMessages[customerMessages.length - 1]?.body ?? latestMessage?.body ?? "",
        agentMessage: agentMessages[agentMessages.length - 1]?.body ?? "",
        lastMessage: latestMessage?.body ?? "",
        messageCount: ticket.messages.length,
        channel: ticket.channel
      };
    });
    const contactTickets = contacts.map((contact) => ({
      id: contact.id,
      source: "Contact form",
      customer: contact.name,
      topic: contact.topic,
      order: `MSG-${contact.id.slice(0, 8).toUpperCase()}`,
      state: contact.status === "RESOLVED" ? "Resolved" : contact.status === "PENDING" ? "Pending" : "Open",
      time: this.dateOnly(contact.updatedAt),
      agent: "Unassigned",
      customerMessage: contact.message,
      agentMessage: "",
      lastMessage: contact.message,
      messageCount: 1,
      channel: contact.email ? "Email" : contact.phone ? "Phone" : "Contact form"
    }));
    return [...supportTickets, ...contactTickets].sort((first, second) => (first.time < second.time ? 1 : -1));
  }

  private async saveSupportState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const contactId = this.optionalString(item.id);
      if (contactId) {
        const contact = await this.prisma.contactMessage.findUnique({ where: { id: contactId } }).catch(() => null);
        if (contact) {
          await this.prisma.contactMessage.update({
            where: { id: contact.id },
            data: { status: this.labelToSupportStatus(item.state) === SupportConversationStatus.RESOLVED ? "RESOLVED" : this.labelToSupportStatus(item.state) === SupportConversationStatus.PENDING ? "PENDING" : "OPEN" }
          });
          continue;
        }
      }
      const customer = await this.findOrCreateCustomerByUi(item.customer, item.phone, item.email);
      const id = this.optionalString(item.id) || this.optionalString(item.order);
      const reply = this.optionalString(item.agentMessage) || this.optionalString(item.lastReply);
      const conversation = await this.prisma.supportConversation.upsert({
        where: { id: id && !id.startsWith("FC-") && !id.startsWith("MSG-") ? id : "__missing__" },
        update: {
          customerId: customer.id,
          subject: this.optionalString(item.topic) || "Support request",
          status: this.labelToSupportStatus(item.state),
          lastMessageAt: new Date()
        },
        create: {
          customerId: customer.id,
          subject: this.optionalString(item.topic) || "Support request",
          status: this.labelToSupportStatus(item.state),
          channel: this.optionalString(item.channel) || "ADMIN",
          lastMessageAt: new Date()
        }
      }).catch(async () => {
        return this.prisma.supportConversation.create({
          data: {
            customerId: customer.id,
            subject: this.optionalString(item.topic) || "Support request",
            status: this.labelToSupportStatus(item.state),
            channel: this.optionalString(item.channel) || "ADMIN",
            lastMessageAt: new Date()
          }
        });
      });
      if (reply) {
        const latest = await this.prisma.supportMessage.findFirst({
          where: { conversationId: conversation.id, senderType: "ADMIN" },
          orderBy: { createdAt: "desc" }
        });
        if (latest?.body !== reply) {
          await this.prisma.supportMessage.create({
            data: { conversationId: conversation.id, senderType: "ADMIN", senderId: adminUserId, body: reply }
          });
        }
      }
    }
    await this.recordAudit(adminUserId, "SUPPORT_STATE_SAVED", "SupportConversation", undefined, { count: this.arrayRecords(state).length });
    return this.listSupportState();
  }

  private async listCustomerState() {
    const customers = await this.prisma.customer.findMany({
      include: { wallet: true, loyaltyAccount: true, orders: true, addresses: true, supportThreads: true },
      orderBy: { updatedAt: "desc" },
      take: 100
    });
    return customers.map((customer) => {
      const spend = customer.orders.reduce((total, order) => total + Number(order.total), 0);
      const address = customer.addresses[0];
      return {
        name: this.customerName(customer),
        email: customer.email ?? "",
        phone: customer.phone ?? "",
        status: customer.orders.length > 10 ? "VIP" : customer.orders.length ? "Active" : "New",
        tier: customer.loyaltyAccount?.tier === "Member" ? "Starter" : customer.loyaltyAccount?.tier ?? "Starter",
        orders: customer.orders.length,
        spend: this.formatNumberMoney(spend),
        averageOrder: customer.orders.length ? this.formatNumberMoney(spend / customer.orders.length) : "Rs. 0",
        lastOrder: customer.orders[0] ? this.dateOnly(customer.orders[0].createdAt) : "No orders yet",
        paymentPreference: customer.orders.some((order) => order.paymentStatus === "COD_PENDING") ? "COD" : "Online",
        preferredSlot: "Not set",
        favorite: "Not enough data",
        address: address ? `${address.addressLine1}, ${address.city}` : "No saved address",
        cart: "No active cart",
        support: customer.supportThreads.some((ticket) => ticket.status !== "RESOLVED") ? "Open support ticket" : "No open tickets",
        points: customer.loyaltyAccount?.points ?? 0,
        wallet: customer.wallet ? this.formatMoney(customer.wallet.balance) : "Rs. 0",
        risk: customer.status === "BLOCKED" ? "Blocked" : "Normal",
        internalNote: "Customer profile from database."
      };
    });
  }

  private async saveCustomerState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const customer = await this.findOrCreateCustomerByUi(item.name, item.phone, item.email);
      await this.prisma.customer.update({
        where: { id: customer.id },
        data: {
          email: this.optionalString(item.email) ?? customer.email,
          status: this.optionalString(item.status) === "At risk" ? "ACTIVE" : customer.status
        }
      });
    }
    await this.recordAudit(adminUserId, "CUSTOMERS_STATE_SAVED", "Customer", undefined, { count: this.arrayRecords(state).length });
    return this.listCustomerState();
  }

  private async listRefundState() {
    const refunds = await this.prisma.refundRequest.findMany({ include: { order: true }, orderBy: { updatedAt: "desc" }, take: 100 });
    return refunds.map((refund) => ({
      id: refund.id,
      orderId: refund.order.orderNumber,
      customer: refund.customerName ?? this.snapshotValue(refund.order.deliveryAddressSnapshot, "customer", "Customer"),
      phone: refund.phone ?? this.snapshotValue(refund.order.deliveryAddressSnapshot, "phone", ""),
      email: refund.email ?? "",
      amount: refund.amount ? this.formatMoney(refund.amount) : this.formatMoney(refund.order.total),
      reason: refund.reason,
      items: refund.items ?? "No items recorded",
      paymentMethod: refund.paymentMethodLabel ?? "Online",
      refundMethod: refund.refundMethod ?? "Original payment",
      status: this.refundStatusToLabel(refund.status),
      sla: refund.sla ?? "Not set",
      risk: refund.risk ?? "Low",
      assignedTo: refund.assignedTo ?? "Unassigned",
      customerNote: refund.customerNote ?? "",
      adminNote: refund.adminNote ?? refund.note ?? "",
      evidence: refund.evidence ?? "Not required",
      transactionId: refund.transactionId ?? "Pending",
      financeStatus: refund.financeStatus ?? (refund.status === "PROCESSED" ? "Refunded" : "Not started"),
      gatewayStatus: refund.gatewayStatus ?? "Not started",
      processedBy: refund.processedBy ?? "Unassigned",
      processedTime: refund.processedTime ?? "Not processed",
      returnStatus: refund.returnStatus ?? "Not required",
      reviewerDecision: refund.reviewerDecision ?? "Needs review",
      riskNote: refund.riskNote ?? ""
    }));
  }

  private async saveRefundState(adminUserId: string, state: unknown) {
    const items = this.arrayRecords(state);
    if (items.some((item) => this.labelToRefundStatus(item.status) === RefundStatus.APPROVED)) {
      await this.assertAdminPermission(adminUserId, "refunds.approve");
    }
    if (items.some((item) => this.labelToRefundStatus(item.status) === RefundStatus.PROCESSED)) {
      await this.assertAdminPermission(adminUserId, "refunds.process");
    }

    for (const item of items) {
      const orderNumber = this.optionalString(item.orderId) || this.optionalString(item.order) || `FC-${Date.now()}`;
      const order = await this.findOrCreateOrderByNumber(orderNumber);
      const customer = await this.findOrCreateCustomerByUi(item.customer, item.phone, item.email);
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          customerId: customer.id,
          deliveryAddressSnapshot: {
            ...(this.asRecord(order.deliveryAddressSnapshot) as Prisma.InputJsonObject),
            customer: this.optionalString(item.customer) || this.customerName(customer),
            phone: this.optionalString(item.phone) || customer.phone || "",
            email: this.optionalString(item.email) || customer.email || ""
          }
        }
      });
      const id = this.optionalString(item.id) || `RF-${Date.now()}`;
      const nextStatus = this.labelToRefundStatus(item.status);
      const refundMethod = this.optionalString(item.refundMethod ?? item.method) || null;
      const processed = nextStatus === RefundStatus.PROCESSED;
      const data = {
        orderId: order.id,
        reason: this.optionalString(item.reason) || "Admin refund request",
        note: this.optionalString(item.adminNote) ?? this.optionalString(item.note) ?? null,
        status: nextStatus,
        amount: this.optionalMoneyFromInput(item.amount),
        customerName: this.optionalString(item.customer) || this.customerName(customer),
        phone: this.optionalString(item.phone) || customer.phone || null,
        email: this.optionalString(item.email) || customer.email || null,
        items: this.optionalString(item.items) || null,
        paymentMethodLabel: this.optionalString(item.paymentMethod) || null,
        refundMethod,
        sla: this.optionalString(item.sla) || null,
        risk: this.optionalString(item.risk) || "Low",
        assignedTo: this.optionalString(item.assignedTo) || null,
        customerNote: this.optionalString(item.customerNote) || null,
        adminNote: this.optionalString(item.adminNote) || null,
        evidence: this.optionalString(item.evidence) || "Not required",
        transactionId: this.optionalString(item.transactionId) || (processed ? `LOCAL-REFUND-${Date.now().toString(36).toUpperCase()}` : null),
        financeStatus: this.optionalString(item.financeStatus ?? item.status) || (processed ? "Refunded" : null),
        gatewayStatus: this.optionalString(item.gatewayStatus) || (processed ? "Completed" : null),
        processedBy: this.optionalString(item.processedBy) || (processed ? "Finance" : null),
        processedTime: this.optionalString(item.processedTime) || (processed ? this.dateOnly(new Date()) : null),
        returnStatus: this.optionalString(item.returnStatus) || null,
        reviewerDecision: this.optionalString(item.reviewerDecision) || null,
        riskNote: this.optionalString(item.riskNote) || null
      };
      const existingRefund = await this.prisma.refundRequest.findUnique({ where: { id } });
      const savedRefund = await this.prisma.refundRequest.upsert({ where: { id }, update: data, create: { id, ...data } });
      if (savedRefund.status === RefundStatus.PROCESSED && existingRefund?.status !== RefundStatus.PROCESSED) {
        await this.prisma.payment.updateMany({
          where: { orderId: order.id },
          data: {
            status: PaymentStatus.REFUNDED,
            metadata: {
              refundId: savedRefund.id,
              refundMethod: savedRefund.refundMethod ?? "",
              refundedBy: "Finance",
              note: this.optionalString(item.note) || ""
            }
          }
        });
        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: PaymentStatus.REFUNDED,
            status: OrderStatus.REFUNDED,
            statusHistory: { create: { status: OrderStatus.REFUNDED, note: `Refund processed from admin: ${savedRefund.id}` } }
          }
        });
        const amount = Number(savedRefund.amount ?? order.total);
        if (String(savedRefund.refundMethod || "").toLowerCase().includes("wallet")) {
          const wallet = await this.prisma.wallet.upsert({
            where: { customerId: customer.id },
            update: {},
            create: { customerId: customer.id, balance: 0 }
          });
          await this.prisma.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: amount } } });
          await this.prisma.walletTransaction.create({
            data: { walletId: wallet.id, type: "Refund credit", amount, note: `Refund ${savedRefund.id} for ${order.orderNumber}` }
          });
        }
        await this.createRefundCreditNote(savedRefund.id, order.orderNumber, data.customerName, amount);
        await this.queueCustomerNotification(customer, {
          event: "REFUND_PROCESSED",
          title: `Refund processed for ${order.orderNumber}`,
          message: `Your refund for ${order.orderNumber} has been processed for ${this.formatNumberMoney(amount)}.`,
          target: "/orders",
          orderNumber: order.orderNumber
        });
      } else if (savedRefund.status === RefundStatus.APPROVED && existingRefund?.status !== RefundStatus.APPROVED) {
        await this.queueCustomerNotification(customer, {
          event: "REFUND_APPROVED",
          title: `Refund approved for ${order.orderNumber}`,
          message: `Your refund request for ${order.orderNumber} is approved and waiting for finance processing.`,
          target: "/orders",
          orderNumber: order.orderNumber
        });
      }
    }
    await this.recordAudit(adminUserId, "REFUNDS_STATE_SAVED", "RefundRequest", undefined, { count: items.length });
    return this.listRefundState();
  }

  private async listRefundReturnState() {
    const returns = await this.prisma.refundReturnPickup.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
    return returns.map((item) => ({
      id: item.id,
      refundId: item.refundId,
      orderId: item.orderId,
      customer: item.customer,
      items: item.items,
      status: item.status,
      slot: item.slot ?? "",
      rider: item.rider ?? "",
      address: item.address ?? "",
      condition: item.condition ?? "",
      restockDecision: item.restockDecision ?? "Needs manager review",
      batch: item.batch ?? "",
      expiry: item.expiry ?? "",
      inventoryNote: item.inventoryNote ?? ""
    }));
  }

  private async saveRefundReturnState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const id = this.optionalString(item.id) || `RET-${Date.now()}`;
      await this.prisma.refundReturnPickup.upsert({
        where: { id },
        update: this.refundReturnData(item),
        create: { id, ...this.refundReturnData(item) }
      });
    }
    await this.recordAudit(adminUserId, "REFUND_RETURNS_STATE_SAVED", "RefundReturnPickup", undefined, { count: this.arrayRecords(state).length });
    return this.listRefundReturnState();
  }

  private refundReturnData(item: BodyRecord) {
    return {
      refundId: this.requiredString(item.refundId, "Refund ID"),
      orderId: this.requiredString(item.orderId, "Order ID"),
      customer: this.requiredString(item.customer, "Return customer"),
      items: this.requiredString(item.items, "Return items"),
      status: this.optionalString(item.status) || "Pickup pending",
      slot: this.optionalString(item.slot) || null,
      rider: this.optionalString(item.rider) || null,
      address: this.optionalString(item.address) || null,
      condition: this.optionalString(item.condition) || null,
      restockDecision: this.optionalString(item.restockDecision) || null,
      batch: this.optionalString(item.batch) || null,
      expiry: this.optionalString(item.expiry) || null,
      inventoryNote: this.optionalString(item.inventoryNote) || null
    };
  }

  private async listRefundRuleState() {
    const rules = await this.prisma.refundApprovalRule.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
    return rules.map((rule) => ({
      id: rule.id,
      name: rule.name,
      trigger: rule.trigger,
      limit: rule.limit,
      evidenceRequired: rule.evidenceRequired,
      ownerApproval: rule.ownerApproval,
      autoApprove: rule.autoApprove,
      sla: rule.sla ?? "",
      status: rule.status
    }));
  }

  private async saveRefundRuleState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const id = this.optionalString(item.id) || `RR-${Date.now()}`;
      await this.prisma.refundApprovalRule.upsert({
        where: { id },
        update: this.refundRuleData(item),
        create: { id, ...this.refundRuleData(item) }
      });
    }
    await this.recordAudit(adminUserId, "REFUND_RULES_STATE_SAVED", "RefundApprovalRule", undefined, { count: this.arrayRecords(state).length });
    return this.listRefundRuleState();
  }

  private refundRuleData(item: BodyRecord) {
    return {
      name: this.requiredString(item.name, "Refund rule name"),
      trigger: this.requiredString(item.trigger, "Refund rule trigger"),
      limit: this.optionalString(item.limit) || "Rs. 0",
      evidenceRequired: this.booleanFromInput(item.evidenceRequired),
      ownerApproval: this.booleanFromInput(item.ownerApproval),
      autoApprove: this.booleanFromInput(item.autoApprove),
      sla: this.optionalString(item.sla) || null,
      status: this.optionalString(item.status) || "Active"
    };
  }

  private async getRefundSettingsState() {
    const settings = await this.prisma.refundSettings.findUnique({ where: { key: "default" } });
    return {
      autoApproveLimit: settings?.autoApproveLimit ?? "Rs. 0",
      ownerApprovalLimit: settings?.ownerApprovalLimit ?? "Rs. 0",
      evidencePolicy: settings?.evidencePolicy ?? "",
      walletCredit: settings?.walletCredit ?? false,
      returnPickupThreshold: settings?.returnPickupThreshold ?? "Rs. 0",
      financeSla: settings?.financeSla ?? "",
      customerMessageChannel: settings?.customerMessageChannel ?? "WhatsApp"
    };
  }

  private async saveRefundSettingsState(adminUserId: string, state: unknown) {
    const item = this.asRecord(state);
    const data = {
      autoApproveLimit: this.optionalString(item.autoApproveLimit) || "Rs. 0",
      ownerApprovalLimit: this.optionalString(item.ownerApprovalLimit) || "Rs. 0",
      evidencePolicy: this.optionalString(item.evidencePolicy) || null,
      walletCredit: this.booleanFromInput(item.walletCredit),
      returnPickupThreshold: this.optionalString(item.returnPickupThreshold) || "Rs. 0",
      financeSla: this.optionalString(item.financeSla) || null,
      customerMessageChannel: this.optionalString(item.customerMessageChannel) || "WhatsApp"
    };
    await this.prisma.refundSettings.upsert({ where: { key: "default" }, update: data, create: { key: "default", ...data } });
    await this.recordAudit(adminUserId, "REFUND_SETTINGS_SAVED", "RefundSettings", undefined);
    return this.getRefundSettingsState();
  }

  private async listFinancePaymentState() {
    const payments = await this.prisma.payment.findMany({ include: { order: true }, orderBy: { updatedAt: "desc" }, take: 100 });
    return payments.map((payment) => ({
      id: payment.id,
      orderId: payment.order.orderNumber,
      customer: this.snapshotValue(payment.order.deliveryAddressSnapshot, "customer", "Customer"),
      phone: this.snapshotValue(payment.order.deliveryAddressSnapshot, "phone", ""),
      method: this.paymentMethodToLabel(payment.method),
      status: this.paymentStatusToLabel(payment.status),
      gatewayId: payment.providerRef ?? "",
      amount: this.formatMoney(payment.amount),
      time: payment.paidAt ? this.dateOnly(payment.paidAt) : this.dateOnly(payment.createdAt),
      gateway: this.paymentGatewayLabel(payment.method),
      failureReason: payment.status === "FAILED" ? this.readPayload(payment.metadata, "failureReason", "Payment failed") : "",
      reconciliation: payment.status === "PAID" ? "Matched" : "Open",
      owner: this.readPayload(payment.metadata, "owner", "Finance"),
      note: this.readPayload(payment.metadata, "note", "")
    }));
  }

  private async saveFinancePaymentState(adminUserId: string, state: unknown) {
    const items = this.arrayRecords(state);
    if (items.some((item) => {
      const status = this.labelToPaymentStatus(item.status);
      return status === PaymentStatus.PAID || status === PaymentStatus.REFUNDED;
    })) {
      await this.assertAdminPermission(adminUserId, "finance.reconcile");
    }

    for (const item of items) {
      const order = await this.findOrCreateOrderByNumber(this.optionalString(item.orderId) || this.optionalString(item.order) || `FC-${Date.now()}`);
      const paymentStatus = this.labelToPaymentStatus(item.status);
      const paymentMethod = this.labelToPaymentMethod(item.method);
      const paidAt = paymentStatus === PaymentStatus.PAID ? new Date() : null;
      const paymentId = this.optionalString(item.id);
      const existingPayment = paymentId ? await this.prisma.payment.findUnique({ where: { id: paymentId } }) : null;
      const paymentData = {
        orderId: order.id,
        method: paymentMethod,
        status: paymentStatus,
        amount: this.moneyFromInput(item.amount, "Payment amount"),
        providerRef: this.optionalString(item.gatewayId) || null,
        paidAt: paidAt ?? existingPayment?.paidAt ?? null,
        metadata: {
          gateway: this.optionalString(item.gateway) || "",
          failureReason: this.optionalString(item.failureReason) || "",
          reconciliation: this.optionalString(item.reconciliation) || "",
          owner: this.optionalString(item.owner) || "",
          note: this.optionalString(item.note) || ""
        }
      };
      await this.prisma.payment.upsert({
        where: { id: paymentId || "__missing__" },
        update: paymentData,
        create: paymentData
      }).catch(async () => {
        await this.prisma.payment.create({ data: paymentData });
      });
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus,
          statusHistory: {
            create: { status: order.status, note: `Payment marked ${this.paymentStatusToLabel(paymentStatus)} from finance module` }
          }
        }
      });
      if (order.customerId && (paymentStatus === PaymentStatus.PAID || paymentStatus === PaymentStatus.FAILED || paymentStatus === PaymentStatus.REFUNDED)) {
        const customer = await this.prisma.customer.findUnique({ where: { id: order.customerId } });
        if (customer) {
          await this.queueCustomerNotification(customer, {
            event: `PAYMENT_${paymentStatus}`,
            title: `Payment ${this.paymentStatusToLabel(paymentStatus).toLowerCase()} for ${order.orderNumber}`,
            message: `Payment for ${order.orderNumber} is now ${this.paymentStatusToLabel(paymentStatus).toLowerCase()}.`,
            target: "/orders",
            orderNumber: order.orderNumber
          });
        }
      }
    }
    await this.recordAudit(adminUserId, "FINANCE_PAYMENTS_STATE_SAVED", "Payment", undefined, { count: items.length });
    return this.listFinancePaymentState();
  }

  private async listFinanceRefundState() {
    const refunds = await this.prisma.refundRequest.findMany({ include: { order: true }, orderBy: { updatedAt: "desc" }, take: 100 });
    return refunds.map((refund) => ({
      id: refund.id,
      orderId: refund.order.orderNumber,
      customer: refund.customerName ?? this.snapshotValue(refund.order.deliveryAddressSnapshot, "customer", "Customer"),
      amount: refund.amount ? this.formatMoney(refund.amount) : this.formatMoney(refund.order.total),
      method: refund.refundMethod ?? "Original payment",
      gatewayStatus: refund.gatewayStatus ?? "Not started",
      walletCredit: String(refund.refundMethod || "").toLowerCase().includes("wallet") ? this.formatMoney(refund.amount ?? refund.order.total) : "Rs. 0",
      adjustment: refund.financeStatus ?? "Not started",
      status: this.refundStatusToFinanceLabel(refund.status, refund.refundMethod),
      reconciliation: refund.status === RefundStatus.PROCESSED ? "Matched" : "Open",
      transactionId: refund.transactionId ?? "Pending",
      note: refund.adminNote ?? refund.note ?? ""
    }));
  }

  private async saveFinanceRefundState(adminUserId: string, state: unknown) {
    await this.saveRefundState(adminUserId, state);
    return this.listFinanceRefundState();
  }

  private async listFinanceCodState() {
    const collections = await this.prisma.financeCodCollection.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
    return collections.map((item) => ({
      id: item.id,
      rider: item.rider,
      phone: item.phone ?? "",
      orders: item.orders,
      collected: this.formatMoney(item.collected),
      submitted: this.formatMoney(item.submitted),
      difference: this.formatMoney(item.difference),
      status: item.status,
      settlementTime: item.settlementTime ?? "",
      proof: item.proof,
      owner: item.owner ?? "",
      note: item.note ?? ""
    }));
  }

  private async saveFinanceCodState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const id = this.optionalString(item.id) || `COD-${Date.now()}`;
      const data = {
        rider: this.requiredString(item.rider, "Rider"),
        phone: this.optionalString(item.phone) || null,
        orders: this.integerFromInput(item.orders),
        collected: this.moneyFromInput(item.collected, "Collected amount"),
        submitted: this.moneyFromInput(item.submitted, "Submitted amount"),
        difference: this.moneyFromInput(item.difference, "COD difference"),
        status: this.optionalString(item.status) || "Pending collection",
        settlementTime: this.optionalString(item.settlementTime) || null,
        proof: this.optionalString(item.proof) || "Missing",
        owner: this.optionalString(item.owner) || null,
        note: this.optionalString(item.note) || null
      };
      await this.prisma.financeCodCollection.upsert({ where: { id }, update: data, create: { id, ...data } });
    }
    await this.recordAudit(adminUserId, "FINANCE_COD_STATE_SAVED", "FinanceCodCollection", undefined, { count: this.arrayRecords(state).length });
    return this.listFinanceCodState();
  }

  private async listFinanceSettlementState() {
    const settlements = await this.prisma.financeSettlement.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
    return settlements.map((item) => ({
      id: item.id,
      gateway: item.gateway,
      batchDate: item.batchDate ?? "",
      expectedDate: item.expectedDate ?? "",
      gross: this.formatMoney(item.gross),
      charges: this.formatMoney(item.charges),
      deductions: this.formatMoney(item.deductions),
      net: this.formatMoney(item.net),
      received: this.formatMoney(item.received),
      difference: this.formatMoney(item.difference),
      status: item.status,
      bankReference: item.bankReference ?? "",
      note: item.note ?? ""
    }));
  }

  private async saveFinanceSettlementState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const id = this.optionalString(item.id) || `SET-${Date.now()}`;
      const data = this.financeSettlementData(item);
      await this.prisma.financeSettlement.upsert({ where: { id }, update: data, create: { id, ...data } });
    }
    await this.recordAudit(adminUserId, "FINANCE_SETTLEMENTS_STATE_SAVED", "FinanceSettlement", undefined, { count: this.arrayRecords(state).length });
    return this.listFinanceSettlementState();
  }

  private financeSettlementData(item: BodyRecord) {
    return {
      gateway: this.requiredString(item.gateway, "Gateway"),
      batchDate: this.optionalString(item.batchDate) || null,
      expectedDate: this.optionalString(item.expectedDate) || null,
      gross: this.moneyFromInput(item.gross, "Settlement gross"),
      charges: this.moneyFromInput(item.charges, "Settlement charges"),
      deductions: this.moneyFromInput(item.deductions, "Settlement deductions"),
      net: this.moneyFromInput(item.net, "Settlement net"),
      received: this.moneyFromInput(item.received, "Settlement received"),
      difference: this.moneyFromInput(item.difference, "Settlement difference"),
      status: this.optionalString(item.status) || "Pending",
      bankReference: this.optionalString(item.bankReference) || null,
      note: this.optionalString(item.note) || null
    };
  }

  private async listFinanceExpenseState() {
    const expenses = await this.prisma.financeExpense.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
    return expenses.map((item) => ({
      id: item.id,
      category: item.category,
      vendor: item.vendor,
      amount: this.formatMoney(item.amount),
      method: item.method,
      paidDate: item.paidDate ?? "",
      dueDate: item.dueDate ?? "",
      receipt: item.receipt,
      status: item.status,
      note: item.note ?? ""
    }));
  }

  private async saveFinanceExpenseState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const id = this.optionalString(item.id) || `EXP-${Date.now()}`;
      const data = this.financeExpenseData(item);
      await this.prisma.financeExpense.upsert({ where: { id }, update: data, create: { id, ...data } });
    }
    await this.recordAudit(adminUserId, "FINANCE_EXPENSES_STATE_SAVED", "FinanceExpense", undefined, { count: this.arrayRecords(state).length });
    return this.listFinanceExpenseState();
  }

  private financeExpenseData(item: BodyRecord) {
    return {
      category: this.requiredString(item.category, "Expense category"),
      vendor: this.requiredString(item.vendor, "Expense vendor"),
      amount: this.moneyFromInput(item.amount, "Expense amount"),
      method: this.optionalString(item.method) || "Manual payment",
      paidDate: this.optionalString(item.paidDate) || null,
      dueDate: this.optionalString(item.dueDate) || null,
      receipt: this.optionalString(item.receipt) || "Missing",
      status: this.optionalString(item.status) || "Draft",
      note: this.optionalString(item.note) || null
    };
  }

  private async listFinanceInvoiceState() {
    const invoices = await this.prisma.financeInvoice.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
    return invoices.map((item) => ({
      id: item.id,
      reference: item.reference,
      party: item.party,
      type: item.type,
      amount: this.formatMoney(item.amount),
      tax: this.formatMoney(item.tax),
      date: item.date ?? "",
      status: item.status,
      downloadUrl: item.downloadUrl ?? "",
      sentStatus: item.sentStatus ?? "",
      note: item.note ?? ""
    }));
  }

  private async saveFinanceInvoiceState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const id = this.optionalString(item.id) || `INV-${Date.now()}`;
      const data = this.financeInvoiceData(item);
      await this.prisma.financeInvoice.upsert({ where: { id }, update: data, create: { id, ...data } });
    }
    await this.recordAudit(adminUserId, "FINANCE_INVOICES_STATE_SAVED", "FinanceInvoice", undefined, { count: this.arrayRecords(state).length });
    return this.listFinanceInvoiceState();
  }

  private async createRefundCreditNote(refundId: string, orderNumber: string, party: string, amount: number) {
    await this.prisma.financeInvoice.upsert({
      where: { id: `CN-${refundId}` },
      update: {
        reference: orderNumber,
        party,
        type: "Refund credit note",
        amount,
        tax: 0,
        date: this.dateOnly(new Date()),
        status: "Credit note issued",
        sentStatus: "Ready",
        note: `Credit note generated for refund ${refundId}`
      },
      create: {
        id: `CN-${refundId}`,
        reference: orderNumber,
        party,
        type: "Refund credit note",
        amount,
        tax: 0,
        date: this.dateOnly(new Date()),
        status: "Credit note issued",
        sentStatus: "Ready",
        note: `Credit note generated for refund ${refundId}`
      }
    });
  }

  private async queueCustomerNotification(
    customer: { id: string; firstName: string | null; lastName: string | null; phone: string | null; email: string | null },
    options: { event: string; title: string; message: string; target: string; orderNumber?: string }
  ) {
    const preferences = await this.prisma.customerNotificationPreference.findUnique({ where: { customerId: customer.id } });
    const payload: Prisma.JsonObject = {
      customerId: customer.id,
      customer: this.customerName(customer),
      audience: this.customerName(customer),
      event: options.event,
      message: options.message,
      target: options.target,
      orderNumber: options.orderNumber ?? ""
    };
    const jobs: Array<{ channel: NotificationChannel; recipient: string; subject: string; payload: Prisma.JsonObject }> = [
      { channel: NotificationChannel.IN_APP, recipient: customer.id, subject: options.title, payload }
    ];
    if ((preferences?.email ?? true) && customer.email) jobs.push({ channel: NotificationChannel.EMAIL, recipient: customer.email, subject: options.title, payload });
    if ((preferences?.whatsapp ?? true) && customer.phone) {
      jobs.push({ channel: NotificationChannel.WHATSAPP, recipient: customer.phone, subject: options.title, payload });
    }
    if ((preferences?.sms ?? false) && customer.phone) jobs.push({ channel: NotificationChannel.SMS, recipient: customer.phone, subject: options.title, payload });
    await Promise.all(jobs.map((job) => this.prisma.notificationJob.create({ data: job })));
  }

  private financeInvoiceData(item: BodyRecord) {
    return {
      reference: this.requiredString(item.reference, "Invoice reference"),
      party: this.requiredString(item.party, "Invoice party"),
      type: this.optionalString(item.type) || "Customer invoice",
      amount: this.moneyFromInput(item.amount, "Invoice amount"),
      tax: this.moneyFromInput(item.tax, "Invoice tax"),
      date: this.optionalString(item.date) || null,
      status: this.optionalString(item.status) || "Generated",
      downloadUrl: this.optionalString(item.downloadUrl) || null,
      sentStatus: this.optionalString(item.sentStatus) || null,
      note: this.optionalString(item.note) || null
    };
  }

  private async listFinanceReportState() {
    const reports = await this.prisma.financeReportExport.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
    return reports.map((item) => ({
      id: item.id,
      title: item.title,
      format: item.format,
      status: item.status,
      dateRange: item.dateRange ?? "",
      owner: item.owner ?? ""
    }));
  }

  private async saveFinanceReportState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const id = this.optionalString(item.id) || `FIN-RP-${Date.now()}`;
      await this.prisma.financeReportExport.upsert({
        where: { id },
        update: this.financeReportData(item),
        create: { id, ...this.financeReportData(item) }
      });
    }
    await this.recordAudit(adminUserId, "FINANCE_REPORTS_STATE_SAVED", "FinanceReportExport", undefined, { count: this.arrayRecords(state).length });
    return this.listFinanceReportState();
  }

  private financeReportData(item: BodyRecord) {
    return {
      title: this.requiredString(item.title, "Report title"),
      format: this.optionalString(item.format) || "XLSX",
      status: this.optionalString(item.status) || "Processing",
      dateRange: this.optionalString(item.dateRange) || null,
      owner: this.optionalString(item.owner) || null
    };
  }

  private async getReportPreference() {
    return this.prisma.businessReportPreference.upsert({
      where: { key: "default" },
      update: {},
      create: { key: "default" }
    });
  }

  private async getReportRangeState() {
    const preference = await this.getReportPreference();
    return preference.range;
  }

  private async saveReportRangeState(adminUserId: string, state: unknown) {
    const range = this.optionalString(state) || "7 days";
    await this.prisma.businessReportPreference.upsert({
      where: { key: "default" },
      update: { range },
      create: { key: "default", range }
    });
    await this.recordAudit(adminUserId, "REPORT_RANGE_SAVED", "BusinessReportPreference", undefined, { range });
    return this.getReportRangeState();
  }

  private async getReportFilterState() {
    const preference = await this.getReportPreference();
    return {
      category: preference.category,
      payment: preference.payment,
      zone: preference.zone,
      segment: preference.segment
    };
  }

  private async saveReportFilterState(adminUserId: string, state: unknown) {
    const item = this.asRecord(state);
    const data = {
      category: this.optionalString(item.category) || "All categories",
      payment: this.optionalString(item.payment) || "All payments",
      zone: this.optionalString(item.zone) || "All zones",
      segment: this.optionalString(item.segment) || "All customers"
    };
    await this.prisma.businessReportPreference.upsert({
      where: { key: "default" },
      update: data,
      create: { key: "default", ...data }
    });
    await this.recordAudit(adminUserId, "REPORT_FILTERS_SAVED", "BusinessReportPreference", undefined, data);
    return this.getReportFilterState();
  }

  private async listReportExportState() {
    const exports = await this.prisma.businessReportExport.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
    return exports.map((item) => ({
      id: item.id,
      title: item.title,
      format: item.format,
      status: item.status,
      time: item.time ?? ""
    }));
  }

  private async saveReportExportState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const id = this.optionalString(item.id) || `RP-${Date.now()}`;
      await this.prisma.businessReportExport.upsert({
        where: { id },
        update: this.businessReportExportData(item),
        create: { id, ...this.businessReportExportData(item) }
      });
    }
    await this.recordAudit(adminUserId, "REPORT_EXPORTS_SAVED", "BusinessReportExport", undefined, { count: this.arrayRecords(state).length });
    return this.listReportExportState();
  }

  private businessReportExportData(item: BodyRecord) {
    return {
      title: this.requiredString(item.title, "Report title"),
      format: this.optionalString(item.format) || "PDF",
      status: this.optionalString(item.status) || "Processing",
      time: this.optionalString(item.time) || null
    };
  }

  private async getFinanceTaxSettingsState() {
    const settings = await this.prisma.financeTaxSettings.findUnique({ where: { key: "default" } });
    return {
      gstCollected: this.formatMoney(settings?.gstCollected ?? 0),
      taxableSales: this.formatMoney(settings?.taxableSales ?? 0),
      exemptSales: this.formatMoney(settings?.exemptSales ?? 0),
      hsnSummary: settings?.hsnSummary ?? "",
      invoiceCount: settings?.invoiceCount ?? "0",
      creditNoteCount: settings?.creditNoteCount ?? "0",
      reviewOwner: settings?.reviewOwner ?? ""
    };
  }

  private async saveFinanceTaxSettingsState(adminUserId: string, state: unknown) {
    const item = this.asRecord(state);
    const data = {
      gstCollected: this.moneyFromInput(item.gstCollected, "GST collected"),
      taxableSales: this.moneyFromInput(item.taxableSales, "Taxable sales"),
      exemptSales: this.moneyFromInput(item.exemptSales, "Exempt sales"),
      hsnSummary: this.optionalString(item.hsnSummary) || null,
      invoiceCount: this.optionalString(item.invoiceCount) || "0",
      creditNoteCount: this.optionalString(item.creditNoteCount) || "0",
      reviewOwner: this.optionalString(item.reviewOwner) || null
    };
    await this.prisma.financeTaxSettings.upsert({ where: { key: "default" }, update: data, create: { key: "default", ...data } });
    await this.recordAudit(adminUserId, "FINANCE_TAX_SETTINGS_SAVED", "FinanceTaxSettings", undefined);
    return this.getFinanceTaxSettingsState();
  }

  private async listNotificationState() {
    const notifications = await this.prisma.notificationJob.findMany({ orderBy: [{ scheduledAt: "desc" }, { updatedAt: "desc" }], take: 100 });
    return notifications.map((item) => ({
      id: item.id,
      title: item.subject ?? "Notification",
      message: this.readPayload(item.payload, "message", ""),
      channel: this.notificationChannelToLabel(item.channel),
      audience: this.readPayload(item.payload, "audience", item.recipient),
      status: this.notificationStatusToLabel(item.status),
      schedule: item.scheduledAt ? this.dateOnly(item.scheduledAt) : "Now",
      recipients: 1,
      openRate: this.readPayload(item.payload, "openRate", "-"),
      clickRate: this.readPayload(item.payload, "clickRate", "-"),
      owner: "Admin",
      target: this.readPayload(item.payload, "target", ""),
      priority: this.readPayload(item.payload, "priority", "Normal")
    }));
  }

  private async saveNotificationState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const id = this.optionalString(item.id);
      const audience = this.optionalString(item.audience) || "All customers";
      const data = {
        channel: this.labelToNotificationChannel(item.channel),
        status: this.labelToNotificationStatus(item.status),
        recipient: this.resolveNotificationRecipient(item),
        subject: this.optionalString(item.title) || "Notification",
        payload: {
          message: this.optionalString(item.message) || "",
          audience,
          target: this.optionalString(item.target) || "",
          priority: this.optionalString(item.priority) || "Normal",
          openRate: this.optionalString(item.openRate) || "-",
          clickRate: this.optionalString(item.clickRate) || "-",
          recipients: this.integerFromInput(item.recipients)
        },
        scheduledAt: this.optionalDate(item.schedule)
      };
      if (id && !id.startsWith("NTF-")) await this.prisma.notificationJob.update({ where: { id }, data });
      else await this.prisma.notificationJob.create({ data });
    }
    await this.recordAudit(adminUserId, "NOTIFICATIONS_STATE_SAVED", "NotificationJob", undefined, { count: this.arrayRecords(state).length });
    return this.listNotificationState();
  }

  private async dispatchNotificationJob(id: string) {
    const job = await this.prisma.notificationJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException("Notification job was not found.");
    if (job.status === NotificationStatus.CANCELLED || job.status === NotificationStatus.SKIPPED) {
      throw new BadRequestException("Cancelled or skipped notifications cannot be sent.");
    }
    const failureReason = this.localNotificationFailureReason(job);
    const providerRef = failureReason ? null : `LOCAL-${job.channel}-${Date.now().toString(36).toUpperCase()}`;
    await this.prisma.notificationDeliveryAttempt.create({
      data: {
        notificationJobId: job.id,
        channel: job.channel,
        recipient: job.recipient,
        status: failureReason ? "FAILED" : "SENT",
        error: failureReason,
        providerRef
      }
    });
    if (failureReason) {
      await this.prisma.notificationJob.update({
        where: { id: job.id },
        data: { status: NotificationStatus.FAILED, sentAt: null }
      });
      await this.prisma.notificationFailure.create({
        data: {
          customer: this.readPayload(job.payload, "audience", job.recipient),
          channel: job.channel,
          reason: failureReason,
          time: this.dateOnly(new Date()),
          status: "Open"
        }
      });
      return { id: job.id, status: "FAILED", error: failureReason };
    }
    await this.prisma.notificationJob.update({
      where: { id: job.id },
      data: { status: NotificationStatus.SENT, sentAt: new Date() }
    });
    return { id: job.id, status: "SENT", providerRef };
  }

  private localNotificationFailureReason(job: { channel: NotificationChannel; recipient: string }) {
    if (!job.recipient.trim()) return "Recipient is missing.";
    if (job.recipient.startsWith("segment:")) return null;
    if (job.channel === NotificationChannel.EMAIL && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(job.recipient)) return "Email recipient is invalid.";
    if ((job.channel === NotificationChannel.SMS || job.channel === NotificationChannel.WHATSAPP) && job.recipient.replace(/\D/g, "").length < 10) {
      return "Phone recipient is invalid.";
    }
    return null;
  }

  private resolveNotificationRecipient(item: BodyRecord) {
    const explicitRecipient = this.optionalString(item.recipient);
    if (explicitRecipient) return explicitRecipient;
    const audience = this.optionalString(item.audience) || "All customers";
    const target = this.optionalString(item.target) || "";
    if (target.includes("@") || target.replace(/\D/g, "").length >= 10) return target;
    return `segment:${audience.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "all-customers"}`;
  }

  private async listNotificationFailureState() {
    const failures = await this.prisma.notificationFailure.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
    return failures.map((failure) => ({
      id: failure.id,
      customer: failure.customer,
      channel: this.notificationChannelToLabel(failure.channel),
      reason: failure.reason,
      time: failure.time ?? this.dateOnly(failure.updatedAt),
      status: failure.status
    }));
  }

  private async saveNotificationFailureState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const id = this.optionalString(item.id) || `NF-${Date.now()}`;
      await this.prisma.notificationFailure.upsert({
        where: { id },
        update: {
          customer: this.requiredString(item.customer, "Customer"),
          channel: this.labelToNotificationChannel(item.channel),
          reason: this.requiredString(item.reason, "Failure reason"),
          time: this.optionalString(item.time) || null,
          status: this.optionalString(item.status) || "Open"
        },
        create: {
          id,
          customer: this.requiredString(item.customer, "Customer"),
          channel: this.labelToNotificationChannel(item.channel),
          reason: this.requiredString(item.reason, "Failure reason"),
          time: this.optionalString(item.time) || null,
          status: this.optionalString(item.status) || "Open"
        }
      });
    }
    await this.recordAudit(adminUserId, "NOTIFICATION_FAILURES_STATE_SAVED", "NotificationFailure", undefined, { count: this.arrayRecords(state).length });
    return this.listNotificationFailureState();
  }

  private async listNotificationAutomationRuleState() {
    const rules = await this.prisma.notificationAutomationRule.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
    return rules.map((rule) => ({
      name: rule.name,
      trigger: rule.trigger,
      channel: this.notificationChannelToLabel(rule.channel),
      template: rule.template,
      delay: rule.delay,
      active: rule.active,
      lastRun: rule.lastRun ?? "Never",
      failures: rule.failures
    }));
  }

  private async saveNotificationAutomationRuleState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const name = this.requiredString(item.name, "Automation name");
      await this.prisma.notificationAutomationRule.upsert({
        where: { name },
        update: this.notificationAutomationRuleData(item),
        create: { name, ...this.notificationAutomationRuleData(item) }
      });
    }
    await this.recordAudit(adminUserId, "NOTIFICATION_AUTOMATION_RULES_STATE_SAVED", "NotificationAutomationRule", undefined, { count: this.arrayRecords(state).length });
    return this.listNotificationAutomationRuleState();
  }

  private notificationAutomationRuleData(item: BodyRecord) {
    return {
      trigger: this.requiredString(item.trigger, "Automation trigger"),
      channel: this.labelToNotificationChannel(item.channel),
      template: this.requiredString(item.template, "Automation template"),
      delay: this.optionalString(item.delay) || "Immediate",
      active: this.booleanFromInput(item.active),
      lastRun: this.optionalString(item.lastRun) || null,
      failures: this.integerFromInput(item.failures)
    };
  }

  private async listContentState() {
    const pages = await this.prisma.contentPage.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
    return pages.map((page) => ({
      id: page.id,
      title: page.title,
      slug: page.slug,
      type: "Page",
      placement: page.slug,
      status: page.status === "PUBLISHED" || page.status === "LIVE" ? "Published" : "Draft",
      owner: "Admin",
      updated: this.dateOnly(page.updatedAt),
      seo: page.summary ?? "",
      content: JSON.stringify(page.body)
    }));
  }

  private async saveContentState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const title = this.requiredString(item.title, "Content title");
      const slug = this.optionalString(item.slug) || this.slugify(title);
      await this.prisma.contentPage.upsert({
        where: { slug },
        update: {
          title,
          summary: this.optionalString(item.seo) ?? null,
          status: this.optionalString(item.status) === "Published" ? "PUBLISHED" : "DRAFT",
          body: { content: this.optionalString(item.content) || title }
        },
        create: {
          slug,
          title,
          summary: this.optionalString(item.seo) ?? null,
          status: this.optionalString(item.status) === "Published" ? "PUBLISHED" : "DRAFT",
          body: { content: this.optionalString(item.content) || title }
        }
      });
    }
    await this.recordAudit(adminUserId, "CONTENT_STATE_SAVED", "ContentPage", undefined, { count: this.arrayRecords(state).length });
    return this.listContentState();
  }

  private async listStaffState() {
    const staff = await this.prisma.adminUser.findMany({ include: { roles: { include: { role: true } } }, orderBy: { updatedAt: "desc" } });
    const profiles = await this.prisma.adminStaffProfile.findMany({ where: { adminUserId: { in: staff.map((user) => user.id) } } });
    const profileByUserId = new Map(profiles.map((profile) => [profile.adminUserId, profile]));
    return staff.map((user) => {
      const profile = profileByUserId.get(user.id);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: profile?.phone ?? "",
        role: user.roles[0]?.role.name ?? "Support Agent",
        shift: profile?.shift ?? "Not scheduled",
        status: user.status === "ACTIVE" ? "Active" : user.status === "INVITED" ? "Invited" : "Suspended",
        zone: profile?.zone ?? "Unassigned",
        lastActive: user.lastLoginAt ? this.dateOnly(user.lastLoginAt) : "Never",
        twoFactor: user.twoFactorEnabled,
        performance: profile?.performance ?? "No performance data yet",
        rating: profile?.rating ?? "-"
      };
    });
  }

  private async saveStaffState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const email = this.requiredString(item.email, "Staff email").toLowerCase();
      const user = await this.prisma.adminUser.upsert({
        where: { email },
        update: { name: this.optionalString(item.name) || email, status: this.labelToAdminStatus(item.status), twoFactorEnabled: this.booleanFromInput(item.twoFactor) },
        create: {
          email,
          name: this.optionalString(item.name) || email,
          passwordHash: "scrypt:disabled:disabled",
          status: this.labelToAdminStatus(item.status),
          twoFactorEnabled: this.booleanFromInput(item.twoFactor)
        }
      });
      const roleName = this.optionalString(item.role) || "Support Agent";
      const role = await this.prisma.adminRole.upsert({
        where: { name: roleName },
        update: {},
        create: { name: roleName, description: `${roleName} access role` }
      });
      await this.prisma.adminUserRole.deleteMany({ where: { adminUserId: user.id } });
      await this.prisma.adminUserRole.create({ data: { adminUserId: user.id, roleId: role.id } });
      await this.prisma.adminStaffProfile.upsert({
        where: { adminUserId: user.id },
        update: this.staffProfileData(item),
        create: { adminUserId: user.id, ...this.staffProfileData(item) }
      });
    }
    await this.recordAudit(adminUserId, "STAFF_STATE_SAVED", "AdminUser", undefined, { count: this.arrayRecords(state).length });
    return this.listStaffState();
  }

  private staffProfileData(item: BodyRecord) {
    return {
      phone: this.optionalString(item.phone) || null,
      shift: this.optionalString(item.shift) || null,
      zone: this.optionalString(item.zone) || null,
      performance: this.optionalString(item.performance) || null,
      rating: this.optionalString(item.rating) || null
    };
  }

  private async listStaffRoleState() {
    const roles = await this.prisma.adminRole.findMany({
      include: { permissions: { include: { permission: true } }, users: true },
      orderBy: { name: "asc" }
    });
    return roles.map((role) => ({
      role: role.name,
      users: role.users.length,
      access: role.description ?? "Custom admin access",
      permissions: role.permissions.map((item) => item.permission.module || item.permission.label)
    }));
  }

  private async saveStaffRoleState(adminUserId: string, state: unknown) {
    await this.assertAdminPermission(adminUserId, "staff.roles.manage");
    const items = this.arrayRecords(state);

    for (const item of items) {
      const name = this.requiredString(item.role ?? item.name, "Role name");
      const role = await this.prisma.adminRole.upsert({
        where: { name },
        update: { description: this.optionalString(item.access ?? item.description) ?? null },
        create: { name, description: this.optionalString(item.access ?? item.description) ?? null }
      });
      const permissions = Array.isArray(item.permissions) ? item.permissions.map(String).filter(Boolean) : [];
      await this.prisma.adminRolePermission.deleteMany({ where: { roleId: role.id } });
      for (const permissionName of permissions) {
        const permission = await this.prisma.adminPermission.upsert({
          where: { key: this.slugify(permissionName) },
          update: { label: permissionName, module: permissionName },
          create: { key: this.slugify(permissionName), label: permissionName, module: permissionName }
        });
        await this.prisma.adminRolePermission.create({ data: { roleId: role.id, permissionId: permission.id } });
      }
    }
    await this.recordAudit(adminUserId, "STAFF_ROLES_STATE_SAVED", "AdminRole", undefined, { count: items.length });
    return this.listStaffRoleState();
  }

  private async listStaffShiftState() {
    const shifts = await this.prisma.adminStaffShift.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
    return shifts.map((shift) => ({
      id: shift.id,
      name: shift.name,
      role: shift.role,
      shift: shift.shift,
      zone: shift.zone,
      state: shift.state
    }));
  }

  private async saveStaffShiftState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const id = this.optionalString(item.id) || `SHIFT-${Date.now()}`;
      await this.prisma.adminStaffShift.upsert({
        where: { id },
        update: this.staffShiftData(item),
        create: { id, ...this.staffShiftData(item) }
      });
    }
    await this.recordAudit(adminUserId, "STAFF_SHIFTS_STATE_SAVED", "AdminStaffShift", undefined, { count: this.arrayRecords(state).length });
    return this.listStaffShiftState();
  }

  private staffShiftData(item: BodyRecord) {
    return {
      staffId: this.optionalString(item.staffId) || null,
      name: this.requiredString(item.name, "Shift staff name"),
      role: this.requiredString(item.role, "Shift role"),
      shift: this.requiredString(item.shift, "Shift time"),
      zone: this.requiredString(item.zone, "Shift zone"),
      state: this.optionalString(item.state) || "Scheduled"
    };
  }

  private async listStaffActivityState() {
    const activities = await this.prisma.adminStaffActivity.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
    return activities.map((activity) => ({
      id: activity.id,
      staff: activity.staff,
      action: activity.action,
      module: activity.module,
      risk: activity.risk,
      time: activity.time ?? this.dateOnly(activity.updatedAt)
    }));
  }

  private async saveStaffActivityState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const id = this.optionalString(item.id) || `AC-${Date.now()}`;
      await this.prisma.adminStaffActivity.upsert({
        where: { id },
        update: this.staffActivityData(item),
        create: { id, ...this.staffActivityData(item) }
      });
    }
    await this.recordAudit(adminUserId, "STAFF_ACTIVITIES_STATE_SAVED", "AdminStaffActivity", undefined, { count: this.arrayRecords(state).length });
    return this.listStaffActivityState();
  }

  private staffActivityData(item: BodyRecord) {
    return {
      staffId: this.optionalString(item.staffId) || null,
      staff: this.requiredString(item.staff, "Activity staff"),
      action: this.requiredString(item.action, "Activity action"),
      module: this.optionalString(item.module) || "Staff",
      risk: this.optionalString(item.risk)?.replace(" risk", "") || "Low",
      time: this.optionalString(item.time) || null
    };
  }

  private async listAuditState() {
    const logs = await this.prisma.adminAuditLog.findMany({ include: { adminUser: true }, orderBy: { createdAt: "desc" }, take: 100 });
    const reviews = await this.prisma.auditActivityReview.findMany({ where: { auditLogId: { in: logs.map((log) => log.id) } } });
    const reviewByLogId = new Map(reviews.map((review) => [review.auditLogId, review]));
    return logs.map((log) => {
      const review = reviewByLogId.get(log.id);
      return {
        id: log.id,
        admin: review?.admin ?? log.adminUser?.name ?? "System",
        email: review?.email ?? log.adminUser?.email ?? "system@freshcart.local",
        role: review?.role ?? "Admin",
        module: review?.module ?? log.resourceType,
        action: review?.action ?? log.action,
        target: review?.target ?? log.resourceId ?? "-",
        timestamp: review?.timestamp ?? this.dateOnly(log.createdAt),
        status: review?.status ?? "Reviewed",
        ip: review?.ip ?? "-",
        device: review?.device ?? "-",
        location: review?.location ?? "-",
        risk: review?.risk ?? "Low",
        note: review?.note ?? "Recorded from live admin action log."
      };
    });
  }

  private async saveAuditActivityState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const auditLogId = this.requiredString(item.id, "Audit log ID");
      await this.prisma.auditActivityReview.upsert({
        where: { auditLogId },
        update: this.auditActivityReviewData(item),
        create: { auditLogId, ...this.auditActivityReviewData(item) }
      });
    }
    await this.recordAudit(adminUserId, "AUDIT_ACTIVITY_REVIEWS_SAVED", "AuditActivityReview", undefined, { count: this.arrayRecords(state).length });
    return this.listAuditState();
  }

  private auditActivityReviewData(item: BodyRecord) {
    return {
      admin: this.optionalString(item.admin) || null,
      email: this.optionalString(item.email) || null,
      role: this.optionalString(item.role) || null,
      module: this.optionalString(item.module) || null,
      action: this.optionalString(item.action) || null,
      target: this.optionalString(item.target) || null,
      timestamp: this.optionalString(item.timestamp) || null,
      status: this.optionalString(item.status) || "Open",
      ip: this.optionalString(item.ip) || null,
      device: this.optionalString(item.device) || null,
      location: this.optionalString(item.location) || null,
      risk: this.optionalString(item.risk) || "Low",
      note: this.optionalString(item.note) || null
    };
  }

  private async listAuditSecurityState() {
    const events = await this.prisma.auditSecurityEvent.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
    return events.map((item) => ({
      id: item.id,
      admin: item.admin,
      email: item.email,
      eventType: item.eventType,
      result: item.result,
      timestamp: item.timestamp ?? "",
      ip: item.ip ?? "",
      device: item.device ?? "",
      browser: item.browser ?? "",
      location: item.location ?? "",
      risk: item.risk,
      status: item.status,
      note: item.note ?? ""
    }));
  }

  private async saveAuditSecurityState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const id = this.optionalString(item.id) || `ASE-${Date.now()}`;
      await this.prisma.auditSecurityEvent.upsert({ where: { id }, update: this.auditSecurityData(item), create: { id, ...this.auditSecurityData(item) } });
    }
    await this.recordAudit(adminUserId, "AUDIT_SECURITY_EVENTS_SAVED", "AuditSecurityEvent", undefined, { count: this.arrayRecords(state).length });
    return this.listAuditSecurityState();
  }

  private auditSecurityData(item: BodyRecord) {
    return {
      admin: this.requiredString(item.admin, "Security event admin"),
      email: this.requiredString(item.email, "Security event email").toLowerCase(),
      eventType: this.requiredString(item.eventType, "Security event type"),
      result: this.optionalString(item.result) || "Success",
      timestamp: this.optionalString(item.timestamp) || null,
      ip: this.optionalString(item.ip) || null,
      device: this.optionalString(item.device) || null,
      browser: this.optionalString(item.browser) || null,
      location: this.optionalString(item.location) || null,
      risk: this.optionalString(item.risk) || "Low",
      status: this.optionalString(item.status) || "Open",
      note: this.optionalString(item.note) || null
    };
  }

  private async listAuditDataChangeState() {
    const changes = await this.prisma.auditDataChange.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
    return changes.map((item) => ({
      id: item.id,
      module: item.module,
      recordId: item.recordId,
      recordName: item.recordName,
      field: item.field,
      oldValue: item.oldValue ?? "",
      newValue: item.newValue ?? "",
      changedBy: item.changedBy,
      reason: item.reason ?? "",
      timestamp: item.timestamp ?? "",
      risk: item.risk,
      approval: item.approval,
      status: item.status,
      note: item.note ?? ""
    }));
  }

  private async saveAuditDataChangeState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const id = this.optionalString(item.id) || `ADC-${Date.now()}`;
      await this.prisma.auditDataChange.upsert({ where: { id }, update: this.auditDataChangeData(item), create: { id, ...this.auditDataChangeData(item) } });
    }
    await this.recordAudit(adminUserId, "AUDIT_DATA_CHANGES_SAVED", "AuditDataChange", undefined, { count: this.arrayRecords(state).length });
    return this.listAuditDataChangeState();
  }

  private auditDataChangeData(item: BodyRecord) {
    return {
      module: this.requiredString(item.module, "Data change module"),
      recordId: this.requiredString(item.recordId, "Data change record ID"),
      recordName: this.requiredString(item.recordName, "Data change record name"),
      field: this.requiredString(item.field, "Data change field"),
      oldValue: this.optionalString(item.oldValue) || null,
      newValue: this.optionalString(item.newValue) || null,
      changedBy: this.requiredString(item.changedBy, "Changed by"),
      reason: this.optionalString(item.reason) || null,
      timestamp: this.optionalString(item.timestamp) || null,
      risk: this.optionalString(item.risk) || "Low",
      approval: this.optionalString(item.approval) || "Not required",
      status: this.optionalString(item.status) || "Open",
      note: this.optionalString(item.note) || null
    };
  }

  private async listAuditSessionState() {
    const sessions = await this.prisma.auditAdminSessionRecord.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
    return sessions.map((item) => ({
      id: item.id,
      admin: item.admin,
      email: item.email,
      role: item.role ?? "",
      loginTime: item.loginTime ?? "",
      lastActivity: item.lastActivity ?? "",
      ip: item.ip ?? "",
      device: item.device ?? "",
      browser: item.browser ?? "",
      location: item.location ?? "",
      status: item.status,
      twoFactor: item.twoFactor,
      trusted: item.trusted,
      risk: item.risk,
      note: item.note ?? ""
    }));
  }

  private async saveAuditSessionState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const id = this.optionalString(item.id) || `ASN-${Date.now()}`;
      await this.prisma.auditAdminSessionRecord.upsert({ where: { id }, update: this.auditSessionData(item), create: { id, ...this.auditSessionData(item) } });
    }
    await this.recordAudit(adminUserId, "AUDIT_SESSIONS_SAVED", "AuditAdminSessionRecord", undefined, { count: this.arrayRecords(state).length });
    return this.listAuditSessionState();
  }

  private auditSessionData(item: BodyRecord) {
    return {
      admin: this.requiredString(item.admin, "Session admin"),
      email: this.requiredString(item.email, "Session email").toLowerCase(),
      role: this.optionalString(item.role) || null,
      loginTime: this.optionalString(item.loginTime) || null,
      lastActivity: this.optionalString(item.lastActivity) || null,
      ip: this.optionalString(item.ip) || null,
      device: this.optionalString(item.device) || null,
      browser: this.optionalString(item.browser) || null,
      location: this.optionalString(item.location) || null,
      status: this.optionalString(item.status) || "Active",
      twoFactor: this.optionalString(item.twoFactor) || "Pending",
      trusted: this.booleanFromInput(item.trusted),
      risk: this.optionalString(item.risk) || "Low",
      note: this.optionalString(item.note) || null
    };
  }

  private async listAuditExportState() {
    const exports = await this.prisma.auditExportRecord.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
    return exports.map((item) => ({
      id: item.id,
      admin: item.admin,
      email: item.email,
      exportType: item.exportType,
      module: item.module,
      format: item.format,
      dateRange: item.dateRange ?? "",
      rows: item.rows,
      status: item.status,
      downloadTime: item.downloadTime ?? "",
      ip: item.ip ?? "",
      reason: item.reason ?? "",
      review: item.review
    }));
  }

  private async saveAuditExportState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const id = this.optionalString(item.id) || `AEX-${Date.now()}`;
      await this.prisma.auditExportRecord.upsert({ where: { id }, update: this.auditExportData(item), create: { id, ...this.auditExportData(item) } });
    }
    await this.recordAudit(adminUserId, "AUDIT_EXPORTS_SAVED", "AuditExportRecord", undefined, { count: this.arrayRecords(state).length });
    return this.listAuditExportState();
  }

  private auditExportData(item: BodyRecord) {
    return {
      admin: this.requiredString(item.admin, "Export admin"),
      email: this.requiredString(item.email, "Export email").toLowerCase(),
      exportType: this.requiredString(item.exportType, "Export type"),
      module: this.requiredString(item.module, "Export module"),
      format: this.optionalString(item.format) || "CSV",
      dateRange: this.optionalString(item.dateRange) || null,
      rows: this.optionalString(item.rows) || "0",
      status: this.optionalString(item.status) || "Ready",
      downloadTime: this.optionalString(item.downloadTime) || null,
      ip: this.optionalString(item.ip) || null,
      reason: this.optionalString(item.reason) || null,
      review: this.optionalString(item.review) || "Open"
    };
  }

  private async listAuditRiskAlertState() {
    const alerts = await this.prisma.auditRiskAlert.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
    return alerts.map((item) => ({
      id: item.id,
      alertType: item.alertType,
      module: item.module,
      target: item.target,
      trigger: item.trigger,
      risk: item.risk,
      admin: item.admin,
      timestamp: item.timestamp ?? "",
      status: item.status,
      ownerNote: item.ownerNote ?? ""
    }));
  }

  private async saveAuditRiskAlertState(adminUserId: string, state: unknown) {
    for (const item of this.arrayRecords(state)) {
      const id = this.optionalString(item.id) || `ARA-${Date.now()}`;
      await this.prisma.auditRiskAlert.upsert({ where: { id }, update: this.auditRiskAlertData(item), create: { id, ...this.auditRiskAlertData(item) } });
    }
    await this.recordAudit(adminUserId, "AUDIT_RISK_ALERTS_SAVED", "AuditRiskAlert", undefined, { count: this.arrayRecords(state).length });
    return this.listAuditRiskAlertState();
  }

  private auditRiskAlertData(item: BodyRecord) {
    return {
      alertType: this.requiredString(item.alertType, "Risk alert type"),
      module: this.requiredString(item.module, "Risk alert module"),
      target: this.requiredString(item.target, "Risk alert target"),
      trigger: this.requiredString(item.trigger, "Risk trigger"),
      risk: this.optionalString(item.risk) || "High",
      admin: this.requiredString(item.admin, "Risk alert admin"),
      timestamp: this.optionalString(item.timestamp) || null,
      status: this.optionalString(item.status) || "Open",
      ownerNote: this.optionalString(item.ownerNote) || null
    };
  }

  private async getAuditSettingsState() {
    const settings = await this.prisma.auditSettings.findUnique({ where: { key: "default" } });
    return {
      retention: settings?.retention ?? "365 days",
      trackIp: settings?.trackIp ?? true,
      trackLocation: settings?.trackLocation ?? true,
      trackDevice: settings?.trackDevice ?? true,
      trackBeforeAfter: settings?.trackBeforeAfter ?? true,
      requireReason: settings?.requireReason ?? true,
      ownerApproval: settings?.ownerApproval ?? true,
      highRiskAlerts: settings?.highRiskAlerts ?? true,
      ownerOnlyExport: settings?.ownerOnlyExport ?? true,
      maskCustomerData: settings?.maskCustomerData ?? true,
      autoLockSuspicious: settings?.autoLockSuspicious ?? false,
      immutableSecurityEvents: settings?.immutableSecurityEvents ?? true
    };
  }

  private async saveAuditSettingsState(adminUserId: string, state: unknown) {
    const item = this.asRecord(state);
    const data = {
      retention: this.optionalString(item.retention) || "365 days",
      trackIp: this.booleanFromInput(item.trackIp),
      trackLocation: this.booleanFromInput(item.trackLocation),
      trackDevice: this.booleanFromInput(item.trackDevice),
      trackBeforeAfter: this.booleanFromInput(item.trackBeforeAfter),
      requireReason: this.booleanFromInput(item.requireReason),
      ownerApproval: this.booleanFromInput(item.ownerApproval),
      highRiskAlerts: this.booleanFromInput(item.highRiskAlerts),
      ownerOnlyExport: this.booleanFromInput(item.ownerOnlyExport),
      maskCustomerData: this.booleanFromInput(item.maskCustomerData),
      autoLockSuspicious: this.booleanFromInput(item.autoLockSuspicious),
      immutableSecurityEvents: this.booleanFromInput(item.immutableSecurityEvents)
    };
    await this.prisma.auditSettings.upsert({ where: { key: "default" }, update: data, create: { key: "default", ...data } });
    await this.recordAudit(adminUserId, "AUDIT_SETTINGS_SAVED", "AuditSettings", undefined);
    return this.getAuditSettingsState();
  }

  private async getAccountProfileState(adminUserId: string) {
    const [admin, saved] = await Promise.all([
      this.prisma.adminUser.findUnique({ where: { id: adminUserId } }),
      this.getSystemSettingState("account:profile")
    ]);
    const record = this.asRecord(saved);
    return {
      fullName: this.optionalString(record.fullName) || admin?.name || "Admin",
      displayName: this.optionalString(record.displayName) || admin?.name || "Admin",
      email: admin?.email || this.optionalString(record.email) || "",
      phone: this.optionalString(record.phone) || "",
      avatar: this.optionalString(record.avatar) || (admin?.name || "A").slice(0, 2).toUpperCase(),
      jobTitle: this.optionalString(record.jobTitle) || "Admin",
      department: this.optionalString(record.department) || "Operations",
      store: this.optionalString(record.store) || "FreshCart",
      timezone: this.optionalString(record.timezone) || "Asia/Kolkata",
      language: this.optionalString(record.language) || "English",
      emergencyContact: this.optionalString(record.emergencyContact) || "",
      internalNote: this.optionalString(record.internalNote) || "",
      emailVerified: record.emailVerified === undefined ? Boolean(admin?.email) : this.booleanFromInput(record.emailVerified),
      phoneVerified: record.phoneVerified === undefined ? false : this.booleanFromInput(record.phoneVerified)
    };
  }

  private async saveAccountProfileState(adminUserId: string, state: unknown) {
    const item = this.asRecord(state);
    const fullName = this.optionalString(item.fullName) || this.optionalString(item.displayName);
    const email = this.optionalString(item.email)?.toLowerCase();
    await this.prisma.adminUser.update({
      where: { id: adminUserId },
      data: {
        ...(fullName ? { name: fullName } : {}),
        ...(email ? { email } : {})
      }
    });
    await this.saveAccountSetting(adminUserId, "account:profile", item, "ACCOUNT_PROFILE_SAVED");
    return this.getAccountProfileState(adminUserId);
  }

  private async getAccountSecurityState(adminUserId: string) {
    const [admin, sessions, saved] = await Promise.all([
      this.prisma.adminUser.findUnique({ where: { id: adminUserId } }),
      this.prisma.adminSession.count({ where: { adminUserId, revokedAt: null, expiresAt: { gt: new Date() } } }),
      this.getSystemSettingState("account:security")
    ]);
    const record = this.asRecord(saved);
    return {
      twoFactorEnabled: record.twoFactorEnabled === undefined ? Boolean(admin?.twoFactorEnabled) : this.booleanFromInput(record.twoFactorEnabled),
      twoFactorMethod: this.optionalString(record.twoFactorMethod) || "Authenticator app",
      backupCodes: this.optionalString(record.backupCodes) || "Not generated",
      trustedDevices: Number(record.trustedDevices ?? sessions) || 0,
      loginAlerts: record.loginAlerts === undefined ? true : this.booleanFromInput(record.loginAlerts),
      passwordLastChanged: this.optionalString(record.passwordLastChanged) || "Password change date unavailable",
      failedLogins: Number(record.failedLogins ?? 0) || 0,
      lockStatus: this.optionalString(record.lockStatus) || "Unlocked",
      reauthRequired: record.reauthRequired === undefined ? false : this.booleanFromInput(record.reauthRequired),
      securityNote: this.optionalString(record.securityNote) || ""
    };
  }

  private async saveAccountSecurityState(adminUserId: string, state: unknown) {
    const item = this.asRecord(state);
    if (item.twoFactorEnabled !== undefined) {
      await this.prisma.adminUser.update({ where: { id: adminUserId }, data: { twoFactorEnabled: this.booleanFromInput(item.twoFactorEnabled) } });
    }
    await this.saveAccountSetting(adminUserId, "account:security", item, "ACCOUNT_SECURITY_SAVED");
    return this.getAccountSecurityState(adminUserId);
  }

  private async listAccountSessionState(adminUserId: string) {
    const saved = await this.getSystemSettingState("account:sessions");
    if (Array.isArray(saved)) return saved;
    const sessions = await this.prisma.adminSession.findMany({ where: { adminUserId }, orderBy: { createdAt: "desc" }, take: 20 });
    return sessions.map((session) => ({
      id: session.id,
      device: "Admin browser",
      browser: "Current browser",
      ip: "Unavailable",
      location: "Unavailable",
      loginTime: this.dateOnly(session.createdAt),
      lastActivity: session.revokedAt ? this.dateOnly(session.revokedAt) : this.dateOnly(session.expiresAt),
      twoFactor: "Verified",
      trusted: false,
      status: session.revokedAt ? "Logged out" : session.expiresAt < new Date() ? "Expired" : "Active"
    }));
  }

  private async saveAccountSessionState(adminUserId: string, state: unknown) {
    const sessions = this.arrayRecords(state);
    for (const session of sessions) {
      const id = this.optionalString(session.id);
      const status = this.optionalString(session.status);
      if (id && status === "Logged out") {
        await this.prisma.adminSession.updateMany({ where: { id, adminUserId }, data: { revokedAt: new Date() } });
      }
    }
    await this.saveAccountSetting(adminUserId, "account:sessions", sessions, "ACCOUNT_SESSIONS_SAVED");
    return this.listAccountSessionState(adminUserId);
  }

  private async listAccountActivityState(adminUserId: string) {
    const saved = await this.getSystemSettingState("account:activity");
    if (Array.isArray(saved)) return saved;
    const logs = await this.prisma.adminAuditLog.findMany({ where: { adminUserId }, orderBy: { createdAt: "desc" }, take: 25 });
    return logs.map((log) => ({
      id: log.id,
      event: log.action,
      detail: [log.resourceType, log.resourceId].filter(Boolean).join(" · ") || log.action,
      time: this.dateOnly(log.createdAt),
      risk: log.action.toLowerCase().includes("delete") || log.action.toLowerCase().includes("revoke") ? "High" : "Low",
      status: "Open"
    }));
  }

  private async saveAccountActivityState(adminUserId: string, state: unknown) {
    const activity = this.arrayRecords(state);
    await this.saveAccountSetting(adminUserId, "account:activity", activity, "ACCOUNT_ACTIVITY_SAVED");
    return this.listAccountActivityState(adminUserId);
  }

  private async saveAccountSetting(adminUserId: string, key: string, state: unknown, action: string) {
    const normalizedKey = this.normalizeStateKey(key);
    const payload = state as Prisma.InputJsonValue;
    const record = await this.prisma.systemSetting.upsert({
      where: { key: normalizedKey },
      update: { payload },
      create: { key: normalizedKey, payload }
    });
    await this.recordAudit(adminUserId, action, "SystemSetting", record.id, { key });
    return record.payload;
  }

  private arrayRecords(state: unknown): BodyRecord[] {
    return Array.isArray(state) ? state.filter((item): item is BodyRecord => item && typeof item === "object" && !Array.isArray(item)) : [];
  }

  private arrayStrings(state: unknown) {
    if (!Array.isArray(state)) return [];
    return state
      .map((item) => (typeof item === "object" && item !== null ? this.optionalString((item as BodyRecord).id ?? (item as BodyRecord).value) : this.optionalString(item)))
      .filter((item): item is string => Boolean(item));
  }

  private integerFromInput(value: unknown) {
    const parsed = Number.parseInt(String(value ?? "0").replace(/[^\d-]/g, ""), 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private formatMoney(value: Prisma.Decimal | number | string) {
    return `Rs. ${rupee.format(Number(value))}`;
  }

  private formatNumberMoney(value: number) {
    return `Rs. ${rupee.format(value)}`;
  }

  private dateOnly(value: Date) {
    return value.toLocaleDateString("en-IN", { month: "short", day: "2-digit", year: "numeric" });
  }

  private customerName(customer?: { firstName: string | null; lastName: string | null; email?: string | null; phone?: string | null } | null) {
    if (!customer) return "Guest customer";
    const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim();
    return name || customer.email || customer.phone || "Guest customer";
  }

  private splitName(value: unknown) {
    const name = this.optionalString(value) || "Customer";
    const [firstName, ...rest] = name.split(/\s+/);
    return { firstName, lastName: rest.join(" ") || null };
  }

  private snapshotValue(snapshot: unknown, key: string, fallback: string) {
    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return fallback;
    const value = (snapshot as Record<string, unknown>)[key];
    return typeof value === "string" && value.trim() ? value : fallback;
  }

  private orderSnapshot(item: BodyRecord): Prisma.InputJsonValue {
    return {
      customer: this.optionalString(item.customer) || "Customer",
      phone: this.optionalString(item.phone) || "",
      slot: this.optionalString(item.slot) || "No slot selected",
      zone: this.optionalString(item.zone) || "Primary zone",
      addressLine1: "Admin entered order",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400001"
    };
  }

  private async findOrCreateCustomerByUi(name: unknown, phone?: unknown, email?: unknown) {
    const normalizedPhone = this.optionalString(phone);
    const normalizedEmail = this.optionalString(email)?.toLowerCase();
    if (normalizedPhone) {
      const existing = await this.prisma.customer.findFirst({ where: { phone: normalizedPhone } });
      if (existing) return existing;
    }
    if (normalizedEmail) {
      const existing = await this.prisma.customer.findFirst({ where: { email: normalizedEmail } });
      if (existing) return existing;
    }
    const split = this.splitName(name);
    return this.prisma.customer.create({
      data: {
        phone: normalizedPhone,
        email: normalizedEmail,
        firstName: split.firstName,
        lastName: split.lastName,
        status: "ACTIVE"
      }
    });
  }

  private async defaultCategory() {
    const category = await this.prisma.category.findFirst({ orderBy: { createdAt: "asc" } });
    if (category) return category;
    throw new BadRequestException("Create a category before saving inventory products.");
  }

  private async defaultBranch() {
    const branch = await this.prisma.branch.findFirst({ orderBy: { createdAt: "asc" } });
    if (branch) return branch;
    throw new BadRequestException("Create a branch before saving inventory or delivery records.");
  }

  private async defaultPurchaseOrder() {
    const order = await this.prisma.purchaseOrder.findFirst({ orderBy: { createdAt: "asc" } });
    if (order) return order;
    throw new BadRequestException("Create a purchase order before saving supplier payments.");
  }

  private async findOrCreateOrderByNumber(orderNumber: string) {
    const existing = await this.prisma.order.findUnique({ where: { orderNumber } });
    if (existing) return existing;
    return this.prisma.order.create({
      data: {
        orderNumber,
        status: OrderStatus.PLACED,
        paymentStatus: PaymentStatus.PENDING,
        fulfillmentStatus: FulfillmentStatus.NOT_STARTED,
        subtotal: new Prisma.Decimal(0),
        total: new Prisma.Decimal(0),
        deliveryAddressSnapshot: this.orderSnapshot({ customer: "Customer" })
      }
    });
  }

  private etaFromLabel(value: unknown) {
    const mins = this.integerFromInput(value);
    if (!mins) return null;
    return new Date(Date.now() + mins * 60 * 1000);
  }

  private optionalNumber(value: unknown) {
    const text = this.optionalString(value);
    if (!text) return undefined;
    const parsed = Number(text.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private deliveryPartnerPhone(rider: string) {
    const digits = rider.replace(/\D/g, "");
    return digits.length >= 8 ? `+${digits}` : `rider-${this.slugify(rider)}`;
  }

  private async findOrCreateDeliveryPartner(rider: string) {
    const phone = this.deliveryPartnerPhone(rider);
    const existing = await this.prisma.deliveryPartner.findFirst({ where: { phone } });
    if (existing) return this.prisma.deliveryPartner.update({ where: { id: existing.id }, data: { name: rider, status: "ACTIVE" } });
    return this.prisma.deliveryPartner.create({ data: { name: rider, phone, status: "ACTIVE" } });
  }

  private orderStatusToLabel(status: string) {
    if (status === "CONFIRMED") return "Confirmed";
    if (status === "PACKED") return "Packed";
    if (status === "OUT_FOR_DELIVERY") return "Out for delivery";
    if (status === "DELIVERED") return "Delivered";
    if (status === "CANCELLED") return "Cancelled";
    return "Confirmed";
  }

  private labelToOrderStatus(value: unknown): OrderStatus {
    const text = (this.optionalString(value) || "").toLowerCase();
    if (text.includes("packed")) return OrderStatus.PACKED;
    if (text.includes("out")) return OrderStatus.OUT_FOR_DELIVERY;
    if (text.includes("deliver")) return OrderStatus.DELIVERED;
    if (text.includes("cancel")) return OrderStatus.CANCELLED;
    if (text.includes("confirm")) return OrderStatus.CONFIRMED;
    return OrderStatus.PLACED;
  }

  private fulfillmentStatusToLabel(status: string) {
    if (status === "PICKING") return "Picking";
    if (status === "PACKED") return "Packed";
    if (status === "ASSIGNED") return "Assigned";
    if (status === "OUT_FOR_DELIVERY") return "Out for delivery";
    if (status === "DELIVERED") return "Delivered";
    return "Not started";
  }

  private labelToFulfillmentStatus(value: unknown): FulfillmentStatus {
    const text = (this.optionalString(value) || "").toLowerCase();
    if (text.includes("picking")) return FulfillmentStatus.PICKING;
    if (text.includes("packed")) return FulfillmentStatus.PACKED;
    if (text.includes("assign")) return FulfillmentStatus.ASSIGNED;
    if (text.includes("out")) return FulfillmentStatus.OUT_FOR_DELIVERY;
    if (text.includes("deliver")) return FulfillmentStatus.DELIVERED;
    return FulfillmentStatus.NOT_STARTED;
  }

  private paymentStatusToLabel(status: string) {
    if (status === "COD_PENDING") return "COD pending";
    if (status === "PAID") return "Paid";
    if (status === "FAILED") return "Failed";
    if (status === "REFUNDED") return "Refunded";
    return "Pending";
  }

  private paymentStatusToSupplierLabel(status: string) {
    if (status === "PAID") return "Paid";
    if (status === "REFUNDED") return "Paid";
    return "Pending";
  }

  private labelToPaymentStatus(value: unknown): PaymentStatus {
    const text = (this.optionalString(value) || "").toLowerCase();
    if (text.includes("cod collected") || text.includes("reconciled")) return PaymentStatus.PAID;
    if (text.includes("cod")) return PaymentStatus.COD_PENDING;
    if (text.includes("paid")) return PaymentStatus.PAID;
    if (text.includes("fail")) return PaymentStatus.FAILED;
    if (text.includes("refund")) return PaymentStatus.REFUNDED;
    return PaymentStatus.PENDING;
  }

  private paymentMethodToLabel(method: string) {
    if (method === "CASH_ON_DELIVERY") return "COD";
    if (method === "RAZORPAY") return "UPI";
    return "Manual payment";
  }

  private paymentGatewayLabel(method: string) {
    if (method === "CASH_ON_DELIVERY") return "COD";
    if (method === "RAZORPAY") return "Razorpay";
    return "Manual";
  }

  private labelToPaymentMethod(value: unknown): PaymentMethod {
    const text = (this.optionalString(value) || "").toLowerCase();
    if (text.includes("cod") || text.includes("cash")) return PaymentMethod.CASH_ON_DELIVERY;
    if (text.includes("upi") || text.includes("card") || text.includes("wallet") || text.includes("net") || text.includes("razorpay")) {
      return PaymentMethod.RAZORPAY;
    }
    return PaymentMethod.MOCK_ONLINE;
  }

  private supplierStatusToLabel(status: string) {
    if (status === "PAUSED") return "Paused";
    if (status === "REVIEW") return "Review";
    return "Active";
  }

  private purchaseOrderStatusToLabel(status: string) {
    if (status === "RECEIVED") return "Received";
    if (status === "DELAYED") return "Delayed";
    return "Pending";
  }

  private labelToPurchaseOrderStatus(value: unknown) {
    const text = (this.optionalString(value) || "").toUpperCase();
    if (text.includes("RECEIVED")) return "RECEIVED";
    if (text.includes("DELAY")) return "DELAYED";
    return "PENDING";
  }

  private deliveryStatusToLabel(status: string) {
    if (status === "ASSIGNED") return "Assigned";
    if (status === "OUT_FOR_DELIVERY") return "Out for delivery";
    if (status === "DELIVERED") return "Delivered";
    if (status === "FAILED_DELIVERY") return "Delayed";
    return "Packed";
  }

  private deliveryStatusToOrderStatus(status: DeliveryAssignmentStatus): OrderStatus {
    if (status === DeliveryAssignmentStatus.OUT_FOR_DELIVERY || status === DeliveryAssignmentStatus.NEARBY) return OrderStatus.OUT_FOR_DELIVERY;
    if (status === DeliveryAssignmentStatus.DELIVERED) return OrderStatus.DELIVERED;
    if (status === DeliveryAssignmentStatus.FAILED_DELIVERY || status === DeliveryAssignmentStatus.CANCELLED) return OrderStatus.PACKED;
    return OrderStatus.PACKED;
  }

  private deliveryStatusToFulfillmentStatus(status: DeliveryAssignmentStatus): FulfillmentStatus {
    if (status === DeliveryAssignmentStatus.ASSIGNED || status === DeliveryAssignmentStatus.ACCEPTED) return FulfillmentStatus.ASSIGNED;
    if (status === DeliveryAssignmentStatus.OUT_FOR_DELIVERY || status === DeliveryAssignmentStatus.NEARBY || status === DeliveryAssignmentStatus.PICKED_UP) {
      return FulfillmentStatus.OUT_FOR_DELIVERY;
    }
    if (status === DeliveryAssignmentStatus.DELIVERED) return FulfillmentStatus.DELIVERED;
    return FulfillmentStatus.PACKED;
  }

  private deliveryNotificationMessage(orderNumber: string, status: DeliveryAssignmentStatus, rider?: string) {
    const riderText = rider ? ` Rider: ${rider}.` : "";
    if (status === DeliveryAssignmentStatus.ASSIGNED || status === DeliveryAssignmentStatus.ACCEPTED) return `Your order ${orderNumber} has been assigned for delivery.${riderText}`;
    if (status === DeliveryAssignmentStatus.PICKED_UP) return `Your order ${orderNumber} has been picked up from the store.${riderText}`;
    if (status === DeliveryAssignmentStatus.OUT_FOR_DELIVERY) return `Your order ${orderNumber} is out for delivery.${riderText}`;
    if (status === DeliveryAssignmentStatus.NEARBY) return `Your delivery for ${orderNumber} is nearby.${riderText}`;
    if (status === DeliveryAssignmentStatus.DELIVERED) return `Your order ${orderNumber} has been delivered.`;
    if (status === DeliveryAssignmentStatus.FAILED_DELIVERY) return `Delivery for ${orderNumber} needs attention. Support will help resolve it.`;
    return `Delivery status updated for ${orderNumber}.`;
  }

  private labelToDeliveryStatus(value: unknown): DeliveryAssignmentStatus {
    const text = (this.optionalString(value) || "").toLowerCase();
    if (text.includes("near")) return DeliveryAssignmentStatus.NEARBY;
    if (text.includes("pick")) return DeliveryAssignmentStatus.PICKED_UP;
    if (text.includes("accept")) return DeliveryAssignmentStatus.ACCEPTED;
    if (text.includes("assign")) return DeliveryAssignmentStatus.ASSIGNED;
    if (text.includes("out")) return DeliveryAssignmentStatus.OUT_FOR_DELIVERY;
    if (text.includes("deliver")) return DeliveryAssignmentStatus.DELIVERED;
    if (text.includes("cancel")) return DeliveryAssignmentStatus.CANCELLED;
    if (text.includes("delay") || text.includes("fail")) return DeliveryAssignmentStatus.FAILED_DELIVERY;
    return DeliveryAssignmentStatus.UNASSIGNED;
  }

  private supportStatusToLabel(status: string) {
    if (status === "PENDING") return "Pending";
    if (status === "RESOLVED") return "Resolved";
    return "Open";
  }

  private labelToSupportStatus(value: unknown): SupportConversationStatus {
    const text = (this.optionalString(value) || "").toLowerCase();
    if (text.includes("pending")) return SupportConversationStatus.PENDING;
    if (text.includes("resolved")) return SupportConversationStatus.RESOLVED;
    return SupportConversationStatus.OPEN;
  }

  private refundStatusToLabel(status: string) {
    if (status === "REVIEWING") return "Under review";
    if (status === "APPROVED") return "Approved";
    if (status === "REJECTED") return "Rejected";
    if (status === "PROCESSED") return "Refunded";
    return "Requested";
  }

  private refundStatusToFinanceLabel(status: RefundStatus, method?: string | null) {
    if (status === RefundStatus.PROCESSED) return String(method || "").toLowerCase().includes("wallet") ? "Wallet credited" : "Paid";
    if (status === RefundStatus.APPROVED) return "Approved for payout";
    if (status === RefundStatus.REVIEWING) return "Awaiting finance approval";
    if (status === RefundStatus.REJECTED) return "Adjustment required";
    return "Awaiting finance approval";
  }

  private labelToRefundStatus(value: unknown): RefundStatus {
    const text = (this.optionalString(value) || "").toLowerCase();
    if (text.includes("wallet credited") || text === "paid" || text.includes("reconciled")) return RefundStatus.PROCESSED;
    if (text.includes("gateway queued")) return RefundStatus.APPROVED;
    if (text.includes("adjustment")) return RefundStatus.REVIEWING;
    if (text.includes("review")) return RefundStatus.REVIEWING;
    if (text.includes("approve") || text.includes("processing")) return RefundStatus.APPROVED;
    if (text.includes("reject")) return RefundStatus.REJECTED;
    if (text.includes("refund") || text.includes("processed")) return RefundStatus.PROCESSED;
    return RefundStatus.REQUESTED;
  }

  private notificationChannelToLabel(channel: string) {
    if (channel === "WHATSAPP") return "WhatsApp";
    if (channel === "SMS") return "SMS";
    if (channel === "EMAIL") return "Email";
    if (channel === "IN_APP") return "In-app";
    return "Push";
  }

  private labelToNotificationChannel(value: unknown): NotificationChannel {
    const text = (this.optionalString(value) || "").toLowerCase();
    if (text.includes("whatsapp")) return NotificationChannel.WHATSAPP;
    if (text.includes("sms")) return NotificationChannel.SMS;
    if (text.includes("email")) return NotificationChannel.EMAIL;
    return NotificationChannel.IN_APP;
  }

  private notificationStatusToLabel(status: string) {
    if (status === "SENT") return "Sent";
    if (status === "PROCESSING") return "Sending";
    if (status === "FAILED") return "Failed";
    if (status === "CANCELLED") return "Paused";
    return "Scheduled";
  }

  private labelToNotificationStatus(value: unknown): NotificationStatus {
    const text = (this.optionalString(value) || "").toLowerCase();
    if (text.includes("sent")) return NotificationStatus.SENT;
    if (text.includes("send")) return NotificationStatus.PROCESSING;
    if (text.includes("fail")) return NotificationStatus.FAILED;
    if (text.includes("pause")) return NotificationStatus.CANCELLED;
    return NotificationStatus.QUEUED;
  }

  private labelToAdminStatus(value: unknown): AdminStatus {
    const text = (this.optionalString(value) || "").toLowerCase();
    if (text.includes("invite")) return AdminStatus.INVITED;
    if (text.includes("pause") || text.includes("disable") || text.includes("suspend") || text.includes("offline")) return AdminStatus.DISABLED;
    return AdminStatus.ACTIVE;
  }

  private asRecord(input: unknown): BodyRecord {
    return input && typeof input === "object" && !Array.isArray(input) ? (input as BodyRecord) : {};
  }

  private requiredString(value: unknown, label: string) {
    const text = this.optionalString(value);
    if (!text) throw new BadRequestException(`${label} is required.`);
    return text;
  }

  private optionalString(value: unknown) {
    if (value === null || value === undefined) return undefined;
    const text = String(value).trim();
    return text ? text : undefined;
  }

  private booleanFromInput(value: unknown) {
    return value === true || value === "true" || value === "on" || value === "1";
  }

  private csvList(value: unknown) {
    if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
    return (this.optionalString(value) || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private moneyFromInput(value: unknown, label: string) {
    const number = this.parseMoney(value);
    if (number === null) throw new BadRequestException(`${label} must be a number.`);
    return new Prisma.Decimal(number);
  }

  private optionalMoneyFromInput(value: unknown) {
    const number = this.parseMoney(value);
    return number === null ? null : new Prisma.Decimal(number);
  }

  private parseMoney(value: unknown) {
    const text = this.optionalString(value);
    if (!text || text === "-") return null;
    const match = text.replace(/,/g, "").match(/\d+(?:\.\d+)?/);
    if (!match) return null;
    return Number(match[0]);
  }

  private optionalDate(value: unknown) {
    const text = this.optionalString(value);
    if (!text || ["Always on", "Draft schedule", "Next window", "Campaign end"].includes(text)) return null;
    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private dateLabel(date?: Date | null) {
    return date ? date.toLocaleString("en-IN", { month: "short", day: "2-digit", hour: "numeric" }) : "Always on";
  }

  private formatValidity(startsAt?: Date | null, endsAt?: Date | null) {
    if (!startsAt && !endsAt) return "Always on";
    return `${startsAt ? startsAt.toLocaleDateString("en-IN", { month: "short", day: "2-digit" }) : "Now"} - ${
      endsAt ? endsAt.toLocaleDateString("en-IN", { month: "short", day: "2-digit" }) : "No end"
    }`;
  }

  private readPayload(payload: unknown, key: string, fallback: string) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return fallback;
    const value = (payload as Record<string, unknown>)[key];
    return typeof value === "string" && value.trim() ? value : fallback;
  }

  private toProductStatus(value: unknown): ProductStatus {
    const text = (this.optionalString(value) || "Active").toLowerCase();
    if (text.includes("pause") || text.includes("hidden") || text.includes("inactive")) return ProductStatus.INACTIVE;
    if (text.includes("draft")) return ProductStatus.DRAFT;
    if (text.includes("out")) return ProductStatus.OUT_OF_STOCK;
    return ProductStatus.ACTIVE;
  }

  private toCategoryStatus(value: unknown): ProductStatus {
    const text = (this.optionalString(value) || "Active").toLowerCase();
    if (text.includes("draft")) return ProductStatus.DRAFT;
    if (text.includes("archive") || text.includes("hidden") || text.includes("pause")) return ProductStatus.INACTIVE;
    return ProductStatus.ACTIVE;
  }

  private toInventoryStatus(value: unknown) {
    const text = (this.optionalString(value) || "In stock").toLowerCase();
    if (text.includes("disable")) return "DISABLED" as const;
    if (text.includes("expired") && !text.includes("expiring")) return "EXPIRED" as const;
    if (text.includes("low")) return "LOW_STOCK" as const;
    if (text.includes("out")) return "OUT_OF_STOCK" as const;
    if (text.includes("expir")) return "EXPIRING_SOON" as const;
    return "IN_STOCK" as const;
  }

  private deriveInventoryStatus(onHand: number, reserved: number, threshold: number, requested: ReturnType<typeof this.toInventoryStatus>) {
    if (requested === "DISABLED" || requested === "EXPIRED" || requested === "EXPIRING_SOON") return requested;
    const available = onHand - reserved;
    if (available <= 0) return "OUT_OF_STOCK" as const;
    if (available <= Math.max(threshold, 1)) return "LOW_STOCK" as const;
    return "IN_STOCK" as const;
  }

  private categoryMappingStatus(status: string) {
    if (status === "LOW_STOCK") return "Low stock";
    if (status === "OUT_OF_STOCK") return "Out of stock";
    if (status === "DISABLED") return "Uncategorized";
    return "Active";
  }

  private categoryMappingInventoryStatus(value: unknown) {
    const text = (this.optionalString(value) || "Active").toLowerCase();
    if (text.includes("low")) return "LOW_STOCK" as const;
    if (text.includes("out")) return "OUT_OF_STOCK" as const;
    if (text.includes("uncategorized") || text.includes("disabled")) return "DISABLED" as const;
    return "IN_STOCK" as const;
  }

  private toDiscountType(value: unknown): DiscountType {
    const text = (this.optionalString(value) || "Percent").toLowerCase();
    if (text.includes("free")) return DiscountType.FREE_DELIVERY;
    if (text.includes("flat")) return DiscountType.FIXED_AMOUNT;
    return DiscountType.PERCENTAGE;
  }

  private toPromotionStatus(value: unknown): PromotionStatus {
    const text = (this.optionalString(value) || "Live").toLowerCase();
    if (text.includes("schedule")) return PromotionStatus.SCHEDULED;
    if (text.includes("pause")) return PromotionStatus.PAUSED;
    if (text.includes("expire")) return PromotionStatus.EXPIRED;
    if (text.includes("draft")) return PromotionStatus.DRAFT;
    return PromotionStatus.LIVE;
  }

  private fromProductStatus(status: string) {
    if (status === "ACTIVE") return "Active";
    if (status === "OUT_OF_STOCK") return "Paused";
    if (status === "DRAFT") return "Draft";
    return "Paused";
  }

  private fromInventoryStatus(status: string) {
    if (status === "LOW_STOCK") return "Low stock";
    if (status === "OUT_OF_STOCK") return "Out of stock";
    return "In stock";
  }

  private fromPromotionStatus(status: string) {
    if (status === "LIVE") return "Live";
    if (status === "SCHEDULED") return "Scheduled";
    if (status === "PAUSED") return "Paused";
    if (status === "EXPIRED") return "Expired";
    return "Paused";
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  private normalizeStateKey(key: string) {
    const decoded = decodeURIComponent(key);
    if (!decoded || decoded.length > 120) throw new BadRequestException("Admin state key is invalid.");
    return `admin-state:${decoded.replace(/[^a-zA-Z0-9:_-]/g, "-")}`;
  }

  private async uniqueSlug(model: "category" | "product", base: string) {
    const slug = base || "item";
    let candidate = slug;
    let suffix = 2;
    while (
      model === "category"
        ? await this.prisma.category.findUnique({ where: { slug: candidate } })
        : await this.prisma.product.findUnique({ where: { slug: candidate } })
    ) {
      candidate = `${slug}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }
}
