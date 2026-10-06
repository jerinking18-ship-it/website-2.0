import { CustomerExperience } from "../../../modules/customer/customer-experience";

export default async function ProductDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CustomerExperience view="product-detail" productSlug={slug} />;
}
