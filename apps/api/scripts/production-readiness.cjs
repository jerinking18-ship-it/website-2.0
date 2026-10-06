const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../..");
const strict = process.env.STRICT_PRODUCTION_READINESS === "true" || process.argv.includes("--strict");

loadEnv(path.join(root, ".env"));
loadEnv(path.join(root, "apps/api/.env"));

const requiredFiles = [
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "turbo.json",
  "docker-compose.yml",
  "apps/api/prisma/schema.prisma",
  "apps/api/prisma/migrations",
  "apps/api/src/main.ts",
  "apps/web/package.json",
  "apps/admin/package.json",
  "docs/deployment/production-runbook.md"
];

const requiredEnvironment = ["DATABASE_URL", "CUSTOMER_SESSION_SECRET", "ADMIN_SESSION_SECRET", "OTP_SECRET"];
const productionRecommendedEnvironment = [
  "API_PUBLIC_URL",
  "REDIS_URL",
  "MEILISEARCH_HOST",
  "MEILISEARCH_API_KEY",
  "MAPBOX_PUBLIC_TOKEN",
  "MAPBOX_SECRET_TOKEN",
  "EMAIL_PROVIDER_API_KEY",
  "SMS_PROVIDER_API_KEY",
  "WHATSAPP_PROVIDER_API_KEY",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET"
];

const devOnlyEnvironment = ["AUTH_DEV_OTP_CODE", "ADMIN_DEV_2FA_CODE"];
const weakSecretMarkers = ["change-me", "local_", "development", "freshcart_dev_password"];

const checks = [];
const warnings = [];
const failures = [];

for (const file of requiredFiles) {
  const exists = fs.existsSync(path.join(root, file));
  checks.push({ name: `file:${file}`, status: exists ? "ok" : "missing" });
  if (!exists) failures.push(`Missing required file or directory: ${file}`);
}

for (const key of requiredEnvironment) {
  const present = Boolean(process.env[key]?.trim());
  checks.push({ name: `env:${key}`, status: present ? "ok" : "missing" });
  if (!present) failures.push(`Missing required environment variable: ${key}`);
}

for (const key of productionRecommendedEnvironment) {
  const present = Boolean(process.env[key]?.trim());
  checks.push({ name: `env:${key}`, status: present ? "ok" : "recommended_missing" });
  if (!present) warnings.push(`Set ${key} before production launch.`);
}

for (const key of ["CUSTOMER_SESSION_SECRET", "ADMIN_SESSION_SECRET", "OTP_SECRET", "SEED_ADMIN_PASSWORD"]) {
  const value = process.env[key] || "";
  if (!value) continue;
  if (weakSecretMarkers.some((marker) => value.toLowerCase().includes(marker))) {
    warnings.push(`${key} looks like a local/default value and must be rotated before production.`);
  }
  if (value.length < 16) warnings.push(`${key} should be at least 16 characters.`);
}

if ((process.env.NODE_ENV || "development") === "production") {
  for (const key of devOnlyEnvironment) {
    if (process.env[key]) failures.push(`${key} must not be set in production.`);
  }
}

const migrationsDir = path.join(root, "apps/api/prisma/migrations");
const migrationCount = fs.existsSync(migrationsDir)
  ? fs.readdirSync(migrationsDir).filter((entry) => fs.statSync(path.join(migrationsDir, entry)).isDirectory()).length
  : 0;
checks.push({ name: "prisma:migrations", status: migrationCount > 0 ? "ok" : "missing", count: migrationCount });
if (migrationCount === 0) failures.push("No Prisma migrations found.");

const appPackages = ["apps/api/package.json", "apps/web/package.json", "apps/admin/package.json"].map((file) => ({
  file,
  packageJson: readJson(path.join(root, file))
}));
for (const { file, packageJson } of appPackages) {
  if (!packageJson) continue;
  if (!packageJson.scripts?.build && file !== "apps/api/package.json") warnings.push(`${file} has no build script.`);
  if (!packageJson.scripts?.typecheck) warnings.push(`${file} has no typecheck script.`);
}

const result = {
  ok: failures.length === 0 && (!strict || warnings.length === 0),
  strict,
  checkedAt: new Date().toISOString(),
  nodeEnv: process.env.NODE_ENV || "development",
  checks,
  warnings,
  failures
};

console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] ??= value;
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}
