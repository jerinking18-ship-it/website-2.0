"use client";

import { type FormEvent, useState } from "react";

type ServiceArea = {
  pincode: string;
  area: string;
  branch: string;
  eta: string;
  minOrder: string;
  status: string;
};

type SlotRule = {
  name: string;
  time: string;
  cutoff: string;
  fee: string;
};

type ChargeRule = {
  label: string;
  amount: string;
  condition: string;
};

type TrackingStep = {
  label: string;
  detail: string;
};

const deliverySummary = [
  {
    label: "Serviceability",
    title: "Check by pincode or area",
    body: "Delivery availability depends on branch coverage, item stock, rider capacity, and selected slot."
  },
  {
    label: "Slots",
    title: "Express, same-day, scheduled",
    body: "Choose the delivery speed that fits your basket, with cutoff and capacity rules shown before checkout."
  },
  {
    label: "Tracking",
    title: "Live order updates",
    body: "After assignment, active orders show ETA, rider progress, support access, and delivery status."
  }
];

const serviceAreas: ServiceArea[] = [
  { pincode: "400050", area: "Bandra West", branch: "FreshCart Bandra Hub", eta: "18-28 min", minOrder: "Rs. 199", status: "Serviceable" },
  { pincode: "400053", area: "Andheri West", branch: "FreshCart Andheri Hub", eta: "22-35 min", minOrder: "Rs. 249", status: "Serviceable" },
  { pincode: "400076", area: "Powai", branch: "FreshCart Powai Hub", eta: "28-42 min", minOrder: "Rs. 299", status: "Limited slots" }
];

const slotRules: SlotRule[] = [
  { name: "Express", time: "18-35 min", cutoff: "Available while branch capacity is open", fee: "Rs. 29-59" },
  { name: "Same day", time: "2-4 hour slot", cutoff: "Change up to 30 min before packing", fee: "Rs. 19" },
  { name: "Scheduled", time: "Choose morning/evening slot", cutoff: "Change before slot preparation starts", fee: "Free above threshold" }
];

const chargeRules: ChargeRule[] = [
  { label: "Free delivery", amount: "Rs. 0", condition: "Cart above Rs. 499 in serviceable branches" },
  { label: "Standard delivery", amount: "Rs. 19", condition: "Regular same-day grocery slots" },
  { label: "Express fee", amount: "Rs. 29-59", condition: "Fast delivery based on branch and rider capacity" },
  { label: "Small cart fee", amount: "Rs. 15", condition: "Applied below minimum basket threshold" },
  { label: "High demand note", amount: "Variable", condition: "Rain, peak load, or limited rider capacity may affect fee or ETA" }
];

const trackingSteps: TrackingStep[] = [
  { label: "Order confirmed", detail: "Payment or COD validation completed" },
  { label: "Packed", detail: "Items picked, packed, and checked at branch" },
  { label: "Assigned", detail: "Delivery partner assigned with live route" },
  { label: "Out for delivery", detail: "Customer can track ETA and rider location" },
  { label: "Arriving soon", detail: "Rider is near the delivery address" },
  { label: "Delivered", detail: "OTP/contactless handoff completed" },
  { label: "Failed delivery", detail: "Shown when handoff fails because of no response, wrong address, or access issue" }
];

const partnerRules = [
  { title: "OTP handoff", body: "High-value and prepaid grocery orders may require OTP confirmation at delivery." },
  { title: "Contactless delivery", body: "Available when the address and payment state allow safe doorstep handoff." },
  { title: "Customer unavailable", body: "The rider will attempt calls before a delivery is marked as failed." },
  { title: "Wrong address", body: "Address changes after dispatch depend on rider route and branch approval." },
  { title: "Gate or reception", body: "Apartment, office, and security-gate delivery can be completed at reception when access is restricted." }
];

