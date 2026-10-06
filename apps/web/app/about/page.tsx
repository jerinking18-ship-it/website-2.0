import { LegalPage } from "../../modules/customer/legal-page";

export default function AboutPage() {
  return (
    <LegalPage
      eyebrow="About FreshCart"
      title="Fresh grocery delivery built for local branches"
      summary="FreshCart connects product catalog, inventory, delivery, support, and customer orders into one grocery commerce experience."
      sections={[
        { heading: "Our promise", body: "Fresh products, clear pricing, fast slots, and customer-first support across every order." },
        { heading: "Operations", body: "Branch stock, supplier quality, delivery assignment, refunds, and support are planned through the admin panel." },
        { heading: "Customer experience", body: "Customers can shop, track, save products, manage account details, and request help from the website." }
      ]}
    />
  );
}
