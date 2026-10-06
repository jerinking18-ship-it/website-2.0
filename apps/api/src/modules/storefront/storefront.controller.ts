import { Controller, Get } from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";
import { success } from "../../common/api-response";
import { GetStorefrontQuery } from "./queries/get-storefront.query";

@Controller("storefront")
export class StorefrontController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async getStorefront() {
    return success(await this.queryBus.execute(new GetStorefrontQuery()));
  }
}
