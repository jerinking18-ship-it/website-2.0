const { PrismaClient } = require("@prisma/client");
const { existsSync } = require("node:fs");
const { unlink } = require("node:fs/promises");
const { join } = require("node:path");

const apiBase = process.env.API_BASE_URL || "http://127.0.0.1:4000/api";
const stamp = `QA${Date.now()}`;
const qaPhone = `+9177${String(Date.now()).slice(-8)}`;
const authPhone = `+9188${String(Date.now()).slice(-8)}`;
const qaEmail = `${stamp.toLowerCase()}@example.com`;
const authEmail = `${stamp.toLowerCase()}-login@example.com`;
const categorySlug = `${stamp.toLowerCase()}-category`;
const productSku = `${stamp}-SKU`;
const productSlug = `${stamp.toLowerCase()}-apples`;
const couponCode = `${stamp}SAVE`;
const branchCode = `${stamp}-BR`;
const contentSlug = `${stamp.toLowerCase()}-policy`;
const contactName = `${stamp} Contact`;
const tinyPng =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
const uploadedMediaUrls = [];
const prisma = new PrismaClient();

async function request(path, options = {}) {
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
  return payload.data ?? payload;
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
    throw new Error(`${options.method || "GET"} ${path} should require customer auth, got ${response.status}: ${JSON.stringify(payload)}`);
  }
}

