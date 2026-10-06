import { Injectable } from "@nestjs/common";
import { publicMediaBaseUrl } from "../../common/media/media-paths";
import { SearchIndexService } from "../../common/search/search-index.service";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class HealthService {
  private readonly bootedAt = new Date();

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchIndex: SearchIndexService
  ) {}

  async getHealth() {
    const readiness = await this.getReadiness();
    return {
      service: "freshcart-api",
      status: readiness.status === "ready" ? "ok" : "degraded",
      database: readiness.checks.database.status,
      redis: "not_configured",
      checkedAt: readiness.checkedAt
    };
  }

  getLiveness() {
    return {
      service: "freshcart-api",
      status: "alive",
      bootedAt: this.bootedAt.toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      checkedAt: new Date().toISOString()
    };
  }

  async getReadiness() {
    const checkedAt = new Date();
    const [database, search] = await Promise.all([this.checkDatabase(), this.searchIndex.health()]);
    const environment = this.checkEnvironment();
    const status = database.status === "up" && environment.status === "ok" ? "ready" : "degraded";

    return {
      service: "freshcart-api",
      status,
      checkedAt: checkedAt.toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      checks: {
        database,
        environment,
        search,
        storage: this.checkStorage()
      }
    };
  }

  getVersion() {
    return {
      service: "freshcart-api",
      version: "0.1.0",
      phase: "backend-production-hardening",
      apiPrefix: "/api",
      nodeEnv: process.env.NODE_ENV || "development"
    };
  }

  private async checkDatabase() {
    const startedAt = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "up" as const, latencyMs: Date.now() - startedAt };
    } catch (error) {
      return {
        status: "down" as const,
        latencyMs: Date.now() - startedAt,
        message: error instanceof Error ? error.message : "Database check failed"
      };
    }
  }

  private checkEnvironment() {
    const missing = requiredEnvKeys.filter((key) => !process.env[key]?.trim());
    const warnings = this.environmentWarnings();
    return {
      status: missing.length ? "missing_required" as const : "ok" as const,
      required: requiredEnvKeys.map((key) => ({ key, present: Boolean(process.env[key]?.trim()) })),
      warnings
    };
  }

  private checkStorage() {
    return {
      status: "local" as const,
      mediaPublicRoot: process.env.MEDIA_PUBLIC_ROOT?.trim() || "default",
      publicBaseUrl: publicMediaBaseUrl()
    };
  }

  private environmentWarnings() {
    const warnings: string[] = [];
    if (process.env.NODE_ENV === "production") {
      for (const key of productionSecretKeys) {
        const value = process.env[key]?.trim() || "";
        if (!value || value.includes("change") || value.includes("local_")) warnings.push(`${key} must be set to a production secret.`);
      }
      if (process.env.AUTH_DEV_OTP_CODE) warnings.push("AUTH_DEV_OTP_CODE should not be set in production.");
      if (process.env.ADMIN_DEV_2FA_CODE) warnings.push("ADMIN_DEV_2FA_CODE should not be set in production.");
      if (!process.env.API_PUBLIC_URL?.trim()) warnings.push("API_PUBLIC_URL should be set in production so uploaded media URLs are stable.");
    }
    return warnings;
  }
}

const requiredEnvKeys = ["DATABASE_URL"];
const productionSecretKeys = ["CUSTOMER_SESSION_SECRET", "ADMIN_SESSION_SECRET", "OTP_SECRET"];
