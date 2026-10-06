import { CustomerExperience } from "../../modules/customer/customer-experience";

export default async function SearchPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  return <CustomerExperience view="search" initialQuery={params?.q ?? ""} />;
}
