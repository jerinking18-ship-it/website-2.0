import { Module } from "@nestjs/common";
import { MediaModule } from "../../common/media/media.module";
import { CustomerController } from "./customer.controller";
import { CustomerService } from "./customer.service";

@Module({
  imports: [MediaModule],
  controllers: [CustomerController],
  providers: [CustomerService]
})
export class CustomerModule {}