async function expectBadRequest(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });
  if (response.status !== 400) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(`${options.method || "GET"} ${path} should reject invalid request data, got ${response.status}: ${JSON.stringify(payload)}`);
  }
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
  const qaCustomers = await prisma.customer.findMany({
    where: { OR: [{ phone: { in: [qaPhone, authPhone] } }, { email: { in: [qaEmail, authEmail, `${stamp.toLowerCase()}-updated@example.com`] } }] },
    select: { id: true }
  });
  const qaCustomerIds = qaCustomers.map((customer) => customer.id);
  const qaNotificationRecipients = [qaPhone, authPhone, qaEmail, authEmail, `${stamp.toLowerCase()}-updated@example.com`, ...qaCustomerIds];
  const qaProducts = await prisma.product.findMany({ where: { sku: productSku }, select: { id: true } });
  const qaProductIds = qaProducts.map((product) => product.id);
  const qaOrders = await prisma.order.findMany({
    where: { OR: [{ customerId: { in: qaCustomerIds } }, { items: { some: { sku: { startsWith: stamp } } } }] },
    select: { id: true }
  });
  const qaOrderIds = qaOrders.map((order) => order.id);
  const qaReviews = await prisma.productReview.findMany({
    where: { OR: [{ productId: { in: qaProductIds } }, { customerId: { in: qaCustomerIds } }] },
    select: { id: true }
  });
  const qaReviewIds = qaReviews.map((review) => review.id);
  const qaContactConversations = await prisma.supportConversation.findMany({
    where: { messages: { some: { body: { contains: contactName } } } },
    select: { id: true }
  });
  const qaContactConversationIds = qaContactConversations.map((conversation) => conversation.id);

  await prisma.notificationJob.deleteMany({ where: { recipient: { in: qaNotificationRecipients } } }).catch(() => undefined);
  await prisma.reviewHelpfulVote.deleteMany({ where: { OR: [{ customerId: { in: qaCustomerIds } }, { reviewId: { in: qaReviewIds } }] } }).catch(() => undefined);
  await prisma.reviewImage.deleteMany({ where: { reviewId: { in: qaReviewIds } } }).catch(() => undefined);
  await prisma.productReview.deleteMany({ where: { id: { in: qaReviewIds } } }).catch(() => undefined);
  await prisma.refundRequest.deleteMany({ where: { orderId: { in: qaOrderIds } } }).catch(() => undefined);
  await prisma.payment.deleteMany({ where: { orderId: { in: qaOrderIds } } }).catch(() => undefined);
  await prisma.orderStatusHistory.deleteMany({ where: { orderId: { in: qaOrderIds } } }).catch(() => undefined);
  await prisma.orderItem.deleteMany({ where: { orderId: { in: qaOrderIds } } }).catch(() => undefined);
  await prisma.order.deleteMany({ where: { id: { in: qaOrderIds } } }).catch(() => undefined);
  await prisma.stockLedger.deleteMany({ where: { inventoryItem: { productId: { in: qaProductIds } } } }).catch(() => undefined);
  await prisma.inventoryBatch.deleteMany({ where: { inventoryItem: { productId: { in: qaProductIds } } } }).catch(() => undefined);
  await prisma.inventoryItem.deleteMany({ where: { productId: { in: qaProductIds } } }).catch(() => undefined);
  await prisma.supportMessage.deleteMany({ where: { OR: [{ conversation: { customerId: { in: qaCustomerIds } } }, { conversationId: { in: qaContactConversationIds } }] } }).catch(() => undefined);
  await prisma.supportConversation.deleteMany({ where: { OR: [{ customerId: { in: qaCustomerIds } }, { id: { in: qaContactConversationIds } }] } }).catch(() => undefined);
  await prisma.contactMessage.deleteMany({ where: { name: contactName } }).catch(() => undefined);
  await prisma.cartItem.deleteMany({ where: { OR: [{ cart: { customerId: { in: qaCustomerIds } } }, { productId: { in: qaProductIds } }] } }).catch(() => undefined);
  await prisma.cart.deleteMany({ where: { customerId: { in: qaCustomerIds } } }).catch(() => undefined);
  await prisma.wishlistItem.deleteMany({ where: { OR: [{ wishlist: { customerId: { in: qaCustomerIds } } }, { productId: { in: qaProductIds } }] } }).catch(() => undefined);
  await prisma.wishlist.deleteMany({ where: { customerId: { in: qaCustomerIds } } }).catch(() => undefined);
  await prisma.customerAddress.deleteMany({ where: { customerId: { in: qaCustomerIds } } }).catch(() => undefined);
  await prisma.searchHistory.deleteMany({ where: { customerId: { in: qaCustomerIds } } }).catch(() => undefined);
  await prisma.customerSession.deleteMany({ where: { customerId: { in: qaCustomerIds } } }).catch(() => undefined);
  await prisma.customerOtpCode.deleteMany({ where: { phone: { in: [qaPhone, authPhone] } } }).catch(() => undefined);
  await prisma.walletTransaction.deleteMany({ where: { wallet: { customerId: { in: qaCustomerIds } } } }).catch(() => undefined);
  await prisma.wallet.deleteMany({ where: { customerId: { in: qaCustomerIds } } }).catch(() => undefined);
  await prisma.loyaltyTransaction.deleteMany({ where: { loyaltyAccount: { customerId: { in: qaCustomerIds } } } }).catch(() => undefined);
  await prisma.loyaltyAccount.deleteMany({ where: { customerId: { in: qaCustomerIds } } }).catch(() => undefined);
  await prisma.customerNotificationPreference.deleteMany({ where: { customerId: { in: qaCustomerIds } } }).catch(() => undefined);
  await prisma.customer.deleteMany({ where: { id: { in: qaCustomerIds } } }).catch(() => undefined);
  await prisma.productImage.deleteMany({ where: { productId: { in: qaProductIds } } }).catch(() => undefined);
  await prisma.product.deleteMany({ where: { id: { in: qaProductIds } } }).catch(() => undefined);
  await prisma.coupon.deleteMany({ where: { code: couponCode } }).catch(() => undefined);
  await prisma.deliverySlot.deleteMany({ where: { branch: { code: branchCode } } }).catch(() => undefined);
  await prisma.branchServiceArea.deleteMany({ where: { branch: { code: branchCode } } }).catch(() => undefined);
  await prisma.branch.deleteMany({ where: { code: branchCode } }).catch(() => undefined);
  await prisma.contentPage.deleteMany({ where: { slug: contentSlug } }).catch(() => undefined);
  await prisma.category.deleteMany({ where: { slug: categorySlug } }).catch(() => undefined);
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

