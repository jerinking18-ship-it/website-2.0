import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import {
  ContentStatus,
  DeliveryAssignmentStatus,
  DiscountType,
  InventoryStatus,
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
import { MediaStorageService } from "../../common/media/media-storage.service";
import { hashToken } from "../../common/security/auth-crypto";
import { PrismaService } from "../../database/prisma.service";

type BodyRecord = Record<string, unknown>;
type CheckoutProduct = Prisma.ProductGetPayload<{ include: { category: true; images: { orderBy: { sortOrder: "asc" } } } }>;
type CheckoutQuote = {
  products: CheckoutProduct[];
  quantityByProduct: Map<string, number>;
  inventoryAllocations: Map<string, { inventoryItemId: string; branchId: string; quantity: number; available: number }>;
  subtotal: number;
  deliveryFee: number;
  couponCode: string;
  discountTotal: number;
  grossTotal: number;
  walletRequested: number;
  walletApplied: number;
  payableTotal: number;
};

@Injectable()
export class CustomerService {
  constructor(
    private readonly mediaStorage: MediaStorageService,
    private readonly prisma: PrismaService
  ) {}

  async getAccount(authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const [freshCustomer, orders, supportConversation] = await Promise.all([
      this.prisma.customer.findUnique({
        where: { id: customer.id },
        include: {
          addresses: { orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }] },
          notifications: true,
          wallet: { include: { transactions: { orderBy: { createdAt: "desc" }, take: 25 } } },
          loyaltyAccount: { include: { transactions: { orderBy: { createdAt: "desc" }, take: 25 } } }
        }
      }),
      this.prisma.order.findMany({
        where: { customerId: customer.id },
        include: { customer: true, items: true, payments: true, refunds: true },
        orderBy: { placedAt: "desc" },
        take: 10
      }),
      this.prisma.supportConversation.findFirst({
        where: { customerId: customer.id },
        include: { messages: { orderBy: { createdAt: "desc" }, take: 5 } },
        orderBy: { updatedAt: "desc" }
      })
    ]);
    if (!freshCustomer) throw new NotFoundException("Customer was not found.");
    return {
      profile: this.toCustomerDto(freshCustomer),
      addresses: freshCustomer.addresses.map((address) => this.toAddressDto(address)),
      notifications: this.toNotificationDto(freshCustomer.notifications),
      wallet: this.toWalletDto(freshCustomer.wallet, freshCustomer.loyaltyAccount),
      orders: orders.map((order) => this.toOrderDto(order)),
      supportTickets: supportConversation
        ? [
            {
              id: supportConversation.id,
              topic: supportConversation.subject,
              status: supportConversation.status,
              channel: supportConversation.channel,
              updated: supportConversation.updatedAt.toISOString()
            }
          ]
        : []
    };
  }

  async updateAccount(input: unknown, authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const body = this.asRecord(input);
    const name = this.optionalString(body.name);
    const [firstName, ...rest] = name ? name.split(/\s+/) : [];
    const updated = await this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        firstName: firstName || customer.firstName,
        lastName: rest.join(" ") || customer.lastName,
        email: this.optionalString(body.email) ?? customer.email,
        phone: this.optionalString(body.phone) ?? customer.phone
      }
    });
    return { profile: this.toCustomerDto(updated) };
  }

  async updateNotificationPreferences(input: unknown, authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const body = this.asRecord(input);
    const preferences = await this.prisma.customerNotificationPreference.upsert({
      where: { customerId: customer.id },
      update: {
        orderUpdates: this.booleanFromInput(body.orderUpdates ?? body["Order status"] ?? body["Delivery rider calls"], true),
        offers: this.booleanFromInput(body.offers ?? body["Marketing offers"] ?? body["Back in stock"] ?? body["Price drops"], true),
        wallet: this.booleanFromInput(body.wallet, true),
        support: this.booleanFromInput(body.support, true),
        email: this.booleanFromInput(body.email ?? body["Email invoices"], true),
        whatsapp: this.booleanFromInput(body.whatsapp ?? body["WhatsApp updates"], true),
        sms: this.booleanFromInput(body.sms ?? body["SMS alerts"], false)
      },
      create: {
        customerId: customer.id,
        orderUpdates: this.booleanFromInput(body.orderUpdates ?? body["Order status"] ?? body["Delivery rider calls"], true),
        offers: this.booleanFromInput(body.offers ?? body["Marketing offers"] ?? body["Back in stock"] ?? body["Price drops"], true),
        wallet: this.booleanFromInput(body.wallet, true),
        support: this.booleanFromInput(body.support, true),
        email: this.booleanFromInput(body.email ?? body["Email invoices"], true),
        whatsapp: this.booleanFromInput(body.whatsapp ?? body["WhatsApp updates"], true),
        sms: this.booleanFromInput(body.sms ?? body["SMS alerts"], false)
      }
    });
    return { notifications: this.toNotificationDto(preferences) };
  }

  async listNotificationHistory(authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const recipients = [customer.id, customer.email, customer.phone].filter((value): value is string => Boolean(value));
    const notifications = await this.prisma.notificationJob.findMany({
      where: { recipient: { in: recipients } },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    return {
      notifications: notifications.map((notification) => ({
        id: notification.id,
        title: notification.subject ?? "Notification",
        channel: this.notificationChannelLabel(notification.channel),
        message: this.payloadString(notification.payload, "message", notification.subject ?? "Notification"),
        status: this.notificationStatusLabel(notification.status),
        target: this.payloadString(notification.payload, "target", ""),
        event: this.payloadString(notification.payload, "event", ""),
        createdAt: notification.createdAt.toISOString()
      }))
    };
  }

  async getWallet(authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const [wallet, loyaltyAccount] = await Promise.all([
      this.findOrCreateWallet(customer.id),
      this.findOrCreateLoyalty(customer.id)
    ]);
    const fullWallet = await this.prisma.wallet.findUnique({
      where: { id: wallet.id },
      include: { transactions: { orderBy: { createdAt: "desc" }, take: 50 } }
    });
    const fullLoyalty = await this.prisma.loyaltyAccount.findUnique({
      where: { id: loyaltyAccount.id },
      include: { transactions: { orderBy: { createdAt: "desc" }, take: 50 } }
    });
    return { wallet: this.toWalletDto(fullWallet, fullLoyalty) };
  }

  async topUpWallet(input: unknown, authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const body = this.asRecord(input);
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException("Top-up amount must be greater than zero.");
    const wallet = await this.findOrCreateWallet(customer.id);
    await this.prisma.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: amount } } });
    await this.prisma.walletTransaction.create({
      data: { walletId: wallet.id, type: "Wallet top-up", amount, note: this.optionalString(body.note) ?? null }
    });
    await this.queueCustomerNotification(customer, {
      preference: "wallet",
      event: "WALLET_TOP_UP",
      title: "Wallet top-up received",
      message: `Rs. ${this.roundMoney(amount)} has been added to your wallet.`,
      target: "/account/wallet"
    });
    return this.getWallet(authorization);
  }

  async redeemLoyaltyPoints(input: unknown, authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const body = this.asRecord(input);
    const points = Math.max(1, Math.round(Number(body.points) || 200));
    const walletCredit = Math.max(1, Math.round(Number(body.walletCredit) || points / 10));
    const [wallet, loyalty] = await Promise.all([
      this.findOrCreateWallet(customer.id),
      this.findOrCreateLoyalty(customer.id)
    ]);
    if (loyalty.points < points) throw new BadRequestException("Not enough loyalty points.");
    await this.prisma.loyaltyAccount.update({ where: { id: loyalty.id }, data: { points: { decrement: points } } });
    await this.prisma.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: walletCredit } } });
    await this.prisma.loyaltyTransaction.create({
      data: { loyaltyAccountId: loyalty.id, type: "Points redeemed", points: -points, note: `Converted to Rs. ${walletCredit} wallet credit` }
    });
    await this.prisma.walletTransaction.create({
      data: { walletId: wallet.id, type: "Loyalty redemption", amount: walletCredit, note: `${points} points redeemed` }
    });
    await this.queueCustomerNotification(customer, {
      preference: "wallet",
      event: "LOYALTY_REDEEMED",
      title: "Loyalty points redeemed",
      message: `${points} points were converted into Rs. ${walletCredit} wallet credit.`,
      target: "/account/wallet"
    });
    return this.getWallet(authorization);
  }

  async listAddresses(authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const addresses = await this.prisma.customerAddress.findMany({
      where: { customerId: customer.id },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }]
    });
    return { addresses: addresses.map((address) => this.toAddressDto(address)) };
  }

  async upsertAddress(input: unknown, authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const body = this.asRecord(input);
    const id = this.optionalString(body.id);
    const postalCode = this.requiredString(body.pincode ?? body.postalCode, "Pincode");
    if (!/^\d{6}$/.test(postalCode)) throw new BadRequestException("Pincode must be 6 digits.");
    const isDefault = Boolean(body.isDefault ?? body.default);
    const data = {
      customerId: customer.id,
      label: this.requiredString(body.label, "Label"),
      recipientName: this.requiredString(body.recipient ?? body.recipientName, "Recipient"),
      phone: this.requiredString(body.phone, "Phone"),
      addressLine1: this.requiredString(body.line ?? body.addressLine1, "Address line"),
      addressLine2: this.optionalString(body.addressLine2) ?? null,
      city: this.optionalString(body.city) || "Mumbai",
      state: this.optionalString(body.state) || "Maharashtra",
      postalCode,
      landmark: this.optionalString(body.landmark ?? body.area ?? body.note) ?? null,
      isDefault
    };
    if (isDefault) {
      await this.prisma.customerAddress.updateMany({
        where: { customerId: customer.id },
        data: { isDefault: false }
      });
    }
    const address = id
      ? await this.prisma.customerAddress.update({ where: { id }, data })
      : await this.prisma.customerAddress.create({ data: { ...data, isDefault: isDefault || !(await this.hasAddress(customer.id)) } });
    return { address: this.toAddressDto(address), ...(await this.listAddresses(authorization)) };
  }

  async deleteAddress(id: string, authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const address = await this.prisma.customerAddress.findFirst({ where: { id, customerId: customer.id } });
    if (!address) throw new NotFoundException("Address was not found.");
    await this.prisma.customerAddress.delete({ where: { id } });
    if (address.isDefault) {
      const next = await this.prisma.customerAddress.findFirst({
        where: { customerId: customer.id },
        orderBy: { updatedAt: "desc" }
      });
      if (next) await this.prisma.customerAddress.update({ where: { id: next.id }, data: { isDefault: true } });
    }
    return { deleted: true, ...(await this.listAddresses(authorization)) };
  }

  async setDefaultAddress(id: string, authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const address = await this.prisma.customerAddress.findFirst({ where: { id, customerId: customer.id } });
    if (!address) throw new NotFoundException("Address was not found.");
    await this.prisma.customerAddress.updateMany({ where: { customerId: customer.id }, data: { isDefault: false } });
    await this.prisma.customerAddress.update({ where: { id }, data: { isDefault: true } });
    return this.listAddresses(authorization);
  }

  async getCart(authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const cart = await this.findOrCreateCart(customer.id);
    return { cart: await this.toCartDto(cart.id) };
  }

  async updateCart(input: unknown, authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const body = this.asRecord(input);
    const productId = this.requiredString(body.productId, "Product");
    const quantity = Math.max(0, Math.round(Number(body.quantity) || 0));
    const cart = await this.findOrCreateCart(customer.id);
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException("Product was not found.");
    if (quantity === 0) {
      await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
    } else {
      await this.prisma.cartItem.upsert({
        where: { cartId_productId: { cartId: cart.id, productId } },
        update: { quantity },
        create: { cartId: cart.id, productId, quantity }
      });
    }
    return { cart: await this.toCartDto(cart.id) };
  }

  async clearCart(authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const cart = await this.findOrCreateCart(customer.id);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return { cart: await this.toCartDto(cart.id) };
  }

  async quoteCheckout(input: unknown, authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const body = this.asRecord(input);
    const quote = await this.prisma.$transaction((tx) => this.buildCheckoutQuote(tx, body, customer.id));
    return { quote: this.toCheckoutQuoteDto(quote) };
  }

  async getWishlist(authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const wishlist = await this.findOrCreateWishlist(customer.id);
    return { wishlist: await this.toWishlistDto(wishlist.id) };
  }

  async toggleWishlist(input: unknown, authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const body = this.asRecord(input);
    const productId = this.requiredString(body.productId, "Product");
    const wishlist = await this.findOrCreateWishlist(customer.id);
    const existing = await this.prisma.wishlistItem.findUnique({
      where: { wishlistId_productId: { wishlistId: wishlist.id, productId } }
    });
    if (existing) {
      await this.prisma.wishlistItem.delete({ where: { wishlistId_productId: { wishlistId: wishlist.id, productId } } });
    } else {
      await this.prisma.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          productId,
          priceWatch: Boolean(body.priceWatch),
          backInStockAlert: Boolean(body.backInStockAlert)
        }
      });
    }
    return { wishlist: await this.toWishlistDto(wishlist.id) };
  }

  async updateWishlistItem(productId: string, input: unknown, authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const body = this.asRecord(input);
    const wishlist = await this.findOrCreateWishlist(customer.id);
    await this.prisma.wishlistItem.upsert({
      where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
      update: {
        priceWatch: Boolean(body.priceWatch),
        backInStockAlert: Boolean(body.backInStockAlert)
      },
      create: {
        wishlistId: wishlist.id,
        productId,
        priceWatch: Boolean(body.priceWatch),
        backInStockAlert: Boolean(body.backInStockAlert)
      }
    });
    return { wishlist: await this.toWishlistDto(wishlist.id) };
  }

  async createCheckoutOrder(input: unknown, authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const body = this.asRecord(input);
    const address = this.asRecord(body.address);
    if (!this.optionalString(address.line) && !this.optionalString(address.addressLine1)) throw new BadRequestException("Delivery address is required.");
    const pincode = this.optionalString(address.pincode ?? address.postalCode);
    if (pincode && !/^\d{6}$/.test(pincode)) throw new BadRequestException("Delivery pincode must be 6 digits.");
    const order = await this.prisma.$transaction(async (tx) => {
      const quote = await this.buildCheckoutQuote(tx, body, customer.id);
      const { products, quantityByProduct, inventoryAllocations, subtotal, deliveryFee, discountTotal, grossTotal, walletApplied, payableTotal } = quote;
      const orderNumber = await this.nextOrderNumber(tx);
      const paymentMethod = this.toPaymentMethod(body.paymentMethod);
      const paymentStatus = payableTotal <= 0 || paymentMethod !== PaymentMethod.CASH_ON_DELIVERY ? PaymentStatus.PAID : PaymentStatus.COD_PENDING;

      if (walletApplied > 0) {
        const wallet = await tx.wallet.findUnique({ where: { customerId: customer.id } });
        if (!wallet || Number(wallet.balance) < walletApplied) throw new BadRequestException("Wallet balance is not enough for this checkout.");
        await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: walletApplied } } });
        await tx.walletTransaction.create({
          data: { walletId: wallet.id, type: "Checkout payment", amount: -walletApplied, note: `Applied to order ${orderNumber}` }
        });
      }

      const firstAllocation = Array.from(inventoryAllocations.values())[0];
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          branchId: firstAllocation?.branchId,
          status: OrderStatus.PLACED,
          paymentStatus,
          fulfillmentStatus: "PICKING",
          subtotal,
          discountTotal,
          deliveryFee,
          total: grossTotal,
          deliveryAddressSnapshot: {
            ...(address as Prisma.JsonObject),
            customer: this.customerName(customer),
            phone: customer.phone ?? this.optionalString(address.phone) ?? "",
            slot: this.optionalString(body.slot) || "Slot not selected",
            instructions: this.optionalString(body.deliveryInstructions) || "",
            couponCode: quote.couponCode,
            walletApplied,
            payableTotal
          },
          items: {
            create: products.map((product) => {
              const quantity = quantityByProduct.get(product.id) ?? 1;
              const unitPrice = Number(product.salePrice ?? product.price);
              return {
                productId: product.id,
                productName: product.name,
                productSlug: product.slug,
                sku: product.sku,
                unit: product.unit,
                quantity,
                unitPrice,
                lineTotal: this.roundMoney(unitPrice * quantity),
                productSnapshot: this.toProductSnapshot(product)
              };
            })
          },
          payments: {
            create: {
              method: paymentMethod,
              status: paymentStatus,
              amount: payableTotal,
              providerRef: this.optionalString(body.paymentReference) ?? this.defaultProviderRef(paymentMethod, orderNumber),
              paidAt: paymentStatus === PaymentStatus.PAID ? new Date() : null,
              metadata: {
                couponCode: quote.couponCode,
                walletApplied,
                grossTotal,
                payableTotal,
                serverPriced: true
              }
            }
          },
          statusHistory: { create: { status: OrderStatus.PLACED, note: "Order placed from customer checkout" } }
        },
        include: { customer: true, items: true, payments: true, refunds: true }
      });
      await tx.deliveryAssignment.create({
        data: {
          orderId: order.id,
          status: DeliveryAssignmentStatus.UNASSIGNED,
          eta: new Date(Date.now() + 45 * 60 * 1000)
        }
      });

      for (const product of products) {
        const allocation = inventoryAllocations.get(product.id);
        if (!allocation) continue;
        const updatedInventory = await tx.inventoryItem.update({
          where: { id: allocation.inventoryItemId },
          data: { onHand: { decrement: allocation.quantity } }
        });
        await tx.stockLedger.create({
          data: {
            inventoryItemId: allocation.inventoryItemId,
            type: "ORDER_COMMIT",
            quantity: -allocation.quantity,
            note: `Committed to order ${order.orderNumber}`,
            referenceType: "Order",
            referenceId: order.id
          }
        });
        await this.syncInventoryProductStatus(tx, product.id, updatedInventory.onHand - updatedInventory.reserved, updatedInventory.threshold);
      }

      return order;
    });
    await this.queueCustomerNotification(order.customer ?? customer, {
      preference: "orderUpdates",
      event: "ORDER_PLACED",
      title: `Order ${order.orderNumber} placed`,
      message: `Your order ${order.orderNumber} has been placed. Payable amount: Rs. ${this.snapshotValue(order.deliveryAddressSnapshot, "payableTotal", String(order.total))}.`,
      orderNumber: order.orderNumber,
      target: `/orders/${order.orderNumber}/confirmed`
    });
    await this.clearCart(authorization);
    return { order: this.toOrderDto(order) };
  }

  async getTracking(orderNumber: string, authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        customer: true,
        items: true,
        payments: true,
        refunds: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
        deliveryAssignment: {
          include: {
            deliveryPartner: true,
            pings: { orderBy: { createdAt: "desc" }, take: 1 }
          }
        },
        branch: true
      }
    });
    if (!order) throw new NotFoundException("Order was not found.");
    if (order.customerId !== customer.id) throw new NotFoundException("Order was not found.");
    const latestPing = order.deliveryAssignment?.pings[0];
    return {
      order: this.toOrderDto(order),
      tracking: {
        eta: order.deliveryAssignment?.eta?.toISOString() ?? null,
        status: order.deliveryAssignment?.status ?? order.fulfillmentStatus,
        rider: order.deliveryAssignment?.deliveryPartner
          ? {
              name: order.deliveryAssignment.deliveryPartner.name,
              phone: order.deliveryAssignment.deliveryPartner.phone,
              status: order.deliveryAssignment.deliveryPartner.status
            }
          : null,
        branch: order.branch
          ? {
              name: order.branch.name,
              latitude: order.branch.latitude ? Number(order.branch.latitude) : null,
              longitude: order.branch.longitude ? Number(order.branch.longitude) : null
            }
          : null,
        location: latestPing
          ? {
              latitude: Number(latestPing.latitude),
              longitude: Number(latestPing.longitude),
              heading: latestPing.heading ? Number(latestPing.heading) : null,
              speed: latestPing.speed ? Number(latestPing.speed) : null,
              at: latestPing.createdAt.toISOString()
            }
          : null,
        timeline: order.statusHistory.map((event) => ({
          status: this.fromOrderStatus(event.status),
          note: event.note,
          at: event.createdAt.toISOString()
        })),
        serviceArea: {
          zone: this.snapshotValue(order.deliveryAddressSnapshot, "zone", "Primary zone"),
          pincode: this.snapshotValue(order.deliveryAddressSnapshot, "pincode", this.snapshotValue(order.deliveryAddressSnapshot, "postalCode", "")),
          slot: this.snapshotValue(order.deliveryAddressSnapshot, "slot", "Slot not selected"),
          instructions: this.snapshotValue(order.deliveryAddressSnapshot, "instructions", "")
        }
      }
    };
  }

  async getInvoice(orderNumber: string, authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { customer: true, items: true, payments: true, refunds: true, branch: true }
    });
    if (!order) throw new NotFoundException("Order was not found.");
    if (order.customerId !== customer.id) throw new NotFoundException("Order was not found.");
    const primaryPayment = order.payments[0];
    const rows = order.items.map((item) => ({
      name: item.productName,
      sku: item.sku,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal)
    }));
    const invoice = {
      invoiceNumber: `INV-${order.orderNumber}`,
      orderNumber: order.orderNumber,
      issuedAt: new Date().toISOString(),
      placedAt: order.placedAt.toISOString(),
      customer: this.customerName(order.customer),
      branch: order.branch?.name ?? "Branch not assigned",
      paymentStatus: this.fromPaymentStatus(order.paymentStatus),
      paymentMethod: primaryPayment ? this.fromPaymentMethod(primaryPayment.method) : "",
      subtotal: Number(order.subtotal),
      discountTotal: Number(order.discountTotal),
      deliveryFee: Number(order.deliveryFee),
      total: Number(order.total),
      payableTotal: Number(this.snapshotValue(order.deliveryAddressSnapshot, "payableTotal", String(order.total))) || Number(order.total),
      couponCode: this.snapshotValue(order.deliveryAddressSnapshot, "couponCode", ""),
      walletApplied: Number(this.snapshotValue(order.deliveryAddressSnapshot, "walletApplied", "0")) || 0,
      slot: this.snapshotValue(order.deliveryAddressSnapshot, "slot", "Slot not selected"),
      address: {
        line: this.snapshotValue(order.deliveryAddressSnapshot, "line", this.snapshotValue(order.deliveryAddressSnapshot, "Address line 1", "")),
        city: this.snapshotValue(order.deliveryAddressSnapshot, "city", this.snapshotValue(order.deliveryAddressSnapshot, "City", "")),
        postalCode: this.snapshotValue(order.deliveryAddressSnapshot, "pincode", this.snapshotValue(order.deliveryAddressSnapshot, "Postal code", ""))
      },
      items: rows
    };
    const text = [
      "FreshCart Market Invoice",
      `Invoice: ${invoice.invoiceNumber}`,
      `Order: ${invoice.orderNumber}`,
      `Issued: ${invoice.issuedAt}`,
      `Customer: ${invoice.customer}`,
      `Branch: ${invoice.branch}`,
      `Payment: ${invoice.paymentStatus} (${invoice.paymentMethod})`,
      `Slot: ${invoice.slot}`,
      "",
      "Items:",
      ...rows.map((item, index) => `${index + 1}. ${item.name} - ${item.quantity} x ${item.unit} @ Rs. ${item.unitPrice} = Rs. ${item.lineTotal}`),
      "",
      `Subtotal: Rs. ${invoice.subtotal}`,
      `Discount: Rs. ${invoice.discountTotal}`,
      `Delivery: Rs. ${invoice.deliveryFee}`,
      `Wallet: Rs. ${invoice.walletApplied}`,
      `Payable: Rs. ${invoice.payableTotal}`,
      "",
      "Thank you for shopping with FreshCart."
    ].join("\n");
    return { invoice, text };
  }

  async checkServiceability(input: unknown) {
    const body = this.asRecord(input);
    const postalCode = this.requiredString(body.pincode ?? body.postalCode, "Pincode");
    if (!/^\d{6}$/.test(postalCode)) throw new BadRequestException("Pincode must be 6 digits.");
    const areas = await this.prisma.branchServiceArea.findMany({
      where: { postalCode, active: true, branch: { active: true } },
      include: { branch: true },
      orderBy: { updatedAt: "desc" }
    });
    const zones = await this.prisma.serviceabilityZone.findMany({
      where: { active: true, postalCodes: { has: postalCode } }
    });
    return {
      pincode: postalCode,
      serviceable: areas.length > 0 || zones.length > 0,
      branches: areas.map((area) => ({
        id: area.branch.id,
        name: area.branch.name,
        area: area.areaName,
        pincode: area.postalCode,
        phone: area.branch.phone,
        city: area.branch.city
      })),
      zones: zones.map((zone) => ({ id: zone.id, name: zone.name }))
    };
  }

  async listBranches() {
    const branches = await this.prisma.branch.findMany({
      where: { active: true },
      include: { serviceAreas: { where: { active: true }, orderBy: [{ areaName: "asc" }, { postalCode: "asc" }] } },
      orderBy: [{ city: "asc" }, { name: "asc" }]
    });
    return {
      branches: branches.map((branch) => {
        const firstArea = branch.serviceAreas[0];
        return {
          id: branch.id,
          label: branch.name,
          detail: firstArea ? `${firstArea.areaName}, ${branch.city}` : `${branch.addressLine1}, ${branch.city}`,
          eta: "Check",
          code: branch.code,
          phone: branch.phone ?? "",
          city: branch.city,
          state: branch.state,
          postalCode: branch.postalCode,
          serviceAreas: branch.serviceAreas.map((area) => ({
            id: area.id,
            area: area.areaName,
            pincode: area.postalCode
          }))
        };
      })
    };
  }

  async listDeliverySlots() {
    const slots = await this.prisma.deliverySlot.findMany({
      where: { active: true, branch: { active: true } },
      include: { branch: true },
      orderBy: [{ startsAt: "asc" }, { endsAt: "asc" }],
      take: 50
    });
    return {
      slots: slots.map((slot) => ({
        id: slot.id,
        label: slot.label,
        startsAt: slot.startsAt.toISOString(),
        endsAt: slot.endsAt.toISOString(),
        capacity: slot.capacity,
        fee: 0,
        branch: {
          id: slot.branch.id,
          name: slot.branch.name,
          city: slot.branch.city,
          postalCode: slot.branch.postalCode
        }
      }))
    };
  }

  async getContentPage(slug: string) {
    const normalizedSlug = this.slugify(slug);
    const page = await this.prisma.contentPage.findFirst({
      where: {
        slug: normalizedSlug,
        status: { in: [ContentStatus.PUBLISHED, ContentStatus.LIVE] }
      }
    });
    if (!page) {
      return {
        page: null,
        message: `No published content page exists for ${normalizedSlug}. Publish it from Content Manager.`
      };
    }
    return {
      page: {
        id: page.id,
        slug: page.slug,
        title: page.title,
        summary: page.summary ?? "",
        body: page.body,
        text: this.contentText(page.body),
        sections: this.contentSections(page.body),
        publishedAt: page.publishedAt?.toISOString() ?? null,
        updatedAt: page.updatedAt.toISOString()
      }
    };
  }

  async submitContactMessage(input: unknown) {
    const body = this.asRecord(input);
    const message = this.requiredString(body.message, "Message");
    const contact = await this.prisma.contactMessage.create({
      data: {
        name: this.requiredString(body.name, "Name"),
        email: this.optionalString(body.email) ?? null,
        phone: this.optionalString(body.phone) ?? null,
        topic: this.optionalString(body.topic ?? body.issueType) || "Customer support",
        message: [
          message,
          this.optionalString(body.orderNumber) ? `Order: ${this.optionalString(body.orderNumber)}` : "",
          this.optionalString(body.channel) ? `Channel: ${this.optionalString(body.channel)}` : "",
          this.optionalString(body.branch) ? `Branch: ${this.optionalString(body.branch)}` : "",
          this.optionalString(body.attachment) ? `Attachment note: ${this.optionalString(body.attachment)}` : ""
        ]
          .filter(Boolean)
          .join("\n")
      }
    });
    const conversation = await this.prisma.supportConversation.create({
      data: {
        subject: contact.topic,
        status: SupportConversationStatus.OPEN,
        channel: this.optionalString(body.channel) || "CONTACT",
        lastMessageAt: new Date(),
        messages: {
          create: {
            senderType: "CUSTOMER",
            body: `${contact.name}${contact.phone ? ` (${contact.phone})` : ""}: ${contact.message}`
          }
        }
      }
    });
    await this.queueContactNotification(contact, conversation.id);
    return {
      message: {
        id: contact.id,
        reference: `MSG-${contact.id.slice(0, 8).toUpperCase()}`,
        conversationId: conversation.id,
        status: contact.status,
        createdAt: contact.createdAt.toISOString()
      }
    };
  }

  async saveSearch(input: unknown, authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const body = this.asRecord(input);
    const query = this.requiredString(body.query, "Search");
    await this.prisma.searchHistory.create({ data: { customerId: customer.id, query } });
    return this.listSearchHistory(authorization);
  }

  async listSearchHistory(authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const searches = await this.prisma.searchHistory.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      take: 25
    });
    const unique = Array.from(new Set(searches.map((search) => search.query))).slice(0, 6);
    return { searches: unique };
  }

  async clearSearchHistory(authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    await this.prisma.searchHistory.deleteMany({ where: { customerId: customer.id } });
    return { searches: [] };
  }

  async listOrders(authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const orders = await this.prisma.order.findMany({
      where: { customerId: customer.id },
      include: { customer: true, items: true, payments: true, refunds: true },
      orderBy: { placedAt: "desc" },
      take: 100
    });
    return { orders: orders.map((order) => this.toOrderDto(order)) };
  }

  async cancelOrder(orderNumber: string, authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const order = await this.findOrder(orderNumber, customer.id);
    if (order.status !== OrderStatus.PLACED && order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException("This order cannot be cancelled at this stage.");
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const fullOrder = await tx.order.findUnique({ where: { id: order.id }, include: { items: true } });
      if (!fullOrder) throw new NotFoundException("Order was not found.");
      const cancelled = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          fulfillmentStatus: "NOT_STARTED",
          statusHistory: { create: { status: OrderStatus.CANCELLED, note: "Cancelled by customer" } }
        },
        include: { customer: true, items: true, payments: true, refunds: true }
      });
      for (const item of fullOrder.items) {
        if (!item.productId) continue;
        const inventory = await tx.inventoryItem.findFirst({
          where: { productId: item.productId, ...(fullOrder.branchId ? { branchId: fullOrder.branchId } : {}) },
          orderBy: [{ updatedAt: "desc" }]
        });
        if (!inventory) continue;
        const restored = await tx.inventoryItem.update({ where: { id: inventory.id }, data: { onHand: { increment: item.quantity } } });
        await tx.stockLedger.create({
          data: {
            inventoryItemId: inventory.id,
            type: "ORDER_CANCEL_RESTORE",
            quantity: item.quantity,
            note: `Restored from cancelled order ${fullOrder.orderNumber}`,
            referenceType: "Order",
            referenceId: fullOrder.id
          }
        });
        await this.syncInventoryProductStatus(tx, item.productId, restored.onHand - restored.reserved, restored.threshold);
      }
      return cancelled;
    });
    await this.queueCustomerNotification(updated.customer ?? customer, {
      preference: "orderUpdates",
      event: "ORDER_CANCELLED",
      title: `Order ${updated.orderNumber} cancelled`,
      message: `Your order ${updated.orderNumber} was cancelled and eligible stock was restored.`,
      orderNumber: updated.orderNumber,
      target: "/orders"
    });
    return { order: this.toOrderDto(updated) };
  }

  async requestRefund(orderNumber: string, input: unknown, authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const order = await this.findOrder(orderNumber, customer.id);
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED) {
      throw new BadRequestException("Refund cannot be requested for this order status.");
    }
    const existing = await this.prisma.refundRequest.findFirst({
      where: { orderId: order.id, status: { in: [RefundStatus.REQUESTED, RefundStatus.REVIEWING, RefundStatus.APPROVED] } }
    });
    if (existing) throw new BadRequestException("A refund or return request is already open for this order.");
    const body = this.asRecord(input);
    const reason = this.optionalString(body.issue) || this.optionalString(body.reason) || "Customer request";
    const note = [this.optionalString(body.item), this.optionalString(body.resolution), this.optionalString(body.notes)]
      .filter(Boolean)
      .join(" - ");
    const refund = await this.prisma.refundRequest.create({
      data: {
        orderId: order.id,
        reason,
        note: note || null,
        status: RefundStatus.REQUESTED,
        amount: order.total,
        customerName: this.customerName(customer),
        phone: customer.phone,
        email: customer.email,
        items: this.optionalString(body.item) || order.orderNumber,
        paymentMethodLabel: this.fromPaymentStatus(order.paymentStatus),
        refundMethod: this.optionalString(body.resolution) || "Support review",
        sla: "Same day",
        risk: "Medium",
        assignedTo: "Unassigned",
        customerNote: this.optionalString(body.notes) || reason,
        evidence: this.optionalString(body.evidence) || "Customer request",
        financeStatus: "Not started",
        gatewayStatus: "Not started",
        returnStatus: "Customer requested",
        reviewerDecision: "Needs review"
      }
    });
    const conversation = await this.findOrCreateSupportConversation(customer.id);
    await this.prisma.supportConversation.update({
      where: { id: conversation.id },
      data: {
        subject: `Refund request ${order.orderNumber}`,
        status: SupportConversationStatus.OPEN,
        lastMessageAt: new Date(),
        messages: {
          create: {
            senderType: "CUSTOMER",
            senderId: customer.id,
            body: `Refund request for ${order.orderNumber}: ${reason}${note ? ` - ${note}` : ""}`
          }
        }
      }
    });
    await this.queueCustomerNotification(customer, {
      preference: "support",
      event: "REFUND_REQUESTED",
      title: `Refund request received for ${order.orderNumber}`,
      message: `Your refund or return request for ${order.orderNumber} is saved for support review.`,
      orderNumber: order.orderNumber,
      target: "/orders"
    });
    return { refund: this.toRefundDto(refund) };
  }

  async listReviews(authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const reviews = await this.prisma.productReview.findMany({
      where: { customerId: customer.id },
      include: { images: true, product: { include: { category: true } } },
      orderBy: { updatedAt: "desc" },
      take: 100
    });
    return { reviews: reviews.map((review) => this.toReviewDto(review)) };
  }

  async upsertReview(input: unknown, authorization?: string) {
    const body = this.asRecord(input);
    const productId = this.requiredString(body.productId, "Product");
    const customer = await this.requireCustomer(authorization);
    const existing = this.optionalString(body.id)
      ? await this.prisma.productReview.findUnique({ where: { id: String(body.id) } })
      : await this.prisma.productReview.findFirst({ where: { productId, customerId: customer.id } });
    const rating = Math.max(1, Math.min(5, Math.round(Number(body.rating) || 5)));
    const data = {
      productId,
      customerId: customer.id,
      rating,
      title: this.optionalString(body.title) || null,
      body: this.requiredString(body.text ?? body.body, "Review"),
      status: ContentStatus.DRAFT
    };
    const imageUrl = await this.mediaStorage.storeImage(body.image ?? body.imageNote, "reviews");
    const review = existing
      ? await this.prisma.productReview.update({
          where: { id: existing.id },
          data,
          include: { images: true, product: { include: { category: true } } }
        })
      : await this.prisma.productReview.create({
          data,
          include: { images: true, product: { include: { category: true } } }
        });
    if (imageUrl) {
      await this.prisma.reviewImage.deleteMany({ where: { reviewId: review.id } });
      await this.prisma.reviewImage.create({ data: { reviewId: review.id, url: imageUrl, altText: "Customer review image" } });
    }
    const savedReview = await this.prisma.productReview.findUnique({
      where: { id: review.id },
      include: { images: true, product: { include: { category: true } } }
    });
    if (!savedReview) throw new NotFoundException("Review was not found.");
    return { review: this.toReviewDto(savedReview) };
  }

  async deleteReview(id: string, authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const review = await this.prisma.productReview.findUnique({ where: { id } });
    if (!review) throw new NotFoundException("Review was not found.");
    if (review.customerId !== customer.id) throw new NotFoundException("Review was not found.");
    await this.prisma.reviewHelpfulVote.deleteMany({ where: { reviewId: review.id } });
    await this.prisma.reviewImage.deleteMany({ where: { reviewId: review.id } });
    await this.prisma.productReview.delete({ where: { id } });
    return { deleted: true, id };
  }

  async markHelpful(id: string, authorization?: string) {
    await this.requireCustomer(authorization);
    const review = await this.prisma.productReview.update({
      where: { id },
      data: { helpfulCount: { increment: 1 } },
      include: { images: true, product: { include: { category: true } } }
    });
    return { review: this.toReviewDto(review) };
  }

  async getSupportThread(authorization?: string) {
    const customer = await this.requireCustomer(authorization);
    const conversation = await this.prisma.supportConversation.findFirst({
      where: { customerId: customer.id, status: { in: ["OPEN", "PENDING"] } },
      orderBy: { updatedAt: "desc" }
    });
    return {
      conversation: conversation
        ? await this.toSupportConversationDto(conversation.id)
        : {
            id: "",
            subject: "Customer support",
            status: "OPEN",
            channel: "CHAT",
            messages: []
          }
    };
  }

  async sendSupportMessage(input: unknown, authorization?: string) {
    const body = this.asRecord(input);
    const message = this.requiredString(body.message ?? body.text, "Message");
    const customer = await this.requireCustomer(authorization);
    const conversation = await this.findOrCreateSupportConversation(customer.id);
    const subject = this.optionalString(body.topic) || (message.length <= 60 ? message : conversation.subject);
    await this.prisma.supportMessage.create({
      data: {
        conversationId: conversation.id,
        senderType: "CUSTOMER",
        senderId: customer.id,
        body: message
      }
    });
    await this.prisma.supportMessage.create({
      data: {
        conversationId: conversation.id,
        senderType: "AGENT",
        body: "Thanks. Your message is saved and the support team can continue this conversation from admin."
      }
    });
    await this.prisma.supportConversation.update({
      where: { id: conversation.id },
      data: { subject, status: "OPEN", lastMessageAt: new Date() }
    });
    await this.queueCustomerNotification(customer, {
      preference: "support",
      event: "SUPPORT_MESSAGE_RECEIVED",
      title: "Support message saved",
      message: "Your support message is saved. Admin can now continue the conversation from the support panel.",
      target: "/support"
    });
    return { conversation: await this.toSupportConversationDto(conversation.id) };
  }

  private async queueCustomerNotification(
    customer: { id: string; firstName: string | null; lastName: string | null; phone: string | null; email: string | null },
    options: {
      preference: "orderUpdates" | "offers" | "wallet" | "support";
      event: string;
      title: string;
      message: string;
      orderNumber?: string;
      target?: string;
      scheduledAt?: Date;
    }
  ) {
    const preferences = await this.prisma.customerNotificationPreference.findUnique({ where: { customerId: customer.id } });
    if (preferences && !preferences[options.preference]) return;
    const payload = this.notificationPayload(customer, options);
    const jobs: Array<{ channel: NotificationChannel; recipient: string; subject: string; payload: Prisma.JsonObject }> = [
      { channel: NotificationChannel.IN_APP, recipient: customer.id, subject: options.title, payload }
    ];
    if ((preferences?.email ?? true) && customer.email) jobs.push({ channel: NotificationChannel.EMAIL, recipient: customer.email, subject: options.title, payload });
    if ((preferences?.whatsapp ?? true) && customer.phone) {
      jobs.push({ channel: NotificationChannel.WHATSAPP, recipient: customer.phone, subject: options.title, payload });
    }
    if ((preferences?.sms ?? false) && customer.phone) jobs.push({ channel: NotificationChannel.SMS, recipient: customer.phone, subject: options.title, payload });
    await Promise.all(
      jobs.map((job) =>
        this.prisma.notificationJob.create({
          data: { ...job, scheduledAt: options.scheduledAt ?? null }
        })
      )
    );
  }

  private async queueContactNotification(contact: { name: string; email: string | null; phone: string | null; topic: string }, conversationId: string) {
    const payload: Prisma.JsonObject = {
      event: "CONTACT_REQUEST_RECEIVED",
      contactName: contact.name,
      audience: contact.name,
      message: `We received your ${contact.topic} message. Reference conversation ${conversationId.slice(0, 8).toUpperCase()}.`,
      target: "/contact",
      conversationId
    };
    const jobs: Array<{ channel: NotificationChannel; recipient: string; subject: string; payload: Prisma.JsonObject }> = [];
    if (contact.email) jobs.push({ channel: NotificationChannel.EMAIL, recipient: contact.email, subject: "Contact request received", payload });
    if (contact.phone) {
      jobs.push({ channel: NotificationChannel.WHATSAPP, recipient: contact.phone, subject: "Contact request received", payload });
      jobs.push({ channel: NotificationChannel.SMS, recipient: contact.phone, subject: "Contact request received", payload });
    }
    await Promise.all(jobs.map((job) => this.prisma.notificationJob.create({ data: job })));
  }

  private notificationPayload(
    customer: { id: string; firstName: string | null; lastName: string | null; phone: string | null; email: string | null },
    options: { event: string; message: string; orderNumber?: string; target?: string }
  ): Prisma.JsonObject {
    return {
      customerId: customer.id,
      customer: this.customerName(customer),
      audience: this.customerName(customer),
      message: options.message,
      event: options.event,
      orderNumber: options.orderNumber ?? "",
      target: options.target ?? ""
    };
  }

  private async findOrder(orderNumber: string, customerId: string) {
    const order = await this.prisma.order.findFirst({ where: { orderNumber, customerId } });
    if (!order) throw new NotFoundException("Order was not found.");
    return order;
  }

  private async hasAddress(customerId: string) {
    const count = await this.prisma.customerAddress.count({ where: { customerId } });
    return count > 0;
  }

  private async findOrCreateCart(customerId: string) {
    const existing = await this.prisma.cart.findFirst({ where: { customerId }, orderBy: { updatedAt: "desc" } });
    if (existing) return existing;
    return this.prisma.cart.create({ data: { customerId } });
  }

  private async findOrCreateWishlist(customerId: string) {
    const existing = await this.prisma.wishlist.findUnique({ where: { customerId } });
    if (existing) return existing;
    return this.prisma.wishlist.create({ data: { customerId } });
  }

  private async toCartDto(cartId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: { product: { include: { category: true, images: { orderBy: { sortOrder: "asc" } } } } },
          orderBy: { updatedAt: "desc" }
        }
      }
    });
    if (!cart) throw new NotFoundException("Cart was not found.");
    return {
      id: cart.id,
      couponCode: cart.couponCode,
      items: cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        product: this.toProductDto(item.product)
      })),
      updatedAt: cart.updatedAt.toISOString()
    };
  }

  private async toWishlistDto(wishlistId: string) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { id: wishlistId },
      include: {
        items: {
          include: { product: { include: { category: true, images: { orderBy: { sortOrder: "asc" } } } } },
          orderBy: { createdAt: "desc" }
        }
      }
    });
    if (!wishlist) throw new NotFoundException("Wishlist was not found.");
    return {
      id: wishlist.id,
      items: wishlist.items.map((item) => ({
        productId: item.productId,
        priceWatch: item.priceWatch,
        backInStockAlert: item.backInStockAlert,
        product: this.toProductDto(item.product)
      })),
      updatedAt: wishlist.updatedAt.toISOString()
    };
  }

  private toCustomerDto(customer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    status: unknown;
    createdAt: Date;
  }) {
    const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim();
    return {
      id: customer.id,
      name: name || "FreshCart customer",
      email: customer.email || "",
      phone: customer.phone || "",
      birthday: "",
      memberType: "FreshCart household",
      status: String(customer.status),
      joinedAt: customer.createdAt.toISOString()
    };
  }

  private toAddressDto(address: {
    id: string;
    label: string;
    recipientName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    postalCode: string;
    landmark: string | null;
    isDefault: boolean;
  }) {
    return {
      id: address.id,
      label: address.label,
      recipient: address.recipientName,
      recipientName: address.recipientName,
      phone: address.phone,
      line: address.addressLine1,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      city: address.city,
      state: address.state,
      pincode: address.postalCode,
      postalCode: address.postalCode,
      landmark: address.landmark || "",
      area: address.landmark || address.city,
      note: address.landmark || "",
      default: address.isDefault,
      isDefault: address.isDefault,
      serviceable: true,
      recent: "Saved in database",
      branch: "Nearest available branch"
    };
  }

  private toNotificationDto(preferences: {
    orderUpdates: boolean;
    offers: boolean;
    wallet: boolean;
    support: boolean;
    email: boolean;
    whatsapp: boolean;
    sms: boolean;
  } | null) {
    return {
      "Order status": preferences?.orderUpdates ?? true,
      "Delivery rider calls": preferences?.orderUpdates ?? true,
      "WhatsApp updates": preferences?.whatsapp ?? true,
      "SMS alerts": preferences?.sms ?? false,
      "Email invoices": preferences?.email ?? true,
      "Marketing offers": preferences?.offers ?? false,
      "Back in stock": preferences?.offers ?? true,
      "Price drops": preferences?.offers ?? false,
      wallet: preferences?.wallet ?? true,
      support: preferences?.support ?? true
    };
  }

  private notificationChannelLabel(channel: NotificationChannel) {
    if (channel === NotificationChannel.IN_APP) return "In-app";
    if (channel === NotificationChannel.EMAIL) return "Email";
    if (channel === NotificationChannel.SMS) return "SMS";
    return "WhatsApp";
  }

  private notificationStatusLabel(status: NotificationStatus) {
    if (status === NotificationStatus.SENT) return "Sent";
    if (status === NotificationStatus.FAILED) return "Failed";
    if (status === NotificationStatus.CANCELLED) return "Cancelled";
    if (status === NotificationStatus.SKIPPED) return "Skipped";
    if (status === NotificationStatus.PROCESSING) return "Processing";
    return "Queued";
  }

  private payloadString(payload: unknown, key: string, fallback: string) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return fallback;
    const value = (payload as Record<string, unknown>)[key];
    return typeof value === "string" && value.trim() ? value : fallback;
  }

  private toWalletDto(
    wallet: Prisma.WalletGetPayload<{ include: { transactions: true } }> | null,
    loyalty: Prisma.LoyaltyAccountGetPayload<{ include: { transactions: true } }> | null
  ) {
    return {
      balance: wallet ? Number(wallet.balance) : 0,
      points: loyalty?.points ?? 0,
      tier: loyalty?.tier ?? "Member",
      transactions: [
        ...(wallet?.transactions.map((transaction) => ({
          id: transaction.id,
          type: transaction.type,
          amount: Number(transaction.amount),
          date: transaction.createdAt.toISOString(),
          note: transaction.note
        })) ?? []),
        ...(loyalty?.transactions.map((transaction) => ({
          id: transaction.id,
          type: transaction.type,
          amount: transaction.points,
          date: transaction.createdAt.toISOString(),
          note: transaction.note
        })) ?? [])
      ].sort((first, second) => (first.date < second.date ? 1 : -1))
    };
  }

  private toProductDto(
    product: Prisma.ProductGetPayload<{ include: { category: true; images: true } }>
  ) {
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category.name,
      categorySlug: product.category.slug,
      unit: product.unit,
      price: Number(product.price),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      badge: product.badge,
      stockStatus: product.stockStatus,
      rating: Number(product.averageRating),
      reviewCount: product.reviewCount,
      description: product.description,
      supplier: product.supplierName,
      tags: product.tags,
      image: product.images[0]?.url ?? null
    };
  }

  private toProductSnapshot(
    product: Prisma.ProductGetPayload<{ include: { category: true; images: true } }>
  ) {
    return this.toProductDto(product) as Prisma.JsonObject;
  }

  private toPaymentMethod(value: unknown) {
    const text = String(value ?? "").toLowerCase();
    if (text.includes("mock") || text.includes("upi") || text.includes("online") || text.includes("wallet")) return PaymentMethod.MOCK_ONLINE;
    if (text.includes("razorpay")) return PaymentMethod.RAZORPAY;
    return PaymentMethod.CASH_ON_DELIVERY;
  }

  private async buildCheckoutQuote(tx: Prisma.TransactionClient, body: BodyRecord, customerId: string): Promise<CheckoutQuote> {
    const address = this.asRecord(body.address);
    const pincode = this.optionalString(address.pincode ?? address.postalCode);
    const itemsInput = Array.isArray(body.items) ? body.items : [];
    if (itemsInput.length === 0) throw new BadRequestException("Cart has no items.");

    const quantityByProduct = new Map<string, number>();
    for (const item of itemsInput) {
      const record = this.asRecord(item);
      const productId = this.optionalString(record.productId ?? record.id);
      if (!productId) continue;
      quantityByProduct.set(productId, Math.max(1, Math.round(Number(record.quantity) || 1)));
    }
    const productIds = Array.from(quantityByProduct.keys());
    if (productIds.length === 0) throw new BadRequestException("Cart has no valid products.");

    const products = await tx.product.findMany({
      where: {
        id: { in: productIds },
        deletedAt: null,
        status: ProductStatus.ACTIVE,
        stockStatus: { notIn: [InventoryStatus.OUT_OF_STOCK, InventoryStatus.EXPIRED, InventoryStatus.DISABLED] }
      },
      include: { category: true, images: { orderBy: { sortOrder: "asc" } } }
    });
    if (products.length === 0) throw new BadRequestException("No valid in-stock products found for checkout.");
    if (products.length !== productIds.length) throw new BadRequestException("Some cart items are unavailable. Refresh cart before checkout.");

    const inventoryAllocations = new Map<string, { inventoryItemId: string; branchId: string; quantity: number; available: number }>();
    for (const product of products) {
      const quantity = quantityByProduct.get(product.id) ?? 1;
      const inventory = await tx.inventoryItem.findFirst({
        where: {
          productId: product.id,
          status: { notIn: [InventoryStatus.OUT_OF_STOCK, InventoryStatus.EXPIRED, InventoryStatus.DISABLED] },
          branch: {
            active: true,
            ...(pincode ? { serviceAreas: { some: { postalCode: pincode, active: true } } } : {})
          }
        },
        orderBy: [{ updatedAt: "desc" }]
      });
      const available = inventory ? inventory.onHand - inventory.reserved : 0;
      if (!inventory || available < quantity) {
        throw new BadRequestException(`${product.name} has only ${Math.max(available, 0)} unit(s) available for this address.`);
      }
      inventoryAllocations.set(product.id, { inventoryItemId: inventory.id, branchId: inventory.branchId, quantity, available });
    }

    const subtotal = this.roundMoney(
      products.reduce((sum, product) => {
        const quantity = quantityByProduct.get(product.id) ?? 1;
        const price = Number(product.salePrice ?? product.price);
        return sum + price * quantity;
      }, 0)
    );
    const deliveryFee = this.computeDeliveryFee(subtotal);
    const couponResult = await this.calculateCouponDiscount(tx, this.optionalString(body.couponCode), subtotal, deliveryFee);
    const discountTotal = couponResult.discountTotal;
    const grossTotal = this.roundMoney(Math.max(subtotal - discountTotal + deliveryFee, 0));
    const walletRequested = Math.max(0, Number(body.walletAmount ?? body.walletCredit ?? 0) || 0);
    const wallet = walletRequested > 0 ? await tx.wallet.findUnique({ where: { customerId } }) : null;
    const walletApplied = this.roundMoney(Math.min(walletRequested, grossTotal, Number(wallet?.balance ?? 0)));
    const payableTotal = this.roundMoney(Math.max(grossTotal - walletApplied, 0));

    return {
      products,
      quantityByProduct,
      inventoryAllocations,
      subtotal,
      deliveryFee,
      couponCode: couponResult.couponCode,
      discountTotal,
      grossTotal,
      walletRequested,
      walletApplied,
      payableTotal
    };
  }

  private toCheckoutQuoteDto(quote: CheckoutQuote) {
    return {
      items: quote.products.map((product) => {
        const quantity = quote.quantityByProduct.get(product.id) ?? 1;
        const unitPrice = Number(product.salePrice ?? product.price);
        const allocation = quote.inventoryAllocations.get(product.id);
        return {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          unit: product.unit,
          quantity,
          unitPrice,
          lineTotal: this.roundMoney(unitPrice * quantity),
          availableQuantity: allocation?.available ?? 0,
          image: product.images[0]?.url ?? null
        };
      }),
      subtotal: quote.subtotal,
      deliveryFee: quote.deliveryFee,
      couponCode: quote.couponCode,
      discountTotal: quote.discountTotal,
      total: quote.grossTotal,
      walletRequested: quote.walletRequested,
      walletApplied: quote.walletApplied,
      payableTotal: quote.payableTotal,
      serverPriced: true
    };
  }

  private async calculateCouponDiscount(tx: Prisma.TransactionClient, couponCode: string | undefined, subtotal: number, deliveryFee: number) {
    const code = couponCode?.trim().toUpperCase();
    if (!code) return { couponCode: "", discountTotal: 0 };
    const coupon = await tx.coupon.findUnique({ where: { code } });
    const now = new Date();
    if (!coupon || coupon.status !== PromotionStatus.LIVE) throw new BadRequestException("Coupon is not active.");
    if (coupon.startsAt && coupon.startsAt > now) throw new BadRequestException("Coupon has not started yet.");
    if (coupon.endsAt && coupon.endsAt < now) throw new BadRequestException("Coupon has expired.");
    if (coupon.minCart && subtotal < Number(coupon.minCart)) throw new BadRequestException(`Coupon requires minimum cart Rs. ${Number(coupon.minCart)}.`);
    let discount = 0;
    if (coupon.discountType === DiscountType.PERCENTAGE) discount = subtotal * (Number(coupon.value) / 100);
    if (coupon.discountType === DiscountType.FIXED_AMOUNT) discount = Number(coupon.value);
    if (coupon.discountType === DiscountType.FREE_DELIVERY) discount = deliveryFee;
    if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
    return { couponCode: code, discountTotal: this.roundMoney(Math.min(Math.max(discount, 0), subtotal + deliveryFee)) };
  }

  private computeDeliveryFee(subtotal: number) {
    return subtotal >= 499 ? 0 : 39;
  }

  private async syncInventoryProductStatus(tx: Prisma.TransactionClient, productId: string, available: number, threshold: number) {
    const stockStatus =
      available <= 0 ? InventoryStatus.OUT_OF_STOCK : available <= Math.max(threshold, 1) ? InventoryStatus.LOW_STOCK : InventoryStatus.IN_STOCK;
    await tx.product.update({ where: { id: productId }, data: { stockStatus } });
  }

  private defaultProviderRef(method: PaymentMethod, orderNumber: string) {
    if (method === PaymentMethod.CASH_ON_DELIVERY) return null;
    return `MOCK-${orderNumber}-${Date.now().toString().slice(-6)}`;
  }

  private roundMoney(value: number) {
    return Math.round((Number(value) || 0) * 100) / 100;
  }

  private async nextOrderNumber(client: { order: { findUnique: (args: { where: { orderNumber: string } }) => Promise<unknown> } } = this.prisma): Promise<string> {
    const suffix = Math.floor(10000 + Math.random() * 89999);
    const orderNumber = `FC-${suffix}`;
    const existing = await client.order.findUnique({ where: { orderNumber } });
    return existing ? this.nextOrderNumber(client) : orderNumber;
  }

  private async requireCustomer(authorization?: string) {
    const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";
    if (!token) throw new UnauthorizedException("Customer bearer token is required.");
    const session = await this.prisma.customerSession.findFirst({
      where: { tokenHash: hashToken(token), revokedAt: null, expiresAt: { gt: new Date() } },
      include: { customer: true }
    });
    if (!session || session.customer.status !== "ACTIVE") throw new UnauthorizedException("Customer session is invalid or expired.");
    return session.customer;
  }

  private async defaultCustomer() {
    const existing = await this.prisma.customer.findFirst({ orderBy: { createdAt: "asc" } });
    if (existing) return existing;
    return this.prisma.customer.create({
      data: {
        phone: "+910000000000",
        firstName: "Guest",
        lastName: "Customer",
        status: "ACTIVE",
        wallet: { create: { balance: 0 } },
        loyaltyAccount: { create: { points: 0, tier: "Member" } },
        notifications: { create: {} }
      }
    });
  }

  private async findOrCreateWallet(customerId: string) {
    const existing = await this.prisma.wallet.findUnique({ where: { customerId } });
    if (existing) return existing;
    return this.prisma.wallet.create({ data: { customerId, balance: 0 } });
  }

  private async findOrCreateLoyalty(customerId: string) {
    const existing = await this.prisma.loyaltyAccount.findUnique({ where: { customerId } });
    if (existing) return existing;
    return this.prisma.loyaltyAccount.create({ data: { customerId, points: 0, tier: "Member" } });
  }

  private async findOrCreateSupportConversation(customerId: string) {
    const existing = await this.prisma.supportConversation.findFirst({
      where: { customerId, status: { in: ["OPEN", "PENDING"] } },
      orderBy: { updatedAt: "desc" }
    });
    if (existing) return existing;
    return this.prisma.supportConversation.create({
      data: {
        customerId,
        subject: "Customer support",
        status: "OPEN",
        channel: "CHAT",
        lastMessageAt: new Date()
      }
    });
  }

  private async toSupportConversationDto(conversationId: string) {
    const conversation = await this.prisma.supportConversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: "asc" } } }
    });
    if (!conversation) throw new NotFoundException("Support conversation was not found.");
    return {
      id: conversation.id,
      subject: conversation.subject,
      status: conversation.status,
      channel: conversation.channel,
      messages: conversation.messages.map((message) => ({
        id: message.id,
        sender: message.senderType === "CUSTOMER" ? "user" : "agent",
        text: message.body,
        createdAt: message.createdAt.toISOString()
      }))
    };
  }

  private toOrderDto(
    order: Prisma.OrderGetPayload<{ include: { customer: true; items: true; payments: true; refunds: true } }>
  ) {
    const primaryPayment = order.payments[0];
    return {
      id: order.orderNumber,
      customer: this.customerName(order.customer),
      status: this.fromOrderStatus(order.status),
      payment: this.fromPaymentStatus(order.paymentStatus),
      paymentMethod: primaryPayment ? this.fromPaymentMethod(primaryPayment.method) : "",
      payableTotal: Number(this.snapshotValue(order.deliveryAddressSnapshot, "payableTotal", String(order.total))) || Number(order.total),
      walletApplied: Number(this.snapshotValue(order.deliveryAddressSnapshot, "walletApplied", "0")) || 0,
      couponCode: this.snapshotValue(order.deliveryAddressSnapshot, "couponCode", ""),
      slot: this.snapshotValue(order.deliveryAddressSnapshot, "slot", "Slot not selected"),
      total: Number(order.total),
      items: order.items.map((item) => item.productName),
      itemDetails: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        slug: item.productSlug,
        name: item.productName,
        unit: item.unit,
        quantity: item.quantity,
        price: Number(item.lineTotal),
        unitPrice: Number(item.unitPrice)
      })),
      canCancel: order.status === OrderStatus.PLACED || order.status === OrderStatus.CONFIRMED,
      canReturn: order.status === OrderStatus.DELIVERED,
      refundCount: order.refunds.length,
      placedAt: order.placedAt.toISOString()
    };
  }

  private toRefundDto(refund: { id: string; orderId: string; reason: string; note: string | null; status: RefundStatus; amount: unknown; createdAt: Date }) {
    return {
      id: refund.id,
      orderId: refund.orderId,
      reason: refund.reason,
      note: refund.note,
      status: refund.status,
      amount: refund.amount === null ? null : Number(refund.amount),
      createdAt: refund.createdAt.toISOString()
    };
  }

  private toReviewDto(
    review: Prisma.ProductReviewGetPayload<{ include: { images: true; product: { include: { category: true } } } }>
  ) {
    return {
      id: review.id,
      productId: review.productId,
      productSlug: review.product.slug,
      productName: review.product.name,
      category: review.product.category.name,
      unit: review.product.unit,
      color: review.product.badge || "#EFE7D8",
      rating: review.rating.toFixed(1),
      text: review.body,
      title: review.title,
      imageNote: review.images[0]?.url ?? "",
      submitted: review.status !== ContentStatus.DRAFT,
      moderation: review.status === ContentStatus.PUBLISHED ? "Approved" : review.status === ContentStatus.ARCHIVED ? "Rejected" : "Pending",
      helpful: review.helpfulCount,
      reward: review.status === ContentStatus.PUBLISHED ? 25 : 0,
      updatedAt: review.updatedAt.toISOString()
    };
  }

  private fromOrderStatus(status: OrderStatus) {
    if (status === OrderStatus.OUT_FOR_DELIVERY) return "Out for delivery";
    if (status === OrderStatus.DELIVERED) return "Delivered";
    if (status === OrderStatus.CANCELLED) return "Cancelled";
    if (status === OrderStatus.PACKED) return "Packed";
    return "Confirmed";
  }

  private fromPaymentStatus(status: PaymentStatus) {
    if (status === PaymentStatus.PAID) return "Paid";
    if (status === PaymentStatus.COD_PENDING) return "COD pending";
    if (status === PaymentStatus.FAILED) return "Failed";
    if (status === PaymentStatus.REFUNDED) return "Refunded";
    return "Pending";
  }

  private fromPaymentMethod(method: PaymentMethod) {
    if (method === PaymentMethod.CASH_ON_DELIVERY) return "Cash on delivery";
    if (method === PaymentMethod.RAZORPAY) return "Razorpay";
    return "Mock online payment";
  }

  private customerName(customer: { firstName: string | null; lastName: string | null; phone: string | null; email: string | null } | null) {
    const name = [customer?.firstName, customer?.lastName].filter(Boolean).join(" ").trim();
    return name || customer?.phone || customer?.email || "FreshCart customer";
  }

  private snapshotValue(snapshot: unknown, key: string, fallback: string) {
    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return fallback;
    const value = (snapshot as Record<string, unknown>)[key];
    if (typeof value === "number") return String(value);
    return typeof value === "string" && value.trim() ? value : fallback;
  }

  private contentText(body: unknown) {
    if (typeof body === "string") return body;
    if (!body || typeof body !== "object" || Array.isArray(body)) return "";
    const record = body as Record<string, unknown>;
    const value = record.content ?? record.body ?? record.text;
    return typeof value === "string" ? value : "";
  }

  private contentSections(body: unknown) {
    if (!body || typeof body !== "object" || Array.isArray(body)) return [];
    const sections = (body as Record<string, unknown>).sections;
    if (!Array.isArray(sections)) return [];
    return sections
      .map((section) => this.asRecord(section))
      .map((section) => ({
        heading: this.optionalString(section.heading ?? section.title) || "",
        body: this.optionalString(section.body ?? section.content ?? section.text) || ""
      }))
      .filter((section) => section.heading || section.body);
  }

  private asRecord(input: unknown): BodyRecord {
    return input && typeof input === "object" && !Array.isArray(input) ? (input as BodyRecord) : {};
  }

  private optionalString(value: unknown) {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  }

  private booleanFromInput(value: unknown, fallback: boolean) {
    if (value === undefined || value === null) return fallback;
    return value === true || value === "true" || value === "on" || value === "1";
  }

  private requiredString(value: unknown, label: string) {
    const text = this.optionalString(value);
    if (!text) throw new BadRequestException(`${label} is required.`);
    return text;
  }

  private slugify(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}
