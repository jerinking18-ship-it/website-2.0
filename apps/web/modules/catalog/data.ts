export type Product = {
  id: number | string;
  slug: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  oldPrice?: number;
  badge: string;
  stock: "In stock" | "Low stock" | "Out of stock";
  rating: string;
  color: string;
  image?: string;
  description: string;
  supplier: string;
  tags: string[];
};

export const categories: Array<{ name: string; slug: string; note: string }> = [];
export const products: Product[] = [];
export const deliverySlots: Array<{ label: string; capacity: string; fee: number }> = [];
export const supportMessages: Array<{ sender: string; text: string }> = [];
export const orderTimeline: string[] = [];
