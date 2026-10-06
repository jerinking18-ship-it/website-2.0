import { existsSync } from "node:fs";
import { join } from "node:path";

export function apiPublicRoot() {
  const configured = process.env.MEDIA_PUBLIC_ROOT?.trim();
  if (configured) return configured;
  const cwd = process.cwd();
  return existsSync(join(cwd, "apps/api/package.json")) ? join(cwd, "apps/api/public") : join(cwd, "public");
}

export function apiUploadsRoot() {
  return join(apiPublicRoot(), "uploads");
}

export function publicMediaBaseUrl() {
  return (process.env.API_PUBLIC_URL || process.env.NEXT_PUBLIC_API_URL || `http://localhost:${process.env.PORT || 4000}`).replace(/\/api\/?$/, "").replace(/\/$/, "");
}
