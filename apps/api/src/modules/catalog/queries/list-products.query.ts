export type ProductListFilters = {
  category?: string;
  search?: string;
  inStock?: boolean;
  stock?: "all" | "available" | "low" | "out";
  supplier?: string;
  tags?: string[];
  dietary?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "rating" | "popular" | "deals";
  pincode?: string;
  page: number;
  limit: number;
};

export class ListProductsQuery {
  constructor(public readonly filters: ProductListFilters) {}
}
