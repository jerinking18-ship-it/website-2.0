import { Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";
import { Prisma } from "@prisma/client";
import { success } from "../../common/api-response";
import { SearchIndexService } from "../../common/search/search-index.service";
import { PrismaService } from "../../database/prisma.service";
import { GetCategoryQuery } from "./queries/get-category.query";
import { GetProductQuery } from "./queries/get-product.query";
import { ListCategoriesQuery } from "./queries/list-categories.query";
import { ListProductsQuery } from "./queries/list-products.query";

@Controller()
export class CatalogController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly prisma: PrismaService,
    private readonly searchIndex: SearchIndexService
  ) {}

  @Get("categories")
  async listCategories() {
    return success(await this.queryBus.execute(new ListCategoriesQuery()));
  }

  @Get("categories/:slug")
  async getCategory(@Param("slug") slug: string) {
    return success(await this.queryBus.execute(new GetCategoryQuery(slug)));
  }

  @Get("products")
  async listProducts(
    @Query("category") category?: string,
    @Query("search") search?: string,
    @Query("q") q?: string,
    @Query("in_stock") inStock?: string,
    @Query("stock") stock?: string,
    @Query("supplier") supplier?: string,
    @Query("brand") brand?: string,
    @Query("tags") tags?: string,
    @Query("dietary") dietary?: string,
    @Query("min_price") minPrice?: string,
    @Query("max_price") maxPrice?: string,
    @Query("sort") sort?: string,
    @Query("pincode") pincode?: string,
    @Query("page") page = "1",
    @Query("limit") limit = "24"
  ) {
    return success(
      await this.queryBus.execute(
        new ListProductsQuery({
          category,
          search: search ?? q,
          inStock: inStock ? inStock === "true" : undefined,
          stock: parseStockFilter(stock),
          supplier: supplier ?? brand,
          tags: parseList(tags),
          dietary: parseList(dietary),
          minPrice: parsePositiveNumber(minPrice),
          maxPrice: parsePositiveNumber(maxPrice),
          sort: parseSort(sort),
          pincode,
          page: Number(page) > 0 ? Number(page) : 1,
          limit: Number(limit) > 0 ? Math.min(Number(limit), 100) : 24
        })
      )
    );
  }

  @Get("search/suggestions")
  async searchSuggestions(@Query("q") q?: string, @Query("limit") limit = "8") {
    const query = q?.trim();
    const take = Number(limit) > 0 ? Math.min(Number(limit), 12) : 8;
    if (!query) return success({ query: "", products: [], categories: [], suppliers: [], suggestions: [] });
    const [indexedProducts, indexedCategories] = await Promise.all([
      this.searchIndex.searchProducts(query, take),
      this.searchIndex.searchCategories(query, 5)
    ]);
    if ((indexedProducts?.length ?? 0) > 0 || (indexedCategories?.length ?? 0) > 0) {
      const products = indexedProducts ?? [];
      const categories = indexedCategories ?? [];
      const suppliers = Array.from(new Set(products.map((product) => product.supplier).filter((supplier): supplier is string => Boolean(supplier)))).slice(0, 5);
      return success({
        query,
        products: products.map((product) => ({
          id: product.id,
          slug: product.slug,
          name: product.name,
          category: product.category,
          unit: product.unit,
          price: product.salePrice ?? product.price,
          image: product.image,
          href: `/products/${product.slug}`
        })),
        categories: categories.map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          href: `/categories/${category.slug}`
        })),
        suppliers: suppliers.map((supplier) => ({ name: supplier, href: `/products?supplier=${encodeURIComponent(supplier)}` })),
        suggestions: [
          ...products.map((product) => product.name),
          ...categories.map((category) => category.name),
          ...suppliers
        ].slice(0, take)
      });
    }
    const [products, categories, supplierProducts] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { supplierName: { contains: query, mode: "insensitive" } },
            { category: { name: { contains: query, mode: "insensitive" } } }
          ]
        },
        include: { category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
        orderBy: [{ reviewCount: "desc" }, { updatedAt: "desc" }],
        take
      }),
      this.prisma.category.findMany({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          OR: [{ name: { contains: query, mode: "insensitive" } }, { note: { contains: query, mode: "insensitive" } }]
        },
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
        take: 5
      }),
      this.prisma.product.findMany({
        where: { status: "ACTIVE", deletedAt: null, supplierName: { contains: query, mode: "insensitive" } },
        select: { supplierName: true },
        take: 20
      })
    ]);
    const suppliers = Array.from(new Set(supplierProducts.map((product) => product.supplierName).filter((supplier): supplier is string => Boolean(supplier)))).slice(0, 5);
    return success({
      query,
      products: products.map((product) => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category.name,
        unit: product.unit,
        price: Number(product.salePrice ?? product.price),
        image: product.images[0]?.url ?? null,
        href: `/products/${product.slug}`
      })),
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        href: `/categories/${category.slug}`
      })),
      suppliers: suppliers.map((supplier) => ({ name: supplier, href: `/products?supplier=${encodeURIComponent(supplier)}` })),
      suggestions: [
        ...products.map((product) => product.name),
        ...categories.map((category) => category.name),
        ...suppliers
      ].slice(0, take)
    });
  }

  @Get("products/:slug/related")
  async relatedProducts(@Param("slug") slug: string, @Query("limit") limit = "5") {
    const product = await this.findCatalogProduct(slug);
    const take = Number(limit) > 0 ? Math.min(Number(limit), 12) : 5;
    const related = await this.prisma.product.findMany({
      where: {
        id: { not: product.id },
        status: "ACTIVE",
        deletedAt: null,
        OR: [
          { categoryId: product.categoryId },
          product.tags.length ? { tags: { hasSome: product.tags } } : {},
          product.dietaryTags.length ? { dietaryTags: { hasSome: product.dietaryTags } } : {},
          product.supplierName ? { supplierName: product.supplierName } : {}
        ].filter((item) => Object.keys(item).length > 0) as Prisma.ProductWhereInput[]
      },
      include: { category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      orderBy: [{ reviewCount: "desc" }, { updatedAt: "desc" }],
      take
    });
    return success({ product: product.slug, items: related.map((item) => this.toCompactProduct(item)) });
  }

  @Get("products/:slug/frequently-bought-together")
  async frequentlyBoughtTogether(@Param("slug") slug: string, @Query("limit") limit = "4") {
    const product = await this.findCatalogProduct(slug);
    const take = Number(limit) > 0 ? Math.min(Number(limit), 8) : 4;
    const orderItems = await this.prisma.orderItem.findMany({
      where: { order: { items: { some: { productId: product.id } } }, productId: { not: product.id } },
      select: { productId: true },
      take: 500
    });
    const counts = new Map<string, number>();
    for (const item of orderItems) {
      if (item.productId) counts.set(item.productId, (counts.get(item.productId) ?? 0) + 1);
    }
    const productIds = Array.from(counts.entries())
      .sort((first, second) => second[1] - first[1])
      .map(([productId]) => productId)
      .slice(0, take);
    const boughtTogether = productIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: productIds }, status: "ACTIVE", deletedAt: null },
          include: { category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } }
        })
      : [];
    const ordered = productIds
      .map((productId) => boughtTogether.find((item) => item.id === productId))
      .filter((item): item is NonNullable<typeof boughtTogether[number]> => Boolean(item));
    if (ordered.length >= take) return success({ product: product.slug, items: ordered.map((item) => this.toCompactProduct(item)) });
    const fallback = await this.prisma.product.findMany({
      where: { id: { notIn: [product.id, ...ordered.map((item) => item.id)] }, categoryId: product.categoryId, status: "ACTIVE", deletedAt: null },
      include: { category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      orderBy: [{ salePrice: "asc" }, { updatedAt: "desc" }],
      take: take - ordered.length
    });
    return success({ product: product.slug, items: [...ordered, ...fallback].map((item) => this.toCompactProduct(item)) });
  }

  @Get("products/:slug")
  async getProduct(@Param("slug") slug: string) {
    return success(await this.queryBus.execute(new GetProductQuery(slug)));
  }

  private async findCatalogProduct(slug: string) {
    const product = await this.prisma.product.findUnique({ where: { slug } });
    if (!product || product.status !== "ACTIVE" || product.deletedAt) {
      throw new NotFoundException(`Product ${slug} was not found.`);
    }
    return product;
  }

  private toCompactProduct(
    product: Prisma.ProductGetPayload<{ include: { category: true; images: true } }>
  ) {
    return {
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
      image: product.images[0]?.url ?? null
    };
  }
}

function parseList(value?: string) {
  if (!value) return undefined;
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
}

function parsePositiveNumber(value?: string) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : undefined;
}

function parseStockFilter(value?: string) {
  if (value === "available" || value === "low" || value === "out" || value === "all") return value;
  return undefined;
}

function parseSort(value?: string) {
  if (
    value === "newest" ||
    value === "price_asc" ||
    value === "price_desc" ||
    value === "rating" ||
    value === "popular" ||
    value === "deals"
  ) {
    return value;
  }
  return undefined;
}
