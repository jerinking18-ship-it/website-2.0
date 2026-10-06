import "reflect-metadata";
import "./common/env/load-env";
import { NestFactory } from "@nestjs/core";
import express = require("express");
import { apiUploadsRoot } from "./common/media/media-paths";
import { AppModule } from "./app.module";
import { HttpErrorFilter } from "./common/http-exception.filter";
import { requestLoggerMiddleware } from "./common/observability/request-logger.middleware";
import { requestHardeningMiddleware } from "./common/security/request-hardening.middleware";

const expressStatic = (express as unknown as { static: (root: string, options?: Record<string, unknown>) => ReturnType<typeof express.json> }).static;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(requestLoggerMiddleware);
  app.use(requestHardeningMiddleware);
  app.use("/uploads", expressStatic(apiUploadsRoot(), { immutable: true, maxAge: "30d" }));
  app.setGlobalPrefix("api");
  app.enableCors({
    origin: [/^http:\/\/localhost:3001$/, /^http:\/\/localhost:3002$/, /^http:\/\/localhost:3000$/],
    credentials: true
  });
  app.useGlobalFilters(new HttpErrorFilter());
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 4000);
}

void bootstrap();
