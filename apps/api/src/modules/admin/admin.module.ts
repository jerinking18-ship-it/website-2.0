import { Module } from "@nestjs/common";
import { MediaModule } from "../../common/media/media.module";
import { PrismaModule } from "../../database/prisma.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [MediaModule, PrismaModule],
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule {}
