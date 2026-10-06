import { CustomerExperience } from "../../../modules/customer/customer-experience";

export default async function CategoryDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CustomerExperience view="categories" categorySlug={slug} />;
}
