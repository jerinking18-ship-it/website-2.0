export type StorefrontCategory = {
  id: string;
  name: string;
  slug: string;
  note: string;
  image: string;
  status: "Active" | "Hidden" | "Scheduled" | "Draft" | "Archived";
  featured: boolean;
  order: number;
  href: string;
};

export type StorefrontCoupon = {
  code: string;
  campaign: string;
  type: "Percent" | "Flat" | "Free delivery";
  value: string;
  minCart: string;
  maxDiscount: string;
  status: "Active" | "Scheduled" | "Paused" | "Expired";
  valid: string;
  segment: string;
};

export type StorefrontPromotion = {
  id: string;
  title: string;
  type: string;
  placement: string;
  audience: string;
  status: "Live" | "Scheduled" | "Paused" | "Expired";
  priority: number;
  cta: string;
  targetUrl: string;
  value: string;
  coupon: string;
  mappedTo: string;
};

export type StorefrontBanner = {
  title: string;
  placement: string;
  audience: string;
  cta: string;
  target: string;
  status: "Live" | "Scheduled" | "Paused";
  priority: number;
};

export type StorefrontData = {
  categories: StorefrontCategory[];
  coupons: StorefrontCoupon[];
  promotions: StorefrontPromotion[];
  couponBanners: StorefrontBanner[];
  updatedAt: string;
};

export const defaultStorefrontData: StorefrontData = {
  categories: [],
  coupons: [],
  promotions: [],
  couponBanners: [],
  updatedAt: ""
};

export function mergeStorefrontData(patch: Partial<StorefrontData>, base = defaultStorefrontData): StorefrontData {
  return {
    ...base,
    ...patch,
    categories: patch.categories ?? base.categories,
    coupons: patch.coupons ?? base.coupons,
    promotions: patch.promotions ?? base.promotions,
    couponBanners: patch.couponBanners ?? base.couponBanners,
    updatedAt: new Date().toISOString()
  };
}