const handlingRules = [
  { category: "Dairy", packing: "Insulated bag", promise: "Delivered within cold-chain handling limits." },
  { category: "Frozen", packing: "Temperature-aware dispatch", promise: "Packed last and delivered on a priority route." },
  { category: "Fresh produce", packing: "Crush-safe crate", promise: "Checked for visible quality before packing." },
  { category: "Bakery", packing: "Freshness-safe packing", promise: "Packed to reduce crushing and moisture issues." }
];

const restrictionRules = [
  { title: "Restricted item", location: "Selected branches", detail: "Frozen and cold-chain items can be unavailable when route time is too high." },
  { title: "Apartment delivery", location: "High-security societies", detail: "Customers must answer calls or coordinate gate handoff when rider entry is restricted." },
  { title: "Office delivery", location: "Commercial buildings", detail: "Deliveries may stop at reception/security if floor access is blocked." },
  { title: "Remote areas", location: "Outside active coverage", detail: "Some pincodes may not be serviceable until a nearby branch supports them." }
];

const failedDeliveryRules = [
  { title: "Call attempts", detail: "Rider/support may call before marking a delivery as failed." },
  { title: "No response", detail: "If the customer is unreachable, reattempt or cancellation depends on item type and branch state." },
  { title: "Wrong address", detail: "Incorrect address can delay handoff and may require support approval to reroute." },
  { title: "Reattempt eligibility", detail: "Fresh or frozen items may not always qualify for late reattempt because of quality limits." },
  { title: "Fee rules", detail: "Repeated failed delivery may affect refund, cancellation, or delivery fee eligibility." }
];

const policyClauses = [
  { title: "Serviceability", body: "Delivery is available only in active branch coverage areas and can change by pincode, inventory, and slot capacity." },
  { title: "Tracking", body: "Live tracking is shown after the order is assigned to a delivery partner." },
  { title: "Checkout", body: "Delivery charges, unavailable products, branch stock, and slot validation are shown before payment." }
];

