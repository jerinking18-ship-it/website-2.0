import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { StorefrontController } from "./storefront.controller";
import { GetStorefrontHandler } from "./queries/get-storefront.handler";

@Module({
  imports: [CqrsModule],
  controllers: [StorefrontController],
  providers: [GetStorefrontHandler]
})
export class StorefrontModule {}
