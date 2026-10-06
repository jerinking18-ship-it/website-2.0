import { createHash } from "node:crypto";
import { errorBody } from "../api-response";

type HeaderValue = string | string[] | undefined;

type ApiRequest = {
  method: string;
  originalUrl?: string;
  path?: string;
  ip?: string;
  socket?: { remoteAddress?: string };
  headers: Record<string, HeaderValue>;
  body?: unknown;
};

type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (statusCode: number) => ApiResponse;
  json: (body: unknown) => void;
};

type Next = () => void;

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitPolicy = {
  name: string;
  limit: number;
  windowMs: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();
const dangerousKeys = new Set(["__proto__", "constructor", "prototype"]);
const mutatingMethods = new Set(["POST", "PATCH", "PUT", "DELETE"]);
const imageFieldPattern = /(^|\.)(image|imageFile|imageUrl|imageNote|banner|photo|avatar|logo)$/i;
const base64ImagePattern = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/;
const maxDecodedImageBytes = 5 * 1024 * 1024;
const maxGenericStringLength = 20000;
const maxImageDataUrlLength = Math.ceil((maxDecodedImageBytes * 4) / 3) + 128;

const rateLimitPolicies = {
  auth: { name: "auth", limit: 10, windowMs: 60_000 },
  sensitiveAuth: { name: "sensitive-auth", limit: 5, windowMs: 60_000 },
  customerWrite: { name: "customer-write", limit: 60, windowMs: 60_000 },
  publicWrite: { name: "public-write", limit: 20, windowMs: 60_000 },
  adminWrite: { name: "admin-write", limit: 240, windowMs: 60_000 },
  search: { name: "search", limit: 180, windowMs: 60_000 },
  general: { name: "general", limit: 600, windowMs: 60_000 }
} satisfies Record<string, RateLimitPolicy>;

export function requestHardeningMiddleware(req: ApiRequest, res: ApiResponse, next: Next) {
  applySecurityHeaders(res);
  if (isUploadAsset(req)) {
    next();
    return;
  }

  const rateLimitResult = applyRateLimit(req);
  res.setHeader("X-RateLimit-Limit", String(rateLimitResult.policy.limit));
  res.setHeader("X-RateLimit-Remaining", String(Math.max(rateLimitResult.policy.limit - rateLimitResult.bucket.count, 0)));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(rateLimitResult.bucket.resetAt / 1000)));
  if (rateLimitResult.blocked) {
    res.setHeader("Retry-After", String(Math.ceil((rateLimitResult.bucket.resetAt - Date.now()) / 1000)));
    res.status(429).json(errorBody("RATE_LIMITED", "Too many requests. Please wait a moment and try again.", { policy: rateLimitResult.policy.name }));
    return;
  }

  const validationError = validateRequestPayload(req);
  if (validationError) {
    res.status(400).json(errorBody("INVALID_REQUEST", validationError));
    return;
  }

  next();
}

function applySecurityHeaders(res: ApiResponse) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
}

function applyRateLimit(req: ApiRequest) {
  const policy = selectRateLimitPolicy(req);
  const key = `${policy.name}:${clientFingerprint(req)}:${normalizedRoute(req)}`;
  const now = Date.now();
  const existing = rateLimitBuckets.get(key);
  const bucket = existing && existing.resetAt > now ? existing : { count: 0, resetAt: now + policy.windowMs };
  bucket.count += 1;
  rateLimitBuckets.set(key, bucket);
  if (rateLimitBuckets.size > 10000) pruneExpiredBuckets(now);
  return { policy, bucket, blocked: bucket.count > policy.limit };
}

