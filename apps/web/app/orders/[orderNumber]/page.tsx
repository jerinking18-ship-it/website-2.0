import { CustomerExperience } from "../../../modules/customer/customer-experience";

export default async function OrderTrackingPage({
  params
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  return <CustomerExperience view="tracking" orderNumber={orderNumber} />;
}
