import { BadRequestException, Injectable, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { AdminStatus, Prisma } from "@prisma/client";
import { success } from "../../common/api-response";
import { addDays, createBearerToken, createNumericCode, createPasswordHash, hashToken, verifyPassword } from "../../common/security/auth-crypto";
import { PrismaService } from "../../database/prisma.service";

type RequestCustomerOtpInput = {
  phone?: string;
  purpose?: string;
};

type VerifyCustomerOtpInput = {
  phone?: string;
  code?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

type AdminLoginInput = {
  email?: string;
  password?: string;
};

type AdminVerifyTwoFactorInput = {
  challengeToken?: string;
  code?: string;
};

const customerSessionDays = 30;
const adminSessionDays = 1;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async requestCustomerOtp(input: RequestCustomerOtpInput) {
    const phone = this.normalizePhone(input.phone);
    const purpose = input.purpose?.trim() || "LOGIN";
    const code = process.env.AUTH_DEV_OTP_CODE || createNumericCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    try {
      await this.prisma.customerOtpCode.create({
        data: {
          phone,
          purpose,
          codeHash: createPasswordHash(code),
          expiresAt
        }
      });
    } catch {
      throw new ServiceUnavailableException("OTP service is unavailable until the database is connected.");
    }

    return {
      phone,
      purpose,
      expiresAt: expiresAt.toISOString(),
      deliveryChannels: ["sms", "whatsapp"],
      ...(process.env.NODE_ENV === "production" ? {} : { devCode: code })
    };
  }

  async verifyCustomerOtp(input: VerifyCustomerOtpInput) {
    const phone = this.normalizePhone(input.phone);
    const code = input.code?.trim();
    if (!code) throw new BadRequestException("OTP code is required.");

    const otp = await this.prisma.customerOtpCode.findFirst({
      where: {
        phone,
        consumedAt: null,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: "desc" }
    });

    if (!otp) throw new UnauthorizedException("OTP is expired or invalid.");
    if (otp.attemptCount >= 5) throw new UnauthorizedException("Too many OTP attempts. Request a new code.");

    const verified = verifyPassword(code, otp.codeHash);
    if (!verified) {
      await this.prisma.customerOtpCode.update({
        where: { id: otp.id },
        data: { attemptCount: { increment: 1 } }
      });
      throw new UnauthorizedException("OTP is incorrect.");
    }

    const customer = await this.prisma.customer.upsert({
      where: { phone },
      update: {
        firstName: input.firstName?.trim() || undefined,
        lastName: input.lastName?.trim() || undefined,
        email: input.email?.trim().toLowerCase() || undefined,
        status: "ACTIVE"
      },
      create: {
        phone,
        firstName: input.firstName?.trim() || undefined,
        lastName: input.lastName?.trim() || undefined,
        email: input.email?.trim().toLowerCase() || undefined,
        status: "ACTIVE"
      }
    });

    await this.prisma.customerOtpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
    await this.ensureCustomerAccountRecords(customer.id);

    const session = await this.createCustomerSession(customer.id);
    return { customer: this.toCustomerDto(customer), ...session };
  }

  async getCustomerMe(authorization?: string) {
    const session = await this.getCustomerSessionWithAccount(authorization);

    return {
      customer: {
        ...this.toCustomerDto(session.customer),
        addresses: session.customer.addresses,
        notifications: session.customer.notifications,
        wallet: session.customer.wallet ? { balance: Number(session.customer.wallet.balance) } : null,
        loyalty: session.customer.loyaltyAccount
          ? { points: session.customer.loyaltyAccount.points, tier: session.customer.loyaltyAccount.tier }
          : null
      },
      expiresAt: session.expiresAt.toISOString()
    };
  }

  async logoutCustomer(authorization?: string) {
    const session = await this.getCustomerSession(authorization);
    await this.prisma.customerSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() }
    });
    return { loggedOut: true };
  }

  async listCustomerSessions(authorization?: string) {
    const currentSession = await this.getCustomerSession(authorization);
    const sessions = await this.prisma.customerSession.findMany({
      where: { customerId: currentSession.customerId },
      orderBy: { createdAt: "desc" }
    });
    return {
      sessions: sessions.map((session) => ({
        id: session.id,
        createdAt: session.createdAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
        revokedAt: session.revokedAt?.toISOString() ?? null,
        active: !session.revokedAt && session.expiresAt > new Date(),
        current: session.id === currentSession.id
      }))
    };
  }

  async logoutAllCustomerSessions(authorization?: string) {
    const session = await this.getCustomerSession(authorization);
    const result = await this.prisma.customerSession.updateMany({
      where: { customerId: session.customerId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    return { loggedOut: true, revokedSessions: result.count };
  }

  async loginAdmin(input: AdminLoginInput) {
    const email = this.normalizeEmail(input.email);
    const password = input.password;
    if (!password) throw new BadRequestException("Password is required.");

    const admin = await this.prisma.adminUser.findUnique({
      where: { email },
      include: {
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } }
      }
    });

    if (!admin || !verifyPassword(password, admin.passwordHash)) {
      throw new UnauthorizedException("Invalid admin credentials.");
    }
    if (admin.status !== AdminStatus.ACTIVE) throw new UnauthorizedException("Admin account is not active.");

    if (admin.twoFactorEnabled) {
      const challengeToken = createBearerToken("adm");
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      await this.prisma.adminLoginChallenge.create({
        data: {
          adminUserId: admin.id,
          tokenHash: hashToken(challengeToken),
          expiresAt
        }
      });

      return {
        requiresTwoFactor: true,
        challengeToken,
        expiresAt: expiresAt.toISOString(),
        devCode: process.env.NODE_ENV === "production" ? undefined : this.adminDevTwoFactorCode()
      };
    }

    const session = await this.createAdminSession(admin.id);
    await this.recordAdminAudit(admin.id, "ADMIN_LOGIN", "AdminUser", admin.id);
    return { requiresTwoFactor: false, admin: this.toAdminDto(admin), ...session };
  }

  async verifyAdminTwoFactor(input: AdminVerifyTwoFactorInput) {
    const challengeToken = input.challengeToken?.trim();
    const code = input.code?.trim();
    if (!challengeToken) throw new BadRequestException("Challenge token is required.");
    if (!code) throw new BadRequestException("2FA code is required.");

    const challenge = await this.prisma.adminLoginChallenge.findFirst({
      where: {
        tokenHash: hashToken(challengeToken),
        consumedAt: null,
        expiresAt: { gt: new Date() }
      },
      include: {
        adminUser: {
          include: {
            roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } }
          }
        }
      }
    });

    if (!challenge) throw new UnauthorizedException("2FA challenge is expired or invalid.");
    if (challenge.attemptCount >= 5) throw new UnauthorizedException("Too many 2FA attempts. Login again.");
    if (code !== this.adminDevTwoFactorCode()) {
      await this.prisma.adminLoginChallenge.update({
        where: { id: challenge.id },
        data: { attemptCount: { increment: 1 } }
      });
      throw new UnauthorizedException("2FA code is incorrect.");
    }

    await this.prisma.adminLoginChallenge.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } });
    const session = await this.createAdminSession(challenge.adminUser.id);
    await this.recordAdminAudit(challenge.adminUser.id, "ADMIN_LOGIN_2FA", "AdminUser", challenge.adminUser.id);

    return { admin: this.toAdminDto(challenge.adminUser), ...session };
  }

  async getAdminMe(authorization?: string) {
    const session = await this.getAdminSessionWithRoles(authorization);

    return { admin: this.toAdminDto(session.adminUser), expiresAt: session.expiresAt.toISOString() };
  }

  async logoutAdmin(authorization?: string) {
    const session = await this.getAdminSession(authorization);
    await this.prisma.adminSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    await this.recordAdminAudit(session.adminUserId, "ADMIN_LOGOUT", "AdminSession", session.id);
    return { loggedOut: true };
  }

  async listAdminPermissions(authorization?: string) {
    const session = await this.getAdminSessionWithRoles(authorization);
    const grantedKeys = new Set(
      session.adminUser.roles.flatMap(({ role }) => role.permissions.map(({ permission }) => permission.key))
    );
    const permissions = await this.prisma.adminPermission.findMany({ orderBy: [{ module: "asc" }, { key: "asc" }] });
    return {
      permissions: permissions.map((permission) => ({
        ...permission,
        granted: grantedKeys.has(permission.key) || session.adminUser.roles.some(({ role }) => role.name === "Owner")
      })),
      grantedPermissions: permissions.filter((permission) => grantedKeys.has(permission.key) || session.adminUser.roles.some(({ role }) => role.name === "Owner"))
    };
  }

  async listAdminSessions(authorization?: string) {
    const currentSession = await this.getAdminSession(authorization);
    const sessions = await this.prisma.adminSession.findMany({
      where: { adminUserId: currentSession.adminUserId },
      orderBy: { createdAt: "desc" }
    });
    return {
      sessions: sessions.map((session) => ({
        id: session.id,
        createdAt: session.createdAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
        revokedAt: session.revokedAt?.toISOString() ?? null,
        active: !session.revokedAt && session.expiresAt > new Date(),
        current: session.id === currentSession.id
      }))
    };
  }

  async logoutAllAdminSessions(authorization?: string) {
    const session = await this.getAdminSession(authorization);
    const result = await this.prisma.adminSession.updateMany({
      where: { adminUserId: session.adminUserId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    await this.recordAdminAudit(session.adminUserId, "ADMIN_LOGOUT_ALL", "AdminSession", session.id, { revokedSessions: result.count });
    return { loggedOut: true, revokedSessions: result.count };
  }

  response<T>(data: T) {
    return success(data);
  }

  private async getCustomerSession(authorization?: string) {
    const tokenHash = this.getBearerTokenHash(authorization);
    const session = await this.prisma.customerSession.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } }
    });

    if (!session) throw new UnauthorizedException("Customer session is invalid or expired.");
    return session;
  }

  private async getCustomerSessionWithAccount(authorization?: string) {
    const tokenHash = this.getBearerTokenHash(authorization);
    const session = await this.prisma.customerSession.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
      include: {
        customer: {
          include: {
            addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] },
            notifications: true,
            wallet: true,
            loyaltyAccount: true
          }
        }
      }
    });

    if (!session) throw new UnauthorizedException("Customer session is invalid or expired.");
    return session;
  }

  private async getAdminSession(authorization?: string) {
    const tokenHash = this.getBearerTokenHash(authorization);
    const session = await this.prisma.adminSession.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { adminUser: true }
    });

    if (!session) throw new UnauthorizedException("Admin session is invalid or expired.");
    if (session.adminUser.status !== AdminStatus.ACTIVE) throw new UnauthorizedException("Admin account is not active.");
    return session;
  }

  private async getAdminSessionWithRoles(authorization?: string) {
    const tokenHash = this.getBearerTokenHash(authorization);
    const session = await this.prisma.adminSession.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
      include: {
        adminUser: {
          include: {
            roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } }
          }
        }
      }
    });

    if (!session) throw new UnauthorizedException("Admin session is invalid or expired.");
    if (session.adminUser.status !== AdminStatus.ACTIVE) throw new UnauthorizedException("Admin account is not active.");
    return session;
  }

  private async createCustomerSession(customerId: string) {
    const token = createBearerToken("cus");
    const expiresAt = addDays(new Date(), customerSessionDays);
    await this.prisma.customerSession.create({
      data: { customerId, tokenHash: hashToken(token), expiresAt }
    });
    return { token, tokenType: "Bearer", expiresAt: expiresAt.toISOString() };
  }

  private async createAdminSession(adminUserId: string) {
    const token = createBearerToken("adm");
    const expiresAt = addDays(new Date(), adminSessionDays);
    await this.prisma.adminSession.create({
      data: { adminUserId, tokenHash: hashToken(token), expiresAt }
    });
    await this.prisma.adminUser.update({ where: { id: adminUserId }, data: { lastLoginAt: new Date() } });
    return { token, tokenType: "Bearer", expiresAt: expiresAt.toISOString() };
  }

  private async ensureCustomerAccountRecords(customerId: string) {
    await Promise.all([
      this.prisma.customerNotificationPreference.upsert({
        where: { customerId },
        update: {},
        create: { customerId }
      }),
      this.prisma.wallet.upsert({
        where: { customerId },
        update: {},
        create: { customerId }
      }),
      this.prisma.loyaltyAccount.upsert({
        where: { customerId },
        update: {},
        create: { customerId }
      }),
      this.prisma.wishlist.upsert({
        where: { customerId },
        update: {},
        create: { customerId }
      })
    ]);
  }

  private async recordAdminAudit(adminUserId: string, action: string, resourceType: string, resourceId?: string, metadata?: Prisma.InputJsonValue) {
    await this.prisma.adminAuditLog.create({
      data: { adminUserId, action, resourceType, resourceId, metadata }
    });
  }

  private getBearerTokenHash(authorization?: string) {
    const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";
    if (!token) throw new UnauthorizedException("Bearer token is required.");
    return hashToken(token);
  }

  private normalizePhone(phone?: string) {
    const normalized = phone?.replace(/[^\d+]/g, "").trim();
    if (!normalized || normalized.length < 10) throw new BadRequestException("Valid phone number is required.");
    return normalized;
  }

  private normalizeEmail(email?: string) {
    const normalized = email?.trim().toLowerCase();
    if (!normalized || !normalized.includes("@")) throw new BadRequestException("Valid email is required.");
    return normalized;
  }

  private adminDevTwoFactorCode() {
    return process.env.ADMIN_DEV_2FA_CODE || "123456";
  }

  private toCustomerDto(customer: { id: string; phone: string | null; email: string | null; firstName: string | null; lastName: string | null; status: string }) {
    return {
      id: customer.id,
      phone: customer.phone,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      status: customer.status
    };
  }

  private toAdminDto(admin: {
    id: string;
    email: string;
    name: string;
    status: string;
    twoFactorEnabled: boolean;
    roles: Array<{
      role: {
        id: string;
        name: string;
        description: string | null;
        permissions: Array<{ permission: { key: string; label: string; module: string } }>;
      };
    }>;
  }) {
    const roles = admin.roles.map(({ role }) => ({
      id: role.id,
      name: role.name,
      description: role.description
    }));
    const permissions = Array.from(
      new Map(admin.roles.flatMap(({ role }) => role.permissions.map(({ permission }) => [permission.key, permission]))).values()
    ).sort((a, b) => a.key.localeCompare(b.key));

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      status: admin.status,
      twoFactorEnabled: admin.twoFactorEnabled,
      roles,
      permissions
    };
  }
}
