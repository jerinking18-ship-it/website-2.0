import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { CatalogController } from "./catalog.controller";
import { GetCategoryHandler } from "./queries/get-category.handler";
import { GetProductHandler } from "./queries/get-product.handler";
import { ListCategoriesHandler } from "./queries/list-categories.handler";
import { ListProductsHandler } from "./queries/list-products.handler";

@Module({
  imports: [CqrsModule],
  controllers: [CatalogController],
  providers: [ListCategoriesHandler, ListProductsHandler, GetCategoryHandler, GetProductHandler]
})
export class CatalogModule {}
