import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { PrismaModule } from "./database/prisma.module";
import { SearchModule } from "./common/search/search.module";
import { AdminModule } from "./modules/admin/admin.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { CustomerModule } from "./modules/customer/customer.module";
import { HealthModule } from "./modules/health/health.module";
import { StorefrontModule } from "./modules/storefront/storefront.module";

@Module({
  imports: [CqrsModule, PrismaModule, SearchModule, HealthModule, StorefrontModule, CatalogModule, CustomerModule, AuthModule, AdminModule]
})
export class AppModule {}
