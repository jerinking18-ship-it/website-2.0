import { Controller, Get, Res } from "@nestjs/common";
import { success } from "../../common/api-response";
import { HealthService } from "./health.service";

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get("health")
  async health() {
    return success(await this.healthService.getHealth());
  }

  @Get("live")
  live() {
    return success(this.healthService.getLiveness());
  }

  @Get("ready")
  async ready(@Res({ passthrough: true }) response: { status: (code: number) => void }) {
    const readiness = await this.healthService.getReadiness();
    if (readiness.status !== "ready") response.status(503);
    return success(readiness);
  }

  @Get("version")
  version() {
    return success(this.healthService.getVersion());
  }
}
