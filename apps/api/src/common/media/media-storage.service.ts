import { BadRequestException, Injectable } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { apiUploadsRoot, publicMediaBaseUrl } from "./media-paths";

const mimeExtensions: Record<string, string> = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/svg+xml": "svg",
  "image/webp": "webp"
};

@Injectable()
export class MediaStorageService {
  async storeImage(value: unknown, namespace: string) {
    const source = typeof value === "string" ? value.trim() : "";
    if (!source) return "";
    if (source.startsWith("http://") || source.startsWith("https://") || source.startsWith("/uploads/")) return source;
    if (!source.startsWith("data:image/")) throw new BadRequestException("Image must be an uploaded image data URL or a valid image URL.");

    const match = source.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) throw new BadRequestException("Uploaded image data is invalid.");

    const mime = match[1].toLowerCase();
    const extension = mimeExtensions[mime];
    if (!extension) throw new BadRequestException("Only JPG, PNG, WEBP, GIF, and SVG images are supported.");

    const buffer = Buffer.from(match[2], "base64");
    if (!buffer.length) throw new BadRequestException("Uploaded image is empty.");
    if (buffer.length > 5 * 1024 * 1024) throw new BadRequestException("Uploaded image must be 5 MB or smaller.");

    if (shouldStoreUploadsInline()) return source;

    const safeNamespace = namespace.replace(/[^a-z0-9-]/gi, "-").toLowerCase() || "media";
    const date = new Date();
    const folder = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${safeNamespace}`;
    const filename = `${Date.now()}-${randomBytes(8).toString("hex")}.${extension}`;
    const directory = join(apiUploadsRoot(), folder);
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, filename), buffer);

    return `${publicMediaBaseUrl()}/uploads/${folder}/${filename}`;
  }
}

export function shouldStoreUploadsInline() {
  const driver = process.env.MEDIA_STORAGE_DRIVER?.trim().toLowerCase();
  if (driver) return driver === "inline" || driver === "database" || driver === "db";
  return Boolean(process.env.RENDER || process.env.RENDER_EXTERNAL_URL);
}
