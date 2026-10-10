import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from "@nestjs/common";
import { success } from "../../common/api-response";
import { AdminService } from "./admin.service";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("state/:key")
  async getAdminState(@Headers("authorization") authorization: string | undefined, @Param("key") key: string) {
    return success(await this.adminService.getAdminState(authorization, key));
  }

  @Patch("state/:key")
  async saveAdminState(@Headers("authorization") authorization: string | undefined, @Param("key") key: string, @Body() body: unknown) {
    return success(await this.adminService.saveAdminState(authorization, key, body));
  }

  @Post("notifications/process")
  async processNotifications(@Headers("authorization") authorization: string | undefined, @Body() body: unknown) {
    return success(await this.adminService.processNotifications(authorization, body));
  }

  @Post("notifications/:id/send")
  async sendNotification(@Headers("authorization") authorization: string | undefined, @Param("id") id: string) {
    return success(await this.adminService.sendNotification(authorization, id));
  }

  @Post("search/reindex")
  async reindexSearch(@Headers("authorization") authorization: string | undefined) {
    return success(await this.adminService.reindexSearch(authorization));
  }

  @Get("products")
  async listProducts(@Headers("authorization") authorization?: string) {
    return success(await this.adminService.listProducts(authorization));
  }

  @Post("products")
  async createProduct(@Headers("authorization") authorization: string | undefined, @Body() body: unknown) {
    return success(await this.adminService.createProduct(authorization, body));
  }

  @Patch("products/bulk/status")
  async bulkUpdateProducts(@Headers("authorization") authorization: string | undefined, @Body() body: unknown) {
    return success(await this.adminService.bulkUpdateProducts(authorization, body));
  }

  @Patch("products/:id")
  async updateProduct(@Headers("authorization") authorization: string | undefined, @Param("id") id: string, @Body() body: unknown) {
    return success(await this.adminService.updateProduct(authorization, id, body));
  }

  @Get("categories")
  async listCategories(@Headers("authorization") authorization?: string) {
    return success(await this.adminService.listCategories(authorization));
  }

  @Post("categories")
  async createCategory(@Headers("authorization") authorization: string | undefined, @Body() body: unknown) {
    return success(await this.adminService.createCategory(authorization, body));
  }

  @Patch("categories/:id")
  async updateCategory(@Headers("authorization") authorization: string | undefined, @Param("id") id: string, @Body() body: unknown) {
    return success(await this.adminService.updateCategory(authorization, id, body));
  }

  @Delete("categories/:id")
  async deleteCategory(@Headers("authorization") authorization: string | undefined, @Param("id") id: string) {
    return success(await this.adminService.deleteCategory(authorization, id));
  }

  @Get("coupons")
  async listCoupons(@Headers("authorization") authorization?: string) {
    return success(await this.adminService.listCoupons(authorization));
  }

  @Post("coupons")
  async createCoupon(@Headers("authorization") authorization: string | undefined, @Body() body: unknown) {
    return success(await this.adminService.createCoupon(authorization, body));
  }

  @Patch("coupons/:code")
  async updateCoupon(@Headers("authorization") authorization: string | undefined, @Param("code") code: string, @Body() body: unknown) {
    return success(await this.adminService.updateCoupon(authorization, code, body));
  }

  @Get("promotions")
  async listPromotions(@Headers("authorization") authorization?: string) {
    return success(await this.adminService.listPromotions(authorization));
  }

  @Post("promotions")
  async createPromotion(@Headers("authorization") authorization: string | undefined, @Body() body: unknown) {
    return success(await this.adminService.createPromotion(authorization, body));
  }

  @Patch("promotions/:id")
  async updatePromotion(@Headers("authorization") authorization: string | undefined, @Param("id") id: string, @Body() body: unknown) {
    return success(await this.adminService.updatePromotion(authorization, id, body));
  }

  @Get("coupon-banners")
  async listCouponBanners(@Headers("authorization") authorization?: string) {
    return success(await this.adminService.listCouponBanners(authorization));
  }

  @Post("coupon-banners")
  async createCouponBanner(@Headers("authorization") authorization: string | undefined, @Body() body: unknown) {
    return success(await this.adminService.createCouponBanner(authorization, body));
  }

  @Patch("coupon-banners/:id")
  async updateCouponBanner(@Headers("authorization") authorization: string | undefined, @Param("id") id: string, @Body() body: unknown) {
    return success(await this.adminService.updateCouponBanner(authorization, id, body));
  }
}
