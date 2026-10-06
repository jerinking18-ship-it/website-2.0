import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { InventoryStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../../database/prisma.service";
import { SearchIndexService } from "../../../common/search/search-index.service";
import { ListProductsQuery } from "./list-products.query";

type CatalogProduct = Prisma.ProductGetPayload<{
  include: {
    category: true;
    images: true;
    inventoryItems: { include: { branch: { include: { serviceAreas: true } } } };
  };
}>;

@QueryHandler(ListProductsQuery)
export class ListProductsHandler implements IQueryHandler<ListProductsQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchIndex: SearchIndexService
  ) {}

  async execute(query: ListProductsQuery) {
    const {
      category,
      search,
      inStock,
      page,
      limit,
      stock,
      supplier,
      tags,
      dietary,
      minPrice,
      maxPrice,
      sort = "newest",
      pincode
    } = query.filters;
    const normalizedSearch = search?.trim();
    const indexedHits = normalizedSearch ? await this.searchIndex.searchProducts(normalizedSearch, 500) : null;
    const indexedIds = indexedHits?.map((hit) => hit.id) ?? null;
    const indexedRank = new Map((indexedIds ?? []).map((id, index) => [id, index]));
    const normalizedTags = normalizeList(tags);
    const normalizedDietary = normalizeList(dietary);
    const stockFilter = stock ?? (typeof inStock === "boolean" ? (inStock ? "available" : "out") : "all");

    const where: Prisma.ProductWhereInput = {
      status: "ACTIVE",
      deletedAt: null,
      ...(category ? { category: { slug: category } } : {}),
      ...(indexedIds?.length ? { id: { in: indexedIds } } : {}),
      ...(supplier ? { supplierName: { contains: supplier, mode: "insensitive" as const } } : {}),
      ...(normalizedTags.length ? { tags: { hasEvery: normalizedTags } } : {}),
      ...(normalizedDietary.length ? { dietaryTags: { hasEvery: normalizedDietary } } : {}),
      ...(stockFilter === "available"
        ? {
            inventoryItems: {
              some: {
                onHand: { gt: 0 },
                status: { in: [InventoryStatus.IN_STOCK, InventoryStatus.LOW_STOCK, InventoryStatus.EXPIRING_SOON] },
                branch: { active: true }
              }
            }
          }
        : {}),
      ...(normalizedSearch
        ? {
            OR: [
              { name: { contains: normalizedSearch, mode: "insensitive" as const } },
              { description: { contains: normalizedSearch, mode: "insensitive" as const } },
              { supplierName: { contains: normalizedSearch, mode: "insensitive" as const } },
              { category: { name: { contains: normalizedSearch, mode: "insensitive" as const } } },
              { tags: { has: normalizedSearch.toLowerCase() } },
              { dietaryTags: { has: normalizedSearch.toLowerCase() } }
            ]
          }
        : {})
    };

    const candidates = await this.prisma.product.findMany({
      where,
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        inventoryItems: { include: { branch: { include: { serviceAreas: true } } } }
      },
      orderBy: { updatedAt: "desc" },
      take: 2000
    });

    const enriched = candidates
      .map((product) => enrichProduct(product, pincode))
      .filter((product) => matchesEffectivePrice(product, minPrice, maxPrice))
      .filter((product) => matchesStockFilter(product, stockFilter));

    const sorted = indexedRank.size && sort === "newest" ? sortByIndexedRank(enriched, indexedRank) : sortProducts(enriched, sort);
    const total = sorted.length;
    const items = sorted.slice((page - 1) * limit, page * limit);

    return {
      items: items.map((product) => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category.name,
        categorySlug: product.category.slug,
        unit: product.unit,
        price: Number(product.price),
        salePrice: product.salePrice ? Number(product.salePrice) : null,
        badge: product.badge,
        stockStatus: product.stockStatus,
        rating: Number(product.averageRating),
        reviewCount: product.reviewCount,
        description: product.description,
        supplier: product.supplierName,
        tags: product.tags,
        dietaryTags: product.dietaryTags,
        image: product.images[0]?.url ?? null,
        availableQuantity: product.availableQuantity,
        serviceable: product.serviceable,
        branchAvailability: product.branchAvailability
      })),
      page,
      limit,
      total,
      filters: {
        category: category ?? null,
        search: normalizedSearch ?? null,
        stock: stockFilter,
        supplier: supplier ?? null,
        tags: normalizedTags,
        dietary: normalizedDietary,
        minPrice: minPrice ?? null,
        maxPrice: maxPrice ?? null,
        sort,
        pincode: pincode ?? null
      },
      facets: buildFacets(enriched)
    };
  }
}

type EnrichedProduct = CatalogProduct & {
  effectivePrice: number;
  availableQuantity: number;
  serviceable: boolean;
  branchAvailability: Array<{
    id: string;
    name: string;
    code: string;
    availableQuantity: number;
    lowStock: boolean;
    pincode: string;
  }>;
};