async function setup() {
  const customer = await prisma.customer.create({
    data: {
      phone: qaPhone,
      email: qaEmail,
      firstName: "QA",
      lastName: "Customer",
      status: "ACTIVE",
      createdAt: new Date("2000-01-01T00:00:00.000Z"),
      wallet: { create: { balance: 0 } },
      loyaltyAccount: { create: { points: 500, tier: "Gold" } },
      notifications: { create: {} }
    }
  });
  const category = await prisma.category.create({
    data: {
      name: `${stamp} Category`,
      slug: categorySlug,
      status: "ACTIVE",
      featured: true,
      sortOrder: 1,
      image: "https://example.com/category.jpg",
      note: "QA category"
    }
  });
  const product = await prisma.product.create({
    data: {
      categoryId: category.id,
      name: `${stamp} Apples`,
      slug: productSlug,
      sku: productSku,
      unit: "1 kg",
      description: "Temporary QA grocery product",
      price: 120,
      salePrice: 99,
      badge: "Fresh",
      status: "ACTIVE",
      stockStatus: "IN_STOCK",
      supplierName: "QA Supplier",
      tags: ["qa", "apple"],
      dietaryTags: ["vegan"],
      images: { create: { url: "https://example.com/apple.jpg", altText: "QA apples", isPrimary: true, sortOrder: 0 } }
    }
  });
  const branch = await prisma.branch.create({
    data: {
      name: `${stamp} Branch`,
      code: branchCode,
      phone: "+919900000000",
      addressLine1: "QA Street",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400001",
      active: true,
      serviceAreas: { create: { areaName: "QA Area", postalCode: "400001", active: true } },
      deliverySlots: {
        create: {
          label: "QA 6 PM - 8 PM",
          startsAt: new Date(Date.now() + 60 * 60 * 1000),
          endsAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
          capacity: 10,
          active: true
        }
      }
    }
  });
  const inventoryItem = await prisma.inventoryItem.create({
    data: {
      productId: product.id,
      branchId: branch.id,
      sku: product.sku,
      onHand: 10,
      reserved: 0,
      threshold: 3,
      status: "IN_STOCK",
      batches: { create: { batchCode: `${stamp}-BATCH`, quantity: 10 } }
    }
  });
  const coupon = await prisma.coupon.create({
    data: {
      code: couponCode,
      campaign: `${stamp} Checkout QA`,
      discountType: "FIXED_AMOUNT",
      value: 20,
      minCart: 50,
      maxDiscount: 20,
      status: "LIVE",
      segment: "All customers"
    }
  });
  const content = await prisma.contentPage.create({
    data: {
      slug: contentSlug,
      title: `${stamp} Policy`,
      summary: "QA content page",
      status: "PUBLISHED",
      body: { content: "QA content body", sections: [{ heading: "QA", body: "Client content API works." }] },
      publishedAt: new Date()
    }
  });
  return { customer, category, product, branch, inventoryItem, coupon, content };
}

