import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../../database/prisma.service";
import type { StorefrontDto } from "../default-storefront";
import { GetStorefrontQuery } from "./get-storefront.query";

@QueryHandler(GetStorefrontQuery)
export class GetStorefrontHandler implements IQueryHandler<GetStorefrontQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<StorefrontDto> {
    const [categories, coupons, promotions, placements] = await Promise.all([
      this.prisma.category.findMany({
        where: { status: "ACTIVE", deletedAt: null },
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }]
      }),
      this.prisma.coupon.findMany({
        where: { status: { in: ["LIVE", "SCHEDULED", "PAUSED", "EXPIRED"] } },
        orderBy: { updatedAt: "desc" }
      }),
      this.prisma.promotion.findMany({
        where: { status: { in: ["LIVE", "SCHEDULED", "PAUSED", "EXPIRED"] } },
        orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
        include: { coupon: true }
      }),
      this.prisma.storefrontPlacement.findMany({
        where: { status: { in: ["LIVE", "SCHEDULED", "PAUSED"] } },
        orderBy: [{ priority: "asc" }, { updatedAt: "desc" }]
      })
    ]);

    return {
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        note: category.note ?? "",
        image: category.image ?? category.name.slice(0, 2).toUpperCase(),
        status: "Active",
        featured: category.featured,
        order: category.sortOrder,
        href: `/categories/${category.slug}`
      })),
      coupons: coupons.map((coupon) => ({
        code: coupon.code,
        campaign: coupon.campaign,
        type:
          coupon.discountType === "PERCENTAGE"
            ? "Percent"
            : coupon.discountType === "FREE_DELIVERY"
              ? "Free delivery"
              : "Flat",
        value: coupon.discountType === "PERCENTAGE" ? `${coupon.value}%` : `Rs. ${coupon.value}`,
        minCart: coupon.minCart ? `Rs. ${coupon.minCart}` : "No minimum",
        maxDiscount: coupon.maxDiscount ? `Rs. ${coupon.maxDiscount}` : "No cap",
        status: mapCouponStatus(coupon.status),
        valid: formatValidity(coupon.startsAt, coupon.endsAt),
        segment: coupon.segment ?? "All customers"
      })),
      promotions: promotions.map((promotion) => ({
        id: promotion.id,
        title: promotion.title,
        type: promotion.type,
        placement: promotion.placement,
        audience: promotion.audience,
        status: mapPromotionStatus(promotion.status),
        priority: promotion.priority,
        cta: promotion.cta ?? "View",
        targetUrl: promotion.targetUrl ?? "/products",
        value: promotion.valueLabel ?? promotion.coupon?.code ?? "Offer",
        coupon: promotion.coupon?.code ?? "",
        mappedTo: promotion.mappedTo ?? "Storefront"
      })),
      couponBanners: placements.map((placement) => ({
        title: placement.title,
        placement: placement.placement,
        audience: String(readPayloadValue(placement.payload, "audience", "All customers")),
        cta: String(readPayloadValue(placement.payload, "cta", "Shop now")),
        target: String(readPayloadValue(placement.payload, "target", "/products")),
        status: mapPlacementStatus(placement.status),
        priority: placement.priority
      })),
      updatedAt: new Date().toISOString()
    };
  }
}

function mapCouponStatus(status: string): "Active" | "Scheduled" | "Paused" | "Expired" {
  if (status === "LIVE") return "Active";
  if (status === "SCHEDULED") return "Scheduled";
  if (status === "PAUSED") return "Paused";
  return "Expired";
}

function mapPromotionStatus(status: string): "Live" | "Scheduled" | "Paused" | "Expired" {
  if (status === "LIVE") return "Live";
  if (status === "SCHEDULED") return "Scheduled";
  if (status === "PAUSED") return "Paused";
  return "Expired";
}

function mapPlacementStatus(status: string): "Live" | "Scheduled" | "Paused" {
  if (status === "SCHEDULED") return "Scheduled";
  if (status === "PAUSED") return "Paused";
  return "Live";
}

function formatValidity(startsAt?: Date | null, endsAt?: Date | null) {
  if (!startsAt && !endsAt) return "Always on";
  const start = startsAt ? startsAt.toLocaleDateString("en-IN", { month: "short", day: "2-digit" }) : "Now";
  const end = endsAt ? endsAt.toLocaleDateString("en-IN", { month: "short", day: "2-digit" }) : "No end";
  return `${start} - ${end}`;
}

function readPayloadValue(payload: unknown, key: string, fallback: string) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return fallback;
  return key in payload ? (payload as Record<string, unknown>)[key] : fallback;
}
