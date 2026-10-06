declare module "express" {
  import type { RequestHandler } from "@nestjs/common/interfaces";

  export function json(options?: { limit?: string }): RequestHandler;
  export function urlencoded(options?: { extended?: boolean; limit?: string }): RequestHandler;
}
