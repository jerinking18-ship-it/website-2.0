import { NotFoundException } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../../database/prisma.service";
import { GetProductQuery } from "./get-product.query";

@QueryHandler(GetProductQuery)
export class GetProductHandler implements IQueryHandler<GetProductQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetProductQuery) {
    const product = await this.prisma.product.findUnique({
      where: { slug: query.slug },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        reviews: { where: { status: "PUBLISHED" }, take: 5, orderBy: { createdAt: "desc" } }
      }
    });

    if (product) {
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
        images: product.images.map((image) => ({ url: image.url, altText: image.altText })),
        nutrition: product.nutrition,
        replacementPolicy: product.replacementPolicy,
        reviews: product.reviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          title: review.title,
          body: review.body,
          helpfulCount: review.helpfulCount
        }))
      };
    }

    throw new NotFoundException(`Product ${query.slug} was not found.`);
  }
}
