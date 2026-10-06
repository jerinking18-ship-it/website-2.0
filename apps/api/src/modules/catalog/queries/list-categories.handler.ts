import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../../database/prisma.service";
import { ListCategoriesQuery } from "./list-categories.query";

@QueryHandler(ListCategoriesQuery)
export class ListCategoriesHandler implements IQueryHandler<ListCategoriesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    const categories = await this.prisma.category.findMany({
      where: { status: "ACTIVE", deletedAt: null },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }]
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      note: category.note,
      image: category.image,
      featured: category.featured,
      order: category.sortOrder,
      href: `/categories/${category.slug}`
    }));
  }
}
