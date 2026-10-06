import { randomUUID } from "node:crypto";

type HeaderValue = string | string[] | undefined;

type ApiRequest = {
  method: string;
  originalUrl?: string;
  path?: string;
  ip?: string;
  socket?: { remoteAddress?: string };
  headers: Record<string, HeaderValue>;
};

type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  statusCode: number;
  on: (event: "finish", listener: () => void) => void;
};

type Next = () => void;

const quietPaths = new Set(["/api/live"]);

export function requestLoggerMiddleware(req: ApiRequest, res: ApiResponse, next: Next) {
  const startedAt = Date.now();
  const requestId = requestIdFromHeader(req.headers["x-request-id"]) || randomUUID();
  res.setHeader("X-Request-Id", requestId);
  req.headers["x-request-id"] = requestId;

  res.on("finish", () => {
    const path = String(req.originalUrl || req.path || "");
    if (quietPaths.has(path)) return;
    const durationMs = Date.now() - startedAt;
    const logEntry = {
      level: res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
      event: "http_request",
      requestId,
      method: req.method,
      path,
      statusCode: res.statusCode,
      durationMs,
      ip: clientIp(req),
      userAgent: firstHeader(req.headers["user-agent"]) ?? ""
    };
    const line = JSON.stringify(logEntry);
    if (res.statusCode >= 500) console.error(line);
    else if (res.statusCode >= 400) console.warn(line);
    else console.log(line);
  });

  next();
}

function requestIdFromHeader(value: HeaderValue) {
  const requestId = firstHeader(value)?.trim();
  return requestId && /^[a-zA-Z0-9._:-]{8,128}$/.test(requestId) ? requestId : "";
}

function firstHeader(value: HeaderValue) {
  return Array.isArray(value) ? value[0] : value;
}

function clientIp(req: ApiRequest) {
  const forwardedFor = firstHeader(req.headers["x-forwarded-for"])?.split(",")[0]?.trim();
  return forwardedFor || req.ip || req.socket?.remoteAddress || "local";
}
