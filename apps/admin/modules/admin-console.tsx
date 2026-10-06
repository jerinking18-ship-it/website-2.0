"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, FormEvent, ReactNode, SetStateAction } from "react";
import type { StorefrontData } from "@freshcart/utils";
import { adminApi } from "./admin-api";
import { deliveries, inventory, metrics, orders, products, support } from "./admin-data";

function usePersistentState<T>(key: string, initialValue: T) {
  const apiHydrated = useRef(false);
  const dirty = useRef(false);
  const emptyInitialValue = useRef<T>(Array.isArray(initialValue) ? ([] as T) : initialValue);
  const [state, setRawState] = useState<T>(emptyInitialValue.current);

  const setState: Dispatch<SetStateAction<T>> = (nextState) => {
    dirty.current = true;
    setRawState(nextState);
  };

  useEffect(() => {
    let active = true;
    apiHydrated.current = false;
    dirty.current = false;
    setRawState(emptyInitialValue.current);
    adminApi<{ state: T | null }>(`state/${encodeURIComponent(key)}`)
      .then(({ state: apiState }) => {
        if (!active) return;
        if (apiState !== null) setRawState(apiState);
        apiHydrated.current = true;
      })
      .catch(() => {
        apiHydrated.current = true;
      });
    return () => {
      active = false;
    };
  }, [key]);

  useEffect(() => {
    if (!apiHydrated.current || !dirty.current) return;
    const timeout = window.setTimeout(() => {
      void adminApi<{ updatedAt: string }>(`state/${encodeURIComponent(key)}`, {
        method: "PATCH",
        body: JSON.stringify({ state })
      })
        .then(() => {
          dirty.current = false;
        })
        .catch(() => undefined);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [key, state]);

  return [state, setState] as const;
}

type AdminView =
  | "dashboard"
  | "products"
  | "categories"
  | "orders"
  | "inventory"
  | "suppliers"
  | "delivery"
  | "support"
  | "customers"
  | "coupons"
  | "promotions"
  | "refunds"
  | "finance"
  | "audit-logs"
  | "content"
  | "account"
  | "reviews"
  | "loyalty"
  | "branches"
  | "legal"
  | "notifications"
  | "staff"
  | "reports"
  | "settings";

type AdminProduct = (typeof products)[number] & { id?: string; slug?: string; categorySlug?: string; imageFile?: string };
type AdminOrder = (typeof orders)[number];
type AdminInventoryItem = (typeof inventory)[number] & { batch: string; supplier: string };
type AdminDelivery = (typeof deliveries)[number] & { zone: string };
type AdminSupportTicket = (typeof support)[number];

function productImageLabel(value?: string) {
  if (!value) return "";
  if (value.startsWith("data:image/")) return "Image uploaded";
  return value;
}

function isImageSource(value?: string) {
  if (!value) return false;
  return value.startsWith("data:image/") || value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://");
}

function CategoryImage({ category }: { category: AdminCategory }) {
  return (
    <strong className={isImageSource(category.image) ? "module-avatar category-image-avatar has-image" : "module-avatar category-image-avatar"}>
      {isImageSource(category.image) ? <img alt={category.name} src={category.image} /> : category.name.slice(0, 2).toUpperCase()}
    </strong>
  );
}

function CategoryImageControls({
  image,
  name,
  onImageChange
}: {
  image: string;
  name: string;
  onImageChange: (image: string) => void;
}) {
  return (
    <>
      <label className="settings-wide">
        <span>Category image URL</span>
        <input
          name="image"
          placeholder="/images/categories/fresh-produce.jpg or https://..."
          value={image}
          onChange={(event) => onImageChange(event.target.value)}
        />
      </label>
      <label className="settings-wide">
        <span>Upload category image</span>
        <input
          accept="image/*"
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === "string") {
                onImageChange(reader.result);
              }
            };
            reader.readAsDataURL(file);
          }}
        />
        <small>{image ? `Selected: ${productImageLabel(image)}` : "Upload a category image for the admin category row and client storefront category strip."}</small>
      </label>
      {isImageSource(image) ? (
        <div className="product-image-preview settings-wide">
          <span>Category preview</span>
          <img alt={name || "Category preview"} src={image} />
        </div>
      ) : null}
    </>
  );
}

const emptySupportTicket: AdminSupportTicket = {
  customer: "",
  topic: "",
  state: "Open",
  agent: "",
  order: "",
  time: ""
};
type AdminSearchResult = {
  title: string;
  meta: string;
  href: string;
  group: string;
  tokens: string;
};

const emptyAdminProduct: AdminProduct = {
  name: "",
  sku: "",
  category: "",
  categorySlug: "",
  price: "Rs. ",
  sale: "-",
  stock: "In stock",
  status: "Active",
  badge: "",
  imageFile: ""
};

const emptyAdminInventoryItem: AdminInventoryItem = {
  product: "",
  sku: "",
  stock: 0,
  reserved: 0,
  available: 0,
  threshold: 0,
  expiry: "",
  status: "Out of stock",
  batch: "",
  supplier: ""
};

const emptyAdminCategory: AdminCategory = {
  id: "",
  name: "",
  slug: "",
  parent: "Root",
  products: 0,
  image: "",
  status: "Draft",
  featured: false,
  order: 1,
  badge: "",
  sales: "Rs. 0",
  orders: 0,
  topProduct: "",
  outOfStock: 0,
  offer: "",
  banner: "",
  seoTitle: "",
  seoDescription: "",
  keywords: "",
  ogImage: ""
};
type AdminCustomer = {
  name: string;
  email: string;
  phone: string;
  status: "Active" | "New" | "At risk" | "VIP";
  tier: "Gold" | "Silver" | "Platinum" | "Starter";
  orders: number;
  spend: string;
  averageOrder: string;
  lastOrder: string;
  paymentPreference: "COD" | "Online";
  preferredSlot: string;
  favorite: string;
  address: string;
  cart: string;
  support: string;
  points: number;
  wallet: string;
  risk: string;
  internalNote: string;
};
const emptyAdminCustomer: AdminCustomer = {
  name: "",
  email: "",
  phone: "",
  status: "New",
  tier: "Starter",
  orders: 0,
  spend: "Rs. 0",
  averageOrder: "Rs. 0",
  lastOrder: "",
  paymentPreference: "Online",
  preferredSlot: "",
  favorite: "",
  address: "",
  cart: "",
  support: "",
  points: 0,
  wallet: "Rs. 0",
  risk: "",
  internalNote: ""
};
type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  parent: string;
  products: number;
  image: string;
  status: "Active" | "Hidden" | "Scheduled" | "Draft" | "Archived";
  featured: boolean;
  order: number;
  badge: string;
  sales: string;
  orders: number;
  topProduct: string;
  outOfStock: number;
  offer: string;
  banner: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string;
  ogImage: string;
};
type CategoryTab = "Overview" | "Directory" | "Subcategories" | "Homepage Order" | "Product Mapping" | "Offers" | "SEO";
type CategoryDialog = "add" | "edit" | "profile" | "seo" | null;
type CategoryProductMapping = {
  sku: string;
  product: string;
  categoryId: string;
  status: "Active" | "Low stock" | "Uncategorized";
  sales: string;
};
type CategoryOffer = {
  id: string;
  categoryId: string;
  title: string;
  placement: string;
  status: "Live" | "Scheduled" | "Paused";
  valid: string;
};
type AdminSupplier = {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  status: "Active" | "Review" | "Paused";
  lastPurchase: string;
  rating: string;
  payment: string;
  categories: string;
  address: string;
  gst: string;
  terms: string;
  schedule: string;
  notes: string;
  onTime: string;
  rejected: number;
  delayed: number;
  averageDelivery: string;
  outstanding: string;
};
const emptyAdminSupplier: AdminSupplier = {
  id: "",
  name: "",
  contact: "",
  phone: "",
  email: "",
  status: "Review",
  lastPurchase: "",
  rating: "-",
  payment: "",
  categories: "",
  address: "",
  gst: "",
  terms: "",
  schedule: "",
  notes: "",
  onTime: "-",
  rejected: 0,
  delayed: 0,
  averageDelivery: "-",
  outstanding: "Rs. 0"
};
type SupplierTab = "Overview" | "Directory" | "Purchase Orders" | "Payments" | "Performance" | "Reviews";
type SupplierDialog = "add" | "edit" | "profile" | "purchase" | null;
type SupplierPurchaseOrder = {
  id: string;
  supplierId: string;
  products: string;
  quantity: string;
  amount: string;
  orderDate: string;
  deliveryDate: string;
  payment: "Paid" | "Pending" | "Partial";
  status: "Received" | "Pending" | "Delayed";
};
type SupplierPayment = {
  id: string;
  supplierId: string;
  invoice: string;
  amount: string;
  due: string;
  status: "Paid" | "Pending" | "Partial";
  method: string;
};
type SupplierExport = {
  id: string;
  title: string;
  format: "CSV" | "XLSX" | "PDF";
  status: "Ready" | "Downloaded";
  time: string;
};
type AdminPromotion = {
  id: string;
  title: string;
  type: "Homepage banner" | "Footer banner" | "Category offer" | "Cart offer" | "Product badge" | "Delivery offer" | "Checkout message" | "Flash sale";
  placement: string;
  audience: string;
  status: "Live" | "Scheduled" | "Paused" | "Expired";
  priority: number;
  cta: string;
  budget: string;
  budgetUsed: string;
  value: string;
  coupon: string;
  couponState: "Connected" | "Needs setup" | "Synced";
  targetUrl: string;
  startsAt: string;
  endsAt: string;
  views: number;
  clicks: number;
  conversions: number;
  revenue: string;
  roi: string;
  discountCost: string;
  risk: "Low" | "Medium" | "High";
  riskNote: string;
  mappedTo: string;
  image: string;
};
type PromotionTab = "Overview" | "Campaigns" | "Placements" | "Audience" | "Product Mapping" | "Coupons" | "Schedule" | "Analytics" | "Risk";
type PromotionDialog = "create" | "edit" | "preview" | "analytics" | "risk" | null;
type PromotionSyncEvent = {
  id: string;
  message: string;
  time: string;
};
type ProductDialog = "add" | "edit" | "stock" | "upload" | "bulk" | null;
type OrderFilter = "All" | "Packed" | "Out for delivery" | "COD";
type OrderDialog = "open" | "assign" | null;
type InventoryFilter = "All stock" | "Low stock" | "Expiry";
type InventoryDialog = "adjust" | "purchase" | "supplier" | "batch" | null;
type DeliveryDialog = "track" | "assign" | "slots" | "zones" | null;
type CustomerSegment = "All" | "VIP" | "New" | "At risk" | "COD users";
type CustomerDialog = "message" | "orders" | "note" | "support" | null;
type CouponStatus = "Active" | "Scheduled" | "Paused" | "Expired";
type AdminCoupon = {
  code: string;
  campaign: string;
  type: "Percent" | "Flat" | "Free delivery";
  value: string;
  minCart: string;
  maxDiscount: string;
  usage: number;
  limit: number;
  segment: string;
  status: CouponStatus;
  valid: string;
  revenue: string;
  risk: string;
};
type PromotionBanner = {
  id?: string;
  title: string;
  placement: string;
  audience: string;
  cta: string;
  target: string;
  image?: string;
  status: "Live" | "Scheduled" | "Paused";
  priority: number;
};
type CouponFilter = "All" | "Active" | "Scheduled" | "Paused" | "Expired";
type CouponDialog = "create" | "usage" | "banner" | "risk" | null;

function publishStorefrontPatch(patch: Partial<StorefrontData>) {
  void fetch("/api/storefront", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch)
  }).catch(() => {
    // The admin module remains editable if the local bridge is temporarily unavailable.
  });
}

function categoryPath(slug: string) {
  return `/categories/${slug}`;
}

function categoriesToStorefront(items: AdminCategory[]): StorefrontData["categories"] {
  return items
    .map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      note: item.banner || item.seoDescription,
      image: item.image,
      status: item.status,
      featured: item.featured,
      order: item.order,
      href: categoryPath(item.slug)
    }))
    .sort((first, second) => first.order - second.order);
}

function couponsToStorefront(items: AdminCoupon[]): StorefrontData["coupons"] {
  return items.map((item) => ({
    code: item.code,
    campaign: item.campaign,
    type: item.type,
    value: item.value,
    minCart: item.minCart,
    maxDiscount: item.maxDiscount,
    status: item.status,
    valid: item.valid,
    segment: item.segment
  }));
}

function promotionsToStorefront(items: AdminPromotion[]): StorefrontData["promotions"] {
  return items
    .map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      placement: item.placement,
      audience: item.audience,
      status: item.status,
      priority: item.priority,
      cta: item.cta,
      targetUrl: item.targetUrl,
      value: item.value,
      coupon: item.coupon,
      mappedTo: item.mappedTo
    }))
    .sort((first, second) => first.priority - second.priority);
}

function bannersToStorefront(items: PromotionBanner[]): StorefrontData["couponBanners"] {
  return [...items].sort((first, second) => first.priority - second.priority);
}

type NotificationChannel = "WhatsApp" | "SMS" | "Email" | "Push" | "In-app";
type NotificationStatus = "Draft" | "Scheduled" | "Sending" | "Sent" | "Paused" | "Failed";
type NotificationTab = "Overview" | "Create" | "Scheduled" | "History";
type AdminNotification = {
  id: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  audience: string;
  status: NotificationStatus;
  schedule: string;
  recipients: number;
  openRate: string;
  clickRate: string;
  owner: string;
  target: string;
  priority: "Normal" | "High" | "Urgent";
};
type NotificationTemplate = {
  name: string;
  channel: NotificationChannel;
  message: string;
  variables: string;
  cta: string;
  lastUsed: string;
  performance: string;
};
type NotificationFailure = {
  id: string;
  customer: string;
  channel: NotificationChannel;
  reason: string;
  time: string;
  status: "Open" | "Retried" | "Resolved";
};
type AutomationRule = {
  name: string;
  trigger: string;
  channel: NotificationChannel;
  template: string;
  delay: string;
  active: boolean;
  lastRun: string;
  failures: number;
};
type StaffStatus = "Active" | "On shift" | "Invited" | "Suspended" | "Offline";
type StaffRole =
  | "Owner"
  | "Store Manager"
  | "Product Manager"
  | "Inventory Manager"
  | "Supplier Manager"
  | "Order Manager"
  | "Delivery Manager"
  | "Support Agent"
  | "Marketing Manager"
  | "Finance Manager"
  | "Compliance Manager"
  | "Content Manager"
  | "System Admin"
  | "Read-only Auditor";
type StaffTab = "Overview" | "Directory" | "Roles" | "Shifts" | "Activity";
type AdminStaff = {
  id: string;
  name: string;
  role: StaffRole;
  email: string;
  phone: string;
  shift: string;
  status: StaffStatus;
  zone: string;
  lastActive: string;
  twoFactor: boolean;
  performance: string;
  rating: string;
};
const emptyAdminStaff: AdminStaff = {
  id: "",
  name: "",
  role: "Support Agent",
  email: "",
  phone: "",
  shift: "",
  status: "Offline",
  zone: "",
  lastActive: "",
  twoFactor: false,
  performance: "",
  rating: "-"
};
type StaffRoleCard = {
  role: string;
  users: number;
  access: string;
  permissions: string[];
};
const emptyStaffRole: StaffRoleCard = {
  role: "Custom role",
  users: 0,
  access: "",
  permissions: []
};
type StaffShift = {
  id: string;
  name: string;
  role: StaffRole;
  shift: string;
  zone: string;
  state: "Scheduled" | "Clocked in" | "On break" | "Late" | "Completed";
};

const staffRoleOptions: StaffRole[] = [
  "Owner",
  "Store Manager",
  "Product Manager",
  "Inventory Manager",
  "Supplier Manager",
  "Order Manager",
  "Delivery Manager",
  "Support Agent",
  "Marketing Manager",
  "Finance Manager",
  "Compliance Manager",
  "Content Manager",
  "System Admin",
  "Read-only Auditor"
];

const adminPermissionModules = [
  "Dashboard",
  "Products",
  "Categories",
  "Orders",
  "Inventory",
  "Suppliers",
  "Delivery",
  "Support",
  "Customers",
  "Coupons",
  "Promotions",
  "Refunds",
  "Finance",
  "Audit Logs",
  "Content Manager",
  "Admin Account",
  "Reviews",
  "Loyalty & Wallet",
  "Branches",
  "Legal & Compliance",
  "Notifications",
  "Staff",
  "Reports",
  "Settings"
];
type StaffActivity = {
  id: string;
  staff: string;
  action: string;
  module: string;
  risk: "Low" | "Medium" | "High";
  time: string;
};
type SettingsTab = "Store" | "Delivery" | "Payments" | "Checkout" | "Notifications" | "Support" | "Security";
type StoreStatus = "Open" | "Closed" | "Maintenance";
type StoreSettings = {
  name: string;
  email: string;
  phone: string;
  gst: string;
  address: string;
  city: string;
  status: StoreStatus;
  logo: string;
};
type DeliverySettings = {
  zones: string[];
  fee: string;
  freeThreshold: string;
  minimumOrder: string;
  slots: string;
  express: boolean;
  assignment: string;
  radius: string;
  mapProvider: string;
};
type PaymentSettings = {
  cod: boolean;
  online: boolean;
  provider: string;
  upi: string;
  refundRule: string;
  codLimit: string;
  retryRule: string;
};
type CheckoutSettings = {
  tax: string;
  packagingFee: string;
  handlingFee: string;
  substitutions: boolean;
  addressValidation: string;
  couponStacking: boolean;
  wallet: boolean;
};
type NotificationSettings = {
  whatsapp: string;
  sms: string;
  email: string;
  push: string;
  adminAlerts: boolean;
  customerOrderUpdates: boolean;
  marketingOptIn: boolean;
};
type SupportSettings = {
  workingHours: string;
  autoAssignment: boolean;
  escalationRule: string;
  sla: string;
  refundHandling: string;
  whatsapp: string;
  inbox: string;
};
type SecuritySettings = {
  ownerTwoFactor: boolean;
  staffTwoFactor: boolean;
  sessionTimeout: string;
  deviceTracking: boolean;
  lockout: string;
  roleDefaults: string;
  auditRetention: string;
};
type LegalSettings = {
  gst: string;
  invoicePrefix: string;
  taxSlabs: string;
  license: string;
  privacyUrl: string;
  termsUrl: string;
  refundUrl: string;
};
type InventoryPolicySettings = {
  lowStock: string;
  expiryDays: string;
  batchTracking: boolean;
  supplierApproval: boolean;
  autoReorder: boolean;
  reservationTimeout: string;
};
type SettingsAudit = {
  id: string;
  action: string;
  area: string;
  time: string;
};
type ReportTab = "Overview" | "Sales" | "Orders" | "Inventory" | "Customers" | "Delivery" | "Promotions" | "Support" | "Finance";
type ReportRange = "Today" | "7 days" | "30 days" | "Quarter";
type ReportMetric = {
  label: string;
  value: string;
  change: string;
  detail: string;
};
type ReportSeries = {
  label: string;
  value: number;
  amount: string;
};
type ReportInsight = {
  title: string;
  detail: string;
  priority: "Low" | "Medium" | "High";
};
type ReportExport = {
  id: string;
  title: string;
  format: "CSV" | "PDF" | "XLSX";
  status: "Ready" | "Scheduled" | "Processing";
  time: string;
};
type ReportFilters = {
  category: string;
  payment: string;
  zone: string;
  segment: string;
};
type ReportRowDetail = {
  title: string;
  columns: string[];
  row: string[];
};
type RefundTab = "Overview" | "Requests" | "Returns" | "Approvals" | "Finance" | "Risk" | "Settings";
type RefundStatus = "Requested" | "Under review" | "Awaiting evidence" | "Approved" | "Rejected" | "Processing refund" | "Refunded" | "Return pickup scheduled" | "Return received" | "Closed";
type RefundMethod = "Original payment" | "Wallet credit" | "Coupon credit" | "Manual payout";
type ReturnPickupStatus = "Not required" | "Pickup pending" | "Pickup scheduled" | "Rider assigned" | "Picked up" | "Return received" | "Return failed" | "Closed";
type RestockDecision = "Restock" | "Quarantine" | "Discard" | "Supplier claim" | "Needs manager review";
type RefundFinanceStatus = "Not started" | "Queued" | "Processing" | "Refunded" | "Failed" | "Manual payout required" | "Reconciled";
type RefundRiskLevel = "Low" | "Medium" | "High";
type AdminRefundRequest = {
  id: string;
  orderId: string;
  customer: string;
  phone: string;
  email: string;
  reason: string;
  items: string;
  amount: string;
  paymentMethod: "COD" | "Online" | "UPI" | "Card" | "Wallet";
  refundMethod: RefundMethod;
  status: RefundStatus;
  sla: string;
  risk: RefundRiskLevel;
  assignedTo: string;
  customerNote: string;
  adminNote: string;
  evidence: "Not required" | "Requested" | "Received" | "Rejected";
  transactionId: string;
  financeStatus: RefundFinanceStatus;
  gatewayStatus: string;
  processedBy: string;
  processedTime: string;
  returnStatus: ReturnPickupStatus;
  reviewerDecision: string;
  riskNote: string;
};
type AdminReturnPickup = {
  id: string;
  refundId: string;
  orderId: string;
  customer: string;
  items: string;
  status: ReturnPickupStatus;
  slot: string;
  rider: string;
  address: string;
  condition: string;
  restockDecision: RestockDecision;
  batch: string;
  expiry: string;
  inventoryNote: string;
};
type RefundApprovalRule = {
  id: string;
  name: string;
  trigger: string;
  limit: string;
  evidenceRequired: boolean;
  ownerApproval: boolean;
  autoApprove: boolean;
  sla: string;
  status: "Active" | "Paused";
};
type RefundSettings = {
  autoApproveLimit: string;
  ownerApprovalLimit: string;
  evidencePolicy: string;
  walletCredit: boolean;
  returnPickupThreshold: string;
  financeSla: string;
  customerMessageChannel: "WhatsApp" | "SMS" | "Email";
};
type FinanceTab = "Overview" | "Payments" | "COD" | "Refunds" | "Settlements" | "Expenses" | "Profit" | "Taxes" | "Invoices" | "Reports";
type FinanceDialog = "payment" | "cod" | "refund" | "settlement" | "expense" | "invoice" | "report" | null;
type FinancePaymentMethod = "COD" | "UPI" | "Card" | "Wallet" | "Net banking" | "Manual payment";
type FinancePaymentStatus = "Paid" | "Pending" | "Failed" | "Refunded" | "Partially refunded" | "COD pending" | "COD collected" | "Reconciled";
type FinanceReconciliationStatus = "Open" | "Queued" | "Matched" | "Mismatch" | "Reconciled";
type FinanceCodStatus = "Pending collection" | "Collected by rider" | "Submitted to store" | "Short amount" | "Verified" | "Escalated";
type FinanceRefundStatus = "Awaiting finance approval" | "Approved for payout" | "Wallet credited" | "Gateway queued" | "Paid" | "Reconciled" | "Adjustment required";
type FinanceSettlementStatus = "Expected" | "Pending" | "Received" | "Mismatch" | "Under review" | "Reconciled";
type FinanceExpenseStatus = "Draft" | "Awaiting approval" | "Approved" | "Paid" | "Receipt missing" | "Rejected";
type FinanceInvoiceStatus = "Generated" | "Sent" | "Downloaded" | "Failed" | "Cancelled" | "Credit note issued" | "Reviewed";
type FinanceReportStatus = "Ready" | "Scheduled" | "Processing";
type FinancePayment = {
  id: string;
  orderId: string;
  customer: string;
  phone: string;
  method: FinancePaymentMethod;
  status: FinancePaymentStatus;
  gatewayId: string;
  amount: string;
  time: string;
  gateway: string;
  failureReason: string;
  reconciliation: FinanceReconciliationStatus;
  owner: string;
  note: string;
};
type FinanceCodCollection = {
  id: string;
  rider: string;
  phone: string;
  orders: number;
  collected: string;
  submitted: string;
  difference: string;
  status: FinanceCodStatus;
  settlementTime: string;
  proof: "Missing" | "Uploaded" | "Verified";
  owner: string;
  note: string;
};
type FinanceRefundItem = {
  id: string;
  orderId: string;
  customer: string;
  amount: string;
  method: RefundMethod;
  gatewayStatus: string;
  walletCredit: string;
  adjustment: string;
  status: FinanceRefundStatus;
  reconciliation: FinanceReconciliationStatus;
  transactionId: string;
  note: string;
};
type FinanceSettlement = {
  id: string;
  gateway: string;
  batchDate: string;
  expectedDate: string;
  gross: string;
  charges: string;
  deductions: string;
  net: string;
  received: string;
  difference: string;
  status: FinanceSettlementStatus;
  bankReference: string;
  note: string;
};
type FinanceExpense = {
  id: string;
  category: string;
  vendor: string;
  amount: string;
  method: FinancePaymentMethod;
  paidDate: string;
  dueDate: string;
  receipt: "Missing" | "Uploaded" | "Verified";
  status: FinanceExpenseStatus;
  note: string;
};
type FinanceInvoice = {
  id: string;
  reference: string;
  party: string;
  type: "Customer invoice" | "Supplier invoice" | "Refund credit note" | "Manual credit note";
  amount: string;
  tax: string;
  date: string;
  status: FinanceInvoiceStatus;
  downloadUrl: string;
  sentStatus: string;
  note: string;
};
type FinanceReportExport = {
  id: string;
  title: string;
  format: "CSV" | "PDF" | "XLSX";
  status: FinanceReportStatus;
  dateRange: string;
  owner: string;
};
type FinanceTaxSettings = {
  gstCollected: string;
  taxableSales: string;
  exemptSales: string;
  hsnSummary: string;
  invoiceCount: string;
  creditNoteCount: string;
  reviewOwner: string;
};
type AuditTab = "Overview" | "Activity Logs" | "Security Events" | "Data Changes" | "Admin Sessions" | "Exports" | "Risk Alerts" | "Settings";
type AuditDialog = "activity" | "security" | "change" | "session" | "export" | "risk" | null;
type AuditRiskLevel = "Low" | "Medium" | "High" | "Critical";
type AuditReviewStatus = "Open" | "Reviewed" | "Escalated" | "Owner review" | "Resolved";
type AuditActivityLog = {
  id: string;
  admin: string;
  email: string;
  role: string;
  module: string;
  action: string;
  target: string;
  timestamp: string;
  status: AuditReviewStatus;
  ip: string;
  device: string;
  location: string;
  risk: AuditRiskLevel;
  note: string;
};
type AuditSecurityEvent = {
  id: string;
  admin: string;
  email: string;
  eventType: string;
  result: "Success" | "Failed" | "Blocked" | "Required";
  timestamp: string;
  ip: string;
  device: string;
  browser: string;
  location: string;
  risk: AuditRiskLevel;
  status: AuditReviewStatus;
  note: string;
};
type AuditDataChange = {
  id: string;
  module: string;
  recordId: string;
  recordName: string;
  field: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  reason: string;
  timestamp: string;
  risk: AuditRiskLevel;
  approval: "Not required" | "Pending approval" | "Approved" | "Rejected";
  status: AuditReviewStatus;
  note: string;
};
type AuditSession = {
  id: string;
  admin: string;
  email: string;
  role: string;
  loginTime: string;
  lastActivity: string;
  ip: string;
  device: string;
  browser: string;
  location: string;
  status: "Active" | "Idle" | "Expired" | "Forced logout" | "Blocked" | "Trusted";
  twoFactor: "Verified" | "Pending" | "Failed";
  trusted: boolean;
  risk: AuditRiskLevel;
  note: string;
};
type AuditExport = {
  id: string;
  admin: string;
  email: string;
  exportType: string;
  module: string;
  format: "CSV" | "PDF" | "XLSX";
  dateRange: string;
  rows: string;
  status: "Ready" | "Downloaded" | "Revoked" | "Processing" | "Failed";
  downloadTime: string;
  ip: string;
  reason: string;
  review: AuditReviewStatus;
};
type AuditRiskAlert = {
  id: string;
  alertType: string;
  module: string;
  target: string;
  trigger: string;
  risk: AuditRiskLevel;
  admin: string;
  timestamp: string;
  status: AuditReviewStatus;
  ownerNote: string;
};
type AuditSettings = {
  retention: string;
  trackIp: boolean;
  trackLocation: boolean;
  trackDevice: boolean;
  trackBeforeAfter: boolean;
  requireReason: boolean;
  ownerApproval: boolean;
  highRiskAlerts: boolean;
  ownerOnlyExport: boolean;
  maskCustomerData: boolean;
  autoLockSuspicious: boolean;
  immutableSecurityEvents: boolean;
};
type ContentTab = "Overview" | "Homepage" | "Banners" | "Pages" | "Media Library" | "SEO" | "Announcements" | "Navigation" | "Content Schedule" | "Settings";
type ContentKind = "Homepage" | "Banner" | "Page" | "Media" | "SEO" | "Announcement" | "Navigation" | "Schedule";
type ContentStatus = "Draft" | "Live" | "Scheduled" | "Paused" | "Archived" | "Published" | "Hidden";
type ContentApproval = "Not required" | "Draft" | "Awaiting approval" | "Approved" | "Rejected";
type ContentItem = {
  id: string;
  type: ContentKind;
  title: string;
  subtitle: string;
  placement: string;
  image: string;
  mobileImage: string;
  ctaLabel: string;
  ctaUrl: string;
  coupon: string;
  background: string;
  textColor: string;
  slug: string;
  owner: string;
  audience: string;
  startDate: string;
  endDate: string;
  status: ContentStatus;
  order: number;
  views: number;
  clicks: number;
  conversions: number;
  seoScore: string;
  approval: ContentApproval;
  updated: string;
  body: string;
  altText: string;
  fileType: string;
  fileSize: string;
  dimensions: string;
  issue: string;
  preview: string;
  notes: string;
};
type ContentSettings = {
  requireApproval: boolean;
  requireAltText: boolean;
  autoArchiveExpired: boolean;
  ownerHeroApproval: boolean;
  seoBeforePublish: boolean;
  allowedFileTypes: string;
  maxUploadSize: string;
  defaultOgImage: string;
  brandTone: string;
  legalOwner: string;
  previewUrl: string;
  revalidationMode: string;
};
type AccountTab = "Overview" | "Profile" | "Security" | "Sessions" | "Permissions" | "Notifications" | "Preferences" | "Activity" | "Recovery";
type AdminAccountProfile = {
  fullName: string;
  displayName: string;
  email: string;
  phone: string;
  avatar: string;
  jobTitle: string;
  department: string;
  store: string;
  timezone: string;
  language: string;
  emergencyContact: string;
  internalNote: string;
  emailVerified: boolean;
  phoneVerified: boolean;
};
type AdminAccountSecurity = {
  twoFactorEnabled: boolean;
  twoFactorMethod: "Authenticator app" | "SMS" | "Email";
  backupCodes: string;
  trustedDevices: number;
  loginAlerts: boolean;
  passwordLastChanged: string;
  failedLogins: number;
  lockStatus: "Unlocked" | "Locked" | "Re-auth required";
  reauthRequired: boolean;
  securityNote: string;
};
type AdminAccountSession = {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  loginTime: string;
  lastActivity: string;
  twoFactor: "Verified" | "Pending" | "Failed";
  trusted: boolean;
  status: "Active" | "Idle" | "Expired" | "Logged out" | "Re-auth required" | "Trusted";
};
type AdminAccountPermission = {
  id: string;
  module: string;
  access: "Allowed" | "Restricted" | "Owner only" | "Request required";
  detail: string;
};
type AdminAccountNotificationPreference = {
  id: string;
  label: string;
  inApp: boolean;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  muted: boolean;
};
type AdminAccountPreferences = {
  theme: string;
  compactMode: boolean;
  defaultLanding: string;
  defaultModule: string;
  rowDensity: string;
  currency: string;
  dateFormat: string;
  language: string;
  timezone: string;
  pinnedModules: string;
  searchBehavior: string;
};
type AdminAccountActivity = {
  id: string;
  event: string;
  detail: string;
  time: string;
  risk: AuditRiskLevel;
  status: "Open" | "Reviewed" | "Reported";
};
type AdminAccountRecovery = {
  recoveryEmail: string;
  recoveryPhone: string;
  backupCodesStatus: string;
  emergencyOwner: string;
  recoveryQuestion: string;
  lastUpdated: string;
  lockStatus: "Open" | "Locked for 24 hours";
};
type ExpansionModuleKey = "reviews" | "loyalty" | "branches" | "legal";
type ExpansionRecord = {
  id: string;
  tab: string;
  title: string;
  subtitle: string;
  category: string;
  owner: string;
  status: string;
  risk: AuditRiskLevel;
  primaryMetric: string;
  secondaryMetric: string;
  linkedRecord: string;
  amount: string;
  updated: string;
  note: string;
  fields: { label: string; value: string }[];
};
type ExpansionCommand = {
  label: string;
  type: "create" | "tab" | "export";
  targetTab?: string;
  recordTitle?: string;
};
type ExpansionModuleConfig = {
  actions: string[];
  commands: ExpansionCommand[];
  createLabel: string;
  description: string;
  eyebrow: string;
  records: ExpansionRecord[];
  route: string;
  settings: { label: string; value: string }[];
  tabs: string[];
  title: string;
};

const reportMetrics: ReportMetric[] = [];

const reportRevenueSeries: ReportSeries[] = [];

const reportCategoryRows: string[][] = [];

const reportOrderRows: string[][] = [];

const reportInventoryRows: string[][] = [];

const reportCustomerRows: string[][] = [];

const reportDeliveryRows: string[][] = [];

const reportPromotionRows: string[][] = [];

const reportSupportRows: string[][] = [];

const reportFinanceRows: string[][] = [];

const reportInsights: ReportInsight[] = [];

const initialReportExports: ReportExport[] = [];

const initialRefundRequests: AdminRefundRequest[] = [];

const initialReturnPickups: AdminReturnPickup[] = [];

const initialRefundApprovalRules: RefundApprovalRule[] = [];

const defaultRefundSettings: RefundSettings = {
  autoApproveLimit: "Rs. 0",
  ownerApprovalLimit: "Rs. 0",
  evidencePolicy: "",
  walletCredit: false,
  returnPickupThreshold: "Rs. 0",
  financeSla: "",
  customerMessageChannel: "WhatsApp"
};

const initialFinancePayments: FinancePayment[] = [];

const initialFinanceCodCollections: FinanceCodCollection[] = [];

const initialFinanceRefunds: FinanceRefundItem[] = [];

const initialFinanceSettlements: FinanceSettlement[] = [];

const initialFinanceExpenses: FinanceExpense[] = [];

const initialFinanceInvoices: FinanceInvoice[] = [];

const initialFinanceReports: FinanceReportExport[] = [];

const initialFinanceTaxSettings: FinanceTaxSettings = {
  gstCollected: "Rs. 0",
  taxableSales: "Rs. 0",
  exemptSales: "Rs. 0",
  hsnSummary: "",
  invoiceCount: "0",
  creditNoteCount: "0",
  reviewOwner: ""
};

const initialAuditActivityLogs: AuditActivityLog[] = [];

const initialAuditSecurityEvents: AuditSecurityEvent[] = [];

const initialAuditDataChanges: AuditDataChange[] = [];

const initialAuditSessions: AuditSession[] = [];

const initialAuditExports: AuditExport[] = [];

const initialAuditRiskAlerts: AuditRiskAlert[] = [];

const defaultAuditSettings: AuditSettings = {
  retention: "365 days",
  trackIp: true,
  trackLocation: true,
  trackDevice: true,
  trackBeforeAfter: true,
  requireReason: true,
  ownerApproval: true,
  highRiskAlerts: true,
  ownerOnlyExport: true,
  maskCustomerData: true,
  autoLockSuspicious: true,
  immutableSecurityEvents: true
};

const initialContentItems: ContentItem[] = [];

const defaultContentSettings: ContentSettings = {
  requireApproval: true,
  requireAltText: true,
  autoArchiveExpired: true,
  ownerHeroApproval: true,
  seoBeforePublish: true,
  allowedFileTypes: "JPG, PNG, WEBP, PDF",
  maxUploadSize: "5 MB",
  defaultOgImage: "/images/og/default.jpg",
  brandTone: "Premium, friendly, clear, grocery-focused",
  legalOwner: "Owner",
  previewUrl: process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3002",
  revalidationMode: "Manual now, automatic after backend"
};

const defaultAccountProfile: AdminAccountProfile = {
  fullName: "FreshCart Owner",
  displayName: "Owner",
  email: "owner@freshcart.local",
  phone: "",
  avatar: "FC",
  jobTitle: "Store Owner",
  department: "Operations",
  store: "FreshCart Mumbai",
  timezone: "Asia/Kolkata",
  language: "English",
  emergencyContact: "+91 90000 11111",
  internalNote: "Primary owner account with full approval access.",
  emailVerified: true,
  phoneVerified: true
};

const defaultAccountSecurity: AdminAccountSecurity = {
  twoFactorEnabled: true,
  twoFactorMethod: "Authenticator app",
  backupCodes: "8 unused",
  trustedDevices: 2,
  loginAlerts: true,
  passwordLastChanged: "12 days ago",
  failedLogins: 0,
  lockStatus: "Unlocked",
  reauthRequired: false,
  securityNote: "Owner account is healthy."
};

const initialAccountSessions: AdminAccountSession[] = [];

const initialAccountPermissions: AdminAccountPermission[] = [];

const initialAccountNotifications: AdminAccountNotificationPreference[] = [];

const defaultAccountPreferences: AdminAccountPreferences = {
  theme: "System",
  compactMode: false,
  defaultLanding: "/dashboard",
  defaultModule: "Dashboard",
  rowDensity: "Comfortable",
  currency: "INR",
  dateFormat: "DD MMM YYYY, h:mm A",
  language: "English",
  timezone: "Asia/Kolkata",
  pinnedModules: "Dashboard, Orders, Finance, Audit Logs",
  searchBehavior: "Open first exact match"
};

const initialAccountActivity: AdminAccountActivity[] = [];

const defaultAccountRecovery: AdminAccountRecovery = {
  recoveryEmail: "jerin.recovery@example.com",
  recoveryPhone: "+91 90000 22222",
  backupCodesStatus: "8 unused",
  emergencyOwner: "FreshCart Owner Desk",
  recoveryQuestion: "Stored in owner password manager",
  lastUpdated: "Sep 18",
  lockStatus: "Open"
};

const expansionModules: Record<ExpansionModuleKey, ExpansionModuleConfig> = {
  reviews: {
    eyebrow: "Customer trust",
    title: "Reviews and ratings",
    route: "/reviews",
    description: "Moderate grocery product reviews, reported reviews, store replies, rating analytics, and review rules.",
    tabs: ["Overview", "Review Queue", "Product Reviews", "Reported Reviews", "Store Replies", "Rating Analytics", "Moderation Rules", "Review Settings"],
    actions: ["Approve", "Reject", "Hide", "Feature", "Reply", "Escalate", "Export"],
    commands: [
      { label: "New moderation rule", type: "create", targetTab: "Moderation Rules", recordTitle: "New review moderation rule" },
      { label: "Moderation queue", type: "tab", targetTab: "Review Queue" },
      { label: "Reported reviews", type: "tab", targetTab: "Reported Reviews" },
      { label: "Export reviews", type: "export", targetTab: "Rating Analytics", recordTitle: "Reviews export" }
    ],
    createLabel: "Create moderation rule",
    settings: [
      { label: "Auto-publish verified 5 star reviews", value: "Off" },
      { label: "Low rating support ticket threshold", value: "2 stars or below" },
      { label: "Photo review moderation", value: "Required" },
      { label: "Review export owner approval", value: "Required" }
    ],
    records: []
  },
  loyalty: {
    eyebrow: "Retention",
    title: "Loyalty and wallet",
    route: "/loyalty",
    description: "Manage wallet balances, loyalty tiers, points, manual adjustments, cashback rules, and customer reward audit trails.",
    tabs: ["Overview", "Customer Wallets", "Loyalty Tiers", "Point Rules", "Manual Adjustments", "Cashback", "Expiry", "Ledger"],
    actions: ["Credit", "Debit", "Approve", "Reject", "Export", "Open customer"],
    commands: [
      { label: "New loyalty rule", type: "create", targetTab: "Point Rules", recordTitle: "New loyalty rule" },
      { label: "Wallet ledger", type: "tab", targetTab: "Ledger" },
      { label: "Manual adjustments", type: "tab", targetTab: "Manual Adjustments" },
      { label: "Export wallet ledger", type: "export", targetTab: "Ledger", recordTitle: "Wallet export" }
    ],
    createLabel: "Create loyalty rule",
    settings: [
      { label: "Manual wallet credit approval", value: "Owner required" },
      { label: "Points expiry notice", value: "30 days before expiry" },
      { label: "Cashback settlement", value: "After delivered order" }
    ],
    records: []
  },
  branches: {
    eyebrow: "Store network",
    title: "Store locations and branches",
    route: "/branches",
    description: "Manage branch addresses, service areas, delivery slots, staff, riders, hours, capacity, and branch inventory visibility.",
    tabs: ["Overview", "Branches", "Service Areas", "Delivery Slots", "Branch Inventory", "Staff", "Riders", "Performance"],
    actions: ["Create branch", "Edit", "Pause", "Open map", "Export"],
    commands: [
      { label: "New branch", type: "create", targetTab: "Branches", recordTitle: "New branch" },
      { label: "Service areas", type: "tab", targetTab: "Service Areas" },
      { label: "Delivery slots", type: "tab", targetTab: "Delivery Slots" },
      { label: "Export branches", type: "export", targetTab: "Performance", recordTitle: "Branches export" }
    ],
    createLabel: "Create branch",
    settings: [
      { label: "Serviceability source", value: "Branch service areas" },
      { label: "Slot capacity", value: "Configured per branch" },
      { label: "Map provider", value: "Mapbox" }
    ],
    records: []
  },
  legal: {
    eyebrow: "Compliance",
    title: "Legal and compliance",
    route: "/legal",
    description: "Manage legal policies, consent records, data requests, compliance tasks, and customer-facing policy publishing.",
    tabs: ["Overview", "Policies", "Consent", "Data Requests", "Compliance Tasks", "Approvals", "History", "Settings"],
    actions: ["Create policy", "Publish", "Review", "Export"],
    commands: [
      { label: "New policy", type: "create", targetTab: "Policies", recordTitle: "New policy" },
      { label: "Data requests", type: "tab", targetTab: "Data Requests" },
      { label: "Approvals", type: "tab", targetTab: "Approvals" },
      { label: "Export compliance", type: "export", targetTab: "History", recordTitle: "Compliance export" }
    ],
    createLabel: "Create policy",
    settings: [
      { label: "Policy publishing", value: "Owner approval required" },
      { label: "Data request SLA", value: "Configured by legal team" },
      { label: "Consent history", value: "Stored in database" }
    ],
    records: []
  }
};

const defaultStoreSettings: StoreSettings = {
  name: "FreshCart",
  email: "owner@freshcart.local",
  phone: "",
  gst: "27AAFCF2026G1Z5",
  address: "Bandra West, Mumbai",
  city: "Mumbai",
  status: "Open",
  logo: "FC"
};

const defaultDeliverySettings: DeliverySettings = {
  zones: ["Bandra", "Andheri", "Juhu"],
  fee: "Rs. 39",
  freeThreshold: "Rs. 999",
  minimumOrder: "Rs. 299",
  slots: "8 AM - 11 PM, 2 hour slots",
  express: true,
  assignment: "Nearest available rider",
  radius: "8 km",
  mapProvider: "Mapbox"
};

const defaultPaymentSettings: PaymentSettings = {
  cod: true,
  online: true,
  provider: "Razorpay",
  upi: "freshcart@upi",
  refundRule: "Refund within 3-5 business days",
  codLimit: "Rs. 2,500",
  retryRule: "Retry failed payment after 10 minutes"
};

const defaultCheckoutSettings: CheckoutSettings = {
  tax: "GST inclusive with item slabs",
  packagingFee: "Rs. 12",
  handlingFee: "Rs. 8",
  substitutions: true,
  addressValidation: "Required before payment",
  couponStacking: false,
  wallet: true
};

const defaultNotificationSettings: NotificationSettings = {
  whatsapp: "WhatsApp Business API",
  sms: "MSG91",
  email: "Resend",
  push: "Firebase Cloud Messaging",
  adminAlerts: true,
  customerOrderUpdates: true,
  marketingOptIn: true
};

const defaultSupportSettings: SupportSettings = {
  workingHours: "8 AM - 11 PM",
  autoAssignment: true,
  escalationRule: "Escalate after 20 minutes",
  sla: "First response under 5 minutes",
  refundHandling: "Manager approval above Rs. 1,000",
  whatsapp: "",
  inbox: "support@freshcart.local"
};

const defaultSecuritySettings: SecuritySettings = {
  ownerTwoFactor: true,
  staffTwoFactor: true,
  sessionTimeout: "30 minutes",
  deviceTracking: true,
  lockout: "5 failed attempts",
  roleDefaults: "Least privilege",
  auditRetention: "365 days"
};

const defaultLegalSettings: LegalSettings = {
  gst: "27AAFCF2026G1Z5",
  invoicePrefix: "FC-2026",
  taxSlabs: "0%, 5%, 12%, 18%",
  license: "FSSAI registered license",
  privacyUrl: "/privacy",
  termsUrl: "/terms",
  refundUrl: "/refund-policy"
};

const defaultInventoryPolicySettings: InventoryPolicySettings = {
  lowStock: "12 units",
  expiryDays: "7 days",
  batchTracking: true,
  supplierApproval: true,
  autoReorder: false,
  reservationTimeout: "15 minutes"
};

const initialSettingsAudit: SettingsAudit[] = [];

const initialStaff: AdminStaff[] = [];

const initialStaffRoles: StaffRoleCard[] = [];

const initialStaffShifts: StaffShift[] = [];

const initialStaffActivity: StaffActivity[] = [];

const initialNotifications: AdminNotification[] = [];

const notificationTemplates: NotificationTemplate[] = [];

const initialFailures: NotificationFailure[] = [];

const initialAutomationRules: AutomationRule[] = [];

const initialCoupons: AdminCoupon[] = [];

const initialPromotionBanners: PromotionBanner[] = [];

const customers: AdminCustomer[] = [];

const adminCategories: AdminCategory[] = [];
const categoryProductMappings: CategoryProductMapping[] = [];
const categoryOffers: CategoryOffer[] = [];

const adminSuppliers: AdminSupplier[] = [];

const supplierPurchaseOrders: SupplierPurchaseOrder[] = [];

const supplierPayments: SupplierPayment[] = [];

const adminPromotions: AdminPromotion[] = [];

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Products", href: "/products", icon: "products" },
  { label: "Categories", href: "/categories", icon: "categories" },
  { label: "Orders", href: "/orders", icon: "orders" },
  { label: "Inventory", href: "/inventory", icon: "inventory" },
  { label: "Suppliers", href: "/suppliers", icon: "suppliers" },
  { label: "Delivery", href: "/delivery", icon: "delivery" },
  { label: "Support", href: "/support", icon: "support" },
  { label: "Customers", href: "/customers", icon: "customers" },
  { label: "Coupons", href: "/coupons", icon: "coupons" },
  { label: "Promotions", href: "/promotions", icon: "promotions" },
  { label: "Refunds", href: "/refunds", icon: "refunds" },
  { label: "Finance", href: "/finance", icon: "finance" },
  { label: "Audit Logs", href: "/audit-logs", icon: "audit" },
  { label: "Content", href: "/content", icon: "content" },
  { label: "Account", href: "/account", icon: "account" },
  { label: "Reviews", href: "/reviews", icon: "reviews" },
  { label: "Loyalty", href: "/loyalty", icon: "loyalty" },
  { label: "Branches", href: "/branches", icon: "branches" },
  { label: "Legal", href: "/legal", icon: "legal" },
  { label: "Notifications", href: "/notifications", icon: "notifications" },
  { label: "Staff", href: "/staff", icon: "staff" },
  { label: "Reports", href: "/reports", icon: "reports" },
  { label: "Settings", href: "/settings", icon: "settings" }
];

function normalizeSearch(value: string) {
  return value.toLowerCase().trim();
}

function parseCurrencyAmount(value: string) {
  const amount = Number.parseFloat(value.match(/\d+(?:\.\d+)?/)?.[0] || "0");
  if (!Number.isFinite(amount)) return 0;
  if (value.includes("L")) return amount * 100000;
  if (value.includes("K")) return amount * 1000;
  return amount;
}

function formatCurrencyAmount(value: number) {
  if (value >= 100000) return `Rs. ${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `Rs. ${Math.round(value / 1000)}K`;
  return `Rs. ${value}`;
}

function createSearchResult(title: string, meta: string, href: string, group: string): AdminSearchResult {
  return {
    title,
    meta,
    href,
    group,
    tokens: normalizeSearch(`${title} ${meta} ${group} ${href}`)
  };
}

const adminSearchIndex: AdminSearchResult[] = [
  ...navItems.map((item) => createSearchResult(item.label, `${getTitle(item.href.slice(1) as AdminView)} module`, item.href, "Module"))
];

export function AdminConsole({ view }: { view: AdminView }) {
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedSearchQuery = normalizeSearch(searchQuery);
  const searchResults = useMemo(() => {
    if (!normalizedSearchQuery) {
      return [];
    }
    return adminSearchIndex.filter((item) => item.tokens.includes(normalizedSearchQuery)).slice(0, 8);
  }, [normalizedSearchQuery]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const exactModule = navItems.find((item) => normalizeSearch(item.label) === normalizedSearchQuery);
    const target = searchResults[0] || (exactModule ? createSearchResult(exactModule.label, "Module", exactModule.href, "Module") : null);
    if (target) {
      window.location.href = target.href;
    }
  }

  return (
    <main className="admin-app">
      <aside className="sidebar">
        <a className="admin-brand" href="/dashboard">
          <span>FC</span>
          <div>
            <strong>FreshCart</strong>
            <small>Operations</small>
          </div>
        </a>
        <nav>
          {navItems.map(({ label, href, icon }) => (
            <a className={href.includes(view) ? "active" : ""} href={href} key={label}>
              <span className="nav-icon">
                <NavIcon name={icon} />
              </span>
              <span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-status">
          <span>Live store</span>
          <strong>Same-day grocery ops</strong>
          <small>Orders, stock, delivery and support are connected.</small>
        </div>
      </aside>

      <section className="workspace">
        <header className="admin-topbar">
          <div>
            <span>{view}</span>
            <h1>{getTitle(view)}</h1>
          </div>
          <form className="admin-search" onSubmit={submitSearch}>
            <label>
              <span>Search</span>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Order, customer, product, conversation"
              />
            </label>
            {normalizedSearchQuery ? (
              <div className="admin-search-results">
                {searchResults.length ? (
                  searchResults.map((result) => (
                    <a href={result.href} key={`${result.group}-${result.title}-${result.meta}`}>
                      <span>{result.group}</span>
                      <strong>{result.title}</strong>
                      <small>{result.meta}</small>
                    </a>
                  ))
                ) : (
                  <p>No admin route found for “{searchQuery}”.</p>
                )}
              </div>
            ) : null}
          </form>
          <a className="admin-profile" href="/account">
            <strong>Owner</strong>
            <span>2FA active</span>
          </a>
        </header>

        {view === "dashboard" ? <DashboardView /> : null}
        {view === "products" ? <ProductsView /> : null}
        {view === "categories" ? <CategoriesView /> : null}
        {view === "orders" ? <OrdersView /> : null}
        {view === "inventory" ? <InventoryView /> : null}
        {view === "suppliers" ? <SuppliersView /> : null}
        {view === "delivery" ? <DeliveryView /> : null}
        {view === "support" ? <SupportView /> : null}
        {view === "customers" ? <CustomersView /> : null}
        {view === "coupons" ? <CouponsView /> : null}
        {view === "promotions" ? <PromotionsView /> : null}
        {view === "refunds" ? <RefundsView /> : null}
        {view === "finance" ? <FinanceView /> : null}
        {view === "audit-logs" ? <AuditLogsView /> : null}
        {view === "content" ? <ContentManagerView /> : null}
        {view === "account" ? <AdminAccountView /> : null}
        {view === "reviews" ? <ExpansionModuleView moduleKey="reviews" /> : null}
        {view === "loyalty" ? <ExpansionModuleView moduleKey="loyalty" /> : null}
        {view === "branches" ? <ExpansionModuleView moduleKey="branches" /> : null}
        {view === "legal" ? <ExpansionModuleView moduleKey="legal" /> : null}
        {view === "notifications" ? <NotificationsView /> : null}
        {view === "staff" ? <StaffView /> : null}
        {view === "reports" ? <ReportsView /> : null}
        {view === "settings" ? <SettingsView /> : null}
      </section>
    </main>
  );
}

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    dashboard: (
      <>
        <path d="M4 5.5h6v6H4z" />
        <path d="M14 5.5h6v4h-6z" />
        <path d="M14 13.5h6v5h-6z" />
        <path d="M4 15.5h6v3H4z" />
      </>
    ),
    products: (
      <>
        <path d="M5 8.5 12 4l7 4.5v7L12 20l-7-4.5z" />
        <path d="m5 8.5 7 4.5 7-4.5" />
        <path d="M12 13v7" />
      </>
    ),
    categories: (
      <>
        <path d="M4 5h7v7H4z" />
        <path d="M13 5h7v7h-7z" />
        <path d="M4 14h7v5H4z" />
        <path d="M13 14h7v5h-7z" />
      </>
    ),
    orders: (
      <>
        <path d="M7 4h10l1 16H6z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </>
    ),
    inventory: (
      <>
        <path d="M4 7h16" />
        <path d="M6 7v12h12V7" />
        <path d="M8 4h8l2 3H6z" />
        <path d="M9 12h6" />
      </>
    ),
    suppliers: (
      <>
        <path d="M4 7h10v9H4z" />
        <path d="M14 9h3l3 3v4h-6z" />
        <path d="M7 7V5h5v2" />
        <circle cx="8" cy="18" r="1.4" />
        <circle cx="17" cy="18" r="1.4" />
      </>
    ),
    delivery: (
      <>
        <path d="M4 7h10v9H4z" />
        <path d="M14 10h3l3 3v3h-6z" />
        <circle cx="8" cy="18" r="1.5" />
        <circle cx="17" cy="18" r="1.5" />
      </>
    ),
    support: (
      <>
        <path d="M5 11a7 7 0 0 1 14 0v4" />
        <path d="M5 15h3v-4H5z" />
        <path d="M16 15h3v-4h-3z" />
        <path d="M13 19h2a4 4 0 0 0 4-4" />
      </>
    ),
    customers: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
        <path d="M15 7.5a2.5 2.5 0 0 1 0 5" />
        <path d="M16.5 15a4.5 4.5 0 0 1 4 4" />
      </>
    ),
    coupons: (
      <>
        <path d="M4 8a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v8a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2z" />
        <path d="M9 15 15 9" />
        <circle cx="9" cy="9" r="1" />
        <circle cx="15" cy="15" r="1" />
      </>
    ),
    promotions: (
      <>
        <path d="M4 10h4l9-4v12l-9-4H4z" />
        <path d="M8 14v4" />
        <path d="M18 9.5h2" />
        <path d="M18 14.5h2" />
      </>
    ),
    refunds: (
      <>
        <path d="M7 7h10a4 4 0 0 1 0 8H8" />
        <path d="m8 11-4 4 4 4" />
        <path d="M12 10h3" />
        <path d="M12 13h2" />
      </>
    ),
    finance: (
      <>
        <path d="M5 6h14v12H5z" />
        <path d="M8 10h8" />
        <path d="M8 14h3" />
        <path d="M15 14h1" />
        <path d="M7 6V4h10v2" />
      </>
    ),
    audit: (
      <>
        <path d="M6 4h9l3 3v13H6z" />
        <path d="M15 4v4h4" />
        <path d="M9 11h6" />
        <path d="M9 15h4" />
        <path d="M8 19l2-2 2 2 4-5" />
      </>
    ),
    content: (
      <>
        <path d="M5 5h14v14H5z" />
        <path d="M8 9h8" />
        <path d="M8 13h5" />
        <path d="M15 13h1" />
        <path d="M8 17h8" />
      </>
    ),
    account: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20a7 7 0 0 1 14 0" />
        <path d="M17 5l2 2" />
        <path d="M19 5l-2 2" />
      </>
    ),
    reviews: (
      <>
        <path d="M5 5h14v10H8l-3 3z" />
        <path d="m9 10 2 2 4-4" />
      </>
    ),
    loyalty: (
      <>
        <path d="M6 8h12v10H6z" />
        <path d="M8 8a4 4 0 0 1 8 0" />
        <path d="M9 13h6" />
      </>
    ),
    branches: (
      <>
        <path d="M4 20h16" />
        <path d="M6 20V8l6-4 6 4v12" />
        <path d="M9 20v-5h6v5" />
      </>
    ),
    legal: (
      <>
        <path d="M12 3v18" />
        <path d="M5 7h14" />
        <path d="M7 7 4 14h6z" />
        <path d="M17 7l-3 7h6z" />
      </>
    ),
    notifications: (
      <>
        <path d="M7 10a5 5 0 0 1 10 0v4l2 3H5l2-3z" />
        <path d="M10 20h4" />
      </>
    ),
    staff: (
      <>
        <circle cx="12" cy="7" r="3" />
        <path d="M5 20a7 7 0 0 1 14 0" />
        <path d="M18 5l2 2" />
      </>
    ),
    reports: (
      <>
        <path d="M5 19V5" />
        <path d="M5 19h14" />
        <path d="M8.5 16v-4" />
        <path d="M12 16V8" />
        <path d="M15.5 16v-6" />
        <path d="m7 7 3 2 3-3 4 2" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v3" />
        <path d="M12 18v3" />
        <path d="m4.8 4.8 2.1 2.1" />
        <path d="m17.1 17.1 2.1 2.1" />
        <path d="M3 12h3" />
        <path d="M18 12h3" />
        <path d="m4.8 19.2 2.1-2.1" />
        <path d="m17.1 6.9 2.1-2.1" />
      </>
    )
  };

  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        {paths[name]}
      </g>
    </svg>
  );
}

function DashboardView() {
  const metricIcons = ["Rs", "#", "!", "CS", "COD", "%"];
  const [dashboardOrders] = usePersistentState<AdminOrder[]>("orders:queue", []);
  const [dashboardInventory] = usePersistentState<AdminInventoryItem[]>("inventory:stock-items", []);
  const [dashboardDeliveries] = usePersistentState<AdminDelivery[]>("delivery:queue", []);
  const [dashboardSupport] = usePersistentState<AdminSupportTicket[]>("support:queue", []);
  const dashboardMetrics = useMemo(() => {
    const revenue = dashboardOrders.reduce((total, order) => total + Number(String(order.total).replace(/[^\d.]/g, "") || 0), 0);
    const activeOrders = dashboardOrders.filter((order) => order.status !== "Delivered" && order.status !== "Cancelled").length;
    const lowStock = dashboardInventory.filter((item) => item.status !== "In stock").length;
    const openSupport = dashboardSupport.filter((item) => item.state !== "Resolved").length;
    const codDue = dashboardOrders
      .filter((order) => order.payment.toLowerCase().includes("cod"))
      .reduce((total, order) => total + Number(String(order.total).replace(/[^\d.]/g, "") || 0), 0);
    const activeDeliveries = dashboardDeliveries.filter((delivery) => delivery.status !== "Delivered").length;

    return [
      { label: "Today revenue", value: `Rs. ${revenue.toLocaleString("en-IN")}`, detail: "From real order records" },
      { label: "Today orders", value: dashboardOrders.length, detail: `${activeOrders} still active` },
      { label: "Low stock", value: lowStock, detail: "From inventory records" },
      { label: "Open support", value: openSupport, detail: `${dashboardSupport.filter((item) => item.agent === "Unassigned").length} unassigned` },
      { label: "COD due", value: `Rs. ${codDue.toLocaleString("en-IN")}`, detail: `${activeDeliveries} active deliveries` },
      { label: "Slot capacity", value: dashboardDeliveries.length ? "Live" : "No slots", detail: "From delivery assignments" }
    ];
  }, [dashboardDeliveries, dashboardInventory, dashboardOrders, dashboardSupport]);

  return (
    <>
      <section className="dashboard-overview">
        <div>
          <span>Live operations</span>
          <h2>Today&apos;s store health</h2>
          <p>Track revenue, active orders, delivery capacity, inventory alerts, and support load from one control center.</p>
        </div>
        <div className="overview-pills">
          <a href="/orders">{dashboardOrders.filter((order) => order.status !== "Delivered" && order.status !== "Cancelled").length} active orders</a>
          <a href="/delivery">{dashboardDeliveries.length} delivery assignments</a>
          <a href="/support">{dashboardSupport.filter((item) => item.state !== "Resolved").length} support tickets</a>
        </div>
      </section>
      <section className="metric-grid">
        {dashboardMetrics.map((metric, index) => (
          <article className="metric-card" key={metric.label}>
            <div className="metric-card-head">
              <span>{metric.label}</span>
              <em>{metricIcons[index]}</em>
            </div>
            <strong>{metric.value}</strong>
            <p>{metric.detail}</p>
          </article>
        ))}
      </section>
      <section className="dashboard-grid">
        <Panel title="Active order queue" eyebrow="Orders" action="View all" actionHref="/orders">
          <OrdersTable compact items={dashboardOrders} />
        </Panel>
        <Panel title="Critical actions" eyebrow="Product and stock" action="Open products" actionHref="/products">
          <div className="action-stack">
            <a className="action-link" href="/products">Add product</a>
            <a className="action-link" href="/inventory">Create stock adjustment</a>
            <a className="action-link" href="/inventory">Add purchase entry</a>
            <a className="action-link" href="/delivery">Assign delivery staff</a>
          </div>
        </Panel>
      </section>
      <section className="three-grid">
        <InventoryList items={dashboardInventory} />
        <DeliveryMap />
        <SupportList items={dashboardSupport} />
      </section>
    </>
  );
}

function ProductsView() {
  const [catalog, setCatalog] = usePersistentState<AdminProduct[]>("products:catalog", products);
  const [categoryOptions, setCategoryOptions] = useState<AdminCategory[]>([]);
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<ProductDialog>(null);
  const [draft, setDraft] = useState<AdminProduct>(emptyAdminProduct);
  const [notice, setNotice] = useState("Products control center is active.");
  const productTags = ["Images", "Pricing", "Categories", "Badges"];

  useEffect(() => {
    let active = true;
    Promise.all([
      adminApi<{ products: AdminProduct[] }>("products"),
      adminApi<{ categories: AdminCategory[] }>("categories")
    ])
      .then(([{ products: apiProducts }, { categories }]) => {
        if (!active) return;
        setCatalog(apiProducts);
        setCategoryOptions(categories);
        setDraft(apiProducts[0] ?? emptyAdminProduct);
        setNotice("Products loaded from backend API.");
      })
      .catch((error) => {
        if (active) setNotice(`Products API unavailable: ${error instanceof Error ? error.message : "backend request failed"}`);
      });
    return () => {
      active = false;
    };
  }, []);

  const productStats = useMemo(
    () => [
      { label: "Active products", value: catalog.filter((product) => product.status === "Active").length, detail: "Ready for customers" },
      { label: "Low stock", value: catalog.filter((product) => product.stock === "Low stock").length, detail: "Needs replenishment" },
      { label: "Paused items", value: catalog.filter((product) => product.status === "Paused").length, detail: "Hidden from storefront" }
    ],
    [catalog]
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return catalog;
    }

    return catalog.filter((product) =>
      [product.name, product.sku, product.category, product.status, product.stock, product.badge]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [catalog, query]);

  function openAddProduct() {
    const firstCategory = categoryOptions[0];
    setDraft({
      name: "",
      sku: `NEW-${catalog.length + 1}`.padEnd(9, "0"),
      category: firstCategory?.name ?? "",
      categorySlug: firstCategory?.slug ?? "",
      price: "Rs. ",
      sale: "-",
      stock: "In stock",
      status: "Active",
      badge: "New",
      imageFile: ""
    });
    setDialog("add");
  }

  function openEditProduct(product: AdminProduct) {
    setDraft(product);
    setDialog("edit");
  }

  function openStockUpdate(product: AdminProduct) {
    setDraft(product);
    setDialog("stock");
  }

  function runBulkStatusUpdate() {
    setDialog("bulk");
  }

  function openImageUpload(product: AdminProduct) {
    setDraft(product);
    setDialog("upload");
  }

  function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    void (async () => {
      try {
        if (dialog === "add") {
          const { product } = await adminApi<{ product: AdminProduct }>("products", {
            method: "POST",
            body: JSON.stringify(draft)
          });
          setCatalog((items) => [product, ...items]);
          setDraft(product);
          setNotice(`${product.name || "New product"} was added through the backend API.`);
        }

        if (dialog === "edit") {
          const { product } = await adminApi<{ product: AdminProduct }>(`products/${draft.id ?? draft.slug ?? draft.sku}`, {
            method: "PATCH",
            body: JSON.stringify(draft)
          });
          setCatalog((items) => items.map((item) => (item.sku === product.sku ? product : item)));
          setDraft(product);
          setNotice(`${product.name} was updated in the backend.`);
        }

        if (dialog === "stock" || dialog === "upload") {
          const { product } = await adminApi<{ product: AdminProduct }>(`products/${draft.id ?? draft.slug ?? draft.sku}`, {
            method: "PATCH",
            body: JSON.stringify(draft)
          });
          setCatalog((items) => items.map((item) => (item.sku === product.sku ? product : item)));
          setDraft(product);
          setNotice(dialog === "stock" ? `${product.name} stock and status were updated in backend.` : `${product.name} image reference saved.`);
        }

        if (dialog === "bulk") {
          const targetStatus = String(formData.get("targetStatus") || "Active");
          const targetStock = String(formData.get("targetStock") || "Keep current");
          const scope = String(formData.get("scope") || "visible");
          const reason = String(formData.get("reason") || "Bulk operational update").trim();
          const visibleSkus = new Set(filteredProducts.map((product) => product.sku));
          const targetSkus = catalog
            .filter((product) =>
              scope === "all" ||
              (scope === "visible" && visibleSkus.has(product.sku)) ||
              (scope === "paused" && product.status === "Paused") ||
              (scope === "low-stock" && product.stock === "Low stock") ||
              (scope === "out-of-stock" && product.stock === "Out of stock")
            )
            .map((product) => product.sku);
          if (targetSkus.length === 0) {
            setNotice("No products match this bulk update scope. Change the scope or search filter first.");
            return;
          }
          const { updated } = await adminApi<{ updated: number }>("products/bulk/status", {
            method: "PATCH",
            body: JSON.stringify({ skus: targetSkus, status: targetStatus, stock: targetStock, reason })
          });
          const refreshed = await adminApi<{ products: AdminProduct[] }>("products");
          setCatalog(refreshed.products);
          setNotice(`${updated} products updated in backend. Status: ${targetStatus}. Stock: ${targetStock}.`);
        }

        setDialog(null);
      } catch (error) {
        setNotice(`Product save failed: ${error instanceof Error ? error.message : "backend request failed"}`);
      }
    })();
  }

  return (
    <>
      {notice ? <div className="admin-notice">{notice}</div> : null}
      <section className="product-command">
        <div className="product-command-copy">
          <span>Catalog control</span>
          <h2>Product management</h2>
          <p>Manage grocery items, pricing, categories, badges, images, availability, and stock handoff from one focused workspace.</p>
          <div className="product-command-tags">
            {productTags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
        <div className="product-command-actions">
          <button className="primary-action" type="button" onClick={openAddProduct}>Add product</button>
          <button type="button" onClick={runBulkStatusUpdate}>Bulk availability</button>
          <a href="/categories">Open categories</a>
        </div>
      </section>
      <section className="product-stat-grid">
        {productStats.map((stat) => (
          <article key={stat.label}>
            <div>
              <span>{stat.label}</span>
              <small>{stat.detail}</small>
            </div>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>
      <ProductCatalogTable
        items={filteredProducts}
        query={query}
        onEdit={openEditProduct}
        onImage={openImageUpload}
        onQueryChange={setQuery}
        onStock={openStockUpdate}
      />
      {dialog ? (
        <ProductDialogModal
          dialog={dialog}
          draft={draft}
          filteredCount={filteredProducts.length}
          products={catalog}
          visibleProducts={filteredProducts}
          categories={categoryOptions}
          onClose={() => setDialog(null)}
          onDraftChange={setDraft}
          onSubmit={saveProduct}
        />
      ) : null}
    </>
  );
}

function CategoriesView() {
  const [items, setItems] = usePersistentState<AdminCategory[]>("categories:items", adminCategories);
  const [mappings, setMappings] = usePersistentState<CategoryProductMapping[]>("categories:mappings", categoryProductMappings);
  const [offers, setOffers] = usePersistentState<CategoryOffer[]>("categories:offers", categoryOffers);
  const [activeTab, setActiveTab] = useState<CategoryTab>("Overview");
  const [dialog, setDialog] = useState<CategoryDialog>(null);
  const [selectedCategory, setSelectedCategory] = useState<AdminCategory>(emptyAdminCategory);
  const [notice, setNotice] = useState("Categories control center is active.");
  const categoryTabs: CategoryTab[] = ["Overview", "Directory", "Subcategories", "Homepage Order", "Product Mapping", "Offers", "SEO"];
  const stats = [
    { label: "Categories", value: items.length, detail: "Storefront groups" },
    { label: "Featured", value: items.filter((item) => item.featured).length, detail: "Homepage category row" },
    { label: "Active", value: items.filter((item) => item.status === "Active").length, detail: "Visible to customers" },
    { label: "Products", value: items.reduce((total, item) => total + item.products, 0), detail: "Mapped to categories" },
    { label: "Offers", value: offers.filter((offer) => offer.status === "Live").length, detail: "Live category campaigns" },
    { label: "Out of stock", value: items.reduce((total, item) => total + item.outOfStock, 0), detail: "Needs product action" }
  ];

  useEffect(() => {
    let active = true;
    adminApi<{ categories: AdminCategory[] }>("categories")
      .then(({ categories }) => {
        if (!active) return;
        setItems(categories);
        setSelectedCategory(categories[0] ?? emptyAdminCategory);
        setNotice("Categories loaded from backend API.");
      })
      .catch((error) => {
        if (active) setNotice(`Categories API unavailable: ${error instanceof Error ? error.message : "backend request failed"}`);
      });
    return () => {
      active = false;
    };
  }, [setItems]);

  useEffect(() => {
    publishStorefrontPatch({ categories: categoriesToStorefront(items) });
  }, [items]);

  function slugify(value: string) {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function openCategoryDialog(nextDialog: CategoryDialog, category = selectedCategory) {
    setSelectedCategory(category);
    setDialog(nextDialog);
    if (nextDialog === "profile") {
      setNotice(`${category.name} storefront impact opened.`);
    }
  }

  function openStat(label: string, value: string | number) {
    if (label === "Featured") {
      setActiveTab("Homepage Order");
    } else if (label === "Products" || label === "Out of stock") {
      setActiveTab("Product Mapping");
    } else if (label === "Offers") {
      setActiveTab("Offers");
    } else {
      setActiveTab("Directory");
    }
    setNotice(`${label}: ${value}`);
  }

  function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const isExistingCategory = dialog === "edit" || dialog === "profile";
    const name = String(formData.get("name") || "New Grocery Category").trim();
    const slug = String(formData.get("slug") || slugify(name)).trim();
    const image = String(formData.get("image") || "").trim();
    const status = String(formData.get("status") || "Active") as AdminCategory["status"];
    const featured = formData.get("featured") === "on";
    const category: AdminCategory = {
      ...(isExistingCategory ? selectedCategory : selectedCategory),
      id: isExistingCategory ? selectedCategory.id : `CAT-${105 + items.length}`,
      name,
      slug,
      parent: String(formData.get("parent") || "Root").trim(),
      products: isExistingCategory ? selectedCategory.products : 0,
      image: image || (isExistingCategory && isImageSource(selectedCategory.image) ? selectedCategory.image : ""),
      status,
      featured,
      order: isExistingCategory ? selectedCategory.order : items.length + 1,
      badge: String(formData.get("badge") || "Fresh").trim(),
      sales: isExistingCategory ? selectedCategory.sales : "Rs. 0",
      orders: isExistingCategory ? selectedCategory.orders : 0,
      topProduct: isExistingCategory ? selectedCategory.topProduct : "No top product yet",
      outOfStock: isExistingCategory ? selectedCategory.outOfStock : 0,
      offer: String(formData.get("offer") || "No offer attached").trim(),
      banner: String(formData.get("banner") || "New category banner").trim(),
      seoTitle: String(formData.get("seoTitle") || `${name} Online`).trim(),
      seoDescription: String(formData.get("seoDescription") || `Shop ${name} online with fast grocery delivery.`).trim(),
      keywords: String(formData.get("keywords") || name.toLowerCase()).trim(),
      ogImage: String(formData.get("ogImage") || `${slug || slugify(name)}-og.jpg`).trim()
    };

    void (async () => {
      try {
        if (isExistingCategory) {
          const { category: savedCategory } = await adminApi<{ category: AdminCategory }>(`categories/${category.id}`, {
            method: "PATCH",
            body: JSON.stringify(category)
          });
          setItems((current) => current.map((item) => (item.id === savedCategory.id ? savedCategory : item)));
          setSelectedCategory(savedCategory);
          setNotice(`${savedCategory.name} category updated in backend. Client pages will use the new details.`);
        } else {
          const { category: savedCategory } = await adminApi<{ category: AdminCategory }>("categories", {
            method: "POST",
            body: JSON.stringify(category)
          });
          setItems((current) => [savedCategory, ...current]);
          setSelectedCategory(savedCategory);
          setActiveTab("Directory");
          setNotice(`${savedCategory.name} category created in backend.`);
        }
        setDialog(null);
      } catch (error) {
        setNotice(`Category save failed: ${error instanceof Error ? error.message : "backend request failed"}`);
      }
    })();
  }

  function toggleStatus(category: AdminCategory) {
    const status: AdminCategory["status"] = category.status === "Active" ? "Hidden" : "Active";
    void adminApi<{ category: AdminCategory }>(`categories/${category.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    })
      .then(({ category: savedCategory }) => {
        setItems((current) => current.map((item) => (item.id === savedCategory.id ? savedCategory : item)));
        setSelectedCategory((item) => (item.id === savedCategory.id ? savedCategory : item));
        setNotice(`${savedCategory.name} is now ${savedCategory.status}.`);
      })
      .catch((error) => setNotice(`Category status failed: ${error instanceof Error ? error.message : "backend request failed"}`));
  }

  function toggleFeatured(category: AdminCategory) {
    void adminApi<{ category: AdminCategory }>(`categories/${category.id}`, {
      method: "PATCH",
      body: JSON.stringify({ featured: !category.featured })
    })
      .then(({ category: savedCategory }) => {
        setItems((current) => current.map((item) => (item.id === savedCategory.id ? savedCategory : item)));
        setSelectedCategory((item) => (item.id === savedCategory.id ? savedCategory : item));
        setNotice(`${savedCategory.name} homepage featured setting updated in backend.`);
      })
      .catch((error) => setNotice(`Category featured update failed: ${error instanceof Error ? error.message : "backend request failed"}`));
  }

  function moveCategory(category: AdminCategory, direction: "up" | "down") {
    setItems((current) => {
      const ordered = [...current].sort((a, b) => a.order - b.order);
      const index = ordered.findIndex((item) => item.id === category.id);
      const targetIndex = direction === "up" ? Math.max(0, index - 1) : Math.min(ordered.length - 1, index + 1);
      if (index === targetIndex) {
        return current;
      }
      const next = [...ordered];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      const reordered = next.map((item, itemIndex) => ({ ...item, order: itemIndex + 1 }));
      void Promise.all(
        reordered.map((item) =>
          adminApi<{ category: AdminCategory }>(`categories/${item.id}`, {
            method: "PATCH",
            body: JSON.stringify({ order: item.order })
          })
        )
      ).catch((error) => setNotice(`Category order sync failed: ${error instanceof Error ? error.message : "backend request failed"}`));
      return reordered;
    });
    setNotice(`${category.name} moved ${direction} in homepage order.`);
  }

  function addSubcategory(parent: AdminCategory) {
    const created: AdminCategory = {
      ...parent,
      id: `CAT-${105 + items.length}`,
      name: `${parent.name} Subcategory`,
      slug: `${parent.slug}-subcategory-${items.length + 1}`,
      parent: parent.name,
      products: 0,
      featured: false,
      order: items.length + 1,
      badge: "New",
      sales: "Rs. 0",
      orders: 0,
      topProduct: "No top product yet",
      outOfStock: 0,
      offer: "No offer attached",
      banner: `${parent.name} collection`,
      seoTitle: `${parent.name} Subcategory Online`,
      seoDescription: `Shop ${parent.name} subcategory products online.`,
      keywords: parent.keywords,
      ogImage: `${parent.slug}-subcategory-og.jpg`
    };
    void adminApi<{ category: AdminCategory }>("categories", {
      method: "POST",
      body: JSON.stringify(created)
    })
      .then(({ category: savedCategory }) => {
        setItems((current) => [savedCategory, ...current]);
        setActiveTab("Subcategories");
        setNotice(`${savedCategory.name} created under ${parent.name} in backend.`);
      })
      .catch((error) => setNotice(`Subcategory create failed: ${error instanceof Error ? error.message : "backend request failed"}`));
  }

  function moveProduct(mapping: CategoryProductMapping) {
    const categoryIndex = items.findIndex((item) => item.id === mapping.categoryId);
    const nextCategory = items[(categoryIndex + 1) % items.length];
    setMappings((current) => current.map((item) => (item.sku === mapping.sku ? { ...item, categoryId: nextCategory.id, status: "Active" } : item)));
    setItems((current) =>
      current.map((category) => {
        if (category.id === mapping.categoryId) {
          return { ...category, products: Math.max(0, category.products - 1) };
        }
        if (category.id === nextCategory.id) {
          return { ...category, products: category.products + 1 };
        }
        return category;
      })
    );
    setNotice(`${mapping.product} moved to ${nextCategory.name}. Client listing and filters will follow this category.`);
  }

  function bulkAssignProducts(mapping: CategoryProductMapping) {
    const categoryIndex = items.findIndex((item) => item.id === mapping.categoryId);
    const nextCategory = items[(categoryIndex + 1) % items.length];
    const movedCount = mappings.filter((item) => item.categoryId === mapping.categoryId).length;

    if (!movedCount) {
      setNotice("No products found for bulk assignment.");
      return;
    }

    setMappings((current) =>
      current.map((item) => (item.categoryId === mapping.categoryId ? { ...item, categoryId: nextCategory.id, status: "Active" } : item))
    );
    setItems((current) =>
      current.map((category) => {
        if (category.id === mapping.categoryId) {
          return { ...category, products: Math.max(0, category.products - movedCount) };
        }
        if (category.id === nextCategory.id) {
          return { ...category, products: category.products + movedCount };
        }
        return category;
      })
    );
    setNotice(`${movedCount} products bulk assigned to ${nextCategory.name}. Client category pages will update from this mapping.`);
  }

  function createOffer(category = selectedCategory) {
    const created: CategoryOffer = {
      id: `CO-${404 + offers.length}`,
      categoryId: category.id,
      title: `${category.name} category offer`,
      placement: "Category banner",
      status: "Scheduled",
      valid: "Next campaign window"
    };
    setOffers((current) => [created, ...current]);
    setSelectedCategory(category);
    setActiveTab("Offers");
    setDialog(null);
    setNotice(`${created.title} scheduled.`);
  }

  function toggleOffer(offer: CategoryOffer) {
    const status: CategoryOffer["status"] = offer.status === "Live" ? "Paused" : "Live";
    setOffers((current) => current.map((item) => (item.id === offer.id ? { ...item, status } : item)));
    setNotice(`${offer.title} marked ${status}.`);
  }

  function saveSeo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updated: AdminCategory = {
      ...selectedCategory,
      seoTitle: String(formData.get("seoTitle") || selectedCategory.seoTitle).trim(),
      seoDescription: String(formData.get("seoDescription") || selectedCategory.seoDescription).trim(),
      keywords: String(formData.get("keywords") || selectedCategory.keywords).trim(),
      ogImage: String(formData.get("ogImage") || selectedCategory.ogImage).trim()
    };
    void adminApi<{ category: AdminCategory }>(`categories/${updated.id}`, {
      method: "PATCH",
      body: JSON.stringify(updated)
    })
      .then(({ category: savedCategory }) => {
        setItems((current) => current.map((item) => (item.id === savedCategory.id ? savedCategory : item)));
        setSelectedCategory(savedCategory);
        setDialog(null);
        setNotice(`${savedCategory.name} SEO updated for client category page.`);
      })
      .catch((error) => setNotice(`Category SEO save failed: ${error instanceof Error ? error.message : "backend request failed"}`));
  }

  return (
    <>
      <div className="admin-notice">{notice}</div>
      <section className="reports-command">
        <div>
          <span>Category control</span>
          <h2>Category management</h2>
          <p>Manage category images, homepage order, featured categories, visibility, and product grouping for the storefront.</p>
          <div className="reports-tabs">
            {categoryTabs.map((tab) => (
              <button className={activeTab === tab ? "active" : ""} key={tab} type="button" onClick={() => { setActiveTab(tab); setNotice(`${tab} tab opened.`); }}>
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="reports-command-actions">
          <button className="primary-action" type="button" onClick={() => openCategoryDialog("add")}>Add category</button>
          <button type="button" onClick={() => { setActiveTab("Homepage Order"); setNotice("Homepage category order controls opened."); }}>Homepage order</button>
          <button type="button" onClick={() => createOffer()}>Attach offer</button>
          <button type="button" onClick={() => openCategoryDialog("seo")}>Edit SEO</button>
        </div>
      </section>
      <section className="reports-stat-grid">
        {stats.map((stat) => (
          <button key={stat.label} type="button" onClick={() => openStat(stat.label, stat.value)}>
            <div><span>{stat.label}</span><small>{stat.detail}</small></div>
            <strong>{stat.value}</strong>
          </button>
        ))}
      </section>

      {activeTab === "Overview" ? (
        <section className="reports-layout">
          <div className="reports-main-stack">
            <CategoryClientImpactPanel categories={items} />
            <CategoryDirectory categories={items} onEdit={(category) => openCategoryDialog("edit", category)} onFeature={toggleFeatured} onOpen={(category) => openCategoryDialog("profile", category)} onStatus={toggleStatus} />
          </div>
          <div className="reports-side-stack">
            <CategoryHomepagePreview categories={items} onMove={moveCategory} onPreview={(category) => openCategoryDialog("profile", category)} />
            <CategoryPerformancePanel categories={items} />
          </div>
        </section>
      ) : null}

      {activeTab === "Directory" ? (
        <CategoryDirectory categories={items} onEdit={(category) => openCategoryDialog("edit", category)} onFeature={toggleFeatured} onOpen={(category) => openCategoryDialog("profile", category)} onStatus={toggleStatus} />
      ) : null}
      {activeTab === "Subcategories" ? <CategorySubcategories categories={items} onCreate={addSubcategory} onOpen={(category) => openCategoryDialog("profile", category)} /> : null}
      {activeTab === "Homepage Order" ? <CategoryHomepageOrder categories={items} onFeature={toggleFeatured} onMove={moveCategory} onPreview={(category) => openCategoryDialog("profile", category)} /> : null}
      {activeTab === "Product Mapping" ? <CategoryProductMappingPanel categories={items} mappings={mappings} onBulkAssign={bulkAssignProducts} onMove={moveProduct} /> : null}
      {activeTab === "Offers" ? <CategoryOffersPanel categories={items} offers={offers} onCreate={createOffer} onToggle={toggleOffer} /> : null}
      {activeTab === "SEO" ? <CategorySeoPanel categories={items} onEdit={(category) => openCategoryDialog("seo", category)} onOpen={(category) => openCategoryDialog("profile", category)} /> : null}

      {dialog === "profile" ? (
        <CategoryProfileModal category={selectedCategory} mappedProducts={mappings.filter((mapping) => mapping.categoryId === selectedCategory.id)} offers={offers.filter((offer) => offer.categoryId === selectedCategory.id)} onClose={() => setDialog(null)} onEdit={() => setDialog("edit")} onOffer={() => createOffer(selectedCategory)} onSeo={() => setDialog("seo")} onSubmit={saveCategory} />
      ) : null}
      {dialog === "add" || dialog === "edit" ? (
        <CategoryFormModal category={selectedCategory} dialog={dialog} onClose={() => setDialog(null)} onSubmit={saveCategory} />
      ) : null}
      {dialog === "seo" ? (
        <CategorySeoModal category={selectedCategory} onClose={() => setDialog(null)} onSubmit={saveSeo} />
      ) : null}
    </>
  );
}

function CategoryClientImpactPanel({ categories }: { categories: AdminCategory[] }) {
  const visible = categories.filter((category) => category.status === "Active").length;
  const hidden = categories.filter((category) => category.status === "Hidden").length;
  const featured = categories.filter((category) => category.featured).length;

  return (
    <section className="reports-panel category-impact-panel">
      <div className="reports-panel-head">
        <div><span>Client storefront</span><h2>Category impact map</h2></div>
      </div>
      <div className="category-impact-grid">
        <article><span>Homepage row</span><strong>{featured} featured</strong><small>Controls customer category discovery order.</small></article>
        <article><span>Visible pages</span><strong>{visible} active</strong><small>Active categories power listing pages and filters.</small></article>
        <article><span>Hidden safety</span><strong>{hidden} hidden</strong><small>Hidden categories leave menus, filters, and URLs.</small></article>
        <article><span>SEO coverage</span><strong>{categories.length} pages</strong><small>Title, description, slug, keywords, and share image.</small></article>
      </div>
    </section>
  );
}

function CategoryDirectory({
  categories,
  onEdit,
  onFeature,
  onOpen,
  onStatus
}: {
  categories: AdminCategory[];
  onEdit: (category: AdminCategory) => void;
  onFeature: (category: AdminCategory) => void;
  onOpen: (category: AdminCategory) => void;
  onStatus: (category: AdminCategory) => void;
}) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head">
        <div><span>Categories</span><h2>Storefront category map</h2></div>
      </div>
        <div className="report-table">
        <div className="report-row report-row-head module-row categories"><span>Image</span><span>Name</span><span>Slug</span><span>Products</span><span>Status</span><span>Actions</span></div>
        {categories.map((category) => (
          <div className="report-row module-row categories" key={category.id}>
            <CategoryImage category={category} />
            <div><strong>{category.name}</strong><small>{category.parent} · {category.badge}</small></div>
            <span>{category.slug}</span>
            <span>{category.products}</span>
            <Badge label={category.featured ? "Featured" : category.status} />
            <div className="report-actions">
              <button type="button" onClick={() => onOpen(category)}>Open</button>
              <button type="button" onClick={() => onEdit(category)}>Edit</button>
              <button type="button" onClick={() => onFeature(category)}>{category.featured ? "Unfeature" : "Feature"}</button>
              <button type="button" onClick={() => onStatus(category)}>{category.status === "Active" ? "Hide" : "Activate"}</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoryHomepagePreview({
  categories,
  onMove,
  onPreview
}: {
  categories: AdminCategory[];
  onMove: (category: AdminCategory, direction: "up" | "down") => void;
  onPreview: (category: AdminCategory) => void;
}) {
  const featured = [...categories].filter((category) => category.featured).sort((a, b) => a.order - b.order);

  return (
    <section className="reports-panel compact">
      <div className="reports-panel-head">
        <div><span>Homepage</span><h2>Customer category row</h2></div>
      </div>
      <div className="category-home-preview">
        {featured.map((category) => (
          <article key={category.id}>
            <CategoryImage category={category} />
            <div><span>{category.badge}</span><h3>{category.name}</h3><small>{category.products} products · {category.offer}</small></div>
            <div className="category-preview-actions">
              <button type="button" onClick={() => onMove(category, "up")}>Up</button>
              <button type="button" onClick={() => onMove(category, "down")}>Down</button>
              <button type="button" onClick={() => onPreview(category)}>Open</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CategoryPerformancePanel({ categories }: { categories: AdminCategory[] }) {
  return (
    <section className="reports-panel compact">
      <div className="reports-panel-head">
        <div><span>Performance</span><h2>Category health</h2></div>
      </div>
      <div className="supplier-performance-grid">
        {categories.slice(0, 4).map((category) => (
          <article key={category.id}>
            <span>{category.name}</span>
            <strong>{category.sales}</strong>
            <small>{category.orders} orders · {category.outOfStock} OOS</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function CategorySubcategories({ categories, onCreate, onOpen }: { categories: AdminCategory[]; onCreate: (category: AdminCategory) => void; onOpen: (category: AdminCategory) => void }) {
  const roots = categories.filter((category) => category.parent === "Root");

  return (
    <section className="reports-panel">
      <div className="reports-panel-head">
        <div><span>Subcategories</span><h2>Parent and child structure</h2></div>
      </div>
      <div className="category-subcategory-grid">
        {roots.map((root) => {
          const children = categories.filter((category) => category.parent === root.name);
          return (
            <article key={root.id}>
              <div><strong>{root.name}</strong><span>{root.products} products · {root.badge}</span></div>
              <div className="category-child-list">
                {children.length ? children.map((child) => <button key={child.id} type="button" onClick={() => onOpen(child)}>{child.name}</button>) : <small>No subcategories yet.</small>}
              </div>
              <button type="button" onClick={() => onCreate(root)}>Add subcategory</button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function CategoryHomepageOrder({
  categories,
  onFeature,
  onMove,
  onPreview
}: {
  categories: AdminCategory[];
  onFeature: (category: AdminCategory) => void;
  onMove: (category: AdminCategory, direction: "up" | "down") => void;
  onPreview: (category: AdminCategory) => void;
}) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head">
        <div><span>Homepage order</span><h2>Featured category sequence</h2></div>
      </div>
      <div className="report-table">
        <div className="report-row report-row-head module-row categories"><span>Order</span><span>Category</span><span>Badge</span><span>Products</span><span>Status</span><span>Actions</span></div>
        {[...categories].sort((a, b) => a.order - b.order).map((category) => (
          <div className="report-row module-row categories" key={category.id}>
            <strong className="module-avatar">{category.order}</strong>
            <div><strong>{category.name}</strong><small>{category.banner}</small></div>
            <span>{category.badge}</span>
            <span>{category.products}</span>
            <Badge label={category.featured ? "Featured" : category.status} />
            <div className="report-actions">
              <button type="button" onClick={() => onMove(category, "up")}>Up</button>
              <button type="button" onClick={() => onMove(category, "down")}>Down</button>
              <button type="button" onClick={() => onFeature(category)}>{category.featured ? "Remove" : "Feature"}</button>
              <button type="button" onClick={() => onPreview(category)}>Preview</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoryProductMappingPanel({
  categories,
  mappings,
  onBulkAssign,
  onMove
}: {
  categories: AdminCategory[];
  mappings: CategoryProductMapping[];
  onBulkAssign: (mapping: CategoryProductMapping) => void;
  onMove: (mapping: CategoryProductMapping) => void;
}) {
  const categoryName = (id: string) => categories.find((category) => category.id === id)?.name || "Uncategorized";

  return (
    <section className="reports-panel">
      <div className="reports-panel-head">
        <div><span>Product mapping</span><h2>Category product assignment</h2></div>
      </div>
      <div className="report-table">
        <div className="report-row report-row-head category-mapping-row"><span>Product</span><span>Category</span><span>Status</span><span>Sales</span><span>Actions</span></div>
        {mappings.map((mapping) => (
          <div className="report-row category-mapping-row" key={mapping.sku}>
            <div><strong>{mapping.product}</strong><small>{mapping.sku}</small></div>
            <span>{categoryName(mapping.categoryId)}</span>
            <Badge label={mapping.status} />
            <span>{mapping.sales}</span>
            <div className="report-actions">
              <button type="button" onClick={() => onMove(mapping)}>Move category</button>
              <button type="button" onClick={() => onBulkAssign(mapping)}>Bulk assign</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoryOffersPanel({ categories, offers, onCreate, onToggle }: { categories: AdminCategory[]; offers: CategoryOffer[]; onCreate: (category: AdminCategory) => void; onToggle: (offer: CategoryOffer) => void }) {
  const categoryName = (id: string) => categories.find((category) => category.id === id)?.name || "Category";

  return (
    <section className="reports-panel">
      <div className="reports-panel-head">
        <div><span>Offers</span><h2>Category campaigns</h2></div>
      </div>
      <div className="report-export-list">
        {offers.map((offer) => (
          <article key={offer.id}>
            <div>
              <strong>{offer.title}</strong>
              <span>{categoryName(offer.categoryId)} · {offer.placement} · {offer.valid}</span>
            </div>
            <Badge label={offer.status} />
            <div className="report-actions">
              <button type="button" onClick={() => onToggle(offer)}>{offer.status === "Live" ? "Pause" : "Go live"}</button>
              <button type="button" onClick={() => onCreate(categories.find((category) => category.id === offer.categoryId) || categories[0])}>Duplicate</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CategorySeoPanel({ categories, onEdit, onOpen }: { categories: AdminCategory[]; onEdit: (category: AdminCategory) => void; onOpen: (category: AdminCategory) => void }) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head">
        <div><span>SEO</span><h2>Client category page metadata</h2></div>
      </div>
      <div className="report-table">
        <div className="report-row report-row-head category-seo-row"><span>Category</span><span>Meta title</span><span>Description</span><span>OG image</span><span>Actions</span></div>
        {categories.map((category) => (
          <div className="report-row category-seo-row" key={category.id}>
            <div><strong>{category.name}</strong><small>/{category.slug}</small></div>
            <span>{category.seoTitle}</span>
            <span>{category.seoDescription}</span>
            <span>{category.ogImage}</span>
            <div className="report-actions">
              <button type="button" onClick={() => onEdit(category)}>Edit SEO</button>
              <button type="button" onClick={() => onOpen(category)}>Preview</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoryProfileModal({
  category,
  mappedProducts,
  offers,
  onClose,
  onEdit,
  onOffer,
  onSeo,
  onSubmit
}: {
  category: AdminCategory;
  mappedProducts: CategoryProductMapping[];
  offers: CategoryOffer[];
  onClose: () => void;
  onEdit: () => void;
  onOffer: () => void;
  onSeo: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [image, setImage] = useState(isImageSource(category.image) ? category.image : "");

  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSubmit}>
        <div className="product-dialog-head">
          <div><span>{category.id}</span><h3>{category.name}</h3></div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <div className="settings-form-grid">
          <label><span>Category name</span><input name="name" defaultValue={category.name} required /></label>
          <label><span>Slug</span><input name="slug" defaultValue={category.slug} /></label>
          <CategoryImageControls image={image} name={category.name} onImageChange={setImage} />
          <label><span>Parent category</span><input name="parent" defaultValue={category.parent} /></label>
          <label><span>Badge</span><input name="badge" defaultValue={category.badge} /></label>
          <label><span>Status</span><select name="status" defaultValue={category.status}><option>Active</option><option>Hidden</option><option>Scheduled</option><option>Draft</option><option>Archived</option></select></label>
          <label><span>Offer text</span><input name="offer" defaultValue={category.offer} /></label>
          <label><span>Banner text</span><input name="banner" defaultValue={category.banner} /></label>
          <label><span>Homepage order</span><input value={category.order} readOnly /></label>
          <label><span>Mapped products</span><input value={`${mappedProducts.length} mapped / ${category.products} total`} readOnly /></label>
          <label><span>Sales</span><input value={category.sales} readOnly /></label>
          <label><span>Campaigns</span><input value={`${offers.length} attached campaigns`} readOnly /></label>
          <label><span>Featured on homepage</span><input defaultChecked={category.featured} name="featured" type="checkbox" /></label>
          <label className="settings-wide"><span>SEO title</span><input name="seoTitle" defaultValue={category.seoTitle} /></label>
          <label className="settings-wide"><span>SEO description</span><input name="seoDescription" defaultValue={category.seoDescription} /></label>
          <label className="settings-wide"><span>Keywords</span><input name="keywords" defaultValue={category.keywords} /></label>
          <label><span>Open graph image</span><input name="ogImage" defaultValue={category.ogImage} /></label>
        </div>
        <div className="product-dialog-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button" onClick={onEdit}>Edit category</button>
          <button type="button" onClick={onOffer}>Attach offer</button>
          <button type="button" onClick={onSeo}>Edit SEO</button>
          <button type="submit">Save category</button>
        </div>
      </form>
    </div>
  );
}

function CategoryFormModal({ category, dialog, onClose, onSubmit }: { category: AdminCategory; dialog: "add" | "edit"; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const isAdd = dialog === "add";
  const [image, setImage] = useState(isAdd || !isImageSource(category.image) ? "" : category.image);

  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSubmit}>
        <div className="product-dialog-head">
          <div><span>Category</span><h3>{isAdd ? "Add category" : "Edit category"}</h3></div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <div className="settings-form-grid">
          <label><span>Category name</span><input name="name" defaultValue={isAdd ? "" : category.name} required /></label>
          <label><span>Slug</span><input name="slug" defaultValue={isAdd ? "" : category.slug} /></label>
          <CategoryImageControls image={image} name={isAdd ? "" : category.name} onImageChange={setImage} />
          <label><span>Parent category</span><input name="parent" defaultValue={isAdd ? "Root" : category.parent} /></label>
          <label><span>Badge</span><input name="badge" defaultValue={isAdd ? "Fresh" : category.badge} /></label>
          <label><span>Status</span><select name="status" defaultValue={isAdd ? "Active" : category.status}><option>Active</option><option>Hidden</option><option>Scheduled</option><option>Draft</option><option>Archived</option></select></label>
          <label><span>Offer text</span><input name="offer" defaultValue={isAdd ? "" : category.offer} /></label>
          <label><span>Banner text</span><input name="banner" defaultValue={isAdd ? "" : category.banner} /></label>
          <label><span>Featured on homepage</span><input defaultChecked={isAdd ? false : category.featured} name="featured" type="checkbox" /></label>
          <label className="settings-wide"><span>SEO title</span><input name="seoTitle" defaultValue={isAdd ? "" : category.seoTitle} /></label>
          <label className="settings-wide"><span>SEO description</span><input name="seoDescription" defaultValue={isAdd ? "" : category.seoDescription} /></label>
          <label className="settings-wide"><span>Keywords</span><input name="keywords" defaultValue={isAdd ? "" : category.keywords} /></label>
          <label><span>Open graph image</span><input name="ogImage" defaultValue={isAdd ? "" : category.ogImage} /></label>
        </div>
        <div className="product-dialog-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">{isAdd ? "Save category" : "Update category"}</button>
        </div>
      </form>
    </div>
  );
}

function CategorySeoModal({ category, onClose, onSubmit }: { category: AdminCategory; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSubmit}>
        <div className="product-dialog-head">
          <div><span>SEO</span><h3>{category.name} metadata</h3></div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <div className="settings-form-grid">
          <label className="settings-wide"><span>Meta title</span><input name="seoTitle" defaultValue={category.seoTitle} required /></label>
          <label className="settings-wide"><span>Meta description</span><input name="seoDescription" defaultValue={category.seoDescription} required /></label>
          <label><span>Search keywords</span><input name="keywords" defaultValue={category.keywords} /></label>
          <label><span>Open graph image</span><input name="ogImage" defaultValue={category.ogImage} /></label>
        </div>
        <div className="product-dialog-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">Save SEO</button>
        </div>
      </form>
    </div>
  );
}

function SuppliersView() {
  const [items, setItems] = usePersistentState<AdminSupplier[]>("suppliers:items", adminSuppliers);
  const [purchaseOrders, setPurchaseOrders] = usePersistentState<SupplierPurchaseOrder[]>("suppliers:purchase-orders", supplierPurchaseOrders);
  const [payments, setPayments] = usePersistentState<SupplierPayment[]>("suppliers:payments", supplierPayments);
  const [exports, setExports] = usePersistentState<SupplierExport[]>("suppliers:exports", []);
  const [activeTab, setActiveTab] = useState<SupplierTab>("Overview");
  const [dialog, setDialog] = useState<SupplierDialog>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<AdminSupplier>(emptyAdminSupplier);
  const [selectedOrder, setSelectedOrder] = useState<SupplierPurchaseOrder | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<SupplierPayment | null>(null);
  const [notice, setNotice] = useState("Suppliers control center is active.");

  useEffect(() => {
    if (!selectedSupplier.id && items.length) {
      setSelectedSupplier(items[0]);
    }
  }, [items, selectedSupplier.id]);

  const totalOutstanding = payments.filter((payment) => payment.status !== "Paid").length;
  const delayedOrders = purchaseOrders.filter((order) => order.status === "Delayed").length;
  const ratings = items.map((item) => Number.parseFloat(item.rating)).filter((rating) => Number.isFinite(rating));
  const averageRating = ratings.length ? (ratings.reduce((total, rating) => total + rating, 0) / ratings.length).toFixed(1) : "-";
  const stats = [
    { label: "Total suppliers", value: items.length, detail: "Registered vendors" },
    { label: "Active", value: items.filter((item) => item.status === "Active").length, detail: "Available for purchase" },
    { label: "Review", value: items.filter((item) => item.status === "Review").length, detail: "Needs owner check" },
    { label: "Pending payments", value: totalOutstanding, detail: "Invoices need action" },
    { label: "Delayed", value: delayedOrders, detail: "Purchase orders late" },
    { label: "Avg rating", value: averageRating, detail: "Quality score" }
  ];

  function openDialog(nextDialog: SupplierDialog, supplier = selectedSupplier) {
    if (nextDialog && nextDialog !== "add" && !supplier.id) {
      setNotice("Add or select a supplier before opening this action.");
      return;
    }
    setSelectedSupplier(supplier);
    setDialog(nextDialog);
    if (nextDialog === "profile") {
      setNotice(`${supplier.name} profile opened.`);
    }
  }

  function addSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const contact = String(formData.get("contact") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const email = String(formData.get("email") || "").trim();
    if (!name || !contact || !phone || !email) {
      setNotice("Supplier name, contact, phone, and email are required.");
      return;
    }
    const created: AdminSupplier = {
      id: `SUP-${205 + items.length}`,
      name,
      contact,
      phone,
      email,
      status: "Review",
      lastPurchase: "",
      rating: "-",
      payment: "",
      categories: String(formData.get("categories") || "").trim(),
      address: String(formData.get("address") || "").trim(),
      gst: String(formData.get("gst") || "").trim(),
      terms: String(formData.get("terms") || "").trim(),
      schedule: String(formData.get("schedule") || "").trim(),
      notes: String(formData.get("notes") || "").trim(),
      onTime: "-",
      rejected: 0,
      delayed: 0,
      averageDelivery: "New",
      outstanding: "Rs. 0"
    };
    setItems((current) => [created, ...current]);
    setSelectedSupplier(created);
    setDialog(null);
    setActiveTab("Directory");
    setNotice(`${created.name} added for review.`);
  }

  function editSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updated: AdminSupplier = {
      ...selectedSupplier,
      name: String(formData.get("name") || selectedSupplier.name).trim(),
      contact: String(formData.get("contact") || selectedSupplier.contact).trim(),
      phone: String(formData.get("phone") || selectedSupplier.phone).trim(),
      email: String(formData.get("email") || selectedSupplier.email).trim(),
      categories: String(formData.get("categories") || selectedSupplier.categories).trim(),
      address: String(formData.get("address") || selectedSupplier.address).trim(),
      gst: String(formData.get("gst") || selectedSupplier.gst).trim(),
      terms: String(formData.get("terms") || selectedSupplier.terms).trim(),
      schedule: String(formData.get("schedule") || selectedSupplier.schedule).trim(),
      notes: String(formData.get("notes") || selectedSupplier.notes).trim()
    };

    setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setSelectedSupplier(updated);
    setDialog(null);
    setNotice(`${updated.name} supplier details updated.`);
  }

  function updateStatus(supplier: AdminSupplier, status: AdminSupplier["status"]) {
    setItems((current) => current.map((item) => (item.id === supplier.id ? { ...item, status } : item)));
    setSelectedSupplier((item) => (item.id === supplier.id ? { ...item, status } : item));
    setNotice(`${supplier.name} marked ${status}.`);
  }

  function openStat(label: string, value: string | number) {
    if (label === "Pending payments") {
      setActiveTab("Payments");
    } else if (label === "Delayed") {
      setActiveTab("Purchase Orders");
    } else if (label === "Review") {
      setActiveTab("Reviews");
    } else if (label === "Active" || label === "Total suppliers") {
      setActiveTab("Directory");
    } else {
      setActiveTab("Performance");
    }
    setNotice(`${label}: ${value}`);
  }

  function createPurchaseOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSupplier.id) {
      setNotice("Select a supplier before creating a purchase order.");
      return;
    }
    const formData = new FormData(event.currentTarget);
    const productsValue = String(formData.get("products") || "").trim();
    const quantityValue = String(formData.get("quantity") || "").trim();
    const amountValue = String(formData.get("amount") || "").trim();
    if (!productsValue || !quantityValue || !amountValue) {
      setNotice("Purchase order products, quantity, and amount are required.");
      return;
    }
    const created: SupplierPurchaseOrder = {
      id: `PO-${501 + purchaseOrders.length}`,
      supplierId: selectedSupplier.id,
      products: productsValue,
      quantity: quantityValue,
      amount: amountValue,
      orderDate: "Just now",
      deliveryDate: String(formData.get("deliveryDate") || selectedSupplier.schedule).trim(),
      payment: String(formData.get("payment") || "Pending") as SupplierPurchaseOrder["payment"],
      status: String(formData.get("status") || "Pending") as SupplierPurchaseOrder["status"]
    };

    setPurchaseOrders((current) => [created, ...current]);
    setActiveTab("Purchase Orders");
    setDialog(null);
    setNotice(`${created.id} created for ${selectedSupplier.name}.`);
  }

  function updatePurchaseOrder(order: SupplierPurchaseOrder, status: SupplierPurchaseOrder["status"]) {
    setPurchaseOrders((current) => current.map((item) => (item.id === order.id ? { ...item, status } : item)));
    setSelectedOrder((current) => (current?.id === order.id ? { ...current, status } : current));
    setNotice(`${order.id} marked ${status}.`);
  }

  function savePurchaseOrderReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOrder) return;
    const formData = new FormData(event.currentTarget);
    const updated: SupplierPurchaseOrder = {
      ...selectedOrder,
      products: String(formData.get("products") || selectedOrder.products).trim(),
      quantity: String(formData.get("quantity") || selectedOrder.quantity).trim(),
      amount: String(formData.get("amount") || selectedOrder.amount).trim(),
      deliveryDate: String(formData.get("deliveryDate") || selectedOrder.deliveryDate).trim(),
      payment: String(formData.get("payment") || selectedOrder.payment) as SupplierPurchaseOrder["payment"],
      status: String(formData.get("status") || selectedOrder.status) as SupplierPurchaseOrder["status"]
    };
    setPurchaseOrders((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setSelectedOrder(null);
    setNotice(`${updated.id} purchase order saved.`);
  }

  function markPaymentPaid(payment: SupplierPayment) {
    setPayments((current) => current.map((item) => (item.id === payment.id ? { ...item, status: "Paid", due: "Paid just now" } : item)));
    setSelectedPayment((current) => (current?.id === payment.id ? { ...current, status: "Paid", due: "Paid just now" } : current));
    setNotice(`${payment.invoice} marked paid.`);
  }

  function saveSupplierPaymentReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPayment) return;
    const formData = new FormData(event.currentTarget);
    const updated: SupplierPayment = {
      ...selectedPayment,
      invoice: String(formData.get("invoice") || selectedPayment.invoice).trim(),
      amount: String(formData.get("amount") || selectedPayment.amount).trim(),
      due: String(formData.get("due") || selectedPayment.due).trim(),
      status: String(formData.get("status") || selectedPayment.status) as SupplierPayment["status"],
      method: String(formData.get("method") || selectedPayment.method).trim()
    };
    setPayments((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setSelectedPayment(null);
    setNotice(`${updated.invoice} payment review saved.`);
  }

  function openPurchaseOrder(order: SupplierPurchaseOrder) {
    const supplier = items.find((item) => item.id === order.supplierId);
    if (supplier) {
      setSelectedSupplier(supplier);
    }
    setSelectedOrder(order);
    setNotice(`${order.id} opened.`);
  }

  function openInvoice(payment: SupplierPayment) {
    const supplier = items.find((item) => item.id === payment.supplierId);
    if (supplier) {
      setSelectedSupplier(supplier);
    }
    setSelectedPayment(payment);
    setNotice(`${payment.invoice} invoice opened.`);
  }

  function exportSupplierList() {
    const created: SupplierExport = {
      id: `SX-${701 + exports.length}`,
      title: `${activeTab} supplier list`,
      format: activeTab === "Payments" ? "XLSX" : "CSV",
      status: "Ready",
      time: "Just now"
    };

    setExports((current) => [created, ...current]);
    setNotice(`${created.title} export is ready.`);
  }

  function downloadSupplierExport(item: SupplierExport) {
    setExports((current) => current.map((exportItem) => (exportItem.id === item.id ? { ...exportItem, status: "Downloaded", time: "Downloaded just now" } : exportItem)));
    setNotice(`${item.title} downloaded as ${item.format}.`);
  }

  const supplierTabs: SupplierTab[] = ["Overview", "Directory", "Purchase Orders", "Payments", "Performance", "Reviews"];
  const selectedOrders = purchaseOrders.filter((order) => order.supplierId === selectedSupplier.id);
  const selectedPayments = payments.filter((payment) => payment.supplierId === selectedSupplier.id);

  return (
    <>
      <div className="admin-notice">{notice}</div>
      <section className="reports-command">
        <div>
          <span>Vendor operations</span>
          <h2>Supplier management</h2>
          <p>Manage supplier contacts, purchase health, payment status, vendor quality, and stock sourcing for inventory operations.</p>
          <div className="reports-tabs">
            {supplierTabs.map((tab) => (
              <button className={activeTab === tab ? "active" : ""} key={tab} type="button" onClick={() => { setActiveTab(tab); setNotice(`${tab} tab opened.`); }}>
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="reports-command-actions">
          <button className="primary-action" type="button" onClick={() => openDialog("add")}>Add supplier</button>
          <button type="button" onClick={() => openDialog("purchase")}>Create purchase order</button>
          <button type="button" onClick={() => { setActiveTab("Payments"); setNotice("Supplier payment review opened."); }}>Payment review</button>
          <button type="button" onClick={exportSupplierList}>Export supplier list</button>
        </div>
      </section>

      <section className="reports-stat-grid">
        {stats.map((stat) => (
          <button key={stat.label} type="button" onClick={() => openStat(stat.label, stat.value)}>
            <div><span>{stat.label}</span><small>{stat.detail}</small></div>
            <strong>{stat.value}</strong>
          </button>
        ))}
      </section>

      {activeTab === "Overview" ? (
        <section className="reports-layout">
          <div className="reports-main-stack">
            <SupplierDirectory suppliers={items} onApprove={(supplier) => updateStatus(supplier, "Active")} onEdit={(supplier) => openDialog("edit", supplier)} onOpen={(supplier) => openDialog("profile", supplier)} onPause={(supplier) => updateStatus(supplier, "Paused")} />
            <SupplierPurchaseOrders orders={purchaseOrders.slice(0, 4)} onOpen={openPurchaseOrder} onUpdate={updatePurchaseOrder} />
          </div>
          <div className="reports-side-stack">
            <SupplierPerformancePanel supplier={selectedSupplier} />
            <SupplierPaymentsPanel payments={selectedPayments.length ? selectedPayments : payments.slice(0, 3)} onMarkPaid={markPaymentPaid} onOpenInvoice={openInvoice} />
          </div>
        </section>
      ) : null}

      {activeTab === "Directory" ? (
        <SupplierDirectory suppliers={items} onApprove={(supplier) => updateStatus(supplier, "Active")} onEdit={(supplier) => openDialog("edit", supplier)} onOpen={(supplier) => openDialog("profile", supplier)} onPause={(supplier) => updateStatus(supplier, "Paused")} />
      ) : null}

      {activeTab === "Purchase Orders" ? (
        <SupplierPurchaseOrders orders={purchaseOrders} onOpen={openPurchaseOrder} onUpdate={updatePurchaseOrder} />
      ) : null}

      {activeTab === "Payments" ? <SupplierPaymentsPanel payments={payments} onMarkPaid={markPaymentPaid} onOpenInvoice={openInvoice} full /> : null}
      {activeTab === "Performance" ? <SupplierPerformanceGrid suppliers={items} onReview={(supplier) => openDialog("profile", supplier)} /> : null}
      {activeTab === "Reviews" ? <SupplierReviews suppliers={items} onApprove={(supplier) => updateStatus(supplier, "Active")} onPause={(supplier) => updateStatus(supplier, "Paused")} /> : null}
      {exports.length ? <SupplierExportsPanel exports={exports} onDownload={downloadSupplierExport} /> : null}

      {dialog === "profile" ? (
        <SupplierProfileModal supplier={selectedSupplier} orders={selectedOrders} payments={selectedPayments} onClose={() => setDialog(null)} onEdit={() => setDialog("edit")} onPurchase={() => { setDialog("purchase"); setNotice(`Purchase order setup opened for ${selectedSupplier.name}.`); }} onSubmit={editSupplier} />
      ) : null}
      {dialog === "add" || dialog === "edit" ? (
        <SupplierFormModal dialog={dialog} supplier={selectedSupplier} onClose={() => setDialog(null)} onSubmit={dialog === "add" ? addSupplier : editSupplier} />
      ) : null}
      {dialog === "purchase" ? (
        <SupplierPurchaseModal supplier={selectedSupplier} onClose={() => setDialog(null)} onCreate={createPurchaseOrder} />
      ) : null}
      {selectedOrder ? (
        <SupplierPurchaseOrderDialog
          order={selectedOrder}
          supplier={items.find((item) => item.id === selectedOrder.supplierId) || selectedSupplier}
          onClose={() => setSelectedOrder(null)}
          onMarkDelayed={() => updatePurchaseOrder(selectedOrder, "Delayed")}
          onMarkReceived={() => updatePurchaseOrder(selectedOrder, "Received")}
          onSave={savePurchaseOrderReview}
        />
      ) : null}
      {selectedPayment ? (
        <SupplierInvoiceDialog
          payment={selectedPayment}
          supplier={items.find((item) => item.id === selectedPayment.supplierId) || selectedSupplier}
          onClose={() => setSelectedPayment(null)}
          onMarkPaid={() => markPaymentPaid(selectedPayment)}
          onSave={saveSupplierPaymentReview}
        />
      ) : null}
    </>
  );
}

function SupplierDirectory({
  suppliers,
  onApprove,
  onEdit,
  onOpen,
  onPause
}: {
  suppliers: AdminSupplier[];
  onApprove: (supplier: AdminSupplier) => void;
  onEdit: (supplier: AdminSupplier) => void;
  onOpen: (supplier: AdminSupplier) => void;
  onPause: (supplier: AdminSupplier) => void;
}) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head">
        <div><span>Suppliers</span><h2>Vendor directory</h2></div>
      </div>
      <div className="report-table">
        <div className="report-row report-row-head module-row suppliers"><span>Supplier</span><span>Contact</span><span>Categories</span><span>Payment</span><span>Status</span><span>Actions</span></div>
        {suppliers.map((supplier) => (
          <div className="report-row module-row suppliers" key={supplier.id}>
            <div><strong>{supplier.name}</strong><small>{supplier.id} · rating {supplier.rating}</small></div>
            <div><span>{supplier.contact}</span><small>{supplier.phone}</small></div>
            <span>{supplier.categories}</span>
            <span>{supplier.payment}</span>
            <Badge label={supplier.status} />
            <div className="report-actions">
              <button type="button" onClick={() => onOpen(supplier)}>Open</button>
              <button type="button" onClick={() => onEdit(supplier)}>Edit</button>
              <button type="button" onClick={() => onApprove(supplier)}>Approve</button>
              <button type="button" onClick={() => onPause(supplier)}>Pause</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SupplierPurchaseOrders({
  orders,
  onOpen,
  onUpdate
}: {
  orders: SupplierPurchaseOrder[];
  onOpen: (order: SupplierPurchaseOrder) => void;
  onUpdate: (order: SupplierPurchaseOrder, status: SupplierPurchaseOrder["status"]) => void;
}) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head">
        <div><span>Purchase orders</span><h2>Purchase history</h2></div>
      </div>
      <div className="report-table">
        <div className="report-row report-row-head supplier-order-row"><span>PO</span><span>Products</span><span>Quantity</span><span>Amount</span><span>Payment</span><span>Status</span><span>Actions</span></div>
        {orders.map((order) => (
          <div className="report-row supplier-order-row" key={order.id}>
            <div><strong>{order.id}</strong><small>{order.orderDate} · {order.deliveryDate}</small></div>
            <span>{order.products}</span>
            <span>{order.quantity}</span>
            <span>{order.amount}</span>
            <Badge label={order.payment} />
            <Badge label={order.status} />
            <div className="report-actions">
              <button type="button" onClick={() => onOpen(order)}>Open</button>
              <button type="button" onClick={() => onUpdate(order, "Received")}>Received</button>
              <button type="button" onClick={() => onUpdate(order, "Delayed")}>Delayed</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SupplierExportsPanel({ exports, onDownload }: { exports: SupplierExport[]; onDownload: (item: SupplierExport) => void }) {
  return (
    <section className="reports-panel compact supplier-export-panel">
      <div className="reports-panel-head">
        <div><span>Exports</span><h2>Supplier files</h2></div>
      </div>
      <div className="report-export-list">
        {exports.map((item) => (
          <article key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <span>{item.id} · {item.format} · {item.time}</span>
            </div>
            <Badge label={item.status} />
            <div className="report-actions">
              <button type="button" onClick={() => onDownload(item)}>{item.status === "Downloaded" ? "Download again" : "Download"}</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SupplierPaymentsPanel({
  full = false,
  payments,
  onMarkPaid,
  onOpenInvoice
}: {
  full?: boolean;
  payments: SupplierPayment[];
  onMarkPaid: (payment: SupplierPayment) => void;
  onOpenInvoice: (payment: SupplierPayment) => void;
}) {
  return (
    <section className={full ? "reports-panel" : "reports-panel compact"}>
      <div className="reports-panel-head">
        <div><span>Payments</span><h2>Supplier invoices</h2></div>
      </div>
      <div className="report-export-list">
        {payments.map((payment) => (
          <article key={payment.id}>
            <div>
              <strong>{payment.invoice}</strong>
              <span>{payment.amount} · {payment.due} · {payment.method}</span>
            </div>
            <Badge label={payment.status} />
            <div className="report-actions">
              <button type="button" onClick={() => onMarkPaid(payment)}>Mark paid</button>
              <button type="button" onClick={() => onOpenInvoice(payment)}>Open invoice</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SupplierPerformancePanel({ supplier }: { supplier: AdminSupplier }) {
  const cards = [
    ["On-time delivery", supplier.onTime],
    ["Quality rating", supplier.rating],
    ["Rejected stock", supplier.rejected],
    ["Delayed POs", supplier.delayed],
    ["Average delivery", supplier.averageDelivery],
    ["Outstanding", supplier.outstanding]
  ];

  return (
    <section className="reports-panel compact">
      <div className="reports-panel-head">
        <div><span>Performance</span><h2>{supplier.name}</h2></div>
      </div>
      <div className="supplier-performance-grid">
        {cards.map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function SupplierPerformanceGrid({ suppliers, onReview }: { suppliers: AdminSupplier[]; onReview: (supplier: AdminSupplier) => void }) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head">
        <div><span>Performance</span><h2>Supplier scorecards</h2></div>
      </div>
      <div className="supplier-score-grid">
        {suppliers.map((supplier) => (
          <article key={supplier.id}>
            <div><strong>{supplier.name}</strong><span>{supplier.categories}</span></div>
            <div className="supplier-performance-grid">
              <article><span>On time</span><strong>{supplier.onTime}</strong></article>
              <article><span>Rating</span><strong>{supplier.rating}</strong></article>
              <article><span>Rejected</span><strong>{supplier.rejected}</strong></article>
            </div>
            <button type="button" onClick={() => onReview(supplier)}>Review supplier</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function SupplierReviews({ suppliers, onApprove, onPause }: { suppliers: AdminSupplier[]; onApprove: (supplier: AdminSupplier) => void; onPause: (supplier: AdminSupplier) => void }) {
  const reviewSuppliers = suppliers.filter((supplier) => supplier.status !== "Active" || supplier.delayed > 2 || supplier.rejected > 4);

  return (
    <section className="reports-panel">
      <div className="reports-panel-head">
        <div><span>Reviews</span><h2>Suppliers needing attention</h2></div>
      </div>
      <div className="report-export-list">
        {reviewSuppliers.map((supplier) => (
          <article key={supplier.id}>
            <div>
              <strong>{supplier.name}</strong>
              <span>{supplier.status} · {supplier.delayed} delayed POs · {supplier.rejected} rejected stock entries</span>
            </div>
            <Badge label={supplier.status} />
            <div className="report-actions">
              <button type="button" onClick={() => onApprove(supplier)}>Approve</button>
              <button type="button" onClick={() => onPause(supplier)}>Pause</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SupplierProfileModal({
  orders,
  payments,
  supplier,
  onClose,
  onEdit,
  onPurchase,
  onSubmit
}: {
  orders: SupplierPurchaseOrder[];
  payments: SupplierPayment[];
  supplier: AdminSupplier;
  onClose: () => void;
  onEdit: () => void;
  onPurchase: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSubmit}>
        <div className="product-dialog-head">
          <div><span>{supplier.id}</span><h3>{supplier.name}</h3></div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <div className="settings-form-grid">
          <label><span>Supplier name</span><input name="name" defaultValue={supplier.name} required /></label>
          <label><span>Contact person</span><input name="contact" defaultValue={supplier.contact} /></label>
          <label><span>Phone</span><input name="phone" defaultValue={supplier.phone} /></label>
          <label><span>Email</span><input name="email" defaultValue={supplier.email} /></label>
          <label><span>Categories</span><input name="categories" defaultValue={supplier.categories} /></label>
          <label><span>GST</span><input name="gst" defaultValue={supplier.gst} /></label>
          <label><span>Payment terms</span><input name="terms" defaultValue={supplier.terms} /></label>
          <label><span>Delivery schedule</span><input name="schedule" defaultValue={supplier.schedule} /></label>
          <label className="settings-wide"><span>Address</span><input name="address" defaultValue={supplier.address} /></label>
          <label><span>On-time score</span><input value={supplier.onTime} readOnly /></label>
          <label><span>Open POs</span><input value={`${orders.length} recent orders`} readOnly /></label>
          <label><span>Payments</span><input value={`${payments.length} invoices`} readOnly /></label>
          <label className="settings-wide"><span>Notes</span><textarea name="notes" defaultValue={supplier.notes} rows={4} /></label>
        </div>
        <div className="supplier-profile-panels">
          <section>
            <h4>Recent purchase orders</h4>
            {orders.length ? orders.map((order) => <p key={order.id}>{order.id} · {order.products} · {order.status}</p>) : <p>No purchase orders yet.</p>}
          </section>
          <section>
            <h4>Payments</h4>
            {payments.length ? payments.map((payment) => <p key={payment.id}>{payment.invoice} · {payment.amount} · {payment.status}</p>) : <p>No payments yet.</p>}
          </section>
        </div>
        <div className="product-dialog-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button" onClick={onEdit}>Edit supplier</button>
          <button type="button" onClick={onPurchase}>Create purchase order</button>
          <button type="submit">Save supplier</button>
        </div>
      </form>
    </div>
  );
}

function SupplierFormModal({ dialog, supplier, onClose, onSubmit }: { dialog: "add" | "edit"; supplier: AdminSupplier; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const isAdd = dialog === "add";

  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSubmit}>
        <div className="product-dialog-head">
          <div><span>Supplier</span><h3>{isAdd ? "Add supplier" : "Edit supplier"}</h3></div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <div className="settings-form-grid">
          <label><span>Supplier name</span><input name="name" defaultValue={isAdd ? "" : supplier.name} required /></label>
          <label><span>Contact person</span><input name="contact" defaultValue={isAdd ? "" : supplier.contact} required /></label>
          <label><span>Phone</span><input name="phone" defaultValue={isAdd ? "" : supplier.phone} required /></label>
          <label><span>Email</span><input name="email" defaultValue={isAdd ? "" : supplier.email} required type="email" /></label>
          <label><span>Address</span><input name="address" defaultValue={isAdd ? "" : supplier.address} /></label>
          <label><span>GST / tax number</span><input name="gst" defaultValue={isAdd ? "" : supplier.gst} /></label>
          <label><span>Supplied categories</span><input name="categories" defaultValue={isAdd ? "" : supplier.categories} /></label>
          <label><span>Payment terms</span><input name="terms" defaultValue={isAdd ? "Net 7" : supplier.terms} /></label>
          <label><span>Delivery schedule</span><input name="schedule" defaultValue={isAdd ? "Weekly" : supplier.schedule} /></label>
          <label className="settings-wide"><span>Internal notes</span><input name="notes" defaultValue={isAdd ? "" : supplier.notes} /></label>
        </div>
        <div className="product-dialog-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">{isAdd ? "Save supplier" : "Update supplier"}</button>
        </div>
      </form>
    </div>
  );
}

function SupplierPurchaseModal({ supplier, onClose, onCreate }: { supplier: AdminSupplier; onClose: () => void; onCreate: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onCreate}>
        <div className="product-dialog-head">
          <div><span>Purchase order</span><h3>Create PO for {supplier.name}</h3></div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <div className="settings-form-grid">
          <label><span>Supplier</span><input value={supplier.name} readOnly /></label>
          <label><span>Default schedule</span><input value={supplier.schedule} readOnly /></label>
          <label><span>Categories</span><input value={supplier.categories} readOnly /></label>
          <label><span>Payment terms</span><input value={supplier.terms} readOnly /></label>
          <label className="settings-wide"><span>Products</span><input name="products" defaultValue="New grocery stock" required /></label>
          <label><span>Quantity</span><input name="quantity" defaultValue="120 units" required /></label>
          <label><span>Amount</span><input name="amount" defaultValue="Rs. 15K" required /></label>
          <label><span>Delivery date</span><input name="deliveryDate" defaultValue={supplier.schedule} required /></label>
          <label><span>Payment</span><select name="payment" defaultValue="Pending"><option>Pending</option><option>Partial</option><option>Paid</option></select></label>
          <label><span>Status</span><select name="status" defaultValue="Pending"><option>Pending</option><option>Received</option><option>Delayed</option></select></label>
        </div>
        <div className="product-dialog-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">Create purchase order</button>
        </div>
      </form>
    </div>
  );
}

function SupplierPurchaseOrderDialog({
  order,
  supplier,
  onClose,
  onMarkDelayed,
  onMarkReceived,
  onSave
}: {
  order: SupplierPurchaseOrder;
  supplier: AdminSupplier;
  onClose: () => void;
  onMarkDelayed: () => void;
  onMarkReceived: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSave}>
        <div className="product-dialog-head">
          <div><span>{order.id}</span><h3>Purchase order details</h3></div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <div className="settings-form-grid">
          <label><span>Supplier</span><input value={supplier.name} readOnly /></label>
          <label><span>Contact</span><input value={`${supplier.contact} · ${supplier.phone}`} readOnly /></label>
          <label className="settings-wide"><span>Products</span><input name="products" defaultValue={order.products} required /></label>
          <label><span>Quantity</span><input name="quantity" defaultValue={order.quantity} required /></label>
          <label><span>Amount</span><input name="amount" defaultValue={order.amount} required /></label>
          <label><span>Payment</span><select name="payment" defaultValue={order.payment}><option>Pending</option><option>Partial</option><option>Paid</option></select></label>
          <label><span>Status</span><select name="status" defaultValue={order.status}><option>Pending</option><option>Delayed</option><option>Received</option></select></label>
          <label><span>Order date</span><input value={order.orderDate} readOnly /></label>
          <label><span>Delivery date</span><input name="deliveryDate" defaultValue={order.deliveryDate} /></label>
          <label className="settings-wide"><span>Terms</span><input value={supplier.terms} readOnly /></label>
        </div>
        <div className="product-dialog-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button" onClick={onMarkDelayed}>Mark delayed</button>
          <button type="button" onClick={onMarkReceived}>Mark received</button>
          <button type="submit">Save order</button>
        </div>
      </form>
    </div>
  );
}

function SupplierInvoiceDialog({
  payment,
  supplier,
  onClose,
  onMarkPaid,
  onSave
}: {
  payment: SupplierPayment;
  supplier: AdminSupplier;
  onClose: () => void;
  onMarkPaid: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSave}>
        <div className="product-dialog-head">
          <div><span>{payment.invoice}</span><h3>Supplier invoice</h3></div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <div className="settings-form-grid">
          <label><span>Supplier</span><input value={supplier.name} readOnly /></label>
          <label><span>Payment id</span><input value={payment.id} readOnly /></label>
          <label><span>Invoice</span><input name="invoice" defaultValue={payment.invoice} required /></label>
          <label><span>Amount</span><input name="amount" defaultValue={payment.amount} required /></label>
          <label><span>Due</span><input name="due" defaultValue={payment.due} /></label>
          <label><span>Status</span><select name="status" defaultValue={payment.status}><option>Pending</option><option>Partial</option><option>Paid</option></select></label>
          <label><span>Method</span><input name="method" defaultValue={payment.method} /></label>
          <label><span>GST / tax</span><input value={supplier.gst} readOnly /></label>
          <label className="settings-wide"><span>Payment terms</span><input value={supplier.terms} readOnly /></label>
        </div>
        <div className="product-dialog-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button" onClick={onMarkPaid}>Mark paid</button>
          <button type="submit">Save invoice</button>
        </div>
      </form>
    </div>
  );
}

function PromotionsView() {
  const [items, setItems] = usePersistentState<AdminPromotion[]>("promotions:items", adminPromotions);
  const [activeTab, setActiveTab] = useState<PromotionTab>("Overview");
  const [dialog, setDialog] = useState<PromotionDialog>(null);
  const [selectedPromotion, setSelectedPromotion] = useState<AdminPromotion>(adminPromotions[0]);
  const [syncEvents, setSyncEvents] = usePersistentState<PromotionSyncEvent[]>("promotions:sync-events", [
    { id: "SYNC-901", message: "Initial active promotions cache is ready.", time: "Loaded now" }
  ]);
  const [notice, setNotice] = useState("Promotions control center is active.");
  const promotionTabs: PromotionTab[] = ["Overview", "Campaigns", "Placements", "Audience", "Product Mapping", "Coupons", "Schedule", "Analytics", "Risk"];
  const totalRevenue = items.reduce((total, item) => total + parseRupees(item.revenue), 0);
  const totalBudgetUsed = items.reduce((total, item) => total + parseRupees(item.budgetUsed), 0);
  const stats = [
    { label: "Promotions", value: items.length, detail: "Campaign placements" },
    { label: "Live", value: items.filter((item) => item.status === "Live").length, detail: "Visible now" },
    { label: "Scheduled", value: items.filter((item) => item.status === "Scheduled").length, detail: "Upcoming campaigns" },
    { label: "Revenue", value: formatRupees(totalRevenue), detail: "Promotion driven sales" },
    { label: "Budget used", value: formatRupees(totalBudgetUsed), detail: "Campaign spend" },
    { label: "Risk", value: items.filter((item) => item.risk !== "Low").length, detail: "Needs review" }
  ];

  useEffect(() => {
    let active = true;
    adminApi<{ promotions: AdminPromotion[] }>("promotions")
      .then(({ promotions }) => {
        if (!active) return;
        setItems(promotions as AdminPromotion[]);
        setSelectedPromotion((promotions[0] as AdminPromotion) ?? adminPromotions[0]);
        setNotice("Promotions loaded from backend API.");
      })
      .catch((error) => {
        if (active) setNotice(`Promotions API unavailable: ${error instanceof Error ? error.message : "using saved local state"}`);
      });
    return () => {
      active = false;
    };
  }, [setItems]);

  useEffect(() => {
    publishStorefrontPatch({ promotions: promotionsToStorefront(items) });
  }, [items]);

  function parseRupees(value: string) {
    const amount = Number.parseFloat(value.match(/\d+(?:\.\d+)?/)?.[0] || "0");
    if (!Number.isFinite(amount)) {
      return 0;
    }
    return value.includes("L") ? amount * 100000 : value.includes("K") ? amount * 1000 : amount;
  }

  function formatRupees(value: number) {
    if (value >= 100000) {
      return `Rs. ${(value / 100000).toFixed(1)}L`;
    }
    if (value >= 1000) {
      return `Rs. ${Math.round(value / 1000)}K`;
    }
    return `Rs. ${value}`;
  }

  function openPromotionDialog(nextDialog: PromotionDialog, promotion = selectedPromotion) {
    setSelectedPromotion(promotion);
    setDialog(nextDialog);
    if (nextDialog === "preview") {
      setNotice(`${promotion.title} client placement preview opened.`);
    }
  }

  function openStat(label: string, value: string | number) {
    if (label === "Live" || label === "Scheduled") {
      setActiveTab("Campaigns");
    } else if (label === "Revenue" || label === "Budget used") {
      setActiveTab("Analytics");
    } else if (label === "Risk") {
      setActiveTab("Risk");
    } else {
      setActiveTab("Overview");
    }
    setNotice(`${label}: ${value}`);
  }

  function savePromotion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const isExistingPromotion = dialog === "edit" || dialog === "preview";
    const title = String(formData.get("title") || "New promotion").trim();
    const type = String(formData.get("type") || "Homepage banner") as AdminPromotion["type"];
    const status = String(formData.get("status") || "Scheduled") as AdminPromotion["status"];
    const promotion: AdminPromotion = {
      ...(isExistingPromotion ? selectedPromotion : selectedPromotion),
      id: isExistingPromotion ? selectedPromotion.id : `PR-${301 + items.length}`,
      title,
      type,
      placement: String(formData.get("placement") || "Homepage hero").trim(),
      audience: String(formData.get("audience") || "All customers").trim(),
      status,
      priority: Number(formData.get("priority") || items.length + 1),
      cta: String(formData.get("cta") || "Shop now").trim(),
      budget: String(formData.get("budget") || "Rs. 5K").trim(),
      budgetUsed: isExistingPromotion ? selectedPromotion.budgetUsed : "Rs. 0",
      value: String(formData.get("value") || "10% off").trim(),
      coupon: String(formData.get("coupon") || "NOCOUPON").trim().toUpperCase(),
      couponState: String(formData.get("coupon") || "NOCOUPON").trim().toUpperCase() === "NOCOUPON" ? "Needs setup" : "Connected",
      targetUrl: String(formData.get("targetUrl") || "/").trim(),
      startsAt: String(formData.get("startsAt") || "Next window").trim(),
      endsAt: String(formData.get("endsAt") || "Campaign end").trim(),
      views: isExistingPromotion ? selectedPromotion.views : 0,
      clicks: isExistingPromotion ? selectedPromotion.clicks : 0,
      conversions: isExistingPromotion ? selectedPromotion.conversions : 0,
      revenue: isExistingPromotion ? selectedPromotion.revenue : "Rs. 0",
      roi: isExistingPromotion ? selectedPromotion.roi : "-",
      discountCost: isExistingPromotion ? selectedPromotion.discountCost : "Rs. 0",
      risk: isExistingPromotion ? selectedPromotion.risk : "Low",
      riskNote: isExistingPromotion ? selectedPromotion.riskNote : "New campaign under normal controls.",
      mappedTo: String(formData.get("mappedTo") || "All store").trim(),
      image: String(formData.get("image") || title.slice(0, 2).toUpperCase()).trim().slice(0, 3).toUpperCase()
    };

    void (async () => {
      try {
        const endpoint = isExistingPromotion ? `promotions/${promotion.id}` : "promotions";
        const { promotion: savedPromotion } = await adminApi<{ promotion: AdminPromotion }>(endpoint, {
          method: isExistingPromotion ? "PATCH" : "POST",
          body: JSON.stringify(promotion)
        });

        if (isExistingPromotion) {
          setItems((current) => current.map((item) => (item.id === savedPromotion.id ? savedPromotion : item)));
          setNotice(`${savedPromotion.title} promotion updated in backend.`);
        } else {
          setItems((current) => [savedPromotion, ...current]);
          setActiveTab("Campaigns");
          setNotice(`${savedPromotion.title} promotion created in backend.`);
        }

        setSelectedPromotion(savedPromotion);
        setDialog(null);
      } catch (error) {
        setNotice(`Promotion save failed: ${error instanceof Error ? error.message : "backend request failed"}`);
      }
    })();
  }

  function updateStatus(promotion: AdminPromotion, status: AdminPromotion["status"]) {
    void adminApi<{ promotion: AdminPromotion }>(`promotions/${promotion.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    })
      .then(({ promotion: savedPromotion }) => {
        setItems((current) => current.map((item) => (item.id === savedPromotion.id ? savedPromotion : item)));
        setSelectedPromotion((item) => (item.id === savedPromotion.id ? savedPromotion : item));
        setNotice(`${savedPromotion.title} marked ${savedPromotion.status}.`);
      })
      .catch((error) => setNotice(`Promotion status failed: ${error instanceof Error ? error.message : "backend request failed"}`));
  }

  function duplicatePromotion(promotion: AdminPromotion) {
    const created: AdminPromotion = {
      ...promotion,
      id: `PR-${301 + items.length}`,
      title: `${promotion.title} copy`,
      status: "Scheduled",
      priority: items.length + 1,
      views: 0,
      clicks: 0,
      conversions: 0,
      revenue: "Rs. 0",
      budgetUsed: "Rs. 0",
      discountCost: "Rs. 0",
      roi: "-"
    };
    void adminApi<{ promotion: AdminPromotion }>("promotions", {
      method: "POST",
      body: JSON.stringify(created)
    })
      .then(({ promotion: savedPromotion }) => {
        setItems((current) => [savedPromotion, ...current]);
        setActiveTab("Campaigns");
        setNotice(`${savedPromotion.title} duplicated and scheduled in backend.`);
      })
      .catch((error) => setNotice(`Promotion duplicate failed: ${error instanceof Error ? error.message : "backend request failed"}`));
  }

  function movePromotion(promotion: AdminPromotion, direction: "up" | "down") {
    setItems((current) => {
      const ordered = [...current].sort((a, b) => a.priority - b.priority);
      const index = ordered.findIndex((item) => item.id === promotion.id);
      const targetIndex = direction === "up" ? Math.max(0, index - 1) : Math.min(ordered.length - 1, index + 1);
      if (index === targetIndex) {
        return current;
      }
      const next = [...ordered];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      const reordered = next.map((item, itemIndex) => ({ ...item, priority: itemIndex + 1 }));
      void Promise.all(
        reordered.map((item) =>
          adminApi<{ promotion: AdminPromotion }>(`promotions/${item.id}`, {
            method: "PATCH",
            body: JSON.stringify({ priority: item.priority })
          })
        )
      ).catch((error) => setNotice(`Promotion order sync failed: ${error instanceof Error ? error.message : "backend request failed"}`));
      return reordered;
    });
    setNotice(`${promotion.title} moved ${direction} in placement priority.`);
  }

  function connectCoupon(promotion: AdminPromotion) {
    const coupon = promotion.coupon === "NOCOUPON" ? `${promotion.title.replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase()}10` : promotion.coupon;
    void adminApi<{ promotion: AdminPromotion }>(`promotions/${promotion.id}`, {
      method: "PATCH",
      body: JSON.stringify({ coupon })
    })
      .then(({ promotion: savedPromotion }) => {
        setItems((current) => current.map((item) => (item.id === savedPromotion.id ? savedPromotion : item)));
        setSelectedPromotion((item) => (item.id === savedPromotion.id ? savedPromotion : item));
        setNotice(`${savedPromotion.coupon} connected to ${savedPromotion.title}. Client coupon messaging will follow this campaign.`);
      })
      .catch((error) => setNotice(`Coupon connection failed: ${error instanceof Error ? error.message : "backend request failed"}`));
  }

  function runPromotionSync() {
    const liveCount = items.filter((item) => item.status === "Live").length;
    const created: PromotionSyncEvent = {
      id: `SYNC-${901 + syncEvents.length}`,
      message: `${liveCount} live promotions synced to client active-promotion cache.`,
      time: "Just now"
    };
    setSyncEvents((current) => [created, ...current]);
    setNotice("Promotion cache cleared. Client website will request the latest active promotions from backend.");
  }

  function acknowledgeRisk(promotion: AdminPromotion) {
    setItems((current) => current.map((item) => (item.id === promotion.id ? { ...item, risk: "Low", riskNote: "Risk reviewed by owner." } : item)));
    setNotice(`${promotion.title} risk reviewed.`);
  }

  function savePromotionAnalytics(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updated: AdminPromotion = {
      ...selectedPromotion,
      views: Number(formData.get("views") || selectedPromotion.views),
      clicks: Number(formData.get("clicks") || selectedPromotion.clicks),
      conversions: Number(formData.get("conversions") || selectedPromotion.conversions),
      revenue: String(formData.get("revenue") || selectedPromotion.revenue).trim(),
      discountCost: String(formData.get("discountCost") || selectedPromotion.discountCost).trim(),
      roi: String(formData.get("roi") || selectedPromotion.roi).trim()
    };
    setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setSelectedPromotion(updated);
    setDialog(null);
    setNotice(`${updated.title} analytics saved.`);
  }

  function savePromotionRisk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updated: AdminPromotion = {
      ...selectedPromotion,
      risk: String(formData.get("risk") || selectedPromotion.risk) as AdminPromotion["risk"],
      status: String(formData.get("status") || selectedPromotion.status) as AdminPromotion["status"],
      riskNote: String(formData.get("riskNote") || selectedPromotion.riskNote).trim(),
      budgetUsed: String(formData.get("budgetUsed") || selectedPromotion.budgetUsed).trim(),
      discountCost: String(formData.get("discountCost") || selectedPromotion.discountCost).trim()
    };
    setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setSelectedPromotion(updated);
    setDialog(null);
    setNotice(`${updated.title} risk controls saved.`);
  }

  return (
    <>
      <div className="admin-notice">{notice}</div>
      <section className="reports-command">
        <div>
          <span>Campaign control</span>
          <h2>Promotions and placements</h2>
          <p>Manage homepage banners, category rails, cart drawer offers, audience targeting, campaign priority, and promotion status.</p>
          <div className="reports-tabs">
            {promotionTabs.map((tab) => (
              <button className={activeTab === tab ? "active" : ""} key={tab} type="button" onClick={() => { setActiveTab(tab); setNotice(`${tab} tab opened.`); }}>
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="reports-command-actions">
          <button className="primary-action" type="button" onClick={() => openPromotionDialog("create")}>Create promotion</button>
          <button type="button" onClick={() => openPromotionDialog("preview")}>Preview placement</button>
          <button type="button" onClick={runPromotionSync}>Sync client</button>
          <button type="button" onClick={() => { setActiveTab("Analytics"); setNotice("Promotion performance dashboard opened."); }}>Performance</button>
        </div>
      </section>
      <section className="reports-stat-grid">
        {stats.map((stat) => (
          <button key={stat.label} type="button" onClick={() => openStat(stat.label, stat.value)}>
            <div><span>{stat.label}</span><small>{stat.detail}</small></div>
            <strong>{stat.value}</strong>
          </button>
        ))}
      </section>

      {activeTab === "Overview" ? (
        <section className="reports-layout">
          <div className="reports-main-stack">
            <PromotionClientConnectionPanel promotions={items} syncEvents={syncEvents} onSync={runPromotionSync} />
            <PromotionCampaignTable promotions={items} onDuplicate={duplicatePromotion} onEdit={(promotion) => openPromotionDialog("edit", promotion)} onOpen={(promotion) => openPromotionDialog("preview", promotion)} onStatus={updateStatus} />
          </div>
          <div className="reports-side-stack">
            <PromotionPlacementPreview promotions={items} onMove={movePromotion} onOpen={(promotion) => openPromotionDialog("preview", promotion)} />
            <PromotionRiskMiniPanel promotions={items} onReview={(promotion) => openPromotionDialog("risk", promotion)} />
          </div>
        </section>
      ) : null}
      {activeTab === "Campaigns" ? <PromotionCampaignTable promotions={items} onDuplicate={duplicatePromotion} onEdit={(promotion) => openPromotionDialog("edit", promotion)} onOpen={(promotion) => openPromotionDialog("preview", promotion)} onStatus={updateStatus} /> : null}
      {activeTab === "Placements" ? <PromotionPlacementPanel promotions={items} onMove={movePromotion} onOpen={(promotion) => openPromotionDialog("preview", promotion)} onStatus={updateStatus} /> : null}
      {activeTab === "Audience" ? <PromotionAudiencePanel promotions={items} onEdit={(promotion) => openPromotionDialog("edit", promotion)} /> : null}
      {activeTab === "Product Mapping" ? <PromotionMappingPanel promotions={items} onEdit={(promotion) => openPromotionDialog("edit", promotion)} /> : null}
      {activeTab === "Coupons" ? <PromotionCouponsPanel promotions={items} onConnect={connectCoupon} onStatus={updateStatus} /> : null}
      {activeTab === "Schedule" ? <PromotionSchedulePanel promotions={items} onStatus={updateStatus} /> : null}
      {activeTab === "Analytics" ? <PromotionAnalyticsPanel promotions={items} onOpen={(promotion) => openPromotionDialog("analytics", promotion)} /> : null}
      {activeTab === "Risk" ? <PromotionRiskPanel promotions={items} onAcknowledge={acknowledgeRisk} onOpen={(promotion) => openPromotionDialog("risk", promotion)} onPause={(promotion) => updateStatus(promotion, "Paused")} /> : null}

      {dialog === "create" || dialog === "edit" ? (
        <PromotionFormModal dialog={dialog} nextPriority={items.length + 1} promotion={selectedPromotion} onClose={() => setDialog(null)} onSubmit={savePromotion} />
      ) : null}
      {dialog === "preview" ? (
        <PromotionPreviewModal promotion={selectedPromotion} onClose={() => setDialog(null)} onEdit={() => setDialog("edit")} onGoLive={() => updateStatus(selectedPromotion, "Live")} onSubmit={savePromotion} />
      ) : null}
      {dialog === "analytics" ? (
        <PromotionAnalyticsModal promotion={selectedPromotion} onClose={() => setDialog(null)} onSave={savePromotionAnalytics} />
      ) : null}
      {dialog === "risk" ? (
        <PromotionRiskModal promotion={selectedPromotion} onAcknowledge={() => { acknowledgeRisk(selectedPromotion); setDialog(null); }} onClose={() => setDialog(null)} onPause={() => { updateStatus(selectedPromotion, "Paused"); setDialog(null); }} onSave={savePromotionRisk} />
      ) : null}
    </>
  );
}

function PromotionClientConnectionPanel({ promotions, syncEvents, onSync }: { promotions: AdminPromotion[]; syncEvents: PromotionSyncEvent[]; onSync: () => void }) {
  const live = promotions.filter((promotion) => promotion.status === "Live").length;

  return (
    <section className="reports-panel promotion-connection-panel">
      <div className="reports-panel-head">
        <div><span>Client connection</span><h2>Admin to storefront flow</h2></div>
        <button type="button" onClick={onSync}>Sync client</button>
      </div>
      <div className="category-impact-grid">
        <article><span>Admin creates</span><strong>{promotions.length} campaigns</strong><small>Campaigns hold placement, audience, coupon, priority, schedule, and target URL.</small></article>
        <article><span>Backend filters</span><strong>{live} live</strong><small>Client receives only valid active campaigns for the requested placement.</small></article>
        <article><span>Client displays</span><strong>Priority sorted</strong><small>Homepage, footer, category, product, cart, checkout, and search placements.</small></article>
        <article><span>Cache</span><strong>{syncEvents[0]?.time || "Ready"}</strong><small>{syncEvents[0]?.message || "Saving a promotion should clear the active promotion cache in production."}</small></article>
      </div>
      <div className="promotion-sync-list">
        {syncEvents.slice(0, 3).map((event) => (
          <article key={event.id}>
            <strong>{event.id}</strong>
            <span>{event.message}</span>
            <small>{event.time}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function PromotionCampaignTable({
  promotions,
  onDuplicate,
  onEdit,
  onOpen,
  onStatus
}: {
  promotions: AdminPromotion[];
  onDuplicate: (promotion: AdminPromotion) => void;
  onEdit: (promotion: AdminPromotion) => void;
  onOpen: (promotion: AdminPromotion) => void;
  onStatus: (promotion: AdminPromotion, status: AdminPromotion["status"]) => void;
}) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head">
        <div><span>Promotions</span><h2>Campaign placement queue</h2></div>
      </div>
      <div className="report-table">
        <div className="report-row report-row-head module-row promotions"><span>Campaign</span><span>Placement</span><span>Audience</span><span>Budget</span><span>Status</span><span>Actions</span></div>
        {[...promotions].sort((a, b) => a.priority - b.priority).map((promotion) => (
          <div className="report-row module-row promotions" key={promotion.id}>
            <div><strong>{promotion.title}</strong><small>{promotion.id} · {promotion.type} · priority {promotion.priority}</small></div>
            <span>{promotion.placement}</span>
            <span>{promotion.audience}</span>
            <span>{promotion.budgetUsed} / {promotion.budget}</span>
            <Badge label={promotion.status} />
            <div className="report-actions">
              <button type="button" onClick={() => onOpen(promotion)}>Open</button>
              <button type="button" onClick={() => onEdit(promotion)}>Edit</button>
              <button type="button" onClick={() => onStatus(promotion, promotion.status === "Live" ? "Paused" : "Live")}>{promotion.status === "Live" ? "Pause" : "Go live"}</button>
              <button type="button" onClick={() => onDuplicate(promotion)}>Duplicate</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PromotionPlacementPreview({
  promotions,
  onMove,
  onOpen
}: {
  promotions: AdminPromotion[];
  onMove: (promotion: AdminPromotion, direction: "up" | "down") => void;
  onOpen: (promotion: AdminPromotion) => void;
}) {
  return (
    <section className="reports-panel compact">
      <div className="reports-panel-head">
        <div><span>Placements</span><h2>Client placement preview</h2></div>
      </div>
      <div className="promotion-placement-stack">
        {[...promotions].sort((a, b) => a.priority - b.priority).slice(0, 4).map((promotion) => (
          <article key={promotion.id}>
            <strong className="module-avatar">{promotion.image}</strong>
            <div><span>{promotion.placement}</span><h3>{promotion.title}</h3><small>{promotion.cta} · {promotion.targetUrl}</small></div>
            <div className="category-preview-actions">
              <button type="button" onClick={() => onMove(promotion, "up")}>Up</button>
              <button type="button" onClick={() => onMove(promotion, "down")}>Down</button>
              <button type="button" onClick={() => onOpen(promotion)}>Open</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PromotionRiskMiniPanel({ promotions, onReview }: { promotions: AdminPromotion[]; onReview: (promotion: AdminPromotion) => void }) {
  const risky = promotions.filter((promotion) => promotion.risk !== "Low");

  return (
    <section className="reports-panel compact">
      <div className="reports-panel-head">
        <div><span>Risk</span><h2>Budget guardrails</h2></div>
      </div>
      <div className="report-export-list">
        {(risky.length ? risky : promotions.slice(0, 2)).map((promotion) => (
          <article key={promotion.id}>
            <div><strong>{promotion.title}</strong><span>{promotion.riskNote}</span></div>
            <Badge label={promotion.risk} />
            <div className="report-actions"><button type="button" onClick={() => onReview(promotion)}>Review</button></div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PromotionPlacementPanel({ promotions, onMove, onOpen, onStatus }: { promotions: AdminPromotion[]; onMove: (promotion: AdminPromotion, direction: "up" | "down") => void; onOpen: (promotion: AdminPromotion) => void; onStatus: (promotion: AdminPromotion, status: AdminPromotion["status"]) => void }) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head">
        <div><span>Placements</span><h2>Storefront display control</h2></div>
      </div>
      <div className="report-table">
        <div className="report-row report-row-head promotion-placement-row"><span>Priority</span><span>Placement</span><span>Campaign</span><span>Target</span><span>Status</span><span>Actions</span></div>
        {[...promotions].sort((a, b) => a.priority - b.priority).map((promotion) => (
          <div className="report-row promotion-placement-row" key={promotion.id}>
            <strong className="module-avatar">{promotion.priority}</strong>
            <span>{promotion.placement}</span>
            <div><strong>{promotion.title}</strong><small>{promotion.type} · {promotion.cta}</small></div>
            <span>{promotion.targetUrl}</span>
            <Badge label={promotion.status} />
            <div className="report-actions">
              <button type="button" onClick={() => onMove(promotion, "up")}>Up</button>
              <button type="button" onClick={() => onMove(promotion, "down")}>Down</button>
              <button type="button" onClick={() => onOpen(promotion)}>Preview</button>
              <button type="button" onClick={() => onStatus(promotion, promotion.status === "Live" ? "Paused" : "Live")}>{promotion.status === "Live" ? "Pause" : "Go live"}</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PromotionAudiencePanel({ promotions, onEdit }: { promotions: AdminPromotion[]; onEdit: (promotion: AdminPromotion) => void }) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head">
        <div><span>Audience</span><h2>Targeting rules</h2></div>
      </div>
      <div className="report-export-list">
        {promotions.map((promotion) => (
          <article key={promotion.id}>
            <div><strong>{promotion.audience}</strong><span>{promotion.title} · {promotion.value} · {promotion.placement}</span></div>
            <Badge label={promotion.status} />
            <div className="report-actions"><button type="button" onClick={() => onEdit(promotion)}>Edit audience</button></div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PromotionMappingPanel({ promotions, onEdit }: { promotions: AdminPromotion[]; onEdit: (promotion: AdminPromotion) => void }) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head">
        <div><span>Mapping</span><h2>Category and product promotion mapping</h2></div>
      </div>
      <div className="report-table">
        <div className="report-row report-row-head promotion-mapping-row"><span>Campaign</span><span>Mapped to</span><span>Type</span><span>Coupon</span><span>Actions</span></div>
        {promotions.map((promotion) => (
          <div className="report-row promotion-mapping-row" key={promotion.id}>
            <div><strong>{promotion.title}</strong><small>{promotion.id}</small></div>
            <span>{promotion.mappedTo}</span>
            <span>{promotion.type}</span>
            <Badge label={promotion.coupon} />
            <div className="report-actions">
              <button type="button" onClick={() => onEdit(promotion)}>Change mapping</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PromotionCouponsPanel({ promotions, onConnect, onStatus }: { promotions: AdminPromotion[]; onConnect: (promotion: AdminPromotion) => void; onStatus: (promotion: AdminPromotion, status: AdminPromotion["status"]) => void }) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head">
        <div><span>Coupons</span><h2>Promotion coupon links</h2></div>
      </div>
      <div className="report-export-list">
        {promotions.map((promotion) => (
          <article key={promotion.id}>
            <div><strong>{promotion.coupon}</strong><span>{promotion.title} · {promotion.value} · used {promotion.discountCost}</span></div>
            <Badge label={promotion.couponState} />
            <div className="report-actions">
              <button type="button" onClick={() => onConnect(promotion)}>Connect coupon</button>
              <button type="button" onClick={() => onStatus(promotion, "Paused")}>Pause linked promo</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PromotionSchedulePanel({ promotions, onStatus }: { promotions: AdminPromotion[]; onStatus: (promotion: AdminPromotion, status: AdminPromotion["status"]) => void }) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head">
        <div><span>Schedule</span><h2>Campaign calendar</h2></div>
      </div>
      <div className="report-table">
        <div className="report-row report-row-head promotion-schedule-row"><span>Campaign</span><span>Starts</span><span>Ends</span><span>Status</span><span>Actions</span></div>
        {promotions.map((promotion) => (
          <div className="report-row promotion-schedule-row" key={promotion.id}>
            <div><strong>{promotion.title}</strong><small>{promotion.type}</small></div>
            <span>{promotion.startsAt}</span>
            <span>{promotion.endsAt}</span>
            <Badge label={promotion.status} />
            <div className="report-actions">
              <button type="button" onClick={() => onStatus(promotion, "Scheduled")}>Schedule</button>
              <button type="button" onClick={() => onStatus(promotion, "Expired")}>Expire</button>
              <button type="button" onClick={() => onStatus(promotion, "Live")}>Start now</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PromotionAnalyticsPanel({ promotions, onOpen }: { promotions: AdminPromotion[]; onOpen: (promotion: AdminPromotion) => void }) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head">
        <div><span>Analytics</span><h2>Campaign performance</h2></div>
      </div>
      <div className="report-table">
        <div className="report-row report-row-head promotion-analytics-row"><span>Campaign</span><span>Views</span><span>Clicks</span><span>Revenue</span><span>ROI</span><span>Actions</span></div>
        {promotions.map((promotion) => (
          <div className="report-row promotion-analytics-row" key={promotion.id}>
            <div><strong>{promotion.title}</strong><small>{promotion.conversions} conversions · {promotion.discountCost} cost</small></div>
            <span>{promotion.views.toLocaleString()}</span>
            <span>{promotion.clicks.toLocaleString()}</span>
            <span>{promotion.revenue}</span>
            <Badge label={promotion.roi} />
            <div className="report-actions"><button type="button" onClick={() => onOpen(promotion)}>Open analytics</button></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PromotionRiskPanel({ promotions, onAcknowledge, onOpen, onPause }: { promotions: AdminPromotion[]; onAcknowledge: (promotion: AdminPromotion) => void; onOpen: (promotion: AdminPromotion) => void; onPause: (promotion: AdminPromotion) => void }) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head">
        <div><span>Risk</span><h2>Budget and abuse review</h2></div>
      </div>
      <div className="report-export-list">
        {promotions.map((promotion) => (
          <article key={promotion.id}>
            <div><strong>{promotion.title}</strong><span>{promotion.riskNote} · {promotion.budgetUsed} / {promotion.budget} · {promotion.discountCost} discount cost</span></div>
            <Badge label={promotion.risk} />
            <div className="report-actions">
              <button type="button" onClick={() => onOpen(promotion)}>Open risk</button>
              <button type="button" onClick={() => onAcknowledge(promotion)}>Approve</button>
              <button type="button" onClick={() => onPause(promotion)}>Pause</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PromotionFormModal({ dialog, nextPriority, promotion, onClose, onSubmit }: { dialog: "create" | "edit"; nextPriority: number; promotion: AdminPromotion; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const isCreate = dialog === "create";

  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSubmit}>
        <div className="product-dialog-head">
          <div><span>Promotion</span><h3>{isCreate ? "Create promotion" : "Edit promotion"}</h3></div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <div className="settings-form-grid">
          <label><span>Title</span><input name="title" defaultValue={isCreate ? "" : promotion.title} required /></label>
          <label><span>Type</span><select name="type" defaultValue={isCreate ? "Homepage banner" : promotion.type}><option>Homepage banner</option><option>Footer banner</option><option>Category offer</option><option>Cart offer</option><option>Product badge</option><option>Delivery offer</option><option>Checkout message</option><option>Flash sale</option></select></label>
          <label><span>Placement</span><input name="placement" defaultValue={isCreate ? "Homepage hero" : promotion.placement} /></label>
          <label><span>Audience</span><input name="audience" defaultValue={isCreate ? "All customers" : promotion.audience} /></label>
          <label><span>Status</span><select name="status" defaultValue={isCreate ? "Scheduled" : promotion.status}><option>Live</option><option>Scheduled</option><option>Paused</option><option>Expired</option></select></label>
          <label><span>Priority</span><input min="1" name="priority" defaultValue={isCreate ? nextPriority : promotion.priority} type="number" /></label>
          <label><span>Offer value</span><input name="value" defaultValue={isCreate ? "10% off" : promotion.value} /></label>
          <label><span>Budget</span><input name="budget" defaultValue={isCreate ? "Rs. 5K" : promotion.budget} /></label>
          <label><span>Coupon</span><input name="coupon" defaultValue={isCreate ? "NOCOUPON" : promotion.coupon} /></label>
          <label><span>CTA</span><input name="cta" defaultValue={isCreate ? "Shop now" : promotion.cta} /></label>
          <label><span>Target URL</span><input name="targetUrl" defaultValue={isCreate ? "/" : promotion.targetUrl} /></label>
          <label><span>Mapped to</span><input name="mappedTo" defaultValue={isCreate ? "All store" : promotion.mappedTo} /></label>
          <label><span>Starts at</span><input name="startsAt" defaultValue={isCreate ? "Next window" : promotion.startsAt} /></label>
          <label><span>Ends at</span><input name="endsAt" defaultValue={isCreate ? "Campaign end" : promotion.endsAt} /></label>
          <label><span>Image code</span><input name="image" defaultValue={isCreate ? "" : promotion.image} /></label>
        </div>
        <div className="product-dialog-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">{isCreate ? "Save promotion" : "Update promotion"}</button>
        </div>
      </form>
    </div>
  );
}

function PromotionPreviewModal({ promotion, onClose, onEdit, onGoLive, onSubmit }: { promotion: AdminPromotion; onClose: () => void; onEdit: () => void; onGoLive: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSubmit}>
        <div className="product-dialog-head">
          <div><span>{promotion.id}</span><h3>{promotion.title}</h3></div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <div className="promotion-preview-card">
          <strong className="module-avatar">{promotion.image}</strong>
          <div>
            <span>{promotion.placement}</span>
            <h3>{promotion.title}</h3>
            <p>{promotion.value} for {promotion.audience}. CTA: {promotion.cta}</p>
            <small>Client API placement: GET /promotions/active?placement={promotion.placement.toLowerCase().replaceAll(" ", "-")}</small>
          </div>
        </div>
        <div className="settings-form-grid">
          <label className="settings-wide"><span>Promotion title</span><input name="title" defaultValue={promotion.title} required /></label>
          <label><span>Type</span><select name="type" defaultValue={promotion.type}><option>Homepage banner</option><option>Footer banner</option><option>Category offer</option><option>Cart offer</option><option>Product badge</option><option>Delivery offer</option><option>Checkout message</option><option>Flash sale</option></select></label>
          <label><span>Placement</span><input name="placement" defaultValue={promotion.placement} /></label>
          <label><span>Audience</span><input name="audience" defaultValue={promotion.audience} /></label>
          <label><span>Status</span><select name="status" defaultValue={promotion.status}><option>Live</option><option>Scheduled</option><option>Paused</option><option>Expired</option></select></label>
          <label><span>Priority</span><input name="priority" type="number" defaultValue={promotion.priority} /></label>
          <label><span>CTA</span><input name="cta" defaultValue={promotion.cta} /></label>
          <label><span>Budget</span><input name="budget" defaultValue={promotion.budget} /></label>
          <label><span>Value</span><input name="value" defaultValue={promotion.value} /></label>
          <label><span>Coupon</span><input name="coupon" defaultValue={promotion.coupon} /></label>
          <label><span>Target URL</span><input name="targetUrl" defaultValue={promotion.targetUrl} /></label>
          <label><span>Starts</span><input name="startsAt" defaultValue={promotion.startsAt} /></label>
          <label><span>Ends</span><input name="endsAt" defaultValue={promotion.endsAt} /></label>
          <label><span>Mapped to</span><input name="mappedTo" defaultValue={promotion.mappedTo} /></label>
          <label><span>Image code</span><input name="image" defaultValue={promotion.image} /></label>
        </div>
        <div className="product-dialog-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button" onClick={onEdit}>Edit promotion</button>
          <button type="button" onClick={onGoLive}>Go live</button>
          <button type="submit">Save preview</button>
        </div>
      </form>
    </div>
  );
}

function PromotionAnalyticsModal({ promotion, onClose, onSave }: { promotion: AdminPromotion; onClose: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSave}>
        <div className="product-dialog-head">
          <div><span>Analytics</span><h3>{promotion.title}</h3></div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <div className="settings-form-grid">
          <label><span>Views</span><input min="0" name="views" type="number" defaultValue={promotion.views} /></label>
          <label><span>Clicks</span><input min="0" name="clicks" type="number" defaultValue={promotion.clicks} /></label>
          <label><span>Conversions</span><input min="0" name="conversions" type="number" defaultValue={promotion.conversions} /></label>
          <label><span>Revenue</span><input name="revenue" defaultValue={promotion.revenue} /></label>
          <label><span>Discount cost</span><input name="discountCost" defaultValue={promotion.discountCost} /></label>
          <label><span>ROI</span><input name="roi" defaultValue={promotion.roi} /></label>
        </div>
        <div className="product-dialog-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">Save analytics</button>
        </div>
      </form>
    </div>
  );
}

function PromotionRiskModal({ promotion, onAcknowledge, onClose, onPause, onSave }: { promotion: AdminPromotion; onAcknowledge: () => void; onClose: () => void; onPause: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSave}>
        <div className="product-dialog-head">
          <div><span>Risk review</span><h3>{promotion.title}</h3></div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <div className="settings-form-grid">
          <label><span>Risk level</span><select name="risk" defaultValue={promotion.risk}><option>Low</option><option>Medium</option><option>High</option></select></label>
          <label><span>Status</span><select name="status" defaultValue={promotion.status}><option>Live</option><option>Scheduled</option><option>Paused</option><option>Expired</option></select></label>
          <label><span>Budget used</span><input name="budgetUsed" defaultValue={promotion.budgetUsed} /></label>
          <label><span>Discount cost</span><input name="discountCost" defaultValue={promotion.discountCost} /></label>
          <label className="settings-wide"><span>Risk note</span><textarea name="riskNote" defaultValue={promotion.riskNote} rows={4} /></label>
        </div>
        <div className="product-dialog-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button" onClick={onAcknowledge}>Approve risk</button>
          <button type="button" onClick={onPause}>Pause campaign</button>
          <button type="submit">Save review</button>
        </div>
      </form>
    </div>
  );
}

function ProductCatalogTable({
  items,
  query,
  onEdit,
  onImage,
  onQueryChange,
  onStock
}: {
  items: AdminProduct[];
  query: string;
  onEdit: (product: AdminProduct) => void;
  onImage: (product: AdminProduct) => void;
  onQueryChange: (query: string) => void;
  onStock: (product: AdminProduct) => void;
}) {
  return (
    <section className="product-catalog">
      <div className="product-catalog-head">
        <div>
          <span>Catalog</span>
          <h2>Product list</h2>
        </div>
        <label>
          <span>Search</span>
          <input
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search product, SKU, category"
            value={query}
          />
        </label>
      </div>
      <div className="product-table">
        <div className="product-row product-row-head">
          <span>Product</span>
          <span>Category</span>
          <span>Price</span>
          <span>Stock</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {items.map((product) => (
          <div className="product-row" key={product.sku}>
            <div className="product-cell">
              <span className={product.imageFile ? "product-thumb has-image" : "product-thumb"}>
                {product.imageFile ? (
                  <img alt={product.name} src={product.imageFile} />
                ) : (
                  product.name.slice(0, 2).toUpperCase()
                )}
              </span>
              <div>
                <strong>{product.name}</strong>
                <small>{product.sku}{product.imageFile ? ` · ${productImageLabel(product.imageFile)}` : ""}</small>
              </div>
            </div>
            <span>{product.category}</span>
            <div className="price-cell">
              <strong>{product.price}</strong>
              <small>{product.sale}</small>
            </div>
            <Badge label={product.stock} />
            <Badge label={product.status} />
            <div className="row-actions">
              <button type="button" onClick={() => onEdit(product)}>Edit</button>
              <button type="button" onClick={() => onStock(product)}>Stock</button>
              <button type="button" onClick={() => onImage(product)}>Image</button>
            </div>
          </div>
        ))}
        {items.length === 0 ? (
          <div className="product-empty">No products found. Try another search.</div>
        ) : null}
      </div>
    </section>
  );
}

function ProductDialogModal({
  dialog,
  draft,
  filteredCount,
  products,
  visibleProducts,
  categories,
  onClose,
  onDraftChange,
  onSubmit
}: {
  dialog: Exclude<ProductDialog, null>;
  draft: AdminProduct;
  filteredCount: number;
  products: AdminProduct[];
  visibleProducts: AdminProduct[];
  categories: AdminCategory[];
  onClose: () => void;
  onDraftChange: (product: AdminProduct) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const title =
    dialog === "add"
      ? "Add product"
      : dialog === "edit"
        ? "Edit product"
        : dialog === "stock"
          ? "Update stock"
          : dialog === "upload"
            ? "Upload image"
            : "Bulk availability update";
  const [bulkScope, setBulkScope] = useState("visible");
  const [bulkStatus, setBulkStatus] = useState("Active");
  const [bulkStock, setBulkStock] = useState("Keep current");
  const visibleSkus = new Set(visibleProducts.map((product) => product.sku));
  const bulkPreviewCount = products.filter((product) =>
    bulkScope === "all" ||
    (bulkScope === "visible" && visibleSkus.has(product.sku)) ||
    (bulkScope === "paused" && product.status === "Paused") ||
    (bulkScope === "low-stock" && product.stock === "Low stock") ||
    (bulkScope === "out-of-stock" && product.stock === "Out of stock")
  ).length;

  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog" onSubmit={onSubmit}>
        <div className="product-dialog-head">
          <div>
            <span>Products</span>
            <h3>{title}</h3>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>

        {dialog === "add" || dialog === "edit" ? (
          <div className="product-form-grid">
            <label>
              Product name
              <input
                required
                value={draft.name}
                onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
              />
            </label>
            <label>
              SKU
              <input
                required
                value={draft.sku}
                onChange={(event) => onDraftChange({ ...draft, sku: event.target.value })}
              />
            </label>
            <label>
              Category
              <select
                value={draft.category}
                onChange={(event) => {
                  const selected = categories.find((category) => category.name === event.target.value);
                  onDraftChange({
                    ...draft,
                    category: event.target.value,
                    categorySlug: selected?.slug ?? draft.categorySlug
                  });
                }}
              >
                {categories.length === 0 ? <option value="">Create a category first</option> : null}
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </select>
            </label>
            <label>
              Price
              <input
                value={draft.price}
                onChange={(event) => onDraftChange({ ...draft, price: event.target.value })}
              />
            </label>
            <label>
              Sale price
              <input
                value={draft.sale}
                onChange={(event) => onDraftChange({ ...draft, sale: event.target.value })}
              />
            </label>
            <label>
              Badge
              <input
                value={draft.badge}
                onChange={(event) => onDraftChange({ ...draft, badge: event.target.value })}
              />
            </label>
            <label className="settings-wide">
              Product image URL
              <input
                name="imageFile"
                placeholder="/images/products/product.jpg or https://..."
                value={draft.imageFile || ""}
                onChange={(event) => onDraftChange({ ...draft, imageFile: event.target.value })}
              />
            </label>
            <label className="settings-wide">
              Upload image
              <input
                accept="image/*"
                type="file"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === "string") {
                      onDraftChange({ ...draft, imageFile: reader.result });
                    }
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <small>{draft.imageFile ? `Selected: ${productImageLabel(draft.imageFile)}` : "Choose a product image or paste an image URL above."}</small>
            </label>
            {draft.imageFile ? (
              <div className="product-image-preview settings-wide">
                <span>Preview</span>
                <img alt={draft.name || "Product preview"} src={draft.imageFile} />
              </div>
            ) : null}
          </div>
        ) : null}

        {dialog === "stock" ? (
          <div className="product-form-grid">
            <label>
              Product
              <input readOnly value={draft.name} />
            </label>
            <label>
              Stock
              <select value={draft.stock} onChange={(event) => onDraftChange({ ...draft, stock: event.target.value })}>
                <option>In stock</option>
                <option>Low stock</option>
                <option>Out of stock</option>
              </select>
            </label>
            <label>
              Status
              <select value={draft.status} onChange={(event) => onDraftChange({ ...draft, status: event.target.value })}>
                <option>Active</option>
                <option>Paused</option>
              </select>
            </label>
          </div>
        ) : null}

        {dialog === "upload" ? (
          <div className="product-form-grid">
            <label>
              Product
              <select
                value={draft.sku}
                onChange={(event) => {
                  const selected = products.find((product) => product.sku === event.target.value);
                  if (selected) {
                    onDraftChange(selected);
                  }
                }}
              >
                {products.map((product) => (
                  <option key={product.sku} value={product.sku}>{product.name}</option>
                ))}
              </select>
            </label>
            <label>
              Image URL
              <input
                name="imageFile"
                placeholder="/images/products/product.jpg or https://..."
                value={draft.imageFile || ""}
                onChange={(event) => onDraftChange({ ...draft, imageFile: event.target.value })}
              />
            </label>
            <label>
              Saved image
              <input readOnly value={draft.imageFile || "No image selected"} />
            </label>
            <label className="settings-wide">
              Upload replacement image
              <input
                accept="image/*"
                type="file"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === "string") {
                      onDraftChange({ ...draft, imageFile: reader.result });
                    }
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <small>{draft.imageFile ? `Selected: ${productImageLabel(draft.imageFile)}` : "Choose a product image for the admin and client catalog."}</small>
            </label>
            {draft.imageFile ? (
              <div className="product-image-preview settings-wide">
                <span>Preview</span>
                <img alt={draft.name || "Product preview"} src={draft.imageFile} />
              </div>
            ) : null}
          </div>
        ) : null}

        {dialog === "bulk" ? (
          <div className="product-form-grid">
            <div className="bulk-purpose settings-wide">
              <span>What bulk availability means</span>
              <p>
                Use this when the store must change many products together: publish seasonal products, pause a supplier batch, mark sold-out items, or return low-stock items to active inventory after a purchase entry.
              </p>
              <div>
                <strong>{bulkPreviewCount}</strong>
                <small>products will be targeted with status {bulkStatus} and stock {bulkStock}.</small>
              </div>
            </div>
            <label>
              Update scope
              <select name="scope" value={bulkScope} onChange={(event) => setBulkScope(event.target.value)}>
                <option value="visible">Visible search results ({filteredCount})</option>
                <option value="all">All products ({products.length})</option>
                <option value="paused">Paused products</option>
                <option value="low-stock">Low stock products</option>
                <option value="out-of-stock">Out of stock products</option>
              </select>
            </label>
            <label>
              Product status
              <select name="targetStatus" value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value)}>
                <option>Active</option>
                <option>Paused</option>
              </select>
            </label>
            <label>
              Stock status
              <select name="targetStock" value={bulkStock} onChange={(event) => setBulkStock(event.target.value)}>
                <option>Keep current</option>
                <option>In stock</option>
                <option>Low stock</option>
                <option>Out of stock</option>
              </select>
            </label>
            <label className="settings-wide">
              Reason / audit note
              <input name="reason" defaultValue="Bulk catalog status update" required />
            </label>
          </div>
        ) : null}

        <div className="product-dialog-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">{dialog === "bulk" ? "Apply bulk update" : "Save changes"}</button>
        </div>
      </form>
    </div>
  );
}

function OrdersView() {
  const [orderQueue, setOrderQueue] = usePersistentState<AdminOrder[]>("orders:queue", orders);
  const [activeFilter, setActiveFilter] = useState<OrderFilter>("All");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder>(orders[0]);
  const [orderDialog, setOrderDialog] = useState<OrderDialog>(null);
  const [orderNotice, setOrderNotice] = useState("Orders control center is active.");

  const visibleOrders = useMemo(() => {
    if (activeFilter === "All") {
      return orderQueue;
    }
    if (activeFilter === "COD") {
      return orderQueue.filter((order) => order.payment.includes("COD"));
    }
    return orderQueue.filter((order) => order.status === activeFilter);
  }, [activeFilter, orderQueue]);

  const orderStats = [
    { label: "Active orders", value: orderQueue.length, detail: "Across current slots" },
    { label: "Packed", value: orderQueue.filter((order) => order.status === "Packed").length, detail: "Ready for handoff" },
    { label: "COD pending", value: orderQueue.filter((order) => order.payment.includes("COD")).length, detail: "Collect at doorstep" }
  ];

  function updateFirstMatchingOrder(
    matcher: (order: AdminOrder) => boolean,
    updater: (order: AdminOrder) => AdminOrder,
    emptyMessage: string,
    successMessage: (order: AdminOrder) => string
  ) {
    const target = orderQueue.find(matcher);
    if (!target) {
      setOrderNotice(emptyMessage);
      return;
    }

    setOrderQueue((items) => items.map((order) => (order.id === target.id ? updater(order) : order)));
    setOrderNotice(successMessage(target));
  }

  function confirmOrder() {
    updateFirstMatchingOrder(
      (order) => order.status === "Confirmed",
      (order) => ({ ...order, status: "Packed", fulfillment: "Packed" }),
      "No confirmed orders are waiting right now.",
      (order) => `${order.id} confirmed and moved to Packed.`
    );
  }

  function markPacked() {
    updateFirstMatchingOrder(
      (order) => order.status !== "Packed" && order.status !== "Out for delivery",
      (order) => ({ ...order, status: "Packed", fulfillment: "Packed" }),
      "All available orders are already packed or out for delivery.",
      (order) => `${order.id} marked as packed.`
    );
  }

  function assignFirstDelivery() {
    const target = orderQueue.find((order) => order.status === "Packed") ?? orderQueue[0];
    setSelectedOrder(target);
    setOrderDialog("assign");
  }

  function openOrder(order: AdminOrder) {
    setSelectedOrder(order);
    setOrderDialog("open");
  }

  function assignOrder(order: AdminOrder) {
    setSelectedOrder(order);
    setOrderDialog("assign");
  }

  function saveAssignment() {
    setOrderQueue((items) =>
      items.map((order) =>
        order.id === selectedOrder.id
          ? { ...order, status: "Out for delivery", fulfillment: "Out for delivery" }
          : order
      )
    );
    setOrderNotice(`${selectedOrder.id} assigned to delivery.`);
    setOrderDialog(null);
  }

  function saveOrderUpdate(updatedOrder: AdminOrder, message: string) {
    setOrderQueue((items) => items.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)));
    setSelectedOrder(updatedOrder);
    setOrderNotice(message);
    setOrderDialog(null);
  }

  return (
    <>
      {orderNotice ? <div className="admin-notice">{orderNotice}</div> : null}
      <section className="order-command">
        <div>
          <span>Order control</span>
          <h2>Order operations</h2>
          <p>Review live grocery orders, confirm packing, assign delivery, track payment state, and contact customers quickly.</p>
        </div>
        <div className="order-command-actions">
          <button className="primary-action" type="button" onClick={confirmOrder}>Confirm order</button>
          <button type="button" onClick={markPacked}>Mark packed</button>
          <button type="button" onClick={assignFirstDelivery}>Assign delivery</button>
        </div>
      </section>
      <section className="order-stat-grid">
        {orderStats.map((stat) => (
          <article key={stat.label}>
            <div>
              <span>{stat.label}</span>
              <small>{stat.detail}</small>
            </div>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>
      <OrderQueue
        activeFilter={activeFilter}
        items={visibleOrders}
        onAssign={assignOrder}
        onFilterChange={setActiveFilter}
        onOpen={openOrder}
      />
      {orderDialog ? (
        <OrderDialogModal
          dialog={orderDialog}
          order={selectedOrder}
          onAssign={saveAssignment}
          onClose={() => setOrderDialog(null)}
          onSave={saveOrderUpdate}
        />
      ) : null}
    </>
  );
}

function OrderQueue({
  activeFilter,
  items,
  onAssign,
  onFilterChange,
  onOpen
}: {
  activeFilter: OrderFilter;
  items: AdminOrder[];
  onAssign: (order: AdminOrder) => void;
  onFilterChange: (filter: OrderFilter) => void;
  onOpen: (order: AdminOrder) => void;
}) {
  const filters: OrderFilter[] = ["All", "Packed", "Out for delivery", "COD"];

  return (
    <section className="order-queue">
      <div className="order-queue-head">
        <div>
          <span>Queue</span>
          <h2>Live order queue</h2>
        </div>
        <div className="order-filters">
          {filters.map((filter) => (
            <button
              className={activeFilter === filter ? "active" : ""}
              key={filter}
              type="button"
              onClick={() => onFilterChange(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
      <div className="order-list">
        {items.map((order) => (
          <article className="order-card" key={order.id}>
            <div className="order-main">
              <div className="order-id-row">
                <span className="order-id">{order.id}</span>
                <span className="order-age">Live</span>
              </div>
              <h3>{order.customer}</h3>
              <small>{order.phone}</small>
            </div>
            <div className="order-meta">
              <span>Status</span>
              <Badge label={order.status} />
            </div>
            <div className="order-meta">
              <span>Fulfillment</span>
              <strong>{order.fulfillment}</strong>
              <div className="order-progress" aria-hidden="true">
                <span className="done" />
                <span className={order.status === "Packed" || order.status === "Out for delivery" ? "done" : ""} />
                <span className={order.status === "Out for delivery" ? "done" : ""} />
              </div>
            </div>
            <div className="order-meta">
              <span>Payment</span>
              <strong>{order.payment}</strong>
            </div>
            <div className="order-meta">
              <span>Slot</span>
              <strong>{order.slot}</strong>
            </div>
            <div className="order-total">
              <span>Total</span>
              <strong>{order.total}</strong>
            </div>
            <div className="row-actions">
              <button type="button" onClick={() => onOpen(order)}>Open</button>
              <button type="button" onClick={() => onAssign(order)}>Assign</button>
            </div>
          </article>
        ))}
        {items.length === 0 ? <div className="order-empty">No orders match this filter.</div> : null}
      </div>
    </section>
  );
}

function OrderDialogModal({
  dialog,
  order,
  onAssign,
  onClose,
  onSave
}: {
  dialog: Exclude<OrderDialog, null>;
  order: AdminOrder;
  onAssign: () => void;
  onClose: () => void;
  onSave: (order: AdminOrder, message: string) => void;
}) {
  const [draft, setDraft] = useState<AdminOrder>(order);
  const [rider, setRider] = useState("Rhea");
  const [handoffNote, setHandoffNote] = useState("Packed bags verified. Keep frozen items upright.");

  function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (dialog === "assign") {
      onSave(
        { ...draft, status: "Out for delivery", fulfillment: `Assigned to ${rider}` },
        `${draft.id} assigned to ${rider}. Note: ${handoffNote}`
      );
      return;
    }
    onSave(draft, `${draft.id} order details updated.`);
  }

  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog order-dialog" onSubmit={submitOrder}>
        <div className="product-dialog-head">
          <div>
            <span>{order.id}</span>
            <h3>{dialog === "assign" ? "Assign delivery" : "Order detail"}</h3>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <div className="order-dialog-grid">
          <label>
            <span>Customer</span>
            <input value={draft.customer} onChange={(event) => setDraft({ ...draft, customer: event.target.value })} />
          </label>
          <label>
            <span>Phone</span>
            <input value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} />
          </label>
          <label>
            <span>Status</span>
            <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
              <option>Confirmed</option>
              <option>Packed</option>
              <option>Out for delivery</option>
              <option>Delivered</option>
              <option>Cancelled</option>
            </select>
          </label>
          <label>
            <span>Fulfillment</span>
            <input value={draft.fulfillment} onChange={(event) => setDraft({ ...draft, fulfillment: event.target.value })} />
          </label>
          <label>
            <span>Payment</span>
            <select value={draft.payment} onChange={(event) => setDraft({ ...draft, payment: event.target.value })}>
              <option>COD pending</option>
              <option>Paid</option>
              <option>Online paid</option>
              <option>Refund pending</option>
              <option>Failed</option>
            </select>
          </label>
          <label>
            <span>Delivery slot</span>
            <input value={draft.slot} onChange={(event) => setDraft({ ...draft, slot: event.target.value })} />
          </label>
          <label>
            <span>Total</span>
            <input value={draft.total} onChange={(event) => setDraft({ ...draft, total: event.target.value })} />
          </label>
          {dialog === "assign" ? (
            <>
              <label>
                <span>Rider</span>
                <select value={rider} onChange={(event) => setRider(event.target.value)}>
                  <option>Rhea</option>
                  <option>Rider 07</option>
                  <option>Aman Dispatch</option>
                  <option>South Hub Runner</option>
                </select>
              </label>
              <label className="settings-wide">
                <span>Handoff note</span>
                <input value={handoffNote} onChange={(event) => setHandoffNote(event.target.value)} />
              </label>
            </>
          ) : null}
        </div>
        <div className="product-dialog-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          {dialog === "assign" ? (
            <button type="submit">Assign now</button>
          ) : (
            <button type="submit">Save order</button>
          )}
        </div>
      </form>
    </div>
  );
}

function InventoryView() {
  const initialInventory: AdminInventoryItem[] = inventory.map((item, index) => ({
    ...item,
    batch: ["MILK-B2 / B3", "BAN-FRESH-09", "No active batch"][index],
    supplier: ["A2 Dairy Co.", "Farm Fresh Collective", "Eco Home Supply"][index]
  }));
  const [stockItems, setStockItems] = usePersistentState<AdminInventoryItem[]>("inventory:stock-items", initialInventory);
  const [activeInventoryFilter, setActiveInventoryFilter] = useState<InventoryFilter>("All stock");
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<AdminInventoryItem>(emptyAdminInventoryItem);
  const [inventoryDialog, setInventoryDialog] = useState<InventoryDialog>(null);
  const [inventoryNotice, setInventoryNotice] = useState("Inventory control center is active.");

  const visibleInventory = useMemo(() => {
    if (activeInventoryFilter === "Low stock") {
      return stockItems.filter((item) => item.status !== "In stock");
    }
    if (activeInventoryFilter === "Expiry") {
      return stockItems.filter((item) => item.expiry.toLowerCase().includes("expiring") || item.expiry.toLowerCase().includes("no active"));
    }
    return stockItems;
  }, [activeInventoryFilter, stockItems]);

  const inventoryStats = [
    { label: "Total stock", value: stockItems.reduce((total, item) => total + item.stock, 0), detail: "Units across batches" },
    { label: "Reserved", value: stockItems.reduce((total, item) => total + item.reserved, 0), detail: "Committed to orders" },
    { label: "Low alerts", value: stockItems.filter((item) => item.status !== "In stock").length, detail: "Need attention" }
  ];

  function openInventoryDialog(dialog: Exclude<InventoryDialog, null>, item = stockItems[0]) {
    if (!item?.sku) {
      setInventoryNotice("Create inventory from real products before opening stock dialogs.");
      return;
    }
    setSelectedInventoryItem(item);
    setInventoryDialog(dialog);
  }

  function saveInventoryItem(item: AdminInventoryItem, message: string) {
    setStockItems((items) => items.map((stockItem) => (stockItem.sku === item.sku ? item : stockItem)));
    setSelectedInventoryItem(item);
    setInventoryNotice(message);
    setInventoryDialog(null);
  }

  function addPurchaseEntry() {
    openInventoryDialog("purchase", selectedInventoryItem);
  }

  return (
    <>
      {inventoryNotice ? <div className="admin-notice">{inventoryNotice}</div> : null}
      <section className="inventory-command">
        <div>
          <span>Stock control</span>
          <h2>Detailed inventory</h2>
          <p>Monitor stock counts, reserved quantity, available units, thresholds, expiry batches, suppliers, and audit-ready adjustments.</p>
        </div>
        <div className="inventory-command-actions">
          <button className="primary-action" type="button" onClick={() => openInventoryDialog("adjust")}>Adjust stock</button>
          <button type="button" onClick={addPurchaseEntry}>Add purchase entry</button>
          <button type="button" onClick={() => openInventoryDialog("supplier")}>Manage suppliers</button>
        </div>
      </section>
      <section className="inventory-stat-grid">
        {inventoryStats.map((stat) => (
          <article key={stat.label}>
            <div>
              <span>{stat.label}</span>
              <small>{stat.detail}</small>
            </div>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>
      <InventoryControlTable
        activeFilter={activeInventoryFilter}
        items={visibleInventory}
        onAdjust={(item) => openInventoryDialog("adjust", item)}
        onBatch={(item) => openInventoryDialog("batch", item)}
        onFilterChange={setActiveInventoryFilter}
      />
      {inventoryDialog ? (
        <InventoryDialogModal
          dialog={inventoryDialog}
          item={selectedInventoryItem}
          onClose={() => setInventoryDialog(null)}
          onSave={saveInventoryItem}
        />
      ) : null}
    </>
  );
}

function InventoryControlTable({
  activeFilter,
  items,
  onAdjust,
  onBatch,
  onFilterChange
}: {
  activeFilter: InventoryFilter;
  items: AdminInventoryItem[];
  onAdjust: (item: AdminInventoryItem) => void;
  onBatch: (item: AdminInventoryItem) => void;
  onFilterChange: (filter: InventoryFilter) => void;
}) {
  const filters: InventoryFilter[] = ["All stock", "Low stock", "Expiry"];

  return (
    <section className="inventory-control">
      <div className="inventory-control-head">
        <div>
          <span>Inventory</span>
          <h2>Stock ledger</h2>
        </div>
        <div className="inventory-filters">
          {filters.map((filter) => (
            <button
              className={activeFilter === filter ? "active" : ""}
              key={filter}
              type="button"
              onClick={() => onFilterChange(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
      <div className="inventory-table">
        <div className="inventory-row inventory-row-head">
          <span>Product</span>
          <span>Batch</span>
          <span>Stock health</span>
          <span>Reserved</span>
          <span>Available</span>
          <span>Threshold</span>
          <span>Expiry</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {items.map((item) => {
          const stockPercent = Math.min(100, Math.round((item.available / Math.max(item.threshold, 1)) * 100));
          return (
            <div className="inventory-row" key={item.sku}>
              <div className="inventory-product">
                <strong>{item.product}</strong>
                <small>{item.sku}</small>
              </div>
              <div className="inventory-batch">
                <strong>{item.batch}</strong>
                <small>{item.expiry}</small>
              </div>
              <div className="stock-health">
                <div>
                  <span style={{ width: `${stockPercent}%` }} />
                </div>
                <small>{item.stock} total</small>
              </div>
              <strong>{item.reserved}</strong>
              <strong>{item.available}</strong>
              <span>{item.threshold}</span>
              <span>{item.expiry}</span>
              <Badge label={item.status} />
              <div className="row-actions">
                <button type="button" onClick={() => onAdjust(item)}>Adjust</button>
                <button type="button" onClick={() => onBatch(item)}>Batch</button>
              </div>
            </div>
          );
        })}
        {items.length === 0 ? <div className="inventory-empty">No inventory items match this filter.</div> : null}
      </div>
    </section>
  );
}

function InventoryDialogModal({
  dialog,
  item,
  onClose,
  onSave
}: {
  dialog: Exclude<InventoryDialog, null>;
  item: AdminInventoryItem;
  onClose: () => void;
  onSave: (item: AdminInventoryItem, message: string) => void;
}) {
  const [draft, setDraft] = useState<AdminInventoryItem>(() => (
    dialog === "purchase"
      ? {
          ...item,
          batch: item.batch === "No active batch" ? `${item.sku}-NEW` : item.batch,
          expiry: "Fresh purchase received"
        }
      : item
  ));
  const [purchaseQuantity, setPurchaseQuantity] = useState(24);
  const [formError, setFormError] = useState("");
  const title =
    dialog === "adjust"
      ? "Adjust stock"
      : dialog === "batch"
        ? "Update batch"
        : dialog === "supplier"
          ? "Manage supplier"
          : "Add purchase entry";

  function submitInventory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (dialog === "purchase") {
      const receivedUnits = Math.round(Number(purchaseQuantity));
      if (!Number.isFinite(receivedUnits) || receivedUnits <= 0) {
        setFormError("Enter a received quantity greater than 0.");
        return;
      }
      const nextItem = {
        ...draft,
        stock: draft.stock + receivedUnits,
        available: draft.available + receivedUnits
      };
      const status = nextItem.available <= 0 ? "Out of stock" : nextItem.available <= nextItem.threshold ? "Low stock" : "In stock";
      onSave(
        { ...nextItem, status },
        `${draft.product} purchase entry saved. ${receivedUnits} units received from ${draft.supplier}.`
      );
      return;
    }
    const status = draft.available <= 0 ? "Out of stock" : draft.available <= draft.threshold ? "Low stock" : "In stock";
    onSave({ ...draft, status }, `${draft.product} ${title.toLowerCase()} saved.`);
  }

  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog inventory-dialog" onSubmit={submitInventory}>
        <div className="product-dialog-head">
          <div>
            <span>{draft.sku}</span>
            <h3>{title}</h3>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <div className="product-form-grid">
          <label>
            Product
            <input readOnly value={draft.product} />
          </label>
          <label>
            Supplier
            <input value={draft.supplier} onChange={(event) => setDraft({ ...draft, supplier: event.target.value })} />
          </label>
          {dialog === "purchase" ? (
            <>
              <label>
                Current stock
                <input readOnly type="number" value={draft.stock} />
              </label>
              <label>
                Received quantity
                <input min="1" type="number" value={purchaseQuantity} onChange={(event) => setPurchaseQuantity(Number(event.target.value))} />
              </label>
              <label>
                New stock
                <input readOnly type="number" value={draft.stock + Math.max(0, Number(purchaseQuantity) || 0)} />
              </label>
              <label>
                New available
                <input readOnly type="number" value={draft.available + Math.max(0, Number(purchaseQuantity) || 0)} />
              </label>
            </>
          ) : (
            <>
              <label>
                Stock
                <input type="number" value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: Number(event.target.value) })} />
              </label>
              <label>
                Reserved
                <input type="number" value={draft.reserved} onChange={(event) => setDraft({ ...draft, reserved: Number(event.target.value) })} />
              </label>
              <label>
                Available
                <input type="number" value={draft.available} onChange={(event) => setDraft({ ...draft, available: Number(event.target.value) })} />
              </label>
            </>
          )}
          <label>
            Threshold
            <input type="number" value={draft.threshold} onChange={(event) => setDraft({ ...draft, threshold: Number(event.target.value) })} />
          </label>
          <label>
            Batch
            <input value={draft.batch} onChange={(event) => setDraft({ ...draft, batch: event.target.value })} />
          </label>
          <label>
            Expiry
            <input value={draft.expiry} onChange={(event) => setDraft({ ...draft, expiry: event.target.value })} />
          </label>
        </div>
        {formError ? <p className="form-error">{formError}</p> : null}
        <div className="product-dialog-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">{dialog === "purchase" ? "Save purchase entry" : "Save changes"}</button>
        </div>
      </form>
    </div>
  );
}

function DeliveryView() {
  const initialDeliveryQueue: AdminDelivery[] = deliveries.map((delivery, index) => ({
    ...delivery,
    zone: ["South hub", "Central express", "North slot"][index]
  }));
  const [deliveryQueue, setDeliveryQueue] = usePersistentState<AdminDelivery[]>("delivery:queue", initialDeliveryQueue);
  const [selectedDelivery, setSelectedDelivery] = useState<AdminDelivery>(initialDeliveryQueue[0]);
  const [deliveryDialog, setDeliveryDialog] = useState<DeliveryDialog>(null);
  const [deliveryNotice, setDeliveryNotice] = useState("Delivery control center is active.");
  const [mapEta, setMapEta] = usePersistentState("delivery:map-eta", "18 min");

  const deliveryStats = [
    { label: "Active riders", value: deliveryQueue.filter((delivery) => delivery.rider !== "Unassigned").length, detail: "Currently available" },
    { label: "Live orders", value: deliveryQueue.filter((delivery) => delivery.status !== "Packed").length, detail: "Moving through zones" },
    { label: "Needs assignment", value: deliveryQueue.filter((delivery) => delivery.rider === "Unassigned").length, detail: "Packed and waiting" }
  ];

  function refreshEta() {
    const nextEta = mapEta === "18 min" ? "14 min" : mapEta === "14 min" ? "9 min" : "18 min";
    setMapEta(nextEta);
    setDeliveryNotice(`Live map refreshed. Rider ETA is now ${nextEta}.`);
  }

  function openDeliveryDialog(dialog: Exclude<DeliveryDialog, null>, delivery = deliveryQueue[0]) {
    setSelectedDelivery(delivery);
    setDeliveryDialog(dialog);
  }

  function assignDelivery(delivery = deliveryQueue.find((item) => item.rider === "Unassigned") ?? deliveryQueue[0]) {
    const assigned: AdminDelivery = {
      ...delivery,
      rider: delivery.rider === "Unassigned" ? "Rhea" : delivery.rider,
      status: "Out for delivery",
      eta: delivery.eta === "Needs assignment" ? "22 min" : delivery.eta
    };

    setDeliveryQueue((items) => items.map((item) => (item.id === assigned.id ? assigned : item)));
    setSelectedDelivery(assigned);
    setDeliveryNotice(`${assigned.id} assigned to ${assigned.rider}.`);
    setDeliveryDialog(null);
  }

  function saveDeliveryUpdate(updatedDelivery: AdminDelivery, message: string) {
    setDeliveryQueue((items) => items.map((item) => (item.id === updatedDelivery.id ? updatedDelivery : item)));
    setSelectedDelivery(updatedDelivery);
    setDeliveryNotice(message);
    setDeliveryDialog(null);
  }

  return (
    <>
      {deliveryNotice ? <div className="admin-notice">{deliveryNotice}</div> : null}
      <section className="delivery-command">
        <div>
          <span>Dispatch control</span>
          <h2>Delivery and live tracking</h2>
          <p>Monitor riders, assign packed orders, manage zones and delivery slots, and keep live ETA visibility for customers.</p>
        </div>
        <div className="delivery-command-actions">
          <button className="primary-action" type="button" onClick={refreshEta}>Open live map</button>
          <button type="button" onClick={() => assignDelivery()}>Assign staff</button>
          <button type="button" onClick={() => openDeliveryDialog("slots")}>Manage slots</button>
          <button type="button" onClick={() => openDeliveryDialog("zones")}>Manage zones</button>
        </div>
      </section>
      <section className="delivery-stat-grid">
        {deliveryStats.map((stat) => (
          <article key={stat.label}>
            <div>
              <span>{stat.label}</span>
              <small>{stat.detail}</small>
            </div>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>
      <section className="delivery-layout">
        <DeliveryOperationsMap mapEta={mapEta} onRefresh={refreshEta} />
        <DeliveryAssignments
          items={deliveryQueue}
          onAssign={(delivery) => openDeliveryDialog("assign", delivery)}
          onAssignNext={() => assignDelivery()}
          onTrack={(delivery) => openDeliveryDialog("track", delivery)}
        />
      </section>
      {deliveryDialog ? (
        <DeliveryDialogModal
          dialog={deliveryDialog}
          delivery={selectedDelivery}
          onAssign={() => assignDelivery(selectedDelivery)}
          onClose={() => setDeliveryDialog(null)}
          onSave={saveDeliveryUpdate}
        />
      ) : null}
    </>
  );
}

function DeliveryOperationsMap({ mapEta, onRefresh }: { mapEta: string; onRefresh: () => void }) {
  return (
    <section className="delivery-map-panel">
      <div className="delivery-panel-head">
        <div>
          <span>Live map</span>
          <h2>Route activity</h2>
        </div>
        <button type="button" onClick={onRefresh}>Refresh ETA</button>
      </div>
      <div className="delivery-map">
        <span className="delivery-route" />
        <span className="delivery-zone zone-a">Store hub</span>
        <span className="delivery-zone zone-b">Rider 07</span>
        <span className="delivery-zone zone-c">Customer</span>
        <span className="delivery-pin pin-a">Pickup</span>
        <span className="delivery-pin pin-b">{mapEta}</span>
      </div>
    </section>
  );
}

function DeliveryAssignments({
  items,
  onAssign,
  onAssignNext,
  onTrack
}: {
  items: AdminDelivery[];
  onAssign: (delivery: AdminDelivery) => void;
  onAssignNext: () => void;
  onTrack: (delivery: AdminDelivery) => void;
}) {
  return (
    <section className="delivery-assignment-panel">
      <div className="delivery-panel-head">
        <div>
          <span>Assignments</span>
          <h2>Rider queue</h2>
        </div>
        <button type="button" onClick={onAssignNext}>Assign next</button>
      </div>
      <div className="delivery-assignment-list">
        {items.map((delivery) => (
          <article key={delivery.id}>
            <div className="delivery-assignment-main">
              <span>{delivery.id}</span>
              <h3>{delivery.order}</h3>
              <small>{delivery.rider}</small>
            </div>
            <div>
              <span>Status</span>
              <Badge label={delivery.status} />
            </div>
            <div>
              <span>ETA</span>
              <strong>{delivery.eta}</strong>
            </div>
            <div className="row-actions">
              <button type="button" onClick={() => onTrack(delivery)}>Track</button>
              <button type="button" onClick={() => onAssign(delivery)}>Assign</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DeliveryDialogModal({
  dialog,
  delivery,
  onAssign,
  onClose,
  onSave
}: {
  dialog: Exclude<DeliveryDialog, null>;
  delivery: AdminDelivery;
  onAssign: () => void;
  onClose: () => void;
  onSave: (delivery: AdminDelivery, message: string) => void;
}) {
  const [draft, setDraft] = useState<AdminDelivery>(delivery);
  const [slotWindow, setSlotWindow] = useState("Today 6 PM - 8 PM");
  const [zoneCapacity, setZoneCapacity] = useState("82%");
  const [operationNote, setOperationNote] = useState("Keep customer ETA visible and notify support on delay.");
  const title =
    dialog === "track"
      ? "Track delivery"
      : dialog === "assign"
        ? "Assign rider"
        : dialog === "slots"
          ? "Manage slots"
          : "Manage zones";

  function submitDelivery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (dialog === "slots") {
      onSave(draft, `Delivery slot ${slotWindow} saved. Capacity now ${zoneCapacity}.`);
      return;
    }
    if (dialog === "zones") {
      onSave({ ...draft, zone: draft.zone }, `${draft.zone} zone updated. Capacity ${zoneCapacity}.`);
      return;
    }
    if (dialog === "assign") {
      onSave(
        { ...draft, status: "Out for delivery", rider: draft.rider === "Unassigned" ? "Rhea" : draft.rider, eta: draft.eta === "Needs assignment" ? "22 min" : draft.eta },
        `${draft.id} assigned to ${draft.rider === "Unassigned" ? "Rhea" : draft.rider}. ${operationNote}`
      );
      return;
    }
    onSave(draft, `${draft.id} tracking details updated. ${operationNote}`);
  }

  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog delivery-dialog" onSubmit={submitDelivery}>
        <div className="product-dialog-head">
          <div>
            <span>{dialog === "slots" || dialog === "zones" ? "Dispatch" : delivery.id}</span>
            <h3>{title}</h3>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <div className="delivery-dialog-grid">
          <label>
            <span>Order</span>
            <input value={draft.order} onChange={(event) => setDraft({ ...draft, order: event.target.value })} />
          </label>
          <label>
            <span>Rider</span>
            <select value={draft.rider} onChange={(event) => setDraft({ ...draft, rider: event.target.value })}>
              <option>Unassigned</option>
              <option>Rhea</option>
              <option>Rider 07</option>
              <option>Aman Dispatch</option>
              <option>South Hub Runner</option>
            </select>
          </label>
          <label>
            <span>Status</span>
            <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
              <option>Packed</option>
              <option>Assigned</option>
              <option>Out for delivery</option>
              <option>Delivered</option>
              <option>Delayed</option>
            </select>
          </label>
          <label>
            <span>ETA</span>
            <input value={draft.eta} onChange={(event) => setDraft({ ...draft, eta: event.target.value })} />
          </label>
          <label>
            <span>Zone</span>
            <input value={draft.zone} onChange={(event) => setDraft({ ...draft, zone: event.target.value })} />
          </label>
          {dialog === "slots" || dialog === "zones" ? (
            <>
              <label>
                <span>Slot window</span>
                <input value={slotWindow} onChange={(event) => setSlotWindow(event.target.value)} />
              </label>
              <label>
                <span>Capacity</span>
                <input value={zoneCapacity} onChange={(event) => setZoneCapacity(event.target.value)} />
              </label>
            </>
          ) : null}
          <label className="settings-wide">
            <span>Operation note</span>
            <input value={operationNote} onChange={(event) => setOperationNote(event.target.value)} />
          </label>
        </div>
        <div className="product-dialog-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          {dialog === "assign" ? (
            <button type="submit">Assign now</button>
          ) : (
            <button type="submit">Save dispatch update</button>
          )}
        </div>
      </form>
    </div>
  );
}

function SupportView() {
  const [supportQueue, setSupportQueue] = usePersistentState<AdminSupportTicket[]>("support:queue", support);
  const [activeTicket, setActiveTicket] = useState<AdminSupportTicket>(emptySupportTicket);
  const [reply, setReply] = useState("");
  const [supportNotice, setSupportNotice] = useState("Support inbox is ready.");

  useEffect(() => {
    if (!activeTicket.customer && supportQueue.length) {
      setActiveTicket(supportQueue[0]);
    }
  }, [activeTicket.customer, supportQueue]);

  const supportStats = [
    { label: "Open tickets", value: supportQueue.filter((item) => item.state === "Open").length, detail: "Need first response" },
    { label: "Pending", value: supportQueue.filter((item) => item.state === "Pending").length, detail: "Waiting on customer" },
    { label: "Unassigned", value: supportQueue.filter((item) => item.agent === "Unassigned").length, detail: "Needs owner" },
    { label: "Linked orders", value: supportQueue.filter((item) => item.order).length, detail: "Order context attached" }
  ];

  function updateTicket(nextTicket: AdminSupportTicket, notice: string) {
    if (!nextTicket.customer) {
      setSupportNotice("Select a support ticket before using this action.");
      return;
    }
    setSupportQueue((items) => items.map((item) => (supportTicketKey(item) === supportTicketKey(nextTicket) ? nextTicket : item)));
    setActiveTicket(nextTicket);
    setSupportNotice(notice);
  }

  function assignTicket(ticket = activeTicket) {
    updateTicket({ ...ticket, agent: "Owner", state: "Open" }, `${ticket.customer} assigned to Owner.`);
  }

  function markPending() {
    updateTicket({ ...activeTicket, state: "Pending" }, `${activeTicket.order} moved to pending follow-up.`);
  }

  function resolveTicket() {
    updateTicket({ ...activeTicket, state: "Resolved" }, `${activeTicket.topic} resolved for ${activeTicket.customer}.`);
  }

  function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeTicket.customer) {
      setSupportNotice("Select a support ticket before sending a reply.");
      return;
    }
    const message = reply.trim() || "Quick reply sent.";
    setReply("");
    updateTicket(
      {
        ...activeTicket,
        agent: activeTicket.agent === "Unassigned" ? "Owner" : activeTicket.agent,
        agentMessage: message,
        lastMessage: message,
        state: "Pending",
        time: "Just now",
        messageCount: (activeTicket.messageCount ?? 0) + 1
      },
      `Reply sent to ${activeTicket.customer}: ${message}`
    );
  }

  function openChannel(channel: string) {
    if (!activeTicket.customer) {
      setSupportNotice("Select a support ticket before opening a channel.");
      return;
    }
    setSupportNotice(`${channel} channel opened for ${activeTicket.customer}.`);
  }

  return (
    <>
      {supportNotice ? <div className="admin-notice">{supportNotice}</div> : null}
      <section className="support-command">
        <div>
          <span>Customer care</span>
          <h2>Support inbox</h2>
          <p>Handle order questions, delivery slot changes, missing item reports, payment issues, and WhatsApp, SMS, email, and admin chat conversations from one place.</p>
          <div className="support-command-tags">
            <span>Admin chat</span>
            <span>Email</span>
            <span>WhatsApp/SMS</span>
            <span>Order linked</span>
          </div>
        </div>
        <div className="support-command-actions">
          <button className="primary-action" type="button" onClick={() => assignTicket()}>Assign to me</button>
          <button type="button" onClick={markPending}>Mark pending</button>
          <button type="button" onClick={resolveTicket}>Resolve</button>
          <button type="button" onClick={() => openChannel("Quick reply")}>Send quick reply</button>
        </div>
      </section>
      <section className="support-stat-grid">
        {supportStats.map((stat) => (
          <article key={stat.label}>
            <div>
              <span>{stat.label}</span>
              <small>{stat.detail}</small>
            </div>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>
      <section className="support-inbox">
        <SupportQueue
          activeTicket={activeTicket}
          items={supportQueue}
          onAssign={assignTicket}
          onSelect={setActiveTicket}
        />
        <SupportThread
          activeTicket={activeTicket}
          reply={reply}
          onChannel={openChannel}
          onReplyChange={setReply}
          onSendReply={sendReply}
        />
        <SupportContext
          activeTicket={activeTicket}
          onChannel={openChannel}
          onPending={markPending}
          onResolve={resolveTicket}
        />
      </section>
    </>
  );
}

function SupportQueue({
  activeTicket,
  items,
  onAssign,
  onSelect
}: {
  activeTicket: AdminSupportTicket;
  items: AdminSupportTicket[];
  onAssign: (ticket: AdminSupportTicket) => void;
  onSelect: (ticket: AdminSupportTicket) => void;
}) {
  return (
    <section className="support-panel support-queue-panel">
      <div className="support-panel-head">
        <div>
          <span>Inbox queue</span>
          <h2>Priority tickets</h2>
        </div>
        <strong>{items.length}</strong>
      </div>
      <div className="support-ticket-list">
        {items.length ? items.map((item) => (
          <article className={supportTicketKey(item) === supportTicketKey(activeTicket) ? "active" : ""} key={supportTicketKey(item)}>
            <button type="button" onClick={() => onSelect(item)}>
              <span className="support-avatar">{item.customer.slice(0, 1)}</span>
              <div>
                <strong>{item.customer}</strong>
                <small>{item.topic}</small>
                {item.customerMessage ? <em>{item.customerMessage}</em> : null}
              </div>
            </button>
            <div className="support-ticket-meta">
              <Badge label={item.state} />
              <span>{item.time}</span>
            </div>
            <div className="support-ticket-footer">
              <span>{item.order}</span>
              <button type="button" onClick={() => onAssign(item)}>
                {item.agent === "Unassigned" ? "Assign" : item.agent}
              </button>
            </div>
          </article>
        )) : <p className="empty-state">No support tickets yet. Customer messages will appear here after they arrive through contact, chat, email, WhatsApp, or SMS.</p>}
      </div>
    </section>
  );
}

function SupportThread({
  activeTicket,
  reply,
  onChannel,
  onReplyChange,
  onSendReply
}: {
  activeTicket: AdminSupportTicket;
  reply: string;
  onChannel: (channel: string) => void;
  onReplyChange: (value: string) => void;
  onSendReply: (event: FormEvent<HTMLFormElement>) => void;
}) {
  if (!activeTicket.customer) {
    return (
      <section className="support-panel chat-thread">
        <div className="support-panel-head">
          <div>
            <span>No active ticket</span>
            <h2>Select a conversation</h2>
          </div>
        </div>
        <div className="support-conversation">
          <p className="agent-message">No customer conversation is selected. New support tickets from the database will appear in the inbox queue.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="support-panel chat-thread">
      <div className="support-panel-head">
        <div>
          <span>{activeTicket.order}</span>
          <h2>{activeTicket.topic}</h2>
        </div>
        <Badge label={activeTicket.state} />
      </div>
      <div className="support-channel-row">
        {["Admin chat", "Email", "WhatsApp", "SMS"].map((channel) => (
          <button key={channel} type="button" onClick={() => onChannel(channel)}>{channel}</button>
        ))}
      </div>
      <div className="support-conversation">
        <p className="customer-message">{activeTicket.customerMessage || activeTicket.lastMessage || "Customer message will appear here after the ticket is opened."}</p>
        <p className="agent-message">{activeTicket.agentMessage || "Write a reply below. It will save back to the support conversation."}</p>
      </div>
      <form className="support-reply-box" onSubmit={onSendReply}>
        <input value={reply} onChange={(event) => onReplyChange(event.target.value)} placeholder="Reply to customer" />
        <button type="submit">Send</button>
      </form>
    </section>
  );
}

function SupportContext({
  activeTicket,
  onChannel,
  onPending,
  onResolve
}: {
  activeTicket: AdminSupportTicket;
  onChannel: (channel: string) => void;
  onPending: () => void;
  onResolve: () => void;
}) {
  if (!activeTicket.customer) {
    return (
      <section className="support-panel support-context-panel">
        <div className="support-panel-head">
          <div>
            <span>Customer context</span>
            <h2>No ticket selected</h2>
          </div>
        </div>
        <div className="support-order-card">
          <span>Linked order</span>
          <strong>No order selected</strong>
          <p>Order, customer, agent, and channel context will load after a real support ticket is selected.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="support-panel support-context-panel">
      <div className="support-panel-head">
        <div>
          <span>Customer context</span>
          <h2>{activeTicket.customer}</h2>
        </div>
        <span className="support-avatar large">{activeTicket.customer.slice(0, 1)}</span>
      </div>
      <div className="support-context-list">
        <div>
          <span>Order</span>
          <strong>{activeTicket.order}</strong>
        </div>
        <div>
          <span>Agent</span>
          <strong>{activeTicket.agent}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{activeTicket.state}</strong>
        </div>
        <div>
          <span>Channel</span>
          <strong>{activeTicket.channel ?? activeTicket.source ?? "Admin chat"}</strong>
        </div>
        <div>
          <span>Last update</span>
          <strong>{activeTicket.time}</strong>
        </div>
      </div>
      <div className="support-order-card">
        <span>Linked order</span>
        <strong>{activeTicket.order}</strong>
        <p>Packed groceries, COD check, delivery slot edit and rider notes are available for this ticket.</p>
      </div>
      <div className="support-context-actions">
        <button type="button" onClick={() => onChannel("WhatsApp")}>WhatsApp</button>
        <button type="button" onClick={() => onChannel("Email")}>Email</button>
        <button type="button" onClick={onPending}>Pending</button>
        <button type="button" onClick={onResolve}>Resolve</button>
      </div>
    </section>
  );
}

function supportTicketKey(ticket: AdminSupportTicket) {
  return ticket.id || `${ticket.customer}-${ticket.order}-${ticket.topic}`;
}

function CustomersView() {
  const [customerList, setCustomerList] = usePersistentState<AdminCustomer[]>("customers:list", customers);
  const [activeSegment, setActiveSegment] = useState<CustomerSegment>("All");
  const [activeCustomer, setActiveCustomer] = useState<AdminCustomer>(emptyAdminCustomer);
  const [customerDialog, setCustomerDialog] = useState<CustomerDialog>(null);
  const [customerChannel, setCustomerChannel] = useState("WhatsApp");
  const [customerNote, setCustomerNote] = useState("");
  const [customerNotice, setCustomerNotice] = useState("Customer CRM is ready.");

  useEffect(() => {
    if (!activeCustomer.phone && customerList.length) {
      setActiveCustomer(customerList[0]);
      setCustomerNote(customerList[0].internalNote);
    }
  }, [activeCustomer.phone, customerList]);

  const visibleCustomers = useMemo(() => {
    if (activeSegment === "All") {
      return customerList;
    }
    if (activeSegment === "COD users") {
      return customerList.filter((customer) => customer.paymentPreference === "COD");
    }
    return customerList.filter((customer) => customer.status === activeSegment);
  }, [activeSegment, customerList]);

  const customerStats = [
    { label: "Total customers", value: customerList.length, detail: "Known shopper profiles" },
    { label: "Repeat buyers", value: customerList.filter((customer) => customer.orders > 10).length, detail: "High retention segment" },
    { label: "VIP customers", value: customerList.filter((customer) => customer.status === "VIP").length, detail: "Premium grocery spend" },
    { label: "Support watch", value: customerList.filter((customer) => !customer.support.includes("No open")).length, detail: "Needs follow-up" }
  ];

  function selectCustomer(customer: AdminCustomer) {
    setActiveCustomer(customer);
    setCustomerNote(customer.internalNote);
    setCustomerNotice(`${customer.name} profile opened.`);
  }

  function changeSegment(segment: CustomerSegment) {
    setActiveSegment(segment);
    setCustomerNotice(`${segment} segment loaded.`);
  }

  function openCustomerDialog(dialog: Exclude<CustomerDialog, null>, customer = activeCustomer, channel = customerChannel) {
    if (!customer.phone && !customer.email) {
      setCustomerNotice("Select a customer before opening this action.");
      return;
    }
    setActiveCustomer(customer);
    setCustomerNote(customer.internalNote);
    setCustomerChannel(channel);
    setCustomerDialog(dialog);
    setCustomerNotice(
      dialog === "message"
        ? `${channel} composer opened for ${customer.name}.`
        : dialog === "orders"
          ? `${customer.name}'s order history opened.`
          : dialog === "support"
            ? `${customer.name}'s support context opened.`
            : `Internal note opened for ${customer.name}.`
    );
  }

  function openChannel(channel: string, customer = activeCustomer) {
    openCustomerDialog("message", customer, channel);
  }

  function markVip() {
    if (!activeCustomer.phone && !activeCustomer.email) {
      setCustomerNotice("Select a customer before upgrading VIP status.");
      return;
    }
    if (activeCustomer.status === "VIP" && activeCustomer.tier === "Platinum") {
      setCustomerNotice(`${activeCustomer.name} is already a Platinum VIP customer.`);
      return;
    }

    const updatedCustomer: AdminCustomer = { ...activeCustomer, status: "VIP", tier: "Platinum" };
    setCustomerList((items) => items.map((customer) => (customer.phone === updatedCustomer.phone ? updatedCustomer : customer)));
    setActiveCustomer(updatedCustomer);
    setCustomerNote(updatedCustomer.internalNote);
    setCustomerNotice(`${updatedCustomer.name} upgraded to VIP.`);
  }

  function addInternalNote() {
    openCustomerDialog("note");
  }

  function saveInternalNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeCustomer.phone && !activeCustomer.email) {
      setCustomerNotice("Select a customer before saving a note.");
      return;
    }
    const updatedCustomer = { ...activeCustomer, internalNote: customerNote.trim() || "No note added yet." };
    setCustomerList((items) => items.map((customer) => (customer.phone === updatedCustomer.phone ? updatedCustomer : customer)));
    setActiveCustomer(updatedCustomer);
    setCustomerDialog(null);
    setCustomerNotice(`Internal note saved for ${updatedCustomer.name}.`);
  }

  function sendCustomerMessage(message = "Customer update message") {
    if (!activeCustomer.phone && !activeCustomer.email) {
      setCustomerNotice("Select a customer before sending a message.");
      return;
    }
    setCustomerDialog(null);
    setCustomerNotice(`${customerChannel} message queued for ${activeCustomer.name}: ${message}`);
  }

  function saveCustomerContext(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeCustomer.phone && !activeCustomer.email) {
      setCustomerNotice("Select a customer before saving context.");
      return;
    }
    const formData = new FormData(event.currentTarget);
    const updatedCustomer: AdminCustomer = {
      ...activeCustomer,
      orders: Number(formData.get("orders") || activeCustomer.orders),
      spend: String(formData.get("spend") || activeCustomer.spend).trim(),
      averageOrder: String(formData.get("averageOrder") || activeCustomer.averageOrder).trim(),
      favorite: String(formData.get("favorite") || activeCustomer.favorite).trim(),
      preferredSlot: String(formData.get("preferredSlot") || activeCustomer.preferredSlot).trim(),
      address: String(formData.get("address") || activeCustomer.address).trim(),
      cart: String(formData.get("cart") || activeCustomer.cart).trim(),
      support: String(formData.get("support") || activeCustomer.support).trim(),
      risk: String(formData.get("risk") || activeCustomer.risk).trim()
    };
    setCustomerList((items) => items.map((customer) => (customer.phone === updatedCustomer.phone ? updatedCustomer : customer)));
    setActiveCustomer(updatedCustomer);
    setCustomerDialog(null);
    setCustomerNotice(`${updatedCustomer.name} customer context saved.`);
  }

  return (
    <>
      {customerNotice ? <div className="admin-notice">{customerNotice}</div> : null}
      <section className="customer-command">
        <div>
          <span>Customer CRM</span>
          <h2>Customers and loyalty</h2>
          <p>Track customer value, saved addresses, repeat baskets, support history, risk signals, and direct communication from one grocery CRM console.</p>
          <div className="customer-command-tags">
            <span>Segments</span>
            <span>Loyalty</span>
            <span>Support context</span>
            <span>Repeat basket</span>
          </div>
        </div>
        <div className="customer-command-actions">
          <button className="primary-action" type="button" onClick={markVip}>Upgrade VIP</button>
          <button type="button" onClick={() => openChannel("WhatsApp")}>WhatsApp</button>
          <button type="button" onClick={() => openChannel("Email")}>Email</button>
          <button type="button" onClick={addInternalNote}>Add note</button>
        </div>
      </section>
      <section className="customer-stat-grid">
        {customerStats.map((stat) => (
          <article key={stat.label}>
            <div>
              <span>{stat.label}</span>
              <small>{stat.detail}</small>
            </div>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>
      <section className="customer-crm-layout">
        <CustomerDirectory
          activeCustomer={activeCustomer}
          activeSegment={activeSegment}
          customers={visibleCustomers}
          onOpenChannel={openChannel}
          onOpenOrders={(customer) => openCustomerDialog("orders", customer)}
          onSegmentChange={changeSegment}
          onSelectCustomer={selectCustomer}
        />
        <CustomerProfile
          customer={activeCustomer}
          onAddNote={addInternalNote}
          onOpenChannel={openChannel}
          onOpenOrders={() => openCustomerDialog("orders")}
          onOpenSupport={() => openCustomerDialog("support")}
          onUpgradeVip={markVip}
        />
      </section>
      {customerDialog ? (
        <CustomerDialogModal
          channel={customerChannel}
          customer={activeCustomer}
          dialog={customerDialog}
          note={customerNote}
          onClose={() => setCustomerDialog(null)}
          onNoteChange={setCustomerNote}
          onSaveContext={saveCustomerContext}
          onSaveNote={saveInternalNote}
          onSendMessage={sendCustomerMessage}
        />
      ) : null}
    </>
  );
}

function CustomerDirectory({
  activeCustomer,
  activeSegment,
  customers,
  onOpenChannel,
  onOpenOrders,
  onSegmentChange,
  onSelectCustomer
}: {
  activeCustomer: AdminCustomer;
  activeSegment: CustomerSegment;
  customers: AdminCustomer[];
  onOpenChannel: (channel: string, customer?: AdminCustomer) => void;
  onOpenOrders: (customer: AdminCustomer) => void;
  onSegmentChange: (segment: CustomerSegment) => void;
  onSelectCustomer: (customer: AdminCustomer) => void;
}) {
  const segments: CustomerSegment[] = ["All", "VIP", "New", "At risk", "COD users"];

  return (
    <section className="customer-directory">
      <div className="customer-directory-head">
        <div>
          <span>Segments</span>
          <h2>Customer directory</h2>
        </div>
        <div className="customer-segment-tabs">
          {segments.map((segment) => (
            <button
              className={activeSegment === segment ? "active" : ""}
              key={segment}
              type="button"
              onClick={() => onSegmentChange(segment)}
            >
              {segment}
            </button>
          ))}
        </div>
      </div>
      <div className="customer-list">
        {customers.map((customer) => (
          <article className={customer.phone === activeCustomer.phone ? "active" : ""} key={customer.phone}>
            <button className="customer-row-main" type="button" onClick={() => onSelectCustomer(customer)}>
              <span className="customer-avatar">{customer.name.slice(0, 1)}</span>
              <div>
                <strong>{customer.name}</strong>
                <small>{customer.phone}</small>
              </div>
            </button>
            <div className="customer-row-metrics">
              <div>
                <span>Orders</span>
                <strong>{customer.orders}</strong>
              </div>
              <div>
                <span>Spend</span>
                <strong>{customer.spend}</strong>
              </div>
              <div>
                <span>Last order</span>
                <strong>{customer.lastOrder}</strong>
              </div>
              <Badge label={customer.status} />
            </div>
            <div className="customer-row-actions">
              <button type="button" onClick={() => onSelectCustomer(customer)}>View</button>
              <button type="button" onClick={() => onOpenChannel("Message", customer)}>Message</button>
              <button type="button" onClick={() => onOpenOrders(customer)}>Orders</button>
            </div>
          </article>
        ))}
        {customers.length === 0 ? <div className="customer-empty">No customers match this segment.</div> : null}
      </div>
    </section>
  );
}

function CustomerProfile({
  customer,
  onAddNote,
  onOpenChannel,
  onOpenOrders,
  onOpenSupport,
  onUpgradeVip
}: {
  customer: AdminCustomer;
  onAddNote: () => void;
  onOpenChannel: (channel: string, customer?: AdminCustomer) => void;
  onOpenOrders: () => void;
  onOpenSupport: () => void;
  onUpgradeVip: () => void;
}) {
  if (!customer.phone && !customer.email) {
    return (
      <aside className="customer-profile-panel">
        <div className="customer-profile-head">
          <span className="customer-avatar large">C</span>
          <div>
            <span>Customer profile</span>
            <h2>No customer selected</h2>
            <p>Customer records will appear here after users register or place orders.</p>
          </div>
        </div>
        <div className="customer-context-card">
          <span>Production empty state</span>
          <strong>No customer data yet</strong>
          <p>Add real customers through the client flow or backend API to enable messaging, notes, orders, and support context.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="customer-profile-panel">
      <div className="customer-profile-head">
        <span className="customer-avatar large">{customer.name.slice(0, 1)}</span>
        <div>
          <span>Customer profile</span>
          <h2>{customer.name}</h2>
          <p>{customer.email}</p>
        </div>
      </div>
      <div className="customer-profile-actions">
        <button type="button" onClick={() => onOpenChannel("WhatsApp", customer)}>WhatsApp</button>
        <button type="button" onClick={() => onOpenChannel("SMS", customer)}>SMS</button>
        <button type="button" onClick={() => onOpenChannel("Email", customer)}>Email</button>
        <button type="button" onClick={onAddNote}>Note</button>
      </div>
      <div className="customer-profile-grid">
        <div>
          <span>Tier</span>
          <strong>{customer.tier}</strong>
        </div>
        <div>
          <span>Points</span>
          <strong>{customer.points}</strong>
        </div>
        <div>
          <span>Wallet</span>
          <strong>{customer.wallet}</strong>
        </div>
        <div>
          <span>Risk</span>
          <strong>{customer.risk}</strong>
        </div>
      </div>
      <div className="customer-context-card">
        <span>Grocery behavior</span>
        <strong>{customer.favorite}</strong>
        <p>Prefers {customer.preferredSlot}. Active cart includes {customer.cart}.</p>
      </div>
      <div className="customer-context-list">
        <div>
          <span>Saved address</span>
          <strong>{customer.address}</strong>
        </div>
        <div>
          <span>Average order</span>
          <strong>{customer.averageOrder}</strong>
        </div>
        <div>
          <span>Payment</span>
          <strong>{customer.paymentPreference}</strong>
        </div>
        <div>
          <span>Support</span>
          <strong>{customer.support}</strong>
        </div>
        <div>
          <span>Internal note</span>
          <strong>{customer.internalNote}</strong>
        </div>
      </div>
      <div className="customer-profile-footer">
        <button type="button" onClick={onUpgradeVip}>Upgrade loyalty</button>
        <button type="button" onClick={onOpenOrders}>Orders</button>
        <button type="button" onClick={onOpenSupport}>Open support</button>
      </div>
    </aside>
  );
}

function CustomerDialogModal({
  channel,
  customer,
  dialog,
  note,
  onClose,
  onNoteChange,
  onSaveContext,
  onSaveNote,
  onSendMessage
}: {
  channel: string;
  customer: AdminCustomer;
  dialog: Exclude<CustomerDialog, null>;
  note: string;
  onClose: () => void;
  onNoteChange: (note: string) => void;
  onSaveContext: (event: FormEvent<HTMLFormElement>) => void;
  onSaveNote: (event: FormEvent<HTMLFormElement>) => void;
  onSendMessage: (message: string) => void;
}) {
  const [messageTitle, setMessageTitle] = useState(`${customer.name.split(" ")[0]} grocery update`);
  const [messageBody, setMessageBody] = useState(`Hi ${customer.name.split(" ")[0]}, your FreshCart order and grocery updates are ready. Reply here if you need help.`);
  const title =
    dialog === "message"
      ? `${channel} message`
      : dialog === "orders"
        ? "Customer orders"
        : dialog === "support"
          ? "Support context"
          : "Internal note";

  const recentOrders: Array<{ id: string; status: string; total: string; slot: string }> = [];

  return (
    <div className="product-dialog-backdrop">
      <div className="product-dialog customer-dialog">
        <div className="product-dialog-head">
          <div>
            <span>{customer.name}</span>
            <h3>{title}</h3>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>

        {dialog === "message" ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onSendMessage(`${messageTitle} - ${messageBody}`);
            }}
          >
          <div className="customer-dialog-body">
            <div className="customer-message-preview">
              <span>{channel}</span>
              <strong>{messageTitle}</strong>
              <p>{messageBody}</p>
            </div>
            <div className="settings-form-grid">
              <label><span>Phone</span><input value={customer.phone} readOnly /></label>
              <label><span>Email</span><input value={customer.email} readOnly /></label>
              <label><span>Segment</span><input value={customer.status} readOnly /></label>
              <label><span>Preference</span><input value={customer.paymentPreference} readOnly /></label>
              <label className="settings-wide">
                <span>Message title</span>
                <input value={messageTitle} onChange={(event) => setMessageTitle(event.target.value)} />
              </label>
              <label className="settings-wide">
                <span>Message body</span>
                <textarea value={messageBody} onChange={(event) => setMessageBody(event.target.value)} />
              </label>
            </div>
          </div>
          <div className="product-dialog-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Queue message</button>
          </div>
          </form>
        ) : null}

        {dialog === "orders" ? (
          <form onSubmit={onSaveContext}>
            <div className="customer-dialog-body">
              <div className="settings-form-grid">
                <label><span>Total orders</span><input name="orders" type="number" defaultValue={customer.orders} /></label>
                <label><span>Total spend</span><input name="spend" defaultValue={customer.spend} /></label>
                <label><span>Average order</span><input name="averageOrder" defaultValue={customer.averageOrder} /></label>
                <label><span>Favorite</span><input name="favorite" defaultValue={customer.favorite} /></label>
                <label className="settings-wide"><span>Preferred slot</span><input name="preferredSlot" defaultValue={customer.preferredSlot} /></label>
              </div>
            <div className="customer-order-history">
              {recentOrders.map((order) => (
                <article key={order.id}>
                  <strong>{order.id}</strong>
                  <span>{order.status}</span>
                  <span>{order.slot}</span>
                  <b>{order.total}</b>
                </article>
              ))}
            </div>
            </div>
            <div className="product-dialog-actions">
              <button type="button" onClick={onClose}>Cancel</button>
              <button type="submit">Save order context</button>
            </div>
          </form>
        ) : null}

        {dialog === "support" ? (
          <form onSubmit={onSaveContext}>
            <div className="customer-dialog-body">
              <div className="settings-form-grid">
                <label className="settings-wide"><span>Support status</span><input name="support" defaultValue={customer.support} /></label>
                <label><span>Risk</span><input name="risk" defaultValue={customer.risk} /></label>
                <label><span>Cart</span><input name="cart" defaultValue={customer.cart} /></label>
                <label className="settings-wide"><span>Address</span><input name="address" defaultValue={customer.address} /></label>
              </div>
            </div>
            <div className="product-dialog-actions">
              <button type="button" onClick={onClose}>Cancel</button>
              <button type="submit">Save support context</button>
            </div>
          </form>
        ) : null}

        {dialog === "note" ? (
          <form onSubmit={onSaveNote}>
            <div className="customer-dialog-body">
              <label className="customer-note-field">
                <span>Internal note</span>
                <textarea value={note} onChange={(event) => onNoteChange(event.target.value)} />
              </label>
            </div>
            <div className="product-dialog-actions">
              <button type="button" onClick={onClose}>Cancel</button>
              <button type="submit">Save note</button>
            </div>
          </form>
        ) : dialog === "message" || dialog === "orders" || dialog === "support" ? null : (
          <div className="product-dialog-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="button" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

function CouponsView() {
  const [couponList, setCouponList] = usePersistentState<AdminCoupon[]>("coupons:list", initialCoupons);
  const [banners, setBanners] = usePersistentState<PromotionBanner[]>("coupons:banners", initialPromotionBanners);
  const [activeFilter, setActiveFilter] = useState<CouponFilter>("All");
  const [selectedCoupon, setSelectedCoupon] = useState<AdminCoupon>(initialCoupons[0]);
  const [selectedBanner, setSelectedBanner] = useState<PromotionBanner>(initialPromotionBanners[0]);
  const [couponDialog, setCouponDialog] = useState<CouponDialog>(null);
  const [couponNotice, setCouponNotice] = useState("Marketing campaign center is ready.");

  const visibleCoupons = useMemo(() => {
    if (activeFilter === "All") {
      return couponList;
    }
    return couponList.filter((coupon) => coupon.status === activeFilter);
  }, [activeFilter, couponList]);

  const couponStats = [
    { label: "Active coupons", value: couponList.filter((coupon) => coupon.status === "Active").length, detail: "Currently redeemable" },
    { label: "Redemptions", value: couponList.reduce((total, coupon) => total + coupon.usage, 0), detail: "Across live campaigns" },
    { label: "Live banners", value: banners.filter((banner) => banner.status === "Live").length, detail: "Visible storefront placements" },
    { label: "Risk watch", value: couponList.filter((coupon) => coupon.risk !== "Healthy").length, detail: "Budget or abuse checks" }
  ];

  useEffect(() => {
    let active = true;
    Promise.all([adminApi<{ coupons: AdminCoupon[] }>("coupons"), adminApi<{ banners: PromotionBanner[] }>("coupon-banners")])
      .then(([couponResponse, bannerResponse]) => {
        if (!active) return;
        setCouponList(couponResponse.coupons);
        setBanners(bannerResponse.banners);
        setSelectedCoupon(couponResponse.coupons[0] ?? initialCoupons[0]);
        setSelectedBanner(bannerResponse.banners[0] ?? initialPromotionBanners[0]);
        setCouponNotice("Coupons and banners loaded from backend API.");
      })
      .catch((error) => {
        if (active) setCouponNotice(`Coupons API unavailable: ${error instanceof Error ? error.message : "using saved local state"}`);
      });
    return () => {
      active = false;
    };
  }, [setBanners, setCouponList]);

  useEffect(() => {
    publishStorefrontPatch({
      coupons: couponsToStorefront(couponList),
      couponBanners: bannersToStorefront(banners)
    });
  }, [banners, couponList]);

  function changeFilter(filter: CouponFilter) {
    setActiveFilter(filter);
    setCouponNotice(`${filter} coupons loaded.`);
  }

  function openCouponDialog(dialog: Exclude<CouponDialog, null>, coupon = selectedCoupon) {
    setSelectedCoupon(coupon);
    setCouponDialog(dialog);
    setCouponNotice(
      dialog === "create"
        ? "Create coupon form opened."
        : dialog === "usage"
          ? `${coupon.code} usage details opened.`
          : dialog === "risk"
            ? `${coupon.code} risk review opened.`
            : `${selectedBanner.placement} banner editor opened.`
    );
  }

  function openBannerDialog(banner = selectedBanner) {
    setSelectedBanner(banner);
    setCouponDialog("banner");
    setCouponNotice(`${banner.placement} banner editor opened.`);
  }

  function pauseCoupon(coupon: AdminCoupon) {
    const nextStatus: CouponStatus = coupon.status === "Paused" ? "Active" : "Paused";
    void adminApi<{ coupon: AdminCoupon }>(`coupons/${coupon.code}`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus })
    })
      .then(({ coupon: updatedCoupon }) => {
        setCouponList((items) => items.map((item) => (item.code === coupon.code ? updatedCoupon : item)));
        setSelectedCoupon(updatedCoupon);
        setCouponNotice(`${updatedCoupon.code} ${nextStatus === "Paused" ? "paused" : "activated"} in backend.`);
      })
      .catch((error) => setCouponNotice(`Coupon status failed: ${error instanceof Error ? error.message : "backend request failed"}`));
  }

  function duplicateCoupon(coupon: AdminCoupon) {
    const copiedCoupon: AdminCoupon = {
      ...coupon,
      code: `${coupon.code}COPY`,
      campaign: `${coupon.campaign} copy`,
      status: "Scheduled",
      usage: 0,
      revenue: "Rs. 0"
    };
    void adminApi<{ coupon: AdminCoupon }>("coupons", {
      method: "POST",
      body: JSON.stringify(copiedCoupon)
    })
      .then(({ coupon: savedCoupon }) => {
        setCouponList((items) => [savedCoupon, ...items]);
        setSelectedCoupon(savedCoupon);
        setCouponNotice(`${coupon.code} duplicated as ${savedCoupon.code} in backend.`);
      })
      .catch((error) => setCouponNotice(`Coupon duplicate failed: ${error instanceof Error ? error.message : "backend request failed"}`));
  }

  function createCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rawCode = String(formData.get("code") || `NEW${couponList.length + 1}0`).trim().toUpperCase();
    const code = couponList.some((coupon) => coupon.code === rawCode) ? `${rawCode}${couponList.length + 1}` : rawCode;
    const campaign = String(formData.get("campaign") || "New grocery campaign").trim();
    const type = String(formData.get("type") || "Percent") as AdminCoupon["type"];
    const value = String(formData.get("value") || "10%").trim();
    const minCart = String(formData.get("minCart") || "Rs. 499").trim();
    const maxDiscount = String(formData.get("maxDiscount") || "Rs. 120").trim();
    const segment = String(formData.get("segment") || "New customers").trim();
    const status = String(formData.get("status") || "Scheduled") as CouponStatus;
    const valid = String(formData.get("valid") || "Draft schedule").trim();
    const limit = Number(formData.get("limit")) || 500;

    const createdCoupon: AdminCoupon = {
      code,
      campaign,
      type,
      value,
      minCart,
      maxDiscount,
      usage: 0,
      limit,
      segment,
      status,
      valid,
      revenue: "Rs. 0",
      risk: "Healthy"
    };
    void adminApi<{ coupon: AdminCoupon }>("coupons", {
      method: "POST",
      body: JSON.stringify(createdCoupon)
    })
      .then(({ coupon }) => {
        setCouponList((items) => [coupon, ...items]);
        setSelectedCoupon(coupon);
        setCouponDialog(null);
        setCouponNotice(`${coupon.code} created as a scheduled campaign in backend.`);
      })
      .catch((error) => setCouponNotice(`Coupon create failed: ${error instanceof Error ? error.message : "backend request failed"}`));
  }

  function saveBanner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updatedBanner: PromotionBanner = {
      title: String(formData.get("title") || selectedBanner.title).trim(),
      placement: String(formData.get("placement") || selectedBanner.placement).trim(),
      audience: String(formData.get("audience") || selectedBanner.audience).trim(),
      cta: String(formData.get("cta") || selectedBanner.cta).trim(),
      target: String(formData.get("target") || selectedBanner.target).trim(),
      image: String(formData.get("image") || selectedBanner.image || "").trim(),
      status: String(formData.get("status") || selectedBanner.status) as PromotionBanner["status"],
      priority: Number(formData.get("priority")) || selectedBanner.priority
    };

    void adminApi<{ banner: PromotionBanner }>(selectedBanner.id ? `coupon-banners/${selectedBanner.id}` : "coupon-banners", {
      method: selectedBanner.id ? "PATCH" : "POST",
      body: JSON.stringify(updatedBanner)
    })
      .then(({ banner }) => {
        setBanners((items) => (selectedBanner.id ? items.map((item) => (item.id === selectedBanner.id ? banner : item)) : [banner, ...items]));
        setSelectedBanner(banner);
        setCouponDialog(null);
        setCouponNotice(`${banner.placement} banner saved in backend.`);
      })
      .catch((error) => setCouponNotice(`Banner save failed: ${error instanceof Error ? error.message : "backend request failed"}`));
  }

  function toggleBanner(banner: PromotionBanner) {
    const nextStatus = banner.status === "Paused" ? "Live" : "Paused";
    void adminApi<{ banner: PromotionBanner }>(`coupon-banners/${banner.id ?? banner.title}`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus })
    })
      .then(({ banner: updatedBanner }) => {
        setBanners((items) => items.map((item) => ((item.id && item.id === updatedBanner.id) || item.title === banner.title ? updatedBanner : item)));
        setSelectedBanner(updatedBanner);
        setCouponNotice(`${updatedBanner.placement} is now ${updatedBanner.status}.`);
      })
      .catch((error) => setCouponNotice(`Banner status failed: ${error instanceof Error ? error.message : "backend request failed"}`));
  }

  function saveCouponReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updatedCoupon: AdminCoupon = {
      ...selectedCoupon,
      campaign: String(formData.get("campaign") || selectedCoupon.campaign).trim(),
      type: String(formData.get("type") || selectedCoupon.type) as AdminCoupon["type"],
      value: String(formData.get("value") || selectedCoupon.value).trim(),
      minCart: String(formData.get("minCart") || selectedCoupon.minCart).trim(),
      maxDiscount: String(formData.get("maxDiscount") || selectedCoupon.maxDiscount).trim(),
      segment: String(formData.get("segment") || selectedCoupon.segment).trim(),
      usage: Number(formData.get("usage")) || selectedCoupon.usage,
      limit: Number(formData.get("limit")) || selectedCoupon.limit,
      revenue: String(formData.get("revenue") || selectedCoupon.revenue).trim(),
      risk: String(formData.get("risk") || selectedCoupon.risk).trim(),
      status: String(formData.get("status") || selectedCoupon.status) as CouponStatus,
      valid: String(formData.get("valid") || selectedCoupon.valid).trim()
    };
    const reviewNote = String(formData.get("reviewNote") || "Coupon review saved.").trim();
    void adminApi<{ coupon: AdminCoupon }>(`coupons/${updatedCoupon.code}`, {
      method: "PATCH",
      body: JSON.stringify(updatedCoupon)
    })
      .then(({ coupon }) => {
        setCouponList((items) => items.map((item) => (item.code === coupon.code ? coupon : item)));
        setSelectedCoupon(coupon);
        setCouponDialog(null);
        setCouponNotice(`${coupon.code} review saved in backend. ${reviewNote}`);
      })
      .catch((error) => setCouponNotice(`Coupon review save failed: ${error instanceof Error ? error.message : "backend request failed"}`));
  }

  return (
    <>
      {couponNotice ? <div className="admin-notice">{couponNotice}</div> : null}
      <section className="marketing-command">
        <div>
          <span>Marketing control</span>
          <h2>Coupons and promotions</h2>
          <p>Manage grocery discount rules, storefront banners, campaign segments, promotion schedules, and risk checks from one campaign center.</p>
          <div className="marketing-command-tags">
            <span>Coupons</span>
            <span>Banners</span>
            <span>Segments</span>
            <span>Risk control</span>
          </div>
        </div>
        <div className="marketing-command-actions">
          <button className="primary-action" type="button" onClick={() => openCouponDialog("create")}>Create coupon</button>
          <button type="button" onClick={() => openBannerDialog()}>Manage banners</button>
          <button type="button" onClick={() => openCouponDialog("usage")}>View usage</button>
          <button type="button" onClick={() => openCouponDialog("risk")}>Risk review</button>
        </div>
      </section>
      <section className="marketing-stat-grid">
        {couponStats.map((stat) => (
          <article key={stat.label}>
            <div>
              <span>{stat.label}</span>
              <small>{stat.detail}</small>
            </div>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>
      <section className="marketing-layout">
        <CouponManager
          activeFilter={activeFilter}
          coupons={visibleCoupons}
          onDuplicate={duplicateCoupon}
          onFilterChange={changeFilter}
          onPause={pauseCoupon}
          onSelect={(coupon) => setSelectedCoupon(coupon)}
          onUsage={(coupon) => openCouponDialog("usage", coupon)}
        />
        <div className="marketing-side-stack">
          <BannerManager banners={banners} onEdit={openBannerDialog} onToggle={toggleBanner} />
          <CampaignCalendar onCreate={() => openCouponDialog("create")} />
          <RiskPanel coupons={couponList} onReview={(coupon) => openCouponDialog("risk", coupon)} />
        </div>
      </section>
      {couponDialog ? (
        <CouponDialogModal
          banner={selectedBanner}
          coupon={selectedCoupon}
          dialog={couponDialog}
          onClose={() => setCouponDialog(null)}
          onCreateCoupon={createCoupon}
          onPauseCoupon={() => pauseCoupon(selectedCoupon)}
          onSaveBanner={saveBanner}
          onSaveCoupon={saveCouponReview}
          onToggleBanner={() => toggleBanner(selectedBanner)}
        />
      ) : null}
    </>
  );
}

function RefundsView() {
  const [activeTab, setActiveTab] = useState<RefundTab>("Overview");
  const [requests, setRequests] = usePersistentState<AdminRefundRequest[]>("refunds:requests", initialRefundRequests);
  const [returns, setReturns] = usePersistentState<AdminReturnPickup[]>("refunds:returns", initialReturnPickups);
  const [rules, setRules] = usePersistentState<RefundApprovalRule[]>("refunds:rules", initialRefundApprovalRules);
  const [settings, setSettings] = usePersistentState<RefundSettings>("refunds:settings", defaultRefundSettings);
  const [selectedRefund, setSelectedRefund] = useState<AdminRefundRequest>(initialRefundRequests[0]);
  const [selectedReturn, setSelectedReturn] = useState<AdminReturnPickup>(initialReturnPickups[0]);
  const [selectedRule, setSelectedRule] = useState<RefundApprovalRule>(initialRefundApprovalRules[0]);
  const [dialog, setDialog] = useState<"request" | "return" | "rule" | "message" | null>(null);
  const [notice, setNotice] = useState("Refunds and returns control center is ready.");

  const refundTabs: RefundTab[] = ["Overview", "Requests", "Returns", "Approvals", "Finance", "Risk", "Settings"];
  const pendingCount = requests.filter((item) => ["Requested", "Under review", "Awaiting evidence"].includes(item.status)).length;
  const approvedCount = requests.filter((item) => ["Approved", "Processing refund", "Refunded"].includes(item.status)).length;
  const highRiskCount = requests.filter((item) => item.risk === "High").length;
  const pickupCount = returns.filter((item) => !["Closed", "Return received"].includes(item.status)).length;
  const financePending = requests.filter((item) => !["Refunded", "Reconciled"].includes(item.financeStatus)).length;

  const stats = [
    { label: "Requests", value: requests.length, detail: "Total refund cases" },
    { label: "Pending", value: pendingCount, detail: "Need admin action" },
    { label: "Approved", value: approvedCount, detail: "Approved or paid" },
    { label: "Return pickups", value: pickupCount, detail: "Physical return work" },
    { label: "Risk", value: highRiskCount, detail: "High-risk claims" },
    { label: "Finance", value: financePending, detail: "Need payout/reconcile" }
  ];

  function changeTab(tab: RefundTab) {
    setActiveTab(tab);
    setNotice(`${tab} tab opened.`);
  }

  function openRefund(refund: AdminRefundRequest, nextDialog: "request" | "message" = "request") {
    setSelectedRefund(refund);
    setDialog(nextDialog);
    setNotice(`${refund.id} opened for ${nextDialog === "message" ? "customer communication" : "review"}.`);
  }

  function openReturn(item: AdminReturnPickup) {
    setSelectedReturn(item);
    setDialog("return");
    setNotice(`${item.id} return pickup opened.`);
  }

  function openRule(rule: RefundApprovalRule) {
    setSelectedRule(rule);
    setDialog("rule");
    setNotice(`${rule.name} approval rule opened.`);
  }

  function createManualRefund() {
    const created: AdminRefundRequest = {
      ...requests[0],
      id: `RF-${9001 + requests.length}`,
      orderId: "FC-new",
      customer: "New customer",
      phone: "+91 90000 00000",
      email: "customer@example.com",
      reason: "Missing item",
      items: "Select affected items",
      amount: "Rs. 0",
      status: "Requested",
      sla: "4 hr",
      risk: "Low",
      assignedTo: "Owner",
      customerNote: "Manual refund case created by admin.",
      adminNote: "Add order and item review notes.",
      evidence: "Not required",
      transactionId: "Pending",
      financeStatus: "Not started",
      gatewayStatus: "Not started",
      processedBy: "Unassigned",
      processedTime: "Not processed",
      returnStatus: "Not required",
      reviewerDecision: "Needs review",
      riskNote: "New manual refund case."
    };
    setRequests((items) => [created, ...items]);
    setSelectedRefund(created);
    setDialog("request");
    setActiveTab("Requests");
    setNotice(`${created.id} manual refund created. Complete the form and save review.`);
  }

  function updateRefund(refund: AdminRefundRequest, message: string) {
    setRequests((items) => items.map((item) => (item.id === refund.id ? refund : item)));
    setSelectedRefund(refund);
    setNotice(message);
  }

  function updateRefundStatus(refund: AdminRefundRequest, status: RefundStatus) {
    const nextFinanceStatus: RefundFinanceStatus = status === "Approved" ? "Queued" : status === "Rejected" ? "Reconciled" : status === "Refunded" ? "Refunded" : refund.financeStatus;
    updateRefund({ ...refund, status, financeStatus: nextFinanceStatus, processedBy: status === "Rejected" ? "Owner" : refund.processedBy }, `${refund.id} marked ${status}.`);
  }

  function saveRefund(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updated: AdminRefundRequest = {
      ...selectedRefund,
      orderId: String(formData.get("orderId") || selectedRefund.orderId).trim(),
      customer: String(formData.get("customer") || selectedRefund.customer).trim(),
      phone: String(formData.get("phone") || selectedRefund.phone).trim(),
      email: String(formData.get("email") || selectedRefund.email).trim(),
      reason: String(formData.get("reason") || selectedRefund.reason).trim(),
      items: String(formData.get("items") || selectedRefund.items).trim(),
      amount: String(formData.get("amount") || selectedRefund.amount).trim(),
      paymentMethod: String(formData.get("paymentMethod") || selectedRefund.paymentMethod) as AdminRefundRequest["paymentMethod"],
      refundMethod: String(formData.get("refundMethod") || selectedRefund.refundMethod) as RefundMethod,
      status: String(formData.get("status") || selectedRefund.status) as RefundStatus,
      sla: String(formData.get("sla") || selectedRefund.sla).trim(),
      risk: String(formData.get("risk") || selectedRefund.risk) as RefundRiskLevel,
      assignedTo: String(formData.get("assignedTo") || selectedRefund.assignedTo).trim(),
      customerNote: String(formData.get("customerNote") || selectedRefund.customerNote).trim(),
      adminNote: String(formData.get("adminNote") || selectedRefund.adminNote).trim(),
      evidence: String(formData.get("evidence") || selectedRefund.evidence) as AdminRefundRequest["evidence"],
      transactionId: String(formData.get("transactionId") || selectedRefund.transactionId).trim(),
      financeStatus: String(formData.get("financeStatus") || selectedRefund.financeStatus) as RefundFinanceStatus,
      gatewayStatus: String(formData.get("gatewayStatus") || selectedRefund.gatewayStatus).trim(),
      processedBy: String(formData.get("processedBy") || selectedRefund.processedBy).trim(),
      processedTime: String(formData.get("processedTime") || selectedRefund.processedTime).trim(),
      returnStatus: String(formData.get("returnStatus") || selectedRefund.returnStatus) as ReturnPickupStatus,
      reviewerDecision: String(formData.get("reviewerDecision") || selectedRefund.reviewerDecision).trim(),
      riskNote: String(formData.get("riskNote") || selectedRefund.riskNote).trim()
    };
    setRequests((items) => items.map((item) => (item.id === updated.id ? updated : item)));
    setSelectedRefund(updated);
    setDialog(null);
    setNotice(`${updated.id} refund review saved.`);
  }

  function saveReturn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updated: AdminReturnPickup = {
      ...selectedReturn,
      items: String(formData.get("items") || selectedReturn.items).trim(),
      status: String(formData.get("status") || selectedReturn.status) as ReturnPickupStatus,
      slot: String(formData.get("slot") || selectedReturn.slot).trim(),
      rider: String(formData.get("rider") || selectedReturn.rider).trim(),
      address: String(formData.get("address") || selectedReturn.address).trim(),
      condition: String(formData.get("condition") || selectedReturn.condition).trim(),
      restockDecision: String(formData.get("restockDecision") || selectedReturn.restockDecision) as RestockDecision,
      batch: String(formData.get("batch") || selectedReturn.batch).trim(),
      expiry: String(formData.get("expiry") || selectedReturn.expiry).trim(),
      inventoryNote: String(formData.get("inventoryNote") || selectedReturn.inventoryNote).trim()
    };
    setReturns((items) => items.map((item) => (item.id === updated.id ? updated : item)));
    setRequests((items) => items.map((item) => (item.id === updated.refundId ? { ...item, returnStatus: updated.status } : item)));
    setSelectedReturn(updated);
    setDialog(null);
    setNotice(`${updated.id} return pickup saved.`);
  }

  function saveRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updated: RefundApprovalRule = {
      ...selectedRule,
      name: String(formData.get("name") || selectedRule.name).trim(),
      trigger: String(formData.get("trigger") || selectedRule.trigger).trim(),
      limit: String(formData.get("limit") || selectedRule.limit).trim(),
      evidenceRequired: formData.get("evidenceRequired") === "on",
      ownerApproval: formData.get("ownerApproval") === "on",
      autoApprove: formData.get("autoApprove") === "on",
      sla: String(formData.get("sla") || selectedRule.sla).trim(),
      status: String(formData.get("status") || selectedRule.status) as RefundApprovalRule["status"]
    };
    setRules((items) => items.map((item) => (item.id === updated.id ? updated : item)));
    setSelectedRule(updated);
    setDialog(null);
    setNotice(`${updated.name} approval rule saved.`);
  }

  function toggleRule(rule: RefundApprovalRule) {
    const updated = { ...rule, status: rule.status === "Active" ? "Paused" : "Active" } as RefundApprovalRule;
    setRules((items) => items.map((item) => (item.id === rule.id ? updated : item)));
    setSelectedRule((item) => (item.id === rule.id ? updated : item));
    setNotice(`${rule.name} ${updated.status === "Active" ? "activated" : "paused"}.`);
  }

  function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSettings({
      autoApproveLimit: String(formData.get("autoApproveLimit") || settings.autoApproveLimit).trim(),
      ownerApprovalLimit: String(formData.get("ownerApprovalLimit") || settings.ownerApprovalLimit).trim(),
      evidencePolicy: String(formData.get("evidencePolicy") || settings.evidencePolicy).trim(),
      walletCredit: formData.get("walletCredit") === "on",
      returnPickupThreshold: String(formData.get("returnPickupThreshold") || settings.returnPickupThreshold).trim(),
      financeSla: String(formData.get("financeSla") || settings.financeSla).trim(),
      customerMessageChannel: String(formData.get("customerMessageChannel") || settings.customerMessageChannel) as RefundSettings["customerMessageChannel"]
    });
    setNotice("Refund settings saved.");
  }

  function sendRefundMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const channel = String(formData.get("channel") || settings.customerMessageChannel);
    const message = String(formData.get("message") || "").trim();
    setDialog(null);
    setNotice(`${channel} message queued for ${selectedRefund.customer}: ${message || selectedRefund.status}`);
  }

  function createRefundExport() {
    const created: AdminRefundRequest = {
      ...requests[0],
      id: `RF-EXP-${Date.now().toString().slice(-4)}`,
      orderId: "Refund report export",
      customer: "Owner review",
      phone: "",
      email: "owner@freshcart.local",
      reason: "Refund report export",
      items: `${requests.length} refund requests, ${returns.length} return pickups`,
      amount: `${pendingCount} pending / ${financePending} finance`,
      paymentMethod: "Online",
      refundMethod: "Manual payout",
      status: "Under review",
      sla: "Owner review",
      risk: highRiskCount ? "High" : "Low",
      assignedTo: "Owner",
      customerNote: "Internal export record, not sent to customer.",
      adminNote: "Refund report generated from admin panel and retained in frontend store.",
      evidence: "Not required",
      transactionId: "EXPORT",
      financeStatus: "Reconciled",
      gatewayStatus: "Not applicable",
      processedBy: "Owner",
      processedTime: "Just now",
      returnStatus: "Not required",
      reviewerDecision: "Review export before download",
      riskNote: `${highRiskCount} high-risk refund cases included.`
    };
    setRequests((items) => [created, ...items]);
    setSelectedRefund(created);
    setActiveTab("Requests");
    setDialog("request");
    setNotice(`${created.id} refund report export created and opened.`);
  }

  return (
    <>
      {notice ? <div className="admin-notice">{notice}</div> : null}
      <section className="reports-command">
        <div>
          <span>Refund operations</span>
          <h2>Refunds and returns</h2>
          <p>Review refund requests, return pickups, approval rules, customer communication, finance reconciliation, and risk signals from one production control desk.</p>
          <div className="reports-tabs">
            {refundTabs.map((tab) => (
              <button className={activeTab === tab ? "active" : ""} key={tab} type="button" onClick={() => changeTab(tab)}>
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="reports-command-actions">
          <button className="primary-action" type="button" onClick={createManualRefund}>Create manual refund</button>
          <button type="button" onClick={() => changeTab("Approvals")}>Approval rules</button>
          <button type="button" onClick={() => changeTab("Finance")}>Finance queue</button>
          <button type="button" onClick={createRefundExport}>Export report</button>
        </div>
      </section>

      <section className="reports-stat-grid">
        {stats.map((stat) => (
          <button key={stat.label} type="button" onClick={() => setNotice(`${stat.label}: ${stat.value} - ${stat.detail}`)}>
            <div><span>{stat.label}</span><small>{stat.detail}</small></div>
            <strong>{stat.value}</strong>
          </button>
        ))}
      </section>

      {activeTab === "Overview" ? (
        <section className="reports-layout">
          <div className="reports-main-stack">
            <RefundRequestsPanel requests={requests} onApprove={(refund) => updateRefundStatus(refund, "Approved")} onEvidence={(refund) => updateRefundStatus(refund, "Awaiting evidence")} onMessage={(refund) => openRefund(refund, "message")} onOpen={openRefund} onReject={(refund) => updateRefundStatus(refund, "Rejected")} />
          </div>
          <div className="reports-side-stack">
            <RefundRiskPanel requests={requests} onOpen={openRefund} onReview={(refund) => updateRefund({ ...refund, risk: "Low", riskNote: "Risk reviewed by admin." }, `${refund.id} risk reviewed.`)} />
            <RefundApprovalsPanel rules={rules} onEdit={openRule} onToggle={toggleRule} />
          </div>
        </section>
      ) : null}
      {activeTab === "Requests" ? <RefundRequestsPanel requests={requests} onApprove={(refund) => updateRefundStatus(refund, "Approved")} onEvidence={(refund) => updateRefundStatus(refund, "Awaiting evidence")} onMessage={(refund) => openRefund(refund, "message")} onOpen={openRefund} onReject={(refund) => updateRefundStatus(refund, "Rejected")} full /> : null}
      {activeTab === "Returns" ? <RefundReturnsPanel returns={returns} onOpen={openReturn} onStatus={(item, status) => { const updated = { ...item, status }; setReturns((current) => current.map((entry) => (entry.id === item.id ? updated : entry))); setNotice(`${item.id} marked ${status}.`); }} /> : null}
      {activeTab === "Approvals" ? <RefundApprovalsPanel rules={rules} onEdit={openRule} onToggle={toggleRule} full /> : null}
      {activeTab === "Finance" ? <RefundFinancePanel requests={requests} onMarkRefunded={(refund) => updateRefund({ ...refund, status: "Refunded", financeStatus: "Refunded", processedBy: "Finance", processedTime: "Just now" }, `${refund.id} marked refunded.`)} onOpen={openRefund} onReconcile={(refund) => updateRefund({ ...refund, financeStatus: "Reconciled", processedTime: "Reconciled just now" }, `${refund.id} reconciled.`)} /> : null}
      {activeTab === "Risk" ? <RefundRiskPanel requests={requests} onOpen={openRefund} onReview={(refund) => updateRefund({ ...refund, risk: "Low", riskNote: "Risk reviewed by admin." }, `${refund.id} risk reviewed.`)} full /> : null}
      {activeTab === "Settings" ? <RefundSettingsPanel settings={settings} onSave={saveSettings} /> : null}

      {dialog === "request" ? <RefundRequestDialog refund={selectedRefund} onApprove={() => updateRefundStatus(selectedRefund, "Approved")} onClose={() => setDialog(null)} onMessage={() => setDialog("message")} onReject={() => updateRefundStatus(selectedRefund, "Rejected")} onSave={saveRefund} /> : null}
      {dialog === "return" ? <RefundReturnDialog item={selectedReturn} onClose={() => setDialog(null)} onSave={saveReturn} /> : null}
      {dialog === "rule" ? <RefundRuleDialog onClose={() => setDialog(null)} onSave={saveRule} rule={selectedRule} /> : null}
      {dialog === "message" ? <RefundMessageDialog channel={settings.customerMessageChannel} onClose={() => setDialog(null)} onSend={sendRefundMessage} refund={selectedRefund} /> : null}
    </>
  );
}

function RefundRequestsPanel({
  full = false,
  onApprove,
  onEvidence,
  onMessage,
  onOpen,
  onReject,
  requests
}: {
  full?: boolean;
  onApprove: (refund: AdminRefundRequest) => void;
  onEvidence: (refund: AdminRefundRequest) => void;
  onMessage: (refund: AdminRefundRequest) => void;
  onOpen: (refund: AdminRefundRequest) => void;
  onReject: (refund: AdminRefundRequest) => void;
  requests: AdminRefundRequest[];
}) {
  const visibleRequests = full ? requests : requests.slice(0, 4);
  return (
    <section className="reports-panel">
      <div className="reports-panel-head">
        <div><span>Requests</span><h2>{full ? "Refund request queue" : "Priority refund queue"}</h2></div>
      </div>
      <div className="report-table">
        <div className="report-row report-row-head" style={{ gridTemplateColumns: "1.1fr 1fr 1fr 1fr 1fr 1fr 1.4fr" }}>
          <span>Refund</span><span>Customer</span><span>Reason</span><span>Amount</span><span>Status</span><span>Risk</span><span>Actions</span>
        </div>
        {visibleRequests.map((refund) => (
          <div className="report-row" key={refund.id} style={{ gridTemplateColumns: "1.1fr 1fr 1fr 1fr 1fr 1fr 1.4fr" }}>
            <span><strong>{refund.id}</strong><small>{refund.orderId} · {refund.sla}</small></span>
            <span><strong>{refund.customer}</strong><small>{refund.phone}</small></span>
            <span>{refund.reason}</span>
            <span>{refund.amount}</span>
            <span><Badge label={refund.status} /></span>
            <span><Badge label={refund.risk} /></span>
            <span className="report-actions">
              <button type="button" onClick={() => onOpen(refund)}>Open</button>
              <button type="button" onClick={() => onApprove(refund)}>Approve</button>
              <button type="button" onClick={() => onReject(refund)}>Reject</button>
              <button type="button" onClick={() => onEvidence(refund)}>Evidence</button>
              <button type="button" onClick={() => onMessage(refund)}>Message</button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function RefundReturnsPanel({ onOpen, onStatus, returns }: { onOpen: (item: AdminReturnPickup) => void; onStatus: (item: AdminReturnPickup, status: ReturnPickupStatus) => void; returns: AdminReturnPickup[] }) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head"><div><span>Returns</span><h2>Return pickup and inventory impact</h2></div></div>
      <div className="report-table">
        <div className="report-row report-row-head" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.2fr" }}>
          <span>Return</span><span>Customer</span><span>Pickup</span><span>Condition</span><span>Restock</span><span>Actions</span>
        </div>
        {returns.map((item) => (
          <div className="report-row" key={item.id} style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.2fr" }}>
            <span><strong>{item.id}</strong><small>{item.refundId} · {item.orderId}</small></span>
            <span><strong>{item.customer}</strong><small>{item.items}</small></span>
            <span><Badge label={item.status} /><small>{item.slot}</small></span>
            <span>{item.condition}</span>
            <span>{item.restockDecision}</span>
            <span className="report-actions">
              <button type="button" onClick={() => onOpen(item)}>Open</button>
              <button type="button" onClick={() => onStatus(item, "Rider assigned")}>Assign</button>
              <button type="button" onClick={() => onStatus(item, "Return received")}>Received</button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function RefundApprovalsPanel({ full = false, onEdit, onToggle, rules }: { full?: boolean; onEdit: (rule: RefundApprovalRule) => void; onToggle: (rule: RefundApprovalRule) => void; rules: RefundApprovalRule[] }) {
  return (
    <section className="reports-panel compact">
      <div className="reports-panel-head"><div><span>Approvals</span><h2>{full ? "Approval rule controls" : "Approval rules"}</h2></div></div>
      <div className="report-export-list">
        {rules.map((rule) => (
          <article key={rule.id}>
            <div>
              <strong>{rule.name}</strong>
              <span>{rule.trigger} · {rule.limit} · SLA {rule.sla}</span>
              <small>{rule.evidenceRequired ? "Evidence required" : "No evidence"} · {rule.ownerApproval ? "Owner approval" : "Manager approval"} · {rule.autoApprove ? "Auto approve" : "Manual review"}</small>
            </div>
            <Badge label={rule.status} />
            <div className="report-actions">
              <button type="button" onClick={() => onEdit(rule)}>Edit</button>
              <button type="button" onClick={() => onToggle(rule)}>{rule.status === "Active" ? "Pause" : "Activate"}</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RefundFinancePanel({ onMarkRefunded, onOpen, onReconcile, requests }: { onMarkRefunded: (refund: AdminRefundRequest) => void; onOpen: (refund: AdminRefundRequest) => void; onReconcile: (refund: AdminRefundRequest) => void; requests: AdminRefundRequest[] }) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head"><div><span>Finance</span><h2>Refund payment reconciliation</h2></div></div>
      <div className="report-table">
        <div className="report-row report-row-head" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.4fr" }}>
          <span>Refund</span><span>Amount</span><span>Method</span><span>Gateway</span><span>Finance</span><span>Actions</span>
        </div>
        {requests.map((refund) => (
          <div className="report-row" key={refund.id} style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.4fr" }}>
            <span><strong>{refund.id}</strong><small>{refund.transactionId}</small></span>
            <span>{refund.amount}</span>
            <span>{refund.refundMethod}</span>
            <span>{refund.gatewayStatus}</span>
            <span><Badge label={refund.financeStatus} /></span>
            <span className="report-actions">
              <button type="button" onClick={() => onOpen(refund)}>Open</button>
              <button type="button" onClick={() => onMarkRefunded(refund)}>Mark refunded</button>
              <button type="button" onClick={() => onReconcile(refund)}>Reconcile</button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function RefundRiskPanel({ full = false, onOpen, onReview, requests }: { full?: boolean; onOpen: (refund: AdminRefundRequest) => void; onReview: (refund: AdminRefundRequest) => void; requests: AdminRefundRequest[] }) {
  const riskyRequests = requests.filter((refund) => full || refund.risk !== "Low");
  return (
    <section className="reports-panel compact">
      <div className="reports-panel-head"><div><span>Risk</span><h2>{full ? "Refund risk review" : "Risk watch"}</h2></div></div>
      <div className="report-export-list">
        {riskyRequests.map((refund) => (
          <article key={refund.id}>
            <div>
              <strong>{refund.customer}</strong>
              <span>{refund.id} · {refund.reason} · {refund.amount}</span>
              <small>{refund.riskNote}</small>
            </div>
            <Badge label={refund.risk} />
            <div className="report-actions">
              <button type="button" onClick={() => onOpen(refund)}>Open</button>
              <button type="button" onClick={() => onReview(refund)}>Review</button>
            </div>
          </article>
        ))}
        {riskyRequests.length === 0 ? <div className="notification-empty">No risky refund claims right now.</div> : null}
      </div>
    </section>
  );
}

function RefundSettingsPanel({ onSave, settings }: { onSave: (event: FormEvent<HTMLFormElement>) => void; settings: RefundSettings }) {
  return (
    <form className="settings-panel" onSubmit={onSave}>
      <SettingsPanelHead eyebrow="Refund settings" title="Policy and automation" />
      <div className="settings-form-grid">
        <label><span>Auto approve limit</span><input name="autoApproveLimit" defaultValue={settings.autoApproveLimit} /></label>
        <label><span>Owner approval limit</span><input name="ownerApprovalLimit" defaultValue={settings.ownerApprovalLimit} /></label>
        <label><span>Return pickup threshold</span><input name="returnPickupThreshold" defaultValue={settings.returnPickupThreshold} /></label>
        <label><span>Finance SLA</span><input name="financeSla" defaultValue={settings.financeSla} /></label>
        <label><span>Default message channel</span><select name="customerMessageChannel" defaultValue={settings.customerMessageChannel}><option>WhatsApp</option><option>SMS</option><option>Email</option></select></label>
        <SettingToggle defaultChecked={settings.walletCredit} label="Allow wallet credit" name="walletCredit" />
        <label className="settings-wide"><span>Evidence policy</span><textarea name="evidencePolicy" defaultValue={settings.evidencePolicy} rows={4} /></label>
      </div>
      <SettingsActions primary="Save refund settings" />
    </form>
  );
}

function RefundRequestDialog({ onApprove, onClose, onMessage, onReject, onSave, refund }: { onApprove: () => void; onClose: () => void; onMessage: () => void; onReject: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void; refund: AdminRefundRequest }) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSave}>
        <div className="product-dialog-head">
          <div><span>{refund.id}</span><h3>Refund request review</h3></div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <div className="settings-form-grid">
          <label><span>Order ID</span><input name="orderId" defaultValue={refund.orderId} /></label>
          <label><span>Customer</span><input name="customer" defaultValue={refund.customer} /></label>
          <label><span>Phone</span><input name="phone" defaultValue={refund.phone} /></label>
          <label><span>Email</span><input name="email" defaultValue={refund.email} /></label>
          <label><span>Reason</span><input name="reason" defaultValue={refund.reason} /></label>
          <label><span>Amount</span><input name="amount" defaultValue={refund.amount} /></label>
          <label className="settings-wide"><span>Affected items</span><input name="items" defaultValue={refund.items} /></label>
          <label><span>Payment method</span><select name="paymentMethod" defaultValue={refund.paymentMethod}><option>COD</option><option>Online</option><option>UPI</option><option>Card</option><option>Wallet</option></select></label>
          <label><span>Refund method</span><select name="refundMethod" defaultValue={refund.refundMethod}><option>Original payment</option><option>Wallet credit</option><option>Coupon credit</option><option>Manual payout</option></select></label>
          <label><span>Status</span><select name="status" defaultValue={refund.status}><option>Requested</option><option>Under review</option><option>Awaiting evidence</option><option>Approved</option><option>Rejected</option><option>Processing refund</option><option>Refunded</option><option>Return pickup scheduled</option><option>Return received</option><option>Closed</option></select></label>
          <label><span>SLA</span><input name="sla" defaultValue={refund.sla} /></label>
          <label><span>Risk</span><select name="risk" defaultValue={refund.risk}><option>Low</option><option>Medium</option><option>High</option></select></label>
          <label><span>Assigned to</span><input name="assignedTo" defaultValue={refund.assignedTo} /></label>
          <label><span>Evidence</span><select name="evidence" defaultValue={refund.evidence}><option>Not required</option><option>Requested</option><option>Received</option><option>Rejected</option></select></label>
          <label><span>Return status</span><select name="returnStatus" defaultValue={refund.returnStatus}><option>Not required</option><option>Pickup pending</option><option>Pickup scheduled</option><option>Rider assigned</option><option>Picked up</option><option>Return received</option><option>Return failed</option><option>Closed</option></select></label>
          <label><span>Finance status</span><select name="financeStatus" defaultValue={refund.financeStatus}><option>Not started</option><option>Queued</option><option>Processing</option><option>Refunded</option><option>Failed</option><option>Manual payout required</option><option>Reconciled</option></select></label>
          <label><span>Transaction ID</span><input name="transactionId" defaultValue={refund.transactionId} /></label>
          <label><span>Gateway status</span><input name="gatewayStatus" defaultValue={refund.gatewayStatus} /></label>
          <label><span>Processed by</span><input name="processedBy" defaultValue={refund.processedBy} /></label>
          <label><span>Processed time</span><input name="processedTime" defaultValue={refund.processedTime} /></label>
          <label className="settings-wide"><span>Customer note</span><textarea name="customerNote" defaultValue={refund.customerNote} rows={3} /></label>
          <label className="settings-wide"><span>Admin note</span><textarea name="adminNote" defaultValue={refund.adminNote} rows={3} /></label>
          <label className="settings-wide"><span>Reviewer decision</span><input name="reviewerDecision" defaultValue={refund.reviewerDecision} /></label>
          <label className="settings-wide"><span>Risk note</span><input name="riskNote" defaultValue={refund.riskNote} /></label>
        </div>
        <div className="product-dialog-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button" onClick={onMessage}>Message customer</button>
          <button type="button" onClick={onApprove}>Approve</button>
          <button type="button" onClick={onReject}>Reject</button>
          <button type="submit">Save review</button>
        </div>
      </form>
    </div>
  );
}

function RefundReturnDialog({ item, onClose, onSave }: { item: AdminReturnPickup; onClose: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSave}>
        <div className="product-dialog-head">
          <div><span>{item.id}</span><h3>Return pickup review</h3></div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <div className="settings-form-grid">
          <label><span>Refund ID</span><input value={item.refundId} readOnly /></label>
          <label><span>Order ID</span><input value={item.orderId} readOnly /></label>
          <label><span>Customer</span><input value={item.customer} readOnly /></label>
          <label><span>Status</span><select name="status" defaultValue={item.status}><option>Not required</option><option>Pickup pending</option><option>Pickup scheduled</option><option>Rider assigned</option><option>Picked up</option><option>Return received</option><option>Return failed</option><option>Closed</option></select></label>
          <label className="settings-wide"><span>Items</span><input name="items" defaultValue={item.items} /></label>
          <label><span>Pickup slot</span><input name="slot" defaultValue={item.slot} /></label>
          <label><span>Rider</span><input name="rider" defaultValue={item.rider} /></label>
          <label className="settings-wide"><span>Pickup address</span><input name="address" defaultValue={item.address} /></label>
          <label><span>Item condition</span><input name="condition" defaultValue={item.condition} /></label>
          <label><span>Restock decision</span><select name="restockDecision" defaultValue={item.restockDecision}><option>Restock</option><option>Quarantine</option><option>Discard</option><option>Supplier claim</option><option>Needs manager review</option></select></label>
          <label><span>Batch</span><input name="batch" defaultValue={item.batch} /></label>
          <label><span>Expiry</span><input name="expiry" defaultValue={item.expiry} /></label>
          <label className="settings-wide"><span>Inventory note</span><textarea name="inventoryNote" defaultValue={item.inventoryNote} rows={4} /></label>
        </div>
        <div className="product-dialog-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">Save return</button>
        </div>
      </form>
    </div>
  );
}

function RefundRuleDialog({ onClose, onSave, rule }: { onClose: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void; rule: RefundApprovalRule }) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSave}>
        <div className="product-dialog-head">
          <div><span>{rule.id}</span><h3>Approval rule</h3></div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <div className="settings-form-grid">
          <label><span>Rule name</span><input name="name" defaultValue={rule.name} /></label>
          <label><span>Status</span><select name="status" defaultValue={rule.status}><option>Active</option><option>Paused</option></select></label>
          <label className="settings-wide"><span>Trigger</span><input name="trigger" defaultValue={rule.trigger} /></label>
          <label><span>Refund limit</span><input name="limit" defaultValue={rule.limit} /></label>
          <label><span>SLA target</span><input name="sla" defaultValue={rule.sla} /></label>
          <SettingToggle defaultChecked={rule.evidenceRequired} label="Evidence required" name="evidenceRequired" />
          <SettingToggle defaultChecked={rule.ownerApproval} label="Owner approval required" name="ownerApproval" />
          <SettingToggle defaultChecked={rule.autoApprove} label="Auto approve enabled" name="autoApprove" />
        </div>
        <div className="product-dialog-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">Save rule</button>
        </div>
      </form>
    </div>
  );
}

function RefundMessageDialog({ channel, onClose, onSend, refund }: { channel: RefundSettings["customerMessageChannel"]; onClose: () => void; onSend: (event: FormEvent<HTMLFormElement>) => void; refund: AdminRefundRequest }) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSend}>
        <div className="product-dialog-head">
          <div><span>{refund.id}</span><h3>Customer refund update</h3></div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <div className="settings-form-grid">
          <label><span>Customer</span><input value={refund.customer} readOnly /></label>
          <label><span>Phone</span><input value={refund.phone} readOnly /></label>
          <label><span>Channel</span><select name="channel" defaultValue={channel}><option>WhatsApp</option><option>SMS</option><option>Email</option></select></label>
          <label><span>Status</span><input value={refund.status} readOnly /></label>
          <label className="settings-wide"><span>Message</span><textarea name="message" defaultValue={`Hi ${refund.customer.split(" ")[0]}, your refund request ${refund.id} is currently ${refund.status}. We will keep you updated.`} rows={5} /></label>
        </div>
        <div className="product-dialog-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">Send update</button>
        </div>
      </form>
    </div>
  );
}

function FinanceView() {
  const [activeTab, setActiveTab] = useState<FinanceTab>("Overview");
  const [payments, setPayments] = usePersistentState<FinancePayment[]>("finance:payments", initialFinancePayments);
  const [codCollections, setCodCollections] = usePersistentState<FinanceCodCollection[]>("finance:cod-collections", initialFinanceCodCollections);
  const [refunds, setRefunds] = usePersistentState<FinanceRefundItem[]>("finance:refunds", initialFinanceRefunds);
  const [settlements, setSettlements] = usePersistentState<FinanceSettlement[]>("finance:settlements", initialFinanceSettlements);
  const [expenses, setExpenses] = usePersistentState<FinanceExpense[]>("finance:expenses", initialFinanceExpenses);
  const [invoices, setInvoices] = usePersistentState<FinanceInvoice[]>("finance:invoices", initialFinanceInvoices);
  const [reports, setReports] = usePersistentState<FinanceReportExport[]>("finance:reports", initialFinanceReports);
  const [taxSettings, setTaxSettings] = usePersistentState<FinanceTaxSettings>("finance:tax-settings", initialFinanceTaxSettings);
  const [selectedPayment, setSelectedPayment] = useState<FinancePayment>(initialFinancePayments[0]);
  const [selectedCod, setSelectedCod] = useState<FinanceCodCollection>(initialFinanceCodCollections[0]);
  const [selectedRefund, setSelectedRefund] = useState<FinanceRefundItem>(initialFinanceRefunds[0]);
  const [selectedSettlement, setSelectedSettlement] = useState<FinanceSettlement>(initialFinanceSettlements[0]);
  const [selectedExpense, setSelectedExpense] = useState<FinanceExpense>(initialFinanceExpenses[0]);
  const [selectedInvoice, setSelectedInvoice] = useState<FinanceInvoice>(initialFinanceInvoices[0]);
  const [selectedReport, setSelectedReport] = useState<FinanceReportExport>(initialFinanceReports[0]);
  const [dialog, setDialog] = useState<FinanceDialog>(null);
  const [notice, setNotice] = useState("Finance control center is ready.");

  const financeTabs: FinanceTab[] = ["Overview", "Payments", "COD", "Refunds", "Settlements", "Expenses", "Profit", "Taxes", "Invoices", "Reports"];
  const onlineReceived = payments.filter((payment) => ["Paid", "Reconciled"].includes(payment.status) && payment.method !== "COD").length;
  const codPending = codCollections.filter((collection) => collection.status !== "Verified").length;
  const settlementIssues = settlements.filter((settlement) => ["Mismatch", "Pending", "Under review"].includes(settlement.status)).length;
  const expenseNeedsAction = expenses.filter((expense) => ["Awaiting approval", "Receipt missing", "Draft"].includes(expense.status)).length;
  const invoiceNeedsAction = invoices.filter((invoice) => ["Generated", "Failed"].includes(invoice.status)).length;
  const todayRevenue = payments
    .filter((payment) => ["Paid", "Reconciled", "COD collected"].includes(payment.status))
    .reduce((total, payment) => total + parseCurrencyAmount(payment.amount), 0);
  const stats = [
    { label: "Today revenue", value: formatCurrencyAmount(todayRevenue), detail: "From recorded payments" },
    { label: "Online received", value: onlineReceived, detail: "Paid/reconciled payments" },
    { label: "COD pending", value: codPending, detail: "Collections need action" },
    { label: "Settlements", value: settlementIssues, detail: "Pending or mismatch" },
    { label: "Expenses", value: expenseNeedsAction, detail: "Approval/receipt needed" },
    { label: "Invoices", value: invoiceNeedsAction, detail: "Need send/review" }
  ];

  function changeTab(tab: FinanceTab) {
    setActiveTab(tab);
    setNotice(`${tab} tab opened.`);
  }

  function openPayment(payment: FinancePayment) {
    setSelectedPayment(payment);
    setDialog("payment");
    setNotice(`${payment.id} opened.`);
  }

  function openCod(collection: FinanceCodCollection) {
    setSelectedCod(collection);
    setDialog("cod");
    setNotice(`${collection.id} opened.`);
  }

  function openRefund(refund: FinanceRefundItem) {
    setSelectedRefund(refund);
    setDialog("refund");
    setNotice(`${refund.id} finance refund opened.`);
  }

  function openSettlement(settlement: FinanceSettlement) {
    setSelectedSettlement(settlement);
    setDialog("settlement");
    setNotice(`${settlement.id} settlement opened.`);
  }

  function openExpense(expense: FinanceExpense) {
    setSelectedExpense(expense);
    setDialog("expense");
    setNotice(`${expense.id} expense opened.`);
  }

  function openInvoice(invoice: FinanceInvoice) {
    setSelectedInvoice(invoice);
    setDialog("invoice");
    setNotice(`${invoice.id} invoice opened.`);
  }

  function openReport(report: FinanceReportExport) {
    setSelectedReport(report);
    setDialog("report");
    setNotice(`${report.title} export opened.`);
  }

  function updatePayment(payment: FinancePayment, message: string) {
    setPayments((items) => items.map((item) => (item.id === payment.id ? payment : item)));
    setSelectedPayment(payment);
    setNotice(message);
  }

  function updateCod(collection: FinanceCodCollection, message: string) {
    setCodCollections((items) => items.map((item) => (item.id === collection.id ? collection : item)));
    setSelectedCod(collection);
    setNotice(message);
  }

  function updateRefund(refund: FinanceRefundItem, message: string) {
    setRefunds((items) => items.map((item) => (item.id === refund.id ? refund : item)));
    setSelectedRefund(refund);
    setNotice(message);
  }

  function updateSettlement(settlement: FinanceSettlement, message: string) {
    setSettlements((items) => items.map((item) => (item.id === settlement.id ? settlement : item)));
    setSelectedSettlement(settlement);
    setNotice(message);
  }

  function updateExpense(expense: FinanceExpense, message: string) {
    setExpenses((items) => items.map((item) => (item.id === expense.id ? expense : item)));
    setSelectedExpense(expense);
    setNotice(message);
  }

  function updateInvoice(invoice: FinanceInvoice, message: string) {
    setInvoices((items) => items.map((item) => (item.id === invoice.id ? invoice : item)));
    setSelectedInvoice(invoice);
    setNotice(message);
  }

  function createExpense() {
    const created: FinanceExpense = { id: `EXP-${3301 + expenses.length}`, category: "Manual expense", vendor: "New vendor", amount: "Rs. 0", method: "UPI", paidDate: "Pending", dueDate: "Today", receipt: "Missing", status: "Draft", note: "Add expense details." };
    setExpenses((items) => [created, ...items]);
    setSelectedExpense(created);
    setActiveTab("Expenses");
    setDialog("expense");
    setNotice(`${created.id} created. Complete the expense form.`);
  }

  function createReport() {
    const created: FinanceReportExport = { id: `FIN-RP-0${reports.length + 1}`, title: "Custom finance export", format: "XLSX", status: "Processing", dateRange: "Custom range", owner: "Owner" };
    setReports((items) => [created, ...items]);
    setSelectedReport(created);
    setActiveTab("Reports");
    setDialog("report");
    setNotice(`${created.title} started.`);
  }

  function savePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updated: FinancePayment = {
      ...selectedPayment,
      orderId: String(formData.get("orderId") || selectedPayment.orderId).trim(),
      customer: String(formData.get("customer") || selectedPayment.customer).trim(),
      phone: String(formData.get("phone") || selectedPayment.phone).trim(),
      method: String(formData.get("method") || selectedPayment.method) as FinancePaymentMethod,
      status: String(formData.get("status") || selectedPayment.status) as FinancePaymentStatus,
      gatewayId: String(formData.get("gatewayId") || selectedPayment.gatewayId).trim(),
      amount: String(formData.get("amount") || selectedPayment.amount).trim(),
      time: String(formData.get("time") || selectedPayment.time).trim(),
      gateway: String(formData.get("gateway") || selectedPayment.gateway).trim(),
      failureReason: String(formData.get("failureReason") || selectedPayment.failureReason).trim(),
      reconciliation: String(formData.get("reconciliation") || selectedPayment.reconciliation) as FinanceReconciliationStatus,
      owner: String(formData.get("owner") || selectedPayment.owner).trim(),
      note: String(formData.get("note") || selectedPayment.note).trim()
    };
    updatePayment(updated, `${updated.id} payment saved.`);
    setDialog(null);
  }

  function saveCod(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updated: FinanceCodCollection = {
      ...selectedCod,
      rider: String(formData.get("rider") || selectedCod.rider).trim(),
      phone: String(formData.get("phone") || selectedCod.phone).trim(),
      orders: Number(formData.get("orders") || selectedCod.orders),
      collected: String(formData.get("collected") || selectedCod.collected).trim(),
      submitted: String(formData.get("submitted") || selectedCod.submitted).trim(),
      difference: String(formData.get("difference") || selectedCod.difference).trim(),
      status: String(formData.get("status") || selectedCod.status) as FinanceCodStatus,
      settlementTime: String(formData.get("settlementTime") || selectedCod.settlementTime).trim(),
      proof: String(formData.get("proof") || selectedCod.proof) as FinanceCodCollection["proof"],
      owner: String(formData.get("owner") || selectedCod.owner).trim(),
      note: String(formData.get("note") || selectedCod.note).trim()
    };
    updateCod(updated, `${updated.id} COD collection saved.`);
    setDialog(null);
  }

  function saveRefund(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updated: FinanceRefundItem = {
      ...selectedRefund,
      orderId: String(formData.get("orderId") || selectedRefund.orderId).trim(),
      customer: String(formData.get("customer") || selectedRefund.customer).trim(),
      amount: String(formData.get("amount") || selectedRefund.amount).trim(),
      method: String(formData.get("method") || selectedRefund.method) as RefundMethod,
      gatewayStatus: String(formData.get("gatewayStatus") || selectedRefund.gatewayStatus).trim(),
      walletCredit: String(formData.get("walletCredit") || selectedRefund.walletCredit).trim(),
      adjustment: String(formData.get("adjustment") || selectedRefund.adjustment).trim(),
      status: String(formData.get("status") || selectedRefund.status) as FinanceRefundStatus,
      reconciliation: String(formData.get("reconciliation") || selectedRefund.reconciliation) as FinanceReconciliationStatus,
      transactionId: String(formData.get("transactionId") || selectedRefund.transactionId).trim(),
      note: String(formData.get("note") || selectedRefund.note).trim()
    };
    updateRefund(updated, `${updated.id} finance refund saved.`);
    setDialog(null);
  }

  function saveSettlement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updated: FinanceSettlement = {
      ...selectedSettlement,
      gateway: String(formData.get("gateway") || selectedSettlement.gateway).trim(),
      batchDate: String(formData.get("batchDate") || selectedSettlement.batchDate).trim(),
      expectedDate: String(formData.get("expectedDate") || selectedSettlement.expectedDate).trim(),
      gross: String(formData.get("gross") || selectedSettlement.gross).trim(),
      charges: String(formData.get("charges") || selectedSettlement.charges).trim(),
      deductions: String(formData.get("deductions") || selectedSettlement.deductions).trim(),
      net: String(formData.get("net") || selectedSettlement.net).trim(),
      received: String(formData.get("received") || selectedSettlement.received).trim(),
      difference: String(formData.get("difference") || selectedSettlement.difference).trim(),
      status: String(formData.get("status") || selectedSettlement.status) as FinanceSettlementStatus,
      bankReference: String(formData.get("bankReference") || selectedSettlement.bankReference).trim(),
      note: String(formData.get("note") || selectedSettlement.note).trim()
    };
    updateSettlement(updated, `${updated.id} settlement saved.`);
    setDialog(null);
  }

  function saveExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updated: FinanceExpense = {
      ...selectedExpense,
      category: String(formData.get("category") || selectedExpense.category).trim(),
      vendor: String(formData.get("vendor") || selectedExpense.vendor).trim(),
      amount: String(formData.get("amount") || selectedExpense.amount).trim(),
      method: String(formData.get("method") || selectedExpense.method) as FinancePaymentMethod,
      paidDate: String(formData.get("paidDate") || selectedExpense.paidDate).trim(),
      dueDate: String(formData.get("dueDate") || selectedExpense.dueDate).trim(),
      receipt: String(formData.get("receipt") || selectedExpense.receipt) as FinanceExpense["receipt"],
      status: String(formData.get("status") || selectedExpense.status) as FinanceExpenseStatus,
      note: String(formData.get("note") || selectedExpense.note).trim()
    };
    setExpenses((items) => items.some((item) => item.id === updated.id) ? items.map((item) => (item.id === updated.id ? updated : item)) : [updated, ...items]);
    setSelectedExpense(updated);
    setDialog(null);
    setNotice(`${updated.id} expense saved.`);
  }

  function saveInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updated: FinanceInvoice = {
      ...selectedInvoice,
      reference: String(formData.get("reference") || selectedInvoice.reference).trim(),
      party: String(formData.get("party") || selectedInvoice.party).trim(),
      type: String(formData.get("type") || selectedInvoice.type) as FinanceInvoice["type"],
      amount: String(formData.get("amount") || selectedInvoice.amount).trim(),
      tax: String(formData.get("tax") || selectedInvoice.tax).trim(),
      date: String(formData.get("date") || selectedInvoice.date).trim(),
      status: String(formData.get("status") || selectedInvoice.status) as FinanceInvoiceStatus,
      downloadUrl: String(formData.get("downloadUrl") || selectedInvoice.downloadUrl).trim(),
      sentStatus: String(formData.get("sentStatus") || selectedInvoice.sentStatus).trim(),
      note: String(formData.get("note") || selectedInvoice.note).trim()
    };
    updateInvoice(updated, `${updated.id} invoice saved.`);
    setDialog(null);
  }

  function saveReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updated: FinanceReportExport = {
      ...selectedReport,
      title: String(formData.get("title") || selectedReport.title).trim(),
      format: String(formData.get("format") || selectedReport.format) as FinanceReportExport["format"],
      status: String(formData.get("status") || selectedReport.status) as FinanceReportStatus,
      dateRange: String(formData.get("dateRange") || selectedReport.dateRange).trim(),
      owner: String(formData.get("owner") || selectedReport.owner).trim()
    };
    setReports((items) => items.map((item) => (item.id === updated.id ? updated : item)));
    setSelectedReport(updated);
    setDialog(null);
    setNotice(`${updated.title} export saved.`);
  }

  function saveTaxSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setTaxSettings({
      gstCollected: String(formData.get("gstCollected") || taxSettings.gstCollected).trim(),
      taxableSales: String(formData.get("taxableSales") || taxSettings.taxableSales).trim(),
      exemptSales: String(formData.get("exemptSales") || taxSettings.exemptSales).trim(),
      hsnSummary: String(formData.get("hsnSummary") || taxSettings.hsnSummary).trim(),
      invoiceCount: String(formData.get("invoiceCount") || taxSettings.invoiceCount).trim(),
      creditNoteCount: String(formData.get("creditNoteCount") || taxSettings.creditNoteCount).trim(),
      reviewOwner: String(formData.get("reviewOwner") || taxSettings.reviewOwner).trim()
    });
    setNotice("Tax preparation settings saved.");
  }

  return (
    <>
      {notice ? <div className="admin-notice">{notice}</div> : null}
      <section className="reports-command">
        <div>
          <span>Finance operations</span>
          <h2>Money movement control</h2>
          <p>Track payments, COD collection, refunds, settlements, expenses, profit, taxes, invoices, and exportable finance reports from one owner-ready desk.</p>
          <div className="reports-tabs">
            {financeTabs.map((tab) => (
              <button className={activeTab === tab ? "active" : ""} key={tab} type="button" onClick={() => changeTab(tab)}>{tab}</button>
            ))}
          </div>
        </div>
        <div className="reports-command-actions">
          <button className="primary-action" type="button" onClick={() => changeTab("Payments")}>Payment queue</button>
          <button type="button" onClick={() => changeTab("COD")}>COD collections</button>
          <button type="button" onClick={createExpense}>Add expense</button>
          <button type="button" onClick={createReport}>Export report</button>
        </div>
      </section>

      <section className="reports-stat-grid">
        {stats.map((stat) => (
          <button key={stat.label} type="button" onClick={() => setNotice(`${stat.label}: ${stat.value} - ${stat.detail}`)}>
            <div><span>{stat.label}</span><small>{stat.detail}</small></div>
            <strong>{stat.value}</strong>
          </button>
        ))}
      </section>

      {activeTab === "Overview" ? (
        <section className="reports-layout">
          <div className="reports-main-stack">
            <FinancePaymentsPanel payments={payments.slice(0, 3)} onCod={(payment) => updatePayment({ ...payment, status: "COD collected", reconciliation: "Queued" }, `${payment.id} marked COD collected.`)} onFail={(payment) => updatePayment({ ...payment, status: "Failed", failureReason: "Marked failed by finance" }, `${payment.id} marked failed.`)} onOpen={openPayment} onReconcile={(payment) => updatePayment({ ...payment, status: "Reconciled", reconciliation: "Reconciled" }, `${payment.id} reconciled.`)} onRetry={(payment) => updatePayment({ ...payment, status: "Pending", failureReason: "Retry requested" }, `${payment.id} retry queued.`)} />
            <FinanceCodPanel collections={codCollections.slice(0, 2)} onOpen={openCod} onShort={(item) => updateCod({ ...item, status: "Short amount" }, `${item.id} shortage flagged.`)} onSubmit={(item) => updateCod({ ...item, status: "Submitted to store", proof: "Uploaded" }, `${item.id} marked submitted.`)} onVerify={(item) => updateCod({ ...item, status: "Verified", proof: "Verified", difference: "Rs. 0" }, `${item.id} verified.`)} />
          </div>
          <div className="reports-side-stack">
            <FinanceAlertsPanel codCollections={codCollections} expenses={expenses} payments={payments} refunds={refunds} settlements={settlements} onTab={changeTab} />
            <FinanceReportsPanel reports={reports.slice(0, 2)} onOpen={openReport} onRun={(report) => { setReports((items) => items.map((item) => item.id === report.id ? { ...item, status: "Ready" } : item)); setNotice(`${report.title} generated.`); }} />
          </div>
        </section>
      ) : null}
      {activeTab === "Payments" ? <FinancePaymentsPanel payments={payments} onCod={(payment) => updatePayment({ ...payment, status: "COD collected", reconciliation: "Queued" }, `${payment.id} marked COD collected.`)} onFail={(payment) => updatePayment({ ...payment, status: "Failed", failureReason: "Marked failed by finance" }, `${payment.id} marked failed.`)} onOpen={openPayment} onReconcile={(payment) => updatePayment({ ...payment, status: "Reconciled", reconciliation: "Reconciled" }, `${payment.id} reconciled.`)} onRetry={(payment) => updatePayment({ ...payment, status: "Pending", failureReason: "Retry requested" }, `${payment.id} retry queued.`)} /> : null}
      {activeTab === "COD" ? <FinanceCodPanel collections={codCollections} onOpen={openCod} onShort={(item) => updateCod({ ...item, status: "Short amount" }, `${item.id} shortage flagged.`)} onSubmit={(item) => updateCod({ ...item, status: "Submitted to store", proof: "Uploaded" }, `${item.id} marked submitted.`)} onVerify={(item) => updateCod({ ...item, status: "Verified", proof: "Verified", difference: "Rs. 0" }, `${item.id} verified.`)} /> : null}
      {activeTab === "Refunds" ? <FinanceRefundsPanel refunds={refunds} onApprove={(refund) => updateRefund({ ...refund, status: "Approved for payout", reconciliation: "Queued" }, `${refund.id} payout approved.`)} onOpen={openRefund} onPaid={(refund) => updateRefund({ ...refund, status: refund.method === "Wallet credit" ? "Wallet credited" : "Paid", gatewayStatus: "Completed", reconciliation: "Matched" }, `${refund.id} paid.`)} onReconcile={(refund) => updateRefund({ ...refund, status: "Reconciled", reconciliation: "Reconciled" }, `${refund.id} reconciled.`)} /> : null}
      {activeTab === "Settlements" ? <FinanceSettlementsPanel onMismatch={(item) => updateSettlement({ ...item, status: "Mismatch" }, `${item.id} mismatch flagged.`)} onOpen={openSettlement} onReceived={(item) => updateSettlement({ ...item, status: "Received", received: item.net, difference: "Rs. 0" }, `${item.id} marked received.`)} onReconcile={(item) => updateSettlement({ ...item, status: "Reconciled", difference: "Rs. 0" }, `${item.id} reconciled.`)} settlements={settlements} /> : null}
      {activeTab === "Expenses" ? <FinanceExpensesPanel expenses={expenses} onAdd={createExpense} onApprove={(expense) => updateExpense({ ...expense, status: "Approved" }, `${expense.id} approved.`)} onOpen={openExpense} onPaid={(expense) => updateExpense({ ...expense, status: "Paid", paidDate: "Today" }, `${expense.id} marked paid.`)} onReceipt={(expense) => updateExpense({ ...expense, receipt: "Uploaded", status: expense.status === "Receipt missing" ? "Awaiting approval" : expense.status }, `${expense.id} receipt uploaded.`)} /> : null}
      {activeTab === "Profit" ? <FinanceProfitPanel onAction={setNotice} /> : null}
      {activeTab === "Taxes" ? <FinanceTaxesPanel invoices={invoices} onExport={(message) => setNotice(message)} onSave={saveTaxSettings} settings={taxSettings} /> : null}
      {activeTab === "Invoices" ? <FinanceInvoicesPanel invoices={invoices} onCredit={(invoice) => updateInvoice({ ...invoice, status: "Credit note issued" }, `${invoice.id} credit note created.`)} onDownload={(invoice) => updateInvoice({ ...invoice, status: "Downloaded" }, `${invoice.id} download prepared.`)} onOpen={openInvoice} onResend={(invoice) => updateInvoice({ ...invoice, status: "Sent", sentStatus: "Sent just now" }, `${invoice.id} resent.`)} onReview={(invoice) => updateInvoice({ ...invoice, status: "Reviewed" }, `${invoice.id} reviewed.`)} /> : null}
      {activeTab === "Reports" ? <FinanceReportsPanel reports={reports} onOpen={openReport} onRun={(report) => { setReports((items) => items.map((item) => item.id === report.id ? { ...item, status: "Ready" } : item)); setNotice(`${report.title} generated.`); }} /> : null}

      {dialog === "payment" ? <FinancePaymentDialog item={selectedPayment} onClose={() => setDialog(null)} onSave={savePayment} /> : null}
      {dialog === "cod" ? <FinanceCodDialog item={selectedCod} onClose={() => setDialog(null)} onSave={saveCod} /> : null}
      {dialog === "refund" ? <FinanceRefundDialog item={selectedRefund} onClose={() => setDialog(null)} onSave={saveRefund} /> : null}
      {dialog === "settlement" ? <FinanceSettlementDialog item={selectedSettlement} onClose={() => setDialog(null)} onSave={saveSettlement} /> : null}
      {dialog === "expense" ? <FinanceExpenseDialog item={selectedExpense} onClose={() => setDialog(null)} onSave={saveExpense} /> : null}
      {dialog === "invoice" ? <FinanceInvoiceDialog item={selectedInvoice} onClose={() => setDialog(null)} onSave={saveInvoice} /> : null}
      {dialog === "report" ? <FinanceReportDialog item={selectedReport} onClose={() => setDialog(null)} onSave={saveReport} /> : null}
    </>
  );
}

function FinancePaymentsPanel({ onCod, onFail, onOpen, onReconcile, onRetry, payments }: { onCod: (payment: FinancePayment) => void; onFail: (payment: FinancePayment) => void; onOpen: (payment: FinancePayment) => void; onReconcile: (payment: FinancePayment) => void; onRetry: (payment: FinancePayment) => void; payments: FinancePayment[] }) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head"><div><span>Payments</span><h2>Payment reconciliation queue</h2></div></div>
      <div className="report-table">
        <div className="report-row report-row-head" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.6fr" }}>
          <span>Payment</span><span>Customer</span><span>Method</span><span>Status</span><span>Amount</span><span>Actions</span>
        </div>
        {payments.map((payment) => (
          <div className="report-row" key={payment.id} style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.6fr" }}>
            <span><strong>{payment.id}</strong><small>{payment.orderId} · {payment.gatewayId}</small></span>
            <span><strong>{payment.customer}</strong><small>{payment.phone}</small></span>
            <span>{payment.method}<small>{payment.gateway}</small></span>
            <span><Badge label={payment.status} /><small>{payment.reconciliation}</small></span>
            <span>{payment.amount}</span>
            <span className="report-actions">
              <button type="button" onClick={() => onOpen(payment)}>Open</button>
              <button type="button" onClick={() => onRetry(payment)}>Retry</button>
              <button type="button" onClick={() => onCod(payment)}>COD collected</button>
              <button type="button" onClick={() => onReconcile(payment)}>Reconcile</button>
              <button type="button" onClick={() => onFail(payment)}>Fail</button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinanceCodPanel({ collections, onOpen, onShort, onSubmit, onVerify }: { collections: FinanceCodCollection[]; onOpen: (item: FinanceCodCollection) => void; onShort: (item: FinanceCodCollection) => void; onSubmit: (item: FinanceCodCollection) => void; onVerify: (item: FinanceCodCollection) => void }) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head"><div><span>COD</span><h2>Rider cash collection</h2></div></div>
      <div className="report-table">
        <div className="report-row report-row-head" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.5fr" }}>
          <span>Collection</span><span>Rider</span><span>Collected</span><span>Submitted</span><span>Status</span><span>Actions</span>
        </div>
        {collections.map((item) => (
          <div className="report-row" key={item.id} style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.5fr" }}>
            <span><strong>{item.id}</strong><small>{item.orders} orders</small></span>
            <span><strong>{item.rider}</strong><small>{item.phone}</small></span>
            <span>{item.collected}<small>Diff {item.difference}</small></span>
            <span>{item.submitted}<small>{item.proof}</small></span>
            <span><Badge label={item.status} /></span>
            <span className="report-actions">
              <button type="button" onClick={() => onOpen(item)}>Open</button>
              <button type="button" onClick={() => onSubmit(item)}>Submit</button>
              <button type="button" onClick={() => onVerify(item)}>Verify</button>
              <button type="button" onClick={() => onShort(item)}>Flag shortage</button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinanceRefundsPanel({ onApprove, onOpen, onPaid, onReconcile, refunds }: { onApprove: (item: FinanceRefundItem) => void; onOpen: (item: FinanceRefundItem) => void; onPaid: (item: FinanceRefundItem) => void; onReconcile: (item: FinanceRefundItem) => void; refunds: FinanceRefundItem[] }) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head"><div><span>Refunds</span><h2>Refund payouts and adjustments</h2></div></div>
      <div className="report-table">
        <div className="report-row report-row-head" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.5fr" }}>
          <span>Refund</span><span>Customer</span><span>Amount</span><span>Method</span><span>Status</span><span>Actions</span>
        </div>
        {refunds.map((refund) => (
          <div className="report-row" key={refund.id} style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.5fr" }}>
            <span><strong>{refund.id}</strong><small>{refund.orderId}</small></span>
            <span>{refund.customer}<small>{refund.transactionId}</small></span>
            <span>{refund.amount}<small>Adjustment {refund.adjustment}</small></span>
            <span>{refund.method}<small>{refund.gatewayStatus}</small></span>
            <span><Badge label={refund.status} /><small>{refund.reconciliation}</small></span>
            <span className="report-actions">
              <button type="button" onClick={() => onOpen(refund)}>Open</button>
              <button type="button" onClick={() => onApprove(refund)}>Approve</button>
              <button type="button" onClick={() => onPaid(refund)}>Paid</button>
              <button type="button" onClick={() => onReconcile(refund)}>Reconcile</button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinanceSettlementsPanel({ onMismatch, onOpen, onReceived, onReconcile, settlements }: { onMismatch: (item: FinanceSettlement) => void; onOpen: (item: FinanceSettlement) => void; onReceived: (item: FinanceSettlement) => void; onReconcile: (item: FinanceSettlement) => void; settlements: FinanceSettlement[] }) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head"><div><span>Settlements</span><h2>Gateway settlement batches</h2></div></div>
      <div className="report-table">
        <div className="report-row report-row-head" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.5fr" }}>
          <span>Settlement</span><span>Gateway</span><span>Net</span><span>Received</span><span>Status</span><span>Actions</span>
        </div>
        {settlements.map((item) => (
          <div className="report-row" key={item.id} style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.5fr" }}>
            <span><strong>{item.id}</strong><small>{item.batchDate} to {item.expectedDate}</small></span>
            <span>{item.gateway}<small>{item.bankReference}</small></span>
            <span>{item.net}<small>Charges {item.charges}</small></span>
            <span>{item.received}<small>Diff {item.difference}</small></span>
            <span><Badge label={item.status} /></span>
            <span className="report-actions">
              <button type="button" onClick={() => onOpen(item)}>Open</button>
              <button type="button" onClick={() => onReceived(item)}>Received</button>
              <button type="button" onClick={() => onMismatch(item)}>Mismatch</button>
              <button type="button" onClick={() => onReconcile(item)}>Reconcile</button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinanceExpensesPanel({ expenses, onAdd, onApprove, onOpen, onPaid, onReceipt }: { expenses: FinanceExpense[]; onAdd: () => void; onApprove: (item: FinanceExpense) => void; onOpen: (item: FinanceExpense) => void; onPaid: (item: FinanceExpense) => void; onReceipt: (item: FinanceExpense) => void }) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head"><div><span>Expenses</span><h2>Operating costs and approvals</h2></div><button type="button" onClick={onAdd}>Add expense</button></div>
      <div className="report-table">
        <div className="report-row report-row-head" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.5fr" }}>
          <span>Expense</span><span>Vendor</span><span>Amount</span><span>Due</span><span>Status</span><span>Actions</span>
        </div>
        {expenses.map((expense) => (
          <div className="report-row" key={expense.id} style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.5fr" }}>
            <span><strong>{expense.id}</strong><small>{expense.category}</small></span>
            <span>{expense.vendor}<small>{expense.method}</small></span>
            <span>{expense.amount}<small>{expense.receipt}</small></span>
            <span>{expense.dueDate}<small>Paid {expense.paidDate}</small></span>
            <span><Badge label={expense.status} /></span>
            <span className="report-actions">
              <button type="button" onClick={() => onOpen(expense)}>Open</button>
              <button type="button" onClick={() => onApprove(expense)}>Approve</button>
              <button type="button" onClick={() => onPaid(expense)}>Paid</button>
              <button type="button" onClick={() => onReceipt(expense)}>Receipt</button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinanceAlertsPanel({ codCollections, expenses, onTab, payments, refunds, settlements }: { codCollections: FinanceCodCollection[]; expenses: FinanceExpense[]; onTab: (tab: FinanceTab) => void; payments: FinancePayment[]; refunds: FinanceRefundItem[]; settlements: FinanceSettlement[] }) {
  const alerts = [
    { title: "COD not submitted", detail: `${codCollections.filter((item) => item.status !== "Verified").length} rider collections need review.`, tab: "COD" as FinanceTab },
    { title: "Payment failures", detail: `${payments.filter((item) => item.status === "Failed").length} failed payment needs action.`, tab: "Payments" as FinanceTab },
    { title: "Refund payout pending", detail: `${refunds.filter((item) => item.status !== "Reconciled").length} refund finance items open.`, tab: "Refunds" as FinanceTab },
    { title: "Settlement mismatch", detail: `${settlements.filter((item) => item.status === "Mismatch").length} gateway batches mismatch.`, tab: "Settlements" as FinanceTab },
    { title: "Expense without receipt", detail: `${expenses.filter((item) => item.receipt === "Missing").length} expenses need receipt.`, tab: "Expenses" as FinanceTab }
  ];
  return (
    <section className="reports-panel compact">
      <div className="reports-panel-head"><div><span>Alerts</span><h2>Finance action list</h2></div></div>
      <div className="report-export-list">
        {alerts.map((alert) => (
          <article key={alert.title}>
            <div><strong>{alert.title}</strong><span>{alert.detail}</span></div>
            <button type="button" onClick={() => onTab(alert.tab)}>Review</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function FinanceProfitPanel({ onAction }: { onAction: (message: string) => void }) {
  const rows: string[][] = [];
  return (
    <section className="reports-panel">
      <div className="reports-panel-head"><div><span>Profit</span><h2>Profit and margin review</h2></div><button type="button" onClick={() => onAction("Profit and loss export prepared.")}>Export margin report</button></div>
      <div className="report-table">
        <div className="report-row report-row-head" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1.4fr" }}>
          <span>Category</span><span>Revenue</span><span>Cost</span><span>Margin</span><span>Actions</span>
        </div>
        {rows.map(([category, revenue, cost, margin, note]) => (
          <div className="report-row" key={category} style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1.4fr" }}>
            <span><strong>{category}</strong><small>{note}</small></span>
            <span>{revenue}</span>
            <span>{cost}</span>
            <span><Badge label={margin} /></span>
            <span className="report-actions">
              <button type="button" onClick={() => onAction(`${category} margin detail opened.`)}>Open</button>
              <button type="button" onClick={() => onAction(`${category} sent to product team for margin review.`)}>Send issue</button>
              <button type="button" onClick={() => onAction(`${category} low-margin flag updated.`)}>Flag</button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinanceTaxesPanel({ invoices, onExport, onSave, settings }: { invoices: FinanceInvoice[]; onExport: (message: string) => void; onSave: (event: FormEvent<HTMLFormElement>) => void; settings: FinanceTaxSettings }) {
  return (
    <form className="settings-panel" onSubmit={onSave}>
      <SettingsPanelHead eyebrow="Taxes" title="GST and invoice preparation" />
      <div className="settings-form-grid">
        <label><span>GST collected</span><input name="gstCollected" defaultValue={settings.gstCollected} /></label>
        <label><span>Taxable sales</span><input name="taxableSales" defaultValue={settings.taxableSales} /></label>
        <label><span>Exempt sales</span><input name="exemptSales" defaultValue={settings.exemptSales} /></label>
        <label><span>Invoice count</span><input name="invoiceCount" defaultValue={settings.invoiceCount} /></label>
        <label><span>Credit notes</span><input name="creditNoteCount" defaultValue={settings.creditNoteCount} /></label>
        <label><span>Review owner</span><input name="reviewOwner" defaultValue={settings.reviewOwner} /></label>
        <label className="settings-wide"><span>HSN/SAC summary</span><textarea name="hsnSummary" defaultValue={settings.hsnSummary} rows={4} /></label>
      </div>
      <div className="product-dialog-actions">
        <button type="button" onClick={() => onExport("GST report export prepared.")}>Export GST</button>
        <button type="button" onClick={() => onExport(`${invoices.length} invoice register rows prepared.`)}>Invoice register</button>
        <button type="button" onClick={() => onExport("Credit note register export prepared.")}>Credit notes</button>
        <button type="submit">Save tax view</button>
      </div>
    </form>
  );
}

function FinanceInvoicesPanel({ invoices, onCredit, onDownload, onOpen, onResend, onReview }: { invoices: FinanceInvoice[]; onCredit: (item: FinanceInvoice) => void; onDownload: (item: FinanceInvoice) => void; onOpen: (item: FinanceInvoice) => void; onResend: (item: FinanceInvoice) => void; onReview: (item: FinanceInvoice) => void }) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head"><div><span>Invoices</span><h2>Invoices and credit notes</h2></div></div>
      <div className="report-table">
        <div className="report-row report-row-head" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.5fr" }}>
          <span>Invoice</span><span>Party</span><span>Type</span><span>Amount</span><span>Status</span><span>Actions</span>
        </div>
        {invoices.map((invoice) => (
          <div className="report-row" key={invoice.id} style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.5fr" }}>
            <span><strong>{invoice.id}</strong><small>{invoice.reference}</small></span>
            <span>{invoice.party}<small>{invoice.date}</small></span>
            <span>{invoice.type}</span>
            <span>{invoice.amount}<small>Tax {invoice.tax}</small></span>
            <span><Badge label={invoice.status} /><small>{invoice.sentStatus}</small></span>
            <span className="report-actions">
              <button type="button" onClick={() => onOpen(invoice)}>Open</button>
              <button type="button" onClick={() => onDownload(invoice)}>Download</button>
              <button type="button" onClick={() => onResend(invoice)}>Resend</button>
              <button type="button" onClick={() => onCredit(invoice)}>Credit note</button>
              <button type="button" onClick={() => onReview(invoice)}>Review</button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinanceReportsPanel({ onOpen, onRun, reports }: { onOpen: (item: FinanceReportExport) => void; onRun: (item: FinanceReportExport) => void; reports: FinanceReportExport[] }) {
  return (
    <section className="reports-panel compact">
      <div className="reports-panel-head"><div><span>Reports</span><h2>Finance exports</h2></div></div>
      <div className="report-export-list">
        {reports.map((report) => (
          <article key={report.id}>
            <div><strong>{report.title}</strong><span>{report.format} · {report.dateRange} · {report.owner}</span></div>
            <Badge label={report.status} />
            <div className="report-actions">
              <button type="button" onClick={() => onOpen(report)}>Edit</button>
              <button type="button" onClick={() => onRun(report)}>Run now</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function FinancePaymentDialog({ item, onClose, onSave }: { item: FinancePayment; onClose: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSave}>
        <div className="product-dialog-head"><div><span>{item.id}</span><h3>Payment detail</h3></div><button type="button" onClick={onClose}>Close</button></div>
        <div className="settings-form-grid">
          <label><span>Order ID</span><input name="orderId" defaultValue={item.orderId} /></label>
          <label><span>Customer</span><input name="customer" defaultValue={item.customer} /></label>
          <label><span>Phone</span><input name="phone" defaultValue={item.phone} /></label>
          <label><span>Amount</span><input name="amount" defaultValue={item.amount} /></label>
          <label><span>Method</span><select name="method" defaultValue={item.method}><option>COD</option><option>UPI</option><option>Card</option><option>Wallet</option><option>Net banking</option><option>Manual payment</option></select></label>
          <label><span>Status</span><select name="status" defaultValue={item.status}><option>Paid</option><option>Pending</option><option>Failed</option><option>Refunded</option><option>Partially refunded</option><option>COD pending</option><option>COD collected</option><option>Reconciled</option></select></label>
          <label><span>Gateway</span><input name="gateway" defaultValue={item.gateway} /></label>
          <label><span>Gateway transaction ID</span><input name="gatewayId" defaultValue={item.gatewayId} /></label>
          <label><span>Payment time</span><input name="time" defaultValue={item.time} /></label>
          <label><span>Reconciliation</span><select name="reconciliation" defaultValue={item.reconciliation}><option>Open</option><option>Queued</option><option>Matched</option><option>Mismatch</option><option>Reconciled</option></select></label>
          <label><span>Finance owner</span><input name="owner" defaultValue={item.owner} /></label>
          <label><span>Failure reason</span><input name="failureReason" defaultValue={item.failureReason} /></label>
          <label className="settings-wide"><span>Finance note</span><textarea name="note" defaultValue={item.note} rows={4} /></label>
        </div>
        <div className="product-dialog-actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit">Save payment</button></div>
      </form>
    </div>
  );
}

function FinanceCodDialog({ item, onClose, onSave }: { item: FinanceCodCollection; onClose: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSave}>
        <div className="product-dialog-head"><div><span>{item.id}</span><h3>COD collection</h3></div><button type="button" onClick={onClose}>Close</button></div>
        <div className="settings-form-grid">
          <label><span>Rider name</span><input name="rider" defaultValue={item.rider} /></label>
          <label><span>Rider phone</span><input name="phone" defaultValue={item.phone} /></label>
          <label><span>Delivered orders</span><input name="orders" type="number" defaultValue={item.orders} /></label>
          <label><span>Collected amount</span><input name="collected" defaultValue={item.collected} /></label>
          <label><span>Cash submitted</span><input name="submitted" defaultValue={item.submitted} /></label>
          <label><span>Difference</span><input name="difference" defaultValue={item.difference} /></label>
          <label><span>Status</span><select name="status" defaultValue={item.status}><option>Pending collection</option><option>Collected by rider</option><option>Submitted to store</option><option>Short amount</option><option>Verified</option><option>Escalated</option></select></label>
          <label><span>Settlement time</span><input name="settlementTime" defaultValue={item.settlementTime} /></label>
          <label><span>Proof status</span><select name="proof" defaultValue={item.proof}><option>Missing</option><option>Uploaded</option><option>Verified</option></select></label>
          <label><span>Verification owner</span><input name="owner" defaultValue={item.owner} /></label>
          <label className="settings-wide"><span>Finance note</span><textarea name="note" defaultValue={item.note} rows={4} /></label>
        </div>
        <div className="product-dialog-actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit">Save COD</button></div>
      </form>
    </div>
  );
}

function FinanceRefundDialog({ item, onClose, onSave }: { item: FinanceRefundItem; onClose: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSave}>
        <div className="product-dialog-head"><div><span>{item.id}</span><h3>Refund finance</h3></div><button type="button" onClick={onClose}>Close</button></div>
        <div className="settings-form-grid">
          <label><span>Order ID</span><input name="orderId" defaultValue={item.orderId} /></label>
          <label><span>Customer</span><input name="customer" defaultValue={item.customer} /></label>
          <label><span>Amount</span><input name="amount" defaultValue={item.amount} /></label>
          <label><span>Refund method</span><select name="method" defaultValue={item.method}><option>Original payment</option><option>Wallet credit</option><option>Coupon credit</option><option>Manual payout</option></select></label>
          <label><span>Gateway status</span><input name="gatewayStatus" defaultValue={item.gatewayStatus} /></label>
          <label><span>Wallet credit</span><input name="walletCredit" defaultValue={item.walletCredit} /></label>
          <label><span>Manual adjustment</span><input name="adjustment" defaultValue={item.adjustment} /></label>
          <label><span>Status</span><select name="status" defaultValue={item.status}><option>Awaiting finance approval</option><option>Approved for payout</option><option>Wallet credited</option><option>Gateway queued</option><option>Paid</option><option>Reconciled</option><option>Adjustment required</option></select></label>
          <label><span>Reconciliation</span><select name="reconciliation" defaultValue={item.reconciliation}><option>Open</option><option>Queued</option><option>Matched</option><option>Mismatch</option><option>Reconciled</option></select></label>
          <label><span>Refund transaction ID</span><input name="transactionId" defaultValue={item.transactionId} /></label>
          <label className="settings-wide"><span>Finance note</span><textarea name="note" defaultValue={item.note} rows={4} /></label>
        </div>
        <div className="product-dialog-actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit">Save refund finance</button></div>
      </form>
    </div>
  );
}

function FinanceSettlementDialog({ item, onClose, onSave }: { item: FinanceSettlement; onClose: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSave}>
        <div className="product-dialog-head"><div><span>{item.id}</span><h3>Settlement batch</h3></div><button type="button" onClick={onClose}>Close</button></div>
        <div className="settings-form-grid">
          <label><span>Gateway</span><input name="gateway" defaultValue={item.gateway} /></label>
          <label><span>Batch date</span><input name="batchDate" defaultValue={item.batchDate} /></label>
          <label><span>Expected date</span><input name="expectedDate" defaultValue={item.expectedDate} /></label>
          <label><span>Gross amount</span><input name="gross" defaultValue={item.gross} /></label>
          <label><span>Gateway charges</span><input name="charges" defaultValue={item.charges} /></label>
          <label><span>Deductions</span><input name="deductions" defaultValue={item.deductions} /></label>
          <label><span>Net settled amount</span><input name="net" defaultValue={item.net} /></label>
          <label><span>Amount received</span><input name="received" defaultValue={item.received} /></label>
          <label><span>Difference</span><input name="difference" defaultValue={item.difference} /></label>
          <label><span>Status</span><select name="status" defaultValue={item.status}><option>Expected</option><option>Pending</option><option>Received</option><option>Mismatch</option><option>Under review</option><option>Reconciled</option></select></label>
          <label><span>Bank reference</span><input name="bankReference" defaultValue={item.bankReference} /></label>
          <label className="settings-wide"><span>Finance note</span><textarea name="note" defaultValue={item.note} rows={4} /></label>
        </div>
        <div className="product-dialog-actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit">Save settlement</button></div>
      </form>
    </div>
  );
}

function FinanceExpenseDialog({ item, onClose, onSave }: { item: FinanceExpense; onClose: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSave}>
        <div className="product-dialog-head"><div><span>{item.id}</span><h3>Expense entry</h3></div><button type="button" onClick={onClose}>Close</button></div>
        <div className="settings-form-grid">
          <label><span>Category</span><input name="category" defaultValue={item.category} /></label>
          <label><span>Vendor or staff</span><input name="vendor" defaultValue={item.vendor} /></label>
          <label><span>Amount</span><input name="amount" defaultValue={item.amount} /></label>
          <label><span>Payment method</span><select name="method" defaultValue={item.method}><option>COD</option><option>UPI</option><option>Card</option><option>Wallet</option><option>Net banking</option><option>Manual payment</option></select></label>
          <label><span>Paid date</span><input name="paidDate" defaultValue={item.paidDate} /></label>
          <label><span>Due date</span><input name="dueDate" defaultValue={item.dueDate} /></label>
          <label><span>Receipt status</span><select name="receipt" defaultValue={item.receipt}><option>Missing</option><option>Uploaded</option><option>Verified</option></select></label>
          <label><span>Approval status</span><select name="status" defaultValue={item.status}><option>Draft</option><option>Awaiting approval</option><option>Approved</option><option>Paid</option><option>Receipt missing</option><option>Rejected</option></select></label>
          <label className="settings-wide"><span>Finance note</span><textarea name="note" defaultValue={item.note} rows={4} /></label>
        </div>
        <div className="product-dialog-actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit">Save expense</button></div>
      </form>
    </div>
  );
}

function FinanceInvoiceDialog({ item, onClose, onSave }: { item: FinanceInvoice; onClose: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSave}>
        <div className="product-dialog-head"><div><span>{item.id}</span><h3>Invoice detail</h3></div><button type="button" onClick={onClose}>Close</button></div>
        <div className="settings-form-grid">
          <label><span>Order/supplier reference</span><input name="reference" defaultValue={item.reference} /></label>
          <label><span>Customer or supplier</span><input name="party" defaultValue={item.party} /></label>
          <label><span>Invoice type</span><select name="type" defaultValue={item.type}><option>Customer invoice</option><option>Supplier invoice</option><option>Refund credit note</option><option>Manual credit note</option></select></label>
          <label><span>Amount</span><input name="amount" defaultValue={item.amount} /></label>
          <label><span>Tax amount</span><input name="tax" defaultValue={item.tax} /></label>
          <label><span>Invoice date</span><input name="date" defaultValue={item.date} /></label>
          <label><span>Status</span><select name="status" defaultValue={item.status}><option>Generated</option><option>Sent</option><option>Downloaded</option><option>Failed</option><option>Cancelled</option><option>Credit note issued</option><option>Reviewed</option></select></label>
          <label><span>Sent status</span><input name="sentStatus" defaultValue={item.sentStatus} /></label>
          <label className="settings-wide"><span>Download URL</span><input name="downloadUrl" defaultValue={item.downloadUrl} /></label>
          <label className="settings-wide"><span>Finance note</span><textarea name="note" defaultValue={item.note} rows={4} /></label>
        </div>
        <div className="product-dialog-actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit">Save invoice</button></div>
      </form>
    </div>
  );
}

function FinanceReportDialog({ item, onClose, onSave }: { item: FinanceReportExport; onClose: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSave}>
        <div className="product-dialog-head"><div><span>{item.id}</span><h3>Finance export</h3></div><button type="button" onClick={onClose}>Close</button></div>
        <div className="settings-form-grid">
          <label><span>Report title</span><input name="title" defaultValue={item.title} /></label>
          <label><span>Format</span><select name="format" defaultValue={item.format}><option>CSV</option><option>PDF</option><option>XLSX</option></select></label>
          <label><span>Status</span><select name="status" defaultValue={item.status}><option>Ready</option><option>Scheduled</option><option>Processing</option></select></label>
          <label><span>Date range</span><input name="dateRange" defaultValue={item.dateRange} /></label>
          <label><span>Finance owner</span><input name="owner" defaultValue={item.owner} /></label>
        </div>
        <div className="product-dialog-actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit">Save export</button></div>
      </form>
    </div>
  );
}

function AuditLogsView() {
  const [activeTab, setActiveTab] = useState<AuditTab>("Overview");
  const [activityLogs, setActivityLogs] = usePersistentState<AuditActivityLog[]>("audit:activity-logs", initialAuditActivityLogs);
  const [securityEvents, setSecurityEvents] = usePersistentState<AuditSecurityEvent[]>("audit:security-events", initialAuditSecurityEvents);
  const [dataChanges, setDataChanges] = usePersistentState<AuditDataChange[]>("audit:data-changes", initialAuditDataChanges);
  const [sessions, setSessions] = usePersistentState<AuditSession[]>("audit:sessions", initialAuditSessions);
  const [exports, setExports] = usePersistentState<AuditExport[]>("audit:exports", initialAuditExports);
  const [riskAlerts, setRiskAlerts] = usePersistentState<AuditRiskAlert[]>("audit:risk-alerts", initialAuditRiskAlerts);
  const [settings, setSettings] = usePersistentState<AuditSettings>("audit:settings", defaultAuditSettings);
  const [selectedActivity, setSelectedActivity] = useState<AuditActivityLog>(initialAuditActivityLogs[0]);
  const [selectedSecurity, setSelectedSecurity] = useState<AuditSecurityEvent>(initialAuditSecurityEvents[0]);
  const [selectedChange, setSelectedChange] = useState<AuditDataChange>(initialAuditDataChanges[0]);
  const [selectedSession, setSelectedSession] = useState<AuditSession>(initialAuditSessions[0]);
  const [selectedExport, setSelectedExport] = useState<AuditExport>(initialAuditExports[0]);
  const [selectedRisk, setSelectedRisk] = useState<AuditRiskAlert>(initialAuditRiskAlerts[0]);
  const [dialog, setDialog] = useState<AuditDialog>(null);
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [notice, setNotice] = useState("Audit logs control center is ready.");

  const tabs: AuditTab[] = ["Overview", "Activity Logs", "Security Events", "Data Changes", "Admin Sessions", "Exports", "Risk Alerts", "Settings"];
  const searchableText = (values: string[]) => values.join(" ").toLowerCase();
  const matchesFilters = (module: string, risk: AuditRiskLevel, values: string[]) => {
    const queryMatch = query.trim() ? searchableText(values).includes(query.toLowerCase().trim()) : true;
    const moduleMatch = moduleFilter === "All" || module === moduleFilter;
    const riskMatch = riskFilter === "All" || risk === riskFilter;
    return queryMatch && moduleMatch && riskMatch;
  };
  const filteredActivity = activityLogs.filter((log) => matchesFilters(log.module, log.risk, [log.id, log.admin, log.email, log.action, log.target, log.ip]));
  const filteredSecurity = securityEvents.filter((event) => matchesFilters("Security", event.risk, [event.id, event.admin, event.email, event.eventType, event.ip, event.location]));
  const filteredChanges = dataChanges.filter((change) => matchesFilters(change.module, change.risk, [change.id, change.recordId, change.recordName, change.field, change.changedBy]));
  const filteredSessions = sessions.filter((session) => matchesFilters("Security", session.risk, [session.id, session.admin, session.email, session.ip, session.device, session.location]));
  const filteredExports = exports.filter((item) => matchesFilters(item.module, item.review === "Owner review" ? "High" : "Medium", [item.id, item.admin, item.email, item.exportType, item.module]));
  const filteredRisks = riskAlerts.filter((alert) => matchesFilters(alert.module, alert.risk, [alert.id, alert.alertType, alert.target, alert.admin, alert.trigger]));
  const stats = [
    { label: "Actions today", value: activityLogs.length, detail: "Admin actions tracked" },
    { label: "High risk", value: riskAlerts.filter((item) => ["High", "Critical"].includes(item.risk)).length, detail: "Need owner review" },
    { label: "Failed logins", value: securityEvents.filter((item) => item.eventType === "Login failure").length, detail: "Security watch" },
    { label: "Data edits", value: dataChanges.length, detail: "Before/after changes" },
    { label: "Active sessions", value: sessions.filter((item) => item.status === "Active").length, detail: "Live admin access" },
    { label: "Exports", value: exports.length, detail: "Sensitive downloads" }
  ];

  function changeTab(tab: AuditTab) {
    setActiveTab(tab);
    setNotice(`${tab} tab opened.`);
  }

  function updateActivity(item: AuditActivityLog, message: string) {
    setActivityLogs((rows) => rows.map((row) => (row.id === item.id ? item : row)));
    setSelectedActivity(item);
    setNotice(message);
  }

  function updateSecurity(item: AuditSecurityEvent, message: string) {
    setSecurityEvents((rows) => rows.map((row) => (row.id === item.id ? item : row)));
    setSelectedSecurity(item);
    setNotice(message);
  }

  function updateChange(item: AuditDataChange, message: string) {
    setDataChanges((rows) => rows.map((row) => (row.id === item.id ? item : row)));
    setSelectedChange(item);
    setNotice(message);
  }

  function updateSession(item: AuditSession, message: string) {
    setSessions((rows) => rows.map((row) => (row.id === item.id ? item : row)));
    setSelectedSession(item);
    setNotice(message);
  }

  function updateExport(item: AuditExport, message: string) {
    setExports((rows) => rows.map((row) => (row.id === item.id ? item : row)));
    setSelectedExport(item);
    setNotice(message);
  }

  function updateRisk(item: AuditRiskAlert, message: string) {
    setRiskAlerts((rows) => rows.map((row) => (row.id === item.id ? item : row)));
    setSelectedRisk(item);
    setNotice(message);
  }

  function saveActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    updateActivity({
      ...selectedActivity,
      admin: String(formData.get("admin") || selectedActivity.admin).trim(),
      email: String(formData.get("email") || selectedActivity.email).trim(),
      role: String(formData.get("role") || selectedActivity.role).trim(),
      module: String(formData.get("module") || selectedActivity.module).trim(),
      action: String(formData.get("action") || selectedActivity.action).trim(),
      target: String(formData.get("target") || selectedActivity.target).trim(),
      timestamp: String(formData.get("timestamp") || selectedActivity.timestamp).trim(),
      status: String(formData.get("status") || selectedActivity.status) as AuditReviewStatus,
      ip: String(formData.get("ip") || selectedActivity.ip).trim(),
      device: String(formData.get("device") || selectedActivity.device).trim(),
      location: String(formData.get("location") || selectedActivity.location).trim(),
      risk: String(formData.get("risk") || selectedActivity.risk) as AuditRiskLevel,
      note: String(formData.get("note") || selectedActivity.note).trim()
    }, `${selectedActivity.id} audit log saved.`);
    setDialog(null);
  }

  function saveSecurity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    updateSecurity({
      ...selectedSecurity,
      admin: String(formData.get("admin") || selectedSecurity.admin).trim(),
      email: String(formData.get("email") || selectedSecurity.email).trim(),
      eventType: String(formData.get("eventType") || selectedSecurity.eventType).trim(),
      result: String(formData.get("result") || selectedSecurity.result) as AuditSecurityEvent["result"],
      timestamp: String(formData.get("timestamp") || selectedSecurity.timestamp).trim(),
      ip: String(formData.get("ip") || selectedSecurity.ip).trim(),
      device: String(formData.get("device") || selectedSecurity.device).trim(),
      browser: String(formData.get("browser") || selectedSecurity.browser).trim(),
      location: String(formData.get("location") || selectedSecurity.location).trim(),
      risk: String(formData.get("risk") || selectedSecurity.risk) as AuditRiskLevel,
      status: String(formData.get("status") || selectedSecurity.status) as AuditReviewStatus,
      note: String(formData.get("note") || selectedSecurity.note).trim()
    }, `${selectedSecurity.id} security event saved.`);
    setDialog(null);
  }

  function saveChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    updateChange({
      ...selectedChange,
      module: String(formData.get("module") || selectedChange.module).trim(),
      recordId: String(formData.get("recordId") || selectedChange.recordId).trim(),
      recordName: String(formData.get("recordName") || selectedChange.recordName).trim(),
      field: String(formData.get("field") || selectedChange.field).trim(),
      oldValue: String(formData.get("oldValue") || selectedChange.oldValue).trim(),
      newValue: String(formData.get("newValue") || selectedChange.newValue).trim(),
      changedBy: String(formData.get("changedBy") || selectedChange.changedBy).trim(),
      reason: String(formData.get("reason") || selectedChange.reason).trim(),
      timestamp: String(formData.get("timestamp") || selectedChange.timestamp).trim(),
      risk: String(formData.get("risk") || selectedChange.risk) as AuditRiskLevel,
      approval: String(formData.get("approval") || selectedChange.approval) as AuditDataChange["approval"],
      status: String(formData.get("status") || selectedChange.status) as AuditReviewStatus,
      note: String(formData.get("note") || selectedChange.note).trim()
    }, `${selectedChange.id} data change saved.`);
    setDialog(null);
  }

  function saveSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    updateSession({
      ...selectedSession,
      admin: String(formData.get("admin") || selectedSession.admin).trim(),
      email: String(formData.get("email") || selectedSession.email).trim(),
      role: String(formData.get("role") || selectedSession.role).trim(),
      loginTime: String(formData.get("loginTime") || selectedSession.loginTime).trim(),
      lastActivity: String(formData.get("lastActivity") || selectedSession.lastActivity).trim(),
      ip: String(formData.get("ip") || selectedSession.ip).trim(),
      device: String(formData.get("device") || selectedSession.device).trim(),
      browser: String(formData.get("browser") || selectedSession.browser).trim(),
      location: String(formData.get("location") || selectedSession.location).trim(),
      status: String(formData.get("status") || selectedSession.status) as AuditSession["status"],
      twoFactor: String(formData.get("twoFactor") || selectedSession.twoFactor) as AuditSession["twoFactor"],
      trusted: formData.get("trusted") === "on",
      risk: String(formData.get("risk") || selectedSession.risk) as AuditRiskLevel,
      note: String(formData.get("note") || selectedSession.note).trim()
    }, `${selectedSession.id} session saved.`);
    setDialog(null);
  }

  function saveExport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    updateExport({
      ...selectedExport,
      admin: String(formData.get("admin") || selectedExport.admin).trim(),
      email: String(formData.get("email") || selectedExport.email).trim(),
      exportType: String(formData.get("exportType") || selectedExport.exportType).trim(),
      module: String(formData.get("module") || selectedExport.module).trim(),
      format: String(formData.get("format") || selectedExport.format) as AuditExport["format"],
      dateRange: String(formData.get("dateRange") || selectedExport.dateRange).trim(),
      rows: String(formData.get("rows") || selectedExport.rows).trim(),
      status: String(formData.get("status") || selectedExport.status) as AuditExport["status"],
      downloadTime: String(formData.get("downloadTime") || selectedExport.downloadTime).trim(),
      ip: String(formData.get("ip") || selectedExport.ip).trim(),
      reason: String(formData.get("reason") || selectedExport.reason).trim(),
      review: String(formData.get("review") || selectedExport.review) as AuditReviewStatus
    }, `${selectedExport.id} export audit saved.`);
    setDialog(null);
  }

  function saveRisk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    updateRisk({
      ...selectedRisk,
      alertType: String(formData.get("alertType") || selectedRisk.alertType).trim(),
      module: String(formData.get("module") || selectedRisk.module).trim(),
      target: String(formData.get("target") || selectedRisk.target).trim(),
      trigger: String(formData.get("trigger") || selectedRisk.trigger).trim(),
      risk: String(formData.get("risk") || selectedRisk.risk) as AuditRiskLevel,
      admin: String(formData.get("admin") || selectedRisk.admin).trim(),
      timestamp: String(formData.get("timestamp") || selectedRisk.timestamp).trim(),
      status: String(formData.get("status") || selectedRisk.status) as AuditReviewStatus,
      ownerNote: String(formData.get("ownerNote") || selectedRisk.ownerNote).trim()
    }, `${selectedRisk.id} risk alert saved.`);
    setDialog(null);
  }

  function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSettings({
      retention: String(formData.get("retention") || settings.retention).trim(),
      trackIp: formData.get("trackIp") === "on",
      trackLocation: formData.get("trackLocation") === "on",
      trackDevice: formData.get("trackDevice") === "on",
      trackBeforeAfter: formData.get("trackBeforeAfter") === "on",
      requireReason: formData.get("requireReason") === "on",
      ownerApproval: formData.get("ownerApproval") === "on",
      highRiskAlerts: formData.get("highRiskAlerts") === "on",
      ownerOnlyExport: formData.get("ownerOnlyExport") === "on",
      maskCustomerData: formData.get("maskCustomerData") === "on",
      autoLockSuspicious: formData.get("autoLockSuspicious") === "on",
      immutableSecurityEvents: formData.get("immutableSecurityEvents") === "on"
    });
    setNotice("Audit policy settings saved.");
  }

  function createAuditExport() {
    const created: AuditExport = {
      id: `AEX-${Date.now().toString().slice(-5)}`,
      admin: "Owner",
      email: "owner@freshcart.local",
      exportType: "Full admin audit report",
      module: moduleFilter === "All" ? "All modules" : moduleFilter,
      format: "PDF",
      dateRange: "Current filtered view",
      rows: String(filteredActivity.length + filteredSecurity.length + filteredChanges.length + filteredSessions.length + filteredExports.length + filteredRisks.length),
      status: "Ready",
      downloadTime: "Just now",
      ip: "127.0.0.1",
      reason: "Owner requested audit report from admin panel.",
      review: "Owner review"
    };
    setExports((items) => [created, ...items]);
    setSelectedExport(created);
    setActiveTab("Exports");
    setDialog("export");
    setNotice(`${created.id} audit export created and opened.`);
  }

  return (
    <>
      {notice ? <div className="admin-notice">{notice}</div> : null}
      <section className="reports-command">
        <div>
          <span>Audit operations</span>
          <h2>Admin accountability trail</h2>
          <p>Trace admin actions, security events, data changes, sessions, sensitive exports, and risk alerts with review controls and policy settings.</p>
          <div className="reports-tabs">
            {tabs.map((tab) => <button className={activeTab === tab ? "active" : ""} key={tab} type="button" onClick={() => changeTab(tab)}>{tab}</button>)}
          </div>
        </div>
        <div className="reports-command-actions">
          <button className="primary-action" type="button" onClick={() => changeTab("Activity Logs")}>Activity logs</button>
          <button type="button" onClick={() => changeTab("Risk Alerts")}>Risk alerts</button>
          <button type="button" onClick={() => changeTab("Admin Sessions")}>Sessions</button>
          <button type="button" onClick={createAuditExport}>Export audit report</button>
        </div>
      </section>

      <section className="reports-stat-grid">
        {stats.map((stat) => (
          <button key={stat.label} type="button" onClick={() => setNotice(`${stat.label}: ${stat.value} - ${stat.detail}`)}>
            <div><span>{stat.label}</span><small>{stat.detail}</small></div>
            <strong>{stat.value}</strong>
          </button>
        ))}
      </section>

      <section className="reports-panel compact">
        <div className="settings-form-grid">
          <label><span>Search audit trail</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Action ID, order, SKU, refund, email, IP" /></label>
          <label><span>Module</span><select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}><option>All</option><option>Products</option><option>Inventory</option><option>Orders</option><option>Refunds</option><option>Finance</option><option>Customers</option><option>Staff</option><option>Settings</option><option>Security</option><option>Audit Logs</option></select></label>
          <label><span>Risk</span><select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}><option>All</option><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label>
        </div>
      </section>

      {activeTab === "Overview" ? (
        <section className="reports-layout">
          <div className="reports-main-stack">
            <AuditActivityPanel logs={filteredActivity.slice(0, 3)} onEscalate={(item) => updateActivity({ ...item, status: "Escalated" }, `${item.id} escalated.`)} onOpen={(item) => { setSelectedActivity(item); setDialog("activity"); }} onReview={(item) => updateActivity({ ...item, status: "Reviewed" }, `${item.id} reviewed.`)} />
            <AuditRiskPanel alerts={filteredRisks.slice(0, 3)} onLock={(item) => updateRisk({ ...item, status: "Escalated", ownerNote: "Account lock requested." }, `${item.id} account lock requested.`)} onOpen={(item) => { setSelectedRisk(item); setDialog("risk"); }} onReview={(item) => updateRisk({ ...item, status: "Reviewed" }, `${item.id} reviewed.`)} />
          </div>
          <div className="reports-side-stack">
            <AuditSecurityPanel events={filteredSecurity.slice(0, 2)} onBlock={(item) => updateSecurity({ ...item, result: "Blocked", status: "Escalated" }, `${item.id} blocked.`)} onOpen={(item) => { setSelectedSecurity(item); setDialog("security"); }} onReview={(item) => updateSecurity({ ...item, status: "Reviewed" }, `${item.id} reviewed.`)} />
            <AuditSessionsPanel onBlock={(item) => updateSession({ ...item, status: "Blocked", risk: "High" }, `${item.id} blocked.`)} onLogout={(item) => updateSession({ ...item, status: "Forced logout" }, `${item.id} forced logout.`)} onOpen={(item) => { setSelectedSession(item); setDialog("session"); }} onTrust={(item) => updateSession({ ...item, status: "Trusted", trusted: true }, `${item.id} trusted.`)} sessions={filteredSessions.slice(0, 2)} />
          </div>
        </section>
      ) : null}
      {activeTab === "Activity Logs" ? <AuditActivityPanel logs={filteredActivity} onEscalate={(item) => updateActivity({ ...item, status: "Escalated" }, `${item.id} escalated.`)} onOpen={(item) => { setSelectedActivity(item); setDialog("activity"); }} onReview={(item) => updateActivity({ ...item, status: "Reviewed" }, `${item.id} reviewed.`)} /> : null}
      {activeTab === "Security Events" ? <AuditSecurityPanel events={filteredSecurity} onBlock={(item) => updateSecurity({ ...item, result: "Blocked", status: "Escalated" }, `${item.id} blocked.`)} onOpen={(item) => { setSelectedSecurity(item); setDialog("security"); }} onReview={(item) => updateSecurity({ ...item, status: "Reviewed" }, `${item.id} reviewed.`)} /> : null}
      {activeTab === "Data Changes" ? <AuditChangesPanel changes={filteredChanges} onApprove={(item) => updateChange({ ...item, approval: "Approved", status: "Reviewed" }, `${item.id} approved.`)} onEscalate={(item) => updateChange({ ...item, status: "Escalated" }, `${item.id} escalated.`)} onOpen={(item) => { setSelectedChange(item); setDialog("change"); }} onReview={(item) => updateChange({ ...item, status: "Reviewed" }, `${item.id} reviewed.`)} /> : null}
      {activeTab === "Admin Sessions" ? <AuditSessionsPanel onBlock={(item) => updateSession({ ...item, status: "Blocked", risk: "High" }, `${item.id} blocked.`)} onLogout={(item) => updateSession({ ...item, status: "Forced logout" }, `${item.id} forced logout.`)} onOpen={(item) => { setSelectedSession(item); setDialog("session"); }} onTrust={(item) => updateSession({ ...item, status: "Trusted", trusted: true }, `${item.id} trusted.`)} sessions={filteredSessions} /> : null}
      {activeTab === "Exports" ? <AuditExportsPanel exports={filteredExports} onOpen={(item) => { setSelectedExport(item); setDialog("export"); }} onReview={(item) => updateExport({ ...item, review: "Reviewed" }, `${item.id} reviewed.`)} onRevoke={(item) => updateExport({ ...item, status: "Revoked", review: "Escalated" }, `${item.id} revoked.`)} /> : null}
      {activeTab === "Risk Alerts" ? <AuditRiskPanel alerts={filteredRisks} onLock={(item) => updateRisk({ ...item, status: "Escalated", ownerNote: "Account lock requested." }, `${item.id} account lock requested.`)} onOpen={(item) => { setSelectedRisk(item); setDialog("risk"); }} onReview={(item) => updateRisk({ ...item, status: "Reviewed" }, `${item.id} reviewed.`)} /> : null}
      {activeTab === "Settings" ? <AuditSettingsPanel onSave={saveSettings} settings={settings} /> : null}

      {dialog === "activity" ? <AuditActivityDialog item={selectedActivity} onClose={() => setDialog(null)} onSave={saveActivity} /> : null}
      {dialog === "security" ? <AuditSecurityDialog item={selectedSecurity} onClose={() => setDialog(null)} onSave={saveSecurity} /> : null}
      {dialog === "change" ? <AuditChangeDialog item={selectedChange} onClose={() => setDialog(null)} onSave={saveChange} /> : null}
      {dialog === "session" ? <AuditSessionDialog item={selectedSession} onClose={() => setDialog(null)} onSave={saveSession} /> : null}
      {dialog === "export" ? <AuditExportDialog item={selectedExport} onClose={() => setDialog(null)} onSave={saveExport} /> : null}
      {dialog === "risk" ? <AuditRiskDialog item={selectedRisk} onClose={() => setDialog(null)} onSave={saveRisk} /> : null}
    </>
  );
}

function AuditActivityPanel({ logs, onEscalate, onOpen, onReview }: { logs: AuditActivityLog[]; onEscalate: (item: AuditActivityLog) => void; onOpen: (item: AuditActivityLog) => void; onReview: (item: AuditActivityLog) => void }) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head"><div><span>Activity</span><h2>Admin action trail</h2></div></div>
      <div className="report-table">
        <div className="report-row report-row-head" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.3fr" }}><span>Action</span><span>Admin</span><span>Module</span><span>Risk</span><span>Status</span><span>Actions</span></div>
        {logs.map((item) => <div className="report-row" key={item.id} style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.3fr" }}><span><strong>{item.id}</strong><small>{item.action} · {item.target}</small></span><span>{item.admin}<small>{item.email}</small></span><span>{item.module}<small>{item.timestamp}</small></span><span><Badge label={item.risk} /></span><span><Badge label={item.status} /></span><span className="report-actions"><button type="button" onClick={() => onOpen(item)}>Open</button><button type="button" onClick={() => onReview(item)}>Review</button><button type="button" onClick={() => onEscalate(item)}>Escalate</button></span></div>)}
      </div>
    </section>
  );
}

function AuditSecurityPanel({ events, onBlock, onOpen, onReview }: { events: AuditSecurityEvent[]; onBlock: (item: AuditSecurityEvent) => void; onOpen: (item: AuditSecurityEvent) => void; onReview: (item: AuditSecurityEvent) => void }) {
  return (
    <section className="reports-panel compact">
      <div className="reports-panel-head"><div><span>Security</span><h2>Login and access events</h2></div></div>
      <div className="report-export-list">
        {events.map((item) => <article key={item.id}><div><strong>{item.eventType}</strong><span>{item.email} · {item.ip} · {item.location}</span><small>{item.note}</small></div><Badge label={item.risk} /><div className="report-actions"><button type="button" onClick={() => onOpen(item)}>Open</button><button type="button" onClick={() => onReview(item)}>Review</button><button type="button" onClick={() => onBlock(item)}>Block</button></div></article>)}
      </div>
    </section>
  );
}

function AuditChangesPanel({ changes, onApprove, onEscalate, onOpen, onReview }: { changes: AuditDataChange[]; onApprove: (item: AuditDataChange) => void; onEscalate: (item: AuditDataChange) => void; onOpen: (item: AuditDataChange) => void; onReview: (item: AuditDataChange) => void }) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head"><div><span>Data changes</span><h2>Before and after review</h2></div></div>
      <div className="report-table">
        <div className="report-row report-row-head" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.4fr" }}><span>Change</span><span>Record</span><span>Field</span><span>Before/after</span><span>Risk</span><span>Actions</span></div>
        {changes.map((item) => <div className="report-row" key={item.id} style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.4fr" }}><span><strong>{item.id}</strong><small>{item.module} · {item.timestamp}</small></span><span>{item.recordName}<small>{item.recordId}</small></span><span>{item.field}<small>{item.changedBy}</small></span><span>{item.oldValue}<small>to {item.newValue}</small></span><span><Badge label={item.risk} /><small>{item.approval}</small></span><span className="report-actions"><button type="button" onClick={() => onOpen(item)}>Open</button><button type="button" onClick={() => onApprove(item)}>Approve</button><button type="button" onClick={() => onReview(item)}>Review</button><button type="button" onClick={() => onEscalate(item)}>Escalate</button></span></div>)}
      </div>
    </section>
  );
}

function AuditSessionsPanel({ onBlock, onLogout, onOpen, onTrust, sessions }: { onBlock: (item: AuditSession) => void; onLogout: (item: AuditSession) => void; onOpen: (item: AuditSession) => void; onTrust: (item: AuditSession) => void; sessions: AuditSession[] }) {
  return (
    <section className="reports-panel compact">
      <div className="reports-panel-head"><div><span>Sessions</span><h2>Admin session manager</h2></div></div>
      <div className="report-export-list">
        {sessions.map((item) => <article key={item.id}><div><strong>{item.admin}</strong><span>{item.email} · {item.ip} · {item.location}</span><small>{item.device} · {item.lastActivity}</small></div><Badge label={item.status} /><div className="report-actions"><button type="button" onClick={() => onOpen(item)}>Open</button><button type="button" onClick={() => onLogout(item)}>Logout</button><button type="button" onClick={() => onTrust(item)}>Trust</button><button type="button" onClick={() => onBlock(item)}>Block</button></div></article>)}
      </div>
    </section>
  );
}

function AuditExportsPanel({ exports, onOpen, onReview, onRevoke }: { exports: AuditExport[]; onOpen: (item: AuditExport) => void; onReview: (item: AuditExport) => void; onRevoke: (item: AuditExport) => void }) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head"><div><span>Exports</span><h2>Sensitive export tracking</h2></div></div>
      <div className="report-table">
        <div className="report-row report-row-head" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.3fr" }}><span>Export</span><span>Admin</span><span>Module</span><span>Rows</span><span>Status</span><span>Actions</span></div>
        {exports.map((item) => <div className="report-row" key={item.id} style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.3fr" }}><span><strong>{item.id}</strong><small>{item.exportType} · {item.format}</small></span><span>{item.admin}<small>{item.email}</small></span><span>{item.module}<small>{item.dateRange}</small></span><span>{item.rows}<small>{item.downloadTime}</small></span><span><Badge label={item.status} /><small>{item.review}</small></span><span className="report-actions"><button type="button" onClick={() => onOpen(item)}>Open</button><button type="button" onClick={() => onReview(item)}>Review</button><button type="button" onClick={() => onRevoke(item)}>Revoke</button></span></div>)}
      </div>
    </section>
  );
}

function AuditRiskPanel({ alerts, onLock, onOpen, onReview }: { alerts: AuditRiskAlert[]; onLock: (item: AuditRiskAlert) => void; onOpen: (item: AuditRiskAlert) => void; onReview: (item: AuditRiskAlert) => void }) {
  return (
    <section className="reports-panel compact">
      <div className="reports-panel-head"><div><span>Risk alerts</span><h2>Critical review queue</h2></div></div>
      <div className="report-export-list">
        {alerts.map((item) => <article key={item.id}><div><strong>{item.alertType}</strong><span>{item.module} · {item.target} · {item.admin}</span><small>{item.trigger}</small></div><Badge label={item.risk} /><div className="report-actions"><button type="button" onClick={() => onOpen(item)}>Open</button><button type="button" onClick={() => onReview(item)}>Review</button><button type="button" onClick={() => onLock(item)}>Lock</button></div></article>)}
      </div>
    </section>
  );
}

function AuditSettingsPanel({ onSave, settings }: { onSave: (event: FormEvent<HTMLFormElement>) => void; settings: AuditSettings }) {
  return (
    <form className="settings-panel" onSubmit={onSave}>
      <SettingsPanelHead eyebrow="Audit policy" title="Security and retention controls" />
      <div className="settings-form-grid">
        <label><span>Retention period</span><input name="retention" defaultValue={settings.retention} /></label>
        <SettingToggle defaultChecked={settings.trackIp} label="Track IP address" name="trackIp" />
        <SettingToggle defaultChecked={settings.trackLocation} label="Track approximate location" name="trackLocation" />
        <SettingToggle defaultChecked={settings.trackDevice} label="Track device/browser" name="trackDevice" />
        <SettingToggle defaultChecked={settings.trackBeforeAfter} label="Track before/after changes" name="trackBeforeAfter" />
        <SettingToggle defaultChecked={settings.requireReason} label="Require reason for sensitive changes" name="requireReason" />
        <SettingToggle defaultChecked={settings.ownerApproval} label="Require owner approval for critical actions" name="ownerApproval" />
        <SettingToggle defaultChecked={settings.highRiskAlerts} label="Alert owner on high-risk events" name="highRiskAlerts" />
        <SettingToggle defaultChecked={settings.ownerOnlyExport} label="Audit export owner only" name="ownerOnlyExport" />
        <SettingToggle defaultChecked={settings.maskCustomerData} label="Mask customer personal data" name="maskCustomerData" />
        <SettingToggle defaultChecked={settings.autoLockSuspicious} label="Auto-lock suspicious activity" name="autoLockSuspicious" />
        <SettingToggle defaultChecked={settings.immutableSecurityEvents} label="Keep security events immutable" name="immutableSecurityEvents" />
      </div>
      <SettingsActions primary="Save audit policy" />
    </form>
  );
}

function AuditActivityDialog({ item, onClose, onSave }: { item: AuditActivityLog; onClose: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSave}>
        <div className="product-dialog-head"><div><span>{item.id}</span><h3>Activity log detail</h3></div><button type="button" onClick={onClose}>Close</button></div>
        <div className="settings-form-grid">
          <label><span>Admin user</span><input name="admin" defaultValue={item.admin} /></label>
          <label><span>Admin email</span><input name="email" defaultValue={item.email} /></label>
          <label><span>Role</span><input name="role" defaultValue={item.role} /></label>
          <label><span>Module</span><input name="module" defaultValue={item.module} /></label>
          <label><span>Action type</span><input name="action" defaultValue={item.action} /></label>
          <label><span>Target record</span><input name="target" defaultValue={item.target} /></label>
          <label><span>Timestamp</span><input name="timestamp" defaultValue={item.timestamp} /></label>
          <label><span>Status</span><AuditStatusSelect name="status" value={item.status} /></label>
          <label><span>IP address</span><input name="ip" defaultValue={item.ip} /></label>
          <label><span>Device/browser</span><input name="device" defaultValue={item.device} /></label>
          <label><span>Location</span><input name="location" defaultValue={item.location} /></label>
          <label><span>Risk</span><AuditRiskSelect value={item.risk} /></label>
          <label className="settings-wide"><span>Audit note</span><textarea name="note" defaultValue={item.note} rows={4} /></label>
        </div>
        <div className="product-dialog-actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit">Save activity log</button></div>
      </form>
    </div>
  );
}

function AuditSecurityDialog({ item, onClose, onSave }: { item: AuditSecurityEvent; onClose: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSave}>
        <div className="product-dialog-head"><div><span>{item.id}</span><h3>Security event detail</h3></div><button type="button" onClick={onClose}>Close</button></div>
        <div className="settings-form-grid">
          <label><span>Admin user</span><input name="admin" defaultValue={item.admin} /></label>
          <label><span>Email</span><input name="email" defaultValue={item.email} /></label>
          <label><span>Event type</span><input name="eventType" defaultValue={item.eventType} /></label>
          <label><span>Result</span><select name="result" defaultValue={item.result}><option>Success</option><option>Failed</option><option>Blocked</option><option>Required</option></select></label>
          <label><span>Timestamp</span><input name="timestamp" defaultValue={item.timestamp} /></label>
          <label><span>IP address</span><input name="ip" defaultValue={item.ip} /></label>
          <label><span>Device</span><input name="device" defaultValue={item.device} /></label>
          <label><span>Browser</span><input name="browser" defaultValue={item.browser} /></label>
          <label><span>Location</span><input name="location" defaultValue={item.location} /></label>
          <label><span>Risk</span><AuditRiskSelect value={item.risk} /></label>
          <label><span>Review status</span><AuditStatusSelect name="status" value={item.status} /></label>
          <label className="settings-wide"><span>Security note</span><textarea name="note" defaultValue={item.note} rows={4} /></label>
        </div>
        <div className="product-dialog-actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit">Save security event</button></div>
      </form>
    </div>
  );
}

function AuditChangeDialog({ item, onClose, onSave }: { item: AuditDataChange; onClose: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSave}>
        <div className="product-dialog-head"><div><span>{item.id}</span><h3>Data change detail</h3></div><button type="button" onClick={onClose}>Close</button></div>
        <div className="settings-form-grid">
          <label><span>Module</span><input name="module" defaultValue={item.module} /></label>
          <label><span>Record ID</span><input name="recordId" defaultValue={item.recordId} /></label>
          <label><span>Record name</span><input name="recordName" defaultValue={item.recordName} /></label>
          <label><span>Field changed</span><input name="field" defaultValue={item.field} /></label>
          <label><span>Old value</span><input name="oldValue" defaultValue={item.oldValue} /></label>
          <label><span>New value</span><input name="newValue" defaultValue={item.newValue} /></label>
          <label><span>Changed by</span><input name="changedBy" defaultValue={item.changedBy} /></label>
          <label><span>Timestamp</span><input name="timestamp" defaultValue={item.timestamp} /></label>
          <label><span>Risk</span><AuditRiskSelect value={item.risk} /></label>
          <label><span>Approval</span><select name="approval" defaultValue={item.approval}><option>Not required</option><option>Pending approval</option><option>Approved</option><option>Rejected</option></select></label>
          <label><span>Status</span><AuditStatusSelect name="status" value={item.status} /></label>
          <label className="settings-wide"><span>Change reason</span><input name="reason" defaultValue={item.reason} /></label>
          <label className="settings-wide"><span>Review note</span><textarea name="note" defaultValue={item.note} rows={4} /></label>
        </div>
        <div className="product-dialog-actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit">Save data change</button></div>
      </form>
    </div>
  );
}

function AuditSessionDialog({ item, onClose, onSave }: { item: AuditSession; onClose: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSave}>
        <div className="product-dialog-head"><div><span>{item.id}</span><h3>Admin session detail</h3></div><button type="button" onClick={onClose}>Close</button></div>
        <div className="settings-form-grid">
          <label><span>Admin name</span><input name="admin" defaultValue={item.admin} /></label>
          <label><span>Email</span><input name="email" defaultValue={item.email} /></label>
          <label><span>Role</span><input name="role" defaultValue={item.role} /></label>
          <label><span>Login time</span><input name="loginTime" defaultValue={item.loginTime} /></label>
          <label><span>Last activity</span><input name="lastActivity" defaultValue={item.lastActivity} /></label>
          <label><span>IP address</span><input name="ip" defaultValue={item.ip} /></label>
          <label><span>Device</span><input name="device" defaultValue={item.device} /></label>
          <label><span>Browser</span><input name="browser" defaultValue={item.browser} /></label>
          <label><span>Location</span><input name="location" defaultValue={item.location} /></label>
          <label><span>Status</span><select name="status" defaultValue={item.status}><option>Active</option><option>Idle</option><option>Expired</option><option>Forced logout</option><option>Blocked</option><option>Trusted</option></select></label>
          <label><span>2FA</span><select name="twoFactor" defaultValue={item.twoFactor}><option>Verified</option><option>Pending</option><option>Failed</option></select></label>
          <label><span>Risk</span><AuditRiskSelect value={item.risk} /></label>
          <SettingToggle defaultChecked={item.trusted} label="Trusted device" name="trusted" />
          <label className="settings-wide"><span>Session note</span><textarea name="note" defaultValue={item.note} rows={4} /></label>
        </div>
        <div className="product-dialog-actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit">Save session</button></div>
      </form>
    </div>
  );
}

function AuditExportDialog({ item, onClose, onSave }: { item: AuditExport; onClose: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSave}>
        <div className="product-dialog-head"><div><span>{item.id}</span><h3>Export audit detail</h3></div><button type="button" onClick={onClose}>Close</button></div>
        <div className="settings-form-grid">
          <label><span>Admin user</span><input name="admin" defaultValue={item.admin} /></label>
          <label><span>Email</span><input name="email" defaultValue={item.email} /></label>
          <label><span>Export type</span><input name="exportType" defaultValue={item.exportType} /></label>
          <label><span>Module</span><input name="module" defaultValue={item.module} /></label>
          <label><span>Format</span><select name="format" defaultValue={item.format}><option>CSV</option><option>PDF</option><option>XLSX</option></select></label>
          <label><span>Date range</span><input name="dateRange" defaultValue={item.dateRange} /></label>
          <label><span>Rows exported</span><input name="rows" defaultValue={item.rows} /></label>
          <label><span>Status</span><select name="status" defaultValue={item.status}><option>Ready</option><option>Downloaded</option><option>Revoked</option><option>Processing</option><option>Failed</option></select></label>
          <label><span>Download time</span><input name="downloadTime" defaultValue={item.downloadTime} /></label>
          <label><span>IP address</span><input name="ip" defaultValue={item.ip} /></label>
          <label><span>Review status</span><AuditStatusSelect name="review" value={item.review} /></label>
          <label className="settings-wide"><span>Export reason</span><textarea name="reason" defaultValue={item.reason} rows={4} /></label>
        </div>
        <div className="product-dialog-actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit">Save export audit</button></div>
      </form>
    </div>
  );
}

function AuditRiskDialog({ item, onClose, onSave }: { item: AuditRiskAlert; onClose: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSave}>
        <div className="product-dialog-head"><div><span>{item.id}</span><h3>Risk alert detail</h3></div><button type="button" onClick={onClose}>Close</button></div>
        <div className="settings-form-grid">
          <label><span>Alert type</span><input name="alertType" defaultValue={item.alertType} /></label>
          <label><span>Module</span><input name="module" defaultValue={item.module} /></label>
          <label><span>Target record</span><input name="target" defaultValue={item.target} /></label>
          <label><span>Risk</span><AuditRiskSelect value={item.risk} /></label>
          <label><span>Admin user</span><input name="admin" defaultValue={item.admin} /></label>
          <label><span>Timestamp</span><input name="timestamp" defaultValue={item.timestamp} /></label>
          <label><span>Status</span><AuditStatusSelect name="status" value={item.status} /></label>
          <label className="settings-wide"><span>Trigger reason</span><textarea name="trigger" defaultValue={item.trigger} rows={3} /></label>
          <label className="settings-wide"><span>Owner note</span><textarea name="ownerNote" defaultValue={item.ownerNote} rows={4} /></label>
        </div>
        <div className="product-dialog-actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit">Save risk alert</button></div>
      </form>
    </div>
  );
}

function AuditRiskSelect({ value }: { value: AuditRiskLevel }) {
  return <select name="risk" defaultValue={value}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select>;
}

function AuditStatusSelect({ name, value }: { name: string; value: AuditReviewStatus }) {
  return <select name={name} defaultValue={value}><option>Open</option><option>Reviewed</option><option>Escalated</option><option>Owner review</option><option>Resolved</option></select>;
}

function ContentManagerView() {
  const [activeTab, setActiveTab] = useState<ContentTab>("Overview");
  const [items, setItems] = usePersistentState<ContentItem[]>("content:items", initialContentItems);
  const [settings, setSettings] = usePersistentState<ContentSettings>("content:settings", defaultContentSettings);
  const [selectedItem, setSelectedItem] = useState<ContentItem>(initialContentItems[0]);
  const [dialog, setDialog] = useState<"item" | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [notice, setNotice] = useState("Content Manager is ready. Client connection will use APIs after backend persistence.");

  const tabs: ContentTab[] = ["Overview", "Homepage", "Banners", "Pages", "Media Library", "SEO", "Announcements", "Navigation", "Content Schedule", "Settings"];
  const tabTypeMap: Partial<Record<ContentTab, ContentKind>> = {
    Homepage: "Homepage",
    Banners: "Banner",
    Pages: "Page",
    "Media Library": "Media",
    SEO: "SEO",
    Announcements: "Announcement",
    Navigation: "Navigation",
    "Content Schedule": "Schedule"
  };
  const activeType = tabTypeMap[activeTab];
  const filteredItems = items.filter((item) => {
    const typeMatch = activeType ? item.type === activeType : true;
    const statusMatch = statusFilter === "All" || item.status === statusFilter || item.approval === statusFilter;
    const queryValue = query.toLowerCase().trim();
    const queryMatch = queryValue ? `${item.id} ${item.type} ${item.title} ${item.slug} ${item.placement} ${item.ctaUrl} ${item.owner} ${item.issue}`.toLowerCase().includes(queryValue) : true;
    return typeMatch && statusMatch && queryMatch;
  });
  const stats = [
    { label: "Live sections", value: items.filter((item) => item.type === "Homepage" && item.status === "Live").length, detail: "Homepage blocks live" },
    { label: "Active banners", value: items.filter((item) => item.type === "Banner" && item.status === "Live").length, detail: "Customer-facing banners" },
    { label: "Scheduled", value: items.filter((item) => item.status === "Scheduled").length, detail: "Upcoming content" },
    { label: "Drafts", value: items.filter((item) => item.status === "Draft").length, detail: "Needs completion" },
    { label: "SEO issues", value: items.filter((item) => item.issue !== "No issues").length, detail: "Needs content review" },
    { label: "Awaiting approval", value: items.filter((item) => item.approval === "Awaiting approval").length, detail: "Owner review queue" }
  ];

  function changeTab(tab: ContentTab) {
    setActiveTab(tab);
    setNotice(`${tab} opened.`);
  }

  function updateItem(item: ContentItem, message: string) {
    setItems((rows) => rows.map((row) => (row.id === item.id ? item : row)));
    setSelectedItem(item);
    setNotice(message);
  }

  function openItem(item: ContentItem) {
    setSelectedItem(item);
    setDialog("item");
    setNotice(`${item.id} opened for editing.`);
  }

  function createItem(type: ContentKind) {
    const created: ContentItem = {
      ...items[0],
      id: `${type.slice(0, 3).toUpperCase()}-${800 + items.length}`,
      type,
      title: `New ${type}`,
      subtitle: `Editable ${type.toLowerCase()} content`,
      placement: type === "Banner" ? "Promo strip" : type,
      image: "/images/content/new.jpg",
      mobileImage: "/images/content/new-mobile.jpg",
      ctaLabel: "Open",
      ctaUrl: "/",
      coupon: "-",
      slug: `new-${type.toLowerCase().replace(" ", "-")}`,
      owner: "Owner",
      audience: "All customers",
      status: "Draft",
      approval: "Draft",
      order: items.length + 1,
      views: 0,
      clicks: 0,
      conversions: 0,
      seoScore: "0",
      updated: "Just now",
      body: "Add content body.",
      altText: "",
      fileType: type,
      fileSize: "-",
      dimensions: "-",
      issue: "Needs content",
      preview: "Draft preview",
      notes: "New content item."
    };
    setItems((rows) => [created, ...rows]);
    setSelectedItem(created);
    setActiveTab(type === "Banner" ? "Banners" : type === "Page" ? "Pages" : type === "Media" ? "Media Library" : type === "SEO" ? "SEO" : type === "Announcement" ? "Announcements" : type === "Navigation" ? "Navigation" : type === "Schedule" ? "Content Schedule" : "Homepage");
    setDialog("item");
    setNotice(`${created.id} created. Complete the form and save.`);
  }

  function duplicateItem(item: ContentItem) {
    const duplicate = { ...item, id: `${item.id}-COPY`, title: `${item.title} copy`, status: "Draft" as ContentStatus, approval: "Draft" as ContentApproval, updated: "Just now" };
    setItems((rows) => [duplicate, ...rows]);
    setSelectedItem(duplicate);
    setDialog("item");
    setNotice(`${item.title} duplicated.`);
  }

  function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updated: ContentItem = {
      ...selectedItem,
      type: String(formData.get("type") || selectedItem.type) as ContentKind,
      title: String(formData.get("title") || selectedItem.title).trim(),
      subtitle: String(formData.get("subtitle") || selectedItem.subtitle).trim(),
      placement: String(formData.get("placement") || selectedItem.placement).trim(),
      image: String(formData.get("image") || selectedItem.image).trim(),
      mobileImage: String(formData.get("mobileImage") || selectedItem.mobileImage).trim(),
      ctaLabel: String(formData.get("ctaLabel") || selectedItem.ctaLabel).trim(),
      ctaUrl: String(formData.get("ctaUrl") || selectedItem.ctaUrl).trim(),
      coupon: String(formData.get("coupon") || selectedItem.coupon).trim(),
      background: String(formData.get("background") || selectedItem.background).trim(),
      textColor: String(formData.get("textColor") || selectedItem.textColor).trim(),
      slug: String(formData.get("slug") || selectedItem.slug).trim(),
      owner: String(formData.get("owner") || selectedItem.owner).trim(),
      audience: String(formData.get("audience") || selectedItem.audience).trim(),
      startDate: String(formData.get("startDate") || selectedItem.startDate).trim(),
      endDate: String(formData.get("endDate") || selectedItem.endDate).trim(),
      status: String(formData.get("status") || selectedItem.status) as ContentStatus,
      order: Number(formData.get("order") || selectedItem.order),
      views: Number(formData.get("views") || selectedItem.views),
      clicks: Number(formData.get("clicks") || selectedItem.clicks),
      conversions: Number(formData.get("conversions") || selectedItem.conversions),
      seoScore: String(formData.get("seoScore") || selectedItem.seoScore).trim(),
      approval: String(formData.get("approval") || selectedItem.approval) as ContentApproval,
      updated: "Just now",
      body: String(formData.get("body") || selectedItem.body).trim(),
      altText: String(formData.get("altText") || selectedItem.altText).trim(),
      fileType: String(formData.get("fileType") || selectedItem.fileType).trim(),
      fileSize: String(formData.get("fileSize") || selectedItem.fileSize).trim(),
      dimensions: String(formData.get("dimensions") || selectedItem.dimensions).trim(),
      issue: String(formData.get("issue") || selectedItem.issue).trim(),
      preview: String(formData.get("preview") || selectedItem.preview).trim(),
      notes: String(formData.get("notes") || selectedItem.notes).trim()
    };
    updateItem(updated, `${updated.id} saved.`);
    setDialog(null);
  }

  function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSettings({
      requireApproval: formData.get("requireApproval") === "on",
      requireAltText: formData.get("requireAltText") === "on",
      autoArchiveExpired: formData.get("autoArchiveExpired") === "on",
      ownerHeroApproval: formData.get("ownerHeroApproval") === "on",
      seoBeforePublish: formData.get("seoBeforePublish") === "on",
      allowedFileTypes: String(formData.get("allowedFileTypes") || settings.allowedFileTypes).trim(),
      maxUploadSize: String(formData.get("maxUploadSize") || settings.maxUploadSize).trim(),
      defaultOgImage: String(formData.get("defaultOgImage") || settings.defaultOgImage).trim(),
      brandTone: String(formData.get("brandTone") || settings.brandTone).trim(),
      legalOwner: String(formData.get("legalOwner") || settings.legalOwner).trim(),
      previewUrl: String(formData.get("previewUrl") || settings.previewUrl).trim(),
      revalidationMode: String(formData.get("revalidationMode") || settings.revalidationMode).trim()
    });
    setNotice("Content settings saved.");
  }

  function runSeoCheck() {
    setItems((rows) => rows.map((item) => {
      if (!["Homepage", "Banner", "Page", "SEO"].includes(item.type)) {
        return item;
      }

      const hasMissingAlt = !item.altText.trim();
      const hasWeakSlug = item.slug === "/" || item.slug.length < 3;
      const nextScore = hasMissingAlt || hasWeakSlug ? "72" : "96";
      return {
        ...item,
        seoScore: nextScore,
        issue: hasMissingAlt ? "Missing alt text" : hasWeakSlug ? "Weak slug" : "No issues",
        updated: "Just now",
        notes: hasMissingAlt || hasWeakSlug ? "SEO check found a fix before publish." : "SEO check passed."
      };
    }));
    setActiveTab("SEO");
    setNotice("SEO check completed and content records were updated.");
  }

  return (
    <>
      {notice ? <div className="admin-notice">{notice}</div> : null}
      <section className="reports-command">
        <div>
          <span>Content operations</span>
          <h2>Client website content manager</h2>
          <p>Control homepage sections, banners, pages, media, SEO, announcements, navigation, schedules, and publishing rules that will connect to the client website through APIs.</p>
          <div className="reports-tabs">
            {tabs.map((tab) => <button className={activeTab === tab ? "active" : ""} key={tab} type="button" onClick={() => changeTab(tab)}>{tab}</button>)}
          </div>
        </div>
        <div className="reports-command-actions">
          <button className="primary-action" type="button" onClick={() => createItem("Banner")}>Create banner</button>
          <button type="button" onClick={() => createItem("Page")}>Create page</button>
          <button type="button" onClick={() => createItem("Media")}>Upload media</button>
          <button type="button" onClick={runSeoCheck}>Run SEO check</button>
        </div>
      </section>

      <section className="reports-stat-grid">
        {stats.map((stat) => <button key={stat.label} type="button" onClick={() => setNotice(`${stat.label}: ${stat.value} - ${stat.detail}`)}><div><span>{stat.label}</span><small>{stat.detail}</small></div><strong>{stat.value}</strong></button>)}
      </section>

      <section className="reports-panel compact">
        <div className="settings-form-grid">
          <label><span>Search content</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Banner, slug, media, SEO, CTA URL, content ID" /></label>
          <label><span>Status / approval</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All</option><option>Draft</option><option>Live</option><option>Scheduled</option><option>Paused</option><option>Archived</option><option>Published</option><option>Hidden</option><option>Awaiting approval</option><option>Approved</option><option>Rejected</option></select></label>
        </div>
      </section>

      {activeTab === "Overview" ? (
        <section className="reports-layout">
          <div className="reports-main-stack">
            <ContentItemsPanel items={items.filter((item) => ["Homepage", "Banner", "Announcement"].includes(item.type)).slice(0, 5)} onArchive={(item) => updateItem({ ...item, status: "Archived" }, `${item.id} archived.`)} onDuplicate={duplicateItem} onOpen={openItem} onPause={(item) => updateItem({ ...item, status: "Paused" }, `${item.id} paused.`)} onPreview={(item) => updateItem({ ...item, preview: "Preview opened just now" }, `${item.id} preview opened.`)} onPublish={(item) => updateItem({ ...item, status: item.type === "Page" ? "Published" : "Live", approval: "Approved" }, `${item.id} published.`)} onSchedule={(item) => updateItem({ ...item, status: "Scheduled" }, `${item.id} scheduled.`)} title="Live and priority content" />
          </div>
          <div className="reports-side-stack">
            <ContentHealthPanel items={items} onTab={changeTab} />
            <ContentItemsPanel compact items={items.filter((item) => item.approval === "Awaiting approval" || item.issue !== "No issues").slice(0, 4)} onArchive={(item) => updateItem({ ...item, status: "Archived" }, `${item.id} archived.`)} onDuplicate={duplicateItem} onOpen={openItem} onPause={(item) => updateItem({ ...item, status: "Paused" }, `${item.id} paused.`)} onPreview={(item) => updateItem({ ...item, preview: "Preview opened just now" }, `${item.id} preview opened.`)} onPublish={(item) => updateItem({ ...item, status: item.type === "Page" ? "Published" : "Live", approval: "Approved" }, `${item.id} published.`)} onSchedule={(item) => updateItem({ ...item, status: "Scheduled" }, `${item.id} scheduled.`)} title="Approval and issue queue" />
          </div>
        </section>
      ) : null}

      {activeTab !== "Overview" && activeTab !== "Settings" ? <ContentItemsPanel items={filteredItems} onArchive={(item) => updateItem({ ...item, status: "Archived" }, `${item.id} archived.`)} onDuplicate={duplicateItem} onOpen={openItem} onPause={(item) => updateItem({ ...item, status: "Paused" }, `${item.id} paused.`)} onPreview={(item) => updateItem({ ...item, preview: "Preview opened just now" }, `${item.id} preview opened.`)} onPublish={(item) => updateItem({ ...item, status: item.type === "Page" ? "Published" : "Live", approval: "Approved", issue: settings.seoBeforePublish && item.issue !== "No issues" ? item.issue : "No issues" }, `${item.id} published.`)} onSchedule={(item) => updateItem({ ...item, status: "Scheduled" }, `${item.id} scheduled.`)} title={`${activeTab} manager`} /> : null}
      {activeTab === "Settings" ? <ContentSettingsPanel onSave={saveSettings} settings={settings} /> : null}
      {dialog === "item" ? <ContentItemDialog item={selectedItem} onClose={() => setDialog(null)} onSave={saveItem} /> : null}
    </>
  );
}

function ContentHealthPanel({ items, onTab }: { items: ContentItem[]; onTab: (tab: ContentTab) => void }) {
  const rows = [
    { title: "Missing images", detail: `${items.filter((item) => item.image === "-" || !item.image).length} content records need images`, tab: "Media Library" as ContentTab },
    { title: "SEO issues", detail: `${items.filter((item) => item.issue !== "No issues").length} content records need checks`, tab: "SEO" as ContentTab },
    { title: "Expiring banners", detail: `${items.filter((item) => item.type === "Banner" && item.status === "Live").length} active banners to monitor`, tab: "Banners" as ContentTab },
    { title: "Awaiting approval", detail: `${items.filter((item) => item.approval === "Awaiting approval").length} items need owner approval`, tab: "Content Schedule" as ContentTab }
  ];
  return (
    <section className="reports-panel compact">
      <div className="reports-panel-head"><div><span>Health</span><h2>Content action list</h2></div></div>
      <div className="report-export-list">
        {rows.map((row) => <article key={row.title}><div><strong>{row.title}</strong><span>{row.detail}</span></div><button type="button" onClick={() => onTab(row.tab)}>Review</button></article>)}
      </div>
    </section>
  );
}

function ContentItemsPanel({
  compact = false,
  items,
  onArchive,
  onDuplicate,
  onOpen,
  onPause,
  onPreview,
  onPublish,
  onSchedule,
  title
}: {
  compact?: boolean;
  items: ContentItem[];
  onArchive: (item: ContentItem) => void;
  onDuplicate: (item: ContentItem) => void;
  onOpen: (item: ContentItem) => void;
  onPause: (item: ContentItem) => void;
  onPreview: (item: ContentItem) => void;
  onPublish: (item: ContentItem) => void;
  onSchedule: (item: ContentItem) => void;
  title: string;
}) {
  if (compact) {
    return (
      <section className="reports-panel compact">
        <div className="reports-panel-head"><div><span>Content</span><h2>{title}</h2></div></div>
        <div className="report-export-list">
          {items.map((item) => <article key={item.id}><div><strong>{item.title}</strong><span>{item.type} · {item.status} · {item.issue}</span><small>{item.slug} · {item.owner}</small></div><Badge label={item.approval} /><div className="report-actions"><button type="button" onClick={() => onOpen(item)}>Open</button><button type="button" onClick={() => onPreview(item)}>Preview</button><button type="button" onClick={() => onPublish(item)}>Publish</button></div></article>)}
        </div>
      </section>
    );
  }

  return (
    <section className="reports-panel">
      <div className="reports-panel-head"><div><span>Content</span><h2>{title}</h2></div></div>
      <div className="report-table">
        <div className="report-row report-row-head" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.8fr" }}><span>Content</span><span>Placement</span><span>Status</span><span>Performance</span><span>Owner</span><span>Actions</span></div>
        {items.map((item) => (
          <div className="report-row" key={item.id} style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.8fr" }}>
            <span><strong>{item.title}</strong><small>{item.id} · {item.type} · {item.slug}</small></span>
            <span>{item.placement}<small>Order {item.order} · {item.audience}</small></span>
            <span><Badge label={item.status} /><small>{item.approval}</small></span>
            <span>{item.views} views<small>{item.clicks} clicks · {item.conversions} conv.</small></span>
            <span>{item.owner}<small>{item.updated}</small></span>
            <span className="report-actions">
              <button type="button" onClick={() => onOpen(item)}>Open</button>
              <button type="button" onClick={() => onPreview(item)}>Preview</button>
              <button type="button" onClick={() => onPublish(item)}>Publish</button>
              <button type="button" onClick={() => onPause(item)}>Pause</button>
              <button type="button" onClick={() => onSchedule(item)}>Schedule</button>
              <button type="button" onClick={() => onDuplicate(item)}>Duplicate</button>
              <button type="button" onClick={() => onArchive(item)}>Archive</button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ContentSettingsPanel({ onSave, settings }: { onSave: (event: FormEvent<HTMLFormElement>) => void; settings: ContentSettings }) {
  return (
    <form className="settings-panel" onSubmit={onSave}>
      <SettingsPanelHead eyebrow="Content settings" title="Publishing, media, SEO, and client preview rules" />
      <div className="settings-form-grid">
        <SettingToggle defaultChecked={settings.requireApproval} label="Require approval before publish" name="requireApproval" />
        <SettingToggle defaultChecked={settings.requireAltText} label="Require image alt text" name="requireAltText" />
        <SettingToggle defaultChecked={settings.autoArchiveExpired} label="Auto-archive expired banners" name="autoArchiveExpired" />
        <SettingToggle defaultChecked={settings.ownerHeroApproval} label="Owner approval for homepage hero" name="ownerHeroApproval" />
        <SettingToggle defaultChecked={settings.seoBeforePublish} label="SEO checks before publish" name="seoBeforePublish" />
        <label><span>Allowed media types</span><input name="allowedFileTypes" defaultValue={settings.allowedFileTypes} /></label>
        <label><span>Max upload size</span><input name="maxUploadSize" defaultValue={settings.maxUploadSize} /></label>
        <label><span>Default OG image</span><input name="defaultOgImage" defaultValue={settings.defaultOgImage} /></label>
        <label><span>Legal content owner</span><input name="legalOwner" defaultValue={settings.legalOwner} /></label>
        <label><span>Preview URL</span><input name="previewUrl" defaultValue={settings.previewUrl} /></label>
        <label><span>Revalidation mode</span><input name="revalidationMode" defaultValue={settings.revalidationMode} /></label>
        <label className="settings-wide"><span>Brand tone guidelines</span><textarea name="brandTone" defaultValue={settings.brandTone} rows={4} /></label>
      </div>
      <SettingsActions primary="Save content settings" />
    </form>
  );
}

function ContentItemDialog({ item, onClose, onSave }: { item: ContentItem; onClose: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSave}>
        <div className="product-dialog-head"><div><span>{item.id}</span><h3>Content detail</h3></div><button type="button" onClick={onClose}>Close</button></div>
        <div className="settings-form-grid">
          <label><span>Content type</span><select name="type" defaultValue={item.type}><option>Homepage</option><option>Banner</option><option>Page</option><option>Media</option><option>SEO</option><option>Announcement</option><option>Navigation</option><option>Schedule</option></select></label>
          <label><span>Status</span><select name="status" defaultValue={item.status}><option>Draft</option><option>Live</option><option>Scheduled</option><option>Paused</option><option>Archived</option><option>Published</option><option>Hidden</option></select></label>
          <label><span>Title</span><input name="title" defaultValue={item.title} /></label>
          <label><span>Subtitle</span><input name="subtitle" defaultValue={item.subtitle} /></label>
          <label><span>Placement</span><input name="placement" defaultValue={item.placement} /></label>
          <label><span>Order</span><input name="order" type="number" defaultValue={item.order} /></label>
          <label><span>Desktop image / URL</span><input name="image" defaultValue={item.image} /></label>
          <label><span>Mobile image</span><input name="mobileImage" defaultValue={item.mobileImage} /></label>
          <label><span>Alt text</span><input name="altText" defaultValue={item.altText} /></label>
          <label><span>CTA label</span><input name="ctaLabel" defaultValue={item.ctaLabel} /></label>
          <label><span>CTA URL</span><input name="ctaUrl" defaultValue={item.ctaUrl} /></label>
          <label><span>Coupon link</span><input name="coupon" defaultValue={item.coupon} /></label>
          <label><span>Background color</span><input name="background" defaultValue={item.background} /></label>
          <label><span>Text color</span><input name="textColor" defaultValue={item.textColor} /></label>
          <label><span>Slug</span><input name="slug" defaultValue={item.slug} /></label>
          <label><span>Owner</span><input name="owner" defaultValue={item.owner} /></label>
          <label><span>Audience</span><input name="audience" defaultValue={item.audience} /></label>
          <label><span>Start date</span><input name="startDate" defaultValue={item.startDate} /></label>
          <label><span>End date</span><input name="endDate" defaultValue={item.endDate} /></label>
          <label><span>Views</span><input name="views" type="number" defaultValue={item.views} /></label>
          <label><span>Clicks</span><input name="clicks" type="number" defaultValue={item.clicks} /></label>
          <label><span>Conversions</span><input name="conversions" type="number" defaultValue={item.conversions} /></label>
          <label><span>SEO score</span><input name="seoScore" defaultValue={item.seoScore} /></label>
          <label><span>Approval</span><select name="approval" defaultValue={item.approval}><option>Not required</option><option>Draft</option><option>Awaiting approval</option><option>Approved</option><option>Rejected</option></select></label>
          <label><span>File type</span><input name="fileType" defaultValue={item.fileType} /></label>
          <label><span>File size</span><input name="fileSize" defaultValue={item.fileSize} /></label>
          <label><span>Dimensions</span><input name="dimensions" defaultValue={item.dimensions} /></label>
          <label><span>Issue</span><input name="issue" defaultValue={item.issue} /></label>
          <label><span>Preview state</span><input name="preview" defaultValue={item.preview} /></label>
          <label className="settings-wide"><span>Content body</span><textarea name="body" defaultValue={item.body} rows={5} /></label>
          <label className="settings-wide"><span>Internal notes</span><textarea name="notes" defaultValue={item.notes} rows={4} /></label>
        </div>
        <div className="product-dialog-actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit">Save content</button></div>
      </form>
    </div>
  );
}

function AdminAccountView() {
  const [activeTab, setActiveTab] = useState<AccountTab>("Overview");
  const [profile, setProfile] = usePersistentState<AdminAccountProfile>("account:profile", defaultAccountProfile);
  const [security, setSecurity] = usePersistentState<AdminAccountSecurity>("account:security", defaultAccountSecurity);
  const [sessions, setSessions] = usePersistentState<AdminAccountSession[]>("account:sessions", initialAccountSessions);
  const [permissions] = useState<AdminAccountPermission[]>(initialAccountPermissions);
  const [notifications, setNotifications] = usePersistentState<AdminAccountNotificationPreference[]>("account:notifications", initialAccountNotifications);
  const [preferences, setPreferences] = usePersistentState<AdminAccountPreferences>("account:preferences", defaultAccountPreferences);
  const [activity, setActivity] = usePersistentState<AdminAccountActivity[]>("account:activity", initialAccountActivity);
  const [recovery, setRecovery] = usePersistentState<AdminAccountRecovery>("account:recovery", defaultAccountRecovery);
  const [notice, setNotice] = useState("Admin account center is ready.");
  const tabs: AccountTab[] = ["Overview", "Profile", "Security", "Sessions", "Permissions", "Notifications", "Preferences", "Activity", "Recovery"];
  const activeSessions = sessions.filter((session) => ["Active", "Idle", "Trusted"].includes(session.status)).length;
  const openActivity = activity.filter((item) => item.status === "Open").length;
  const stats = [
    { label: "Role", value: "Owner", detail: "Full permission level" },
    { label: "2FA", value: security.twoFactorEnabled ? "Active" : "Off", detail: security.twoFactorMethod },
    { label: "Sessions", value: activeSessions, detail: "Active/trusted sessions" },
    { label: "Security risk", value: security.failedLogins ? "Watch" : "Healthy", detail: `${security.failedLogins} failed login attempts` },
    { label: "Activity", value: openActivity, detail: "Open account events" },
    { label: "Backup codes", value: recovery.backupCodesStatus, detail: "Recovery readiness" }
  ];

  function changeTab(tab: AccountTab) {
    setActiveTab(tab);
    setNotice(`${tab} opened.`);
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setProfile({
      ...profile,
      fullName: String(formData.get("fullName") || profile.fullName).trim(),
      displayName: String(formData.get("displayName") || profile.displayName).trim(),
      email: String(formData.get("email") || profile.email).trim(),
      phone: String(formData.get("phone") || profile.phone).trim(),
      avatar: String(formData.get("avatar") || profile.avatar).trim(),
      jobTitle: String(formData.get("jobTitle") || profile.jobTitle).trim(),
      department: String(formData.get("department") || profile.department).trim(),
      store: String(formData.get("store") || profile.store).trim(),
      timezone: String(formData.get("timezone") || profile.timezone).trim(),
      language: String(formData.get("language") || profile.language).trim(),
      emergencyContact: String(formData.get("emergencyContact") || profile.emergencyContact).trim(),
      internalNote: String(formData.get("internalNote") || profile.internalNote).trim()
    });
    setNotice("Profile saved.");
  }

  function saveSecurity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextTwoFactor = formData.get("twoFactorEnabled") === "on";
    setSecurity({
      ...security,
      twoFactorEnabled: nextTwoFactor,
      twoFactorMethod: String(formData.get("twoFactorMethod") || security.twoFactorMethod) as AdminAccountSecurity["twoFactorMethod"],
      loginAlerts: formData.get("loginAlerts") === "on",
      lockStatus: String(formData.get("lockStatus") || security.lockStatus) as AdminAccountSecurity["lockStatus"],
      reauthRequired: formData.get("reauthRequired") === "on",
      securityNote: String(formData.get("securityNote") || security.securityNote).trim(),
      passwordLastChanged: formData.get("newPassword") ? "Just now" : security.passwordLastChanged,
      backupCodes: formData.get("generateCodes") === "on" ? "10 unused" : security.backupCodes
    });
    setNotice(formData.get("newPassword") ? "Password and security settings saved." : "Security settings saved.");
  }

  function saveNotifications(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setNotifications((items) => items.map((item) => ({
      ...item,
      inApp: formData.get(`${item.id}-inApp`) === "on",
      email: formData.get(`${item.id}-email`) === "on",
      sms: formData.get(`${item.id}-sms`) === "on",
      whatsapp: formData.get(`${item.id}-whatsapp`) === "on",
      muted: formData.get(`${item.id}-muted`) === "on"
    })));
    setNotice("Notification preferences saved.");
  }

  function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPreferences({
      theme: String(formData.get("theme") || preferences.theme).trim(),
      compactMode: formData.get("compactMode") === "on",
      defaultLanding: String(formData.get("defaultLanding") || preferences.defaultLanding).trim(),
      defaultModule: String(formData.get("defaultModule") || preferences.defaultModule).trim(),
      rowDensity: String(formData.get("rowDensity") || preferences.rowDensity).trim(),
      currency: String(formData.get("currency") || preferences.currency).trim(),
      dateFormat: String(formData.get("dateFormat") || preferences.dateFormat).trim(),
      language: String(formData.get("language") || preferences.language).trim(),
      timezone: String(formData.get("timezone") || preferences.timezone).trim(),
      pinnedModules: String(formData.get("pinnedModules") || preferences.pinnedModules).trim(),
      searchBehavior: String(formData.get("searchBehavior") || preferences.searchBehavior).trim()
    });
    setNotice("UI preferences saved.");
  }

  function saveRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setRecovery({
      recoveryEmail: String(formData.get("recoveryEmail") || recovery.recoveryEmail).trim(),
      recoveryPhone: String(formData.get("recoveryPhone") || recovery.recoveryPhone).trim(),
      backupCodesStatus: formData.get("regenerateCodes") === "on" ? "10 unused" : String(formData.get("backupCodesStatus") || recovery.backupCodesStatus).trim(),
      emergencyOwner: String(formData.get("emergencyOwner") || recovery.emergencyOwner).trim(),
      recoveryQuestion: String(formData.get("recoveryQuestion") || recovery.recoveryQuestion).trim(),
      lastUpdated: "Just now",
      lockStatus: formData.get("lockRecovery") === "on" ? "Locked for 24 hours" : "Open"
    });
    setSecurity((current) => ({ ...current, backupCodes: formData.get("regenerateCodes") === "on" ? "10 unused" : current.backupCodes }));
    setNotice("Recovery settings saved.");
  }

  function updateSession(session: AdminAccountSession, message: string) {
    setSessions((items) => items.map((item) => (item.id === session.id ? session : item)));
    setNotice(message);
  }

  function reviewActivity(item: AdminAccountActivity) {
    setActivity((items) => items.map((entry) => (entry.id === item.id ? { ...entry, status: "Reviewed" } : entry)));
    setNotice(`${item.id} marked reviewed.`);
  }

  function reportActivity(item: AdminAccountActivity) {
    setActivity((items) => items.map((entry) => (entry.id === item.id ? { ...entry, status: "Reported", risk: "High" } : entry)));
    setNotice(`${item.id} reported as suspicious.`);
  }

  function sendTestLoginAlert() {
    const created: AdminAccountActivity = {
      id: `OWN-ACT-${Date.now().toString().slice(-5)}`,
      event: "Test login alert",
      detail: "Login alert test sent through enabled account channels.",
      time: "Just now",
      risk: "Low",
      status: "Open"
    };
    setActivity((items) => [created, ...items]);
    setActiveTab("Activity");
    setNotice(`${created.id} created in account activity.`);
  }

  return (
    <>
      {notice ? <div className="admin-notice">{notice}</div> : null}
      <section className="reports-command">
        <div>
          <span>Account security</span>
          <h2>{profile.displayName}&apos;s admin account</h2>
          <p>Manage owner profile, password, 2FA, sessions, permissions visibility, notifications, preferences, activity, and recovery controls.</p>
          <div className="reports-tabs">
            {tabs.map((tab) => <button className={activeTab === tab ? "active" : ""} key={tab} type="button" onClick={() => changeTab(tab)}>{tab}</button>)}
          </div>
        </div>
        <div className="reports-command-actions">
          <button className="primary-action" type="button" onClick={() => changeTab("Profile")}>Edit profile</button>
          <button type="button" onClick={() => changeTab("Security")}>Manage 2FA</button>
          <button type="button" onClick={() => setSessions((items) => items.map((item) => item.id === "OWN-SES-01" ? item : { ...item, status: "Logged out" }))}>Logout others</button>
          <button type="button" onClick={sendTestLoginAlert}>Test alert</button>
        </div>
      </section>

      <section className="reports-stat-grid">
        {stats.map((stat) => <button key={stat.label} type="button" onClick={() => setNotice(`${stat.label}: ${stat.value} - ${stat.detail}`)}><div><span>{stat.label}</span><small>{stat.detail}</small></div><strong>{stat.value}</strong></button>)}
      </section>

      {activeTab === "Overview" ? <AccountOverview profile={profile} security={security} sessions={sessions} activity={activity} onTab={changeTab} /> : null}
      {activeTab === "Profile" ? <AccountProfileForm onSave={saveProfile} profile={profile} onVerifyEmail={() => { setProfile((item) => ({ ...item, emailVerified: true })); setNotice("Email verified."); }} onVerifyPhone={() => { setProfile((item) => ({ ...item, phoneVerified: true })); setNotice("Phone verified."); }} /> : null}
      {activeTab === "Security" ? <AccountSecurityForm onGenerateCodes={() => { setSecurity((item) => ({ ...item, backupCodes: "10 unused" })); setRecovery((item) => ({ ...item, backupCodesStatus: "10 unused" })); setNotice("Backup codes generated."); }} onRevokeDevices={() => { setSessions((items) => items.map((item) => ({ ...item, trusted: false, status: item.status === "Trusted" ? "Idle" : item.status }))); setSecurity((item) => ({ ...item, trustedDevices: 0 })); setNotice("Trusted devices revoked."); }} onSave={saveSecurity} security={security} /> : null}
      {activeTab === "Sessions" ? <AccountSessionsPanel onLogout={(item) => updateSession({ ...item, status: "Logged out" }, `${item.id} logged out.`)} onReauth={(item) => updateSession({ ...item, status: "Re-auth required" }, `${item.id} requires re-authentication.`)} onTrust={(item) => updateSession({ ...item, trusted: true, status: "Trusted" }, `${item.id} marked trusted.`)} onUntrust={(item) => updateSession({ ...item, trusted: false, status: "Idle" }, `${item.id} removed from trusted devices.`)} sessions={sessions} /> : null}
      {activeTab === "Permissions" ? <AccountPermissionsPanel onAction={setNotice} permissions={permissions} /> : null}
      {activeTab === "Notifications" ? <AccountNotificationsForm notifications={notifications} onSave={saveNotifications} onSecurityOnly={() => { setNotifications((items) => items.map((item) => ({ ...item, muted: item.label !== "Security alerts" }))); setNotice("Security-only notification mode enabled."); }} onTest={() => setNotice("Test notification sent through selected channels.")} /> : null}
      {activeTab === "Preferences" ? <AccountPreferencesForm onReset={() => { setPreferences(defaultAccountPreferences); setNotice("Preferences reset to defaults."); }} onSave={savePreferences} preferences={preferences} /> : null}
      {activeTab === "Activity" ? <AccountActivityPanel activity={activity} onOpenAudit={() => { window.location.href = "/audit-logs"; }} onReport={reportActivity} onReview={reviewActivity} /> : null}
      {activeTab === "Recovery" ? <AccountRecoveryForm onSave={saveRecovery} recovery={recovery} /> : null}
    </>
  );
}

function AccountOverview({ activity, onTab, profile, security, sessions }: { activity: AdminAccountActivity[]; onTab: (tab: AccountTab) => void; profile: AdminAccountProfile; security: AdminAccountSecurity; sessions: AdminAccountSession[] }) {
  return (
    <section className="reports-layout">
      <div className="reports-main-stack">
        <section className="reports-panel">
          <div className="reports-panel-head"><div><span>Overview</span><h2>Account health</h2></div></div>
          <div className="report-table">
            {[
              ["Name", profile.fullName, profile.email],
              ["Role", "Owner", profile.jobTitle],
              ["2FA", security.twoFactorEnabled ? "Active" : "Disabled", security.twoFactorMethod],
              ["Last login", sessions[0]?.loginTime || "No session", sessions[0]?.device || "-"],
              ["Security", security.lockStatus, security.securityNote],
              ["Recovery", "Ready", `${security.backupCodes} backup codes`]
            ].map(([label, value, detail]) => <div className="report-row" key={label} style={{ gridTemplateColumns: "1fr 1fr 1.5fr" }}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>)}
          </div>
        </section>
      </div>
      <div className="reports-side-stack">
        <section className="reports-panel compact">
          <div className="reports-panel-head"><div><span>Quick actions</span><h2>Account controls</h2></div></div>
          <div className="report-export-list">
            {["Profile", "Security", "Sessions", "Permissions", "Notifications", "Recovery"].map((tab) => <article key={tab}><div><strong>{tab}</strong><span>Open {tab.toLowerCase()} controls</span></div><button type="button" onClick={() => onTab(tab as AccountTab)}>Open</button></article>)}
          </div>
        </section>
        <section className="reports-panel compact">
          <div className="reports-panel-head"><div><span>Activity</span><h2>Recent account events</h2></div></div>
          <div className="report-export-list">
            {activity.slice(0, 3).map((item) => <article key={item.id}><div><strong>{item.event}</strong><span>{item.detail}</span></div><Badge label={item.status} /></article>)}
          </div>
        </section>
      </div>
    </section>
  );
}

function AccountProfileForm({ onSave, onVerifyEmail, onVerifyPhone, profile }: { onSave: (event: FormEvent<HTMLFormElement>) => void; onVerifyEmail: () => void; onVerifyPhone: () => void; profile: AdminAccountProfile }) {
  return (
    <form className="settings-panel" onSubmit={onSave}>
      <SettingsPanelHead eyebrow="Profile" title="Personal admin details" />
      <div className="settings-form-grid">
        <label><span>Full name</span><input name="fullName" defaultValue={profile.fullName} /></label>
        <label><span>Display name</span><input name="displayName" defaultValue={profile.displayName} /></label>
        <label><span>Email</span><input name="email" defaultValue={profile.email} /></label>
        <label><span>Phone</span><input name="phone" defaultValue={profile.phone} /></label>
        <label><span>Avatar initials/image</span><input name="avatar" defaultValue={profile.avatar} /></label>
        <label><span>Job title</span><input name="jobTitle" defaultValue={profile.jobTitle} /></label>
        <label><span>Department</span><input name="department" defaultValue={profile.department} /></label>
        <label><span>Assigned store/location</span><input name="store" defaultValue={profile.store} /></label>
        <label><span>Timezone</span><input name="timezone" defaultValue={profile.timezone} /></label>
        <label><span>Language</span><input name="language" defaultValue={profile.language} /></label>
        <label><span>Emergency contact</span><input name="emergencyContact" defaultValue={profile.emergencyContact} /></label>
        <label className="settings-wide"><span>Internal note</span><textarea name="internalNote" defaultValue={profile.internalNote} rows={4} /></label>
      </div>
      <div className="product-dialog-actions"><button type="button" onClick={onVerifyEmail}>{profile.emailVerified ? "Email verified" : "Verify email"}</button><button type="button" onClick={onVerifyPhone}>{profile.phoneVerified ? "Phone verified" : "Verify phone"}</button><button type="submit">Save profile</button></div>
    </form>
  );
}

function AccountSecurityForm({ onGenerateCodes, onRevokeDevices, onSave, security }: { onGenerateCodes: () => void; onRevokeDevices: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void; security: AdminAccountSecurity }) {
  return (
    <form className="settings-panel" onSubmit={onSave}>
      <SettingsPanelHead eyebrow="Security" title="Password, 2FA, trusted devices" />
      <div className="settings-form-grid">
        <label><span>Current password</span><input name="currentPassword" type="password" placeholder="Enter current password" /></label>
        <label><span>New password</span><input name="newPassword" type="password" placeholder="Optional new password" /></label>
        <label><span>Confirm password</span><input name="confirmPassword" type="password" placeholder="Confirm new password" /></label>
        <SettingToggle defaultChecked={security.twoFactorEnabled} label="2FA enabled" name="twoFactorEnabled" />
        <label><span>2FA method</span><select name="twoFactorMethod" defaultValue={security.twoFactorMethod}><option>Authenticator app</option><option>SMS</option><option>Email</option></select></label>
        <label><span>Lock status</span><select name="lockStatus" defaultValue={security.lockStatus}><option>Unlocked</option><option>Locked</option><option>Re-auth required</option></select></label>
        <SettingToggle defaultChecked={security.loginAlerts} label="Login alerts" name="loginAlerts" />
        <SettingToggle defaultChecked={security.reauthRequired} label="Require re-authentication" name="reauthRequired" />
        <SettingToggle defaultChecked={false} label="Generate backup codes on save" name="generateCodes" />
        <label><span>Password last changed</span><input value={security.passwordLastChanged} readOnly /></label>
        <label><span>Backup codes</span><input value={security.backupCodes} readOnly /></label>
        <label><span>Failed logins</span><input value={security.failedLogins} readOnly /></label>
        <label className="settings-wide"><span>Security note</span><textarea name="securityNote" defaultValue={security.securityNote} rows={4} /></label>
      </div>
      <div className="product-dialog-actions"><button type="button" onClick={onGenerateCodes}>Generate backup codes</button><button type="button" onClick={onRevokeDevices}>Revoke trusted devices</button><button type="submit">Save security</button></div>
    </form>
  );
}

function AccountSessionsPanel({ onLogout, onReauth, onTrust, onUntrust, sessions }: { onLogout: (item: AdminAccountSession) => void; onReauth: (item: AdminAccountSession) => void; onTrust: (item: AdminAccountSession) => void; onUntrust: (item: AdminAccountSession) => void; sessions: AdminAccountSession[] }) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head"><div><span>Sessions</span><h2>Active and trusted devices</h2></div></div>
      <div className="report-table">
        <div className="report-row report-row-head" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.5fr" }}><span>Session</span><span>Device</span><span>IP/location</span><span>2FA</span><span>Status</span><span>Actions</span></div>
        {sessions.map((item) => <div className="report-row" key={item.id} style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.5fr" }}><span><strong>{item.id}</strong><small>{item.loginTime}</small></span><span>{item.device}<small>{item.browser}</small></span><span>{item.ip}<small>{item.location}</small></span><span>{item.twoFactor}<small>{item.trusted ? "Trusted" : "Not trusted"}</small></span><span><Badge label={item.status} /></span><span className="report-actions"><button type="button" onClick={() => onLogout(item)}>Logout</button><button type="button" onClick={() => onTrust(item)}>Trust</button><button type="button" onClick={() => onUntrust(item)}>Untrust</button><button type="button" onClick={() => onReauth(item)}>Re-auth</button></span></div>)}
      </div>
    </section>
  );
}

function AccountPermissionsPanel({ onAction, permissions }: { onAction: (message: string) => void; permissions: AdminAccountPermission[] }) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head"><div><span>Permissions</span><h2>Access visibility</h2></div><button type="button" onClick={() => { window.location.href = "/staff"; }}>Open Staff module</button></div>
      <div className="report-table">
        <div className="report-row report-row-head" style={{ gridTemplateColumns: "1fr 1fr 2fr 1.2fr" }}><span>Module</span><span>Access</span><span>Details</span><span>Actions</span></div>
        {permissions.map((item) => <div className="report-row" key={item.id} style={{ gridTemplateColumns: "1fr 1fr 2fr 1.2fr" }}><span><strong>{item.module}</strong><small>{item.id}</small></span><span><Badge label={item.access} /></span><span>{item.detail}</span><span className="report-actions"><button type="button" onClick={() => onAction(`${item.module} permission detail opened.`)}>Details</button><button type="button" onClick={() => onAction(`Access request prepared for ${item.module}.`)}>Request access</button></span></div>)}
      </div>
    </section>
  );
}

function AccountNotificationsForm({ notifications, onSave, onSecurityOnly, onTest }: { notifications: AdminAccountNotificationPreference[]; onSave: (event: FormEvent<HTMLFormElement>) => void; onSecurityOnly: () => void; onTest: () => void }) {
  return (
    <form className="reports-panel" onSubmit={onSave}>
      <div className="reports-panel-head"><div><span>Notifications</span><h2>Admin alert preferences</h2></div></div>
      <div className="report-table">
        <div className="report-row report-row-head" style={{ gridTemplateColumns: "1.5fr repeat(5, 1fr)" }}><span>Alert</span><span>In-app</span><span>Email</span><span>SMS</span><span>WhatsApp</span><span>Muted</span></div>
        {notifications.map((item) => <div className="report-row" key={item.id} style={{ gridTemplateColumns: "1.5fr repeat(5, 1fr)" }}><span><strong>{item.label}</strong><small>{item.id}</small></span><span><input name={`${item.id}-inApp`} type="checkbox" defaultChecked={item.inApp} /></span><span><input name={`${item.id}-email`} type="checkbox" defaultChecked={item.email} /></span><span><input name={`${item.id}-sms`} type="checkbox" defaultChecked={item.sms} /></span><span><input name={`${item.id}-whatsapp`} type="checkbox" defaultChecked={item.whatsapp} /></span><span><input name={`${item.id}-muted`} type="checkbox" defaultChecked={item.muted} /></span></div>)}
      </div>
      <div className="product-dialog-actions"><button type="button" onClick={onTest}>Send test notification</button><button type="button" onClick={onSecurityOnly}>Security-only mode</button><button type="submit">Save preferences</button></div>
    </form>
  );
}

function AccountPreferencesForm({ onReset, onSave, preferences }: { onReset: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void; preferences: AdminAccountPreferences }) {
  return (
    <form className="settings-panel" onSubmit={onSave}>
      <SettingsPanelHead eyebrow="Preferences" title="Personal admin UI settings" />
      <div className="settings-form-grid">
        <label><span>Theme</span><select name="theme" defaultValue={preferences.theme}><option>System</option><option>Light</option><option>Dark</option></select></label>
        <SettingToggle defaultChecked={preferences.compactMode} label="Compact/dense mode" name="compactMode" />
        <label><span>Default landing page</span><input name="defaultLanding" defaultValue={preferences.defaultLanding} /></label>
        <label><span>Default module</span><input name="defaultModule" defaultValue={preferences.defaultModule} /></label>
        <label><span>Table row density</span><select name="rowDensity" defaultValue={preferences.rowDensity}><option>Comfortable</option><option>Compact</option><option>Dense</option></select></label>
        <label><span>Currency display</span><input name="currency" defaultValue={preferences.currency} /></label>
        <label><span>Date/time format</span><input name="dateFormat" defaultValue={preferences.dateFormat} /></label>
        <label><span>Language</span><input name="language" defaultValue={preferences.language} /></label>
        <label><span>Timezone</span><input name="timezone" defaultValue={preferences.timezone} /></label>
        <label className="settings-wide"><span>Sidebar pinned modules</span><input name="pinnedModules" defaultValue={preferences.pinnedModules} /></label>
        <label className="settings-wide"><span>Search behavior</span><input name="searchBehavior" defaultValue={preferences.searchBehavior} /></label>
      </div>
      <div className="product-dialog-actions"><button type="button" onClick={onReset}>Reset defaults</button><button type="submit">Save preferences</button></div>
    </form>
  );
}

function AccountActivityPanel({ activity, onOpenAudit, onReport, onReview }: { activity: AdminAccountActivity[]; onOpenAudit: () => void; onReport: (item: AdminAccountActivity) => void; onReview: (item: AdminAccountActivity) => void }) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head"><div><span>Activity</span><h2>Personal account activity</h2></div><button type="button" onClick={onOpenAudit}>Open audit logs</button></div>
      <div className="report-table">
        <div className="report-row report-row-head" style={{ gridTemplateColumns: "1fr 2fr 1fr 1fr 1.2fr" }}><span>Event</span><span>Detail</span><span>Risk</span><span>Status</span><span>Actions</span></div>
        {activity.map((item) => <div className="report-row" key={item.id} style={{ gridTemplateColumns: "1fr 2fr 1fr 1fr 1.2fr" }}><span><strong>{item.event}</strong><small>{item.id} · {item.time}</small></span><span>{item.detail}</span><span><Badge label={item.risk} /></span><span><Badge label={item.status} /></span><span className="report-actions"><button type="button" onClick={() => onReview(item)}>Review</button><button type="button" onClick={() => onReport(item)}>Report</button></span></div>)}
      </div>
    </section>
  );
}

function AccountRecoveryForm({ onSave, recovery }: { onSave: (event: FormEvent<HTMLFormElement>) => void; recovery: AdminAccountRecovery }) {
  return (
    <form className="settings-panel" onSubmit={onSave}>
      <SettingsPanelHead eyebrow="Recovery" title="Recovery email, phone, backup codes" />
      <div className="settings-form-grid">
        <label><span>Recovery email</span><input name="recoveryEmail" defaultValue={recovery.recoveryEmail} /></label>
        <label><span>Recovery phone</span><input name="recoveryPhone" defaultValue={recovery.recoveryPhone} /></label>
        <label><span>Backup codes status</span><input name="backupCodesStatus" defaultValue={recovery.backupCodesStatus} /></label>
        <label><span>Emergency owner contact</span><input name="emergencyOwner" defaultValue={recovery.emergencyOwner} /></label>
        <label><span>Last recovery update</span><input value={recovery.lastUpdated} readOnly /></label>
        <label><span>Recovery lock status</span><input value={recovery.lockStatus} readOnly /></label>
        <label className="settings-wide"><span>Recovery question / note</span><textarea name="recoveryQuestion" defaultValue={recovery.recoveryQuestion} rows={4} /></label>
        <SettingToggle defaultChecked={false} label="Regenerate backup codes" name="regenerateCodes" />
        <SettingToggle defaultChecked={recovery.lockStatus === "Locked for 24 hours"} label="Lock recovery changes for 24 hours" name="lockRecovery" />
      </div>
      <SettingsActions primary="Save recovery controls" />
    </form>
  );
}

function ExpansionModuleView({ moduleKey }: { moduleKey: ExpansionModuleKey }) {
  const config = expansionModules[moduleKey];
  const [activeTab, setActiveTab] = useState(config.tabs[0]);
  const [records, setRecords] = usePersistentState<ExpansionRecord[]>(`${moduleKey}:records`, config.records);
  const [settings, setSettings] = usePersistentState(`${moduleKey}:settings`, config.settings);
  const [selectedRecord, setSelectedRecord] = useState<ExpansionRecord>(config.records[0]);
  const [dialog, setDialog] = useState<"record" | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [notice, setNotice] = useState(`${config.title} module is ready.`);
  const filteredRecords = records.filter((record) => {
    const tabMatch = activeTab === "Overview" || record.tab === activeTab;
    const statusMatch = statusFilter === "All" || record.status === statusFilter || record.risk === statusFilter;
    const queryText = `${record.id} ${record.title} ${record.subtitle} ${record.category} ${record.owner} ${record.status} ${record.linkedRecord} ${record.note}`.toLowerCase();
    const queryMatch = query.trim() ? queryText.includes(query.toLowerCase().trim()) : true;
    return tabMatch && statusMatch && queryMatch;
  });
  const stats = [
    { label: "Records", value: records.length, detail: "Total module records" },
    { label: "Open", value: records.filter((item) => ["Open", "Pending", "Draft", "Failed", "Error"].includes(item.status)).length, detail: "Need admin action" },
    { label: "High risk", value: records.filter((item) => ["High", "Critical"].includes(item.risk)).length, detail: "Needs owner attention" },
    { label: "Active", value: records.filter((item) => ["Active", "Live", "Open", "Connected", "Healthy", "Reviewed"].includes(item.status)).length, detail: "Operational records" },
    { label: "Exports", value: records.filter((item) => item.status === "Exported").length, detail: "Prepared exports" },
    { label: "Updated", value: records.filter((item) => item.updated === "Just now").length, detail: "Changed this session" }
  ];

  function updateRecord(record: ExpansionRecord, message: string) {
    setRecords((items) => items.map((item) => (item.id === record.id ? record : item)));
    setSelectedRecord(record);
    setNotice(message);
  }

  function createRecord(command?: ExpansionCommand) {
    const targetTab = command?.targetTab || config.tabs[1] || "Overview";
    const created: ExpansionRecord = {
      ...records[0],
      id: `${moduleKey.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-5)}`,
      tab: targetTab,
      title: command?.recordTitle || config.createLabel,
      subtitle: "New editable production record",
      owner: "Owner",
      status: "Draft",
      risk: "Medium",
      primaryMetric: "New",
      secondaryMetric: "Complete details",
      linkedRecord: "New record",
      amount: "-",
      updated: "Just now",
      note: "Created from admin panel.",
      fields: records[0].fields.map((field) => ({ ...field, value: "" }))
    };
    setRecords((items) => [created, ...items]);
    setSelectedRecord(created);
    setActiveTab(targetTab);
    setDialog("record");
    setNotice(`${created.id} created.`);
  }

  function exportRecord(command: ExpansionCommand) {
    const targetTab = command.targetTab || config.tabs[config.tabs.length - 2] || config.tabs[1] || "Overview";
    const exported: ExpansionRecord = {
      ...records[0],
      id: `${moduleKey.toUpperCase().slice(0, 3)}-EXP-${Date.now().toString().slice(-4)}`,
      tab: targetTab,
      title: command.recordTitle || `${config.title} export`,
      subtitle: "Generated from admin panel",
      category: "Export",
      owner: "Owner",
      status: "Exported",
      risk: "Low",
      primaryMetric: `${filteredRecords.length} records`,
      secondaryMetric: "Ready for download",
      linkedRecord: config.route,
      amount: "CSV + audit log",
      updated: "Just now",
      note: `${command.label} generated for ${config.title}.`,
      fields: [
        { label: "Export scope", value: activeTab },
        { label: "Filtered records", value: String(filteredRecords.length) },
        { label: "Generated by", value: "Owner" }
      ]
    };
    setRecords((items) => [exported, ...items]);
    setSelectedRecord(exported);
    setActiveTab(targetTab);
    setDialog("record");
    setNotice(`${command.label} generated as ${exported.id}.`);
  }

  function runCommand(command: ExpansionCommand) {
    if (command.type === "create") {
      createRecord(command);
      return;
    }
    if (command.type === "export") {
      exportRecord(command);
      return;
    }
    const targetTab = command.targetTab || config.tabs[0];
    setActiveTab(targetTab);
    setNotice(`${command.label} opened.`);
  }

  function runAction(action: string, record: ExpansionRecord) {
    const normalized = action.toLowerCase();
    const nextStatus =
      normalized.includes("approve") ? "Approved" :
      normalized.includes("reject") ? "Rejected" :
      normalized.includes("hide") ? "Hidden" :
      normalized.includes("feature") ? "Featured" :
      normalized.includes("reply") ? "Replied" :
      normalized.includes("escalate") ? "Escalated" :
      normalized.includes("credit") ? "Credited" :
      normalized.includes("debit") ? "Debited" :
      normalized.includes("hold") ? "On hold" :
      normalized.includes("release") ? "Released" :
      normalized.includes("upgrade") ? "Upgraded" :
      normalized.includes("open") || normalized.includes("connect") ? "Open" :
      normalized.includes("close") || normalized.includes("disable") ? "Disabled" :
      normalized.includes("pause") ? "Paused" :
      normalized.includes("assign") ? "Assigned" :
      normalized.includes("transfer") ? "Transfer requested" :
      normalized.includes("test") ? "Testing" :
      normalized.includes("rotate") ? "Key rotated" :
      normalized.includes("retry") || normalized.includes("re-run") ? "Retrying" :
      normalized.includes("resolve") ? "Resolved" :
      normalized.includes("backup") ? "Backup triggered" :
      normalized.includes("publish") ? "Published" :
      normalized.includes("archive") ? "Archived" :
      normalized.includes("process") ? "Processing" :
      normalized.includes("export") ? "Exported" :
      normalized.includes("review") ? "Reviewed" :
      record.status;
    updateRecord({ ...record, status: nextStatus, updated: "Just now", note: `${action} action completed from admin panel.` }, `${record.id}: ${action} completed.`);
  }

  function saveRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updated: ExpansionRecord = {
      ...selectedRecord,
      tab: String(formData.get("tab") || selectedRecord.tab),
      title: String(formData.get("title") || selectedRecord.title).trim(),
      subtitle: String(formData.get("subtitle") || selectedRecord.subtitle).trim(),
      category: String(formData.get("category") || selectedRecord.category).trim(),
      owner: String(formData.get("owner") || selectedRecord.owner).trim(),
      status: String(formData.get("status") || selectedRecord.status).trim(),
      risk: String(formData.get("risk") || selectedRecord.risk) as AuditRiskLevel,
      primaryMetric: String(formData.get("primaryMetric") || selectedRecord.primaryMetric).trim(),
      secondaryMetric: String(formData.get("secondaryMetric") || selectedRecord.secondaryMetric).trim(),
      linkedRecord: String(formData.get("linkedRecord") || selectedRecord.linkedRecord).trim(),
      amount: String(formData.get("amount") || selectedRecord.amount).trim(),
      updated: "Just now",
      note: String(formData.get("note") || selectedRecord.note).trim(),
      fields: selectedRecord.fields.map((field, index) => ({ ...field, value: String(formData.get(`field-${index}`) || field.value).trim() }))
    };
    updateRecord(updated, `${updated.id} saved.`);
    setDialog(null);
  }

  function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSettings(settings.map((setting, index) => ({ ...setting, value: String(formData.get(`setting-${index}`) || setting.value).trim() })));
    setNotice(`${config.title} settings saved.`);
  }

  return (
    <>
      {notice ? <div className="admin-notice">{notice}</div> : null}
      <section className="reports-command">
        <div>
          <span>{config.eyebrow}</span>
          <h2>{config.title}</h2>
          <p>{config.description}</p>
          <div className="reports-tabs">
            {config.tabs.map((tab) => <button className={activeTab === tab ? "active" : ""} key={tab} type="button" onClick={() => { setActiveTab(tab); setNotice(`${tab} opened.`); }}>{tab}</button>)}
          </div>
        </div>
        <div className="reports-command-actions">
          {config.commands.map((command, index) => <button className={index === 0 ? "primary-action" : ""} key={command.label} type="button" onClick={() => runCommand(command)}>{command.label}</button>)}
          <button type="button" onClick={() => { setActiveTab(config.tabs[config.tabs.length - 1]); setNotice(`${config.title} settings opened.`); }}>Settings</button>
        </div>
      </section>

      <section className="reports-stat-grid">
        {stats.map((stat) => <button key={stat.label} type="button" onClick={() => setNotice(`${stat.label}: ${stat.value} - ${stat.detail}`)}><div><span>{stat.label}</span><small>{stat.detail}</small></div><strong>{stat.value}</strong></button>)}
      </section>

      <section className="reports-panel compact">
        <div className="settings-form-grid">
          <label><span>Search {config.title}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ID, customer, product, provider, branch, policy" /></label>
          <label><span>Status / risk</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All</option><option>Pending</option><option>Active</option><option>Open</option><option>Approved</option><option>Rejected</option><option>High</option><option>Critical</option><option>Failed</option><option>Error</option><option>Draft</option></select></label>
        </div>
      </section>

      {activeTab === config.tabs[config.tabs.length - 1] ? (
        <form className="settings-panel" onSubmit={saveSettings}>
          <SettingsPanelHead eyebrow={config.eyebrow} title={`${config.title} settings`} />
          <div className="settings-form-grid">
            {settings.map((setting, index) => <label key={setting.label}><span>{setting.label}</span><input name={`setting-${index}`} defaultValue={setting.value} /></label>)}
          </div>
          <SettingsActions primary="Save settings" />
        </form>
      ) : (
        <ExpansionRecordsPanel actions={config.actions} records={filteredRecords} title={activeTab === "Overview" ? `${config.title} overview` : `${activeTab} manager`} onAction={runAction} onOpen={(record) => { setSelectedRecord(record); setDialog("record"); }} />
      )}

      {dialog === "record" ? <ExpansionRecordDialog config={config} item={selectedRecord} onClose={() => setDialog(null)} onSave={saveRecord} /> : null}
    </>
  );
}

function ExpansionRecordsPanel({ actions, onAction, onOpen, records, title }: { actions: string[]; onAction: (action: string, record: ExpansionRecord) => void; onOpen: (record: ExpansionRecord) => void; records: ExpansionRecord[]; title: string }) {
  return (
    <section className="reports-panel">
      <div className="reports-panel-head"><div><span>Records</span><h2>{title}</h2></div></div>
      <div className="report-table">
        <div className="report-row report-row-head" style={{ gridTemplateColumns: "1.1fr 1fr 1fr 1fr 1fr 1.8fr" }}><span>Record</span><span>Category</span><span>Status</span><span>Metric</span><span>Owner</span><span>Actions</span></div>
        {records.map((record) => (
          <div className="report-row" key={record.id} style={{ gridTemplateColumns: "1.1fr 1fr 1fr 1fr 1fr 1.8fr" }}>
            <span><strong>{record.title}</strong><small>{record.id} · {record.subtitle}</small></span>
            <span>{record.category}<small>{record.linkedRecord}</small></span>
            <span><Badge label={record.status} /><small>{record.risk} risk</small></span>
            <span>{record.primaryMetric}<small>{record.secondaryMetric}</small></span>
            <span>{record.owner}<small>{record.updated}</small></span>
            <span className="report-actions">
              <button type="button" onClick={() => onOpen(record)}>Open</button>
              {actions.slice(0, 5).map((action) => <button key={action} type="button" onClick={() => onAction(action, record)}>{action}</button>)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExpansionRecordDialog({ config, item, onClose, onSave }: { config: ExpansionModuleConfig; item: ExpansionRecord; onClose: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog supplier-dialog" onSubmit={onSave}>
        <div className="product-dialog-head"><div><span>{item.id}</span><h3>{config.title} record</h3></div><button type="button" onClick={onClose}>Close</button></div>
        <div className="settings-form-grid">
          <label><span>Tab</span><select name="tab" defaultValue={item.tab}>{config.tabs.filter((tab) => tab !== "Overview").map((tab) => <option key={tab}>{tab}</option>)}</select></label>
          <label><span>Status</span><input name="status" defaultValue={item.status} /></label>
          <label><span>Title</span><input name="title" defaultValue={item.title} /></label>
          <label><span>Subtitle</span><input name="subtitle" defaultValue={item.subtitle} /></label>
          <label><span>Category</span><input name="category" defaultValue={item.category} /></label>
          <label><span>Owner</span><input name="owner" defaultValue={item.owner} /></label>
          <label><span>Risk</span><select name="risk" defaultValue={item.risk}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label>
          <label><span>Primary metric</span><input name="primaryMetric" defaultValue={item.primaryMetric} /></label>
          <label><span>Secondary metric</span><input name="secondaryMetric" defaultValue={item.secondaryMetric} /></label>
          <label><span>Linked record</span><input name="linkedRecord" defaultValue={item.linkedRecord} /></label>
          <label><span>Amount / value</span><input name="amount" defaultValue={item.amount} /></label>
          {item.fields.map((field, index) => <label key={field.label}><span>{field.label}</span><input name={`field-${index}`} defaultValue={field.value} /></label>)}
          <label className="settings-wide"><span>Note</span><textarea name="note" defaultValue={item.note} rows={4} /></label>
        </div>
        <div className="product-dialog-actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit">Save record</button></div>
      </form>
    </div>
  );
}

function CouponManager({
  activeFilter,
  coupons,
  onDuplicate,
  onFilterChange,
  onPause,
  onSelect,
  onUsage
}: {
  activeFilter: CouponFilter;
  coupons: AdminCoupon[];
  onDuplicate: (coupon: AdminCoupon) => void;
  onFilterChange: (filter: CouponFilter) => void;
  onPause: (coupon: AdminCoupon) => void;
  onSelect: (coupon: AdminCoupon) => void;
  onUsage: (coupon: AdminCoupon) => void;
}) {
  const filters: CouponFilter[] = ["All", "Active", "Scheduled", "Paused", "Expired"];

  return (
    <section className="coupon-manager">
      <div className="coupon-manager-head">
        <div>
          <span>Coupon table</span>
          <h2>Campaign coupons</h2>
        </div>
        <div className="coupon-filter-tabs">
          {filters.map((filter) => (
            <button className={activeFilter === filter ? "active" : ""} key={filter} type="button" onClick={() => onFilterChange(filter)}>
              {filter}
            </button>
          ))}
        </div>
      </div>
      <div className="coupon-list">
        {coupons.map((coupon) => (
          <article key={coupon.code}>
            <button className="coupon-main" type="button" onClick={() => onSelect(coupon)}>
              <span>{coupon.code}</span>
              <div>
                <strong>{coupon.campaign}</strong>
                <small>{coupon.segment} · {coupon.valid}</small>
              </div>
            </button>
            <div className="coupon-metrics">
              <div>
                <span>Discount</span>
                <strong>{coupon.value}</strong>
              </div>
              <div>
                <span>Min cart</span>
                <strong>{coupon.minCart}</strong>
              </div>
              <div>
                <span>Usage</span>
                <strong>{coupon.usage}/{coupon.limit}</strong>
              </div>
              <div>
                <span>Revenue</span>
                <strong>{coupon.revenue}</strong>
              </div>
              <Badge label={coupon.status} />
            </div>
            <div className="coupon-actions">
              <button type="button" onClick={() => onUsage(coupon)}>Usage</button>
              <button type="button" onClick={() => onPause(coupon)}>{coupon.status === "Paused" ? "Activate" : "Pause"}</button>
              <button type="button" onClick={() => onDuplicate(coupon)}>Duplicate</button>
            </div>
          </article>
        ))}
        {coupons.length === 0 ? <div className="coupon-empty">No coupons match this filter.</div> : null}
      </div>
    </section>
  );
}

function BannerManager({ banners, onEdit, onToggle }: { banners: PromotionBanner[]; onEdit: (banner: PromotionBanner) => void; onToggle: (banner: PromotionBanner) => void }) {
  return (
    <section className="marketing-panel">
      <div className="marketing-panel-head">
        <div>
          <span>Banner manager</span>
          <h2>Storefront placements</h2>
        </div>
      </div>
      <div className="banner-list">
        {banners.map((banner) => (
          <article key={banner.title}>
            <span className={isImageSource(banner.image) ? "product-thumb has-image" : "product-thumb"}>
              {isImageSource(banner.image) ? <img alt={banner.title} src={banner.image} /> : banner.title.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <strong>{banner.title}</strong>
              <span>{banner.placement} · {banner.audience}</span>
            </div>
            <Badge label={banner.status} />
            <div className="banner-actions">
              <button type="button" onClick={() => onEdit(banner)}>Edit</button>
              <button type="button" onClick={() => onToggle(banner)}>{banner.status === "Paused" ? "Go live" : "Pause"}</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CampaignCalendar({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="marketing-panel">
      <div className="marketing-panel-head">
        <div>
          <span>Calendar</span>
          <h2>Upcoming campaigns</h2>
        </div>
        <button type="button" onClick={onCreate}>Schedule</button>
      </div>
      <div className="campaign-calendar">
        <article><strong>Weekend fresh sale</strong><span>Sep 20 · Fresh produce</span></article>
        <article><strong>Payday basket</strong><span>Sep 30 · High cart value</span></article>
        <article><strong>Festival pantry</strong><span>Oct 04 · Staples and snacks</span></article>
      </div>
    </section>
  );
}

function RiskPanel({ coupons, onReview }: { coupons: AdminCoupon[]; onReview: (coupon: AdminCoupon) => void }) {
  const watchedCoupons = coupons.filter((coupon) => coupon.risk !== "Healthy");

  return (
    <section className="marketing-panel">
      <div className="marketing-panel-head">
        <div>
          <span>Abuse watch</span>
          <h2>Risk signals</h2>
        </div>
      </div>
      <div className="risk-list">
        {watchedCoupons.map((coupon) => (
          <article key={coupon.code}>
            <div>
              <strong>{coupon.code}</strong>
              <span>{coupon.risk}</span>
            </div>
            <button type="button" onClick={() => onReview(coupon)}>Review</button>
          </article>
        ))}
        {watchedCoupons.length === 0 ? <p>No coupon risk signals right now.</p> : null}
      </div>
    </section>
  );
}

function CouponDialogModal({
  banner,
  coupon,
  dialog,
  onClose,
  onCreateCoupon,
  onPauseCoupon,
  onSaveBanner,
  onSaveCoupon,
  onToggleBanner
}: {
  banner: PromotionBanner;
  coupon: AdminCoupon;
  dialog: Exclude<CouponDialog, null>;
  onClose: () => void;
  onCreateCoupon: (event: FormEvent<HTMLFormElement>) => void;
  onPauseCoupon: () => void;
  onSaveBanner: (event: FormEvent<HTMLFormElement>) => void;
  onSaveCoupon: (event: FormEvent<HTMLFormElement>) => void;
  onToggleBanner: () => void;
}) {
  const title = dialog === "create" ? "Create coupon" : dialog === "usage" ? "Coupon usage" : dialog === "risk" ? "Risk review" : "Promotion banner";

  return (
    <div className="product-dialog-backdrop">
      <div className="product-dialog coupon-dialog">
        <div className="product-dialog-head">
          <div>
            <span>{dialog === "banner" ? banner.placement : coupon.code}</span>
            <h3>{title}</h3>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        {dialog === "create" ? (
          <form onSubmit={onCreateCoupon}>
            <div className="coupon-form-grid">
              <label><span>Coupon code</span><input name="code" defaultValue={`NEW${Date.now().toString().slice(-3)}`} /></label>
              <label><span>Campaign name</span><input name="campaign" defaultValue="New grocery campaign" /></label>
              <label><span>Discount type</span><select name="type" defaultValue="Percent"><option>Percent</option><option>Flat</option><option>Free delivery</option></select></label>
              <label><span>Discount value</span><input name="value" defaultValue="10%" /></label>
              <label><span>Minimum cart</span><input name="minCart" defaultValue="Rs. 499" /></label>
              <label><span>Max discount</span><input name="maxDiscount" defaultValue="Rs. 120" /></label>
              <label><span>Usage limit</span><input name="limit" inputMode="numeric" defaultValue="500" /></label>
              <label><span>Valid dates</span><input name="valid" defaultValue="Draft schedule" /></label>
              <label><span>Customer segment</span><select name="segment" defaultValue="New customers"><option>New customers</option><option>Repeat buyers</option><option>VIP customers</option><option>COD users</option><option>High cart value</option><option>Dairy buyers</option></select></label>
              <label><span>Status</span><select name="status" defaultValue="Scheduled"><option>Active</option><option>Scheduled</option><option>Paused</option><option>Expired</option></select></label>
            </div>
            <div className="product-dialog-actions">
              <button type="button" onClick={onClose}>Cancel</button>
              <button type="submit">Create scheduled coupon</button>
            </div>
          </form>
        ) : dialog === "banner" ? (
          <form onSubmit={onSaveBanner}>
            <div className="coupon-form-grid">
              <label><span>Title</span><input name="title" defaultValue={banner.title} /></label>
              <label><span>Placement</span><input name="placement" defaultValue={banner.placement} /></label>
              <label><span>Audience</span><input name="audience" defaultValue={banner.audience} /></label>
              <label><span>CTA text</span><input name="cta" defaultValue={banner.cta} /></label>
              <label><span>Target URL</span><input name="target" defaultValue={banner.target} /></label>
              <label><span>Priority</span><input name="priority" inputMode="numeric" defaultValue={banner.priority} /></label>
              <label><span>Status</span><select name="status" defaultValue={banner.status}><option>Live</option><option>Scheduled</option><option>Paused</option></select></label>
              <label className="settings-wide"><span>Banner image URL</span><input name="image" defaultValue={banner.image || ""} placeholder="Upload below or paste https://..." /></label>
              <label className="settings-wide">
                <span>Upload banner image</span>
                <input
                  accept="image/*"
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    const input = event.currentTarget.form?.elements.namedItem("image");
                    if (!file || !(input instanceof HTMLInputElement)) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === "string") input.value = reader.result;
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                <small>{banner.image ? `Current: ${productImageLabel(banner.image)}` : "Upload a storefront banner image; the API stores it as served media."}</small>
              </label>
            </div>
            <div className="product-dialog-actions">
              <button type="button" onClick={onClose}>Cancel</button>
              <button type="button" onClick={onToggleBanner}>{banner.status === "Paused" ? "Go live" : "Pause banner"}</button>
              <button type="submit">Save banner</button>
            </div>
          </form>
        ) : (
          <form onSubmit={onSaveCoupon}>
            <div className="coupon-dialog-body">
              <div className="coupon-form-grid">
                <label><span>Campaign</span><input name="campaign" defaultValue={coupon.campaign} /></label>
                <label><span>Segment</span><input name="segment" defaultValue={coupon.segment} /></label>
                <label><span>Discount type</span><select name="type" defaultValue={coupon.type}><option>Percent</option><option>Flat</option><option>Free delivery</option></select></label>
                <label><span>Discount value</span><input name="value" defaultValue={coupon.value} /></label>
                <label><span>Minimum cart</span><input name="minCart" defaultValue={coupon.minCart} /></label>
                <label><span>Max discount</span><input name="maxDiscount" defaultValue={coupon.maxDiscount} /></label>
                <label><span>Usage count</span><input name="usage" inputMode="numeric" defaultValue={coupon.usage} /></label>
                <label><span>Usage limit</span><input name="limit" inputMode="numeric" defaultValue={coupon.limit} /></label>
                <label><span>Revenue</span><input name="revenue" defaultValue={coupon.revenue} /></label>
                <label><span>Valid dates</span><input name="valid" defaultValue={coupon.valid} /></label>
                <label><span>Risk note</span><input name="risk" defaultValue={coupon.risk} /></label>
                <label><span>Status</span><select name="status" defaultValue={coupon.status}><option>Active</option><option>Scheduled</option><option>Paused</option><option>Expired</option></select></label>
                <label className="settings-wide"><span>Review note</span><input name="reviewNote" defaultValue={dialog === "risk" ? "Risk reviewed by admin." : "Usage audit completed."} /></label>
              </div>
            </div>
            <div className="product-dialog-actions">
              <button type="button" onClick={onClose}>Cancel</button>
              {dialog === "risk" ? (
                <button type="button" onClick={onPauseCoupon}>{coupon.status === "Paused" ? "Activate coupon" : "Pause coupon"}</button>
              ) : null}
              <button type="submit">Save review</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function NotificationsView() {
  const [activeTab, setActiveTab] = useState<NotificationTab>("Overview");
  const [notifications, setNotifications] = usePersistentState<AdminNotification[]>("notifications:items", initialNotifications);
  const [failures, setFailures] = usePersistentState<NotificationFailure[]>("notifications:failures", initialFailures);
  const [automationRules, setAutomationRules] = usePersistentState<AutomationRule[]>("notifications:automation-rules", initialAutomationRules);
  const [channelFilter, setChannelFilter] = useState<"All" | NotificationChannel>("All");
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [editingNotification, setEditingNotification] = useState<AdminNotification | null>(null);
  const [reportNotification, setReportNotification] = useState<AdminNotification | null>(null);
  const [composerVersion, setComposerVersion] = useState(0);
  const [notice, setNotice] = useState("Notification command center is ready.");

  const scheduledNotifications = notifications.filter((item) => ["Draft", "Scheduled", "Sending", "Paused"].includes(item.status));
  const historyNotifications = notifications.filter((item) => ["Sent", "Failed"].includes(item.status));
  const filteredHistory = channelFilter === "All" ? historyNotifications : historyNotifications.filter((item) => item.channel === channelFilter);
  const sentToday = notifications.filter((item) => item.status === "Sent").reduce((total, item) => total + item.recipients, 0);
  const sentNotifications = notifications.filter((item) => item.status === "Sent");
  const openRates = sentNotifications
    .map((item) => Number.parseFloat(item.openRate.replace("%", "")))
    .filter((value) => Number.isFinite(value));
  const averageOpenRate = openRates.length ? `${Math.round(openRates.reduce((total, value) => total + value, 0) / openRates.length)}%` : "-";

  const overviewStats = [
    { label: "Sent today", value: sentToday.toLocaleString("en-IN"), detail: "Across customer channels" },
    { label: "Failed", value: failures.filter((item) => item.status !== "Resolved").length, detail: "Needs admin attention" },
    { label: "Scheduled", value: notifications.filter((item) => item.status === "Scheduled").length, detail: "Upcoming campaigns" },
    { label: "Avg open rate", value: averageOpenRate, detail: "From sent notifications" }
  ];

  const notificationChannels: NotificationChannel[] = ["WhatsApp", "SMS", "Email", "Push", "In-app"];
  const channelStats: Array<{ channel: NotificationChannel; sent: string; health: string; detail: string }> = notificationChannels.map((channel) => {
    const channelNotifications = notifications.filter((item) => item.channel === channel);
    const channelFailures = failures.filter((item) => item.channel === channel && item.status !== "Resolved").length;
    const sent = channelNotifications.filter((item) => item.status === "Sent").reduce((total, item) => total + item.recipients, 0);
    const scheduled = channelNotifications.filter((item) => item.status === "Scheduled").length;
    return {
      channel,
      sent: sent.toLocaleString("en-IN"),
      health: channelFailures ? `${channelFailures} open failures` : "No open failures",
      detail: `${scheduled} scheduled jobs`
    };
  });

  function saveNotification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const sendMode = String(formData.get("sendMode") || "Schedule");
    const status: NotificationStatus =
      sendMode === "Send now" ? "Sent" : sendMode === "Save draft" ? "Draft" : sendMode === "Send test" ? "Sending" : "Scheduled";
    const saved: AdminNotification = {
      id: editingNotification?.id || `NT-${1052 + notifications.length}`,
      title: String(formData.get("title") || "New notification").trim(),
      message: String(formData.get("message") || "FreshCart update").trim(),
      channel: String(formData.get("channel") || "WhatsApp") as NotificationChannel,
      audience: String(formData.get("audience") || "All customers").trim(),
      status,
      schedule: String(formData.get("schedule") || (status === "Sent" ? "Just now" : "Draft schedule")).trim(),
      recipients: Number(formData.get("recipients")) || 100,
      openRate: status === "Sent" ? "Pending" : editingNotification?.openRate || "-",
      clickRate: status === "Sent" ? "Pending" : editingNotification?.clickRate || "-",
      owner: editingNotification?.owner || "Owner",
      target: String(formData.get("target") || "/").trim(),
      priority: String(formData.get("priority") || "Normal") as AdminNotification["priority"]
    };

    setNotifications((items) =>
      editingNotification
        ? items.map((item) => (item.id === editingNotification.id ? saved : item))
        : [saved, ...items]
    );
    setSelectedTemplate(null);
    setEditingNotification(null);
    setComposerVersion((version) => version + 1);
    setActiveTab(status === "Sent" ? "History" : "Scheduled");
    const actionText = status === "Sent" ? "sent" : status === "Draft" ? "saved as draft" : "scheduled";
    setNotice(sendMode === "Send test" ? `${saved.channel} test notification queued.` : `${saved.title} ${editingNotification ? `updated and ${actionText}` : actionText}.`);
    event.currentTarget.reset();
  }

  function startCreateCampaign() {
    setEditingNotification(null);
    setSelectedTemplate(null);
    setComposerVersion((version) => version + 1);
    setActiveTab("Create");
    setNotice("Fresh notification composer opened.");
  }

  function useTemplate(template: NotificationTemplate) {
    setSelectedTemplate(template);
    setEditingNotification(null);
    setComposerVersion((version) => version + 1);
    setActiveTab("Create");
    setNotice(`${template.name} template loaded in composer.`);
  }

  function clearComposer() {
    setSelectedTemplate(null);
    setEditingNotification(null);
    setComposerVersion((version) => version + 1);
    setNotice("Notification composer cleared.");
  }

  function editNotification(notification: AdminNotification) {
    setEditingNotification(notification);
    setSelectedTemplate(null);
    setComposerVersion((version) => version + 1);
    setActiveTab("Create");
    setNotice(`${notification.title} loaded for editing.`);
  }

  function updateNotificationStatus(notification: AdminNotification, status: NotificationStatus) {
    if (status === "Sent") {
      setNotice(`${notification.title} is being sent through the local notification provider.`);
      void adminApi<{ result?: { status?: string; error?: string }; notifications: AdminNotification[]; failures: NotificationFailure[] }>(`notifications/${notification.id}/send`, {
        method: "POST",
        body: JSON.stringify({})
      })
        .then((data) => {
          setNotifications(data.notifications);
          setFailures(data.failures);
          setReportNotification((item) => data.notifications.find((notificationItem) => notificationItem.id === item?.id) || null);
          setActiveTab(data.result?.status === "FAILED" ? "History" : "History");
          setNotice(data.result?.status === "FAILED" ? data.result.error || "Notification failed." : `${notification.title} sent and delivery attempt saved.`);
        })
        .catch((error: Error) => setNotice(error.message));
      return;
    }
    const updatedNotification = {
      ...notification,
      status,
      schedule: notification.schedule,
      openRate: notification.openRate,
      clickRate: notification.clickRate
    };
    setNotifications((items) => items.map((item) => (item.id === notification.id ? updatedNotification : item)));
    setReportNotification((item) => (item?.id === notification.id ? updatedNotification : item));
    setNotice(`${notification.title} moved to ${status}.`);
  }

  function processQueuedNotifications() {
    setNotice("Processing queued notifications through the local provider.");
    void adminApi<{ processed: number; sent: number; failed: number; notifications: AdminNotification[]; failures: NotificationFailure[] }>("notifications/process", {
      method: "POST",
      body: JSON.stringify({ limit: 50 })
    })
      .then((data) => {
        setNotifications(data.notifications);
        setFailures(data.failures);
        setActiveTab("History");
        setNotice(`Processed ${data.processed} notification jobs: ${data.sent} sent, ${data.failed} failed.`);
      })
      .catch((error: Error) => setNotice(error.message));
  }

  function saveNotificationReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reportNotification) return;
    const formData = new FormData(event.currentTarget);
    const updatedNotification: AdminNotification = {
      ...reportNotification,
      audience: String(formData.get("audience") || reportNotification.audience).trim(),
      recipients: Number(formData.get("recipients") || reportNotification.recipients),
      status: String(formData.get("status") || reportNotification.status) as NotificationStatus,
      schedule: String(formData.get("schedule") || reportNotification.schedule).trim(),
      openRate: String(formData.get("openRate") || reportNotification.openRate).trim(),
      clickRate: String(formData.get("clickRate") || reportNotification.clickRate).trim(),
      priority: String(formData.get("priority") || reportNotification.priority) as AdminNotification["priority"],
      target: String(formData.get("target") || reportNotification.target).trim()
    };
    setNotifications((items) => items.map((item) => (item.id === updatedNotification.id ? updatedNotification : item)));
    setReportNotification(null);
    setNotice(`${updatedNotification.title} delivery report saved.`);
  }

  function cancelNotification(notification: AdminNotification) {
    setNotifications((items) => items.filter((item) => item.id !== notification.id));
    setEditingNotification((item) => (item?.id === notification.id ? null : item));
    setReportNotification((item) => (item?.id === notification.id ? null : item));
    setNotice(`${notification.title} was cancelled.`);
  }

  function retryFailure(failure: NotificationFailure) {
    setFailures((items) => items.map((item) => (item.id === failure.id ? { ...item, status: "Retried" } : item)));
    setNotice(`${failure.channel} retry queued for ${failure.customer}.`);
  }

  function resolveFailure(failure: NotificationFailure) {
    setFailures((items) => items.map((item) => (item.id === failure.id ? { ...item, status: "Resolved" } : item)));
    setNotice(`${failure.id} marked resolved.`);
  }

  function switchFailureChannel(failure: NotificationFailure) {
    const nextChannel: NotificationChannel = failure.channel === "SMS" ? "WhatsApp" : failure.channel === "WhatsApp" ? "SMS" : "Push";
    setFailures((items) => items.map((item) => (item.id === failure.id ? { ...item, channel: nextChannel, status: "Retried" } : item)));
    setNotice(`${failure.customer} switched to ${nextChannel}.`);
  }

  function toggleRule(rule: AutomationRule) {
    setAutomationRules((items) => items.map((item) => (item.name === rule.name ? { ...item, active: !item.active } : item)));
    setNotice(`${rule.name} automation ${rule.active ? "paused" : "activated"}.`);
  }

  function runRule(rule: AutomationRule) {
    setAutomationRules((items) => items.map((item) => (item.name === rule.name ? { ...item, lastRun: "Just now" } : item)));
    setNotice(`${rule.name} automation test run queued.`);
  }

  return (
    <>
      {notice ? <div className="admin-notice">{notice}</div> : null}
      <section className="notification-command">
        <div>
          <span>Communication control</span>
          <h2>Notification command center</h2>
          <p>Send customer campaigns, manage WhatsApp/SMS/email/push delivery, handle failures, and control automated store alerts from one focused workspace.</p>
          <div className="notification-tabs">
            {(["Overview", "Create", "Scheduled", "History"] as NotificationTab[]).map((tab) => (
              <button className={activeTab === tab ? "active" : ""} key={tab} type="button" onClick={() => setActiveTab(tab)}>
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="notification-command-actions">
          <button className="primary-action" type="button" onClick={startCreateCampaign}>Create campaign</button>
          <button type="button" onClick={processQueuedNotifications}>Process queued</button>
          <button type="button" onClick={() => { setFailures((items) => items.map((item) => ({ ...item, status: item.status === "Resolved" ? item.status : "Retried" }))); setNotice("All open notification failures were queued for retry."); }}>Retry failed</button>
          <button type="button" onClick={() => setActiveTab("Scheduled")}>View scheduled</button>
          <button type="button" onClick={() => { setActiveTab("Create"); setNotice("Template library is ready beside the composer."); }}>Open templates</button>
        </div>
      </section>

      <section className="notification-stat-grid">
        {overviewStats.map((stat) => (
          <article key={stat.label}>
            <div>
              <span>{stat.label}</span>
              <small>{stat.detail}</small>
            </div>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>

      {activeTab === "Overview" ? (
        <section className="notification-layout">
          <div className="notification-main-stack">
            <ChannelOverview cards={channelStats} onFilter={(channel) => { setChannelFilter(channel); setActiveTab("History"); }} />
            <AutomationRules rules={automationRules} onRun={runRule} onToggle={toggleRule} />
          </div>
          <div className="notification-side-stack">
            <FailedDeliveryPanel failures={failures} onResolve={resolveFailure} onRetry={retryFailure} onSwitch={switchFailureChannel} />
            <TemplateLibrary templates={notificationTemplates} onUse={useTemplate} compact />
          </div>
        </section>
      ) : null}

      {activeTab === "Create" ? (
        <section className="notification-layout create-layout">
          <NotificationComposer
            editingNotification={editingNotification}
            key={`${editingNotification?.id || selectedTemplate?.name || "blank-template"}-${composerVersion}`}
            selectedTemplate={selectedTemplate}
            onClear={clearComposer}
            onSubmit={saveNotification}
          />
          <div className="notification-side-stack">
            <TemplateLibrary templates={notificationTemplates} onUse={useTemplate} />
            <AudiencePanel />
          </div>
        </section>
      ) : null}

      {activeTab === "Scheduled" ? (
        <ScheduledNotifications
          items={scheduledNotifications}
          onCancel={cancelNotification}
          onEdit={editNotification}
          onPause={(item) => updateNotificationStatus(item, item.status === "Paused" ? "Scheduled" : "Paused")}
          onSend={(item) => updateNotificationStatus(item, "Sent")}
        />
      ) : null}

      {activeTab === "History" ? (
        <NotificationHistory
          activeChannel={channelFilter}
          items={filteredHistory}
          onFilter={setChannelFilter}
          onOpen={(item) => { setReportNotification(item); setNotice(`${item.title} delivery report opened.`); }}
          onRetry={(item) => updateNotificationStatus(item, "Sending")}
        />
      ) : null}
      {reportNotification ? (
        <NotificationReportModal
          notification={reportNotification}
          onClose={() => setReportNotification(null)}
          onRetry={() => updateNotificationStatus(reportNotification, "Sending")}
          onSave={saveNotificationReport}
          onSend={() => updateNotificationStatus(reportNotification, "Sent")}
        />
      ) : null}
    </>
  );
}

function ChannelOverview({
  cards,
  onFilter
}: {
  cards: Array<{ channel: NotificationChannel; sent: string; health: string; detail: string }>;
  onFilter: (channel: NotificationChannel) => void;
}) {
  return (
    <section className="notification-panel">
      <div className="notification-panel-head">
        <div>
          <span>Channels</span>
          <h2>Delivery health</h2>
        </div>
      </div>
      <div className="channel-grid">
        {cards.map((card) => (
          <button key={card.channel} type="button" onClick={() => onFilter(card.channel)}>
            <span>{card.channel}</span>
            <strong>{card.sent}</strong>
            <small>{card.health}</small>
            <em>{card.detail}</em>
          </button>
        ))}
      </div>
    </section>
  );
}

function NotificationComposer({
  editingNotification,
  selectedTemplate,
  onClear,
  onSubmit
}: {
  editingNotification: AdminNotification | null;
  selectedTemplate: NotificationTemplate | null;
  onClear: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const title = editingNotification?.title || selectedTemplate?.name || "Weekend fresh picks";
  const channel = editingNotification?.channel || selectedTemplate?.channel || "WhatsApp";
  const audience = editingNotification?.audience || "Repeat buyers";
  const priority = editingNotification?.priority || "Normal";
  const schedule = editingNotification?.schedule || "Sep 20, 8:00 AM";
  const target = editingNotification?.target || "/categories?name=fresh-produce";
  const recipients = editingNotification?.recipients || 1200;
  const message = editingNotification?.message || selectedTemplate?.message || "Fresh produce is ready with exclusive savings for your next grocery basket.";
  const sendMode = editingNotification?.status === "Draft" ? "Save draft" : editingNotification?.status === "Sent" ? "Send now" : "Schedule";

  return (
    <form className="notification-composer" onSubmit={onSubmit}>
      <div className="notification-panel-head">
        <div>
          <span>{editingNotification ? "Edit" : "Create"}</span>
          <h2>{editingNotification ? "Edit notification" : "Send notification"}</h2>
        </div>
        {editingNotification ? <Badge label={editingNotification.id} /> : selectedTemplate ? <Badge label={selectedTemplate.name} /> : null}
      </div>
      <div className="notification-form-grid">
        <label><span>Title</span><input name="title" defaultValue={title} /></label>
        <label><span>Channel</span><select name="channel" defaultValue={channel}><option>WhatsApp</option><option>SMS</option><option>Email</option><option>Push</option><option>In-app</option></select></label>
        <label><span>Audience</span><select name="audience" defaultValue={audience}><option>All customers</option><option>New customers</option><option>Repeat buyers</option><option>VIP customers</option><option>Today active orders</option><option>Paid orders</option><option>Inactive customers</option><option>COD users</option><option>High cart value users</option><option>Abandoned carts</option><option>Failed payments</option></select></label>
        <label><span>Priority</span><select name="priority" defaultValue={priority}><option>Normal</option><option>High</option><option>Urgent</option></select></label>
        <label><span>Schedule time</span><input name="schedule" defaultValue={schedule} /></label>
        <label><span>CTA target</span><input name="target" defaultValue={target} /></label>
        <label><span>Recipients</span><input name="recipients" inputMode="numeric" defaultValue={recipients} /></label>
        <label><span>Send mode</span><select name="sendMode" defaultValue={sendMode}><option>Schedule</option><option>Send now</option><option>Send test</option><option>Save draft</option></select></label>
        <label className="message-field"><span>Message</span><textarea name="message" defaultValue={message} /></label>
      </div>
      <div className="notification-form-actions">
        <button type="button" onClick={onClear}>Clear</button>
        <button type="submit">{editingNotification ? "Update notification" : "Save notification"}</button>
      </div>
    </form>
  );
}

function ScheduledNotifications({
  items,
  onCancel,
  onEdit,
  onPause,
  onSend
}: {
  items: AdminNotification[];
  onCancel: (item: AdminNotification) => void;
  onEdit: (item: AdminNotification) => void;
  onPause: (item: AdminNotification) => void;
  onSend: (item: AdminNotification) => void;
}) {
  return (
    <section className="notification-panel">
      <div className="notification-panel-head">
        <div>
          <span>Schedule</span>
          <h2>Upcoming notification jobs</h2>
        </div>
      </div>
      <div className="notification-table">
        <div className="notification-row notification-row-head scheduled">
          <span>Campaign</span>
          <span>Channel</span>
          <span>Audience</span>
          <span>Recipients</span>
          <span>Schedule</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {items.map((item) => (
          <div className="notification-row scheduled" key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <small>{item.id} · {item.owner}</small>
            </div>
            <span>{item.channel}</span>
            <span>{item.audience}</span>
            <span>{item.recipients.toLocaleString("en-IN")}</span>
            <span>{item.schedule}</span>
            <Badge label={item.status} />
            <div className="row-actions">
              <button type="button" onClick={() => onEdit(item)}>Edit</button>
              <button type="button" onClick={() => onSend(item)}>Send</button>
              <button type="button" onClick={() => onPause(item)}>{item.status === "Paused" ? "Resume" : "Pause"}</button>
              <button type="button" onClick={() => onCancel(item)}>Cancel</button>
            </div>
          </div>
        ))}
        {items.length === 0 ? <div className="notification-empty">No scheduled or draft notifications right now.</div> : null}
      </div>
    </section>
  );
}

function NotificationHistory({
  activeChannel,
  items,
  onFilter,
  onOpen,
  onRetry
}: {
  activeChannel: "All" | NotificationChannel;
  items: AdminNotification[];
  onFilter: (channel: "All" | NotificationChannel) => void;
  onOpen: (item: AdminNotification) => void;
  onRetry: (item: AdminNotification) => void;
}) {
  const channels: Array<"All" | NotificationChannel> = ["All", "WhatsApp", "SMS", "Email", "Push", "In-app"];

  return (
    <section className="notification-panel">
      <div className="notification-panel-head">
        <div>
          <span>History</span>
          <h2>Delivery log</h2>
        </div>
        <div className="notification-filter-tabs">
          {channels.map((channel) => (
            <button className={activeChannel === channel ? "active" : ""} key={channel} type="button" onClick={() => onFilter(channel)}>
              {channel}
            </button>
          ))}
        </div>
      </div>
      <div className="notification-table">
        <div className="notification-row notification-row-head history">
          <span>Message</span>
          <span>Channel</span>
          <span>Recipients</span>
          <span>Performance</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {items.map((item) => (
          <div className="notification-row history" key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <small>{item.schedule} · {item.target}</small>
            </div>
            <span>{item.channel}</span>
            <span>{item.recipients.toLocaleString("en-IN")}</span>
            <span>{item.openRate} open · {item.clickRate} click</span>
            <Badge label={item.status} />
            <div className="row-actions">
              <button type="button" onClick={() => onRetry(item)}>Retry</button>
              <button type="button" onClick={() => onOpen(item)}>Open</button>
            </div>
          </div>
        ))}
        {items.length === 0 ? <div className="notification-empty">No delivery logs match this channel.</div> : null}
      </div>
    </section>
  );
}

function NotificationReportModal({
  notification,
  onClose,
  onRetry,
  onSave,
  onSend
}: {
  notification: AdminNotification;
  onClose: () => void;
  onRetry: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onSend: () => void;
}) {
  const failed = notification.status === "Failed";
  const sending = notification.status === "Sending";

  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog notification-report-dialog" onSubmit={onSave}>
        <div className="product-dialog-head">
          <div>
            <span>{notification.id}</span>
            <h3>{notification.title}</h3>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <div className="notification-report-body">
          <div className="notification-report-message">
            <span>{notification.channel} message</span>
            <strong>{notification.message}</strong>
          </div>
          <div className="settings-form-grid">
            <label><span>Audience</span><input name="audience" defaultValue={notification.audience} /></label>
            <label><span>Recipients</span><input min="0" name="recipients" type="number" defaultValue={notification.recipients} /></label>
            <label><span>Status</span><select name="status" defaultValue={notification.status}><option>Draft</option><option>Scheduled</option><option>Sending</option><option>Sent</option><option>Paused</option><option>Failed</option></select></label>
            <label><span>Schedule</span><input name="schedule" defaultValue={notification.schedule} /></label>
            <label><span>Open rate</span><input name="openRate" defaultValue={notification.openRate} /></label>
            <label><span>Click rate</span><input name="clickRate" defaultValue={notification.clickRate} /></label>
            <label><span>Priority</span><select name="priority" defaultValue={notification.priority}><option>Normal</option><option>High</option><option>Urgent</option></select></label>
            <label><span>Target</span><input name="target" defaultValue={notification.target} /></label>
          </div>
        </div>
        <div className="product-dialog-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          {failed || sending ? (
            <button type="button" onClick={onRetry}>Retry delivery</button>
          ) : null}
          {notification.status !== "Sent" ? (
            <button type="button" onClick={onSend}>Mark sent</button>
          ) : null}
          <button type="submit">Save report</button>
        </div>
      </form>
    </div>
  );
}

function FailedDeliveryPanel({
  failures,
  onResolve,
  onRetry,
  onSwitch
}: {
  failures: NotificationFailure[];
  onResolve: (failure: NotificationFailure) => void;
  onRetry: (failure: NotificationFailure) => void;
  onSwitch: (failure: NotificationFailure) => void;
}) {
  return (
    <section className="notification-panel compact">
      <div className="notification-panel-head">
        <div>
          <span>Failed delivery</span>
          <h2>Needs attention</h2>
        </div>
      </div>
      <div className="failure-list">
        {failures.map((failure) => (
          <article key={failure.id}>
            <div>
              <strong>{failure.customer}</strong>
              <span>{failure.channel} · {failure.reason}</span>
              <small>{failure.id} · {failure.time}</small>
            </div>
            <Badge label={failure.status} />
            <div className="failure-actions">
              <button type="button" onClick={() => onRetry(failure)}>Retry</button>
              <button type="button" onClick={() => onSwitch(failure)}>Switch</button>
              <button type="button" onClick={() => onResolve(failure)}>Resolve</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TemplateLibrary({
  compact = false,
  templates,
  onUse
}: {
  compact?: boolean;
  templates: NotificationTemplate[];
  onUse: (template: NotificationTemplate) => void;
}) {
  return (
    <section className="notification-panel compact">
      <div className="notification-panel-head">
        <div>
          <span>Templates</span>
          <h2>Reusable messages</h2>
        </div>
      </div>
      <div className={compact ? "template-list compact" : "template-list"}>
        {templates.map((template) => (
          <article key={template.name}>
            <div>
              <strong>{template.name}</strong>
              <span>{template.channel} · {template.performance}</span>
              {!compact ? <small>{template.variables}</small> : null}
            </div>
            <button type="button" onClick={() => onUse(template)}>Use</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function AutomationRules({
  rules,
  onRun,
  onToggle
}: {
  rules: AutomationRule[];
  onRun: (rule: AutomationRule) => void;
  onToggle: (rule: AutomationRule) => void;
}) {
  return (
    <section className="notification-panel">
      <div className="notification-panel-head">
        <div>
          <span>Automation</span>
          <h2>Triggered notification rules</h2>
        </div>
      </div>
      <div className="automation-list">
        {rules.map((rule) => (
          <article key={rule.name}>
            <div>
              <strong>{rule.name}</strong>
              <span>{rule.trigger} · {rule.channel} · {rule.delay}</span>
              <small>{rule.template} · last run {rule.lastRun} · {rule.failures} failures</small>
            </div>
            <div className="automation-actions">
              <button className={rule.active ? "active" : ""} type="button" onClick={() => onToggle(rule)}>{rule.active ? "Active" : "Paused"}</button>
              <button type="button" onClick={() => onRun(rule)}>Run test</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AudiencePanel() {
  const audiences: string[][] = [];

  return (
    <section className="notification-panel compact">
      <div className="notification-panel-head">
        <div>
          <span>Audience</span>
          <h2>Targeting guide</h2>
        </div>
      </div>
      <div className="audience-list">
        {audiences.map(([name, count, detail]) => (
          <article key={name}>
            <div>
              <strong>{name}</strong>
              <span>{detail}</span>
            </div>
            <b>{count}</b>
          </article>
        ))}
        {audiences.length === 0 ? <div className="notification-empty">No audience analytics yet. Counts will appear after customer activity is stored in the database.</div> : null}
      </div>
    </section>
  );
}

function StaffView() {
  const [activeTab, setActiveTab] = useState<StaffTab>("Overview");
  const [team, setTeam] = usePersistentState<AdminStaff[]>("staff:team:v2", initialStaff);
  const [roleCards, setRoleCards] = usePersistentState<StaffRoleCard[]>("staff:roles:v2", initialStaffRoles);
  const [shifts, setShifts] = usePersistentState<StaffShift[]>("staff:shifts", initialStaffShifts);
  const [activities, setActivities] = usePersistentState<StaffActivity[]>("staff:activities", initialStaffActivity);
  const [selectedStaff, setSelectedStaff] = useState<AdminStaff>(emptyAdminStaff);
  const [selectedRole, setSelectedRole] = useState<StaffRoleCard>(emptyStaffRole);
  const [staffDialog, setStaffDialog] = useState<"invite" | "profile" | "edit" | null>(null);
  const [roleDialog, setRoleDialog] = useState(false);
  const [activityFilter, setActivityFilter] = useState<"All" | "Low" | "Medium" | "High">("All");
  const [notice, setNotice] = useState("Staff command center is ready.");

  useEffect(() => {
    if (!selectedStaff.id && team.length) {
      setSelectedStaff(team[0]);
    }
  }, [selectedStaff.id, team]);

  useEffect(() => {
    if (selectedRole.role === emptyStaffRole.role && roleCards.length) {
      setSelectedRole(roleCards[0]);
    }
  }, [roleCards, selectedRole.role]);

  const filteredActivities = activityFilter === "All" ? activities : activities.filter((activity) => activity.risk === activityFilter);
  const staffStats = [
    { label: "Total staff", value: team.length, detail: "Registered team members" },
    { label: "Active today", value: team.filter((staff) => staff.status !== "Offline" && staff.status !== "Suspended").length, detail: "Available for operations" },
    { label: "On shift", value: team.filter((staff) => staff.status === "On shift").length, detail: "Currently clocked in" },
    { label: "Pending invites", value: team.filter((staff) => staff.status === "Invited").length, detail: "Awaiting acceptance" },
    { label: "2FA enabled", value: team.filter((staff) => staff.twoFactor).length, detail: "Protected accounts" },
    { label: "Suspended", value: team.filter((staff) => staff.status === "Suspended").length, detail: "Blocked access" }
  ];

  function addActivity(staff: string, action: string, module = "Staff", risk: StaffActivity["risk"] = "Low") {
    setActivities((items) => [{ id: `AC-${905 + items.length}`, staff, action, module, risk, time: "Just now" }, ...items]);
  }

  function openStaffDialog(dialog: "profile" | "edit", staff: AdminStaff) {
    if (!staff.id) {
      setNotice("Select a staff member before opening this action.");
      return;
    }
    setSelectedStaff(staff);
    setStaffDialog(dialog);
    setNotice(`${staff.name} ${dialog === "edit" ? "loaded for editing" : "profile opened"}.`);
  }

  function inviteStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const invitedStaff: AdminStaff = {
      id: `ST-${String(team.length + 1).padStart(3, "0")}`,
      name: String(formData.get("name") || "New staff").trim(),
      email: String(formData.get("email") || "new@freshcart.local").trim(),
      phone: String(formData.get("phone") || "+91 90000 00000").trim(),
      role: String(formData.get("role") || "Support Agent") as StaffRole,
      shift: String(formData.get("shift") || "Tomorrow 10 AM - 7 PM").trim(),
      status: "Invited",
      zone: String(formData.get("zone") || "Support").trim(),
      lastActive: "Invite sent",
      twoFactor: false,
      performance: "Awaiting onboarding",
      rating: "-"
    };

    setTeam((items) => [invitedStaff, ...items]);
    addActivity(invitedStaff.name, `Invite sent through ${String(formData.get("channel") || "Email")}`, "Security", "Low");
    setSelectedStaff(invitedStaff);
    setStaffDialog(null);
    setActiveTab("Directory");
    setNotice(`${invitedStaff.name} invited as ${invitedStaff.role}.`);
  }

  function saveStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedStaff.id) {
      setNotice("Select a staff member before saving changes.");
      return;
    }
    const formData = new FormData(event.currentTarget);
    const updatedStaff: AdminStaff = {
      ...selectedStaff,
      name: String(formData.get("name") || selectedStaff.name).trim(),
      email: String(formData.get("email") || selectedStaff.email).trim(),
      phone: String(formData.get("phone") || selectedStaff.phone).trim(),
      role: String(formData.get("role") || selectedStaff.role) as StaffRole,
      shift: String(formData.get("shift") || selectedStaff.shift).trim(),
      zone: String(formData.get("zone") || selectedStaff.zone).trim(),
      status: String(formData.get("status") || selectedStaff.status) as StaffStatus,
      twoFactor: formData.get("twoFactor") === "on"
    };

    setTeam((items) => items.map((staff) => (staff.id === selectedStaff.id ? updatedStaff : staff)));
    setSelectedStaff(updatedStaff);
    addActivity(updatedStaff.name, "Updated staff profile", "Staff", "Low");
    setStaffDialog(null);
    setNotice(`${updatedStaff.name} profile updated.`);
  }

  function toggleSuspend(staff: AdminStaff) {
    if (!staff.id) {
      setNotice("Select a staff member before changing account status.");
      return;
    }
    const nextStatus: StaffStatus = staff.status === "Suspended" ? "Active" : "Suspended";
    const updatedStaff = { ...staff, status: nextStatus, lastActive: nextStatus === "Suspended" ? "Suspended just now" : "Reactivated just now" };
    setTeam((items) => items.map((item) => (item.id === staff.id ? updatedStaff : item)));
    setSelectedStaff(updatedStaff);
    addActivity(staff.name, `${nextStatus === "Suspended" ? "Suspended" : "Reactivated"} account`, "Security", nextStatus === "Suspended" ? "High" : "Medium");
    setNotice(`${staff.name} ${nextStatus === "Suspended" ? "suspended" : "reactivated"}.`);
  }

  function resetPassword(staff: AdminStaff) {
    if (!staff.id) {
      setNotice("Select a staff member before sending a password reset.");
      return;
    }
    addActivity(staff.name, "Password reset link sent", "Security", "Medium");
    setNotice(`Password reset sent to ${staff.email}.`);
  }

  function resendInvite(staff: AdminStaff) {
    if (!staff.id) {
      setNotice("Select an invited staff member before resending.");
      return;
    }
    addActivity(staff.name, "Invite resent", "Security", "Low");
    setNotice(`Invite resent to ${staff.email}.`);
  }

  function cancelInvite(staff: AdminStaff) {
    if (!staff.id) {
      setNotice("Select an invited staff member before cancelling.");
      return;
    }
    setTeam((items) => items.filter((item) => item.id !== staff.id));
    addActivity(staff.name, "Invite cancelled", "Security", "Medium");
    setNotice(`${staff.name} invite cancelled.`);
  }

  function duplicateRole(role: StaffRoleCard) {
    const copiedRole: StaffRoleCard = { ...role, role: `${role.role} Copy`, access: `${role.access} copy`, users: 0 };
    setRoleCards((items) => [copiedRole, ...items]);
    setNotice(`${role.role} permissions duplicated for review.`);
  }

  function editRole(role: StaffRoleCard) {
    setSelectedRole(role);
    setRoleDialog(true);
    setNotice(`${role.role} permission editor opened.`);
  }

  function saveRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const permissions = adminPermissionModules.filter((permission) => formData.get(`permission-${permission}`) === "on");
    const updatedRole: StaffRoleCard = {
      role: String(formData.get("role") || selectedRole.role).trim(),
      users: Number(formData.get("users") || selectedRole.users),
      access: String(formData.get("access") || selectedRole.access).trim(),
      permissions
    };
    setRoleCards((items) => items.map((item) => (item.role === selectedRole.role ? updatedRole : item)));
    setSelectedRole(updatedRole);
    setRoleDialog(false);
    addActivity("Owner", `Updated ${updatedRole.role} permissions`, "Staff", permissions.includes("Settings") || permissions.includes("Finance") || permissions.includes("Legal & Compliance") ? "High" : "Medium");
    setNotice(`${updatedRole.role} permissions saved.`);
  }

  function updateShift(shift: StaffShift, state: StaffShift["state"]) {
    setShifts((items) => items.map((item) => (item.id === shift.id ? { ...item, state } : item)));
    addActivity(shift.name, `Shift marked ${state}`, "Shifts", state === "Late" ? "Medium" : "Low");
    setNotice(`${shift.name} shift marked ${state}.`);
  }

  function assignZone(shift: StaffShift) {
    const nextZone = shift.zone === "Express dispatch" ? "Store operations" : "Express dispatch";
    setShifts((items) => items.map((item) => (item.id === shift.id ? { ...item, zone: nextZone } : item)));
    setTeam((items) => items.map((staff) => (staff.name === shift.name ? { ...staff, zone: nextZone } : staff)));
    addActivity(shift.name, `Assigned to ${nextZone}`, "Shifts", "Low");
    setNotice(`${shift.name} assigned to ${nextZone}.`);
  }

  function alertStaff(shift: StaffShift) {
    addActivity(shift.name, "Shift alert sent", "Shifts", shift.state === "Late" ? "High" : "Medium");
    setNotice(`Alert sent to ${shift.name}.`);
  }

  function acknowledgeActivity(activity: StaffActivity) {
    setActivities((items) => items.map((item) => (item.id === activity.id ? { ...item, risk: "Low", action: `${item.action} · reviewed` } : item)));
    setNotice(`${activity.id} reviewed.`);
  }

  return (
    <>
      {notice ? <div className="admin-notice">{notice}</div> : null}
      <section className="staff-command">
        <div>
          <span>Team control</span>
          <h2>Staff and permissions center</h2>
          <p>Manage staff access, roles, shifts, security, invites, and activity logs for every grocery operation module.</p>
          <div className="staff-tabs">
            {(["Overview", "Directory", "Roles", "Shifts", "Activity"] as StaffTab[]).map((tab) => (
              <button className={activeTab === tab ? "active" : ""} key={tab} type="button" onClick={() => setActiveTab(tab)}>
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="staff-command-actions">
          <button className="primary-action" type="button" onClick={() => setStaffDialog("invite")}>Invite staff</button>
          <button type="button" onClick={() => setActiveTab("Directory")}>Open directory</button>
          <button type="button" onClick={() => setActiveTab("Roles")}>Review roles</button>
          <button type="button" onClick={() => setActiveTab("Activity")}>View activity log</button>
        </div>
      </section>

      <section className="staff-stat-grid">
        {staffStats.map((stat) => (
          <article key={stat.label}>
            <div>
              <span>{stat.label}</span>
              <small>{stat.detail}</small>
            </div>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>

      {activeTab === "Overview" ? (
        <section className="staff-layout">
          <div className="staff-main-stack">
            <StaffDirectory staff={team.slice(0, 4)} compact onCancelInvite={cancelInvite} onEdit={(staff) => openStaffDialog("edit", staff)} onInvite={resendInvite} onReset={resetPassword} onSuspend={toggleSuspend} onView={(staff) => openStaffDialog("profile", staff)} />
            <RolePermissionGrid roles={roleCards} onDuplicate={duplicateRole} onEdit={editRole} />
          </div>
          <div className="staff-side-stack">
            <ShiftRoster shifts={shifts} onAlert={alertStaff} onAssign={assignZone} onUpdate={updateShift} />
            <ActivityLog activities={activities.slice(0, 4)} activeFilter={activityFilter} onAcknowledge={acknowledgeActivity} onFilter={setActivityFilter} />
          </div>
        </section>
      ) : null}

      {activeTab === "Directory" ? (
        <StaffDirectory staff={team} onCancelInvite={cancelInvite} onEdit={(staff) => openStaffDialog("edit", staff)} onInvite={resendInvite} onReset={resetPassword} onSuspend={toggleSuspend} onView={(staff) => openStaffDialog("profile", staff)} />
      ) : null}

      {activeTab === "Roles" ? <RolePermissionGrid roles={roleCards} onDuplicate={duplicateRole} onEdit={editRole} /> : null}
      {activeTab === "Shifts" ? <ShiftRoster shifts={shifts} onAlert={alertStaff} onAssign={assignZone} onUpdate={updateShift} full /> : null}
      {activeTab === "Activity" ? (
        <ActivityLog activities={filteredActivities} activeFilter={activityFilter} onAcknowledge={acknowledgeActivity} onFilter={setActivityFilter} full />
      ) : null}

      {staffDialog ? (
        <StaffDialogModal
          dialog={staffDialog}
          staff={selectedStaff}
          onClose={() => setStaffDialog(null)}
          onInvite={inviteStaff}
          onReset={() => resetPassword(selectedStaff)}
          onSave={saveStaff}
          onSuspend={() => toggleSuspend(selectedStaff)}
        />
      ) : null}
      {roleDialog ? <RolePermissionDialog onClose={() => setRoleDialog(false)} onSave={saveRole} role={selectedRole} /> : null}
    </>
  );
}

function StaffDirectory({
  compact = false,
  staff,
  onCancelInvite,
  onEdit,
  onInvite,
  onReset,
  onSuspend,
  onView
}: {
  compact?: boolean;
  staff: AdminStaff[];
  onCancelInvite: (staff: AdminStaff) => void;
  onEdit: (staff: AdminStaff) => void;
  onInvite: (staff: AdminStaff) => void;
  onReset: (staff: AdminStaff) => void;
  onSuspend: (staff: AdminStaff) => void;
  onView: (staff: AdminStaff) => void;
}) {
  return (
    <section className="staff-panel">
      <div className="staff-panel-head">
        <div>
          <span>Directory</span>
          <h2>{compact ? "Staff snapshot" : "Staff directory"}</h2>
        </div>
      </div>
      <div className="staff-table">
        <div className="staff-row staff-row-head">
          <span>Staff</span>
          <span>Role</span>
          <span>Shift</span>
          <span>Zone</span>
          <span>Security</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {staff.map((member) => (
          <div className="staff-row" key={member.id}>
            <div>
              <strong>{member.name}</strong>
              <small>{member.email} · {member.phone}</small>
            </div>
            <span>{member.role}</span>
            <span>{member.shift}</span>
            <span>{member.zone}</span>
            <span>{member.twoFactor ? "2FA active" : "2FA needed"}</span>
            <Badge label={member.status} />
            <div className="row-actions">
              <button type="button" onClick={() => onView(member)}>View</button>
              <button type="button" onClick={() => onEdit(member)}>Edit</button>
              {member.status === "Invited" ? (
                <>
                  <button type="button" onClick={() => onInvite(member)}>Resend</button>
                  <button type="button" onClick={() => onCancelInvite(member)}>Cancel</button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => onReset(member)}>Reset</button>
                  <button type="button" onClick={() => onSuspend(member)}>{member.status === "Suspended" ? "Reactivate" : "Suspend"}</button>
                </>
              )}
            </div>
          </div>
        ))}
        {staff.length === 0 ? <div className="staff-empty">No staff records yet. Invite real staff members to build the operations team.</div> : null}
      </div>
    </section>
  );
}

function RolePermissionGrid({ roles, onDuplicate, onEdit }: { roles: StaffRoleCard[]; onDuplicate: (role: StaffRoleCard) => void; onEdit: (role: StaffRoleCard) => void }) {
  return (
    <section className="staff-panel">
      <div className="staff-panel-head">
        <div>
          <span>Roles</span>
          <h2>Roles and permissions</h2>
        </div>
      </div>
      <div className="role-grid">
        {roles.map((role, index) => (
          <article key={`${role.role}-${index}`}>
            <div className="role-card-head">
              <div>
                <strong>{role.role}</strong>
                <span>{role.users} users · {role.access}</span>
              </div>
              <b>{role.permissions.length}</b>
            </div>
            <div className="permission-chips">
              {role.permissions.map((permission) => <span key={permission}>{permission}</span>)}
            </div>
            <div className="role-actions">
              <button type="button" onClick={() => onEdit(role)}>Edit permissions</button>
              <button type="button" onClick={() => onDuplicate(role)}>Duplicate role</button>
            </div>
          </article>
        ))}
        {roles.length === 0 ? <div className="staff-empty">No roles configured yet. Create roles after adding real permission requirements.</div> : null}
      </div>
    </section>
  );
}

function RolePermissionDialog({ onClose, onSave, role }: { onClose: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void; role: StaffRoleCard }) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog staff-dialog" onSubmit={onSave}>
        <div className="product-dialog-head">
          <div>
            <span>RBAC</span>
            <h3>Edit role permissions</h3>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <div className="staff-form-grid">
          <label><span>Role name</span><input name="role" defaultValue={role.role} /></label>
          <label><span>Users assigned</span><input min="0" name="users" type="number" defaultValue={role.users} /></label>
          <label className="settings-wide"><span>Access summary</span><input name="access" defaultValue={role.access} /></label>
        </div>
        <div className="role-permission-editor">
          {adminPermissionModules.map((permission) => (
            <label key={permission}>
              <input name={`permission-${permission}`} type="checkbox" defaultChecked={role.permissions.includes(permission)} />
              <span>{permission}</span>
            </label>
          ))}
        </div>
        <div className="product-dialog-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">Save permissions</button>
        </div>
      </form>
    </div>
  );
}

function ShiftRoster({
  full = false,
  shifts,
  onAlert,
  onAssign,
  onUpdate
}: {
  full?: boolean;
  shifts: StaffShift[];
  onAlert: (shift: StaffShift) => void;
  onAssign: (shift: StaffShift) => void;
  onUpdate: (shift: StaffShift, state: StaffShift["state"]) => void;
}) {
  return (
    <section className="staff-panel">
      <div className="staff-panel-head">
        <div>
          <span>Shifts</span>
          <h2>{full ? "Today's shift roster" : "Shift watch"}</h2>
        </div>
      </div>
      <div className="shift-list">
        {shifts.map((shift) => (
          <article key={shift.id}>
            <div>
              <strong>{shift.name}</strong>
              <span>{shift.role} · {shift.shift}</span>
              <small>{shift.zone}</small>
            </div>
            <Badge label={shift.state} />
            <div className="shift-actions">
              <button type="button" onClick={() => onUpdate(shift, shift.state === "Clocked in" ? "Completed" : "Clocked in")}>{shift.state === "Clocked in" ? "End shift" : "Start shift"}</button>
              <button type="button" onClick={() => onUpdate(shift, "On break")}>Break</button>
              <button type="button" onClick={() => onAssign(shift)}>Assign zone</button>
              <button type="button" onClick={() => onAlert(shift)}>Alert</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ActivityLog({
  activeFilter,
  activities,
  full = false,
  onAcknowledge,
  onFilter
}: {
  activeFilter: "All" | "Low" | "Medium" | "High";
  activities: StaffActivity[];
  full?: boolean;
  onAcknowledge: (activity: StaffActivity) => void;
  onFilter: (filter: "All" | "Low" | "Medium" | "High") => void;
}) {
  const filters: Array<"All" | "Low" | "Medium" | "High"> = ["All", "Low", "Medium", "High"];

  return (
    <section className="staff-panel">
      <div className="staff-panel-head">
        <div>
          <span>Activity</span>
          <h2>{full ? "Activity and security log" : "Recent activity"}</h2>
        </div>
        <div className="staff-filter-tabs">
          {filters.map((filter) => (
            <button className={activeFilter === filter ? "active" : ""} key={filter} type="button" onClick={() => onFilter(filter)}>
              {filter}
            </button>
          ))}
        </div>
      </div>
      <div className="activity-list">
        {activities.map((activity) => (
          <article key={activity.id}>
            <div>
              <strong>{activity.action}</strong>
              <span>{activity.staff} · {activity.module} · {activity.time}</span>
            </div>
            <Badge label={`${activity.risk} risk`} />
            <button type="button" onClick={() => onAcknowledge(activity)}>Review</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function StaffDialogModal({
  dialog,
  staff,
  onClose,
  onInvite,
  onReset,
  onSave,
  onSuspend
}: {
  dialog: "invite" | "profile" | "edit";
  staff: AdminStaff;
  onClose: () => void;
  onInvite: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onSuspend: () => void;
}) {
  if (dialog === "invite") {
    return (
      <div className="product-dialog-backdrop">
        <form className="product-dialog staff-dialog" onSubmit={onInvite}>
          <div className="product-dialog-head">
            <div>
              <span>Invite</span>
              <h3>Invite staff</h3>
            </div>
            <button type="button" onClick={onClose}>Close</button>
          </div>
          <div className="staff-form-grid">
            <label><span>Name</span><input name="name" defaultValue="New team member" /></label>
            <label><span>Email</span><input name="email" defaultValue="team@freshcart.local" /></label>
            <label><span>Phone</span><input name="phone" defaultValue="+91 90000 66666" /></label>
            <label><span>Role</span><select name="role" defaultValue="Support Agent">{staffRoleOptions.map((role) => <option key={role}>{role}</option>)}</select></label>
            <label><span>Module / zone</span><input name="zone" defaultValue="Support" /></label>
            <label><span>Shift</span><input name="shift" defaultValue="Tomorrow 10 AM - 7 PM" /></label>
            <label><span>Invite channel</span><select name="channel" defaultValue="Email"><option>Email</option><option>SMS</option><option>WhatsApp</option></select></label>
          </div>
          <div className="product-dialog-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Send invite</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog staff-dialog" onSubmit={onSave}>
        <div className="product-dialog-head">
          <div>
            <span>{staff.id}</span>
            <h3>{dialog === "edit" ? "Edit staff" : staff.name}</h3>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        {dialog === "profile" ? (
          <div className="staff-form-grid">
            <label><span>Name</span><input name="name" defaultValue={staff.name} /></label>
            <label><span>Email</span><input name="email" defaultValue={staff.email} /></label>
            <label><span>Phone</span><input name="phone" defaultValue={staff.phone} /></label>
            <label><span>Role</span><select name="role" defaultValue={staff.role}>{staffRoleOptions.map((role) => <option key={role}>{role}</option>)}</select></label>
            <label><span>Status</span><select name="status" defaultValue={staff.status}><option>Active</option><option>On shift</option><option>Invited</option><option>Suspended</option><option>Offline</option></select></label>
            <label><span>Zone</span><input name="zone" defaultValue={staff.zone} /></label>
            <label><span>Shift</span><input name="shift" defaultValue={staff.shift} /></label>
            <label><span>Last active</span><input value={staff.lastActive} readOnly /></label>
            <label><span>Performance</span><input value={staff.performance} readOnly /></label>
            <label><span>Rating</span><input value={staff.rating} readOnly /></label>
            <label className="staff-check"><input name="twoFactor" type="checkbox" defaultChecked={staff.twoFactor} /> 2FA active</label>
          </div>
        ) : (
          <div className="staff-form-grid">
            <label><span>Name</span><input name="name" defaultValue={staff.name} /></label>
            <label><span>Email</span><input name="email" defaultValue={staff.email} /></label>
            <label><span>Phone</span><input name="phone" defaultValue={staff.phone} /></label>
            <label><span>Role</span><select name="role" defaultValue={staff.role}>{staffRoleOptions.map((role) => <option key={role}>{role}</option>)}</select></label>
            <label><span>Status</span><select name="status" defaultValue={staff.status}><option>Active</option><option>On shift</option><option>Invited</option><option>Suspended</option><option>Offline</option></select></label>
            <label><span>Zone</span><input name="zone" defaultValue={staff.zone} /></label>
            <label><span>Shift</span><input name="shift" defaultValue={staff.shift} /></label>
            <label className="staff-check"><input name="twoFactor" type="checkbox" defaultChecked={staff.twoFactor} /> 2FA active</label>
          </div>
        )}
        <div className="product-dialog-actions">
          <button type="button" onClick={onClose}>{dialog === "profile" ? "Done" : "Cancel"}</button>
          {dialog === "profile" ? (
            <>
              <button type="button" onClick={onReset}>Reset password</button>
              <button type="button" onClick={onSuspend}>{staff.status === "Suspended" ? "Reactivate" : "Suspend"}</button>
              <button type="submit">Save profile</button>
            </>
          ) : (
            <button type="submit">Save staff</button>
          )}
        </div>
      </form>
    </div>
  );
}

function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("Store");
  const [store, setStore] = usePersistentState<StoreSettings>("settings:store", defaultStoreSettings);
  const [delivery, setDelivery] = usePersistentState<DeliverySettings>("settings:delivery", defaultDeliverySettings);
  const [payments, setPayments] = usePersistentState<PaymentSettings>("settings:payments", defaultPaymentSettings);
  const [checkout, setCheckout] = usePersistentState<CheckoutSettings>("settings:checkout", defaultCheckoutSettings);
  const [notifications, setNotifications] = usePersistentState<NotificationSettings>("settings:notifications", defaultNotificationSettings);
  const [supportSettings, setSupportSettings] = usePersistentState<SupportSettings>("settings:support", defaultSupportSettings);
  const [security, setSecurity] = usePersistentState<SecuritySettings>("settings:security", defaultSecuritySettings);
  const [legal, setLegal] = usePersistentState<LegalSettings>("settings:legal", defaultLegalSettings);
  const [inventoryPolicy, setInventoryPolicy] = usePersistentState<InventoryPolicySettings>("settings:inventory-policy", defaultInventoryPolicySettings);
  const [audit, setAudit] = usePersistentState<SettingsAudit[]>("settings:audit", initialSettingsAudit);
  const [settingsVersion, setSettingsVersion] = useState(0);
  const [notice, setNotice] = useState("Settings control center is ready.");

  function addAudit(action: string, area: string = activeTab) {
    setAudit((items) => [{ id: `SA-${304 + items.length}`, action, area, time: "Just now" }, ...items]);
  }

  function saveCurrentTab() {
    addAudit(`${activeTab} settings saved`);
    setNotice(`${activeTab} settings saved.`);
  }

  function resetCurrentTab() {
    if (activeTab === "Store") setStore(defaultStoreSettings);
    if (activeTab === "Delivery") setDelivery(defaultDeliverySettings);
    if (activeTab === "Payments") setPayments(defaultPaymentSettings);
    if (activeTab === "Checkout") setCheckout(defaultCheckoutSettings);
    if (activeTab === "Notifications") setNotifications(defaultNotificationSettings);
    if (activeTab === "Support") setSupportSettings(defaultSupportSettings);
    if (activeTab === "Security") setSecurity(defaultSecuritySettings);
    setSettingsVersion((version) => version + 1);
    addAudit(`${activeTab} settings reset`);
    setNotice(`${activeTab} settings reset to defaults.`);
  }

  function saveStoreProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updatedStore: StoreSettings = {
      name: String(formData.get("name") || store.name).trim(),
      email: String(formData.get("email") || store.email).trim(),
      phone: String(formData.get("phone") || store.phone).trim(),
      gst: String(formData.get("gst") || store.gst).trim(),
      address: String(formData.get("address") || store.address).trim(),
      city: String(formData.get("city") || store.city).trim(),
      status: String(formData.get("status") || store.status) as StoreStatus,
      logo: String(formData.get("logo") || store.logo).trim()
    };
    setStore(updatedStore);
    addAudit("Store profile saved", "Store");
    setNotice(`${updatedStore.name} profile saved.`);
  }

  function toggleStoreStatus() {
    const nextStatus: StoreStatus = store.status === "Open" ? "Maintenance" : store.status === "Maintenance" ? "Closed" : "Open";
    setStore((current) => ({ ...current, status: nextStatus }));
    addAudit(`Store status switched to ${nextStatus}`, "Store");
    setNotice(`Store status switched to ${nextStatus}.`);
  }

  function saveDelivery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updatedDelivery: DeliverySettings = {
      ...delivery,
      fee: String(formData.get("fee") || delivery.fee).trim(),
      freeThreshold: String(formData.get("freeThreshold") || delivery.freeThreshold).trim(),
      minimumOrder: String(formData.get("minimumOrder") || delivery.minimumOrder).trim(),
      slots: String(formData.get("slots") || delivery.slots).trim(),
      assignment: String(formData.get("assignment") || delivery.assignment).trim(),
      radius: String(formData.get("radius") || delivery.radius).trim(),
      mapProvider: String(formData.get("mapProvider") || delivery.mapProvider).trim()
    };
    setDelivery(updatedDelivery);
    addAudit("Delivery rules saved", "Delivery");
    setNotice("Delivery settings saved.");
  }

  function addDeliveryZone() {
    const zone = `Zone ${delivery.zones.length + 1}`;
    setDelivery((current) => ({ ...current, zones: [...current.zones, zone] }));
    addAudit(`${zone} added`, "Delivery");
    setNotice(`${zone} added to delivery coverage.`);
  }

  function savePayments(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updatedPayments: PaymentSettings = {
      cod: formData.get("cod") === "on",
      online: formData.get("online") === "on",
      provider: String(formData.get("provider") || payments.provider).trim(),
      upi: String(formData.get("upi") || payments.upi).trim(),
      refundRule: String(formData.get("refundRule") || payments.refundRule).trim(),
      codLimit: String(formData.get("codLimit") || payments.codLimit).trim(),
      retryRule: String(formData.get("retryRule") || payments.retryRule).trim()
    };
    setPayments(updatedPayments);
    addAudit("Payment rules saved", "Payments");
    setNotice("Payment settings saved.");
  }

  function saveCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updatedCheckout: CheckoutSettings = {
      tax: String(formData.get("tax") || checkout.tax).trim(),
      packagingFee: String(formData.get("packagingFee") || checkout.packagingFee).trim(),
      handlingFee: String(formData.get("handlingFee") || checkout.handlingFee).trim(),
      substitutions: formData.get("substitutions") === "on",
      addressValidation: String(formData.get("addressValidation") || checkout.addressValidation).trim(),
      couponStacking: formData.get("couponStacking") === "on",
      wallet: formData.get("wallet") === "on"
    };
    setCheckout(updatedCheckout);
    addAudit("Checkout rules saved", "Checkout");
    setNotice("Checkout settings saved.");
  }

  function saveNotificationSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updatedNotifications: NotificationSettings = {
      whatsapp: String(formData.get("whatsapp") || notifications.whatsapp).trim(),
      sms: String(formData.get("sms") || notifications.sms).trim(),
      email: String(formData.get("email") || notifications.email).trim(),
      push: String(formData.get("push") || notifications.push).trim(),
      adminAlerts: formData.get("adminAlerts") === "on",
      customerOrderUpdates: formData.get("customerOrderUpdates") === "on",
      marketingOptIn: formData.get("marketingOptIn") === "on"
    };
    setNotifications(updatedNotifications);
    addAudit("Notification providers saved", "Notifications");
    setNotice("Notification settings saved.");
  }

  function saveSecurity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updatedSecurity: SecuritySettings = {
      ownerTwoFactor: formData.get("ownerTwoFactor") === "on",
      staffTwoFactor: formData.get("staffTwoFactor") === "on",
      sessionTimeout: String(formData.get("sessionTimeout") || security.sessionTimeout).trim(),
      deviceTracking: formData.get("deviceTracking") === "on",
      lockout: String(formData.get("lockout") || security.lockout).trim(),
      roleDefaults: String(formData.get("roleDefaults") || security.roleDefaults).trim(),
      auditRetention: String(formData.get("auditRetention") || security.auditRetention).trim()
    };
    setSecurity(updatedSecurity);
    addAudit("Security settings saved", "Security");
    setNotice("Security settings saved.");
  }

  function saveSupport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updatedSupport: SupportSettings = {
      workingHours: String(formData.get("workingHours") || supportSettings.workingHours).trim(),
      autoAssignment: formData.get("autoAssignment") === "on",
      escalationRule: String(formData.get("escalationRule") || supportSettings.escalationRule).trim(),
      sla: String(formData.get("sla") || supportSettings.sla).trim(),
      refundHandling: String(formData.get("refundHandling") || supportSettings.refundHandling).trim(),
      whatsapp: String(formData.get("whatsapp") || supportSettings.whatsapp).trim(),
      inbox: String(formData.get("inbox") || supportSettings.inbox).trim()
    };
    setSupportSettings(updatedSupport);
    addAudit("Support settings saved", "Support");
    setNotice("Support settings saved.");
  }

  function saveLegal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updatedLegal: LegalSettings = {
      gst: String(formData.get("gst") || legal.gst).trim(),
      invoicePrefix: String(formData.get("invoicePrefix") || legal.invoicePrefix).trim(),
      taxSlabs: String(formData.get("taxSlabs") || legal.taxSlabs).trim(),
      license: String(formData.get("license") || legal.license).trim(),
      privacyUrl: String(formData.get("privacyUrl") || legal.privacyUrl).trim(),
      termsUrl: String(formData.get("termsUrl") || legal.termsUrl).trim(),
      refundUrl: String(formData.get("refundUrl") || legal.refundUrl).trim()
    };
    setLegal(updatedLegal);
    addAudit("Legal details saved", "Legal");
    setNotice("Legal details saved.");
  }

  function saveInventoryPolicy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updatedInventoryPolicy: InventoryPolicySettings = {
      lowStock: String(formData.get("lowStock") || inventoryPolicy.lowStock).trim(),
      expiryDays: String(formData.get("expiryDays") || inventoryPolicy.expiryDays).trim(),
      batchTracking: formData.get("batchTracking") === "on",
      supplierApproval: formData.get("supplierApproval") === "on",
      autoReorder: formData.get("autoReorder") === "on",
      reservationTimeout: String(formData.get("reservationTimeout") || inventoryPolicy.reservationTimeout).trim()
    };
    setInventoryPolicy(updatedInventoryPolicy);
    addAudit("Inventory rules saved", "Inventory");
    setNotice("Inventory rules saved.");
  }

  const settingsStats = [
    { label: "Store status", value: store.status, detail: `${store.city} service area` },
    { label: "Delivery zones", value: delivery.zones.length, detail: `${delivery.radius} radius` },
    { label: "Payments", value: payments.online ? "Online" : "COD", detail: payments.provider },
    { label: "Support", value: supportSettings.autoAssignment ? "Auto" : "Manual", detail: supportSettings.sla },
    { label: "Security", value: security.staffTwoFactor ? "2FA" : "Basic", detail: security.sessionTimeout },
    { label: "Audit", value: audit.length, detail: "Recent setting changes" }
  ];

  return (
    <>
      {notice ? <div className="admin-notice">{notice}</div> : null}
      <section className="settings-command">
        <div>
          <span>Store control</span>
          <h2>Settings control center</h2>
          <p>Configure store identity, delivery rules, payments, checkout, notifications, support, security, legal details, and inventory policies.</p>
          <div className="settings-tabs">
            {(["Store", "Delivery", "Payments", "Checkout", "Notifications", "Support", "Security"] as SettingsTab[]).map((tab) => (
              <button className={activeTab === tab ? "active" : ""} key={tab} type="button" onClick={() => setActiveTab(tab)}>
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="settings-command-actions">
          <button className="primary-action" type="button" onClick={saveCurrentTab}>Save current tab</button>
          <button type="button" onClick={resetCurrentTab}>Reset current tab</button>
          <button type="button" onClick={() => { addAudit("Audit log exported", "Security"); setNotice("Settings audit log exported."); }}>Export audit</button>
        </div>
      </section>

      <section className="settings-stat-grid">
        {settingsStats.map((stat) => (
          <article key={stat.label}>
            <div>
              <span>{stat.label}</span>
              <small>{stat.detail}</small>
            </div>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>

      <section className="settings-layout">
        <div className="settings-main-stack" key={`${activeTab}-${settingsVersion}`}>
          {activeTab === "Store" ? <StoreSettingsPanel store={store} onPreview={() => setNotice(`${store.name} storefront identity preview opened.`)} onSave={saveStoreProfile} onToggleStatus={toggleStoreStatus} /> : null}
          {activeTab === "Delivery" ? <DeliverySettingsPanel delivery={delivery} onAddZone={addDeliveryZone} onSave={saveDelivery} onTestMap={() => { addAudit("Map provider check requested", "Delivery"); setNotice("Map provider check needs real provider configuration."); }} onToggleExpress={() => { setDelivery((current) => ({ ...current, express: !current.express })); addAudit("Express delivery toggled", "Delivery"); setNotice(`Express delivery ${delivery.express ? "disabled" : "enabled"}.`); }} /> : null}
          {activeTab === "Payments" ? <PaymentSettingsPanel payments={payments} onSave={savePayments} onTestGateway={() => { addAudit("Payment gateway check requested", "Payments"); setNotice("Payment gateway check needs real provider configuration."); }} /> : null}
          {activeTab === "Checkout" ? <CheckoutSettingsPanel checkout={checkout} onReset={() => { setCheckout(defaultCheckoutSettings); addAudit("Checkout defaults restored", "Checkout"); setNotice("Checkout defaults restored."); }} onSave={saveCheckout} /> : null}
          {activeTab === "Notifications" ? <NotificationSettingsPanel notifications={notifications} onSave={saveNotificationSettings} onTest={(provider) => { addAudit(`${provider} test sent`, "Notifications"); setNotice(`${provider} test message sent.`); }} /> : null}
          {activeTab === "Support" ? <SupportSettingsPanel support={supportSettings} onSave={saveSupport} onTestInbox={() => { addAudit("Support inbox tested", "Support"); setNotice("Support inbox test passed."); }} /> : null}
          {activeTab === "Security" ? <SecuritySettingsPanel security={security} onReviewAlerts={() => { addAudit("Suspicious login alerts reviewed", "Security"); setNotice("Suspicious login alerts reviewed."); }} onSave={saveSecurity} /> : null}
        </div>
        <div className="settings-side-stack">
          <SettingsAuditPanel audit={audit} />
          <SettingsLegalPanel legal={legal} onPreview={() => { addAudit("Invoice preview opened", "Legal"); setNotice("Invoice preview opened."); }} onSave={saveLegal} />
          <SettingsInventoryPanel inventoryPolicy={inventoryPolicy} onSave={saveInventoryPolicy} onToggleAutoReorder={() => { setInventoryPolicy((current) => ({ ...current, autoReorder: !current.autoReorder })); addAudit("Auto reorder rule toggled", "Inventory"); setNotice(`Auto reorder ${inventoryPolicy.autoReorder ? "disabled" : "enabled"}.`); }} />
        </div>
      </section>

    </>
  );
}

function SettingToggle({ defaultChecked, label, name }: { defaultChecked: boolean; label: string; name: string }) {
  return (
    <label className="settings-toggle">
      <input defaultChecked={defaultChecked} name={name} type="checkbox" />
      <span>{label}</span>
    </label>
  );
}

function StoreSettingsPanel({
  store,
  onPreview,
  onSave,
  onToggleStatus
}: {
  store: StoreSettings;
  onPreview: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onToggleStatus: () => void;
}) {
  return (
    <form className="settings-panel" onSubmit={onSave}>
      <SettingsPanelHead eyebrow="Store" title="Store profile" />
      <div className="settings-form-grid">
        <label><span>Store name</span><input name="name" defaultValue={store.name} /></label>
        <label><span>Logo text</span><input name="logo" defaultValue={store.logo} /></label>
        <label><span>Business email</span><input name="email" defaultValue={store.email} /></label>
        <label><span>Support phone</span><input name="phone" defaultValue={store.phone} /></label>
        <label><span>GST / tax</span><input name="gst" defaultValue={store.gst} /></label>
        <label><span>City / area</span><input name="city" defaultValue={store.city} /></label>
        <label><span>Status</span><select name="status" defaultValue={store.status}><option>Open</option><option>Closed</option><option>Maintenance</option></select></label>
        <label className="settings-wide"><span>Store address</span><input name="address" defaultValue={store.address} /></label>
      </div>
      <SettingsActions primary="Save profile" secondary="Preview identity" onSecondary={onPreview} tertiary="Switch status" onTertiary={onToggleStatus} />
    </form>
  );
}

function DeliverySettingsPanel({
  delivery,
  onAddZone,
  onSave,
  onTestMap,
  onToggleExpress
}: {
  delivery: DeliverySettings;
  onAddZone: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onTestMap: () => void;
  onToggleExpress: () => void;
}) {
  return (
    <form className="settings-panel" onSubmit={onSave}>
      <SettingsPanelHead eyebrow="Delivery" title="Delivery rules" />
      <div className="settings-chip-row">{delivery.zones.map((zone) => <span key={zone}>{zone}</span>)}</div>
      <div className="settings-form-grid">
        <label><span>Delivery fee</span><input name="fee" defaultValue={delivery.fee} /></label>
        <label><span>Free delivery threshold</span><input name="freeThreshold" defaultValue={delivery.freeThreshold} /></label>
        <label><span>Minimum order</span><input name="minimumOrder" defaultValue={delivery.minimumOrder} /></label>
        <label><span>Delivery radius</span><input name="radius" defaultValue={delivery.radius} /></label>
        <label><span>Slot timings</span><input name="slots" defaultValue={delivery.slots} /></label>
        <label><span>Rider assignment</span><input name="assignment" defaultValue={delivery.assignment} /></label>
        <label><span>Map provider</span><input name="mapProvider" defaultValue={delivery.mapProvider} /></label>
      </div>
      <SettingsActions primary="Save delivery rules" secondary="Add delivery zone" onSecondary={onAddZone} tertiary={delivery.express ? "Disable express" : "Enable express"} onTertiary={onToggleExpress} extra="Test map" onExtra={onTestMap} />
    </form>
  );
}

function PaymentSettingsPanel({ payments, onSave, onTestGateway }: { payments: PaymentSettings; onSave: (event: FormEvent<HTMLFormElement>) => void; onTestGateway: () => void }) {
  return (
    <form className="settings-panel" onSubmit={onSave}>
      <SettingsPanelHead eyebrow="Payments" title="Payment rules" />
      <div className="settings-form-grid">
        <SettingToggle defaultChecked={payments.cod} label="COD enabled" name="cod" />
        <SettingToggle defaultChecked={payments.online} label="Online payment enabled" name="online" />
        <label><span>Gateway provider</span><input name="provider" defaultValue={payments.provider} /></label>
        <label><span>UPI ID</span><input name="upi" defaultValue={payments.upi} /></label>
        <label><span>COD limit</span><input name="codLimit" defaultValue={payments.codLimit} /></label>
        <label><span>Failed payment retry</span><input name="retryRule" defaultValue={payments.retryRule} /></label>
        <label className="settings-wide"><span>Refund rules</span><input name="refundRule" defaultValue={payments.refundRule} /></label>
      </div>
      <SettingsActions primary="Save payment rules" secondary="Test gateway" onSecondary={onTestGateway} />
    </form>
  );
}

function CheckoutSettingsPanel({ checkout, onReset, onSave }: { checkout: CheckoutSettings; onReset: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="settings-panel" onSubmit={onSave}>
      <SettingsPanelHead eyebrow="Checkout" title="Checkout behavior" />
      <div className="settings-form-grid">
        <label><span>Tax calculation</span><input name="tax" defaultValue={checkout.tax} /></label>
        <label><span>Packaging fee</span><input name="packagingFee" defaultValue={checkout.packagingFee} /></label>
        <label><span>Handling fee</span><input name="handlingFee" defaultValue={checkout.handlingFee} /></label>
        <label><span>Address validation</span><input name="addressValidation" defaultValue={checkout.addressValidation} /></label>
        <SettingToggle defaultChecked={checkout.substitutions} label="Allow substitutions" name="substitutions" />
        <SettingToggle defaultChecked={checkout.couponStacking} label="Allow coupon stacking" name="couponStacking" />
        <SettingToggle defaultChecked={checkout.wallet} label="Allow wallet / loyalty" name="wallet" />
      </div>
      <SettingsActions primary="Save checkout rules" secondary="Reset checkout defaults" onSecondary={onReset} />
    </form>
  );
}

function NotificationSettingsPanel({ notifications, onSave, onTest }: { notifications: NotificationSettings; onSave: (event: FormEvent<HTMLFormElement>) => void; onTest: (provider: string) => void }) {
  return (
    <form className="settings-panel" onSubmit={onSave}>
      <SettingsPanelHead eyebrow="Notifications" title="Notification providers" />
      <div className="settings-provider-grid">
        {[
          ["WhatsApp", notifications.whatsapp],
          ["SMS", notifications.sms],
          ["Email", notifications.email],
          ["Push", notifications.push]
        ].map(([label, provider]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{provider}</strong>
            <button type="button" onClick={() => onTest(label)}>Test {label}</button>
          </article>
        ))}
      </div>
      <div className="settings-form-grid">
        <label><span>WhatsApp provider</span><input name="whatsapp" defaultValue={notifications.whatsapp} /></label>
        <label><span>SMS provider</span><input name="sms" defaultValue={notifications.sms} /></label>
        <label><span>Email provider</span><input name="email" defaultValue={notifications.email} /></label>
        <label><span>Push provider</span><input name="push" defaultValue={notifications.push} /></label>
        <SettingToggle defaultChecked={notifications.adminAlerts} label="Admin alerts" name="adminAlerts" />
        <SettingToggle defaultChecked={notifications.customerOrderUpdates} label="Customer order updates" name="customerOrderUpdates" />
        <SettingToggle defaultChecked={notifications.marketingOptIn} label="Marketing messages" name="marketingOptIn" />
      </div>
      <SettingsActions primary="Save providers" />
    </form>
  );
}

function SecuritySettingsPanel({ security, onReviewAlerts, onSave }: { security: SecuritySettings; onReviewAlerts: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="settings-panel" onSubmit={onSave}>
      <SettingsPanelHead eyebrow="Security" title="Access and audit controls" />
      <div className="settings-form-grid">
        <SettingToggle defaultChecked={security.ownerTwoFactor} label="Owner 2FA active" name="ownerTwoFactor" />
        <SettingToggle defaultChecked={security.staffTwoFactor} label="Require staff 2FA" name="staffTwoFactor" />
        <SettingToggle defaultChecked={security.deviceTracking} label="Track login devices" name="deviceTracking" />
        <label><span>Session timeout</span><input name="sessionTimeout" defaultValue={security.sessionTimeout} /></label>
        <label><span>Failed login lockout</span><input name="lockout" defaultValue={security.lockout} /></label>
        <label><span>Role defaults</span><input name="roleDefaults" defaultValue={security.roleDefaults} /></label>
        <label><span>Audit retention</span><input name="auditRetention" defaultValue={security.auditRetention} /></label>
      </div>
      <SettingsActions primary="Save security" secondary="Review suspicious alerts" onSecondary={onReviewAlerts} />
    </form>
  );
}

function SupportSettingsPanel({ support, onSave, onTestInbox }: { support: SupportSettings; onSave: (event: FormEvent<HTMLFormElement>) => void; onTestInbox: () => void }) {
  return (
    <form className="settings-panel" onSubmit={onSave}>
      <SettingsPanelHead eyebrow="Support" title="Support rules" />
      <div className="settings-form-grid">
        <label><span>Working hours</span><input name="workingHours" defaultValue={support.workingHours} /></label>
        <SettingToggle defaultChecked={support.autoAssignment} label="Auto assign tickets" name="autoAssignment" />
        <label><span>Escalation rule</span><input name="escalationRule" defaultValue={support.escalationRule} /></label>
        <label><span>SLA timing</span><input name="sla" defaultValue={support.sla} /></label>
        <label><span>Refund handling</span><input name="refundHandling" defaultValue={support.refundHandling} /></label>
        <label><span>WhatsApp support</span><input name="whatsapp" defaultValue={support.whatsapp} /></label>
        <label><span>Email inbox</span><input name="inbox" defaultValue={support.inbox} /></label>
      </div>
      <SettingsActions primary="Save support rules" secondary="Test support inbox" onSecondary={onTestInbox} />
    </form>
  );
}

function SettingsAuditPanel({ audit }: { audit: SettingsAudit[] }) {
  return (
    <section className="settings-panel compact">
      <SettingsPanelHead eyebrow="Audit" title="Recent changes" />
      <div className="settings-audit-list">
        {audit.slice(0, 6).map((item) => (
          <article key={item.id}>
            <strong>{item.action}</strong>
            <span>{item.area} · {item.time}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function SettingsLegalPanel({ legal, onPreview, onSave }: { legal: LegalSettings; onPreview: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="settings-panel compact" onSubmit={onSave}>
      <SettingsPanelHead eyebrow="Tax and legal" title="Legal details" />
      <div className="settings-compact-form">
        <label><span>GST number</span><input name="gst" defaultValue={legal.gst} /></label>
        <label><span>Invoice prefix</span><input name="invoicePrefix" defaultValue={legal.invoicePrefix} /></label>
        <label><span>Tax slabs</span><input name="taxSlabs" defaultValue={legal.taxSlabs} /></label>
        <label><span>FSSAI/license</span><input name="license" defaultValue={legal.license} /></label>
        <label><span>Privacy URL</span><input name="privacyUrl" defaultValue={legal.privacyUrl} /></label>
        <label><span>Terms URL</span><input name="termsUrl" defaultValue={legal.termsUrl} /></label>
        <label><span>Refund URL</span><input name="refundUrl" defaultValue={legal.refundUrl} /></label>
      </div>
      <div className="settings-card-actions padded">
        <button type="submit">Save legal details</button>
        <button type="button" onClick={onPreview}>Preview invoice</button>
      </div>
    </form>
  );
}

function SettingsInventoryPanel({ inventoryPolicy, onSave, onToggleAutoReorder }: { inventoryPolicy: InventoryPolicySettings; onSave: (event: FormEvent<HTMLFormElement>) => void; onToggleAutoReorder: () => void }) {
  return (
    <form className="settings-panel compact" onSubmit={onSave}>
      <SettingsPanelHead eyebrow="Inventory" title="Inventory policies" />
      <div className="settings-compact-form">
        <label><span>Low stock threshold</span><input name="lowStock" defaultValue={inventoryPolicy.lowStock} /></label>
        <label><span>Expiry alert days</span><input name="expiryDays" defaultValue={inventoryPolicy.expiryDays} /></label>
        <label><span>Reservation timeout</span><input name="reservationTimeout" defaultValue={inventoryPolicy.reservationTimeout} /></label>
        <SettingToggle defaultChecked={inventoryPolicy.batchTracking} label="Batch tracking" name="batchTracking" />
        <SettingToggle defaultChecked={inventoryPolicy.supplierApproval} label="Supplier approval" name="supplierApproval" />
        <SettingToggle defaultChecked={inventoryPolicy.autoReorder} label="Auto reorder" name="autoReorder" />
      </div>
      <div className="settings-card-actions padded">
        <button type="submit">Save inventory rules</button>
        <button type="button" onClick={onToggleAutoReorder}>Toggle auto reorder</button>
      </div>
    </form>
  );
}

function SettingsPanelHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="settings-panel-head">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
    </div>
  );
}

function SettingsActions({
  primary,
  secondary,
  tertiary,
  extra,
  onSecondary,
  onTertiary,
  onExtra
}: {
  primary: string;
  secondary?: string;
  tertiary?: string;
  extra?: string;
  onSecondary?: () => void;
  onTertiary?: () => void;
  onExtra?: () => void;
}) {
  return (
    <div className="settings-actions">
      <button type="submit">{primary}</button>
      {secondary ? <button type="button" onClick={onSecondary}>{secondary}</button> : null}
      {tertiary ? <button type="button" onClick={onTertiary}>{tertiary}</button> : null}
      {extra ? <button type="button" onClick={onExtra}>{extra}</button> : null}
    </div>
  );
}

function ReportsView() {
  const [activeTab, setActiveTab] = useState<ReportTab>("Overview");
  const [range, setRange] = usePersistentState<ReportRange>("reports:range", "7 days");
  const [filters, setFilters] = usePersistentState<ReportFilters>("reports:filters", { category: "All categories", payment: "All payments", zone: "All zones", segment: "All customers" });
  const [exports, setExports] = usePersistentState<ReportExport[]>("reports:exports", initialReportExports);
  const [selectedInsight, setSelectedInsight] = useState<ReportInsight | null>(null);
  const [selectedRow, setSelectedRow] = useState<ReportRowDetail | null>(null);
  const [selectedExport, setSelectedExport] = useState<ReportExport | null>(null);
  const [notice, setNotice] = useState("Reports center is ready.");

  const reportTabs: ReportTab[] = ["Overview", "Sales", "Orders", "Inventory", "Customers", "Delivery", "Promotions", "Support", "Finance"];
  const reportRanges: ReportRange[] = ["Today", "7 days", "30 days", "Quarter"];
  const tableConfig = getReportTableConfig(activeTab);

  function changeTab(tab: ReportTab) {
    setActiveTab(tab);
    setNotice(`${tab} report loaded for ${range}.`);
  }

  function changeRange(nextRange: ReportRange) {
    setRange(nextRange);
    setNotice(`Report range changed to ${nextRange}.`);
  }

  function changeFilter(name: keyof ReportFilters, value: string) {
    setFilters((items) => ({ ...items, [name]: value }));
    setNotice(`${name} filter changed to ${value}.`);
  }

  function exportReport(format: ReportExport["format"]) {
    const createdExport: ReportExport = {
      id: `RP-${7004 + exports.length}`,
      title: `${activeTab} report - ${range}`,
      format,
      status: format === "XLSX" ? "Processing" : "Ready",
      time: "Just now"
    };

    setExports((items) => [createdExport, ...items]);
    setNotice(`${activeTab} report ${format === "XLSX" ? "is processing" : "exported"} as ${format}.`);
  }

  function scheduleReport() {
    const scheduledExport: ReportExport = {
      id: `RP-${7004 + exports.length}`,
      title: `${activeTab} weekly owner summary`,
      format: "PDF",
      status: "Scheduled",
      time: "Every Monday 8:00 AM"
    };

    setExports((items) => [scheduledExport, ...items]);
    setNotice(`${activeTab} weekly report scheduled for owner email.`);
  }

  function refreshReports() {
    setExports((items) =>
      items.map((item) => (item.status === "Processing" ? { ...item, status: "Ready", time: "Just now" } : item))
    );
    setNotice(`${activeTab} data refreshed from the latest operational projections.`);
  }

  function resetFilters() {
    setActiveTab("Overview");
    setRange("7 days");
    setFilters({ category: "All categories", payment: "All payments", zone: "All zones", segment: "All customers" });
    setNotice("Reports filters reset to Overview and 7 days.");
  }

  function downloadExport(item: ReportExport) {
    if (item.status === "Processing") {
      setNotice(`${item.title} is still processing. Refresh data to complete it.`);
      return;
    }

    setExports((items) => items.map((exportItem) => (exportItem.id === item.id ? { ...exportItem, time: "Downloaded just now" } : exportItem)));
    setNotice(`${item.title} ${item.format} download prepared.`);
  }

  function openExport(item: ReportExport) {
    setSelectedExport(item);
    setNotice(`${item.title} export details opened.`);
  }

  function cancelExport(item: ReportExport) {
    if (item.status === "Scheduled") {
      setExports((items) => items.filter((exportItem) => exportItem.id !== item.id));
      setNotice(`${item.title} schedule cancelled.`);
      return;
    }

    openExport(item);
  }

  function saveExportReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedExport) return;
    const formData = new FormData(event.currentTarget);
    const updatedExport: ReportExport = {
      ...selectedExport,
      title: String(formData.get("title") || selectedExport.title).trim(),
      format: String(formData.get("format") || selectedExport.format) as ReportExport["format"],
      status: String(formData.get("status") || selectedExport.status) as ReportExport["status"],
      time: String(formData.get("time") || selectedExport.time).trim()
    };
    setExports((items) => items.map((item) => (item.id === updatedExport.id ? updatedExport : item)));
    setSelectedExport(null);
    setNotice(`${updatedExport.title} export settings saved.`);
  }

  function openReportRow(row: string[], columns: string[]) {
    const detail = { title: `${activeTab} detail: ${row[0]}`, columns, row };
    setSelectedRow(detail);
    setNotice(`${row[0]} detail opened.`);
  }

  function exportReportRow(row: string[], format: ReportExport["format"] = "CSV") {
    const rowExport: ReportExport = {
      id: `RP-${7004 + exports.length}`,
      title: `${activeTab} detail - ${row[0]}`,
      format,
      status: format === "XLSX" ? "Processing" : "Ready",
      time: "Just now"
    };

    setExports((items) => [rowExport, ...items]);
    setNotice(`${row[0]} exported as ${format}.`);
  }

  function openConnectedModule(row: string[]) {
    const hrefMap: Record<ReportTab, string> = {
      Overview: "/dashboard",
      Sales: "/products",
      Orders: "/orders",
      Inventory: "/inventory",
      Customers: "/customers",
      Delivery: "/delivery",
      Promotions: "/promotions",
      Support: "/support",
      Finance: "/settings"
    };

    setNotice(`Opening connected module for ${row[0]}.`);
    window.location.href = hrefMap[activeTab];
  }

  function addInsightToSummary(insight: ReportInsight) {
    const summaryExport: ReportExport = {
      id: `RP-${7004 + exports.length}`,
      title: `Owner summary note - ${insight.title}`,
      format: "PDF",
      status: "Scheduled",
      time: "Next owner summary"
    };

    setExports((items) => [summaryExport, ...items]);
    setSelectedInsight(null);
    setNotice(`${insight.title} added to the owner summary.`);
  }

  return (
    <>
      {notice ? <div className="admin-notice">{notice}</div> : null}
      <section className="reports-command">
        <div>
          <span>Business intelligence</span>
          <h2>Reports and analytics center</h2>
          <p>Track sales, orders, inventory, customers, delivery, promotions, support, and finance from one owner-ready reporting module.</p>
          <div className="reports-tabs">
            {reportTabs.map((tab) => (
              <button className={activeTab === tab ? "active" : ""} key={tab} type="button" onClick={() => changeTab(tab)}>
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="reports-command-actions">
          <button className="primary-action" type="button" onClick={() => exportReport("PDF")}>Export PDF</button>
          <button type="button" onClick={() => exportReport("CSV")}>Export CSV</button>
          <button type="button" onClick={() => exportReport("XLSX")}>Export Excel</button>
          <button type="button" onClick={scheduleReport}>Schedule email</button>
          <button type="button" onClick={refreshReports}>Refresh data</button>
          <button type="button" onClick={resetFilters}>Reset filters</button>
        </div>
      </section>

      <section className="reports-stat-grid">
        {reportMetrics.map((metric) => (
          <button key={metric.label} type="button" onClick={() => setNotice(`${metric.label} metric selected: ${metric.value} (${metric.change}).`)}>
            <div>
              <span>{metric.label}</span>
              <small>{metric.detail}</small>
            </div>
            <strong>{metric.value}</strong>
            <b>{metric.change}</b>
          </button>
        ))}
      </section>

      <section className="reports-layout">
        <div className="reports-main-stack">
          <section className="reports-panel">
            <div className="reports-panel-head">
              <div>
                <span>Revenue trend</span>
                <h2>{activeTab} performance</h2>
              </div>
              <div className="reports-range-tabs">
                {reportRanges.map((item) => (
                  <button className={range === item ? "active" : ""} key={item} type="button" onClick={() => changeRange(item)}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <ReportFilterStrip filters={filters} onChange={changeFilter} />
            <ReportRevenueChart onSelect={(item) => setNotice(`${item.label} revenue selected: ${item.amount}.`)} />
          </section>

          <ReportTable
            columns={tableConfig.columns}
            rows={tableConfig.rows}
            title={tableConfig.title}
            eyebrow={activeTab}
            onExport={exportReportRow}
            onOpen={openReportRow}
            onOpenModule={openConnectedModule}
          />
        </div>

        <div className="reports-side-stack">
          <ReportInsights insights={reportInsights} onReview={(insight) => { setSelectedInsight(insight); setNotice(`${insight.title} opened for review.`); }} />
          <ReportExportsPanel exports={exports} onCancel={cancelExport} onDownload={downloadExport} onOpen={openExport} />
        </div>
      </section>

      {selectedInsight ? <ReportInsightDialog insight={selectedInsight} onAdd={() => addInsightToSummary(selectedInsight)} onClose={() => setSelectedInsight(null)} /> : null}
      {selectedRow ? <ReportRowDialog detail={selectedRow} onClose={() => setSelectedRow(null)} onExport={(format) => { exportReportRow(selectedRow.row, format); setSelectedRow(null); }} /> : null}
      {selectedExport ? <ReportExportDialog item={selectedExport} onClose={() => setSelectedExport(null)} onDownload={() => { downloadExport(selectedExport); setSelectedExport(null); }} onSave={saveExportReview} /> : null}
    </>
  );
}

function getReportTableConfig(tab: ReportTab) {
  const configs: Record<ReportTab, { title: string; columns: string[]; rows: string[][] }> = {
    Overview: {
      title: "Category revenue mix",
      columns: ["Segment", "Revenue", "Orders", "Share", "Trend"],
      rows: reportCategoryRows
    },
    Sales: {
      title: "Sales by category",
      columns: ["Category", "Revenue", "Orders", "Share", "Trend"],
      rows: reportCategoryRows
    },
    Orders: {
      title: "Order status report",
      columns: ["Status", "Orders", "Share", "Revenue"],
      rows: reportOrderRows
    },
    Inventory: {
      title: "Inventory risk report",
      columns: ["Signal", "Count", "Area", "Priority"],
      rows: reportInventoryRows
    },
    Customers: {
      title: "Customer segment report",
      columns: ["Segment", "Customers", "Avg spend", "Rating"],
      rows: reportCustomerRows
    },
    Delivery: {
      title: "Delivery performance report",
      columns: ["Metric", "Value", "Context", "Trend"],
      rows: reportDeliveryRows
    },
    Promotions: {
      title: "Coupon and promotion report",
      columns: ["Campaign", "Revenue", "Usage", "Conversion"],
      rows: reportPromotionRows
    },
    Support: {
      title: "Support operations report",
      columns: ["Metric", "Volume", "Context", "Trend"],
      rows: reportSupportRows
    },
    Finance: {
      title: "Finance summary report",
      columns: ["Metric", "Amount", "Context", "Trend"],
      rows: reportFinanceRows
    }
  };

  return configs[tab];
}

function ReportFilterStrip({
  filters,
  onChange
}: {
  filters: ReportFilters;
  onChange: (name: keyof ReportFilters, value: string) => void;
}) {
  return (
    <div className="report-filter-strip">
      <label>
        <span>Category</span>
        <select value={filters.category} onChange={(event) => onChange("category", event.target.value)}>
          <option>All categories</option>
        </select>
      </label>
      <label>
        <span>Payment</span>
        <select value={filters.payment} onChange={(event) => onChange("payment", event.target.value)}>
          <option>All payments</option>
          <option>COD</option>
          <option>Online</option>
          <option>Refunded</option>
        </select>
      </label>
      <label>
        <span>Zone</span>
        <select value={filters.zone} onChange={(event) => onChange("zone", event.target.value)}>
          <option>All zones</option>
          <option>Bandra</option>
          <option>Andheri</option>
          <option>Juhu</option>
          <option>Lower Parel</option>
        </select>
      </label>
      <label>
        <span>Segment</span>
        <select value={filters.segment} onChange={(event) => onChange("segment", event.target.value)}>
          <option>All customers</option>
          <option>VIP customers</option>
          <option>Repeat buyers</option>
          <option>New customers</option>
          <option>At risk</option>
        </select>
      </label>
    </div>
  );
}

function ReportRevenueChart({ onSelect }: { onSelect: (item: ReportSeries) => void }) {
  return (
    <div className="report-chart">
      {reportRevenueSeries.map((item) => (
        <button className="report-bar" key={item.label} type="button" onClick={() => onSelect(item)}>
          <span>{item.amount}</span>
          <div style={{ height: `${item.value}%` }} />
          <strong>{item.label}</strong>
        </button>
      ))}
    </div>
  );
}

function ReportTable({
  columns,
  eyebrow,
  rows,
  title,
  onExport,
  onOpen,
  onOpenModule
}: {
  columns: string[];
  eyebrow: string;
  rows: string[][];
  title: string;
  onExport: (row: string[]) => void;
  onOpen: (row: string[], columns: string[]) => void;
  onOpenModule: (row: string[]) => void;
}) {
  const gridTemplateColumns = `repeat(${columns.length}, minmax(120px, 1fr)) 240px`;

  return (
    <section className="reports-panel">
      <div className="reports-panel-head">
        <div>
          <span>{eyebrow}</span>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="report-table">
        <div className="report-row report-row-head" style={{ gridTemplateColumns }}>
          {columns.map((column) => <span key={column}>{column}</span>)}
          <span>Actions</span>
        </div>
        {rows.map((row) => (
          <div className="report-row" key={row.join("-")} style={{ gridTemplateColumns }}>
            {row.map((cell, index) => (
              <span key={`${cell}-${index}`}>{cell}</span>
            ))}
            <div className="report-actions">
              <button type="button" onClick={() => onOpen(row, columns)}>Open</button>
              <button type="button" onClick={() => onExport(row)}>Export</button>
              <button type="button" onClick={() => onOpenModule(row)}>Module</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReportInsights({
  insights,
  onReview
}: {
  insights: ReportInsight[];
  onReview: (insight: ReportInsight) => void;
}) {
  return (
    <section className="reports-panel compact">
      <div className="reports-panel-head">
        <div>
          <span>Insights</span>
          <h2>Owner actions</h2>
        </div>
      </div>
      <div className="report-insight-list">
        {insights.map((insight) => (
          <article key={insight.title}>
            <div>
              <strong>{insight.title}</strong>
              <span>{insight.detail}</span>
            </div>
            <Badge label={insight.priority} />
            <button type="button" onClick={() => onReview(insight)}>Review</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function ReportExportsPanel({
  exports,
  onCancel,
  onDownload,
  onOpen
}: {
  exports: ReportExport[];
  onCancel: (item: ReportExport) => void;
  onDownload: (item: ReportExport) => void;
  onOpen: (item: ReportExport) => void;
}) {
  return (
    <section className="reports-panel compact">
      <div className="reports-panel-head">
        <div>
          <span>Exports</span>
          <h2>Generated reports</h2>
        </div>
      </div>
      <div className="report-export-list">
        {exports.map((item) => (
          <article key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <span>{item.id} · {item.format} · {item.time}</span>
            </div>
            <Badge label={item.status} />
            <div className="report-actions">
              <button type="button" onClick={() => onDownload(item)}>Download</button>
              <button type="button" onClick={() => (item.status === "Scheduled" ? onCancel(item) : onOpen(item))}>{item.status === "Scheduled" ? "Cancel" : "Open"}</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ReportInsightDialog({ insight, onAdd, onClose }: { insight: ReportInsight; onAdd: () => void; onClose: () => void }) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog report-dialog" onSubmit={(event) => { event.preventDefault(); onAdd(); }}>
        <div className="product-dialog-head">
          <div>
            <span>{insight.priority} priority insight</span>
            <h3>{insight.title}</h3>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <div className="settings-form-grid">
          <label className="settings-wide"><span>Insight detail</span><textarea name="detail" defaultValue={insight.detail} rows={4} /></label>
          <label><span>Priority</span><select name="priority" defaultValue={insight.priority}><option>Low</option><option>Medium</option><option>High</option></select></label>
          <label><span>Summary state</span><select name="summaryState" defaultValue="Add to next report"><option>Add to next report</option><option>Needs manager review</option><option>Monitor only</option></select></label>
          <label className="settings-wide"><span>Recommended next step</span><input name="nextStep" defaultValue="Review the connected module, compare the previous period, and export this report for the owner summary." /></label>
        </div>
        <div className="product-dialog-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">Add to owner summary</button>
        </div>
      </form>
    </div>
  );
}

function ReportRowDialog({
  detail,
  onClose,
  onExport
}: {
  detail: ReportRowDetail;
  onClose: () => void;
  onExport: (format: ReportExport["format"]) => void;
}) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog report-dialog" onSubmit={(event) => { event.preventDefault(); const formData = new FormData(event.currentTarget); onExport(String(formData.get("format") || "CSV") as ReportExport["format"]); }}>
        <div className="product-dialog-head">
          <div>
            <span>Report detail</span>
            <h3>{detail.title}</h3>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <div className="settings-form-grid">
          {detail.columns.map((column, index) => (
            <label key={column}><span>{column}</span><input value={detail.row[index]} readOnly /></label>
          ))}
          <label><span>Export format</span><select name="format" defaultValue="CSV"><option>CSV</option><option>PDF</option><option>XLSX</option></select></label>
          <label><span>Send to</span><input name="recipient" defaultValue="owner@freshcart.local" /></label>
          <label className="settings-wide"><span>Review note</span><input name="note" defaultValue={`Export ${detail.row[0]} with current ${detail.title.split(":")[0]} filters.`} /></label>
        </div>
        <div className="product-dialog-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">Export this row</button>
        </div>
      </form>
    </div>
  );
}

function ReportExportDialog({
  item,
  onClose,
  onDownload,
  onSave
}: {
  item: ReportExport;
  onClose: () => void;
  onDownload: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="product-dialog-backdrop">
      <form className="product-dialog report-dialog" onSubmit={onSave}>
        <div className="product-dialog-head">
          <div>
            <span>{item.id}</span>
            <h3>{item.title}</h3>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <div className="settings-form-grid">
          <label className="settings-wide"><span>Title</span><input name="title" defaultValue={item.title} /></label>
          <label><span>Format</span><select name="format" defaultValue={item.format}><option>CSV</option><option>PDF</option><option>XLSX</option></select></label>
          <label><span>Status</span><select name="status" defaultValue={item.status}><option>Ready</option><option>Scheduled</option><option>Processing</option></select></label>
          <label><span>Generated / schedule</span><input name="time" defaultValue={item.time} /></label>
          <label><span>Access</span><input value="Owner and authorized staff" readOnly /></label>
        </div>
        <div className="product-dialog-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button" onClick={onDownload}>Download now</button>
          <button type="submit">Save export</button>
        </div>
      </form>
    </div>
  );
}

function OrdersTable({ compact = false, items = orders }: { compact?: boolean; items?: AdminOrder[] }) {
  return (
    <DataTable
      columns={compact ? ["Order", "Customer", "Status", "Payment", "Total"] : ["Order", "Customer", "Phone", "Status", "Fulfillment", "Payment", "Slot", "Total"]}
      rows={items.map((order) =>
        compact
          ? [order.id, order.customer, order.status, order.payment, order.total]
          : [order.id, order.customer, order.phone, order.status, order.fulfillment, order.payment, order.slot, order.total]
      )}
    />
  );
}

function InventoryList({ items = inventory }: { items?: AdminInventoryItem[] | typeof inventory }) {
  return (
    <Panel title="Stock watchlist" eyebrow="Inventory" action="Manage" actionHref="/inventory">
      <div className="list-stack">
        {items.map((item) => (
          <article key={item.sku}>
            <div>
              <strong>{item.product}</strong>
              <span>{item.sku}</span>
            </div>
            <div>
              <strong>{item.available}</strong>
              <span>{item.reserved} reserved</span>
            </div>
            <Badge label={item.status} />
          </article>
        ))}
      </div>
    </Panel>
  );
}

function SupportList({ items = support }: { items?: AdminSupportTicket[] | typeof support }) {
  return (
    <Panel title="Inbox preview" eyebrow="Support" action="Open inbox" actionHref="/support">
      <div className="list-stack">
        {items.map((item) => (
          <article key={item.customer}>
            <div>
              <strong>{item.customer}</strong>
              <span>{item.topic}</span>
            </div>
            <div>
              <Badge label={item.state} />
              <span>{item.time}</span>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function DeliveryMap() {
  return (
    <Panel title="Active delivery map" eyebrow="Mapbox tracking" action="Open map" actionHref="/delivery">
      <div className="admin-map">
        <span className="route" />
        <span className="map-node store">Store</span>
        <span className="map-node rider">Rider 07</span>
        <span className="map-node customer">Customer</span>
      </div>
    </Panel>
  );
}

function ModuleActions({
  title,
  text,
  actions,
  onAction = () => undefined
}: {
  title: string;
  text: string;
  actions: string[];
  onAction?: (action: string) => void;
}) {
  return (
    <section className="module-actions">
      <div>
        <span>Module</span>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      <div className="action-stack horizontal">
        {actions.map((action) => (
          <button key={action} type="button" onClick={() => onAction(action)}>{action}</button>
        ))}
      </div>
    </section>
  );
}

function Panel({
  eyebrow,
  title,
  action,
  actionHref,
  onAction = () => undefined,
  children
}: {
  eyebrow: string;
  title: string;
  action?: string;
  actionHref?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  return (
    <article className="panel">
      <div className="panel-heading">
        <div>
          <span>{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        {action ? (
          actionHref ? (
            <a className="panel-action" href={actionHref}>{action}</a>
          ) : (
            <button type="button" onClick={onAction}>{action}</button>
          )
        ) : null}
      </div>
      {children}
    </article>
  );
}

function DataTable({ columns, rows }: { columns: string[]; rows: Array<Array<string | number>> }) {
  return (
    <div className="data-table">
      <div className="data-row data-head" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(130px, 1fr))` }}>
        {columns.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>
      {rows.map((row) => (
        <div className="data-row" key={row.join("-")} style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(130px, 1fr))` }}>
          {row.map((cell, index) => (
            <span key={`${cell}-${index}`}>{cell}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

function Badge({ label }: { label: string }) {
  const danger = label.includes("Out") || label.includes("Open");
  const warning = label.includes("Low") || label.includes("Pending") || label.includes("Packed");
  return <span className={danger ? "badge danger" : warning ? "badge warning" : "badge"}>{label}</span>;
}

function getTitle(view: AdminView) {
  const titles: Record<AdminView, string> = {
    dashboard: "Operations Dashboard",
    products: "Product catalog management",
    categories: "Category management",
    orders: "Order processing queue",
    inventory: "Inventory and supplier control",
    suppliers: "Supplier management",
    delivery: "Delivery operations and live map",
    support: "Support inbox and customer context",
    customers: "Customer profiles and order history",
    coupons: "Coupons and promotions",
    promotions: "Promotion placements",
    refunds: "Refunds and returns",
    finance: "Finance control center",
    "audit-logs": "Audit logs and security trail",
    content: "Content manager",
    account: "Admin account",
    reviews: "Reviews and ratings",
    loyalty: "Loyalty and wallet",
    branches: "Store locations and branches",
    legal: "Legal and compliance",
    notifications: "Notification jobs and templates",
    staff: "Staff, roles, and permissions",
    reports: "Reports and business analytics",
    settings: "Store, payment, support, and delivery settings"
  };

  return titles[view];
}