function selectRateLimitPolicy(req: ApiRequest): RateLimitPolicy {
  const method = req.method.toUpperCase();
  const path = normalizedPath(req);
  if (path.includes("/auth/admin/login") || path.includes("/auth/admin/verify-2fa") || path.includes("/auth/customer/request-otp")) return rateLimitPolicies.sensitiveAuth;
  if (path.includes("/auth/")) return rateLimitPolicies.auth;
  if (method === "GET" && (path.includes("/search") || path.includes("/products") || path.includes("/categories"))) return rateLimitPolicies.search;
  if (path.includes("/admin/") && mutatingMethods.has(method)) return rateLimitPolicies.adminWrite;
  if ((path.includes("/customer/contact") || path.includes("/customer/serviceability")) && mutatingMethods.has(method)) return rateLimitPolicies.publicWrite;
  if (path.includes("/customer/") && mutatingMethods.has(method)) return rateLimitPolicies.customerWrite;
  return rateLimitPolicies.general;
}

function validateRequestPayload(req: ApiRequest) {
  const method = req.method.toUpperCase();
  if (!mutatingMethods.has(method)) return null;
  if (req.body === undefined) return null;
  if (req.body === null) return "Request body cannot be null.";
  if (typeof req.body !== "object" || Buffer.isBuffer(req.body)) return "Request body must be a JSON object.";
  if (Array.isArray(req.body)) return "Top-level request body must be a JSON object.";
  return validateNode(req.body, "$", 0);
}

function validateNode(value: unknown, path: string, depth: number): string | null {
  if (depth > 10) return "Request body is too deeply nested.";
  if (typeof value === "string") return validateString(value, path);
  if (value === null || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    if (value.length > 500) return "Request arrays cannot contain more than 500 items.";
    for (let index = 0; index < value.length; index += 1) {
      const error = validateNode(value[index], `${path}.${index}`, depth + 1);
      if (error) return error;
    }
    return null;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length > 250) return "Request objects cannot contain more than 250 fields.";
  for (const key of keys) {
    if (dangerousKeys.has(key)) return "Request contains a blocked object key.";
    const childPath = `${path}.${key}`;
    const error = validateNode(record[key], childPath, depth + 1);
    if (error) return error;
  }
  return null;
}

function validateString(value: string, path: string) {
  const isImageField = imageFieldPattern.test(path);
  if (isImageField && value.startsWith("data:image/")) {
    if (value.length > maxImageDataUrlLength) return "Uploaded image must be 5 MB or smaller.";
    const match = value.match(base64ImagePattern);
    if (!match) return "Uploaded image data is invalid.";
    const decodedBytes = Buffer.byteLength(match[2], "base64");
    if (decodedBytes > maxDecodedImageBytes) return "Uploaded image must be 5 MB or smaller.";
    return null;
  }
  if (!isImageField && value.length > maxGenericStringLength) return "Request text fields are too large.";
  return null;
}

function normalizedRoute(req: ApiRequest) {
  const path = normalizedPath(req);
  return path
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ":id")
    .replace(/\/FC-[a-z0-9-]+/gi, "/:order")
    .replace(/\/QA[0-9a-z-]+/gi, "/:qa")
    .replace(/\/[0-9]+/g, "/:number");
}

function normalizedPath(req: ApiRequest) {
  return String(req.originalUrl || req.path || "").split("?")[0].toLowerCase();
}

function clientFingerprint(req: ApiRequest) {
  const forwardedFor = firstHeader(req.headers["x-forwarded-for"])?.split(",")[0]?.trim();
  const authorization = firstHeader(req.headers.authorization);
  const identity = authorization ? createHash("sha256").update(authorization).digest("hex").slice(0, 16) : "";
  const ip = forwardedFor || req.ip || req.socket?.remoteAddress || "local";
  return identity ? `${ip}:${identity}` : ip;
}

function firstHeader(value: HeaderValue) {
  return Array.isArray(value) ? value[0] : value;
}

function isUploadAsset(req: ApiRequest) {
  return normalizedPath(req).startsWith("/uploads/");
}

function pruneExpiredBuckets(now: number) {
  for (const [key, bucket] of rateLimitBuckets) {
    if (bucket.resetAt <= now) rateLimitBuckets.delete(key);
  }
}
