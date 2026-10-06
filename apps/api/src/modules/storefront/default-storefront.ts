export type StorefrontCategoryDto = {
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

export type StorefrontCouponDto = {
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

export type StorefrontPromotionDto = {
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

export type StorefrontBannerDto = {
  title: string;
  placement: string;
  audience: string;
  cta: string;
  target: string;
  status: "Live" | "Scheduled" | "Paused";
  priority: number;
};

export type StorefrontDto = {
  categories: StorefrontCategoryDto[];
  coupons: StorefrontCouponDto[];
  promotions: StorefrontPromotionDto[];
  couponBanners: StorefrontBannerDto[];
  updatedAt: string;
};

export const defaultStorefrontData: StorefrontDto = {
  categories: [],
  coupons: [],
  promotions: [],
  couponBanners: [],
  updatedAt: ""
};
