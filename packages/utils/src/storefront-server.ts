import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { defaultStorefrontData, mergeStorefrontData, type StorefrontData } from "./storefront";

const rootDir = path.resolve(process.cwd(), "../..");
const storefrontDir = path.join(rootDir, ".freshcart-store");
const storefrontFile = path.join(storefrontDir, "storefront.json");

export async function readStorefrontData(): Promise<StorefrontData> {
  try {
    const file = await readFile(storefrontFile, "utf8");
    const parsed = JSON.parse(file) as Partial<StorefrontData>;
    return mergeStorefrontData(parsed, defaultStorefrontData);
  } catch {
    return defaultStorefrontData;
  }
}

export async function writeStorefrontPatch(patch: Partial<StorefrontData>) {
  const current = await readStorefrontData();
  const next = mergeStorefrontData(patch, current);
  await mkdir(storefrontDir, { recursive: true });
  await writeFile(storefrontFile, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}
