import { Injectable } from "@nestjs/common";
import { ProductStatus } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

type SearchDocument = Record<string, unknown> & { id: string };

type MeiliSearchResponse<T> = {
  hits: T[];
  estimatedTotalHits?: number;
};

export type ProductSearchHit = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  unit: string;
  price: number;
  salePrice: number | null;
  image: string | null;
  supplier: string | null;
  tags: string[];
  dietaryTags: string[];
};

export type CategorySearchHit = {
  id: string;
  name: string;
  slug: string;
};

const productsIndex = "freshcart_products";
const categoriesIndex = "freshcart_categories";

@Injectable()
export class SearchIndexService {
  private indexesReady = false;

  constructor(private readonly prisma: PrismaService) {}

  isConfigured() {
    return Boolean(this.host() && this.apiKey());
  }

  async health() {
    if (!this.isConfigured()) return { status: "not_configured" as const };
    try {
      const response = await this.request<{ status?: string }>("/health");
      return { status: response.status === "available" ? "up" as const : "degraded" as const, providerStatus: response.status ?? "unknown" };
    } catch (error) {
      return { status: "down" as const, message: error instanceof Error ? error.message : "Search health check failed" };
    }
  }

  async searchProducts(query: string, limit: number) {
    if (!this.isConfigured() || !query.trim()) return null;
    try {
      await this.ensureIndexes();
      const response = await this.request<MeiliSearchResponse<ProductSearchHit>>(`/indexes/${productsIndex}/search`, {
        method: "POST",
        body: {
          q: query,
          limit,
          filter: "status = ACTIVE"
        }
      });
      return response.hits;
    } catch {
      return null;
    }
  }

  async searchCategories(query: string, limit: number) {
    if (!this.isConfigured() || !query.trim()) return null;
    try {
      await this.ensureIndexes();
      const response = await this.request<MeiliSearchResponse<CategorySearchHit>>(`/indexes/${categoriesIndex}/search`, {
        method: "POST",
        body: {
          q: query,
          limit,
          filter: "status = ACTIVE"
        }
      });
      return response.hits;
    } catch {
      return null;
    }
  }

  async syncProduct(productId: string) {
    if (!this.isConfigured()) return { synced: false, reason: "not_configured" };
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { category: true, images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 } }
    });
    try {
      await this.ensureIndexes();
      if (!product || product.deletedAt || product.status !== ProductStatus.ACTIVE) {
        await this.deleteDocument(productsIndex, productId);
        return { synced: true, deleted: true };
      }
      await this.addDocuments(productsIndex, [this.toProductDocument(product)]);
      return { synced: true };
    } catch (error) {
      return { synced: false, reason: error instanceof Error ? error.message : "product_sync_failed" };
    }
  }

  async syncCategory(categoryId: string) {
    if (!this.isConfigured()) return { synced: false, reason: "not_configured" };
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    try {
      await this.ensureIndexes();
      if (!category || category.deletedAt || category.status !== "ACTIVE") {
        await this.deleteDocument(categoriesIndex, categoryId);
        return { synced: true, deleted: true };
      }
      await this.addDocuments(categoriesIndex, [this.toCategoryDocument(category)]);
      return { synced: true };
    } catch (error) {
      return { synced: false, reason: error instanceof Error ? error.message : "category_sync_failed" };
    }
  }

  async reindexAll() {
    if (!this.isConfigured()) return { configured: false, products: 0, categories: 0 };
    try {
      await this.ensureIndexes(true);
      const [products, categories] = await Promise.all([
        this.prisma.product.findMany({
          where: { status: "ACTIVE", deletedAt: null },
          include: { category: true, images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 } },
          take: 5000
        }),
        this.prisma.category.findMany({ where: { status: "ACTIVE", deletedAt: null }, take: 1000 })
      ]);
      await this.addDocuments(productsIndex, products.map((product) => this.toProductDocument(product)));
      await this.addDocuments(categoriesIndex, categories.map((category) => this.toCategoryDocument(category)));
      return { configured: true, available: true, products: products.length, categories: categories.length };
    } catch (error) {
      return {
        configured: true,
        available: false,
        products: 0,
        categories: 0,
        reason: error instanceof Error ? error.message : "search_reindex_failed"
      };
    }
  }

  private async ensureIndexes(force = false) {
    if (this.indexesReady && !force) return;
    await Promise.all([
      this.ensureIndex(productsIndex, "id"),
      this.ensureIndex(categoriesIndex, "id")
    ]);
    await Promise.all([
      this.request(`/indexes/${productsIndex}/settings`, {
        method: "PATCH",
        body: {
          searchableAttributes: ["name", "category", "supplier", "description", "tags", "dietaryTags", "sku"],
          filterableAttributes: ["status", "categorySlug", "supplier", "tags", "dietaryTags"],
          sortableAttributes: ["price", "salePrice", "updatedAt", "reviewCount"]
        }
      }),
      this.request(`/indexes/${categoriesIndex}/settings`, {
        method: "PATCH",
        body: {
          searchableAttributes: ["name", "note"],
          filterableAttributes: ["status", "featured"],
          sortableAttributes: ["sortOrder", "updatedAt"]
        }
      })
    ]);
    this.indexesReady = true;
  }

  private async ensureIndex(uid: string, primaryKey: string) {
    try {
      await this.request(`/indexes/${uid}`);
    } catch {
      await this.request("/indexes", { method: "POST", body: { uid, primaryKey } });
    }
  }

  private async addDocuments(index: string, documents: SearchDocument[]) {
    if (!documents.length) return;
    await this.request(`/indexes/${index}/documents`, { method: "POST", body: documents });
  }

  private async deleteDocument(index: string, documentId: string) {
    await this.request(`/indexes/${index}/documents/${encodeURIComponent(documentId)}`, { method: "DELETE" }).catch(() => undefined);
  }

  private toProductDocument(
    product: Awaited<ReturnType<PrismaService["product"]["findUnique"]>> & {
      category: { name: string; slug: string };
      images: Array<{ url: string }>;
    }
  ): SearchDocument {
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      sku: product.sku,
      category: product.category.name,
      categorySlug: product.category.slug,
      unit: product.unit,
      description: product.description,
      price: Number(product.price),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      image: product.images[0]?.url ?? null,
      supplier: product.supplierName,
      tags: product.tags,
      dietaryTags: product.dietaryTags,
      status: product.status,
      reviewCount: product.reviewCount,
      updatedAt: product.updatedAt.getTime()
    };
  }

  private toCategoryDocument(category: {
    id: string;
    name: string;
    slug: string;
    note: string | null;
    status: string;
    featured: boolean;
    sortOrder: number;
    updatedAt: Date;
  }): SearchDocument {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      note: category.note,
      status: category.status,
      featured: category.featured,
      sortOrder: category.sortOrder,
      updatedAt: category.updatedAt.getTime()
    };
  }

  private async request<T = unknown>(path: string, options: { method?: string; body?: unknown } = {}) {
    const url = `${this.host()}${path}`;
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.apiKey()}`
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
    if (!response.ok) throw new Error(`Meilisearch ${options.method ?? "GET"} ${path} failed with ${response.status}`);
    return (await response.json().catch(() => ({}))) as T;
  }

  private host() {
    return process.env.MEILISEARCH_HOST?.replace(/\/$/, "") || "";
  }

  private apiKey() {
    return process.env.MEILISEARCH_API_KEY || "";
  }
}
