export type AdminMetricSeed = {
  label: string;
  value: string;
  detail: string;
};

export type AdminProductSeed = {
  id?: string;
  slug?: string;
  categorySlug?: string;
  imageFile?: string;
  name: string;
  sku: string;
  category: string;
  price: string;
  sale: string;
  stock: string;
  status: string;
  badge: string;
};

export type AdminOrderSeed = {
  id: string;
  customer: string;
  phone: string;
  status: string;
  fulfillment: string;
  payment: string;
  slot: string;
  total: string;
};

export type AdminInventorySeed = {
  product: string;
  sku: string;
  stock: number;
  reserved: number;
  available: number;
  threshold: number;
  expiry: string;
  status: string;
};

export type AdminSupportSeed = {
  id?: string;
  source?: string;
  customer: string;
  topic: string;
  state: string;
  agent: string;
  order: string;
  time: string;
  customerMessage?: string;
  agentMessage?: string;
  lastMessage?: string;
  messageCount?: number;
  channel?: string;
};

export type AdminDeliverySeed = {
  id: string;
  rider: string;
  order: string;
  status: string;
  eta: string;
};

export const metrics: AdminMetricSeed[] = [];
export const products: AdminProductSeed[] = [];
export const orders: AdminOrderSeed[] = [];
export const inventory: AdminInventorySeed[] = [];
export const support: AdminSupportSeed[] = [];
export const deliveries: AdminDeliverySeed[] = [];
