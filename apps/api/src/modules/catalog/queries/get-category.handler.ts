import { NotFoundException } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../../database/prisma.service";
import { GetCategoryQuery } from "./get-category.query";

@QueryHandler(GetCategoryQuery)
export class GetCategoryHandler implements IQueryHandler<GetCategoryQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetCategoryQuery) {
    const category = await this.prisma.category.findUnique({
      where: { slug: query.slug }
    });

    if (category) {
      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        note: category.note,
        image: category.image,
        featured: category.featured,
        order: category.sortOrder,
        href: `/categories/${category.slug}`
      };
    }

    throw new NotFoundException(`Category ${query.slug} was not found.`);
  }
}