async function run() {
  await cleanup();
  const seed = await setup();
  const checks = [];

  const otp = await request("/auth/customer/request-otp", {
    method: "POST",
    body: JSON.stringify({ phone: authPhone, purpose: "LOGIN" })
  });
  if (!otp.devCode) throw new Error("customer OTP dev code missing");
  const auth = await request("/auth/customer/verify-otp", {
    method: "POST",
    body: JSON.stringify({ phone: otp.phone, code: otp.devCode, firstName: "QA Login", email: authEmail })
  });
  if (!auth.token) throw new Error("customer auth token missing");
  const customerToken = auth.token;
  const authCustomer = auth.customer;
  await prisma.loyaltyAccount.upsert({
    where: { customerId: authCustomer.id },
    update: { points: 500, tier: "Gold" },
    create: { customerId: authCustomer.id, points: 500, tier: "Gold" }
  });
  checks.push("auth:customer-otp");

  await expectUnauthorized("/customer/cart");
  await expectUnauthorized("/customer/account");
  checks.push("auth:protected-customer-routes");

  await expectBadRequest("/customer/serviceability", {
    method: "POST",
    body: JSON.stringify({ constructor: { polluted: true }, pincode: "400001" })
  });
  checks.push("security:blocked-unsafe-payload");

  const customerSessions = await request("/auth/customer/sessions", authed(customerToken));
  if (!customerSessions.sessions.some((session) => session.current && session.active)) {
    throw new Error("customer sessions did not mark the current session active");
  }
  checks.push("auth:customer-sessions");

  const storefront = await request("/storefront");
  if (!storefront.categories.some((item) => item.slug === seed.category.slug)) throw new Error("storefront did not include QA category");
  checks.push("storefront:category");

  const categories = await request("/categories");
  if (!categories.some((item) => item.slug === seed.category.slug)) throw new Error("categories list did not include QA category");
  checks.push("catalog:categories");

  const products = await request(`/products?search=${encodeURIComponent(stamp)}&limit=5`);
  if (!products.items.some((item) => item.id === seed.product.id)) throw new Error("product search did not return QA product");
  checks.push("catalog:products-search");

  const filteredProducts = await request(
    `/products?search=${encodeURIComponent(stamp)}&supplier=${encodeURIComponent("QA Supplier")}&dietary=vegan&tags=qa&min_price=90&max_price=130&stock=available&sort=price_asc&pincode=400001&limit=5`
  );
  const filteredProduct = filteredProducts.items.find((item) => item.id === seed.product.id);
  if (!filteredProduct) throw new Error("advanced product filters did not return QA product");
  if (filteredProduct.availableQuantity < 10 || filteredProduct.serviceable !== true) {
    throw new Error(`advanced product filters returned wrong availability: ${JSON.stringify(filteredProduct)}`);
  }
  if (!filteredProducts.facets.suppliers.some((item) => item.name === "QA Supplier")) {
    throw new Error("catalog facets did not include QA supplier");
  }
  checks.push("catalog:products-advanced-filters");

  const productDetail = await request(`/products/${seed.product.slug}`);
  if (productDetail.id !== seed.product.id) throw new Error("product detail slug lookup failed");
  const suggestions = await request(`/search/suggestions?q=${encodeURIComponent(stamp)}&limit=6`);
  if (!suggestions.products.some((item) => item.id === seed.product.id)) throw new Error("search suggestions did not return QA product");
  if (!suggestions.categories.some((item) => item.slug === seed.category.slug)) throw new Error("search suggestions did not return QA category");
  const related = await request(`/products/${seed.product.slug}/related?limit=5`);
  if (!Array.isArray(related.items)) throw new Error("related products endpoint did not return items");
  const frequentlyBought = await request(`/products/${seed.product.slug}/frequently-bought-together?limit=4`);
  if (!Array.isArray(frequentlyBought.items)) throw new Error("frequently bought endpoint did not return items");
  checks.push("catalog:product-detail-suggestions-related");

  const account = await request("/customer/account", authed(customerToken));
  if (account.profile.id !== authCustomer.id) throw new Error("customer account did not use the authenticated customer");
  checks.push("customer:account");

  const updatedAccount = await request("/customer/account", authed(customerToken, {
    method: "PATCH",
    body: JSON.stringify({ name: "QA Customer Updated", email: `${stamp.toLowerCase()}-updated@example.com`, phone: authCustomer.phone })
  }));
  if (!updatedAccount.profile.name.includes("QA")) throw new Error("account update did not persist");
  checks.push("customer:account-update");

  const notifications = await request("/customer/notifications", authed(customerToken, {
    method: "PATCH",
    body: JSON.stringify({ orderUpdates: true, offers: false, whatsapp: true, sms: true, email: true })
  }));
  if (notifications.notifications["SMS alerts"] !== true) throw new Error("notification update did not persist");
  const emptyNotificationHistory = await request("/customer/notifications/history", authed(customerToken));
  if (!Array.isArray(emptyNotificationHistory.notifications)) throw new Error("notification history endpoint did not return an array");
  checks.push("customer:notifications");

  const walletTopUp = await request("/customer/wallet/top-up", authed(customerToken, { method: "POST", body: JSON.stringify({ amount: 250, note: "QA top-up" }) }));
  if (walletTopUp.wallet.balance < 250) throw new Error("wallet top-up failed");
  const walletRedeem = await request("/customer/wallet/redeem", authed(customerToken, { method: "POST", body: JSON.stringify({ points: 100, walletCredit: 10 }) }));
  if (walletRedeem.wallet.points > 500) throw new Error("loyalty redeem failed");
  const walletNotifications = await request("/customer/notifications/history", authed(customerToken));
  if (!walletNotifications.notifications.some((item) => item.event === "WALLET_TOP_UP")) throw new Error("wallet top-up did not queue customer notification");
  checks.push("customer:wallet-loyalty");

  const addressResult = await request("/customer/addresses", authed(customerToken, {
    method: "POST",
    body: JSON.stringify({
      label: "QA Home",
      recipient: "QA Customer",
      phone: authCustomer.phone,
      line: "QA Address Line",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      isDefault: true
    })
  }));
  const address = addressResult.address;
  await request(`/customer/addresses/${address.id}/default`, authed(customerToken, { method: "PATCH" }));
  checks.push("customer:addresses");

  const cart = await request("/customer/cart/items", authed(customerToken, {
    method: "POST",
    body: JSON.stringify({ productId: seed.product.id, quantity: 2 })
  }));
  if (!cart.cart.items.some((item) => item.productId === seed.product.id && item.quantity === 2)) throw new Error("cart update failed");
  checks.push("customer:cart");

  const wishlist = await request("/customer/wishlist", authed(customerToken, {
    method: "POST",
    body: JSON.stringify({ productId: seed.product.id, priceWatch: true, backInStockAlert: true })
  }));
  if (!wishlist.wishlist.items.some((item) => item.productId === seed.product.id)) throw new Error("wishlist toggle failed");
  await request(`/customer/wishlist/${seed.product.id}`, authed(customerToken, { method: "PATCH", body: JSON.stringify({ priceWatch: true, backInStockAlert: false }) }));
  checks.push("customer:wishlist");

  const quote = await request("/customer/checkout/quote", authed(customerToken, {
    method: "POST",
    body: JSON.stringify({
      items: [{ productId: seed.product.id, quantity: 2 }],
      address,
      slot: "QA 6 PM - 8 PM",
      couponCode: seed.coupon.code,
      walletAmount: 25
    })
  }));
  if (quote.quote.subtotal !== 198 || quote.quote.discountTotal !== 20 || quote.quote.deliveryFee !== 39 || quote.quote.payableTotal !== 192) {
    throw new Error(`checkout quote server totals were wrong: ${JSON.stringify(quote.quote)}`);
  }
  checks.push("customer:checkout-quote");

  const orderResult = await request("/customer/checkout", authed(customerToken, {
    method: "POST",
    body: JSON.stringify({
      items: [{ productId: seed.product.id, quantity: 2 }],
      address,
      slot: "QA 6 PM - 8 PM",
      paymentMethod: "Cash on delivery",
      deliveryInstructions: "QA instruction",
      couponCode: seed.coupon.code,
      walletAmount: 25,
      deliveryFee: 1,
      discountTotal: 999
    })
  }));
  const order = orderResult.order;
  if (!order.id || !order.items.includes(seed.product.name)) throw new Error("checkout did not create order");
  if (order.couponCode !== seed.coupon.code) throw new Error("checkout did not apply the server coupon");
  if (order.walletApplied !== 25) throw new Error("checkout did not apply wallet credit");
  if (order.total !== 217 || order.payableTotal !== 192) throw new Error(`checkout server totals were wrong: ${JSON.stringify(order)}`);
  const inventoryAfterCheckout = await prisma.inventoryItem.findUnique({ where: { id: seed.inventoryItem.id } });
  if (!inventoryAfterCheckout || inventoryAfterCheckout.onHand !== 8) throw new Error("checkout did not decrement inventory stock");
  const checkoutOrderRecord = await prisma.order.findUnique({ where: { orderNumber: order.id }, include: { deliveryAssignment: true } });
  if (!checkoutOrderRecord?.deliveryAssignment || checkoutOrderRecord.deliveryAssignment.status !== "UNASSIGNED") {
    throw new Error("checkout did not create an initial delivery assignment");
  }
  const orderNotifications = await request("/customer/notifications/history", authed(customerToken));
  if (!orderNotifications.notifications.some((item) => item.event === "ORDER_PLACED" && item.message.includes(order.id))) {
    throw new Error("checkout did not queue order notification");
  }
  checks.push("customer:checkout");

  const orders = await request("/customer/orders", authed(customerToken));
  if (!orders.orders.some((item) => item.id === order.id)) throw new Error("orders list missing checkout order");
  const tracking = await request(`/customer/orders/${order.id}/tracking`, authed(customerToken));
  if (tracking.order.id !== order.id || !tracking.tracking.timeline.length) throw new Error("order tracking failed");
  const invoice = await request(`/customer/orders/${order.id}/invoice`, authed(customerToken));
  if (!invoice.invoice || !invoice.text.includes(order.id) || !invoice.invoice.items.length) throw new Error("order invoice failed");
  checks.push("customer:orders-tracking-invoice");

  const refund = await request(`/customer/orders/${order.id}/refunds`, authed(customerToken, {
    method: "POST",
    body: JSON.stringify({ issue: "QA refund", item: seed.product.name, resolution: "Wallet credit", notes: "QA only" })
  }));
  if (!refund.refund.id) throw new Error("refund request failed");
  const refundRecord = await prisma.refundRequest.findUnique({ where: { id: refund.refund.id } });
  if (!refundRecord?.customerName || refundRecord.items !== seed.product.name || refundRecord.financeStatus !== "Not started") {
    throw new Error("refund request did not save admin support metadata");
  }
  const refundSupport = await prisma.supportConversation.findFirst({
    where: { customerId: authCustomer.id, subject: { contains: order.id } },
    include: { messages: true }
  });
  if (!refundSupport?.messages.some((message) => message.body.includes("Refund request"))) throw new Error("refund request did not create a support trail");
  const cancelled = await request(`/customer/orders/${order.id}/cancel`, authed(customerToken, { method: "PATCH" }));
  if (cancelled.order.status !== "Cancelled") throw new Error("order cancel failed");
  const inventoryAfterCancel = await prisma.inventoryItem.findUnique({ where: { id: seed.inventoryItem.id } });
  if (!inventoryAfterCancel || inventoryAfterCancel.onHand !== 10) throw new Error("cancel order did not restore inventory stock");
  const ledgerCount = await prisma.stockLedger.count({ where: { inventoryItemId: seed.inventoryItem.id } });
  if (ledgerCount < 2) throw new Error("stock ledger did not record checkout and cancel movements");
  const lifecycleNotifications = await request("/customer/notifications/history", authed(customerToken));
  for (const eventName of ["REFUND_REQUESTED", "ORDER_CANCELLED"]) {
    if (!lifecycleNotifications.notifications.some((item) => item.event === eventName)) throw new Error(`${eventName} notification was not queued`);
  }
  checks.push("customer:refund-cancel");

  const review = await request("/customer/reviews", authed(customerToken, {
    method: "POST",
    body: JSON.stringify({ productId: seed.product.id, rating: 5, title: "QA review", text: "QA review body", imageNote: tinyPng })
  }));
  if (!review.review.id) throw new Error("review create failed");
  trackUploadedMedia(review.review.imageNote);
  if (!String(review.review.imageNote || "").includes("/uploads/")) throw new Error("review upload did not return a served media URL");
  const helpful = await request(`/customer/reviews/${review.review.id}/helpful`, authed(customerToken, { method: "POST" }));
  if (helpful.review.helpful < 1) throw new Error("review helpful failed");
  await request(`/customer/reviews/${review.review.id}`, authed(customerToken, { method: "DELETE" }));
  checks.push("customer:reviews");

  const support = await request("/customer/support", authed(customerToken, { method: "POST", body: JSON.stringify({ message: "QA support message" }) }));
  if (!support.conversation.messages.length) throw new Error("support message failed");
  const supportThread = await request("/customer/support", authed(customerToken));
  if (!supportThread.conversation.id) throw new Error("support thread fetch failed");
  const supportNotifications = await request("/customer/notifications/history", authed(customerToken));
  if (!supportNotifications.notifications.some((item) => item.event === "SUPPORT_MESSAGE_RECEIVED")) throw new Error("support message did not queue notification");
  checks.push("customer:support");

  const contact = await request("/customer/contact", {
    method: "POST",
    body: JSON.stringify({ name: contactName, phone: authCustomer.phone, topic: "QA", message: "QA contact message" })
  });
  if (!contact.message.reference) throw new Error("contact submit failed");
  const contactSupport = await prisma.supportConversation.findUnique({
    where: { id: contact.message.conversationId },
    include: { messages: true }
  });
  if (!contactSupport || contactSupport.channel !== "CONTACT" || !contactSupport.messages.some((message) => message.body.includes(contactName))) {
    throw new Error("contact form did not create an admin support conversation");
  }
  const contactNotificationCount = await prisma.notificationJob.count({ where: { recipient: authCustomer.phone, subject: "Contact request received" } });
  if (contactNotificationCount < 1) throw new Error("contact form did not queue contact notification");
  checks.push("customer:contact");

  const branches = await request("/customer/branches");
  if (!branches.branches.some((item) => item.code === seed.branch.code)) throw new Error("branches list missing QA branch");
  const slots = await request("/customer/delivery-slots");
  if (!slots.slots.some((item) => item.branch.id === seed.branch.id)) throw new Error("delivery slots missing QA slot");
  const serviceability = await request("/customer/serviceability", { method: "POST", body: JSON.stringify({ pincode: "400001" }) });
  if (!serviceability.serviceable) throw new Error("serviceability failed for QA pincode");
  checks.push("customer:branches-slots-serviceability");

  const content = await request(`/customer/content/${seed.content.slug}`);
  if (!content.page || content.page.id !== seed.content.id) throw new Error("content page fetch failed");
  checks.push("customer:content");

  await request("/customer/search-history", authed(customerToken, { method: "POST", body: JSON.stringify({ query: `${stamp} apples` }) }));
  const searchHistory = await request("/customer/search-history", authed(customerToken));
  if (!searchHistory.searches.some((query) => query.includes(stamp))) throw new Error("search history save/list failed");
  await request("/customer/search-history", authed(customerToken, { method: "DELETE" }));
  checks.push("customer:search-history");

  await request("/customer/cart", authed(customerToken, { method: "DELETE" }));
  await request(`/customer/addresses/${address.id}`, authed(customerToken, { method: "DELETE" }));
  checks.push("customer:cleanup-actions");

  const logoutAll = await request("/auth/customer/logout-all", authed(customerToken, { method: "POST", body: JSON.stringify({}) }));
  if (!logoutAll.loggedOut || logoutAll.revokedSessions < 1) throw new Error("customer logout-all did not revoke active sessions");
  checks.push("auth:customer-logout-all");

  const counts = {
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    orders: await prisma.order.count(),
    supportConversations: await prisma.supportConversation.count(),
    contactMessages: await prisma.contactMessage.count()
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
