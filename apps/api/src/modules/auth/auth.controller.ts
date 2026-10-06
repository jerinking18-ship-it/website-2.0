import { Body, Controller, Get, Headers, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("customer/request-otp")
  async requestCustomerOtp(@Body() body: unknown) {
    return this.authService.response(await this.authService.requestCustomerOtp((body ?? {}) as Record<string, string>));
  }

  @Post("customer/verify-otp")
  async verifyCustomerOtp(@Body() body: unknown) {
    return this.authService.response(await this.authService.verifyCustomerOtp((body ?? {}) as Record<string, string>));
  }

  @Get("customer/me")
  async getCustomerMe(@Headers("authorization") authorization?: string) {
    return this.authService.response(await this.authService.getCustomerMe(authorization));
  }

  @Post("customer/logout")
  async logoutCustomer(@Headers("authorization") authorization?: string) {
    return this.authService.response(await this.authService.logoutCustomer(authorization));
  }

  @Get("customer/sessions")
  async listCustomerSessions(@Headers("authorization") authorization?: string) {
    return this.authService.response(await this.authService.listCustomerSessions(authorization));
  }

  @Post("customer/logout-all")
  async logoutAllCustomerSessions(@Headers("authorization") authorization?: string) {
    return this.authService.response(await this.authService.logoutAllCustomerSessions(authorization));
  }

  @Post("admin/login")
  async loginAdmin(@Body() body: unknown) {
    return this.authService.response(await this.authService.loginAdmin((body ?? {}) as Record<string, string>));
  }

  @Post("admin/verify-2fa")
  async verifyAdminTwoFactor(@Body() body: unknown) {
    return this.authService.response(await this.authService.verifyAdminTwoFactor((body ?? {}) as Record<string, string>));
  }

  @Get("admin/me")
  async getAdminMe(@Headers("authorization") authorization?: string) {
    return this.authService.response(await this.authService.getAdminMe(authorization));
  }

  @Post("admin/logout")
  async logoutAdmin(@Headers("authorization") authorization?: string) {
    return this.authService.response(await this.authService.logoutAdmin(authorization));
  }

  @Get("admin/permissions")
  async listAdminPermissions(@Headers("authorization") authorization?: string) {
    return this.authService.response(await this.authService.listAdminPermissions(authorization));
  }

  @Get("admin/sessions")
  async listAdminSessions(@Headers("authorization") authorization?: string) {
    return this.authService.response(await this.authService.listAdminSessions(authorization));
  }

  @Post("admin/logout-all")
  async logoutAllAdminSessions(@Headers("authorization") authorization?: string) {
    return this.authService.response(await this.authService.logoutAllAdminSessions(authorization));
  }
}
