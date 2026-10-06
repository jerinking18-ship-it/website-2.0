import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";

const keyLength = 64;

export function createPasswordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, keyLength).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, hash] = storedHash.split(":");
  if (algorithm !== "scrypt" || !salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, keyLength);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createNumericCode(length = 6) {
  const max = 10 ** length;
  return String(Number.parseInt(randomBytes(4).toString("hex"), 16) % max).padStart(length, "0");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createBearerToken(prefix: "adm" | "cus") {
  return `${prefix}_${randomBytes(32).toString("base64url")}`;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