function normalizeList(values?: string[]) {
  return (values ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean);
}

function enrichProduct(product: CatalogProduct, pincode?: string): EnrichedProduct {
  const inventoryItems = product.inventoryItems.filter((item) => {
    if (!item.branch.active) return false;
    if (item.status === InventoryStatus.DISABLED || item.status === InventoryStatus.EXPIRED) return false;
    if (!pincode) return true;
    return item.branch.serviceAreas.some((area) => area.active && area.postalCode === pincode);
  });
  const branchAvailability = inventoryItems.map((item) => {
    const availableQuantity = Math.max(0, item.onHand - item.reserved);
    return {
      id: item.branch.id,
      name: item.branch.name,
      code: item.branch.code,
      availableQuantity,
      lowStock: availableQuantity > 0 && availableQuantity <= item.threshold,
      pincode: item.branch.postalCode
    };
  });
  const availableQuantity = branchAvailability.reduce((total, branch) => total + branch.availableQuantity, 0);
  const lowStock = branchAvailability.some((branch) => branch.lowStock);
  const stockStatus =
    availableQuantity <= 0
      ? InventoryStatus.OUT_OF_STOCK
      : lowStock
        ? InventoryStatus.LOW_STOCK
        : InventoryStatus.IN_STOCK;

  return {
    ...product,
    stockStatus,
    effectivePrice: Number(product.salePrice ?? product.price),
    availableQuantity,
    serviceable: pincode ? inventoryItems.length > 0 : true,
    branchAvailability
  };
}

function matchesEffectivePrice(product: EnrichedProduct, minPrice?: number, maxPrice?: number) {
  if (typeof minPrice === "number" && product.effectivePrice < minPrice) return false;
  if (typeof maxPrice === "number" && product.effectivePrice > maxPrice) return false;
  return true;
}

function matchesStockFilter(product: EnrichedProduct, stock: "all" | "available" | "low" | "out") {
  if (stock === "available") return product.availableQuantity > 0;
  if (stock === "low") return product.stockStatus === InventoryStatus.LOW_STOCK;
  if (stock === "out") return product.availableQuantity <= 0;
  return true;
}

function sortProducts(products: EnrichedProduct[], sort: NonNullable<ListProductsQuery["filters"]["sort"]>) {
  const sorted = [...products];
  if (sort === "price_asc") return sorted.sort((first, second) => first.effectivePrice - second.effectivePrice);
  if (sort === "price_desc") return sorted.sort((first, second) => second.effectivePrice - first.effectivePrice);
  if (sort === "rating") {
    return sorted.sort(
      (first, second) =>
        Number(second.averageRating) - Number(first.averageRating) || second.reviewCount - first.reviewCount
    );
  }
  if (sort === "popular") return sorted.sort((first, second) => second.reviewCount - first.reviewCount);
  if (sort === "deals") {
    return sorted.sort(
      (first, second) =>
        Number(Boolean(second.salePrice)) - Number(Boolean(first.salePrice)) ||
        second.updatedAt.getTime() - first.updatedAt.getTime()
    );
  }
  return sorted.sort((first, second) => second.updatedAt.getTime() - first.updatedAt.getTime());
}

function sortByIndexedRank(products: EnrichedProduct[], rank: Map<string, number>) {
  return [...products].sort((first, second) => (rank.get(first.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(second.id) ?? Number.MAX_SAFE_INTEGER));
}

function buildFacets(products: EnrichedProduct[]) {
  const suppliers = new Map<string, number>();
  const categories = new Map<string, { slug: string; count: number }>();
  const tags = new Map<string, number>();
  const dietary = new Map<string, number>();
  const stock = { available: 0, low: 0, out: 0 };
  const prices = products.map((product) => product.effectivePrice);

  for (const product of products) {
    if (product.supplierName) suppliers.set(product.supplierName, (suppliers.get(product.supplierName) ?? 0) + 1);
    const category = categories.get(product.category.name) ?? { slug: product.category.slug, count: 0 };
    category.count += 1;
    categories.set(product.category.name, category);
    for (const tag of product.tags) tags.set(tag, (tags.get(tag) ?? 0) + 1);
    for (const tag of product.dietaryTags) dietary.set(tag, (dietary.get(tag) ?? 0) + 1);
    if (product.availableQuantity <= 0) stock.out += 1;
    else if (product.stockStatus === InventoryStatus.LOW_STOCK) stock.low += 1;
    else stock.available += 1;
  }

  return {
    suppliers: mapCounts(suppliers),
    categories: Array.from(categories.entries()).map(([name, value]) => ({ name, slug: value.slug, count: value.count })),
    tags: mapCounts(tags),
    dietary: mapCounts(dietary),
    stock,
    priceRange: {
      min: prices.length ? Math.min(...prices) : null,
      max: prices.length ? Math.max(...prices) : null
    }
  };
}

function mapCounts(counts: Map<string, number>) {
  return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
}
