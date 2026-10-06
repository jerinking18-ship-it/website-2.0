import "../common/env/load-env";
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      const message = error instanceof Error ? error.message.replace(/postgresql:\/\/[^@\s]+@/g, "postgresql://***@") : "unknown error";
      console.warn(`Prisma could not connect on startup. /api/health will report database status. ${message}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
