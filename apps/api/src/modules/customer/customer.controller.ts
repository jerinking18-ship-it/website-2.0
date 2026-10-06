import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from "@nestjs/common";
import { success } from "../../common/api-response";
import { CustomerService } from "./customer.service";

@Controller("customer")
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get("account")
  async getAccount(@Headers("authorization") authorization?: string) {
    return success(await this.customerService.getAccount(authorization));
  }

  @Patch("account")
  async updateAccount(@Body() body: unknown, @Headers("authorization") authorization?: string) {
    return success(await this.customerService.updateAccount(body, authorization));
  }

  @Patch("notifications")
  async updateNotificationPreferences(@Body() body: unknown, @Headers("authorization") authorization?: string) {
    return success(await this.customerService.updateNotificationPreferences(body, authorization));
  }

  @Get("notifications/history")
  async listNotificationHistory(@Headers("authorization") authorization?: string) {
    return success(await this.customerService.listNotificationHistory(authorization));
  }

  @Get("wallet")
  async getWallet(@Headers("authorization") authorization?: string) {
    return success(await this.customerService.getWallet(authorization));
  }

  @Post("wallet/top-up")
  async topUpWallet(@Body() body: unknown, @Headers("authorization") authorization?: string) {
    return success(await this.customerService.topUpWallet(body, authorization));
  }

  @Post("wallet/redeem")
  async redeemLoyaltyPoints(@Body() body: unknown, @Headers("authorization") authorization?: string) {
    return success(await this.customerService.redeemLoyaltyPoints(body, authorization));
  }

  @Get("addresses")
  async listAddresses(@Headers("authorization") authorization?: string) {
    return success(await this.customerService.listAddresses(authorization));
  }

  @Post("addresses")
  async upsertAddress(@Body() body: unknown, @Headers("authorization") authorization?: string) {
    return success(await this.customerService.upsertAddress(body, authorization));
  }

  @Patch("addresses/:id/default")
  async setDefaultAddress(@Param("id") id: string, @Headers("authorization") authorization?: string) {
    return success(await this.customerService.setDefaultAddress(id, authorization));
  }

  @Delete("addresses/:id")
  async deleteAddress(@Param("id") id: string, @Headers("authorization") authorization?: string) {
    return success(await this.customerService.deleteAddress(id, authorization));
  }

  @Get("cart")
  async getCart(@Headers("authorization") authorization?: string) {
    return success(await this.customerService.getCart(authorization));
  }

  @Post("cart/items")
  async updateCart(@Body() body: unknown, @Headers("authorization") authorization?: string) {
    return success(await this.customerService.updateCart(body, authorization));
  }

  @Delete("cart")
  async clearCart(@Headers("authorization") authorization?: string) {
    return success(await this.customerService.clearCart(authorization));
  }

  @Post("checkout/quote")
  async quoteCheckout(@Body() body: unknown, @Headers("authorization") authorization?: string) {
    return success(await this.customerService.quoteCheckout(body, authorization));
  }

  @Get("wishlist")
  async getWishlist(@Headers("authorization") authorization?: string) {
    return success(await this.customerService.getWishlist(authorization));
  }

  @Post("wishlist")
  async toggleWishlist(@Body() body: unknown, @Headers("authorization") authorization?: string) {
    return success(await this.customerService.toggleWishlist(body, authorization));
  }

  @Patch("wishlist/:productId")
  async updateWishlistItem(@Param("productId") productId: string, @Body() body: unknown, @Headers("authorization") authorization?: string) {
    return success(await this.customerService.updateWishlistItem(productId, body, authorization));
  }

  @Post("checkout")
  async createCheckoutOrder(@Body() body: unknown, @Headers("authorization") authorization?: string) {
    return success(await this.customerService.createCheckoutOrder(body, authorization));
  }

  @Get("orders")
  async listOrders(@Headers("authorization") authorization?: string) {
    return success(await this.customerService.listOrders(authorization));
  }

  @Get("orders/:orderNumber/tracking")
  async getTracking(@Param("orderNumber") orderNumber: string, @Headers("authorization") authorization?: string) {
    return success(await this.customerService.getTracking(orderNumber, authorization));
  }

  @Get("orders/:orderNumber/invoice")
  async getInvoice(@Param("orderNumber") orderNumber: string, @Headers("authorization") authorization?: string) {
    return success(await this.customerService.getInvoice(orderNumber, authorization));
  }

  @Patch("orders/:orderNumber/cancel")
  async cancelOrder(@Param("orderNumber") orderNumber: string, @Headers("authorization") authorization?: string) {
    return success(await this.customerService.cancelOrder(orderNumber, authorization));
  }

  @Post("orders/:orderNumber/refunds")
  async requestRefund(@Param("orderNumber") orderNumber: string, @Body() body: unknown, @Headers("authorization") authorization?: string) {
    return success(await this.customerService.requestRefund(orderNumber, body, authorization));
  }

  @Get("reviews")
  async listReviews(@Headers("authorization") authorization?: string) {
    return success(await this.customerService.listReviews(authorization));
  }

  @Post("reviews")
  async upsertReview(@Body() body: unknown, @Headers("authorization") authorization?: string) {
    return success(await this.customerService.upsertReview(body, authorization));
  }

  @Delete("reviews/:id")
  async deleteReview(@Param("id") id: string, @Headers("authorization") authorization?: string) {
    return success(await this.customerService.deleteReview(id, authorization));
  }

  @Post("reviews/:id/helpful")
  async markHelpful(@Param("id") id: string, @Headers("authorization") authorization?: string) {
    return success(await this.customerService.markHelpful(id, authorization));
  }

  @Get("support")
  async getSupportThread(@Headers("authorization") authorization?: string) {
    return success(await this.customerService.getSupportThread(authorization));
  }

  @Post("contact")
  async submitContactMessage(@Body() body: unknown) {
    return success(await this.customerService.submitContactMessage(body));
  }

  @Get("branches")
  async listBranches() {
    return success(await this.customerService.listBranches());
  }

  @Get("delivery-slots")
  async listDeliverySlots() {
    return success(await this.customerService.listDeliverySlots());
  }

  @Get("content/:slug")
  async getContentPage(@Param("slug") slug: string) {
    return success(await this.customerService.getContentPage(slug));
  }

  @Post("support")
  async sendSupportMessage(@Body() body: unknown, @Headers("authorization") authorization?: string) {
    return success(await this.customerService.sendSupportMessage(body, authorization));
  }

  @Get("search-history")
  async listSearchHistory(@Headers("authorization") authorization?: string) {
    return success(await this.customerService.listSearchHistory(authorization));
  }

  @Post("search-history")
  async saveSearch(@Body() body: unknown, @Headers("authorization") authorization?: string) {
    return success(await this.customerService.saveSearch(body, authorization));
  }

  @Delete("search-history")
  async clearSearchHistory(@Headers("authorization") authorization?: string) {
    return success(await this.customerService.clearSearchHistory(authorization));
  }

  @Post("serviceability")
  async checkServiceability(@Body() body: unknown) {
    return success(await this.customerService.checkServiceability(body));
  }
}
