"use client";

import { type FormEvent, type ReactNode, type SyntheticEvent, useEffect, useMemo, useState } from "react";
import { type StorefrontData } from "@freshcart/utils";
import { type Product } from "../catalog/data";

type Cart = Record<string, number>;
type ProductId = Product["id"];
type ApiCart = { items?: Array<{ productId?: string | number; quantity?: number; product?: Record<string, unknown> }> };
type ApiWishlist = { items?: Array<{ productId?: string | number }> };
type CatalogFacet = { name: string; count: number };
type CatalogFacetState = {
  suppliers: CatalogFacet[];
};
type CheckoutQuote = {
  items?: Array<{ productId: string; quantity: number; unitPrice: number; lineTotal: number; availableQuantity: number }>;
  subtotal: number;
  deliveryFee: number;
  couponCode: string;
  discountTotal: number;
  total: number;
  walletApplied: number;
  payableTotal: number;
  serverPriced: boolean;
};
type DeliveryLocation = { label: string; detail: string; eta: string };
type DeliverySlot = { id: string; label: string; capacity: number; fee: number };
type SearchSuggestionState = {
  products: Array<{ id: string; name: string; category: string; href: string; price?: number }>;
  categories: Array<{ id: string; name: string; href: string }>;
  suppliers: Array<{ name: string; href: string }>;
};

type CustomerView =
  | "home"
  | "categories"
  | "products"
  | "wishlist"
  | "product-detail"
  | "search"
  | "checkout-address"
  | "checkout-delivery"
  | "checkout-payment"
  | "checkout-review"
  | "checkout-failed"
  | "confirmation"
  | "orders"
  | "tracking"
  | "support"
  | "offers"
  | "account"
  | "account-profile"
  | "account-addresses"
  | "account-wallet"
  | "account-notifications"
  | "reviews"
  | "serviceability";

type Props = {
  view: CustomerView;
  title?: string;
  initialQuery?: string;
  categorySlug?: string;
  productSlug?: string;
  orderNumber?: string;
};

const navItems = [
  { label: "Shop", href: "/" },
  { label: "Categories", href: "/categories/fresh-produce" },
  { label: "Products", href: "/products" },
  { label: "My Orders", href: "/orders" },
  { label: "Offers", href: "/offers" },
  { label: "Contact", href: "/contact" },
  { label: "Tracking", href: "/orders" },
  { label: "Support", href: "/support" }
];

const defaultWishlist: Array<string | number> = [];
const defaultCart: Cart = {};
const emptyStorefrontData: StorefrontData = {
  categories: [],
  coupons: [],
  promotions: [],
  couponBanners: [],
  updatedAt: ""
};
const catalogFilters = [
  "In stock",
  "Low stock",
  "Out of stock",
  "Offers",
  "Organic",
  "Local",
  "Express",
  "Low sugar",
  "High protein",
  "Breakfast",
  "Frozen",
  "Price: low to high"
];
const sortOptions = ["Recommended", "Price: low to high", "Price: high to low", "Rating", "Deals first"];
const priceBands = ["Any price", "Under Rs. 100", "Rs. 100 - Rs. 180", "Above Rs. 180"];
const recentSearchStorageKey = "freshcart-recent-searches";
const categoryProductAliases: Record<string, string> = {};
const emptyCheckoutAddress = {
  "Recipient name": "",
  "Phone number": "",
  "Address line 1": "",
  City: "",
  "Postal code": "",
  Landmark: ""
};

const protectedViews: CustomerView[] = [
  "wishlist",
  "checkout-address",
  "checkout-delivery",
  "checkout-payment",
  "checkout-review",
  "checkout-failed",
  "confirmation",
  "orders",
  "tracking",
  "support",
  "account",
  "account-profile",
  "account-addresses",
  "account-wallet",
  "account-notifications",
  "reviews",
  "serviceability"
];

function CartIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="26" viewBox="0 0 24 24" width="26">
      <path
        d="M4 5h2.2l2.05 9.75a2 2 0 0 0 1.95 1.58h6.9a2 2 0 0 0 1.9-1.36L20.2 9H7.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.05"
      />
      <path
        d="M10.2 20.2h.1M17.2 20.2h.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3.1"
      />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="26" viewBox="0 0 24 24" width="26">
      <path
        d="M12 20.3 10.9 19.3C6.2 15.1 3.1 12.3 3.1 8.9A4.45 4.45 0 0 1 7.6 4.4c1.9 0 3.5 1 4.4 2.45A5.1 5.1 0 0 1 16.4 4.4a4.45 4.45 0 0 1 4.5 4.5c0 3.4-3.1 6.2-7.8 10.4L12 20.3Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.05"
      />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <path
        d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <path
        d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 0 0-14.4 7.2 7.2 0 0 0 0 14.4Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M12 7v5l3.2 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <path
        d="M20 21a8 8 0 0 0-16 0M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function AccountMenuIcon({
  type
}: {
  type: "orders" | "address" | "products" | "deals" | "admin" | "support" | "contact" | "logout";
}) {
  const paths = {
    orders: "M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9ZM12 12l8-4.5M12 12v9M12 12 4 7.5",
    address: "M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
    products: "M7 17 17 7M9 7h8v8",
    deals: "M7 17 17 7M9 7h8v8",
    admin: "M12 3 19 6v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3Z",
    support: "M5 12a7 7 0 1 1 14 0v4a2 2 0 0 1-2 2h-2M5 12v4a2 2 0 0 0 2 2h2M9 18h6",
    contact: "M4 5h16v14H4V5Zm0 2 8 6 8-6",
    logout: "M10 17l5-5-5-5M15 12H3M21 4v16"
  };

  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <path
        d={paths[type]}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

const productAngles = ["Front", "Top", "Pack", "Side"];
const trustSignals = [
  "Quality checked at dispatch",
  "Cold-chain dairy handling",
  "COD and online-ready checkout",
  "Support in under 5 min"
];

type CustomerOrder = {
  id: string;
  customer: string;
  status: string;
  payment: string;
  slot: string;
  total: number;
  items: string[];
  itemDetails?: Array<{
    productId?: string | null;
    slug?: string | null;
    name: string;
    unit: string;
    quantity: number;
    price: number;
    unitPrice: number;
  }>;
  canCancel: boolean;
  canReturn: boolean;
};

type SupportTicket = {
  id: string;
  topic: string;
  status: string;
  channel: string;
  updated: string;
};

const categoryArtwork: Record<string, { color: string; position: string }> = {
  all: { color: "rgba(102, 11, 5, 0.28)", position: "center" },
  "fresh-produce": { color: "rgba(21, 153, 71, 0.28)", position: "42% 42%" },
  "dairy-and-eggs": { color: "rgba(245, 202, 153, 0.36)", position: "64% 48%" },
  bakery: { color: "rgba(201, 144, 82, 0.34)", position: "36% 54%" },
  staples: { color: "rgba(184, 107, 0, 0.3)", position: "58% 58%" },
  beverages: { color: "rgba(31, 111, 235, 0.22)", position: "70% 44%" },
  frozen: { color: "rgba(125, 74, 158, 0.26)", position: "48% 48%" },
  household: { color: "rgba(137, 201, 173, 0.28)", position: "56% 40%" },
  organic: { color: "rgba(21, 153, 71, 0.34)", position: "34% 46%" }
};

function categoryImageStyle(slug: string) {
  const artwork = categoryArtwork[slug] ?? categoryArtwork.all;
  return {
    backgroundImage: `linear-gradient(135deg, ${artwork.color}, rgba(255, 255, 255, 0.1)), url("/images/grocery-hero.png")`,
    backgroundPosition: artwork.position,
    backgroundSize: "cover"
  };
}

const productColors = ["#f7d94c", "#f3ead0", "#c99052", "#e6f6ff", "#e8483e", "#6a3f2d", "#cfb36e", "#89c9ad"];

function productKey(productId: ProductId) {
  return String(productId);
}

function showImageFallback(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.hidden = true;
  const fallback = event.currentTarget.nextElementSibling;
  if (fallback instanceof HTMLElement) {
    fallback.hidden = false;
  }
}

function slugifyClient(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function productStockLabel(stockStatus: unknown): Product["stock"] {
  const status = String(stockStatus ?? "IN_STOCK").toUpperCase();
  if (status === "LOW_STOCK") return "Low stock";
  if (status === "OUT_OF_STOCK") return "Out of stock";
  return "In stock";
}

function sortQueryValue(sortMode: string) {
  if (sortMode === "Price: low to high") return "price_asc";
  if (sortMode === "Price: high to low") return "price_desc";
  if (sortMode === "Rating") return "rating";
  if (sortMode === "Deals first") return "deals";
  return "newest";
}

function priceQueryRange(priceBand: string) {
  if (priceBand === "Under Rs. 100") return { maxPrice: "99" };
  if (priceBand === "Rs. 100 - Rs. 180") return { minPrice: "100", maxPrice: "180" };
  if (priceBand === "Above Rs. 180") return { minPrice: "181" };
  return {};
}

function stockQueryValue(activeFilters: string[]) {
  if (activeFilters.includes("Out of stock")) return "out";
  if (activeFilters.includes("Low stock")) return "low";
  if (activeFilters.includes("In stock")) return "available";
  return undefined;
}

function tagQueryValues(activeFilters: string[]) {
  const tagMap: Record<string, string> = {
    Local: "local",
    Express: "express",
    "Low sugar": "low-sugar",
    "High protein": "protein",
    Breakfast: "breakfast",
    Frozen: "frozen"
  };
  return activeFilters.map((filter) => tagMap[filter]).filter(Boolean);
}

function dietaryQueryValues(activeFilters: string[]) {
  return activeFilters.includes("Organic") ? ["organic"] : [];
}

function mapApiProduct(product: Record<string, unknown>, index: number): Product {
  const price = Number(product.salePrice ?? product.price ?? 0);
  const oldPrice = product.salePrice ? Number(product.price ?? 0) : undefined;
  const category = String(product.category ?? "Uncategorized");
  const badge = String(product.badge ?? category);
  return {
    id: String(product.id ?? product.slug ?? `product-${index + 1}`),
    slug: String(product.slug ?? `product-${index + 1}`),
    name: String(product.name ?? "Untitled product"),
    category,
    unit: String(product.unit ?? "1 unit"),
    price,
    oldPrice: oldPrice && oldPrice > price ? oldPrice : undefined,
    badge,
    stock: productStockLabel(product.stockStatus),
    rating: Number(product.rating ?? 0).toFixed(1),
    color: productColors[index % productColors.length],
    image: typeof product.image === "string" && product.image.trim() ? product.image.trim() : undefined,
    description: String(product.description ?? "Product details will appear after the admin team adds them."),
    supplier: String(product.supplier ?? "FreshCart"),
    tags: Array.isArray(product.tags) ? product.tags.map(String) : [badge.toLowerCase(), category.toLowerCase()]
  };
}

function cartFromApi(cart: ApiCart | undefined): Cart {
  return (cart?.items ?? []).reduce<Cart>((nextCart, item) => {
    if (item.productId && Number(item.quantity) > 0) {
      nextCart[productKey(item.productId)] = Number(item.quantity);
    }
    return nextCart;
  }, {});
}

function productsFromCartApi(cart: ApiCart | undefined): Product[] {
  return (cart?.items ?? [])
    .map((item, index) => (item.product ? mapApiProduct(item.product, index) : null))
    .filter((product): product is Product => Boolean(product));
}

function wishlistFromApi(wishlist: ApiWishlist | undefined): ProductId[] {
  return (wishlist?.items ?? [])
    .map((item) => item.productId)
    .filter((productId): productId is ProductId => typeof productId === "string" || typeof productId === "number");
}

function customerFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = typeof window !== "undefined" ? window.localStorage.getItem("freshcart-auth-token") : "";
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
}

export function CustomerExperience({
  view,
  title,
  initialQuery = "",
  categorySlug,
  productSlug,
  orderNumber
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<Cart>(defaultCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [slot, setSlot] = useState("");
  const [deliverySlots, setDeliverySlots] = useState<DeliverySlot[]>([]);
  const [wishlist, setWishlist] = useState(defaultWishlist);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [deliveryLocations, setDeliveryLocations] = useState<DeliveryLocation[]>([]);
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation>({
    label: "Check delivery area",
    detail: "Enter pincode",
    eta: "Live"
  });
  const [accountOpen, setAccountOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState(sortOptions[0]);
  const [priceBand, setPriceBand] = useState(priceBands[0]);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [cartProductSnapshots, setCartProductSnapshots] = useState<Product[]>([]);
  const [catalogFacets, setCatalogFacets] = useState<CatalogFacetState>({ suppliers: [] });
  const supplierOptions = useMemo(
    () => {
      const facetSuppliers = catalogFacets.suppliers.map((supplier) => supplier.name).filter(Boolean);
      const productSuppliers = catalogProducts.map((product) => product.supplier).filter(Boolean);
      return ["All suppliers", ...Array.from(new Set([...facetSuppliers, ...productSuppliers]))];
    },
    [catalogFacets.suppliers, catalogProducts]
  );
  const [supplierFilter, setSupplierFilter] = useState(supplierOptions[0]);
  const [pincodeDraft, setPincodeDraft] = useState("");
  const [serviceMessage, setServiceMessage] = useState("Enter your pincode to check live delivery serviceability.");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestionState>({ products: [], categories: [], suppliers: [] });
  const [searchFocused, setSearchFocused] = useState(false);
  const [toast, setToast] = useState<{ title: string; text: string } | null>(null);
  const [storefront, setStorefront] = useState<StorefrontData>(emptyStorefrontData);

  const selectedProduct =
    catalogProducts.find((product) => product.slug === productSlug) ?? catalogProducts[0];
  const selectedCategorySlug = useMemo(() => {
    if (categorySlug) return categorySlug;
    if (activeCategory === "All") return "";
    return storefront.categories.find((category) => category.name === activeCategory)?.slug ?? "";
  }, [activeCategory, categorySlug, storefront.categories]);
  const productQueryString = useMemo(() => {
    const params = new URLSearchParams({ limit: "100", sort: sortQueryValue(sortMode) });
    const normalizedQuery = query.trim();
    const stock = stockQueryValue(activeFilters);
    const tags = tagQueryValues(activeFilters);
    const dietary = dietaryQueryValues(activeFilters);
    const priceRange = priceQueryRange(priceBand);

    if (normalizedQuery && view === "search") params.set("search", normalizedQuery);
    if (selectedCategorySlug && (view === "home" || view === "categories")) params.set("category", selectedCategorySlug);
    if (supplierFilter !== "All suppliers") params.set("supplier", supplierFilter);
    if (stock) params.set("stock", stock);
    if (tags.length) params.set("tags", tags.join(","));
    if (dietary.length) params.set("dietary", dietary.join(","));
    if (priceRange.minPrice) params.set("min_price", priceRange.minPrice);
    if (priceRange.maxPrice) params.set("max_price", priceRange.maxPrice);
    if (/^\d{6}$/.test(pincodeDraft.trim())) params.set("pincode", pincodeDraft.trim());
    return params.toString();
  }, [activeFilters, pincodeDraft, priceBand, query, selectedCategorySlug, sortMode, supplierFilter, view]);

  const filteredProducts = useMemo(() => {
    const filtered = catalogProducts.filter((product) => {
      const categoryMatch =
        activeCategory === "All" ||
        product.category === activeCategory ||
        product.category === categoryProductAliases[activeCategory] ||
        view === "products";
      const queryMatch = `${product.name} ${product.category} ${product.tags.join(" ")} ${product.badge}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const offerMatch = view !== "offers" || product.oldPrice;
      const stockFilter = !activeFilters.includes("In stock") || product.stock !== "Out of stock";
      const lowStockFilter = !activeFilters.includes("Low stock") || product.stock === "Low stock";
      const outOfStockFilter = !activeFilters.includes("Out of stock") || product.stock === "Out of stock";
      const dealFilter = !activeFilters.includes("Offers") || Boolean(product.oldPrice);
      const organicFilter =
        !activeFilters.includes("Organic") ||
        product.category === "Organic" ||
        product.badge.toLowerCase().includes("organic") ||
        product.tags.includes("organic");
      const localFilter =
        !activeFilters.includes("Local") ||
        product.badge.toLowerCase().includes("local") ||
        product.tags.includes("local");
      const expressFilter =
        !activeFilters.includes("Express") ||
        product.badge.toLowerCase().includes("express") ||
        product.tags.includes("express");
      const lowSugarFilter =
        !activeFilters.includes("Low sugar") ||
        product.tags.includes("low-sugar") ||
        product.tags.includes("no-sugar");
      const proteinFilter =
        !activeFilters.includes("High protein") ||
        product.badge.toLowerCase().includes("protein") ||
        product.tags.includes("protein");
      const breakfastFilter =
        !activeFilters.includes("Breakfast") ||
        product.tags.includes("breakfast");
      const frozenFilter =
        !activeFilters.includes("Frozen") ||
        product.category === "Frozen" ||
        product.tags.includes("frozen");
      const supplierMatch = supplierFilter === "All suppliers" || product.supplier === supplierFilter;
      const priceFilter =
        priceBand === "Any price" ||
        (priceBand === "Under Rs. 100" && product.price < 100) ||
        (priceBand === "Rs. 100 - Rs. 180" && product.price >= 100 && product.price <= 180) ||
        (priceBand === "Above Rs. 180" && product.price > 180);
      return (
        categoryMatch &&
        queryMatch &&
        offerMatch &&
        stockFilter &&
        lowStockFilter &&
        outOfStockFilter &&
        dealFilter &&
        organicFilter &&
        localFilter &&
        expressFilter &&
        lowSugarFilter &&
        proteinFilter &&
        breakfastFilter &&
        frozenFilter &&
        supplierMatch &&
        priceFilter
      );
    });
    if (activeFilters.includes("Price: low to high") || sortMode === "Price: low to high") {
      return [...filtered].sort((first, second) => first.price - second.price);
    }
    if (sortMode === "Price: high to low") {
      return [...filtered].sort((first, second) => second.price - first.price);
    }
    if (sortMode === "Rating") {
      return [...filtered].sort((first, second) => Number(second.rating) - Number(first.rating));
    }
    if (sortMode === "Deals first") {
      return [...filtered].sort((first, second) => Number(Boolean(second.oldPrice)) - Number(Boolean(first.oldPrice)));
    }
    return filtered;
  }, [activeCategory, activeFilters, catalogProducts, priceBand, query, sortMode, supplierFilter, view]);

  const cartProducts = useMemo(() => {
    const byId = new Map<string, Product>();
    for (const product of [...catalogProducts, ...cartProductSnapshots]) {
      byId.set(productKey(product.id), product);
    }
    return Array.from(byId.values());
  }, [cartProductSnapshots, catalogProducts]);
  const cartItems = useMemo(
    () =>
      cartProducts
        .filter((product) => cart[productKey(product.id)])
        .map((product) => ({ ...product, quantity: cart[productKey(product.id)] })),
    [cart, cartProducts]
  );
  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const savings = cartItems.reduce(
    (total, item) => total + ((item.oldPrice ?? item.price) - item.price) * item.quantity,
    0
  );
  const deliveryFee = subtotal > 499 ? 0 : 39;
  const total = subtotal + deliveryFee;
  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const storefrontCategories = useMemo(
    () => {
      const activeCategories = storefront.categories
        .filter((category) => category.status === "Active")
        .sort((first, second) => first.order - second.order);
      const featuredCategories = activeCategories.filter((category) => category.featured);
      return featuredCategories.length >= 6 ? featuredCategories : activeCategories;
    },
    [storefront.categories]
  );
  const liveCoupons = useMemo(
    () => storefront.coupons.filter((coupon) => coupon.status === "Active"),
    [storefront.coupons]
  );
  const livePromotions = useMemo(
    () =>
      storefront.promotions
        .filter((promotion) => promotion.status === "Live")
        .sort((first, second) => first.priority - second.priority),
    [storefront.promotions]
  );
  const liveCouponBanners = useMemo(
    () =>
      storefront.couponBanners
        .filter((banner) => banner.status === "Live")
        .sort((first, second) => first.priority - second.priority),
    [storefront.couponBanners]
  );
  const isProtectedView = protectedViews.includes(view);
  const canRenderView = !isProtectedView || (authReady && signedIn);

  function showToast(title: string, text: string) {
    setToast({ title, text });
  }

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const activeNavHref =
    view === "home"
      ? "/"
      : view === "categories"
        ? "/categories/fresh-produce"
        : view === "offers"
          ? "/offers"
          : view === "orders"
            ? "/orders"
            : view === "tracking"
              ? "/orders"
          : view === "support"
            ? "/support"
            : view.startsWith("account")
              ? "/account"
              : view === "reviews"
                ? "/account"
                : view === "serviceability"
                  ? "/products"
                : "/products";

  useEffect(() => {
    const authStatus = window.localStorage.getItem("freshcart-auth-status");
    const authToken = window.localStorage.getItem("freshcart-auth-token");
    setSignedIn(Boolean(authToken) && authStatus !== "signed-out");
    setAuthReady(true);

    const updateOnlineState = () => setIsOnline(window.navigator.onLine);
    updateOnlineState();
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, []);

  useEffect(() => {
    if (!authReady || signedIn || !isProtectedView) return;
    const nextPath = `${window.location.pathname}${window.location.search}`;
    window.location.replace(`/login?next=${encodeURIComponent(nextPath)}`);
  }, [authReady, isProtectedView, signedIn]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      customerFetch("/api/customer/cart", { cache: "no-store" }).then((response) => (response.ok ? response.json() : {})),
      customerFetch("/api/customer/wishlist", { cache: "no-store" }).then((response) => (response.ok ? response.json() : {})),
      customerFetch("/api/customer/search-history", { cache: "no-store" }).then((response) => (response.ok ? response.json() : {})),
      customerFetch("/api/customer/branches", { cache: "no-store" }).then((response) => (response.ok ? response.json() : {})),
      customerFetch("/api/customer/delivery-slots", { cache: "no-store" }).then((response) => (response.ok ? response.json() : {}))
    ])
      .then(([cartData, wishlistData, searchData, branchData, slotData]: [
        { cart?: ApiCart },
        { wishlist?: ApiWishlist },
        { searches?: string[] },
        { branches?: Array<{ label?: string; detail?: string; eta?: string }> },
        { slots?: DeliverySlot[] }
      ]) => {
        if (!mounted) return;
        setCart(cartFromApi(cartData.cart));
        setCartProductSnapshots(productsFromCartApi(cartData.cart));
        setWishlist(wishlistFromApi(wishlistData.wishlist));
        setRecentSearches(Array.isArray(searchData.searches) ? searchData.searches.slice(0, 6) : []);
        const liveLocations = (branchData.branches ?? [])
          .filter((branch) => branch.label)
          .map((branch) => ({
            label: String(branch.label),
            detail: String(branch.detail ?? "Branch service area"),
            eta: String(branch.eta ?? "Check")
          }));
        setDeliveryLocations(liveLocations);
        if (liveLocations[0]) setDeliveryLocation(liveLocations[0]);
        const liveSlots = Array.isArray(slotData.slots) ? slotData.slots : [];
        setDeliverySlots(liveSlots);
        if (liveSlots[0]) setSlot((current) => current || liveSlots[0].label);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const savedSlot = window.localStorage.getItem("freshcart-delivery-slot");
    if (savedSlot) setSlot(savedSlot);
  }, []);

  useEffect(() => {
    const buyNowProductId = window.sessionStorage.getItem("freshcart-buy-now-product");
    if (!buyNowProductId) return;
    setCart((current) => ({
      ...current,
      [buyNowProductId]: Math.max(current[buyNowProductId] ?? 0, 1)
    }));
    window.sessionStorage.removeItem("freshcart-buy-now-product");
  }, []);

  useEffect(() => {
    try {
      const reorderCart = window.localStorage.getItem("freshcart-reorder-cart");
      if (!reorderCart) return;
      const parsedCart = JSON.parse(reorderCart);
      if (!parsedCart || typeof parsedCart !== "object" || Array.isArray(parsedCart)) return;
      const nextCart = Object.entries(parsedCart).reduce<Cart>((cart, [productId, quantity]) => {
        const numericQuantity = Number(quantity);
        if (numericQuantity > 0) {
          cart[productId] = numericQuantity;
        }
        return cart;
      }, {});
      if (Object.keys(nextCart).length > 0) {
        setCart((current) => ({ ...current, ...nextCart }));
        setCartOpen(true);
      }
    } catch {
      window.localStorage.removeItem("freshcart-reorder-cart");
    } finally {
      window.localStorage.removeItem("freshcart-reorder-cart");
    }
  }, []);

  useEffect(() => {
    if (!slot) return;
    window.localStorage.setItem("freshcart-delivery-slot", slot);
  }, [slot]);

  useEffect(() => {
    let mounted = true;
    const loadStorefront = () => {
      fetch("/api/storefront", { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : emptyStorefrontData))
        .then((data: StorefrontData) => {
          if (mounted) setStorefront(data);
        })
        .catch(() => {
          if (mounted) setStorefront(emptyStorefrontData);
        });
    };
    loadStorefront();
    const refreshTimer = window.setInterval(loadStorefront, 8000);
    window.addEventListener("focus", loadStorefront);

    return () => {
      mounted = false;
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", loadStorefront);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const timeout = window.setTimeout(() => {
      fetch(`/api/products?${productQueryString}`, { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : { items: [], facets: { suppliers: [] } }))
        .then((data: { items?: Array<Record<string, unknown>>; facets?: CatalogFacetState }) => {
          if (!mounted) return;
          const liveProducts = Array.isArray(data.items) ? data.items.map(mapApiProduct) : [];
          setCatalogProducts(liveProducts);
          setCatalogFacets({ suppliers: Array.isArray(data.facets?.suppliers) ? data.facets.suppliers : [] });
        })
        .catch(() => {
          if (!mounted) return;
          setCatalogProducts([]);
          setCatalogFacets({ suppliers: [] });
        });
    }, 160);

    return () => {
      mounted = false;
      window.clearTimeout(timeout);
    };
  }, [productQueryString]);

  useEffect(() => {
    let mounted = true;
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
      setSearchSuggestions({ products: [], categories: [], suppliers: [] });
      return () => {
        mounted = false;
      };
    }
    const timeout = window.setTimeout(() => {
      fetch(`/api/search/suggestions?q=${encodeURIComponent(normalizedQuery)}&limit=6`, { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : { products: [], categories: [], suppliers: [] }))
        .then((data: Partial<SearchSuggestionState>) => {
          if (!mounted) return;
          setSearchSuggestions({
            products: Array.isArray(data.products) ? data.products : [],
            categories: Array.isArray(data.categories) ? data.categories : [],
            suppliers: Array.isArray(data.suppliers) ? data.suppliers : []
          });
        })
        .catch(() => {
          if (mounted) setSearchSuggestions({ products: [], categories: [], suppliers: [] });
        });
    }, 180);
    return () => {
      mounted = false;
      window.clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    if (!categorySlug) return;
    const matchedCategory = storefront.categories.find((category) => category.slug === categorySlug);
    if (matchedCategory) setActiveCategory(matchedCategory.name);
  }, [categorySlug, storefront.categories]);

  async function saveRecentSearch(searchTerm: string) {
    const normalized = searchTerm.trim();
    if (!normalized) return [];
    const nextSearches = [
      normalized,
      ...recentSearches.filter((search) => search.toLowerCase() !== normalized.toLowerCase())
    ].slice(0, 6);
    setRecentSearches(nextSearches);
    void customerFetch("/api/customer/search-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: normalized })
    }).catch(() => undefined);
    return nextSearches;
  }

  function runSearch(searchTerm: string) {
    const normalized = searchTerm.trim();
    if (normalized) void saveRecentSearch(normalized);
    window.location.href = normalized ? `/search?q=${encodeURIComponent(normalized)}` : "/search";
  }

  function clearRecentSearches() {
    setRecentSearches([]);
    void customerFetch("/api/customer/search-history", { method: "DELETE" }).catch(() => undefined);
  }

  function addToCart(product: Product) {
    if (product.stock === "Out of stock") {
      showToast("Unavailable", `${product.name} is out of stock right now.`);
      return;
    }
    const id = productKey(product.id);
    const nextQuantity = (cart[id] ?? 0) + 1;
    setCart((current) => ({ ...current, [id]: nextQuantity }));
    showToast("Added to cart", `${product.name} is now in your cart.`);
    void customerFetch("/api/customer/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id, quantity: nextQuantity })
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { cart?: ApiCart } | null) => {
        if (data?.cart) {
          setCart(cartFromApi(data.cart));
          setCartProductSnapshots(productsFromCartApi(data.cart));
        }
      })
      .catch(() => undefined);
  }

  function updateQuantity(productId: ProductId, nextQuantity: number) {
    setCart((current) => {
      const next = { ...current };
      const id = productKey(productId);
      if (nextQuantity <= 0) {
        delete next[id];
      } else {
        next[id] = nextQuantity;
      }
      return next;
    });
    void customerFetch("/api/customer/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: productKey(productId), quantity: Math.max(0, nextQuantity) })
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { cart?: ApiCart } | null) => {
        if (data?.cart) {
          setCart(cartFromApi(data.cart));
          setCartProductSnapshots(productsFromCartApi(data.cart));
        }
      })
      .catch(() => undefined);
  }

  function toggleWishlist(productId: ProductId) {
    setWishlist((current) => {
      const id = productKey(productId);
      const next = current.map(productKey).includes(id)
        ? current.filter((savedProductId) => productKey(savedProductId) !== id)
        : [productId, ...current];
      return next;
    });
    void customerFetch("/api/customer/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: productKey(productId) })
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { wishlist?: ApiWishlist } | null) => {
        if (data?.wishlist) setWishlist(wishlistFromApi(data.wishlist));
      })
      .catch(() => undefined);
  }

  function buyNow(product: Product) {
    if (product.stock === "Out of stock") {
      showToast("Unavailable", `${product.name} is out of stock right now.`);
      return;
    }
    const id = productKey(product.id);
    const nextQuantity = Math.max(cart[id] ?? 0, 1);
    setCart((current) => ({ ...current, [id]: Math.max(current[id] ?? 0, 1) }));
    showToast("Buy now", `${product.name} added. Opening checkout.`);
    void customerFetch("/api/customer/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id, quantity: nextQuantity })
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { cart?: ApiCart } | null) => {
        if (data?.cart) {
          setCart(cartFromApi(data.cart));
          setCartProductSnapshots(productsFromCartApi(data.cart));
        }
      })
      .catch(() => undefined);
    window.sessionStorage.setItem("freshcart-buy-now-product", String(product.id));
    window.setTimeout(() => {
      window.location.href = "/checkout/address";
    }, 550);
  }

  function toggleFilter(filter: string) {
    setActiveFilters((current) =>
      current.includes(filter)
        ? current.filter((activeFilter) => activeFilter !== filter)
        : [...current, filter]
    );
  }

  function clearCatalogFilters() {
    setActiveFilters([]);
    setSortMode(sortOptions[0]);
    setPriceBand(priceBands[0]);
    setSupplierFilter(supplierOptions[0]);
  }

  async function checkServiceability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = pincodeDraft.trim();
    if (!/^\d{6}$/.test(normalized)) {
      setServiceMessage("Enter a valid 6-digit pincode to check delivery.");
      return;
    }
    setServiceMessage("Checking live branch coverage...");
    try {
      const response = await customerFetch("/api/customer/serviceability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode: normalized })
      });
      const data = (await response.json()) as { serviceable?: boolean; branches?: Array<{ name?: string; area?: string }> };
      const branch = data.branches?.[0];
      if (!response.ok || !data.serviceable || !branch?.name) {
        setServiceMessage(`Pincode ${normalized} is not serviceable yet. Products remain browse-only.`);
        return;
      }
      setDeliveryLocation({
        label: branch.name,
        detail: branch.area ?? `Pincode ${normalized}`,
        eta: "Live"
      });
      setServiceMessage(`Pincode ${normalized} is serviceable. Nearest branch: ${branch.name}.`);
      setDeliveryOpen(false);
    } catch {
      setServiceMessage("Could not check serviceability right now.");
    }
  }

  function submitGlobalSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runSearch(query);
  }

  return (
    <main className="customer-app">
      <header className="customer-header">
        <a className="brand" href="/">
          <span className="brand-mark">FC</span>
          <div>
            <strong>FreshCart Market</strong>
            <small>Grocery delivery</small>
          </div>
        </a>
        <div className="location-menu">
          <button
            aria-expanded={deliveryOpen}
            className="location-pill"
            onClick={() => {
              setDeliveryOpen((open) => !open);
              setAccountOpen(false);
            }}
            type="button"
          >
            <b>
              <MapPinIcon />
            </b>
            <span>
              Deliver to
              <strong>{deliveryLocation.label}</strong>
              <small>{deliveryLocation.eta} - {deliveryLocation.detail}</small>
            </span>
          </button>
          {deliveryOpen ? (
            <div className="location-dropdown">
              <strong>Choose delivery area</strong>
              {deliveryLocations.length > 0 ? (
                deliveryLocations.map((location) => (
                  <button
                    className={location.label === deliveryLocation.label ? "active" : ""}
                    key={location.label}
                    onClick={() => {
                      setDeliveryLocation(location);
                      setDeliveryOpen(false);
                    }}
                    type="button"
                  >
                    <span>
                      <b>{location.label}</b>
                      <small>{location.detail}</small>
                    </span>
                    <em>{location.eta}</em>
                  </button>
                ))
              ) : (
                <p className="empty-copy">No active delivery branches are configured yet.</p>
              )}
              <form className="serviceability-form" onSubmit={checkServiceability}>
                <label>
                  <span>Check pincode</span>
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    onChange={(event) => setPincodeDraft(event.target.value)}
                    placeholder="400050"
                    value={pincodeDraft}
                  />
                </label>
                <button type="submit">Check</button>
                <small>{serviceMessage}</small>
              </form>
            </div>
          ) : null}
        </div>
        <form className="global-search" onSubmit={submitGlobalSearch}>
          <button type="submit" aria-label="Search products">
            <SearchIcon />
          </button>
          <input
            value={query}
            onBlur={() => window.setTimeout(() => setSearchFocused(false), 140)}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => {
              setSearchFocused(true);
              setAccountOpen(false);
              setDeliveryOpen(false);
            }}
            placeholder="Search for milk, fruits, bread, snacks"
          />
          {searchFocused ? (
            <div className="recent-search-dropdown">
              {searchSuggestions.products.length || searchSuggestions.categories.length || searchSuggestions.suppliers.length ? (
                <div className="recent-search-list">
                  {searchSuggestions.products.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => {
                        void saveRecentSearch(suggestion.name);
                        window.location.href = suggestion.href;
                      }}
                      type="button"
                    >
                      <i>
                        <SearchIcon />
                      </i>
                      <span>
                        <strong>{suggestion.name}</strong>
                        <small>{suggestion.category} - Rs. {suggestion.price ?? ""}</small>
                      </span>
                    </button>
                  ))}
                  {searchSuggestions.categories.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => {
                        void saveRecentSearch(suggestion.name);
                        window.location.href = suggestion.href;
                      }}
                      type="button"
                    >
                      <i>
                        <SearchIcon />
                      </i>
                      <span>
                        <strong>{suggestion.name}</strong>
                        <small>Open category</small>
                      </span>
                    </button>
                  ))}
                  {searchSuggestions.suppliers.map((suggestion) => (
                    <button
                      key={suggestion.name}
                      onClick={() => {
                        void saveRecentSearch(suggestion.name);
                        window.location.href = suggestion.href;
                      }}
                      type="button"
                    >
                      <i>
                        <SearchIcon />
                      </i>
                      <span>
                        <strong>{suggestion.name}</strong>
                        <small>Filter by supplier</small>
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="recent-search-header">
                <strong>Recent searches</strong>
                {recentSearches.length > 0 ? (
                  <button onClick={clearRecentSearches} type="button">
                    Clear
                  </button>
                ) : null}
              </div>
              {recentSearches.length > 0 ? (
                <div className="recent-search-list">
                  {recentSearches.map((search) => (
                    <button
                      key={search}
                      onClick={() => {
                        setQuery(search);
                        runSearch(search);
                      }}
                      type="button"
                    >
                      <i>
                        <ClockIcon />
                      </i>
                      <span>
                        <strong>{search}</strong>
                        <small>Search again</small>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p>Search for products to build your recent list.</p>
              )}
            </div>
          ) : null}
        </form>
        <div className="header-actions">
          <button className="cart-link icon-action" onClick={() => setCartOpen(true)} type="button" aria-label="Open cart">
            <CartIcon />
            <strong>{itemCount}</strong>
          </button>
          <a className="icon-action wishlist-link" href="/wishlist" aria-label="Open wishlist">
            <HeartIcon />
            <span className="action-badge">{wishlist.length}</span>
          </a>
          <div className="account-menu">
            <button
              aria-expanded={accountOpen}
              className="account-trigger"
              onClick={() => {
                setAccountOpen((open) => !open);
                setDeliveryOpen(false);
              }}
              type="button"
            >
              <span className="account-avatar">{signedIn ? "J" : "G"}</span>
              <i aria-hidden="true" />
            </button>
            {accountOpen ? (
              <div className="account-dropdown">
                <a className="account-profile" href="/account">
                  <span className="account-avatar">{signedIn ? "A" : "G"}</span>
                  <div>
                    <strong>{signedIn ? "Account" : "Guest customer"}</strong>
                    <small>{signedIn ? "Open your profile" : "Sign in to save orders"}</small>
                  </div>
                </a>
                <a href="/orders">
                  <AccountMenuIcon type="orders" />
                  My Orders
                </a>
                <a href="/checkout/address">
                  <AccountMenuIcon type="address" />
                  Addresses
                </a>
                <a href="/account">
                  <UserIcon />
                  Account
                </a>
                <a href="/account/wallet">
                  <AccountMenuIcon type="deals" />
                  Wallet & loyalty
                </a>
                <a href="/reviews">
                  <AccountMenuIcon type="products" />
                  Reviews
                </a>
                <a href="/products">
                  <AccountMenuIcon type="products" />
                  Products
                </a>
                <a href="/offers">
                  <AccountMenuIcon type="deals" />
                  Deals
                </a>
                <a href="/contact">
                  <AccountMenuIcon type="contact" />
                  Contact
                </a>
                <a className="admin-menu-link" href={process.env.NEXT_PUBLIC_ADMIN_URL ? `${process.env.NEXT_PUBLIC_ADMIN_URL.replace(/\/$/, "")}/dashboard` : "http://localhost:3001/dashboard"}>
                  <AccountMenuIcon type="admin" />
                  Admin Panel
                </a>
                <a href="/support">
                  <AccountMenuIcon type="support" />
                  Support
                </a>
                {signedIn ? (
                  <button
                    className="logout-menu-link"
                    onClick={() => {
                      window.localStorage.setItem("freshcart-auth-status", "signed-out");
                      setSignedIn(false);
                      setAccountOpen(false);
                    }}
                    type="button"
                  >
                    <AccountMenuIcon type="logout" />
                    Logout
                  </button>
                ) : (
                  <a className="logout-menu-link" href="/login">
                    <AccountMenuIcon type="logout" />
                    Sign in
                  </a>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <nav className="customer-nav" aria-label="Customer modules">
        {navItems.map((item) => (
          <a className={item.href === activeNavHref ? "active" : ""} key={item.label} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
      {!isOnline ? (
        <CustomerStatusBanner
          actionHref="/support"
          actionText="Open support"
          tone="warning"
          title="You are offline"
          text="Some checkout, payment, and support actions may not save until your connection returns."
        />
      ) : null}

      <section className="shopping-shell">
        <section className="main-module">
          {isProtectedView && !authReady ? (
            <PageStatePanel
              icon={<UserIcon />}
              title="Checking your account"
              text="We are confirming your customer session before opening this page."
              actionHref="/login"
              actionText="Sign in"
            />
          ) : null}
          {isProtectedView && authReady && !signedIn ? (
            <PageStatePanel
              icon={<UserIcon />}
              title="Sign in required"
              text="This page contains customer data. Sign in to continue with orders, checkout, wallet, reviews, and support."
              actionHref="/login"
              actionText="Go to login"
            />
          ) : null}
          {canRenderView && view === "home" ? (
            <HomeModule
              activeCategory={activeCategory}
              filteredProducts={filteredProducts}
              liveCoupons={liveCoupons}
              livePromotions={livePromotions}
              storefrontCategories={storefrontCategories}
              setActiveCategory={setActiveCategory}
              updateQuantity={updateQuantity}
              addToCart={addToCart}
              buyNow={buyNow}
              cart={cart}
              wishlist={wishlist}
              toggleWishlist={toggleWishlist}
              activeFilters={activeFilters}
              toggleFilter={toggleFilter}
              sortMode={sortMode}
              setSortMode={setSortMode}
              priceBand={priceBand}
              setPriceBand={setPriceBand}
              supplierOptions={supplierOptions}
              supplierFilter={supplierFilter}
              setSupplierFilter={setSupplierFilter}
              clearCatalogFilters={clearCatalogFilters}
            />
          ) : null}

          {canRenderView && view === "categories" ? (
            <CategoryModule
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              storefrontCategories={storefrontCategories}
              filteredProducts={filteredProducts}
              cart={cart}
              addToCart={addToCart}
              buyNow={buyNow}
              updateQuantity={updateQuantity}
              wishlist={wishlist}
              toggleWishlist={toggleWishlist}
              activeFilters={activeFilters}
              toggleFilter={toggleFilter}
              sortMode={sortMode}
              setSortMode={setSortMode}
              priceBand={priceBand}
              setPriceBand={setPriceBand}
              supplierOptions={supplierOptions}
              supplierFilter={supplierFilter}
              setSupplierFilter={setSupplierFilter}
              clearCatalogFilters={clearCatalogFilters}
            />
          ) : null}

          {canRenderView && (view === "products" || view === "search" || view === "offers") ? (
            <ListingModule
              title={
                title ??
                (view === "search"
                  ? "Search results"
                  : view === "offers"
                    ? "Offers and coupons"
                    : "All products")
              }
              subtitle={
                view === "search"
                  ? "Fast catalog search with filters planned for Meilisearch."
                  : view === "offers"
                    ? "Discounted products and coupon-ready promotion cards."
                    : "Full customer catalog view with categories, filters, and quick add."
              }
              productsToShow={filteredProducts}
              cart={cart}
              addToCart={addToCart}
              buyNow={buyNow}
              updateQuantity={updateQuantity}
              wishlist={wishlist}
              toggleWishlist={toggleWishlist}
              activeFilters={activeFilters}
              toggleFilter={toggleFilter}
              sortMode={sortMode}
              setSortMode={setSortMode}
              priceBand={priceBand}
              setPriceBand={setPriceBand}
              supplierOptions={supplierOptions}
              supplierFilter={supplierFilter}
              setSupplierFilter={setSupplierFilter}
              clearCatalogFilters={clearCatalogFilters}
            />
          ) : null}

          {canRenderView && view === "wishlist" ? (
            <WishlistModule
              products={catalogProducts}
              cart={cart}
              addToCart={addToCart}
              buyNow={buyNow}
              updateQuantity={updateQuantity}
              wishlist={wishlist}
              toggleWishlist={toggleWishlist}
            />
          ) : null}

          {canRenderView && view === "product-detail" && selectedProduct ? (
            <ProductDetailModule
              product={selectedProduct}
              products={catalogProducts}
              cart={cart}
              quantity={cart[productKey(selectedProduct.id)] ?? 0}
              addToCart={addToCart}
              buyNow={buyNow}
              updateQuantity={updateQuantity}
              wishlist={wishlist}
              toggleWishlist={toggleWishlist}
            />
          ) : null}
          {canRenderView && view === "product-detail" && !selectedProduct ? (
            <PageStatePanel
              icon={<SearchIcon />}
              title="No product found"
              text="Add products from the admin panel first, then this page will render from the live database catalog."
              actionHref="/products"
              actionText="Browse products"
            />
          ) : null}

          {canRenderView && (view.startsWith("checkout") || view === "confirmation") ? (
            <CheckoutModule
              view={view}
              cartItems={cartItems}
              liveCoupons={liveCoupons}
              subtotal={subtotal}
              savings={savings}
              deliveryFee={deliveryFee}
              deliverySlots={deliverySlots}
              total={total}
              slot={slot}
              setSlot={setSlot}
            />
          ) : null}

          {canRenderView && view === "account" ? <AccountModule /> : null}
          {canRenderView && view === "account-profile" ? <AccountProfileModule /> : null}
          {canRenderView && view === "account-addresses" ? <AccountAddressesModule /> : null}
          {canRenderView && view === "account-wallet" ? <AccountWalletModule /> : null}
          {canRenderView && view === "account-notifications" ? <AccountNotificationsModule /> : null}
          {canRenderView && view === "reviews" ? <ReviewCenterModule products={catalogProducts} /> : null}
          {canRenderView && view === "serviceability" ? <ServiceabilityModule products={catalogProducts} /> : null}

          {canRenderView && view === "orders" ? <OrdersModule addToCart={addToCart} products={catalogProducts} /> : null}

          {canRenderView && view === "tracking" ? (
            <TrackingModule fullTracking={view === "tracking"} orderNumber={orderNumber} />
          ) : null}

          {canRenderView && view === "support" ? <SupportModule /> : null}
        </section>

      </section>

      {view === "home" ? <PromotionBanner liveCoupons={liveCoupons} livePromotions={livePromotions} liveCouponBanners={liveCouponBanners} /> : null}
      <CustomerFooter />

      {cartOpen ? (
        <CartDrawer
          cartItems={cartItems}
          deliveryFee={deliveryFee}
          itemCount={itemCount}
          savings={savings}
          slot={slot}
          subtotal={subtotal}
          total={total}
          liveCoupons={liveCoupons}
          livePromotions={livePromotions}
          deliverySlots={deliverySlots}
          setSlot={setSlot}
          updateQuantity={updateQuantity}
          onClose={() => setCartOpen(false)}
        />
      ) : null}
      <nav className="mobile-bottom-nav" aria-label="Mobile quick navigation">
        <a className={view === "home" ? "active" : ""} href="/">
          <span>FC</span>
          Shop
        </a>
        <a className={view === "categories" ? "active" : ""} href="/categories/fresh-produce">
          <AccountMenuIcon type="products" />
          Categories
        </a>
        <a className={view === "search" || view === "products" ? "active" : ""} href="/search">
          <SearchIcon />
          Search
        </a>
        <a className={view === "wishlist" ? "active" : ""} href="/wishlist">
          <HeartIcon />
          Wishlist
        </a>
        <button className="cart-bottom-action" onClick={() => setCartOpen(true)} type="button">
          <CartIcon />
          Cart {itemCount}
        </button>
        <a className={view.startsWith("account") ? "active" : ""} href="/account">
          <UserIcon />
          Account
        </a>
      </nav>
      {itemCount > 0 && !cartOpen ? (
        <aside className="sticky-cart-bar">
          <span>
            <strong>{itemCount} items</strong>
            Rs. {total}
          </span>
          <button onClick={() => setCartOpen(true)} type="button">View cart</button>
          <a href="/checkout/address">Checkout</a>
        </aside>
      ) : null}
      {toast ? (
        <aside className="customer-toast" role="status" aria-live="polite">
          <strong>{toast.title}</strong>
          <span>{toast.text}</span>
        </aside>
      ) : null}
    </main>
  );
}

function CustomerStatusBanner({
  title,
  text,
  actionHref,
  actionText,
  tone = "default"
}: {
  title: string;
  text: string;
  actionHref?: string;
  actionText?: string;
  tone?: "default" | "warning";
}) {
  return (
    <section className={`client-status-banner ${tone}`} role={tone === "warning" ? "status" : undefined}>
      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
      {actionHref && actionText ? <a href={actionHref}>{actionText}</a> : null}
    </section>
  );
}

function PageStatePanel({
  icon,
  title,
  text,
  actionHref,
  actionText
}: {
  icon: ReactNode;
  title: string;
  text: string;
  actionHref: string;
  actionText: string;
}) {
  return (
    <section className="page-state-panel">
      <b>{icon}</b>
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      <a href={actionHref}>{actionText}</a>
    </section>
  );
}

function PromotionBanner({
  liveCoupons,
  livePromotions,
  liveCouponBanners
}: {
  liveCoupons: StorefrontData["coupons"];
  livePromotions: StorefrontData["promotions"];
  liveCouponBanners: StorefrontData["couponBanners"];
}) {
  const banner = liveCouponBanners[0];
  const promotion =
    livePromotions.find((item) => item.type.toLowerCase().includes("footer")) ??
    livePromotions.find((item) => item.placement.toLowerCase().includes("hero")) ??
    livePromotions[0];
  const coupon = liveCoupons[0];
  const title = banner?.title ?? promotion?.title ?? "Save more on your daily grocery basket";
  const cta = banner?.cta ?? promotion?.cta ?? "Shop offers";
  const href = banner?.target ?? promotion?.targetUrl ?? "/offers";

  return (
    <section className="footer-promo-banner" aria-label="FreshCart promotion">
      <div className="footer-promo-copy">
        <span className="promo-kicker">{banner?.placement ?? promotion?.placement ?? "Fresh weekend offer"}</span>
        <h2>{title}</h2>
        <p>
          {coupon?.code || promotion?.coupon ? (
            <>Use code <strong>{coupon?.code ?? promotion?.coupon}</strong> for {coupon?.campaign ?? promotion?.mappedTo ?? "live grocery savings"}.</>
          ) : (
            "Promotions published from admin will appear here."
          )}
        </p>
        <div className="promo-actions">
          <a className="promo-primary" href={href}>{cta}</a>
          <a className="promo-secondary" href="/orders">Track live order</a>
        </div>
      </div>
      <div className="footer-promo-card">
        <span>
          <strong>{coupon?.value ?? promotion?.value ?? "20%"}</strong>
          <small>{coupon?.maxDiscount ?? "off selected baskets"}</small>
        </span>
        <span>
          <strong>24 min</strong>
          <small>average delivery ETA</small>
        </span>
        <span>
          <strong>Fresh</strong>
          <small>quality checked items</small>
        </span>
      </div>
    </section>
  );
}

function CustomerFooter() {
  return (
    <footer className="customer-footer">
      <section className="footer-brand">
        <a className="brand" href="/">
          <span className="brand-mark">FC</span>
          <div>
            <strong>FreshCart Market</strong>
            <small>Fast grocery delivery</small>
          </div>
        </a>
        <p>Fresh groceries, clear prices, live delivery tracking, and friendly support for every order.</p>
        <div className="footer-brand-badges">
          <span>Same-day delivery</span>
          <span>Cold-chain packed</span>
          <span>COD ready</span>
        </div>
      </section>
      <nav aria-label="Footer shopping links">
        <strong>Shop</strong>
        <a href="/products">All products</a>
        <a href="/categories/fresh-produce">Fresh produce</a>
        <a href="/offers">Offers</a>
        <a href="/wishlist">Wishlist</a>
      </nav>
      <nav aria-label="Footer service links">
        <strong>Service</strong>
        <a href="/checkout/address">Checkout</a>
        <a href="/orders">Track order</a>
        <a href="/support">Support chat</a>
        <a href="/orders">Order history</a>
      </nav>
      <nav aria-label="Footer legal links">
        <strong>Company</strong>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/refund-policy">Refund policy</a>
        <a href="/shipping-policy">Delivery policy</a>
      </nav>
      <section className="footer-service">
        <strong>Delivery promise</strong>
        <span><b>24</b> min average ETA</span>
        <span><b>Fresh</b> cold-chain groceries</span>
        <span><b>COD</b> online-ready checkout</span>
        <span><b>Support</b> 9 AM - 11 PM</span>
        <div className="footer-contact-card">
          <small>Need order help?</small>
          <a href="/support">Open customer support</a>
        </div>
      </section>
      <section className="footer-bottom">
        <span>© 2026 FreshCart Market. Built for fast local grocery delivery.</span>
        <div>
          <span>UPI</span>
          <span>Cards</span>
          <span>Wallet</span>
          <span>COD</span>
          <a href="/support">Help</a>
          <a href="/privacy">Privacy</a>
          <a href="/orders">Track</a>
          <a href="/checkout/address">Checkout</a>
        </div>
      </section>
    </footer>
  );
}

function HomeModule({
  activeCategory,
  filteredProducts,
  liveCoupons,
  livePromotions,
  storefrontCategories,
  setActiveCategory,
  cart,
  addToCart,
  buyNow,
  updateQuantity,
  wishlist,
  toggleWishlist,
  activeFilters,
  toggleFilter,
  sortMode,
  setSortMode,
  priceBand,
  setPriceBand,
  supplierOptions,
  supplierFilter,
  setSupplierFilter,
  clearCatalogFilters
}: {
  activeCategory: string;
  filteredProducts: Product[];
  liveCoupons: StorefrontData["coupons"];
  livePromotions: StorefrontData["promotions"];
  storefrontCategories: StorefrontData["categories"];
  setActiveCategory: (category: string) => void;
  cart: Cart;
  addToCart: (product: Product) => void;
  buyNow: (product: Product) => void;
  updateQuantity: (productId: ProductId, nextQuantity: number) => void;
  wishlist: ProductId[];
  toggleWishlist: (productId: ProductId) => void;
  activeFilters: string[];
  toggleFilter: (filter: string) => void;
  sortMode: string;
  setSortMode: (sort: string) => void;
  priceBand: string;
  setPriceBand: (priceBand: string) => void;
  supplierOptions: string[];
  supplierFilter: string;
  setSupplierFilter: (supplier: string) => void;
  clearCatalogFilters: () => void;
}) {
  const heroPromotion =
    livePromotions.find((promotion) => promotion.placement.toLowerCase().includes("hero")) ?? livePromotions[0];
  const offerCards = [
    ...livePromotions.map((promotion) => ({
      icon: promotion.value.includes("%") ? "%" : promotion.value.toLowerCase().includes("delivery") ? "₹" : "✓",
      label: promotion.value,
      title: promotion.title,
      detail: `${promotion.cta} · ${promotion.mappedTo}`,
      href: promotion.targetUrl
    })),
    ...liveCoupons.map((coupon) => ({
      icon: coupon.type === "Percent" ? "%" : coupon.type === "Free delivery" ? "₹" : "✓",
      label: coupon.value,
      title: coupon.campaign,
      detail: `Use ${coupon.code} · ${coupon.minCart}`,
      href: "/offers"
    }))
  ].slice(0, 3);

  return (
    <>
      <section className="shopping-hero">
        <div>
          <span className="eyebrow">{heroPromotion?.value ?? "Express grocery delivery"} - 24 min average</span>
          <h1>{heroPromotion?.title ?? "Groceries delivered fast, fresh, and beautifully tracked."}</h1>
          <p>
            {heroPromotion
              ? `${heroPromotion.audience} campaign is live from admin. ${heroPromotion.mappedTo} is prioritized for this storefront.`
              : "Search your location, discover fresh picks, add essentials in seconds, and track every order with a premium delivery-app experience."}
          </p>
          <div className="hero-trust-row" aria-label="FreshCart service promises">
            {trustSignals.map((signal) => (
              <span key={signal}>{signal}</span>
            ))}
          </div>
          <div className="hero-actions">
            <a className="primary-link" href={heroPromotion?.targetUrl ?? "/products"}>
              {heroPromotion?.cta ?? "Start shopping"}
              <span className="hero-action-arrow" aria-hidden="true">→</span>
            </a>
            <a className="ghost-link" href="/offers">
              View deals
              <span className="hero-action-arrow" aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        <div className="hero-produce" aria-label="Fresh grocery produce">
          <span>ETA 24 min</span>
          <strong>Live rider tracking</strong>
          <small>Fresh produce, dairy and staples packed from the nearest branch.</small>
        </div>
      </section>

      <CategoryRail
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        storefrontCategories={storefrontCategories}
      />

      <section className="offer-rail" aria-label="Featured grocery offers">
        {offerCards.map((offer) => (
          <a href={offer.href} key={`${offer.title}-${offer.label}`}>
            <b aria-hidden="true">{offer.icon}</b>
            <span>{offer.label}</span>
            <strong>{offer.title}</strong>
            <small>{offer.detail}</small>
          </a>
        ))}
      </section>

      <section className="signal-grid">
        <Signal label="Delivery" value="24 min average" />
        <Signal label="Savings" value="Rs. 184 in cart" />
        <Signal label="Freshness" value="Batch-aware stock" />
        <Signal label="Support" value="Live chat ready" />
      </section>

      <HomeShoppingStrip productCount={filteredProducts.length} />

      <ProductGrid
        heading="Popular groceries"
        productsToShow={filteredProducts}
        cart={cart}
        addToCart={addToCart}
        buyNow={buyNow}
        updateQuantity={updateQuantity}
        wishlist={wishlist}
        toggleWishlist={toggleWishlist}
      />
    </>
  );
}

function HomeShoppingStrip({ productCount }: { productCount: number }) {
  const quickLinks = [
    { label: "Fresh produce", href: "/categories/fresh-produce", detail: "Quality checked" },
    { label: "Dairy & eggs", href: "/categories/dairy-and-eggs", detail: "Cold-chain" },
    { label: "Deals", href: "/offers", detail: "Today only" },
    { label: "Full filters", href: "/products", detail: `${productCount} items` }
  ];

  return (
    <section className="home-shopping-strip" aria-label="Quick shopping shortcuts">
      <div>
        <span>Shop faster</span>
        <strong>Popular shelves without heavy filters</strong>
        <small>Use product search or open all filters when you need detailed sorting.</small>
      </div>
      <nav>
        {quickLinks.map((link) => (
          <a href={link.href} key={link.label}>
            <strong>{link.label}</strong>
            <small>{link.detail}</small>
          </a>
        ))}
      </nav>
    </section>
  );
}

function CategoryModule(props: {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  storefrontCategories: StorefrontData["categories"];
  filteredProducts: Product[];
  cart: Cart;
  addToCart: (product: Product) => void;
  buyNow: (product: Product) => void;
  updateQuantity: (productId: ProductId, nextQuantity: number) => void;
  wishlist: ProductId[];
  toggleWishlist: (productId: ProductId) => void;
  activeFilters: string[];
  toggleFilter: (filter: string) => void;
  sortMode: string;
  setSortMode: (sort: string) => void;
  priceBand: string;
  setPriceBand: (priceBand: string) => void;
  supplierOptions: string[];
  supplierFilter: string;
  setSupplierFilter: (supplier: string) => void;
  clearCatalogFilters: () => void;
}) {
  return (
    <>
      <ModuleHeader
        eyebrow="Category module"
        title={`${props.activeCategory} browsing`}
        text="Dedicated category surface with filters, sorting, related categories, and quick add."
      />
      <CategoryRail
        activeCategory={props.activeCategory}
        setActiveCategory={props.setActiveCategory}
        storefrontCategories={props.storefrontCategories}
      />
      <FilterBar
        activeFilters={props.activeFilters}
        toggleFilter={props.toggleFilter}
        sortMode={props.sortMode}
        setSortMode={props.setSortMode}
        priceBand={props.priceBand}
        setPriceBand={props.setPriceBand}
        supplierOptions={props.supplierOptions}
        supplierFilter={props.supplierFilter}
        setSupplierFilter={props.setSupplierFilter}
        clearCatalogFilters={props.clearCatalogFilters}
      />
      <ProductGrid heading="Category products" productsToShow={props.filteredProducts} {...props} />
    </>
  );
}

function ListingModule({
  title,
  subtitle,
  productsToShow,
  cart,
  addToCart,
  buyNow,
  updateQuantity,
  wishlist,
  toggleWishlist,
  activeFilters,
  toggleFilter,
  sortMode,
  setSortMode,
  priceBand,
  setPriceBand,
  supplierOptions,
  supplierFilter,
  setSupplierFilter,
  clearCatalogFilters
}: {
  title: string;
  subtitle: string;
  productsToShow: Product[];
  cart: Cart;
  addToCart: (product: Product) => void;
  buyNow: (product: Product) => void;
  updateQuantity: (productId: ProductId, nextQuantity: number) => void;
  wishlist: ProductId[];
  toggleWishlist: (productId: ProductId) => void;
  activeFilters: string[];
  toggleFilter: (filter: string) => void;
  sortMode: string;
  setSortMode: (sort: string) => void;
  priceBand: string;
  setPriceBand: (priceBand: string) => void;
  supplierOptions: string[];
  supplierFilter: string;
  setSupplierFilter: (supplier: string) => void;
  clearCatalogFilters: () => void;
}) {
  return (
    <>
      <ModuleHeader eyebrow="Catalog module" title={title} text={subtitle} />
      <FilterBar
        activeFilters={activeFilters}
        toggleFilter={toggleFilter}
        sortMode={sortMode}
        setSortMode={setSortMode}
        priceBand={priceBand}
        setPriceBand={setPriceBand}
        supplierOptions={supplierOptions}
        supplierFilter={supplierFilter}
        setSupplierFilter={setSupplierFilter}
        clearCatalogFilters={clearCatalogFilters}
      />
      <ProductGrid
        heading={`${productsToShow.length} products`}
        productsToShow={productsToShow}
        cart={cart}
        addToCart={addToCart}
        buyNow={buyNow}
        updateQuantity={updateQuantity}
        wishlist={wishlist}
        toggleWishlist={toggleWishlist}
      />
    </>
  );
}

function WishlistModule({
  products,
  cart,
  addToCart,
  buyNow,
  updateQuantity,
  wishlist,
  toggleWishlist
}: {
  products: Product[];
  cart: Cart;
  addToCart: (product: Product) => void;
  buyNow: (product: Product) => void;
  updateQuantity: (productId: ProductId, nextQuantity: number) => void;
  wishlist: ProductId[];
  toggleWishlist: (productId: ProductId) => void;
}) {
  const [wishlistMode, setWishlistMode] = useState<"all" | "deals" | "available">("all");
  const savedIds = wishlist.map(productKey);
  const wishlistProducts = products.filter((product) => savedIds.includes(productKey(product.id)));
  const visibleWishlistProducts = wishlistProducts.filter((product) => {
    if (wishlistMode === "deals") return Boolean(product.oldPrice);
    if (wishlistMode === "available") return product.stock !== "Out of stock";
    return true;
  });
  const potentialSavings = wishlistProducts.reduce(
    (total, product) => total + ((product.oldPrice ?? product.price) - product.price),
    0
  );
  const quickAddCount = wishlistProducts.filter((product) => product.stock !== "Out of stock").length;
  const dealCount = wishlistProducts.filter((product) => product.oldPrice).length;
  const availableCount = wishlistProducts.filter((product) => product.stock !== "Out of stock").length;

  function quickAddWishlist() {
    wishlistProducts
      .filter((product) => product.stock !== "Out of stock")
      .forEach((product) => addToCart(product));
  }

  return (
    <>
      <section className="wishlist-hero">
        <div>
          <span className="eyebrow">Wishlist</span>
          <h1>Saved groceries for your next quick cart.</h1>
          <p>
            Keep favorite fruits, dairy, bakery, and frozen essentials ready for repeat ordering.
          </p>
        </div>
        <div className="wishlist-stats" aria-label="Wishlist summary">
          <div className="wishlist-stat-row">
            <span>
              <strong>{wishlistProducts.length}</strong>
              Items saved
            </span>
            <span>
              <strong>Rs. {potentialSavings}</strong>
              Savings ready
            </span>
          </div>
          <a className="wishlist-add-more" href="/products">
            Add more products
          </a>
        </div>
      </section>
      <section className="wishlist-panel">
        <div className="wishlist-panel-head">
          <div>
            <span>Saved shelf</span>
            <h2>Your saved products</h2>
          </div>
          <div className="wishlist-chips">
            <button className="quick-action" disabled={quickAddCount === 0} onClick={quickAddWishlist} type="button">
              <strong>Quick add</strong>
              <small>{quickAddCount} available</small>
            </button>
            <button
              className={wishlistMode === "deals" ? "active" : ""}
              onClick={() => setWishlistMode(wishlistMode === "deals" ? "all" : "deals")}
              type="button"
            >
              <strong>Price watch</strong>
              <small>{dealCount} deals</small>
            </button>
            <button
              className={wishlistMode === "available" ? "active" : ""}
              onClick={() => setWishlistMode(wishlistMode === "available" ? "all" : "available")}
              type="button"
            >
              <strong>Back-in-stock</strong>
              <small>{availableCount} ready</small>
            </button>
          </div>
        </div>
        {wishlistProducts.length > 0 && visibleWishlistProducts.length > 0 ? (
          <ProductGrid
            heading={`${visibleWishlistProducts.length} saved items`}
            productsToShow={visibleWishlistProducts}
            cart={cart}
            addToCart={addToCart}
            buyNow={buyNow}
            updateQuantity={updateQuantity}
            wishlist={wishlist}
            toggleWishlist={toggleWishlist}
          />
        ) : wishlistProducts.length > 0 ? (
          <section className="wishlist-empty">
            <HeartIcon />
            <h2>No items in this view</h2>
            <p>Switch the wishlist filter or add more saved products to see them here.</p>
            <button onClick={() => setWishlistMode("all")} type="button">
              Show all saved
            </button>
          </section>
        ) : (
          <section className="wishlist-empty">
            <HeartIcon />
            <h2>No saved products yet</h2>
            <p>Tap the heart on any product card to build your grocery wishlist.</p>
            <a href="/products">Browse products</a>
          </section>
        )}
      </section>
    </>
  );
}

function ProductDetailModule({
  product,
  products,
  cart,
  quantity,
  addToCart,
  buyNow,
  updateQuantity,
  wishlist,
  toggleWishlist
}: {
  product: Product;
  products: Product[];
  cart: Cart;
  quantity: number;
  addToCart: (product: Product) => void;
  buyNow: (product: Product) => void;
  updateQuantity: (productId: ProductId, nextQuantity: number) => void;
  wishlist: ProductId[];
  toggleWishlist: (productId: ProductId) => void;
}) {
  const ratingValue = Number(product.rating);
  const ratingPercent = Math.min((ratingValue / 5) * 100, 100);
  const [selectedAngle, setSelectedAngle] = useState(0);
  const [activeDetailTab, setActiveDetailTab] = useState("Nutrition");
  const [reviews, setReviews] = useState<
    Array<{ id: string; name: string; rating: string; text: string; helpful: number; image: string }>
  >([]);
  const [reviewFilter, setReviewFilter] = useState("All ratings");
  const [reviewName, setReviewName] = useState("Jerin N.");
  const [reviewRating, setReviewRating] = useState("5.0");
  const [reviewText, setReviewText] = useState("");
  const [reviewImage, setReviewImage] = useState("");
  const [reviewMessage, setReviewMessage] = useState("Share quality, freshness, packaging, or delivery feedback.");
  const sameCategoryProducts = products.filter(
    (similarProduct) => similarProduct.id !== product.id && similarProduct.category === product.category
  );
  const fallbackProducts = products.filter(
    (similarProduct) =>
      similarProduct.id !== product.id &&
      !sameCategoryProducts.some((categoryProduct) => categoryProduct.id === similarProduct.id)
  );
  const similarProducts = [...sameCategoryProducts, ...fallbackProducts].slice(0, 5);
  const bundleProducts = similarProducts.slice(0, 3);
  const bundleTotal = [product, ...bundleProducts].reduce((sum, item) => sum + item.price, 0);
  const categorySlug = slugifyClient(product.category);
  const detailTabs: Record<string, Array<[string, string]>> = {
    Nutrition: [
      ["Calories", product.category === "Household" ? "Not applicable" : "Per serving guidance"],
      ["Diet tags", product.tags.join(", ")],
      ["Unit size", product.unit]
    ],
    "Batch & expiry": [
      ["Batch", `B-${product.id}0926`],
      ["Packed", "Today at nearest branch"],
      ["Expiry", product.tags.includes("perishable") ? "Use within 3 days" : "Best before label checked"]
    ],
    Policy: [
      ["Replacement", "Eligible within 24 hours for quality issues"],
      ["Refund", "Wallet or original payment route after admin approval"],
      ["Support", "Photo proof can be attached during refund request"]
    ],
    Availability: [
      ["Supplier", product.supplier],
      ["Branch", "Bandra West branch has priority stock"],
      ["Stock", product.stock]
    ]
  };
  const detailTabSummary: Record<string, { label: string; title: string; text: string }> = {
    Nutrition: {
      label: "Product facts",
      title: "Clear nutrition and dietary guidance",
      text: "Key serving, tag, and unit details are grouped for quick customer comparison before checkout."
    },
    "Batch & expiry": {
      label: "Freshness control",
      title: "Batch-aware stock with expiry visibility",
      text: "Packed time, branch batch, and expiry guidance help customers trust the grocery quality."
    },
    Policy: {
      label: "Customer promise",
      title: "Replacement and refund rules are visible",
      text: "Quality issue, refund route, and proof requirements are shown before purchase."
    },
    Availability: {
      label: "Branch stock",
      title: "Live stock context by supplier and branch",
      text: "Supplier, branch, and stock signals prepare this page for backend inventory serviceability."
    }
  };
  const activeDetailSummary = detailTabSummary[activeDetailTab];
  const visibleReviews =
    reviewFilter === "All ratings"
      ? reviews
      : reviews.filter((review) => Math.floor(Number(review.rating)) === Number(reviewFilter[0]));

  useEffect(() => {
    let active = true;
    customerFetch("/api/customer/reviews", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { reviews: [] }))
      .then((data: { reviews?: Array<Record<string, unknown>> }) => {
        if (!active) return;
        const nextReviews = (Array.isArray(data.reviews) ? data.reviews : [])
          .filter((review) => review.productId === product.id || review.productSlug === product.slug)
          .map((review) => ({
            id: String(review.id ?? ""),
            name: "FreshCart customer",
            rating: String(review.rating ?? "5.0"),
            text: String(review.text ?? ""),
            helpful: Number(review.helpful ?? 0),
            image: String(review.imageNote ?? "")
          }));
        setReviews(nextReviews);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [product.id, product.slug]);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextText = reviewText.trim();
    if (!nextText) {
      setReviewMessage("Please write your review before submitting.");
      return;
    }
    try {
      const data = (await customerFetch("/api/customer/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          rating: reviewRating,
          text: nextText,
          imageNote: reviewImage.trim()
        })
      }).then((response) => response.json())) as { review?: Record<string, unknown> };
      setReviews((current) => [
        {
          id: String(data.review?.id ?? `customer-${Date.now()}`),
          name: reviewName.trim() || "FreshCart customer",
          rating: String(data.review?.rating ?? reviewRating),
          text: String(data.review?.text ?? nextText),
          helpful: Number(data.review?.helpful ?? 0),
          image: reviewImage.trim()
        },
        ...current.filter((review) => review.id !== data.review?.id)
      ]);
      setReviewFilter("All ratings");
      setReviewText("");
      setReviewImage("");
      setReviewMessage("Review saved to the database and sent for moderation.");
    } catch {
      setReviewMessage("Could not save review to the API.");
    }
  }

  async function markReviewHelpful(reviewId: string) {
    if (!reviewId) return;
    await customerFetch(`/api/customer/reviews/${reviewId}/helpful`, { method: "POST" }).catch(() => undefined);
    setReviews((current) =>
      current.map((review) =>
        review.id === reviewId ? { ...review, helpful: review.helpful + 1 } : review
      )
    );
  }

  return (
    <section className="product-detail-module">
      <div className="detail-gallery">
        <div className="detail-image-row">
          <div className="detail-art" style={{ background: product.color }}>
            <span>{product.badge}</span>
            {product.image ? (
              <>
                <img
                  alt={`${product.name} ${productAngles[selectedAngle]} product image`}
                  className="product-photo uploaded-product-photo"
                  onError={showImageFallback}
                  src={product.image}
                />
                <div
                  aria-label={`${product.name} ${productAngles[selectedAngle]} product image`}
                  className={`product-photo photo-${selectedAngle + 1}`}
                  hidden
                >
                  <i />
                  <b />
                  <em />
                </div>
              </>
            ) : (
              <div
                className={`product-photo photo-${selectedAngle + 1}`}
                aria-label={`${product.name} ${productAngles[selectedAngle]} product image`}
              >
                <i />
                <b />
                <em />
              </div>
            )}
          </div>
          <div className="detail-thumbnails" aria-label="Product image angles">
            {productAngles.map((angle, index) => (
              <button
                className={`detail-thumb thumb-${index + 1}${selectedAngle === index ? " active" : ""}`}
                key={angle}
                onClick={() => setSelectedAngle(index)}
                style={{ background: product.color }}
                type="button"
              >
                {product.image ? (
                  <>
                    <img alt={`${product.name} ${angle}`} onError={showImageFallback} src={product.image} />
                    <i hidden />
                  </>
                ) : (
                  <i />
                )}
                <span>{angle}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="detail-assurance">
          <span>Freshness checked</span>
          <span>Sealed packing</span>
          <span>Easy replacement</span>
        </div>
      </div>
      <div className="detail-copy">
        <div className="detail-title-bar">
          <span className="eyebrow">{product.category}</span>
          <strong>{product.rating} ★</strong>
        </div>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <div className="detail-tags">
          {product.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="detail-price-card">
          <span className="detail-price-label">Today&apos;s price</span>
          <div className="detail-price">
            <strong>Rs. {product.price}</strong>
            {product.oldPrice ? <span>Rs. {product.oldPrice}</span> : null}
          </div>
          <p>{product.unit} - {product.stock} - Delivered in 24-32 min</p>
          <div className="detail-actions">
            {quantity > 0 ? (
              <QuantityStepper
                quantity={quantity}
                onMinus={() => updateQuantity(product.id, quantity - 1)}
                onPlus={() => updateQuantity(product.id, quantity + 1)}
              />
            ) : (
              <button
                className="primary-action"
                disabled={product.stock === "Out of stock"}
                onClick={() => addToCart(product)}
                type="button"
              >
                Add to cart
              </button>
            )}
            <button
              className="buy-now-action"
              disabled={product.stock === "Out of stock"}
              onClick={() => buyNow(product)}
              type="button"
            >
              Buy now
            </button>
          </div>
        </div>
        <div className="detail-metrics">
          <Signal label="Unit" value={product.unit} />
          <Signal label="Rating" value={`${product.rating}/5`} />
          <Signal label="Delivery" value="24-32 min" />
        </div>
        <p className="freshness-note">
          Freshness checked from {product.supplier}. Refund or replacement support planned.
        </p>
        <section className="detail-tab-panel">
          <div className="detail-tab-list">
            {Object.keys(detailTabs).map((tab) => (
              <button
                className={activeDetailTab === tab ? "active" : ""}
                key={tab}
                onClick={() => setActiveDetailTab(tab)}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="detail-tab-content">
            <article className="detail-tab-summary-card">
              <span>{activeDetailSummary.label}</span>
              <strong>{activeDetailSummary.title}</strong>
              <p>{activeDetailSummary.text}</p>
            </article>
            <div className="detail-tab-facts">
              {detailTabs[activeDetailTab].map(([label, value], index) => (
                <span key={label}>
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  <small>{label}</small>
                  <strong>{value}</strong>
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>
      <section className="bundle-panel">
        <div className="similar-products-heading">
          <div>
            <span>Frequently bought together</span>
            <h2>Complete this basket</h2>
            <small>Customer-favorite add-ons for this item</small>
          </div>
          <strong>Save time</strong>
        </div>
        <div className="bundle-row">
          {[product, ...bundleProducts].map((bundleProduct, index) => (
            <article className="bundle-item-card" key={bundleProduct.id}>
              <b className="bundle-product-art" style={{ background: bundleProduct.color }} aria-hidden="true">
                <i />
              </b>
              <div>
                <span>{index === 0 ? "Current item" : bundleProduct.category}</span>
                <strong>{bundleProduct.name}</strong>
                <small>Rs. {bundleProduct.price}</small>
              </div>
            </article>
          ))}
        </div>
        <div className="bundle-footer">
          <div>
            <span>Bundle total</span>
            <strong>Rs. {bundleTotal}</strong>
            <small>{bundleProducts.length + 1} products selected</small>
          </div>
          <button
            className="primary-action"
            onClick={() => [product, ...bundleProducts].forEach((bundleProduct) => addToCart(bundleProduct))}
            type="button"
          >
            Add bundle to cart
          </button>
        </div>
      </section>
      <section className="review-panel">
        <div className="review-panel-head">
          <div>
            <span>Ratings and reviews</span>
            <h2>What customers say</h2>
          </div>
          <select value={reviewFilter} onChange={(event) => setReviewFilter(event.target.value)}>
            <option>All ratings</option>
            <option>5 star</option>
            <option>4 star</option>
            <option>3 star</option>
          </select>
        </div>
        <div className="review-summary">
          <div className="review-score-card">
            <div className="star-row" aria-label={`${product.rating} out of 5 stars`}>
              <span>★★★★★</span>
            </div>
            <strong>{product.rating}<small>/5</small></strong>
            <p>187 verified customer ratings</p>
          </div>
          <div className="rating-bars" aria-label="Rating breakdown">
            {[5, 4, 3].map((score, index) => (
              <span key={score}>
                <small>{score} star</small>
                <i>
                  <b style={{ width: `${Math.max(ratingPercent - index * 18, 34)}%` }} />
                </i>
              </span>
            ))}
          </div>
        </div>
        <div className="review-list" id="reviews">
          {visibleReviews.map((review) => (
            <article key={review.id}>
              <b aria-hidden="true">{review.name.slice(0, 1)}</b>
              <div>
                <div>
                  <strong>{review.name}</strong>
                  <span>{review.rating}/5</span>
                </div>
                <small>Verified purchase</small>
                <p>{review.text}</p>
                {review.image ? <em>{review.image}</em> : null}
                <button onClick={() => markReviewHelpful(review.id)} type="button">
                  Helpful ({review.helpful})
                </button>
              </div>
            </article>
          ))}
        </div>
        <form className="write-review-form" onSubmit={submitReview}>
          <div className="checkout-card-heading">
            <span>Write a review</span>
            <strong>Help other shoppers choose better</strong>
            <small>{reviewMessage}</small>
          </div>
          <div className="review-composer-main">
            <div className="review-composer-rating">
              <span>Your rating</span>
              <strong>{reviewRating}</strong>
              <div className="review-rating-buttons" aria-label="Choose rating">
                {["5.0", "4.5", "4.0", "3.5"].map((rating) => (
                  <button
                    className={reviewRating === rating ? "active" : ""}
                    key={rating}
                    onClick={() => setReviewRating(rating)}
                    type="button"
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>
            <label className="review-textarea">
              <span>Review</span>
              <textarea
                onChange={(event) => setReviewText(event.target.value)}
                placeholder="How was the freshness, packaging, delivery, or taste?"
                value={reviewText}
              />
            </label>
          </div>
          <div className="review-composer-meta">
            <label>
              <span>Name</span>
              <input value={reviewName} onChange={(event) => setReviewName(event.target.value)} />
            </label>
            <label>
              <span>Image note</span>
              <input
                onChange={(event) => setReviewImage(event.target.value)}
                placeholder="Example: Added pack photo"
                value={reviewImage}
              />
            </label>
            <div className="review-writing-tips" aria-label="Review writing tips">
              <span>Freshness</span>
              <span>Packaging</span>
              <span>Delivery</span>
              <span>Value</span>
            </div>
            <button type="submit">Submit review</button>
          </div>
        </form>
      </section>
      <section className="similar-products-panel">
        <div className="similar-products-heading">
          <div>
            <span>Similar products</span>
            <h2>More from {product.category}</h2>
          </div>
          <a href={`/categories/${categorySlug}`}>View all</a>
        </div>
        <div className="similar-products-row">
          {similarProducts.map((similarProduct) => {
            const similarQuantity = cart[productKey(similarProduct.id)] ?? 0;
            const isSaved = wishlist.map(productKey).includes(productKey(similarProduct.id));
            return (
              <article className="product-card" key={similarProduct.id}>
                <button
                  aria-label={`${isSaved ? "Remove" : "Save"} ${similarProduct.name} ${
                    isSaved ? "from" : "to"
                  } wishlist`}
                  aria-pressed={isSaved}
                  className={`product-wishlist${isSaved ? " active" : ""}`}
                  onClick={() => toggleWishlist(similarProduct.id)}
                  type="button"
                >
                  <HeartIcon />
                </button>
                <a className="product-art" href={`/products/${similarProduct.slug}`} style={{ background: similarProduct.color }}>
                  <span>{similarProduct.category}</span>
                </a>
                <div className="product-tags">
                  <span>{similarProduct.badge}</span>
                  <span className={similarProduct.stock === "Out of stock" ? "danger" : ""}>
                    {similarProduct.stock}
                  </span>
                </div>
                <h3>{similarProduct.name}</h3>
                <p>{similarProduct.unit} - {similarProduct.rating} rating - 24 min</p>
                <div className="price-row">
                  <strong>Rs. {similarProduct.price}</strong>
                  {similarProduct.oldPrice ? <span>Rs. {similarProduct.oldPrice}</span> : null}
                </div>
                {similarQuantity > 0 ? (
                  <QuantityStepper
                    quantity={similarQuantity}
                    onMinus={() => updateQuantity(similarProduct.id, similarQuantity - 1)}
                    onPlus={() => updateQuantity(similarProduct.id, similarQuantity + 1)}
                  />
                ) : (
                  <button
                    className="add-button"
                    disabled={similarProduct.stock === "Out of stock"}
                    onClick={() => addToCart(similarProduct)}
                    type="button"
                  >
                    {similarProduct.stock === "Out of stock" ? "Unavailable" : "Add"}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}

function parseStorefrontRupees(value: string) {
  const amount = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

function calculateCouponDiscount(
  coupon: StorefrontData["coupons"][number],
  subtotal: number,
  deliveryFee: number
) {
  if (coupon.type === "Free delivery") return deliveryFee;
  if (coupon.type === "Flat") return Math.min(parseStorefrontRupees(coupon.value), subtotal);
  const percentage = parseStorefrontRupees(coupon.value);
  const maxDiscount = parseStorefrontRupees(coupon.maxDiscount);
  const discount = Math.round((subtotal * percentage) / 100);
  return maxDiscount > 0 ? Math.min(maxDiscount, discount) : discount;
}

function CheckoutModule({
  view,
  cartItems,
  liveCoupons,
  subtotal,
  savings,
  deliveryFee,
  deliverySlots,
  total,
  slot,
  setSlot
}: {
  view: CustomerView;
  cartItems: Array<Product & { quantity: number }>;
  liveCoupons: StorefrontData["coupons"];
  subtotal: number;
  savings: number;
  deliveryFee: number;
  deliverySlots: DeliverySlot[];
  total: number;
  slot: string;
  setSlot: (slot: string) => void;
}) {
  const [paymentMethod, setPaymentMethod] = useState("Cash on delivery");
  const [paymentReady, setPaymentReady] = useState(false);
  const [address, setAddress] = useState(emptyCheckoutAddress);
  const [addressReady, setAddressReady] = useState(false);
  const [addressErrors, setAddressErrors] = useState<string[]>([]);
  const [deliveryInstructions, setDeliveryInstructions] = useState("Leave at security if unavailable");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<StorefrontData["coupons"][number] | null>(null);
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [serverQuote, setServerQuote] = useState<CheckoutQuote | null>(null);
  const [couponMessage, setCouponMessage] = useState(
    liveCoupons[0]?.code ? `Apply ${liveCoupons[0].code} to preview coupon discount.` : "No live coupons are published yet."
  );
  const [paymentStatus, setPaymentStatus] = useState("Ready");
  const [orderStatus, setOrderStatus] = useState("Review your cart and place the order.");
  const [placingOrder, setPlacingOrder] = useState(false);
  const steps = ["Address", "Delivery", "Payment", "Review"];
  const stepLinks = ["/checkout/address", "/checkout/delivery", "/checkout/payment", "/checkout/review"];
  const active =
    view === "checkout-address" ? 0 : view === "checkout-delivery" ? 1 : view === "checkout-payment" ? 2 : 3;

  useEffect(() => {
    const savedPaymentMethod = window.localStorage.getItem("freshcart-payment-method");
    if (savedPaymentMethod) setPaymentMethod(savedPaymentMethod);
    setPaymentReady(true);
  }, []);

  useEffect(() => {
    customerFetch("/api/customer/addresses", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { addresses: [] }))
      .then((data: { addresses?: Array<Record<string, unknown>> }) => {
        const savedAddress =
          data.addresses?.find((item) => item.isDefault || item.default) ??
          data.addresses?.[0];
        if (savedAddress) {
          setAddress({
            "Recipient name": String(savedAddress.recipientName ?? savedAddress.recipient ?? ""),
            "Phone number": String(savedAddress.phone ?? ""),
            "Address line 1": String(savedAddress.addressLine1 ?? savedAddress.line ?? ""),
            City: String(savedAddress.city ?? ""),
            "Postal code": String(savedAddress.postalCode ?? savedAddress.pincode ?? ""),
            Landmark: String(savedAddress.landmark ?? savedAddress.area ?? "")
          });
        }
      })
      .catch(() => undefined)
      .finally(() => setAddressReady(true));
  }, []);

  useEffect(() => {
    if (!paymentReady) return;
    window.localStorage.setItem("freshcart-payment-method", paymentMethod);
  }, [paymentMethod, paymentReady]);

  useEffect(() => {
    if (!couponCode && !appliedCoupon) {
      setCouponMessage(liveCoupons[0]?.code ? `Apply ${liveCoupons[0].code} to preview coupon discount.` : "No live coupons are published yet.");
    }
  }, [appliedCoupon, couponCode, liveCoupons]);

  function quotePayload(coupon = appliedCouponCode) {
    return {
      items: cartItems.map((item) => ({ productId: item.id, quantity: item.quantity })),
      address,
      slot,
      couponCode: coupon,
      walletAmount: 0
    };
  }

  useEffect(() => {
    if (cartItems.length === 0) {
      setServerQuote(null);
      return;
    }
    const timeout = window.setTimeout(() => {
      customerFetch("/api/customer/checkout/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quotePayload())
      })
        .then(async (response) => {
          const data = (await response.json()) as { quote?: CheckoutQuote; message?: string };
          if (!response.ok || !data.quote) throw new Error(data.message || "Quote failed");
          setServerQuote(data.quote);
          if (appliedCouponCode) setCouponMessage(`${data.quote.couponCode} applied with server-verified savings.`);
        })
        .catch((error) => {
          setServerQuote(null);
          if (appliedCouponCode) setCouponMessage(error instanceof Error ? error.message : "Coupon could not be applied.");
        });
    }, 220);
    return () => window.clearTimeout(timeout);
  }, [
    appliedCouponCode,
    address["Address line 1"],
    address["Phone number"],
    address["Postal code"],
    address.City,
    address.Landmark,
    address["Recipient name"],
    cartItems,
    slot
  ]);

  const couponApplied = Boolean(appliedCouponCode);
  const couponDiscount = serverQuote?.discountTotal ?? (appliedCoupon ? calculateCouponDiscount(appliedCoupon, subtotal, deliveryFee) : 0);
  const quotedSubtotal = serverQuote?.subtotal ?? subtotal;
  const quotedDeliveryFee = serverQuote?.deliveryFee ?? deliveryFee;
  const quotedTotal = serverQuote?.payableTotal ?? Math.max(total - couponDiscount, 0);

  function validateAddress() {
    const errors: string[] = [];
    if (!address["Recipient name"].trim()) errors.push("Recipient name is required.");
    if (!/^\+?\d[\d\s-]{8,}$/.test(address["Phone number"].trim())) errors.push("Valid phone number is required.");
    if (!address["Address line 1"].trim()) errors.push("Address line 1 is required.");
    if (!address.City.trim()) errors.push("City is required.");
    if (!/^\d{6}$/.test(address["Postal code"].trim())) errors.push("Postal code must be 6 digits.");
    setAddressErrors(errors);
    return errors.length === 0;
  }

  function continueFromAddress() {
    if (validateAddress()) window.location.href = "/checkout/delivery";
  }

  async function applyCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = couponCode.trim().toUpperCase();
    if (!normalized) {
      setAppliedCoupon(null);
      setAppliedCouponCode("");
      setCouponMessage(liveCoupons[0]?.code ? `Apply ${liveCoupons[0].code} to preview coupon discount.` : "Enter a coupon code.");
      return;
    }
    try {
      const response = await customerFetch("/api/customer/checkout/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quotePayload(normalized))
      });
      const data = (await response.json()) as { quote?: CheckoutQuote; message?: string };
      if (!response.ok || !data.quote) throw new Error(data.message || "Coupon could not be applied.");
      const coupon = liveCoupons.find((item) => item.code.toUpperCase() === normalized) ?? null;
      setAppliedCoupon(coupon);
      setAppliedCouponCode(data.quote.couponCode || normalized);
      setServerQuote(data.quote);
      setCouponMessage(`${data.quote.couponCode || normalized} applied. Server verified Rs. ${data.quote.discountTotal} savings.`);
    } catch (error) {
      setAppliedCoupon(null);
      setAppliedCouponCode("");
      setServerQuote(null);
      setCouponMessage(error instanceof Error ? error.message : "Invalid coupon.");
    }
  }

  async function placeOrder() {
    if (cartItems.length === 0) {
      setOrderStatus("Add products to cart before placing an order.");
      return;
    }
    if (!validateAddress()) {
      setOrderStatus("Fix address details before placing the order.");
      window.location.href = "/checkout/address";
      return;
    }
    setPlacingOrder(true);
    setOrderStatus("Creating order in the database...");
    try {
      const response = await customerFetch("/api/customer/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map((item) => ({ productId: item.id, quantity: item.quantity })),
          address,
          slot,
          paymentMethod,
          deliveryInstructions,
          couponCode: appliedCouponCode,
          discountTotal: serverQuote?.discountTotal ?? couponDiscount,
          deliveryFee: serverQuote?.deliveryFee ?? deliveryFee
        })
      });
      const data = (await response.json()) as { order?: { id?: string } };
      if (!response.ok || !data.order?.id) {
        throw new Error("Order creation failed.");
      }
      window.location.href = `/checkout/confirmation/${data.order.id}`;
    } catch {
      setOrderStatus("Could not place this order. Please try again or contact support.");
      setPlacingOrder(false);
    }
  }

  if (view === "confirmation") {
    return (
      <section className="checkout-module success">
        <span className="eyebrow">Order confirmed</span>
        <h1>Your order is scheduled.</h1>
        <p>Cash on delivery selected. Live tracking will activate when the order is out for delivery.</p>
        <a className="primary-link" href="/orders">Track order</a>
      </section>
    );
  }

  if (view === "checkout-failed") {
    return (
      <section className="checkout-module checkout-failed-module">
        <span className="eyebrow">Payment failed</span>
        <h1>We could not complete this payment.</h1>
        <p>
          Your cart is still saved. Choose another payment method, retry the same method, or contact support if money
          was deducted.
        </p>
        <div className="checkout-failed-grid">
          <article>
            <span>Reason</span>
            <strong>Mock gateway authorization failed</strong>
            <small>No order was placed and no inventory was reserved.</small>
          </article>
          <article>
            <span>Amount</span>
            <strong>Rs. {quotedTotal}</strong>
            <small>Cart total stays available for retry.</small>
          </article>
          <article>
            <span>Support SLA</span>
            <strong>Under 15 min</strong>
            <small>Use payment reference if money was deducted.</small>
          </article>
        </div>
        <div className="checkout-failed-actions">
          <a className="primary-link" href="/checkout/payment">Retry payment</a>
          <a href="/support">Contact support</a>
          <a href="/products">Continue shopping</a>
        </div>
      </section>
    );
  }

  return (
    <section className="checkout-module">
      <ModuleHeader
        eyebrow="Checkout module"
        title={steps[active]}
        text="Checkout uses saved addresses, live delivery slots, coupon validation, and database order creation."
      />
      <div className="checkout-steps">
        {steps.map((step, index) => (
          <a className={index <= active ? "active" : ""} href={stepLinks[index]} key={step}>
            <small>0{index + 1}</small>
            {step}
          </a>
        ))}
      </div>
      {view === "checkout-address" ? (
        <div className="checkout-address-layout">
          <section className="saved-address-card">
            <div className="checkout-card-heading">
              <span>Saved address</span>
              <strong>Selected</strong>
            </div>
            <div className="address-pin">Home</div>
            <h3>{address["Recipient name"]}</h3>
            <p>
              {address["Address line 1"]}, {address.Landmark}, {address.City} {address["Postal code"]}
            </p>
            <small>Phone: {address["Phone number"]} - Delivery note: {deliveryInstructions}</small>
            <button onClick={continueFromAddress} type="button">Use this address</button>
            {addressErrors.length > 0 ? (
              <div className="checkout-error-list">
                {addressErrors.map((error) => (
                  <span key={error}>{error}</span>
                ))}
              </div>
            ) : null}
          </section>
          <div className="form-grid">
            {(Object.keys(emptyCheckoutAddress) as Array<keyof typeof emptyCheckoutAddress>).map((field) => (
              <label key={field}>
                <span>{field}</span>
                <input
                  onChange={(event) =>
                    setAddress((current) => ({ ...current, [field]: event.target.value }))
                  }
                  placeholder={field}
                  value={address[field]}
                />
              </label>
            ))}
            <label className="delivery-instructions-field">
              <span>Delivery instructions</span>
              <input
                onChange={(event) => setDeliveryInstructions(event.target.value)}
                placeholder="Example: Call before arriving"
                value={deliveryInstructions}
              />
            </label>
          </div>
        </div>
      ) : null}
      {view === "checkout-delivery" ? (
        <>
          <div className="slot-grid">
            {deliverySlots.length > 0 ? deliverySlots.map((deliverySlot, index) => {
              const [day, time] = deliverySlot.label.split(", ");
              const selected = slot === deliverySlot.label;
              return (
                <button
                  aria-pressed={selected}
                  className={selected ? "slot-card selected" : "slot-card"}
                  key={deliverySlot.label}
                  onClick={() => setSlot(deliverySlot.label)}
                  type="button"
                >
                  <span className="slot-card-top">
                    <b>{index === 0 ? "Fast" : "Slot"}</b>
                    <i>{deliverySlot.capacity}</i>
                  </span>
                  <strong>{day}</strong>
                  <span className="slot-time">{time}</span>
                  <span className="slot-meta">
                    <em>Delivery fee</em>
                    <b>Rs. {deliverySlot.fee}</b>
                  </span>
                </button>
              );
            }) : (
              <section className="cart-empty-state">
                <strong>No delivery slots configured</strong>
                <span>Create active delivery slots from the admin delivery/branch setup before checkout.</span>
                <a href="/products">Continue shopping</a>
              </section>
            )}
          </div>
          <div className="checkout-action-bar">
            <span>
              Selected slot
              <strong>{slot || "No slot selected"}</strong>
            </span>
            {slot ? <a className="primary-link" href="/checkout/payment">Continue to payment</a> : <button type="button" disabled>Continue to payment</button>}
          </div>
        </>
      ) : null}
      {view === "checkout-payment" ? (
        <div className="payment-grid">
          <section className="payment-methods-panel">
            <div className="checkout-card-heading">
              <span>Payment method</span>
              <strong>{paymentMethod}</strong>
            </div>
            <div className="payment-method-list">
              {[
                {
                  name: "Cash on delivery",
                  tag: "COD",
                  detail: "Pay at your door after checking the grocery bags.",
                  action: "No extra fee",
                  disabled: false
                },
                {
                  name: "Mock online payment",
                  tag: "UPI",
                  detail: "Preview card, UPI, and wallet payment flow for demo.",
                  action: "Demo mode",
                  disabled: false
                },
                {
                  name: "Razorpay later",
                  tag: "Soon",
                  detail: "Production payment gateway can be connected later.",
                  action: "Unavailable",
                  disabled: true
                }
              ].map((method) => {
                const selected = paymentMethod === method.name;
                return (
                  <button
                    aria-pressed={selected}
                    className={selected ? "payment-row selected" : "payment-row"}
                    disabled={method.disabled}
                    key={method.name}
                    onClick={() => setPaymentMethod(method.name)}
                    type="button"
                  >
                    <span className="payment-radio" />
                    <span className="payment-copy">
                      <strong>{method.name}</strong>
                      <small>{method.detail}</small>
                    </span>
                    <b>{method.action}</b>
                  </button>
                );
              })}
            </div>
          </section>
          <aside className="payment-assurance-card">
            <span className="payment-badge">Secure checkout</span>
            <h3>Amount payable</h3>
            <strong>Rs. {quotedTotal}</strong>
            <div>
              <span>Selected method <b>{paymentMethod}</b></span>
              <span>Delivery fee <b>{quotedDeliveryFee === 0 ? "Free" : `Rs. ${quotedDeliveryFee}`}</b></span>
              <span>Coupon <b>{couponApplied ? `- Rs. ${couponDiscount}` : "Not applied"}</b></span>
              <span>Payment status <b>{paymentStatus}</b></span>
            </div>
            <button
              className="primary-link"
              onClick={() => {
                setPaymentStatus(paymentMethod === "Mock online payment" ? "Demo payment authorized" : "Ready");
                window.location.href = "/checkout/review";
              }}
              type="button"
            >
              Review order
            </button>
            <button
              className="payment-failed-link"
              onClick={() => {
                setPaymentStatus("Demo payment failed");
                window.location.href = "/checkout/failed";
              }}
              type="button"
            >
              Simulate failed payment
            </button>
          </aside>
        </div>
      ) : null}
      {view === "checkout-review" ? (
        <div className="checkout-review-panel">
          <section className="review-items-card">
            <div className="checkout-card-heading">
              <span>Order items</span>
              <strong>{cartItems.length} products</strong>
            </div>
            <div className="cart-page-list compact">
              {cartItems.map((item) => (
                <article className="review-item-row" key={item.id}>
                  <b className="review-product-image" style={{ background: item.color }} aria-hidden="true">
                    <i />
                  </b>
                  <div>
                    <strong>{item.name}</strong>
                    <span>
                      {item.unit} - Qty {item.quantity}
                    </span>
                  </div>
                  <em>Rs. {item.price * item.quantity}</em>
                </article>
              ))}
            </div>
          </section>
          <div className="checkout-review-summary">
            <div className="checkout-card-heading">
              <span>Payment summary</span>
              <strong>COD ready</strong>
            </div>
            <div className="checkout-info-stack">
              <span>
                <small>Delivering to</small>
                <strong>{address.Landmark}, {address.City}</strong>
              </span>
              <span>
                <small>Delivery slot</small>
                <strong>{slot}</strong>
              </span>
              <span>
                <small>Payment method</small>
                <strong>{paymentMethod}</strong>
              </span>
              <span>
                <small>Delivery instructions</small>
                <strong>{deliveryInstructions}</strong>
              </span>
            </div>
            <form className="coupon-form" onSubmit={applyCoupon}>
              <label>
                <span>Coupon code</span>
                <input
                  onChange={(event) => setCouponCode(event.target.value)}
                  placeholder="Enter coupon code"
                  value={couponCode}
                />
              </label>
              <button type="submit">{couponApplied ? "Applied" : "Apply"}</button>
              <small>{couponMessage}</small>
            </form>
            <SummaryPanel
              subtotal={quotedSubtotal}
              savings={savings + couponDiscount}
              deliveryFee={quotedDeliveryFee}
              total={quotedTotal}
            />
            <button className="primary-link" disabled={placingOrder} onClick={placeOrder} type="button">
              {placingOrder ? "Placing order..." : "Place order"}
            </button>
            <small>{orderStatus}</small>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function AccountModule() {
  const [profile, setProfile] = useState({
    name: "FreshCart customer",
    email: "",
    phone: "",
    birthday: "",
    memberType: "FreshCart household"
  });
  const [addresses, setAddresses] = useState<Array<{
    id: string;
    label: string;
    recipient: string;
    phone: string;
    line: string;
    city: string;
    pincode: string;
    landmark: string;
    instructions?: string;
    isDefault: boolean;
    serviceable: boolean;
  }>>([]);
  const [newAddress, setNewAddress] = useState({
    label: "",
    recipient: "",
    phone: "",
    line: "",
    city: "",
    pincode: "",
    landmark: "",
    instructions: ""
  });
  const [preferences, setPreferences] = useState({
    "Order updates": true,
    "WhatsApp alerts": true,
    "Email receipts": true,
    "Deal notifications": false,
    "Back in stock alerts": true,
    "Support follow-ups": true
  });
  const [security, setSecurity] = useState({
    "Two-step verification": true,
    "Login alerts": true,
    "Remember this device": false
  });
  const [privacy, setPrivacy] = useState({
    "Use purchase history for recommendations": true,
    "Personalized offers": true,
    "Share delivery contact with rider": true
  });
  const [paymentMethod, setPaymentMethod] = useState("UPI - jerin@okbank");
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [walletSummary, setWalletSummary] = useState({ balance: 0, points: 0, tier: "Member" });
  const [ticketDraft, setTicketDraft] = useState({
    topic: "",
    channel: "Chat",
    priority: "Normal"
  });
  const [saved, setSaved] = useState("Account center is ready. Edit any section and save changes.");

  const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0];
  const activeOrders = orders.filter((order) => order.status !== "Delivered").length;
  const accountHighlights = [
    { label: "Saved addresses", value: addresses.length, detail: defaultAddress?.label ?? "No default" },
    { label: "Wallet", value: `Rs. ${walletSummary.balance}`, detail: `${walletSummary.tier} tier` },
    { label: "Reviews", value: "Live", detail: "Synced with DB" },
    { label: "Support", value: supportTickets.length, detail: "Open history" }
  ];

  useEffect(() => {
    let active = true;
    customerFetch("/api/customer/account", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: {
        profile?: typeof profile;
        addresses?: typeof addresses;
        notifications?: Record<string, boolean>;
        wallet?: { balance?: number; points?: number; tier?: string };
        orders?: CustomerOrder[];
        supportTickets?: SupportTicket[];
      } | null) => {
        if (!active || !data) return;
        if (data.profile) setProfile((current) => ({ ...current, ...data.profile }));
        if (Array.isArray(data.addresses)) setAddresses(data.addresses);
        if (data.notifications) setPreferences((current) => ({ ...current, ...data.notifications }));
        if (data.wallet) {
          setWalletSummary({
            balance: Number(data.wallet.balance ?? 0),
            points: Number(data.wallet.points ?? 0),
            tier: String(data.wallet.tier ?? "Member")
          });
        }
        if (Array.isArray(data.orders)) setOrders(data.orders);
        if (Array.isArray(data.supportTickets)) setSupportTickets(data.supportTickets);
        setSaved("Account loaded from the database.");
      })
      .catch(() => setSaved("Could not load account data from the API."));
    return () => {
      active = false;
    };
  }, []);

  async function saveAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile.name.trim() || !profile.email.trim() || !profile.phone.trim()) {
      setSaved("Profile needs name, email, and phone before saving.");
      return;
    }
    try {
      const data = (await customerFetch("/api/customer/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      }).then((response) => response.json())) as { profile?: typeof profile };
      if (data.profile) setProfile((current) => ({ ...current, ...data.profile }));
      setSaved("Account profile saved to the database.");
    } catch {
      setSaved("Could not save account profile.");
    }
  }

  function updateAddress(id: string, field: keyof typeof newAddress, value: string) {
    setAddresses((current) =>
      current.map((address) => (address.id === id ? { ...address, [field]: value } : address))
    );
  }

  async function addAddress() {
    if (!newAddress.label.trim() || !newAddress.recipient.trim() || !newAddress.line.trim() || !newAddress.pincode.trim()) {
      setSaved("Add label, recipient, address line, and pincode before saving a new address.");
      return;
    }
    try {
      const data = (await customerFetch("/api/customer/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newAddress, isDefault: addresses.length === 0 })
      }).then((response) => response.json())) as { addresses?: typeof addresses; address?: (typeof addresses)[number] };
      if (Array.isArray(data.addresses)) setAddresses(data.addresses);
      setNewAddress({
        label: "",
        recipient: "",
        phone: "",
        line: "",
        city: "",
        pincode: "",
        landmark: "",
        instructions: ""
      });
      setSaved(`${data.address?.label ?? "Address"} saved to the database.`);
    } catch {
      setSaved("Could not save address.");
    }
  }

  async function setDefaultAddress(id: string) {
    setAddresses((current) =>
      current.map((address) => ({ ...address, isDefault: address.id === id }))
    );
    try {
      const data = (await customerFetch(`/api/customer/addresses/${id}/default`, { method: "PATCH" }).then((response) =>
        response.json()
      )) as { addresses?: typeof addresses };
      if (Array.isArray(data.addresses)) setAddresses(data.addresses);
      setSaved("Default delivery address updated in the database.");
    } catch {
      setSaved("Could not update default address.");
    }
  }

  async function removeAddress(id: string) {
    setAddresses((current) => {
      const next = current.filter((address) => address.id !== id);
      if (next.length && !next.some((address) => address.isDefault)) {
        return next.map((address, index) => ({ ...address, isDefault: index === 0 }));
      }
      return next;
    });
    try {
      const data = (await customerFetch(`/api/customer/addresses/${id}`, { method: "DELETE" }).then((response) =>
        response.json()
      )) as { addresses?: typeof addresses };
      if (Array.isArray(data.addresses)) setAddresses(data.addresses);
      setSaved("Address removed from the database.");
    } catch {
      setSaved("Could not remove address.");
    }
  }

  async function createSupportTicket() {
    const nextTopic = ticketDraft.topic.trim();
    if (!nextTopic) {
      setSaved("Add a ticket topic before creating a support ticket.");
      return;
    }
    try {
      const data = (await customerFetch("/api/customer/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `${ticketDraft.channel} / ${ticketDraft.priority}: ${nextTopic}` })
      }).then((response) => response.json())) as { conversation?: { id?: string; subject?: string; status?: string; channel?: string } };
      setSupportTickets((current) => [
        {
          id: String(data.conversation?.id ?? `TCK-${Date.now()}`),
          topic: nextTopic,
          status: String(data.conversation?.status ?? "Open"),
          channel: String(data.conversation?.channel ?? ticketDraft.channel),
          updated: "Just now"
        },
        ...current
      ]);
      setTicketDraft({ topic: "", channel: "Chat", priority: "Normal" });
      setSaved("Support ticket saved to the database.");
    } catch {
      setSaved("Could not create support ticket.");
    }
  }

  function resolveTicket(id: string) {
    setSupportTickets((current) =>
      current.map((ticket) => (ticket.id === id ? { ...ticket, status: "Resolved", updated: "Just now" } : ticket))
    );
    setSaved("Support ticket marked as resolved.");
  }

  return (
    <section className="account-module">
      <ModuleHeader
        eyebrow="Customer account"
        title="My Account"
        text="Manage profile details, saved addresses, loyalty, orders, support, notifications, security, privacy, and payment preferences from one customer-ready account center."
      />
      <form className="account-layout account-layout-wide" onSubmit={saveAccount}>
        <section className="account-hero-card">
          <div>
            <span className="account-avatar-large">{profile.name.charAt(0) || "J"}</span>
            <div>
              <span>Signed in customer</span>
              <strong>{profile.name}</strong>
              <small>
                {profile.email} - {profile.memberType}
              </small>
            </div>
          </div>
          <div className="account-hero-metrics">
            <span>
              <small>Wallet</small>
              <strong>Rs. {walletSummary.balance}</strong>
            </span>
            <span>
              <small>Points</small>
              <strong>{walletSummary.points}</strong>
            </span>
            <span>
              <small>Active orders</small>
              <strong>{activeOrders}</strong>
            </span>
          </div>
        </section>
        <nav className="account-quick-nav" aria-label="Account sections">
          <a href="/account/profile">Profile</a>
          <a href="/account/addresses">Addresses</a>
          <a href="/account/wallet">Wallet & loyalty</a>
          <a href="/account/notifications">Notifications</a>
          <a href="/reviews">Reviews</a>
          <a href="/serviceability">Serviceability</a>
        </nav>
        <section className="account-overview-strip">
          {accountHighlights.map((item) => (
            <article key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.detail}</small>
            </article>
          ))}
        </section>

        <section className="account-card">
          <div className="checkout-card-heading">
            <span>Profile overview</span>
            <strong>Editable customer identity</strong>
          </div>
          <div className="form-grid">
            <label>
              <span>Full name</span>
              <input value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <label>
              <span>Email</span>
              <input value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} type="email" />
            </label>
            <label>
              <span>Phone</span>
              <input value={profile.phone} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} />
            </label>
            <label>
              <span>Birthday</span>
              <input value={profile.birthday} onChange={(event) => setProfile((current) => ({ ...current, birthday: event.target.value }))} type="date" />
            </label>
            <label>
              <span>Member type</span>
              <select value={profile.memberType} onChange={(event) => setProfile((current) => ({ ...current, memberType: event.target.value }))}>
                <option>Gold household</option>
                <option>Silver household</option>
                <option>FreshCart Plus</option>
              </select>
            </label>
          </div>
        </section>

        <section className="account-card">
          <div className="checkout-card-heading">
            <span>Saved addresses</span>
            <strong>{addresses.length} delivery profiles</strong>
          </div>
          <div className="account-address-list">
            {addresses.map((address) => (
              <article className={address.isDefault ? "default" : ""} key={address.id}>
                <div className="account-address-top">
                  <span>{address.label}</span>
                  <small>{address.serviceable ? "Serviceable" : "Outside branch range"}</small>
                </div>
                <div className="form-grid compact-form-grid">
                  <label>
                    <span>Recipient</span>
                    <input value={address.recipient} onChange={(event) => updateAddress(address.id, "recipient", event.target.value)} />
                  </label>
                  <label>
                    <span>Phone</span>
                    <input value={address.phone} onChange={(event) => updateAddress(address.id, "phone", event.target.value)} />
                  </label>
                  <label>
                    <span>Address</span>
                    <input value={address.line} onChange={(event) => updateAddress(address.id, "line", event.target.value)} />
                  </label>
                  <label>
                    <span>Pincode</span>
                    <input value={address.pincode} onChange={(event) => updateAddress(address.id, "pincode", event.target.value)} />
                  </label>
                </div>
                <div className="account-card-actions">
                  <button onClick={() => setDefaultAddress(address.id)} type="button">
                    {address.isDefault ? "Default address" : "Make default"}
                  </button>
                  <button onClick={() => removeAddress(address.id)} type="button">Remove</button>
                </div>
              </article>
            ))}
          </div>
          <div className="account-add-address">
            <strong>Add new address</strong>
            <div className="form-grid compact-form-grid">
              <label>
                <span>Label</span>
                <input placeholder="Home, Work, Parents" value={newAddress.label} onChange={(event) => setNewAddress((current) => ({ ...current, label: event.target.value }))} />
              </label>
              <label>
                <span>Recipient</span>
                <input value={newAddress.recipient} onChange={(event) => setNewAddress((current) => ({ ...current, recipient: event.target.value }))} />
              </label>
              <label>
                <span>Phone</span>
                <input value={newAddress.phone} onChange={(event) => setNewAddress((current) => ({ ...current, phone: event.target.value }))} />
              </label>
              <label>
                <span>Pincode</span>
                <input value={newAddress.pincode} onChange={(event) => setNewAddress((current) => ({ ...current, pincode: event.target.value }))} />
              </label>
              <label>
                <span>Address line</span>
                <input value={newAddress.line} onChange={(event) => setNewAddress((current) => ({ ...current, line: event.target.value }))} />
              </label>
              <label>
                <span>Landmark</span>
                <input value={newAddress.landmark} onChange={(event) => setNewAddress((current) => ({ ...current, landmark: event.target.value }))} />
              </label>
            </div>
            <button onClick={addAddress} type="button">Add address</button>
          </div>
        </section>

        <section className="account-card compact">
          <div className="checkout-card-heading">
            <span>Wallet and loyalty</span>
            <strong>Customer value</strong>
          </div>
          <div className="account-wallet-grid">
            <span>
              <small>FreshCart Wallet</small>
              <strong>Rs. {walletSummary.balance}</strong>
            </span>
            <span>
              <small>Loyalty points</small>
              <strong>{walletSummary.points}</strong>
            </span>
            <span>
              <small>Next reward</small>
              <strong>220 pts</strong>
            </span>
          </div>
          <div className="account-card-actions">
            <button onClick={() => setSaved("Wallet top-up flow opened locally.")} type="button">Top up wallet</button>
            <button onClick={() => setSaved("Loyalty voucher prepared for checkout.")} type="button">Redeem points</button>
          </div>
        </section>

        <section className="account-card compact">
          <div className="checkout-card-heading">
            <span>Order shortcuts</span>
            <strong>Recent grocery orders</strong>
          </div>
          <div className="account-order-shortcuts">
            {orders.map((order) => (
              <article key={order.id}>
                <div>
                  <span>{order.id}</span>
                  <strong>{order.status}</strong>
                  <small>{order.items.slice(0, 2).join(", ")}</small>
                </div>
                <a href={`/orders/${order.id}`}>Track</a>
              </article>
            ))}
          </div>
        </section>

        <section className="account-card compact">
          <div className="checkout-card-heading">
            <span>Notification preferences</span>
            <strong>Channels</strong>
          </div>
          <div className="preference-list">
            {Object.entries(preferences).map(([preference, enabled]) => (
              <label key={preference}>
                <span>{preference}</span>
                <input
                  checked={enabled}
                  onChange={(event) =>
                    setPreferences((current) => ({ ...current, [preference]: event.target.checked }))
                  }
                  type="checkbox"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="account-card compact">
          <div className="checkout-card-heading">
            <span>Security settings</span>
            <strong>Login protection</strong>
          </div>
          <div className="preference-list">
            {Object.entries(security).map(([setting, enabled]) => (
              <label key={setting}>
                <span>{setting}</span>
                <input
                  checked={enabled}
                  onChange={(event) => setSecurity((current) => ({ ...current, [setting]: event.target.checked }))}
                  type="checkbox"
                />
              </label>
            ))}
          </div>
          <div className="account-card-actions">
            <button onClick={() => setSaved("Password reset link prepared for email verification.")} type="button">Reset password</button>
            <button onClick={() => setSaved("All other sessions signed out locally.")} type="button">Sign out devices</button>
          </div>
        </section>

        <section className="account-card compact">
          <div className="checkout-card-heading">
            <span>Privacy controls</span>
            <strong>Data choices</strong>
          </div>
          <div className="preference-list">
            {Object.entries(privacy).map(([setting, enabled]) => (
              <label key={setting}>
                <span>{setting}</span>
                <input
                  checked={enabled}
                  onChange={(event) => setPrivacy((current) => ({ ...current, [setting]: event.target.checked }))}
                  type="checkbox"
                />
              </label>
            ))}
          </div>
          <div className="account-card-actions">
            <a href="/privacy">View privacy policy</a>
            <button onClick={() => setSaved("Account data export request queued locally.")} type="button">Request data</button>
          </div>
        </section>

        <section className="account-card compact">
          <div className="checkout-card-heading">
            <span>Payment methods</span>
            <strong>Checkout default</strong>
          </div>
          <label className="account-select-field">
            <span>Preferred method</span>
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              <option>UPI - jerin@okbank</option>
              <option>Card ending 4242</option>
              <option>FreshCart Wallet</option>
              <option>Cash on delivery</option>
            </select>
          </label>
          <div className="account-card-actions">
            <button onClick={() => setSaved(`${paymentMethod} set as checkout default.`)} type="button">Save payment</button>
          </div>
        </section>

        <section className="account-card support-ticket-card">
          <div className="checkout-card-heading">
            <span>Support tickets</span>
            <strong>{supportTickets.length} requests</strong>
          </div>
          <div className="ticket-create-form account-ticket-create">
            <input
              onChange={(event) => setTicketDraft((current) => ({ ...current, topic: event.target.value }))}
              placeholder="Example: Need help with delivery"
              value={ticketDraft.topic}
            />
            <select value={ticketDraft.channel} onChange={(event) => setTicketDraft((current) => ({ ...current, channel: event.target.value }))}>
              <option>Chat</option>
              <option>WhatsApp</option>
              <option>Email</option>
              <option>Phone</option>
            </select>
            <select value={ticketDraft.priority} onChange={(event) => setTicketDraft((current) => ({ ...current, priority: event.target.value }))}>
              <option>Normal</option>
              <option>Urgent</option>
              <option>Fresh item issue</option>
            </select>
            <button onClick={createSupportTicket} type="button">Create ticket</button>
          </div>
          <div className="ticket-list">
            {supportTickets.map((ticket) => (
              <article key={ticket.id}>
                <span>{ticket.id}</span>
                <strong>{ticket.topic}</strong>
                <small>
                  {ticket.status} - {ticket.channel} - {ticket.updated}
                </small>
                <button onClick={() => resolveTicket(ticket.id)} type="button">Resolve</button>
              </article>
            ))}
          </div>
        </section>

        <section className="account-card compact">
          <div className="checkout-card-heading">
            <span>Account actions</span>
            <strong>Control center</strong>
          </div>
          <div className="account-action-list">
            <button onClick={() => setSaved(`FreshCart will deliver to ${defaultAddress?.label ?? "your default address"} by default.`)} type="button">
              Check default delivery
            </button>
            <button onClick={() => setSaved("Account pause request saved locally.")} type="button">Pause account</button>
            <button onClick={() => setSaved("Logout flow triggered locally.")} type="button">Logout</button>
          </div>
        </section>

        <div className="account-save-bar">
          <span>{saved}</span>
          <button type="submit">Save account</button>
        </div>
      </form>
    </section>
  );
}

function AccountProfileModule() {
  const [profile, setProfile] = useState({
    name: "FreshCart customer",
    email: "",
    phone: "",
    birthday: "",
    household: "Family grocery buyer"
  });
  const [security, setSecurity] = useState({
    "Two-step verification": true,
    "Login alerts": true,
    "Trusted device": false
  });
  const [status, setStatus] = useState("Profile is ready to edit.");

  useEffect(() => {
    let active = true;
    customerFetch("/api/customer/account", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { profile?: Partial<typeof profile> } | null) => {
        if (!active || !data?.profile) return;
        setProfile((current) => ({ ...current, ...data.profile }));
        setStatus("Profile loaded from the database.");
      })
      .catch(() => setStatus("Could not load profile from the API."));
    return () => {
      active = false;
    };
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile.name.trim() || !profile.email.trim() || !profile.phone.trim()) {
      setStatus("Name, email, and phone are required.");
      return;
    }
    try {
      const data = (await customerFetch("/api/customer/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      }).then((response) => response.json())) as { profile?: Partial<typeof profile> };
      if (data.profile) setProfile((current) => ({ ...current, ...data.profile }));
      setStatus("Profile saved to the database.");
    } catch {
      setStatus("Could not save profile to the API.");
    }
  }

  return (
    <section className="account-subpage-module">
      <ModuleHeader
        eyebrow="Account profile"
        title="Profile and security"
        text="Manage customer identity, contact details, and login protection before backend auth is connected."
      />
      <form className="account-subpage-grid" onSubmit={saveProfile}>
        <section className="account-card">
          <div className="checkout-card-heading">
            <span>Customer details</span>
            <strong>Editable profile</strong>
          </div>
          <div className="form-grid compact-form-grid">
            {Object.entries(profile).map(([field, value]) => (
              <label key={field}>
                <span>{field.replace(/^\w/, (letter) => letter.toUpperCase())}</span>
                <input
                  type={field === "email" ? "email" : field === "birthday" ? "date" : "text"}
                  value={value}
                  onChange={(event) => setProfile((current) => ({ ...current, [field]: event.target.value }))}
                />
              </label>
            ))}
          </div>
        </section>
        <section className="account-card compact">
          <div className="checkout-card-heading">
            <span>Security</span>
            <strong>Login protection</strong>
          </div>
          <div className="preference-list">
            {Object.entries(security).map(([setting, enabled]) => (
              <label key={setting}>
                <span>{setting}</span>
                <input
                  checked={enabled}
                  onChange={(event) => setSecurity((current) => ({ ...current, [setting]: event.target.checked }))}
                  type="checkbox"
                />
              </label>
            ))}
          </div>
          <div className="account-card-actions">
            <button onClick={() => setStatus("Password reset will be connected to the auth email provider before production.")} type="button">Reset password</button>
            <button onClick={() => setStatus("Session revocation will use customer auth sessions before production.")} type="button">Sign out devices</button>
          </div>
        </section>
        <div className="account-save-bar">
          <span>{status}</span>
          <button type="submit">Save profile</button>
        </div>
      </form>
    </section>
  );
}

function AccountAddressesModule() {
  type AddressBookItem = {
    id: string;
    label: string;
    recipient: string;
    phone: string;
    line: string;
    area: string;
    pincode: string;
    branch: string;
    note: string;
    recent: string;
    default: boolean;
    isDefault?: boolean;
  };
  const [addresses, setAddresses] = useState<AddressBookItem[]>([]);
  const [draft, setDraft] = useState({
    label: "",
    recipient: "",
    phone: "",
    line: "",
    area: "",
    pincode: "",
    branch: "Bandra West",
    note: ""
  });
  const [status, setStatus] = useState("Add, edit, remove, and set default delivery addresses.");
  useEffect(() => {
    let active = true;
    customerFetch("/api/customer/addresses", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { addresses: [] }))
      .then((data: { addresses?: AddressBookItem[] }) => {
        if (!active) return;
        setAddresses(
          (Array.isArray(data.addresses) ? data.addresses : []).map((address) => ({
            ...address,
            default: Boolean(address.default ?? address.isDefault),
            area: address.area || address.note || "",
            branch: address.branch || "Nearest available branch",
            note: address.note || "",
            recent: address.recent || "Saved in database"
          }))
        );
        setStatus("Address book loaded from the database.");
      })
      .catch(() => setStatus("Could not load addresses from the API."));
    return () => {
      active = false;
    };
  }, []);

  async function addAddress() {
    if (
      !draft.label.trim() ||
      !draft.recipient.trim() ||
      !/^\+?\d[\d\s-]{8,}$/.test(draft.phone.trim()) ||
      !draft.line.trim() ||
      !/^\d{6}$/.test(draft.pincode.trim())
    ) {
      setStatus("Label, recipient, valid phone, address line, and 6-digit pincode are required.");
      return;
    }
    try {
      const data = (await customerFetch("/api/customer/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, isDefault: addresses.length === 0 })
      }).then((response) => response.json())) as { addresses?: AddressBookItem[] };
      if (Array.isArray(data.addresses)) {
        setAddresses(data.addresses.map((address) => ({ ...address, default: Boolean(address.default ?? address.isDefault) })));
      }
      setDraft({
        label: "",
        recipient: "",
        phone: "",
        line: "",
        area: "",
        pincode: "",
        branch: "Bandra West",
        note: ""
      });
      setStatus("Address added to the database and ready for checkout.");
    } catch {
      setStatus("Could not save address.");
    }
  }

  function updateAddress(id: string, field: keyof (typeof addresses)[number], value: string) {
    setAddresses((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  async function useForCheckout(address: (typeof addresses)[number]) {
    window.localStorage.setItem(
      "freshcart-checkout-address",
      JSON.stringify({
        "Recipient name": address.recipient,
        "Phone number": address.phone,
        "Address line 1": address.line,
        City: "Mumbai",
        "Postal code": address.pincode,
        Landmark: address.area
      })
    );
    setAddresses((current) =>
      current.map((item) => ({
        ...item,
        default: item.id === address.id,
        recent: item.id === address.id ? "Used just now" : item.recent
      }))
    );
    await customerFetch(`/api/customer/addresses/${address.id}/default`, { method: "PATCH" }).catch(() => undefined);
    setStatus(`${address.label} is now selected for checkout and saved as default.`);
  }

  return (
    <section className="account-subpage-module">
      <ModuleHeader
        eyebrow="Saved addresses"
        title="Delivery address book"
        text="Customer-facing address management with default address, delivery note, and pincode validation."
      />
      <div className="account-address-book">
        {addresses.map((address) => (
          <article className={address.default ? "default" : ""} key={address.id}>
            <div className="checkout-card-heading">
              <span>{address.label}</span>
              <strong>{address.default ? "Default address" : "Saved address"}</strong>
            </div>
            <div className="address-service-row">
              <span>{address.pincode ? "Checkable" : "Pincode needed"}</span>
              <small>{address.branch} branch - {address.recent}</small>
            </div>
            <div className="form-grid compact-form-grid">
              <label>
                <span>Label</span>
                <input
                  value={address.label}
                  onChange={(event) => updateAddress(address.id, "label", event.target.value)}
                />
              </label>
              <label>
                <span>Receiver</span>
                <input
                  value={address.recipient}
                  onChange={(event) => updateAddress(address.id, "recipient", event.target.value)}
                />
              </label>
              <label>
                <span>Phone</span>
                <input
                  value={address.phone}
                  onChange={(event) => updateAddress(address.id, "phone", event.target.value)}
                />
              </label>
              <label>
                <span>Pincode</span>
                <input
                  value={address.pincode}
                  onChange={(event) => updateAddress(address.id, "pincode", event.target.value)}
                />
              </label>
              <label>
                <span>Address line</span>
                <input
                  value={address.line}
                  onChange={(event) => updateAddress(address.id, "line", event.target.value)}
                />
              </label>
              <label>
                <span>Area</span>
                <input
                  value={address.area}
                  onChange={(event) => updateAddress(address.id, "area", event.target.value)}
                />
              </label>
              <label>
                <span>Branch</span>
                <select value={address.branch} onChange={(event) => updateAddress(address.id, "branch", event.target.value)}>
                  <option>Bandra West</option>
                  <option>Andheri East</option>
                  <option>Powai</option>
                </select>
              </label>
              <label>
                <span>Delivery note</span>
                <input
                  value={address.note}
                  onChange={(event) => updateAddress(address.id, "note", event.target.value)}
                />
              </label>
            </div>
            <div className="account-card-actions">
              <button onClick={() => useForCheckout(address)} type="button">
                Use for checkout
              </button>
              <button
                onClick={() =>
                  void useForCheckout(address)
                }
                type="button"
              >
                Make default
              </button>
              <button
                onClick={() => {
                  setAddresses((current) => current.filter((item) => item.id !== address.id));
                  void customerFetch(`/api/customer/addresses/${address.id}`, { method: "DELETE" }).catch(() => undefined);
                }}
                type="button"
              >
                Remove
              </button>
            </div>
          </article>
        ))}
        <article>
          <div className="checkout-card-heading">
            <span>New address</span>
            <strong>Add delivery location</strong>
          </div>
          <div className="form-grid compact-form-grid">
            {Object.entries(draft).map(([field, value]) => (
              <label key={field}>
                <span>{field}</span>
                {field === "branch" ? (
                  <select value={value} onChange={(event) => setDraft((current) => ({ ...current, branch: event.target.value }))}>
                    <option>Bandra West</option>
                    <option>Andheri East</option>
                    <option>Powai</option>
                  </select>
                ) : (
                  <input
                    value={value}
                    onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))}
                  />
                )}
              </label>
            ))}
          </div>
          <button className="primary-action" onClick={addAddress} type="button">Add address</button>
        </article>
      </div>
      <p className="order-message">{status}</p>
    </section>
  );
}

function AccountWalletModule() {
  const [walletBalance, setWalletBalance] = useState(0);
  const [points, setPoints] = useState(0);
  const [tier, setTier] = useState("Member");
  const [amount, setAmount] = useState("250");
  const [refundPreference, setRefundPreference] = useState("Wallet credit");
  const [walletPin, setWalletPin] = useState("");
  const [referralCode, setReferralCode] = useState("JERIN20");
  const [status, setStatus] = useState("Wallet and loyalty activity is loading from the database.");
  const [transactions, setTransactions] = useState<Array<{ id: string; type: string; amount: number; date: string }>>([]);
  const [vouchers, setVouchers] = useState([
    { code: "GOLD50", value: "Rs. 50 off", status: "Ready" },
    { code: "DAIRY10", value: "10% dairy cashback", status: "Saved" }
  ]);

  function applyWalletData(wallet?: { balance?: number; points?: number; tier?: string; transactions?: Array<{ id: string; type: string; amount: number; date: string }> }) {
    if (!wallet) return;
    setWalletBalance(Number(wallet.balance ?? 0));
    setPoints(Number(wallet.points ?? 0));
    setTier(String(wallet.tier ?? "Member"));
    setTransactions(Array.isArray(wallet.transactions) ? wallet.transactions : []);
  }

  useEffect(() => {
    let active = true;
    customerFetch("/api/customer/wallet", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { wallet?: Parameters<typeof applyWalletData>[0] } | null) => {
        if (!active) return;
        applyWalletData(data?.wallet);
        setStatus("Wallet and loyalty loaded from the database.");
      })
      .catch(() => setStatus("Could not load wallet from the API."));
    return () => {
      active = false;
    };
  }, []);

  async function topUp() {
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setStatus("Enter a valid top-up amount.");
      return;
    }
    try {
      const data = (await customerFetch("/api/customer/wallet/top-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numericAmount, note: "Customer wallet top-up" })
      }).then((response) => response.json())) as { wallet?: Parameters<typeof applyWalletData>[0] };
      applyWalletData(data.wallet);
      setStatus(`Rs. ${numericAmount} added to wallet in the database.`);
    } catch {
      setStatus("Could not top up wallet.");
    }
  }

  async function redeemPoints() {
    if (points < 200) {
      setStatus("At least 200 points are required for redemption.");
      return;
    }
    try {
      const data = (await customerFetch("/api/customer/wallet/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: 200, walletCredit: 20 })
      }).then((response) => response.json())) as { wallet?: Parameters<typeof applyWalletData>[0] };
      applyWalletData(data.wallet);
      setStatus("200 points redeemed into Rs. 20 wallet credit in the database.");
    } catch {
      setStatus("Could not redeem points.");
    }
  }

  function saveWalletSecurity() {
    if (!/^\d{4}$/.test(walletPin)) {
      setStatus("Wallet PIN must be 4 digits.");
      return;
    }
    setStatus(`Wallet PIN validation passed. Refund preference selected: ${refundPreference}.`);
  }

  function claimReferralReward() {
    setStatus(`Referral ${referralCode} will be connected to referral campaign rules before production.`);
  }

  function saveVoucher(code: string) {
    setVouchers((current) =>
      current.map((voucher) => (voucher.code === code ? { ...voucher, status: "Applied to next checkout" } : voucher))
    );
    setStatus(`${code} saved for next checkout.`);
  }

  return (
    <section className="account-subpage-module">
      <ModuleHeader
        eyebrow="Wallet and loyalty"
        title="Customer value center"
        text="Track wallet balance, loyalty points, refund credits, top-ups, and reward redemption."
      />
      <div className="wallet-dashboard-grid">
        <article>
          <span>FreshCart Wallet</span>
          <strong>Rs. {walletBalance}</strong>
          <small>Available for checkout and refund credits</small>
        </article>
        <article>
          <span>Loyalty points</span>
          <strong>{points}</strong>
          <small>200 points = Rs. 20 wallet credit</small>
        </article>
        <article>
          <span>Tier</span>
          <strong>{tier}</strong>
          <small>Free delivery unlock at Rs. 499</small>
        </article>
        <article>
          <span>Points expiry</span>
          <strong>31 Dec</strong>
          <small>480 points expiring first</small>
        </article>
        <article>
          <span>Cashback</span>
          <strong>Rs. 86</strong>
          <small>Pending from grocery offers</small>
        </article>
        <article>
          <span>Refund mode</span>
          <strong>{refundPreference}</strong>
          <small>Used when support approves refunds</small>
        </article>
      </div>
      <section className="account-card">
        <div className="checkout-card-heading">
          <span>Actions</span>
          <strong>Wallet controls</strong>
        </div>
        <div className="wallet-action-row">
          <label>
            <span>Top-up amount</span>
            <input value={amount} onChange={(event) => setAmount(event.target.value)} />
          </label>
          <button onClick={topUp} type="button">Top up</button>
          <button onClick={redeemPoints} type="button">Redeem points</button>
        </div>
      </section>
      <section className="account-card">
        <div className="checkout-card-heading">
          <span>Refund and security</span>
          <strong>Wallet protection</strong>
        </div>
        <div className="wallet-action-row wallet-settings-row">
          <label>
            <span>Refund destination</span>
            <select value={refundPreference} onChange={(event) => setRefundPreference(event.target.value)}>
              <option>Wallet credit</option>
              <option>Original payment</option>
              <option>Ask every time</option>
            </select>
          </label>
          <label>
            <span>Wallet PIN</span>
            <input
              inputMode="numeric"
              maxLength={4}
              placeholder="4 digits"
              value={walletPin}
              onChange={(event) => setWalletPin(event.target.value)}
            />
          </label>
          <button onClick={saveWalletSecurity} type="button">Save security</button>
        </div>
      </section>
      <section className="account-card">
        <div className="checkout-card-heading">
          <span>Rewards</span>
          <strong>Referral and vouchers</strong>
        </div>
        <div className="wallet-action-row wallet-settings-row">
          <label>
            <span>Referral code</span>
            <input value={referralCode} onChange={(event) => setReferralCode(event.target.value)} />
          </label>
          <button onClick={claimReferralReward} type="button">Claim referral reward</button>
        </div>
        <div className="wallet-voucher-list">
          {vouchers.map((voucher) => (
            <article key={voucher.code}>
              <span>{voucher.code}</span>
              <strong>{voucher.value}</strong>
              <small>{voucher.status}</small>
              <button onClick={() => saveVoucher(voucher.code)} type="button">Use next</button>
            </article>
          ))}
        </div>
      </section>
      <section className="account-card">
        <div className="checkout-card-heading">
          <span>Activity</span>
          <strong>{transactions.length} records</strong>
        </div>
        <div className="wallet-transaction-list">
          {transactions.map((transaction) => (
            <article key={transaction.id}>
              <span>{transaction.id}</span>
              <strong>{transaction.type}</strong>
              <small>{transaction.date}</small>
              <b>{transaction.amount > 0 ? "+" : ""}Rs. {Math.abs(transaction.amount)}</b>
            </article>
          ))}
        </div>
      </section>
      <p className="order-message">{status}</p>
    </section>
  );
}

function AccountNotificationsModule() {
  const [preferences, setPreferences] = useState({
    "Order status": true,
    "Delivery rider calls": true,
    "WhatsApp updates": true,
    "SMS alerts": true,
    "Email invoices": true,
    "Marketing offers": false,
    "Back in stock": true,
    "Price drops": false
  });
  const [quietHours, setQuietHours] = useState("10 PM - 8 AM");
  const [language, setLanguage] = useState("English");
  const [history, setHistory] = useState<Array<{ id: string; title?: string; channel: string; message: string; status: string; createdAt?: string }>>([]);
  const [status, setStatus] = useState("Notification preferences are ready.");
  const consentSummary = [
    { label: "WhatsApp", value: preferences["WhatsApp updates"] ? "Allowed" : "Off" },
    { label: "SMS", value: preferences["SMS alerts"] ? "Allowed" : "Off" },
    { label: "Email", value: preferences["Email invoices"] ? "Allowed" : "Off" },
    { label: "Marketing", value: preferences["Marketing offers"] ? "Allowed" : "Off" }
  ];

  useEffect(() => {
    let active = true;
    Promise.all([
      customerFetch("/api/customer/account", { cache: "no-store" }).then((response) => (response.ok ? response.json() : null)),
      customerFetch("/api/customer/notifications/history", { cache: "no-store" }).then((response) => (response.ok ? response.json() : null))
    ])
      .then(([accountData, historyData]: [{ notifications?: Record<string, boolean> } | null, { notifications?: typeof history } | null]) => {
        if (!active) return;
        if (accountData?.notifications) setPreferences((current) => ({ ...current, ...accountData.notifications }));
        setHistory(historyData?.notifications ?? []);
        setStatus("Notification preferences and history loaded from the database.");
      })
      .catch(() => setStatus("Could not load notification preferences."));
    return () => {
      active = false;
    };
  }, []);

  async function loadNotificationHistory() {
    const historyData = (await customerFetch("/api/customer/notifications/history", { cache: "no-store" }).then((response) =>
      response.ok ? response.json() : null
    )) as { notifications?: typeof history } | null;
    setHistory(historyData?.notifications ?? []);
  }

  async function saveNotificationPreferences() {
    try {
      const data = (await customerFetch("/api/customer/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences)
      }).then((response) => response.json())) as { notifications?: Record<string, boolean> };
      if (data.notifications) setPreferences((current) => ({ ...current, ...data.notifications }));
    } catch {
      setStatus("Could not save notification preferences.");
      return;
    }
    await loadNotificationHistory().catch(() => undefined);
    setStatus(`Preferences saved to the database. Quiet hours UI value: ${quietHours}. Language: ${language}.`);
  }

  return (
    <section className="account-subpage-module">
      <ModuleHeader
        eyebrow="Notifications"
        title="Communication preferences"
        text="Control order updates, marketing consent, WhatsApp/SMS alerts, and quiet hours."
      />
      <section className="account-card">
        <div className="checkout-card-heading">
          <span>Channels</span>
          <strong>Consent controls</strong>
        </div>
        <div className="preference-list">
          {Object.entries(preferences).map(([preference, enabled]) => (
            <label key={preference}>
              <span>{preference}</span>
              <input
                checked={enabled}
                onChange={(event) => setPreferences((current) => ({ ...current, [preference]: event.target.checked }))}
                type="checkbox"
              />
            </label>
          ))}
        </div>
      </section>
      <section className="account-card compact">
        <div className="checkout-card-heading">
          <span>Quiet hours and language</span>
          <strong>Do not disturb</strong>
        </div>
        <label className="account-select-field">
          <span>Preference</span>
          <select value={quietHours} onChange={(event) => setQuietHours(event.target.value)}>
            <option>10 PM - 8 AM</option>
            <option>11 PM - 7 AM</option>
            <option>Off</option>
          </select>
        </label>
        <label className="account-select-field">
          <span>Language</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option>English</option>
            <option>Hindi</option>
            <option>Marathi</option>
          </select>
        </label>
        <div className="account-card-actions">
          <button onClick={saveNotificationPreferences} type="button">
            Save notifications
          </button>
        </div>
      </section>
      <section className="account-card">
        <div className="checkout-card-heading">
          <span>Consent status</span>
          <strong>Channel permissions</strong>
        </div>
        <div className="notification-consent-grid">
          {consentSummary.map((item) => (
            <article key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </section>
      <section className="account-card">
        <div className="checkout-card-heading">
          <span>Notification history</span>
          <strong>{history.length} events</strong>
        </div>
        <div className="notification-history-list">
          {history.length ? history.map((event) => (
            <article key={event.id}>
              <span>{event.title || event.id}</span>
              <strong>{event.message}</strong>
              <small>{event.channel} - {event.status}{event.createdAt ? ` - ${new Date(event.createdAt).toLocaleString()}` : ""}</small>
            </article>
          )) : <p className="empty-helper">No notification jobs yet. Order, wallet, refund, and support updates will appear here from the database.</p>}
        </div>
      </section>
      <p className="order-message">{status}</p>
    </section>
  );
}

function ReviewCenterModule({ products }: { products: Product[] }) {
  type ReviewQueueItem = {
    id?: string;
    product: Product;
    rating: string;
    text: string;
    imageNote: string;
    submitted: boolean;
    moderation: string;
    helpful: number;
    reward: number;
  };
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);
  const [filter, setFilter] = useState("All");
  const [status, setStatus] = useState("Review products from recent orders and edit feedback.");
  const reviewStats = [
    { label: "Waiting", value: reviewQueue.filter((item) => !item.submitted).length, detail: "Need your rating" },
    { label: "Submitted", value: reviewQueue.filter((item) => item.submitted).length, detail: "Already reviewed" },
    { label: "Rewards", value: `${reviewQueue.reduce((sum, item) => sum + item.reward, 0)} pts`, detail: "Earned from reviews" }
  ];
  const visibleReviews = reviewQueue.filter((item) => {
    if (filter === "All") return true;
    if (filter === "Submitted") return item.submitted;
    if (filter === "Pending") return !item.submitted;
    return item.moderation === filter;
  });

  useEffect(() => {
    let active = true;
    customerFetch("/api/customer/reviews", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { reviews: [] }))
      .then((data: { reviews?: Array<Record<string, unknown>> }) => {
        if (!active) return;
        const reviews = Array.isArray(data.reviews) ? data.reviews : [];
        setReviewQueue(
          reviews.map((review, index) => {
            const product =
              products.find((item) => item.id === review.productId || item.slug === review.productSlug) ??
              ({
                id: String(review.productId ?? review.id ?? index),
                slug: String(review.productSlug ?? `review-product-${index + 1}`),
                name: String(review.productName ?? "Reviewed product"),
                category: String(review.category ?? "Grocery"),
                unit: String(review.unit ?? "1 unit"),
                price: 0,
                badge: "Reviewed",
                stock: "In stock",
                rating: String(review.rating ?? "5.0"),
                color: productColors[index % productColors.length],
                description: "",
                supplier: "FreshCart",
                tags: []
              } satisfies Product);
            return {
              id: String(review.id ?? ""),
              product,
              rating: String(review.rating ?? "5.0"),
              text: String(review.text ?? ""),
              imageNote: String(review.imageNote ?? ""),
              submitted: Boolean(review.submitted),
              moderation: String(review.moderation ?? "Pending"),
              helpful: Number(review.helpful ?? 0),
              reward: Number(review.reward ?? 0)
            };
          })
        );
        setStatus(reviews.length ? "Reviews loaded from the database." : "No review records in the database yet.");
      })
      .catch(() => setStatus("Could not load reviews from the API."));
    return () => {
      active = false;
    };
  }, [products]);

  async function submitReview(productId: ProductId) {
    const targetReview = reviewQueue.find((item) => item.product.id === productId);
    if (!targetReview?.text.trim()) {
      setStatus("Add review feedback before submitting.");
      return;
    }
    try {
      const data = (await customerFetch("/api/customer/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: targetReview.id,
          productId: targetReview.product.id,
          rating: targetReview.rating,
          text: targetReview.text
        })
      }).then((response) => response.json())) as { review?: Record<string, unknown> };
      setReviewQueue((current) =>
        current.map((item) =>
          item.product.id === productId
            ? { ...item, id: String(data.review?.id ?? item.id ?? ""), submitted: true, moderation: "Pending", reward: item.reward || 20 }
            : item
        )
      );
      setStatus("Review saved to the database and marked pending moderation.");
    } catch {
      setStatus("Could not save review to the API.");
    }
  }

  async function deleteReview(productId: ProductId) {
    const targetReview = reviewQueue.find((item) => item.product.id === productId);
    if (!targetReview?.submitted && !targetReview?.text.trim() && !targetReview?.imageNote.trim()) {
      setStatus("Nothing to delete for this product yet.");
      return;
    }
    try {
      if (targetReview?.id) {
        await customerFetch(`/api/customer/reviews/${targetReview.id}`, { method: "DELETE" });
      }
      setReviewQueue((current) => current.filter((item) => item.product.id !== productId));
      setStatus("Review deleted from the database.");
    } catch {
      setStatus("Could not delete review from the API.");
    }
  }

  async function markHelpful(productId: ProductId) {
    const targetReview = reviewQueue.find((item) => item.product.id === productId);
    if (!targetReview?.id) {
      setStatus("Save this review before marking helpful.");
      return;
    }
    try {
      await customerFetch(`/api/customer/reviews/${targetReview.id}/helpful`, { method: "POST" });
      setReviewQueue((current) =>
        current.map((item) => (item.product.id === productId ? { ...item, helpful: item.helpful + 1 } : item))
      );
      setStatus("Helpful vote saved.");
    } catch {
      setStatus("Could not save helpful vote.");
    }
  }

  return (
    <section className="review-center-module">
      <ModuleHeader
        eyebrow="Review center"
        title="Ratings waiting for you"
        text="Write, edit, and track reviews for products from previous grocery orders."
      />
      <section className="review-center-hero">
        <div>
          <span>Verified grocery feedback</span>
          <strong>Help other shoppers choose fresher baskets.</strong>
          <small>Rate delivered products, add a photo note, and earn loyalty rewards after moderation.</small>
        </div>
        <div>
          {reviewStats.map((stat) => (
            <article key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.detail}</small>
            </article>
          ))}
        </div>
      </section>
      <div className="review-center-toolbar">
        {["All", "Pending", "Submitted", "Approved", "Rejected"].map((option) => (
          <button className={filter === option ? "active" : ""} key={option} onClick={() => setFilter(option)} type="button">
            {option}
          </button>
        ))}
      </div>
      <div className="review-center-grid">
        {visibleReviews.map((item) => (
          <article className={item.submitted ? "submitted" : ""} key={item.product.id}>
            <div className="review-card-head">
              <b className="review-product-swatch" style={{ background: item.product.color }} aria-hidden="true">
                <i />
              </b>
              <div>
                <span>{item.product.category}</span>
                <strong>{item.product.name}</strong>
                <small>{item.product.unit} - Helpful {item.helpful} - Reward {item.reward} pts</small>
              </div>
              <em className={`review-status-pill ${item.submitted ? item.moderation.toLowerCase() : "waiting"}`}>
                {item.submitted ? item.moderation : "Waiting"}
              </em>
            </div>
            <div className="review-rating-chip">
              <span>★★★★★</span>
              <strong>{item.rating}</strong>
            </div>
            <div className="review-card-fields">
              <label>
                <span>Rating</span>
                <select
                  value={item.rating}
                  onChange={(event) =>
                    setReviewQueue((current) =>
                      current.map((review) =>
                        review.product.id === item.product.id ? { ...review, rating: event.target.value } : review
                      )
                    )
                  }
                >
                  <option>5.0</option>
                  <option>4.5</option>
                  <option>4.0</option>
                  <option>3.5</option>
                </select>
              </label>
              <label>
                <span>Image note</span>
                <input
                  value={item.imageNote}
                  onChange={(event) =>
                    setReviewQueue((current) =>
                      current.map((review) =>
                        review.product.id === item.product.id ? { ...review, imageNote: event.target.value } : review
                      )
                    )
                  }
                  placeholder="Pack photo added"
                />
              </label>
            </div>
            <label className="review-feedback-field">
              <span>Feedback</span>
              <textarea
                placeholder="Freshness, packing, delivery..."
                value={item.text}
                onChange={(event) =>
                  setReviewQueue((current) =>
                    current.map((review) =>
                      review.product.id === item.product.id ? { ...review, text: event.target.value } : review
                    )
                  )
                }
              />
            </label>
            <div className="review-status-row">
              <span>{item.submitted ? "Submitted review" : "Review to earn points"}</span>
              <a href={`/products/${item.product.slug}`}>Open product</a>
            </div>
            <div className="review-card-actions">
              <button onClick={() => submitReview(item.product.id)} type="button">
                {item.submitted ? "Update review" : "Submit review"}
              </button>
              <button onClick={() => markHelpful(item.product.id)} type="button">Helpful</button>
              <button onClick={() => deleteReview(item.product.id)} type="button">Delete</button>
            </div>
          </article>
        ))}
        {visibleReviews.length === 0 ? (
          <section className="review-empty-state">
            <strong>No reviews in this filter</strong>
            <p>Switch to another status or submit a product review first.</p>
            <button onClick={() => setFilter("All")} type="button">Show all reviews</button>
          </section>
        ) : null}
      </div>
      <p className="order-message">{status}</p>
    </section>
  );
}

function ServiceabilityModule({ products }: { products: Product[] }) {
  const [pincode, setPincode] = useState("400050");
  const [area, setArea] = useState("Bandra West");
  const [branch, setBranch] = useState("Bandra West");
  const [notifyContact, setNotifyContact] = useState("");
  const [serviceResult, setServiceResult] = useState<{
    serviceable: boolean;
    branches: Array<{ name: string; area: string; pincode: string; city: string }>;
    zones: Array<{ name: string }>;
  } | null>(null);
  const [savedAreas, setSavedAreas] = useState([
    { area: "Bandra West", pincode: "400050", branch: "Bandra West", eta: "24 min" },
    { area: "Powai", pincode: "400076", branch: "Powai", eta: "31 min" }
  ]);
  const [status, setStatus] = useState("Check delivery coverage and branch availability.");
  const unavailableProducts = products.filter((product) => product.stock === "Out of stock");
  const isServiceable = serviceResult?.serviceable ?? false;
  const activeBranchName = serviceResult?.branches[0]?.name ?? branch;
  const deliveryFee = branch === "Powai" ? 49 : pincode === "400050" ? 29 : 39;
  const minimumOrder = branch === "Powai" ? 399 : 299;
  const slotAvailability = branch === "Bandra West" ? "4 slots open today" : "2 slots open today";
  const coldChain = branch === "Powai" ? "Dairy only" : "Dairy and frozen";
  const branchSignals = [
    { label: "Branch", value: activeBranchName, detail: serviceResult?.branches[0]?.area ?? "Nearest stock source" },
    { label: "Delivery fee", value: `Rs. ${deliveryFee}`, detail: `Minimum Rs. ${minimumOrder}` },
    { label: "Slots", value: slotAvailability, detail: "Today" },
    { label: "Cold-chain", value: coldChain, detail: "Dairy/frozen handling" }
  ];

  async function checkCoverage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(pincode.trim())) {
      setStatus("Enter a valid 6-digit pincode.");
      return;
    }
    try {
      const data = (await customerFetch("/api/customer/serviceability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode, area })
      }).then((response) => response.json())) as typeof serviceResult;
      setServiceResult(data);
      const nextBranch = data?.branches[0]?.name;
      if (nextBranch) setBranch(nextBranch);
      setStatus(
        data?.serviceable
          ? `${area || "This area"} ${pincode} is serviceable from ${nextBranch ?? "an active branch"}.`
          : `${area || "This area"} ${pincode} is outside current delivery coverage.`
      );
    } catch {
      setStatus("Could not check serviceability from the API.");
    }
  }

  function saveArea() {
    if (!/^\d{6}$/.test(pincode.trim()) || !area.trim()) {
      setStatus("Add area and valid pincode before saving.");
      return;
    }
    setSavedAreas((current) => [{ area, pincode, branch: activeBranchName, eta: isServiceable ? "24-32 min" : "Notify only" }, ...current]);
    setStatus(`${area} saved to delivery areas.`);
  }

  function requestAreaNotification() {
    if (!notifyContact.trim()) {
      setStatus("Add phone or email for serviceability notification.");
      return;
    }
    setStatus(`We will notify ${notifyContact} when ${pincode} becomes serviceable.`);
  }

  return (
    <section className="serviceability-module">
      <ModuleHeader
        eyebrow="Branch and serviceability"
        title="Deliver to area check"
        text="Preview how pincode, branch stock, and product availability will connect to backend inventory."
      />
      <section className="serviceability-hero-card">
        <div>
          <span>{isServiceable ? "Serviceable area" : "Coverage check"}</span>
          <strong>{area} groceries from {activeBranchName}</strong>
          <small>{status}</small>
        </div>
        <div className="serviceability-route-line" aria-hidden="true">
          <span />
          <b />
          <i />
        </div>
      </section>
      <form className="serviceability-page-card" onSubmit={checkCoverage}>
        <label>
          <span>Area / locality</span>
          <input value={area} onChange={(event) => setArea(event.target.value)} />
        </label>
        <label>
          <span>Pincode</span>
          <input inputMode="numeric" maxLength={6} value={pincode} onChange={(event) => setPincode(event.target.value)} />
        </label>
        <label>
          <span>Preferred branch</span>
          <select value={branch} onChange={(event) => setBranch(event.target.value)}>
            <option>Bandra West</option>
            <option>Andheri East</option>
            <option>Powai</option>
          </select>
        </label>
        <button type="submit">Check serviceability</button>
        <button onClick={saveArea} type="button">Save area</button>
      </form>
      <div className="serviceability-result-grid">
        {branchSignals.map((signal) => (
          <article key={signal.label}>
            <span>{signal.label}</span>
            <strong>{signal.value}</strong>
            <small>{signal.detail}</small>
          </article>
        ))}
        <article>
          <span>Coverage</span>
          <strong>{isServiceable ? "Available" : "Check required"}</strong>
          <small>{status}</small>
        </article>
        <article>
          <span>Unavailable now</span>
          <strong>{unavailableProducts.length} items</strong>
          <small>{unavailableProducts.map((product) => product.name).join(", ")}</small>
        </article>
      </div>
      <section className="serviceability-map-card">
        <div>
          <span>Coverage map preview</span>
          <strong>{activeBranchName} branch radius</strong>
          <small>{area} - {pincode}</small>
        </div>
        <div className="serviceability-map-art" aria-hidden="true">
          <span />
          <b />
          <i />
        </div>
      </section>
      <section className="account-card">
        <div className="checkout-card-heading">
          <span>Notify me</span>
          <strong>Service updates</strong>
        </div>
        <div className="wallet-action-row wallet-settings-row">
          <label>
            <span>Phone or email</span>
            <input value={notifyContact} onChange={(event) => setNotifyContact(event.target.value)} />
          </label>
          <button onClick={requestAreaNotification} type="button">Notify me</button>
        </div>
      </section>
      <section className="account-card">
        <div className="checkout-card-heading">
          <span>Saved delivery areas</span>
          <strong>{savedAreas.length} areas</strong>
        </div>
        <div className="saved-area-list">
          {savedAreas.map((savedArea) => (
            <article key={`${savedArea.area}-${savedArea.pincode}`}>
              <span>{savedArea.area}</span>
              <strong>{savedArea.pincode}</strong>
              <small>{savedArea.branch} - {savedArea.eta}</small>
              <button
                onClick={() => {
                  setArea(savedArea.area);
                  setPincode(savedArea.pincode);
                  setBranch(savedArea.branch);
                  setStatus(`${savedArea.area} loaded for serviceability check.`);
                }}
                type="button"
              >
                Use
              </button>
            </article>
          ))}
        </div>
      </section>
      <a className="primary-link" href="/products">Browse available products</a>
    </section>
  );
}

function OrdersModule({ addToCart, products }: { addToCart: (product: Product) => void; products: Product[] }) {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [orderSearch, setOrderSearch] = useState("");
  const [activeOrderId, setActiveOrderId] = useState("");
  const [message, setMessage] = useState("Loading real order history from the database.");
  const [returnRequestOpen, setReturnRequestOpen] = useState(false);
  const [returnDraft, setReturnDraft] = useState({
    item: "",
    issue: "Quality issue",
    resolution: "Replacement",
    notes: ""
  });
  const statusOptions = ["All", "Out for delivery", "Delivered", "Confirmed", "Cancelled"];
  const visibleOrders = orders.filter((order) => {
    const statusMatch = statusFilter === "All" || order.status === statusFilter;
    const searchText = `${order.id} ${order.status} ${order.payment} ${order.slot} ${order.items.join(" ")}`.toLowerCase();
    return statusMatch && searchText.includes(orderSearch.trim().toLowerCase());
  });
  const activeOrder = orders.find((order) => order.id === activeOrderId) ?? orders[0];
  const orderStats = [
    { label: "Total orders", value: orders.length, detail: "All customer purchases" },
    { label: "Active", value: orders.filter((order) => ["Confirmed", "Out for delivery"].includes(order.status)).length, detail: "Being prepared or delivered" },
    { label: "Delivered", value: orders.filter((order) => order.status === "Delivered").length, detail: "Completed grocery orders" },
    { label: "Total spent", value: `Rs. ${orders.reduce((sum, order) => sum + order.total, 0)}`, detail: "Across current history" }
  ];
  const activeOrderProducts =
    activeOrder?.items.map((itemName, index) => {
      const detail = activeOrder.itemDetails?.[index];
      return (
        products.find((product) => product.id === detail?.productId) ??
        products.find((product) => product.name === itemName)
      );
    }) ?? [];

  useEffect(() => {
    let active = true;
    customerFetch("/api/customer/orders", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { orders: [] }))
      .then((data: { orders?: CustomerOrder[] }) => {
        if (!active) return;
        const nextOrders = Array.isArray(data.orders) ? data.orders : [];
        setOrders(nextOrders);
        setActiveOrderId((current) => current || nextOrders[0]?.id || "");
        setReturnDraft((current) => ({ ...current, item: nextOrders[0]?.items[0] ?? "" }));
        setMessage(nextOrders.length ? "Choose an order to track, reorder, cancel, or download invoice." : "No orders found in the database yet.");
      })
      .catch(() => setMessage("Could not load orders from the API."));
    return () => {
      active = false;
    };
  }, []);

  function statusClass(status: string) {
    return status.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }

  async function cancelOrder(orderId: string) {
    const order = orders.find((currentOrder) => currentOrder.id === orderId);
    if (!order?.canCancel) {
      setMessage(`${orderId} cannot be cancelled at this stage.`);
      return;
    }
    try {
      const data = (await customerFetch(`/api/customer/orders/${orderId}/cancel`, { method: "PATCH" }).then((response) =>
        response.json()
      )) as { order?: (CustomerOrder[])[number] };
      if (data.order) {
        setOrders((current) => current.map((item) => (item.id === orderId ? data.order! : item)));
      }
      setMessage(`${orderId} has been cancelled in the database.`);
    } catch {
      setMessage(`Could not cancel ${orderId}.`);
    }
  }

  function reorder(orderId: string) {
    const order = orders.find((currentOrder) => currentOrder.id === orderId);
    if (!order) {
      setMessage("Choose a valid order before reordering.");
      return;
    }
    const reorderCart = (order.itemDetails ?? []).reduce<Record<string, number>>((cart, item) => {
      if (item.productId) cart[item.productId] = item.quantity;
      return cart;
    }, {});
    if (Object.keys(reorderCart).length === 0) {
      let addedCount = 0;
      order.items.forEach((itemName) => {
        const product = products.find((item) => item.name === itemName);
        if (product && product.stock !== "Out of stock") {
          addToCart(product);
          addedCount += 1;
        }
      });
      setMessage(`${addedCount} available items from ${orderId} were added back to cart.`);
      return;
    }
    window.localStorage.setItem("freshcart-reorder-source", orderId);
    window.localStorage.setItem("freshcart-reorder-cart", JSON.stringify(reorderCart));
    setMessage(`${Object.keys(reorderCart).length} real order items from ${orderId} are ready for reorder.`);
    window.location.href = "/products";
  }

  async function downloadInvoice(orderId: string) {
    const order = orders.find((currentOrder) => currentOrder.id === orderId);
    if (!order) {
      setMessage("Choose a valid order before downloading invoice.");
      return;
    }
    try {
      const data = (await customerFetch(`/api/customer/orders/${orderId}/invoice`, { cache: "no-store" }).then((response) =>
        response.json()
      )) as { text?: string; invoice?: { invoiceNumber?: string } };
      if (!data.text) throw new Error("Invoice missing");
      const file = new Blob([data.text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${data.invoice?.invoiceNumber ?? order.id}-invoice.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage(`Invoice downloaded for ${order.id} from the database.`);
    } catch {
      setMessage(`Could not download invoice for ${order.id}.`);
    }
  }

  function clearOrderFilters() {
    setStatusFilter("All");
    setOrderSearch("");
    setMessage("Order filters cleared.");
  }

  function openReturnRequest() {
    if (!activeOrder) return;
    if (!activeOrder.canReturn) {
      setMessage(`${activeOrder.id} is not eligible for return or refund from this page.`);
      return;
    }
    setReturnDraft({
      item: activeOrder.items[0],
      issue: "Quality issue",
      resolution: "Replacement",
      notes: ""
    });
    setReturnRequestOpen(true);
    setMessage(`Return workflow opened for ${activeOrder.id}.`);
  }

  async function submitReturnRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeOrder) return;
    if (!returnDraft.item.trim() || !returnDraft.notes.trim()) {
      setMessage("Select item and add issue details before submitting.");
      return;
    }
    try {
      await customerFetch(`/api/customer/orders/${activeOrder.id}/refunds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(returnDraft)
      });
      setReturnRequestOpen(false);
      setMessage(`${returnDraft.resolution} request saved for ${returnDraft.item} in ${activeOrder.id}.`);
    } catch {
      setMessage("Could not create return or refund request.");
    }
  }

  if (!activeOrder) {
    return (
      <section className="orders-module">
        <ModuleHeader
          eyebrow="Order history"
          title="My Orders"
          text="Review grocery orders, track live delivery, reorder previous baskets, download invoices, and cancel eligible orders."
        />
        <div className="orders-empty-state">
          <strong>No orders in database yet</strong>
          <p>Create real orders from checkout or admin operations, then they will appear here.</p>
          <a href="/products">Browse products</a>
        </div>
        <p className="order-message">{message}</p>
      </section>
    );
  }

  return (
    <section className="orders-module">
      <ModuleHeader
        eyebrow="Order history"
        title="My Orders"
        text="Review grocery orders, track live delivery, reorder previous baskets, download invoices, and cancel eligible orders."
      />
      <div className="orders-summary-row">
        {orderStats.map((stat) => (
          <article key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.detail}</small>
          </article>
        ))}
      </div>
      <section className="orders-filter-card">
        <div>
          <span>Filter orders</span>
          <strong>{visibleOrders.length} visible</strong>
        </div>
        <label className="orders-search-field">
          <span>Search</span>
          <input
            placeholder="Order, item, status, payment"
            value={orderSearch}
            onChange={(event) => setOrderSearch(event.target.value)}
          />
        </label>
        <div className="orders-toolbar">
          {statusOptions.map((status) => (
            <button
              className={statusFilter === status ? "active" : ""}
              key={status}
              onClick={() => setStatusFilter(status)}
              type="button"
            >
              {status}
            </button>
          ))}
          <button onClick={clearOrderFilters} type="button">Clear</button>
        </div>
      </section>
      <div className="orders-layout">
        <section className="order-history-list">
          {visibleOrders.length > 0 ? (
            visibleOrders.map((order) => (
              <article className={activeOrder.id === order.id ? "active" : ""} key={order.id}>
                <button onClick={() => setActiveOrderId(order.id)} type="button">
                  <span>{order.id}</span>
                  <strong>{order.items[0]}</strong>
                  <small>{order.items.slice(1).join(", ")}</small>
                </button>
                <div>
                  <em className={`order-status-pill ${statusClass(order.status)}`}>{order.status}</em>
                  <b>Rs. {order.total}</b>
                  <small>{order.slot}</small>
                </div>
              </article>
            ))
          ) : (
            <div className="orders-empty-state">
              <strong>No orders found</strong>
              <p>Try another search or status filter, or continue shopping fresh grocery.</p>
              <button onClick={clearOrderFilters} type="button">Clear filters</button>
              <a href="/products">Browse products</a>
            </div>
          )}
        </section>
        <aside className="order-action-panel">
          <div className="order-detail-hero">
            <div>
              <span>{activeOrder.id}</span>
              <strong>{activeOrder.status}</strong>
              <small>{activeOrder.slot}</small>
            </div>
            <em className={`order-status-pill ${statusClass(activeOrder.status)}`}>{activeOrder.status}</em>
          </div>
          <div className="order-item-list">
            {activeOrder.items.map((item, index) => (
              <span key={item}>
                <b style={{ background: activeOrderProducts[index]?.color ?? "var(--red)" }} aria-hidden="true" />
                <span>
                  <strong>{item}</strong>
                  <small>{activeOrderProducts[index]?.unit ?? "FreshCart item"}</small>
                </span>
              </span>
            ))}
          </div>
          <div className="tracking-meta">
            <span>
              <small>Payment</small>
              <strong>{activeOrder.payment}</strong>
            </span>
            <span>
              <small>Slot</small>
              <strong>{activeOrder.slot}</strong>
            </span>
            <span>
              <small>Total</small>
              <strong>Rs. {activeOrder.total}</strong>
            </span>
          </div>
          <div className="order-progress-strip">
            {["Confirmed", "Packed", "Out for delivery", "Delivered"].map((step) => (
              <span
                className={
                  step === activeOrder.status ||
                  activeOrder.status === "Delivered" ||
                  (activeOrder.status === "Out for delivery" && ["Confirmed", "Packed"].includes(step))
                    ? "done"
                    : ""
                }
                key={step}
              >
                <b aria-hidden="true" />
                {step}
              </span>
            ))}
          </div>
          <div className="order-actions">
            <a href={`/orders/${activeOrder.id}`}>Track live</a>
            <button className="order-secondary-action" onClick={() => reorder(activeOrder.id)} type="button">Reorder</button>
            <button className="order-secondary-action" onClick={() => downloadInvoice(activeOrder.id)} type="button">Invoice</button>
            <button
              disabled={!activeOrder.canCancel}
              onClick={() => cancelOrder(activeOrder.id)}
              title={activeOrder.canCancel ? "Cancel this order" : "This order cannot be cancelled now"}
              type="button"
            >
              Cancel
            </button>
            <button
              className="order-secondary-action"
              disabled={!activeOrder.canReturn}
              onClick={openReturnRequest}
              title={activeOrder.canReturn ? "Request return or refund" : "This order is not eligible yet"}
              type="button"
            >
              Return
            </button>
          </div>
          {returnRequestOpen ? (
            <form className="order-return-panel" onSubmit={submitReturnRequest}>
              <div className="checkout-card-heading">
                <span>Return and refund</span>
                <strong>{activeOrder.id}</strong>
              </div>
              <label>
                <span>Item</span>
                <select
                  value={returnDraft.item}
                  onChange={(event) => setReturnDraft((current) => ({ ...current, item: event.target.value }))}
                >
                  {activeOrder.items.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Issue type</span>
                <select
                  value={returnDraft.issue}
                  onChange={(event) => setReturnDraft((current) => ({ ...current, issue: event.target.value }))}
                >
                  <option>Quality issue</option>
                  <option>Wrong item</option>
                  <option>Missing item</option>
                  <option>Damaged packaging</option>
                  <option>Expired or near expiry</option>
                </select>
              </label>
              <label>
                <span>Preferred resolution</span>
                <select
                  value={returnDraft.resolution}
                  onChange={(event) => setReturnDraft((current) => ({ ...current, resolution: event.target.value }))}
                >
                  <option>Replacement</option>
                  <option>Wallet refund</option>
                  <option>Original payment refund</option>
                  <option>Support callback</option>
                </select>
              </label>
              <label className="order-return-notes">
                <span>Issue details</span>
                <textarea
                  onChange={(event) => setReturnDraft((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Add item condition, photo note, batch, or delivery bag details"
                  value={returnDraft.notes}
                />
              </label>
              <div>
                <button type="submit">Submit request</button>
                <button onClick={() => setReturnRequestOpen(false)} type="button">Close</button>
              </div>
            </form>
          ) : null}
          <p className="order-message">{message}</p>
        </aside>
      </div>
    </section>
  );
}

function TrackingModule({ fullTracking, orderNumber }: { fullTracking: boolean; orderNumber?: string }) {
  const [tracking, setTracking] = useState<{
    order?: { id: string; status: string; payment: string; slot: string; total: number };
    tracking?: {
      eta?: string | null;
      status?: string;
      rider?: { name: string; phone?: string; status?: string } | null;
      branch?: { name: string } | null;
      location?: { latitude: number; longitude: number; at: string } | null;
      timeline?: Array<{ status: string; note?: string | null; at: string }>;
    };
  } | null>(null);
  const [trackingMessage, setTrackingMessage] = useState("Loading order tracking from the database.");
  const activeOrderNumber = orderNumber ?? tracking?.order?.id ?? "latest order";

  useEffect(() => {
    let active = true;
    async function loadTracking() {
      try {
        let nextOrderNumber = orderNumber;
        if (!nextOrderNumber) {
          const ordersData = (await customerFetch("/api/customer/orders", { cache: "no-store" }).then((response) =>
            response.json()
          )) as { orders?: Array<{ id: string }> };
          nextOrderNumber = ordersData.orders?.[0]?.id;
        }
        if (!nextOrderNumber) {
          setTrackingMessage("No order found in the database yet.");
          return;
        }
        const data = (await customerFetch(`/api/customer/orders/${nextOrderNumber}/tracking`, { cache: "no-store" }).then(
          (response) => response.json()
        )) as NonNullable<typeof tracking>;
        if (!active) return;
        setTracking(data);
        setTrackingMessage("Tracking loaded from the database.");
      } catch {
        if (active) setTrackingMessage("Could not load tracking from the API.");
      }
    }
    void loadTracking();
    return () => {
      active = false;
    };
  }, [orderNumber]);

  const etaText = tracking?.tracking?.eta ? "ETA assigned" : "ETA pending";
  const riderName = tracking?.tracking?.rider?.name ?? "Awaiting rider";
  const branchName = tracking?.tracking?.branch?.name ?? "Branch pending";
  const payment = tracking?.order?.payment ?? "Pending";
  const routeText = `${branchName} to customer address`;
  const timelineItems =
    tracking?.tracking?.timeline && tracking.tracking.timeline.length > 0
      ? tracking.tracking.timeline
      : [{ status: tracking?.order?.status ?? "Order placed", note: trackingMessage, at: new Date().toISOString() }];

  return (
    <section className="tracking-module">
      <ModuleHeader
        eyebrow={fullTracking ? "Live delivery module" : "Order module"}
        title={fullTracking ? `${activeOrderNumber} live tracking` : "Order history"}
        text="Premium delivery tracking connected to order, delivery assignment, rider, branch, location ping, and status history data."
      />
      <div className="tracking-grid">
        <div className="delivery-live-map">
          <span className="map-road road-one" />
          <span className="map-road road-two" />
          <span className="map-road road-three" />
          <span className="map-zone zone-hub">FreshCart Hub</span>
          <span className="map-zone zone-home">Bandra West</span>
          <div className="map-status-card">
            <span>{tracking?.order?.status ?? "Tracking"}</span>
            <strong>{etaText}</strong>
          </div>
          <span className="route-line" />
          <span className="rider-marker" aria-label="Current rider location" />
          <span className="map-pill store">Store</span>
          <span className="map-pill rider">Rider 07</span>
          <span className="map-pill customer">Home</span>
        </div>
        <div className="tracking-card">
          <div className="tracking-eta-card">
            <span>Estimated arrival</span>
            <strong>{etaText}</strong>
            <small>{tracking?.tracking?.location ? `Last ping ${tracking.tracking.location.at}` : trackingMessage}</small>
          </div>
          <div className="rider-card">
            <b aria-hidden="true">{riderName.charAt(0)}</b>
            <div>
              <strong>{riderName}</strong>
              <span>{tracking?.tracking?.rider?.phone ?? "Delivery partner will appear after assignment"}</span>
            </div>
          </div>
          <div className="tracking-meta">
            <span>
              <small>Payment</small>
              <strong>{payment}</strong>
            </span>
            <span>
              <small>Route</small>
              <strong>{routeText}</strong>
            </span>
            <span>
              <small>Bag status</small>
              <strong>{tracking?.tracking?.status ?? "Packing"}</strong>
            </span>
          </div>
          <a href="/support">Open support</a>
        </div>
      </div>
      <div className="timeline">
        {timelineItems.map((item, index) => (
          <span className={index < timelineItems.length - 1 ? "done" : "current"} key={`${item.status}-${item.at}`}>
            <small>{index < timelineItems.length - 1 ? "✓" : index + 1}</small>
            <strong>{item.status}</strong>
            <em>{item.note ?? item.at}</em>
          </span>
        ))}
      </div>
    </section>
  );
}

function SupportModule() {
  const topics = [
    {
      label: "Where is my order?",
      reply: "Your order is out for delivery. Aarav is heading toward Bandra West and should arrive in about 18 minutes."
    },
    {
      label: "Change delivery slot",
      reply: "I can help with that. Today 8 PM - 10 PM and tomorrow 8 AM - 10 AM are currently available."
    },
    {
      label: "Missing item",
      reply: "I am sorry about that. Share the item name and we will arrange a refund or replacement."
    },
    {
      label: "Payment issue",
      reply: "Payment support is ready. If money was deducted, we can verify the transaction and update the order."
    }
  ];
  const [activeTopic, setActiveTopic] = useState(topics[0].label);
  const [messages, setMessages] = useState<Array<{ sender: string; text: string }>>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    let active = true;
    customerFetch("/api/customer/support", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { conversation: { messages: [] } }))
      .then((data: { conversation?: { messages?: Array<{ sender: string; text: string }> } }) => {
        if (!active) return;
        setMessages(Array.isArray(data.conversation?.messages) ? data.conversation.messages : []);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  async function postSupportMessage(message: string) {
    const response = await customerFetch("/api/customer/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    const data = (await response.json()) as { conversation?: { messages?: Array<{ sender: string; text: string }> } };
    setMessages(Array.isArray(data.conversation?.messages) ? data.conversation.messages : []);
  }

  function chooseTopic(topic: (typeof topics)[number]) {
    setActiveTopic(topic.label);
    void postSupportMessage(topic.label).catch(() => {
      setMessages((current) => [...current, { sender: "user", text: topic.label }]);
    });
  }

  async function sendSupportMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextMessage = draft.trim();
    if (!nextMessage) return;
    setDraft("");
    try {
      await postSupportMessage(nextMessage);
    } catch {
      setMessages((current) => [...current, { sender: "user", text: nextMessage }]);
    }
  }

  return (
    <section className="support-module">
      <ModuleHeader
        eyebrow="Customer support"
        title="Talk to FreshCart support"
        text="Get help with orders, delivery slots, missing items, payments, and live delivery updates."
      />
      <div className="support-layout">
        <aside>
          <div className="support-aside-head">
            <span>Quick topics</span>
            <strong>How can we help?</strong>
          </div>
          {topics.map((topic, index) => (
            <button
              className={activeTopic === topic.label ? "active" : ""}
              key={topic.label}
              onClick={() => chooseTopic(topic)}
              type="button"
            >
              <span>{index + 1}</span>
              <strong>{topic.label}</strong>
            </button>
          ))}
        </aside>
        <div className="chat-thread">
          <div className="chat-head">
            <div>
              <span>FreshCart support</span>
              <strong>Live chat</strong>
            </div>
            <small>Online</small>
          </div>
          <div className="chat-messages">
            {messages.length === 0 ? (
              <p className="agent-message">Start a support conversation. Your messages will be saved for the admin support team.</p>
            ) : null}
            {messages.map((message, index) => (
            <p className={message.sender === "user" ? "user-message" : "agent-message"} key={`${message.text}-${index}`}>
              {message.text}
            </p>
            ))}
          </div>
          <form className="support-composer" onSubmit={sendSupportMessage}>
            <input
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type your message"
              value={draft}
            />
            <button type="submit">Send</button>
          </form>
        </div>
      </div>
    </section>
  );
}

function CartDrawer({
  cartItems,
  itemCount,
  subtotal,
  savings,
  deliveryFee,
  total,
  slot,
  liveCoupons,
  livePromotions,
  deliverySlots,
  setSlot,
  updateQuantity,
  onClose
}: {
  cartItems: Array<Product & { quantity: number }>;
  itemCount: number;
  subtotal: number;
  savings: number;
  deliveryFee: number;
  total: number;
  slot: string;
  liveCoupons: StorefrontData["coupons"];
  livePromotions: StorefrontData["promotions"];
  deliverySlots: DeliverySlot[];
  setSlot: (slot: string) => void;
  updateQuantity: (productId: ProductId, nextQuantity: number) => void;
  onClose: () => void;
}) {
  const cartPromotion =
    livePromotions.find((promotion) => promotion.placement.toLowerCase().includes("cart")) ??
    livePromotions.find((promotion) => promotion.type.toLowerCase().includes("cart"));
  const cartCoupon = liveCoupons[0];

  return (
    <section className="cart-drawer-backdrop" aria-label="Cart drawer">
      <button className="cart-drawer-scrim" onClick={onClose} type="button" aria-label="Close cart" />
      <aside className="cart-drawer" aria-modal="true" role="dialog">
        <div className="cart-drawer-head">
          <div>
            <span>Cart summary</span>
            <h2>{itemCount} items</h2>
          </div>
          <button onClick={onClose} type="button" aria-label="Close cart">
            Close
          </button>
        </div>
        <div className="cart-progress">
          <span style={{ width: `${Math.min((subtotal / 499) * 100, 100)}%` }} />
        </div>
        <p className="cart-progress-copy">
          {subtotal >= 499 ? "Free delivery unlocked" : `Add Rs. ${499 - subtotal} for free delivery`}
        </p>
        <div className="drawer-items-heading">
          <span>Items</span>
          <strong>{itemCount} selected</strong>
        </div>
        {cartItems.length > 0 ? (
          <section className="cart-page-list drawer-list">
            {cartItems.map((item) => (
              <article className="drawer-cart-item" key={item.id}>
                <b className="drawer-cart-image" style={{ background: item.color }} aria-hidden="true">
                  <i />
                </b>
                <div className="drawer-cart-copy">
                  <strong>{item.name}</strong>
                  <span>{item.unit}</span>
                  <em>Rs. {item.price * item.quantity}</em>
                </div>
                <QuantityStepper
                  quantity={item.quantity}
                  onMinus={() => updateQuantity(item.id, item.quantity - 1)}
                  onPlus={() => updateQuantity(item.id, item.quantity + 1)}
                />
              </article>
            ))}
          </section>
        ) : (
          <section className="cart-empty-state">
            <CartIcon />
            <strong>Your cart is empty</strong>
            <span>Add groceries before checkout.</span>
            <a href="/products">Browse products</a>
          </section>
        )}
        <label className="drawer-select">
          <span>Delivery slot</span>
          <select disabled={deliverySlots.length === 0} value={slot} onChange={(event) => setSlot(event.target.value)}>
            {deliverySlots.length === 0 ? <option>No active slots configured</option> : null}
            {deliverySlots.map((deliverySlot) => (
              <option key={deliverySlot.id} value={deliverySlot.label}>{deliverySlot.label}</option>
            ))}
          </select>
        </label>
        <div className="coupon-strip">
          <strong>{cartCoupon?.code ?? cartPromotion?.coupon ?? "No live coupon"}</strong>
          <span>{cartPromotion?.title ?? cartCoupon?.campaign ?? "Publish coupons in admin to show cart savings."}</span>
        </div>
        <div className="cart-drawer-footer">
          <div className="cart-summary-heading">
            <span>Price summary</span>
            <strong>{deliveryFee === 0 ? "Free delivery" : "Almost there"}</strong>
          </div>
          <SummaryPanel subtotal={subtotal} savings={savings} deliveryFee={deliveryFee} total={total} />
          {cartItems.length > 0 ? (
            <a className="primary-link" href="/checkout/address">
              Checkout <strong>Rs. {total}</strong>
            </a>
          ) : (
            <a className="primary-link" href="/products">
              Add products
            </a>
          )}
        </div>
      </aside>
    </section>
  );
}

function ProductGrid({
  heading,
  productsToShow,
  cart,
  addToCart,
  buyNow,
  updateQuantity,
  wishlist,
  toggleWishlist
}: {
  heading: string;
  productsToShow: Product[];
  cart: Cart;
  addToCart: (product: Product) => void;
  buyNow: (product: Product) => void;
  updateQuantity: (productId: ProductId, nextQuantity: number) => void;
  wishlist: ProductId[];
  toggleWishlist: (productId: ProductId) => void;
}) {
  return (
    <section className="product-section">
      <div className="module-title">
        <div>
          <span>FreshCart shelf</span>
          <h2>{heading}</h2>
        </div>
        <a href="/products">{productsToShow.length} results</a>
      </div>
      <div className="product-grid">
        {productsToShow.length === 0 ? (
          <PageStatePanel
            icon={<SearchIcon />}
            title="No products found"
            text="Try changing search, price, supplier, stock, or dietary filters."
            actionHref="/products"
            actionText="Browse all products"
          />
        ) : null}
        {productsToShow.map((product) => {
          const quantity = cart[productKey(product.id)] ?? 0;
          const isSaved = wishlist.map(productKey).includes(productKey(product.id));
          const discount = product.oldPrice
            ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
            : 0;
          return (
            <article className="product-card" key={product.id}>
              <button
                aria-label={`${isSaved ? "Remove" : "Save"} ${product.name} ${isSaved ? "from" : "to"} wishlist`}
                aria-pressed={isSaved}
                className={`product-wishlist${isSaved ? " active" : ""}`}
                onClick={() => toggleWishlist(product.id)}
                type="button"
              >
                <HeartIcon />
              </button>
              <a className="product-art" href={`/products/${product.slug}`} style={{ background: product.color }}>
                <span>{product.category}</span>
                {discount > 0 ? <b>{discount}% off</b> : null}
                {product.image ? (
                  <>
                    <img alt={product.name} onError={showImageFallback} src={product.image} />
                    <i aria-hidden="true" hidden />
                  </>
                ) : (
                  <i aria-hidden="true" />
                )}
              </a>
              <div className="product-tags">
                <span>{product.badge}</span>
                <span className={product.stock === "Out of stock" ? "danger" : ""}>{product.stock}</span>
              </div>
              <h3>{product.name}</h3>
              <p>{product.unit} - {product.rating} rating - 24 min</p>
              <div className="price-row">
                <div>
                  <strong>Rs. {product.price}</strong>
                  {product.oldPrice ? <span>Rs. {product.oldPrice}</span> : null}
                </div>
                <small>{product.stock === "Out of stock" ? "Restock soon" : "Fresh today"}</small>
              </div>
              {quantity > 0 ? (
                <div className="product-card-actions">
                  <QuantityStepper
                    quantity={quantity}
                    onMinus={() => updateQuantity(product.id, quantity - 1)}
                    onPlus={() => updateQuantity(product.id, quantity + 1)}
                  />
                  <button
                    className="buy-now-card-button"
                    disabled={product.stock === "Out of stock"}
                    onClick={() => buyNow(product)}
                    type="button"
                  >
                    Buy now
                  </button>
                </div>
              ) : (
                <div className="product-card-actions">
                  <button
                    className="add-button"
                    disabled={product.stock === "Out of stock"}
                    onClick={() => addToCart(product)}
                    type="button"
                  >
                    {product.stock === "Out of stock" ? "Unavailable" : "Add"}
                  </button>
                  <button
                    className="buy-now-card-button"
                    disabled={product.stock === "Out of stock"}
                    onClick={() => buyNow(product)}
                    type="button"
                  >
                    Buy now
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function CategoryRail({
  activeCategory,
  setActiveCategory,
  storefrontCategories
}: {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  storefrontCategories: StorefrontData["categories"];
}) {
  const railCategories =
    storefrontCategories.length > 0
      ? storefrontCategories
      : [];

  return (
    <section className="category-rail">
      <button
        className={activeCategory === "All" ? "active" : ""}
        onClick={() => setActiveCategory("All")}
        type="button"
      >
        <b className="category-image" style={categoryImageStyle("all")} aria-hidden="true" />
        <strong>All</strong>
      </button>
      {railCategories.map((category) => (
        <button
          className={activeCategory === category.name ? "active" : ""}
          key={category.slug}
          onClick={() => setActiveCategory(category.name)}
          type="button"
        >
          <b className="category-image" style={categoryImageStyle(category.slug)} aria-hidden="true" />
          <strong>{category.name}</strong>
          <span>{category.note}</span>
        </button>
      ))}
    </section>
  );
}

function FilterBar({
  activeFilters,
  toggleFilter,
  sortMode,
  setSortMode,
  priceBand,
  setPriceBand,
  supplierOptions,
  supplierFilter,
  setSupplierFilter,
  clearCatalogFilters
}: {
  activeFilters: string[];
  toggleFilter: (filter: string) => void;
  sortMode: string;
  setSortMode: (sort: string) => void;
  priceBand: string;
  setPriceBand: (priceBand: string) => void;
  supplierOptions: string[];
  supplierFilter: string;
  setSupplierFilter: (supplier: string) => void;
  clearCatalogFilters: () => void;
}) {
  return (
    <section className="catalog-control-panel" aria-label="Catalog filters">
      <div className="filter-panel-heading">
        <div>
          <span>Refine shelf</span>
          <strong>Find the right groceries faster</strong>
        </div>
        <small>{activeFilters.length} active filters</small>
      </div>
      <div className="filter-bar">
        {catalogFilters.map((filter) => (
          <button
            aria-pressed={activeFilters.includes(filter)}
            className={activeFilters.includes(filter) ? "active" : ""}
            key={filter}
            onClick={() => toggleFilter(filter)}
            type="button"
          >
            <span aria-hidden="true" />
            {filter}
          </button>
        ))}
      </div>
      <div className="catalog-selectors">
        <label>
          <span>Sort by</span>
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
            {sortOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Price</span>
          <select value={priceBand} onChange={(event) => setPriceBand(event.target.value)}>
            {priceBands.map((band) => (
              <option key={band}>{band}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Supplier</span>
          <select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)}>
            {supplierOptions.map((supplier) => (
              <option key={supplier}>{supplier}</option>
            ))}
          </select>
        </label>
        <button className="clear-filter-button" onClick={clearCatalogFilters} type="button">
          Clear filters
        </button>
      </div>
    </section>
  );
}

function ModuleHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <header className="module-header">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </header>
  );
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function QuantityStepper({
  quantity,
  onMinus,
  onPlus
}: {
  quantity: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="quantity-stepper">
      <button onClick={onMinus} type="button">-</button>
      <strong>{quantity}</strong>
      <button onClick={onPlus} type="button">+</button>
    </div>
  );
}

function SummaryPanel({
  subtotal,
  savings,
  deliveryFee,
  total
}: {
  subtotal: number;
  savings: number;
  deliveryFee: number;
  total: number;
}) {
  return (
    <div className="summary-panel">
      <span>Subtotal <strong>Rs. {subtotal}</strong></span>
      <span>Savings <strong>Rs. {savings}</strong></span>
      <span>Delivery <strong>{deliveryFee === 0 ? "Free" : `Rs. ${deliveryFee}`}</strong></span>
      <span>Total <strong>Rs. {total}</strong></span>
    </div>
  );
}
