import { OrderConfirmationPage } from "../../../../modules/customer/order-confirmation-page";

export default async function CheckoutConfirmationPage({
  params
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  return <OrderConfirmationPage orderNumber={orderNumber} />;
}
