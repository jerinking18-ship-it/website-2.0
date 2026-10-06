const { PrismaClient } = require("@prisma/client");
const { existsSync } = require("node:fs");
const { unlink } = require("node:fs/promises");
const { join } = require("node:path");

const apiBase = process.env.API_BASE_URL || "http://127.0.0.1:4000/api";
const adminEmail = process.env.SMOKE_ADMIN_EMAIL || "owner@freshcart.local";
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || "Freshcart@12345";
const adminTwoFactorCode = process.env.ADMIN_DEV_2FA_CODE || "123456";
const stamp = `QA${Date.now()}`;
const branchCode = `${stamp}-BR`;
const riderName = `${stamp} Rider`;
const deliveryOrderNumber = `${stamp}-DELIVERY`;
const supportCustomerName = `${stamp} Support Customer`;
const supportCustomerPhone = `+9166${String(Date.now()).slice(-8)}`;
const tinyPng =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
const uploadedMediaUrls = [];
const prisma = new PrismaClient();

async function request(path, options = {}) {
  const { data } = await requestWithResponse(path, options);
  return data;
}

async function requestWithResponse(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${path} failed (${response.status}): ${JSON.stringify(payload)}`);
  }
  return { data: payload.data ?? payload, response };
}

async function expectUnauthorized(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });
  if (response.status !== 401) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(`${options.method || "GET"} ${path} should require admin auth, got ${response.status}: ${JSON.stringify(payload)}`);
  }
}

async function login() {
  const loginResponse = await request("/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ email: adminEmail, password: adminPassword })
  });
  if (!loginResponse.requiresTwoFactor) return loginResponse.token;
  const verifyResponse = await request("/auth/admin/verify-2fa", {
    method: "POST",
    body: JSON.stringify({ challengeToken: loginResponse.challengeToken, code: adminTwoFactorCode })
  });
  return verifyResponse.token;
}

function authed(token, options = {}) {
  return {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  };
}

async function cleanup() {
  const qaOrders = await prisma.order.findMany({ where: { orderNumber: { startsWith: stamp } }, select: { id: true } }).catch(() => []);
  const qaOrderIds = qaOrders.map((order) => order.id);
  const qaSupportCustomers = await prisma.customer.findMany({ where: { OR: [{ phone: supportCustomerPhone }, { firstName: stamp }] }, select: { id: true } }).catch(() => []);
  const qaSupportCustomerIds = qaSupportCustomers.map((customer) => customer.id);
  const qaNotifications = await prisma.notificationJob
    .findMany({ where: { OR: [{ recipient: supportCustomerPhone }, { recipient: { in: qaSupportCustomerIds } }, { subject: { startsWith: stamp } }] }, select: { id: true } })
    .catch(() => []);
  const qaNotificationIds = qaNotifications.map((notification) => notification.id);
  await prisma.notificationDeliveryAttempt.deleteMany({ where: { notificationJobId: { in: qaNotificationIds } } }).catch(() => undefined);
  await prisma.notificationJob.deleteMany({ where: { OR: [{ recipient: supportCustomerPhone }, { recipient: { in: qaSupportCustomerIds } }, { subject: { startsWith: stamp } }] } }).catch(() => undefined);
  await prisma.supportMessage.deleteMany({ where: { conversation: { customerId: { in: qaSupportCustomerIds } } } }).catch(() => undefined);
  await prisma.supportConversation.deleteMany({ where: { customerId: { in: qaSupportCustomerIds } } }).catch(() => undefined);
  await prisma.walletTransaction.deleteMany({ where: { wallet: { customerId: { in: qaSupportCustomerIds } } } }).catch(() => undefined);
  await prisma.wallet.deleteMany({ where: { customerId: { in: qaSupportCustomerIds } } }).catch(() => undefined);
  await prisma.customerNotificationPreference.deleteMany({ where: { customerId: { in: qaSupportCustomerIds } } }).catch(() => undefined);
  await prisma.deliveryLocationPing.deleteMany({ where: { deliveryAssignment: { orderId: { in: qaOrderIds } } } }).catch(() => undefined);
  await prisma.deliveryAssignment.deleteMany({ where: { orderId: { in: qaOrderIds } } }).catch(() => undefined);
  await prisma.refundRequest.deleteMany({ where: { orderId: { in: qaOrderIds } } }).catch(() => undefined);
  await prisma.payment.deleteMany({ where: { orderId: { in: qaOrderIds } } }).catch(() => undefined);
  await prisma.orderStatusHistory.deleteMany({ where: { orderId: { in: qaOrderIds } } }).catch(() => undefined);
  await prisma.orderItem.deleteMany({ where: { orderId: { in: qaOrderIds } } }).catch(() => undefined);
  await prisma.order.deleteMany({ where: { id: { in: qaOrderIds } } }).catch(() => undefined);
  await prisma.customer.deleteMany({ where: { id: { in: qaSupportCustomerIds } } }).catch(() => undefined);
  await prisma.stockLedger.deleteMany({ where: { inventoryItem: { sku: { startsWith: stamp } } } }).catch(() => undefined);
  await prisma.productImage.deleteMany({ where: { product: { sku: { startsWith: stamp } } } }).catch(() => undefined);
  await prisma.inventoryBatch.deleteMany({ where: { inventoryItem: { sku: { startsWith: stamp } } } }).catch(() => undefined);
  await prisma.inventoryItem.deleteMany({ where: { sku: { startsWith: stamp } } }).catch(() => undefined);
  await prisma.deliverySlot.deleteMany({ where: { branch: { code: branchCode } } }).catch(() => undefined);
  await prisma.branchServiceArea.deleteMany({ where: { branch: { code: branchCode } } }).catch(() => undefined);
  await prisma.branch.deleteMany({ where: { code: branchCode } }).catch(() => undefined);
  await prisma.categoryProductMapping.deleteMany({ where: { sku: { startsWith: stamp } } }).catch(() => undefined);
  await prisma.product.deleteMany({ where: { sku: { startsWith: stamp } } }).catch(() => undefined);
  await prisma.categoryOfferPlacement.deleteMany({ where: { id: { startsWith: stamp } } }).catch(() => undefined);
  await prisma.promotionSyncEventRecord.deleteMany({ where: { id: { startsWith: stamp } } }).catch(() => undefined);
  await prisma.supplierExportRecord.deleteMany({ where: { id: { startsWith: stamp } } }).catch(() => undefined);
  await prisma.financeInvoice.deleteMany({ where: { OR: [{ id: { startsWith: `CN-${stamp}` } }, { reference: { startsWith: stamp } }] } }).catch(() => undefined);
  await prisma.storefrontPlacement
    .deleteMany({ where: { OR: [{ key: { startsWith: stamp.toLowerCase() } }, { title: { startsWith: stamp } }] } })
    .catch(() => undefined);
  await prisma.promotion.deleteMany({ where: { title: { startsWith: stamp } } }).catch(() => undefined);
  await prisma.coupon.deleteMany({ where: { code: { startsWith: stamp } } }).catch(() => undefined);
  await prisma.deliveryPartner.deleteMany({ where: { name: riderName } }).catch(() => undefined);
  await prisma.category.deleteMany({ where: { slug: { startsWith: stamp.toLowerCase() } } }).catch(() => undefined);
  await cleanupUploadedMedia();
}

function trackUploadedMedia(url) {
  if (typeof url === "string" && url.includes("/uploads/")) uploadedMediaUrls.push(url);
}

async function cleanupUploadedMedia() {
  const root = existsSync(join(process.cwd(), "apps/api/package.json")) ? join(process.cwd(), "apps/api/public/uploads") : join(process.cwd(), "public/uploads");
  for (const url of uploadedMediaUrls.splice(0)) {
    const pathname = new URL(url, "http://localhost").pathname;
    if (!pathname.startsWith("/uploads/")) continue;
    await unlink(join(root, pathname.replace(/^\/uploads\//, ""))).catch(() => undefined);
  }
}

async function run() {
  await cleanup();
  const token = await login();
  const checks = [];

  const health = await request("/health");
  if (health.status !== "ok" || health.database !== "up") throw new Error("health endpoint did not report an operational database");
  const live = await request("/live");
  if (live.status !== "alive") throw new Error("live endpoint did not report alive status");
  const readyResult = await requestWithResponse("/ready", { headers: { "x-request-id": `${stamp}-request-id` } });
  if (readyResult.data.status !== "ready") throw new Error("ready endpoint did not report ready status");
  if (readyResult.response.headers.get("x-request-id") !== `${stamp}-request-id`) throw new Error("request ID was not echoed in response headers");
  checks.push("ops:health-live-ready-request-id");

  await expectUnauthorized("/admin/products");
  await expectUnauthorized("/auth/admin/sessions");
  checks.push("auth:protected-admin-routes");

  const adminPermissions = await request("/auth/admin/permissions", authed(token));
  if (!adminPermissions.grantedPermissions.some((permission) => permission.key === "products.manage")) {
    throw new Error("admin permissions did not include granted role permissions");
  }
  const adminSessions = await request("/auth/admin/sessions", authed(token));
  if (!adminSessions.sessions.some((session) => session.current && session.active)) throw new Error("admin sessions did not mark the current session active");
  checks.push("auth:admin-permissions-sessions");

  const category = (await request(
    "/admin/categories",
    authed(token, {
      method: "POST",
      body: JSON.stringify({
        name: `${stamp} Category`,
        slug: `${stamp.toLowerCase()}-category`,
        image: tinyPng,
        status: "Active",
        featured: true,
        order: 1,
        banner: "QA category banner",
        seoTitle: "QA Category",
        seoDescription: "QA category description"
      })
    })
  )).category;
  trackUploadedMedia(category.image);
  if (!String(category.image || "").includes("/uploads/")) throw new Error("category upload did not return a served media URL");
  checks.push(`category:create:${category.id}`);

  const updatedCategory = (await request(
    `/admin/categories/${category.id}`,
    authed(token, { method: "PATCH", body: JSON.stringify({ status: "Hidden", featured: false }) })
  )).category;
  if (updatedCategory.status !== "Paused" && updatedCategory.status !== "Hidden") throw new Error("category status patch did not persist");
  checks.push("category:update");

  const product = (await request(
    "/admin/products",
    authed(token, {
      method: "POST",
      body: JSON.stringify({
        name: `${stamp} Product`,
        sku: `${stamp}-SKU`,
        categoryId: category.id,
        unit: "1 pack",
        price: "Rs. 99",
        sale: "Rs. 89",
        stock: "In stock",
        status: "Active",
        imageFile: tinyPng
      })
    })
  )).product;
  trackUploadedMedia(product.imageFile);
  if (!String(product.imageFile || "").includes("/uploads/")) throw new Error("product upload did not return a served media URL");
  checks.push(`product:create:${product.id}`);

  const clientSearch = await request(`/products?search=${encodeURIComponent(stamp)}&limit=10`);
  if (!clientSearch.items.some((item) => item.id === product.id)) throw new Error("admin-created product was not visible in client product search");
  const clientSuggestions = await request(`/search/suggestions?q=${encodeURIComponent(stamp)}&limit=8`);
  if (!clientSuggestions.products.some((item) => item.id === product.id)) throw new Error("admin-created product was not visible in client search suggestions");
  checks.push("catalog:admin-product-client-search");

  const searchReindex = await request("/admin/search/reindex", authed(token, { method: "POST", body: JSON.stringify({}) }));
  if (searchReindex.configured && searchReindex.available === false) {
    checks.push("search:reindex-unavailable-fallback");
  } else if (searchReindex.configured && searchReindex.products < 1) {
    throw new Error("search reindex did not include active products");
  } else {
    checks.push("search:reindex");
  }

  const updatedProduct = (await request(
    `/admin/products/${product.id}`,
    authed(token, { method: "PATCH", body: JSON.stringify({ stock: "Low stock", badge: "QA" }) })
  )).product;
  if (updatedProduct.stock !== "Low stock") throw new Error("product stock patch did not persist");
  checks.push("product:update");

  const bulk = await request(
    "/admin/products/bulk/status",
    authed(token, { method: "PATCH", body: JSON.stringify({ skus: [product.sku], status: "Active", stock: "In stock" }) })
  );
  if (bulk.updated < 1) throw new Error("product bulk status did not update any product");
  checks.push("product:bulk-status");

  await prisma.branch.create({
    data: {
      name: `${stamp} Inventory Branch`,
      code: branchCode,
      addressLine1: "QA Street",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400001",
      active: true
    }
  });
  await prisma.order.create({
    data: {
      orderNumber: deliveryOrderNumber,
      customerId: (await prisma.customer.create({
        data: {
          firstName: stamp,
          lastName: "Delivery Customer",
          phone: supportCustomerPhone,
          status: "ACTIVE",
          notifications: { create: { orderUpdates: true, whatsapp: true, sms: true, email: false } }
        }
      })).id,
      status: "PACKED",
      paymentStatus: "COD_PENDING",
      fulfillmentStatus: "PACKED",
      subtotal: 240,
      deliveryFee: 20,
      total: 260,
      branchId: (await prisma.branch.findUnique({ where: { code: branchCode } })).id,
      deliveryAddressSnapshot: {
        customer: "QA Delivery Customer",
        phone: "+91 90000 00000",
        slot: "QA slot",
        zone: "QA zone",
        payableTotal: 260
      },
      payments: {
        create: {
          method: "CASH_ON_DELIVERY",
          status: "COD_PENDING",
          amount: 260
        }
      },
      statusHistory: { create: { status: "PACKED", note: "QA packed order ready for delivery" } }
    }
  });

  const coupon = (await request(
    "/admin/coupons",
    authed(token, {
      method: "POST",
      body: JSON.stringify({
        code: `${stamp}10`,
        campaign: `${stamp} Campaign`,
        type: "Percent",
        value: "10%",
        minCart: "Rs. 100",
        maxDiscount: "Rs. 50",
        segment: "All customers",
        status: "Active"
      })
    })
  )).coupon;
  checks.push(`coupon:create:${coupon.code}`);

  await request(`/admin/coupons/${coupon.code}`, authed(token, { method: "PATCH", body: JSON.stringify({ status: "Paused" }) }));
  checks.push("coupon:update");

  const promotion = (await request(
    "/admin/promotions",
    authed(token, {
      method: "POST",
      body: JSON.stringify({
        title: `${stamp} Promotion`,
        type: "Homepage banner",
        placement: "Homepage hero",
        audience: "All customers",
        status: "Scheduled",
        priority: 1,
        coupon: coupon.code,
        value: "10% off",
        targetUrl: "/products"
      })
    })
  )).promotion;
  checks.push(`promotion:create:${promotion.id}`);

  await request(`/admin/promotions/${promotion.id}`, authed(token, { method: "PATCH", body: JSON.stringify({ status: "Live", priority: 2 }) }));
  checks.push("promotion:update");

  const banner = (await request(
    "/admin/coupon-banners",
    authed(token, {
      method: "POST",
      body: JSON.stringify({
        title: `${stamp} Banner`,
        placement: "Homepage hero",
        status: "Live",
        priority: 1,
        audience: "All customers",
        cta: "Shop now",
        target: "/products",
        image: tinyPng
      })
    })
  )).banner;
  trackUploadedMedia(banner.image);
  if (!String(banner.image || "").includes("/uploads/")) throw new Error("banner upload did not return a served media URL");
  checks.push(`banner:create:${banner.id}`);

  await request(`/admin/coupon-banners/${banner.id}`, authed(token, { method: "PATCH", body: JSON.stringify({ status: "Paused" }) }));
  checks.push("banner:update");

  const statePayloads = {
    "categories:mappings": [{ sku: product.sku, product: product.name, categoryId: category.id, status: "Active", sales: "Rs. 0" }],
    "categories:offers": [{ id: `${stamp}-OFFER`, categoryId: category.id, title: `${stamp} category offer`, placement: "Category banner", status: "Scheduled", valid: "QA window" }],
    "suppliers:exports": [{ id: `${stamp}-SUP-EXPORT`, title: "QA supplier export", format: "CSV", status: "Ready", time: "Just now" }],
    "promotions:sync-events": [{ id: `${stamp}-SYNC`, message: "QA promotion sync completed.", time: "Just now" }],
    "support:queue": [
      {
        customer: supportCustomerName,
        phone: supportCustomerPhone,
        topic: "Missing item",
        state: "Pending",
        agent: "Owner",
        order: `${stamp}-SUPPORT`,
        time: "Just now",
        customerMessage: "One QA item is missing from my order.",
        agentMessage: "We are checking the packing log and will update you shortly.",
        channel: "Admin chat"
      }
    ],
    "delivery:queue": [
      {
        order: deliveryOrderNumber,
        rider: riderName,
        status: "Delivered",
        eta: "0 min",
        zone: "QA zone",
        latitude: "19.076",
        longitude: "72.8777",
        heading: "180",
        speed: "0"
      }
    ],
    "inventory:stock-items": [
      {
        sku: product.sku,
        item: product.name,
        stock: 15,
        reserved: 2,
        available: 13,
        threshold: 4,
        status: "In stock",
        expiry: "No active batch",
        batch: `${stamp}-INV-BATCH`,
        supplier: "QA Supplier",
        note: "QA inventory save"
      }
    ],
    "finance:payments": [
      {
        id: `${stamp}-PAY`,
        orderId: `${stamp}-ORDER`,
        customer: "QA Finance Customer",
        phone: "+91 90000 00000",
        method: "Mock online payment",
        status: "Paid",
        gatewayId: `${stamp}-GATEWAY`,
        amount: "Rs. 321",
        gateway: "Mock gateway",
        failureReason: "",
        reconciliation: "Matched",
        owner: "Finance",
        note: "QA payment sync"
      }
    ],
    "finance:refunds": [
      {
        id: `${stamp}-REFUND`,
        orderId: `${stamp}-ORDER`,
        customer: supportCustomerName,
        phone: supportCustomerPhone,
        amount: "Rs. 111",
        method: "Wallet credit",
        status: "Wallet credited",
        gatewayStatus: "Completed",
        walletCredit: "Rs. 111",
        adjustment: "Matched",
        reconciliation: "Matched",
        transactionId: `${stamp}-REF-TXN`,
        note: "QA refund finance sync"
      }
    ],
    "content:settings": {
      requireApproval: true,
      requireAltText: true,
      autoArchiveExpired: true,
      ownerHeroApproval: true,
      seoBeforePublish: true,
      allowedFileTypes: "JPG, PNG, WEBP",
      maxUploadSize: "5 MB",
      defaultOgImage: "/images/og/default.jpg",
      brandTone: "Premium grocery",
      legalOwner: "Owner",
      previewUrl: "http://localhost:3002",
      revalidationMode: "Manual"
    },
    "account:preferences": {
      theme: "System",
      compactMode: false,
      defaultLanding: "/dashboard",
      defaultModule: "Dashboard",
      rowDensity: "Comfortable",
      currency: "INR",
      dateFormat: "DD MMM YYYY",
      language: "English",
      timezone: "Asia/Kolkata",
      pinnedModules: "Dashboard, Orders",
      searchBehavior: "Open first exact match"
    },
    "account:notifications": [],
    "notifications:items": [
      {
        id: `NTF-${stamp}`,
        title: `${stamp} Order update`,
        message: "QA notification pipeline check",
        channel: "WhatsApp",
        audience: supportCustomerName,
        status: "Scheduled",
        schedule: "Now",
        target: supportCustomerPhone
      }
    ],
    "account:recovery": {
      recoveryEmail: "qa.recovery@example.com",
      recoveryPhone: "+91 90000 00000",
      backupCodesStatus: "QA",
      emergencyOwner: "Owner",
      recoveryQuestion: "Stored securely",
      lastUpdated: "Just now",
      lockStatus: "Open"
    }
  };

  for (const [key, state] of Object.entries(statePayloads)) {
    await request(`/admin/state/${encodeURIComponent(key)}`, authed(token, { method: "PATCH", body: JSON.stringify({ state }) }));
    const loaded = await request(`/admin/state/${encodeURIComponent(key)}`, authed(token));
    if (loaded.source === "adminState") throw new Error(`${key} still fell back to AdminState`);
    checks.push(`state:${key}:${loaded.source}`);
  }

  const supportConversation = await prisma.supportConversation.findFirst({
    where: { customer: { phone: supportCustomerPhone } },
    include: { messages: true }
  });
  if (!supportConversation || supportConversation.status !== "PENDING") throw new Error("support state did not persist conversation status");
  if (!supportConversation.messages.some((message) => message.senderType === "ADMIN" && message.body.includes("packing log"))) {
    throw new Error("support state did not persist admin reply");
  }
  checks.push("support:conversation-reply-sync");

  const financeOrder = await prisma.order.findUnique({ where: { orderNumber: `${stamp}-ORDER` } });
  if (!financeOrder || financeOrder.paymentStatus !== "REFUNDED") throw new Error("finance refund state did not sync the order payment status");
  checks.push("finance:payment-order-sync");

  const financeRefund = await prisma.refundRequest.findUnique({ where: { id: `${stamp}-REFUND` } });
  if (!financeRefund || financeRefund.status !== "PROCESSED" || financeRefund.transactionId !== `${stamp}-REF-TXN`) {
    throw new Error("finance refund state did not persist processed refund metadata");
  }
  const refundCustomer = await prisma.customer.findFirst({ where: { phone: supportCustomerPhone }, include: { wallet: { include: { transactions: true } } } });
  if (!refundCustomer?.wallet || Number(refundCustomer.wallet.balance) < 111) throw new Error("wallet refund credit was not applied");
  if (!refundCustomer.wallet.transactions.some((transaction) => transaction.type === "Refund credit")) throw new Error("wallet refund ledger was not written");
  const creditNote = await prisma.financeInvoice.findUnique({ where: { id: `CN-${stamp}-REFUND` } });
  if (!creditNote || creditNote.type !== "Refund credit note") throw new Error("refund credit note was not generated");
  const refundNotification = await prisma.notificationJob.findFirst({ where: { recipient: refundCustomer.id, subject: { contains: `${stamp}-ORDER` } } });
  if (!refundNotification) throw new Error("refund processing did not queue customer notification");
  checks.push("finance:refund-wallet-credit-note");

  const notificationJob = await prisma.notificationJob.findFirst({ where: { recipient: supportCustomerPhone, subject: `${stamp} Order update` } });
  if (!notificationJob || notificationJob.channel !== "WHATSAPP") throw new Error("notifications state did not persist notification job");
  const sendResult = await request(`/admin/notifications/${notificationJob.id}/send`, authed(token, { method: "POST", body: JSON.stringify({}) }));
  if (sendResult.result.status !== "SENT") throw new Error("notification dispatcher did not send the queued job");
  const deliveryAttempt = await prisma.notificationDeliveryAttempt.findFirst({ where: { notificationJobId: notificationJob.id, status: "SENT" } });
  if (!deliveryAttempt?.providerRef?.startsWith("LOCAL-")) throw new Error("notification dispatcher did not write a local provider attempt");
  checks.push("notifications:job-sync");

  const deliveredOrder = await prisma.order.findUnique({
    where: { orderNumber: deliveryOrderNumber },
    include: { deliveryAssignment: { include: { pings: true } }, payments: true, statusHistory: true }
  });
  if (!deliveredOrder || deliveredOrder.status !== "DELIVERED" || deliveredOrder.fulfillmentStatus !== "DELIVERED") {
    throw new Error("delivery state did not mark the order delivered");
  }
  if (deliveredOrder.paymentStatus !== "PAID" || deliveredOrder.payments[0]?.status !== "PAID") throw new Error("delivered COD order was not marked paid");
  if (deliveredOrder.deliveryAssignment?.status !== "DELIVERED") throw new Error("delivery assignment was not marked delivered");
  if (!deliveredOrder.deliveryAssignment.pings.length) throw new Error("delivery assignment did not save a location ping");
  if (!deliveredOrder.statusHistory.some((event) => event.status === "DELIVERED")) throw new Error("delivery did not append order status history");
  const deliveryNotification = await prisma.notificationJob.findFirst({
    where: { subject: { contains: deliveryOrderNumber }, payload: { path: ["event"], string_contains: "DELIVERY_DELIVERED" } }
  });
  if (!deliveryNotification) throw new Error("delivery update did not queue a customer notification");
  checks.push("delivery:fulfillment-cod-tracking");

  const inventory = await prisma.inventoryItem.findFirst({ where: { sku: product.sku } });
  if (!inventory || inventory.onHand !== 15 || inventory.reserved !== 2 || inventory.status !== "IN_STOCK") throw new Error("inventory state did not persist stock quantities");
  const productAfterInventory = await prisma.product.findUnique({ where: { id: product.id } });
  if (!productAfterInventory || productAfterInventory.stockStatus !== "IN_STOCK") throw new Error("inventory state did not sync product stock status");
  const stockLedgerCount = await prisma.stockLedger.count({ where: { inventoryItemId: inventory.id } });
  if (stockLedgerCount < 1) throw new Error("inventory state did not write stock ledger");
  checks.push("inventory:stock-ledger-sync");

  const storefront = await request("/storefront");
  if (!storefront.categories || !storefront.promotions || !storefront.coupons) throw new Error("storefront response is missing connected sections");
  checks.push("storefront:connected");

  const logoutAll = await request("/auth/admin/logout-all", authed(token, { method: "POST", body: JSON.stringify({}) }));
  if (!logoutAll.loggedOut || logoutAll.revokedSessions < 1) throw new Error("admin logout-all did not revoke active sessions");
  checks.push("auth:admin-logout-all");

  const counts = {
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    coupons: await prisma.coupon.count(),
    promotions: await prisma.promotion.count(),
    systemSettings: await prisma.systemSetting.count()
  };

  console.log(JSON.stringify({ ok: true, checks, counts }, null, 2));
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
    await prisma.$disconnect();
  });
