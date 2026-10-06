export function formatPrice(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency
  }).format(amount);
}

export {
  defaultStorefrontData,
  mergeStorefrontData,
  type StorefrontBanner,
  type StorefrontCategory,
  type StorefrontCoupon,
  type StorefrontData,
  type StorefrontPromotion
} from "./storefront";