export function DeliveryPolicyPageExperience() {
  const [pincode, setPincode] = useState("");
  const [serviceStatus, setServiceStatus] = useState("Enter a pincode to check branch availability and delivery slots.");
  const [matchedArea, setMatchedArea] = useState<ServiceArea | null>(null);
  const [activeSlot, setActiveSlot] = useState(slotRules[0].name);
  const [orderNumber, setOrderNumber] = useState("");
  const [trackingStatus, setTrackingStatus] = useState("Enter an order number to preview customer delivery status.");
  const [supportForm, setSupportForm] = useState({
    name: "",
    contact: "",
    orderNumber: "",
    issue: ""
  });
  const [supportStatus, setSupportStatus] = useState("Submit a delivery request if your slot, address, or tracking needs help.");

  function checkServiceability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const match = serviceAreas.find((area) => area.pincode.trim() === pincode.trim());
    if (!pincode.trim()) {
      setMatchedArea(null);
      setServiceStatus("Please enter a pincode.");
      return;
    }
    if (!match) {
      setMatchedArea(null);
      setServiceStatus(`${pincode}: not serviceable yet. You can contact support or try a nearby delivery address.`);
      return;
    }
    setMatchedArea(match);
    setServiceStatus(`${match.area} is ${match.status.toLowerCase()} from ${match.branch}. ETA ${match.eta}, minimum order ${match.minOrder}.`);
  }

  function checkTracking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reference = orderNumber.trim().toUpperCase();
    if (!reference) {
      setTrackingStatus("Please enter an order number.");
      return;
    }
    if (reference.includes("10482")) {
      setTrackingStatus(`${reference}: assigned to delivery partner. ETA 18 minutes. OTP required at handoff.`);
      return;
    }
    setTrackingStatus(`${reference}: order status will appear after confirmation and packing.`);
  }

  function updateSupportForm(field: keyof typeof supportForm, value: string) {
    setSupportForm((current) => ({ ...current, [field]: value }));
  }

  function submitDeliverySupport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supportForm.name.trim() || !supportForm.contact.trim() || !supportForm.issue.trim()) {
      setSupportStatus("Name, contact, and issue are required.");
      return;
    }
    setSupportStatus(`Delivery support request created for ${supportForm.orderNumber || "new order"}. Team will contact ${supportForm.contact}.`);
  }

  return (
    <main className="customer-app">
      <section className="shopping-shell">
        <section className="main-module delivery-policy-module">
          <a className="brand" href="/">
            <span className="brand-mark">FC</span>
            <div>
              <strong>FreshCart Market</strong>
              <small>Delivery center</small>
            </div>
          </a>
          <header className="module-header">
            <span className="eyebrow">Delivery policy</span>
            <h1>Shipping and Delivery Policy</h1>
            <p>
              Check serviceability, delivery slots, charges, tracking stages, and fresh grocery handling rules before checkout.
            </p>
          </header>

          <section className="delivery-summary-grid" aria-label="Delivery summary">
            {deliverySummary.map((card) => (
              <article className="delivery-summary-card" key={card.label}>
                <span>{card.label}</span>
                <strong>{card.title}</strong>
                <p>{card.body}</p>
              </article>
            ))}
          </section>

          <section className="delivery-policy-grid">
            <form className="delivery-service-card" onSubmit={checkServiceability}>
              <div className="checkout-card-heading">
                <span>Serviceability</span>
                <strong>Check delivery area</strong>
              </div>
              <label>
                <span>Pincode or area code</span>
                <input value={pincode} onChange={(event) => setPincode(event.target.value)} />
              </label>
              <button type="submit">Check serviceability</button>
              <small>{serviceStatus}</small>
              {matchedArea ? (
                <div className="delivery-result-card">
                  <strong>{matchedArea.area}</strong>
                  <span>{matchedArea.branch}</span>
                  <p>{matchedArea.eta} delivery, minimum order {matchedArea.minOrder}</p>
                </div>
              ) : null}
            </form>

            <section className="delivery-slot-preview">
              <div className="checkout-card-heading">
                <span>Delivery slots</span>
                <strong>{activeSlot}</strong>
              </div>
              <div className="delivery-slot-buttons">
                {slotRules.map((slot) => (
                  <button
                    aria-pressed={activeSlot === slot.name}
                    className={activeSlot === slot.name ? "active" : ""}
                    key={slot.name}
                    onClick={() => setActiveSlot(slot.name)}
                    type="button"
                  >
                    <span>{slot.name}</span>
                    <strong>{slot.time}</strong>
                    <small>{slot.fee}</small>
                  </button>
                ))}
              </div>
              <p className="delivery-slot-note">
                {slotRules.find((slot) => slot.name === activeSlot)?.cutoff}
              </p>
            </section>
          </section>

          <section className="delivery-area-grid">
            {serviceAreas.map((area) => (
              <article className="delivery-info-card" key={area.pincode}>
                <span>{area.pincode}</span>
                <strong>{area.area}</strong>
                <p>{area.branch}</p>
                <small>{area.eta} | {area.minOrder} minimum | {area.status}</small>
              </article>
            ))}
          </section>

          <section className="delivery-card-grid">
            <section className="delivery-rule-card delivery-client-card">
              <div className="module-title">
                <div>
                  <span>Delivery charges</span>
                  <h2>Fee rules</h2>
                </div>
              </div>
              {chargeRules.map((charge) => (
                <article key={charge.label}>
                  <strong>{charge.label}</strong>
                  <span>{charge.amount}</span>
                  <p>{charge.condition}</p>
                </article>
              ))}
            </section>

            <section className="delivery-tracking-card delivery-client-card">
              <div className="module-title">
                <div>
                  <span>Order tracking</span>
                  <h2>Customer timeline</h2>
                </div>
              </div>
              <form className="delivery-track-form" onSubmit={checkTracking}>
                <input value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} />
                <button type="submit">Track order</button>
                <small>{trackingStatus}</small>
              </form>
              <div className="delivery-tracking-preview">
                {trackingSteps.map((step) => (
                  <p key={step.label}>
                    <strong>{step.label}</strong>
                    <span>{step.detail}</span>
                  </p>
                ))}
              </div>
            </section>
          </section>

          <section className="delivery-card-grid">
            <section className="delivery-rule-card delivery-client-card">
              <div className="module-title">
                <div>
                  <span>Delivery partner rules</span>
                  <h2>OTP, availability, and address handling</h2>
                </div>
              </div>
              {partnerRules.map((rule) => (
                <article key={rule.title}>
                  <strong>{rule.title}</strong>
                  <p>{rule.body}</p>
                </article>
              ))}
            </section>

            <section className="delivery-rule-card delivery-client-card">
              <div className="module-title">
                <div>
                  <span>Fresh grocery handling</span>
                  <h2>Cold-chain and packing promises</h2>
                </div>
              </div>
              {handlingRules.map((rule) => (
                <article key={rule.category}>
                  <strong>{rule.category}</strong>
                  <span>{rule.packing}</span>
                  <p>{rule.promise}</p>
                </article>
              ))}
            </section>
          </section>

          <section className="delivery-card-grid">
            <section className="delivery-rule-card delivery-client-card">
              <div className="module-title">
                <div>
                  <span>Restricted delivery rules</span>
                  <h2>Unavailable items and location limits</h2>
                </div>
              </div>
              {restrictionRules.map((rule) => (
                <article key={rule.title}>
                  <strong>{rule.title}</strong>
                  <span>{rule.location}</span>
                  <p>{rule.detail}</p>
                </article>
              ))}
            </section>

            <form className="delivery-rule-card delivery-support-form" onSubmit={submitDeliverySupport}>
              <div className="module-title">
                <div>
                  <span>Need help?</span>
                  <h2>Contact delivery support</h2>
                </div>
              </div>
              <label>
                <span>Name</span>
                <input value={supportForm.name} onChange={(event) => updateSupportForm("name", event.target.value)} />
              </label>
              <label>
                <span>Phone or email</span>
                <input value={supportForm.contact} onChange={(event) => updateSupportForm("contact", event.target.value)} />
              </label>
              <label>
                <span>Order number</span>
                <input value={supportForm.orderNumber} onChange={(event) => updateSupportForm("orderNumber", event.target.value)} />
              </label>
              <label>
                <span>Issue</span>
                <textarea value={supportForm.issue} onChange={(event) => updateSupportForm("issue", event.target.value)} />
              </label>
              <button type="submit">Submit delivery request</button>
              <small>{supportStatus}</small>
            </form>
          </section>

          <section className="delivery-card-grid">
            <section className="delivery-rule-card delivery-client-card">
              <div className="module-title">
                <div>
                  <span>Failed delivery rules</span>
                  <h2>No response, wrong address, and reattempt policy</h2>
                </div>
              </div>
              {failedDeliveryRules.map((rule) => (
                <article key={rule.title}>
                  <strong>{rule.title}</strong>
                  <p>{rule.detail}</p>
                </article>
              ))}
            </section>

            <section className="delivery-support-actions">
              <div>
                <span>Support actions</span>
                <strong>Need help with delivery?</strong>
                <p>Open your orders, track a live delivery, contact support, or review refund rules for damaged or spoiled items.</p>
              </div>
              <nav aria-label="Delivery support links">
                <a href="/orders">Open orders</a>
                <a href="/orders">Track order</a>
                <a href="/contact">Contact support</a>
                <a href="/refund-policy">Refund policy</a>
              </nav>
            </section>
          </section>

          <section className="delivery-policy-list">
            <div className="module-title">
              <div>
                <span>Policy notes</span>
                <h2>How delivery decisions are applied</h2>
              </div>
            </div>
            {policyClauses.map((clause) => (
              <article key={clause.title}>
                <strong>{clause.title}</strong>
                <p>{clause.body}</p>
              </article>
            ))}
          </section>
        </section>
      </section>
    </main>
  );
}
