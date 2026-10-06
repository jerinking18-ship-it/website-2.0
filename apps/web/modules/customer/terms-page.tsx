"use client";

import { type FormEvent, useState } from "react";

const termsSummary = [
  {
    label: "Account",
    title: "Use accurate account details",
    body: "Keep your phone, email, OTP access, and saved addresses accurate so orders and delivery support can reach you."
  },
  {
    label: "Orders",
    title: "Stock and price confirm at checkout",
    body: "Products, prices, offers, branch stock, substitutions, and delivery slots are confirmed during checkout."
  },
  {
    label: "Delivery",
    title: "Be available for your selected slot",
    body: "Delivery depends on serviceability, rider access, OTP/contactless handoff, and correct address details."
  }
];

const termsSections = [
  {
    title: "Account terms",
    summary:
      "Customers are responsible for accurate account information, safe OTP handling, saved addresses, and account activity.",
    points: [
      "Use your real name, reachable phone number, and active email.",
      "You are responsible for saved addresses, delivery instructions, and household access.",
      "Do not share OTP, login access, or payment access with unknown people.",
      "FreshCart may restrict accounts involved in fraud, abuse, repeated fake orders, or unsafe activity."
    ]
  },
  {
    title: "Ordering terms",
    summary:
      "Grocery availability, prices, images, replacements, and offers can change by branch stock before checkout is completed.",
    points: [
      "Product photos are representative and packaging can vary by batch or supplier.",
      "Prices, taxes, delivery fees, wallet credits, and coupons are finalized at checkout.",
      "If an item becomes unavailable, support or checkout may offer replacement or removal.",
      "Nutrition, expiry, batch, and seller/branch availability should be checked on product detail where available."
    ]
  },
  {
    title: "Delivery terms",
    summary:
      "Delivery is based on pincode serviceability, slot capacity, rider route, customer availability, and successful handoff.",
    points: [
      "Customer must be reachable during the selected delivery slot.",
      "OTP or contactless handoff may be required for delivery completion.",
      "Wrong address, no response, restricted entry, or failed handoff can lead to delay or cancellation.",
      "Live tracking and ETA are estimates and can change because of traffic, weather, capacity, or safety."
    ]
  },
  {
    title: "Payments, wallet, and invoices",
    summary:
      "COD, online payment, wallet, loyalty, and invoice rules depend on order state and payment provider confirmation.",
    points: [
      "Online orders are confirmed after payment provider success response.",
      "COD orders may require verification, OTP, or cash readiness at handoff.",
      "Wallet or loyalty credits can have eligibility, expiry, and abuse-prevention rules.",
      "Invoices are available from order history after order confirmation."
    ]
  },
  {
    title: "Cancellation, refunds, and returns",
    summary:
      "Cancellation and return eligibility depends on order stage, perishable category, proof, and policy window.",
    points: [
      "Orders may be cancelled before packing or dispatch when eligible.",
      "Fresh, dairy, frozen, and bakery items can have shorter return windows.",
      "Missing, damaged, expired, or wrong item claims may require photo, batch, delivery bag, or invoice proof.",
      "Refund mode and timeline can depend on wallet, COD, original payment provider, or support review."
    ]
  },
  {
    title: "Coupons and promotions",
    summary:
      "Coupons, offers, and promotional pricing are subject to eligibility, minimum cart value, expiry, and abuse checks.",
    points: [
      "Some coupons are one-time use, account-specific, or branch/category-specific.",
      "Minimum cart value, excluded items, and delivery fee rules can apply.",
      "FreshCart may reject coupon abuse, fake accounts, or repeated suspicious usage.",
      "Offer pricing can change before checkout if the promotion expires or stock changes."
    ]
  },
  {
    title: "Customer conduct",
    summary:
      "Customers must use the platform respectfully and safely with support, riders, store staff, and payment systems.",
    points: [
      "Do not place fake orders or misuse refunds, coupons, wallet, or COD.",
      "Do not abuse, threaten, or harass riders, support staff, or store staff.",
      "Respect delivery access, building security rules, and rider safety.",
      "Unsafe or fraudulent behavior can lead to order cancellation or account review."
    ]
  },
  {
    title: "Privacy and communication",
    summary:
      "Service communications are used for orders, delivery, support, payments, account safety, and policy updates.",
    points: [
      "Order, payment, delivery, refund, and security messages may be sent by SMS, WhatsApp, email, or in-app channels.",
      "Marketing messages can be managed through privacy or account preferences.",
      "Personal data handling is explained in the Privacy Policy.",
      "Important service messages can still be sent even when marketing is disabled."
    ]
  },
  {
    title: "Disputes and support",
    summary:
      "Customers should contact support first for order, delivery, refund, wallet, coupon, or account disputes.",
    points: [
      "Support can review order evidence, delivery state, payment state, and account activity.",
      "Escalation may be required for finance, legal, or safety issues.",
      "Production legal jurisdiction and formal dispute route should be finalized before launch.",
      "Keep order number, issue details, photos, and payment references ready when contacting support."
    ]
  }
];

const quickLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Delivery Policy", href: "/shipping-policy" },
  { label: "Contact Support", href: "/contact" }
];

export function TermsPageExperience() {
  const [activeSection, setActiveSection] = useState(termsSections[0].title);
  const [accepted, setAccepted] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    topic: "Question about delivery terms",
    message: ""
  });
  const [status, setStatus] = useState("Send us a terms question if anything is unclear.");

  function updateContactForm(field: keyof typeof contactForm, value: string) {
    setContactForm((current) => ({ ...current, [field]: value }));
  }

  function submitTermsQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      setStatus("Name, email, and message are required.");
      return;
    }
    setStatus(`Terms question submitted for ${contactForm.email}. Reference TERMS-${Date.now().toString().slice(-4)}.`);
  }

  return (
    <main className="customer-app">
      <section className="shopping-shell">
        <section className="main-module terms-page-module">
          <a className="brand" href="/">
            <span className="brand-mark">FC</span>
            <div>
              <strong>FreshCart Market</strong>
              <small>Terms center</small>
            </div>
          </a>
          <header className="module-header">
            <span className="eyebrow">Terms and conditions</span>
            <h1>Customer terms for grocery orders, delivery, payments, and support.</h1>
            <p>
              Read the key rules for using FreshCart, placing orders, receiving deliveries, using payments,
              applying coupons, and contacting support.
            </p>
          </header>

          <section className="terms-summary-grid" aria-label="Terms summary">
            {termsSummary.map((card) => (
              <article className="terms-client-card" key={card.label}>
                <span>{card.label}</span>
                <strong>{card.title}</strong>
                <p>{card.body}</p>
              </article>
            ))}
          </section>

          <section className="terms-quick-links">
            <div>
              <span>Related policies</span>
              <strong>Quick links for customers</strong>
            </div>
            <nav aria-label="Related policy links">
              {quickLinks.map((link) => (
                <a href={link.href} key={link.href}>{link.label}</a>
              ))}
            </nav>
          </section>

          <section className="terms-accordion">
            <div className="module-title">
              <div>
                <span>Terms sections</span>
                <h2>Read the rules by topic</h2>
              </div>
            </div>
            {termsSections.map((section) => {
              const isOpen = activeSection === section.title;
              return (
                <article className={isOpen ? "active" : ""} key={section.title}>
                  <button
                    aria-expanded={isOpen}
                    onClick={() => setActiveSection(isOpen ? "" : section.title)}
                    type="button"
                  >
                    <span>{section.title}</span>
                    <strong>{isOpen ? "Close" : "Open"}</strong>
                  </button>
                  {isOpen ? (
                    <div>
                      <p>{section.summary}</p>
                      <ul>
                        {section.points.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </section>

          <section className="terms-workspace client">
            <article className="terms-acceptance-card">
              <div className="checkout-card-heading">
                <span>Customer acknowledgement</span>
                <strong>{accepted ? "Confirmed" : "Pending"}</strong>
              </div>
              <label className="terms-client-acceptance">
                <input checked={accepted} onChange={(event) => setAccepted(event.target.checked)} type="checkbox" />
                <span>I have read the key FreshCart terms and understand that checkout confirms the latest order-specific rules.</span>
              </label>
              <p>
                This acknowledgement is a client-side preview. In production, acceptance should be versioned and stored with
                account, checkout, legal, and audit records.
              </p>
            </article>

            <form className="terms-contact-card" onSubmit={submitTermsQuestion}>
              <div className="checkout-card-heading">
                <span>Need clarification?</span>
                <strong>Contact support about terms</strong>
              </div>
              <label>
                <span>Name</span>
                <input value={contactForm.name} onChange={(event) => updateContactForm("name", event.target.value)} />
              </label>
              <label>
                <span>Email</span>
                <input value={contactForm.email} onChange={(event) => updateContactForm("email", event.target.value)} />
              </label>
              <label>
                <span>Topic</span>
                <select value={contactForm.topic} onChange={(event) => updateContactForm("topic", event.target.value)}>
                  <option>Question about account terms</option>
                  <option>Question about ordering terms</option>
                  <option>Question about delivery terms</option>
                  <option>Question about payment terms</option>
                  <option>Question about refunds or returns</option>
                  <option>Question about coupons or promotions</option>
                </select>
              </label>
              <label>
                <span>Message</span>
                <textarea
                  placeholder="Tell us what you want clarified"
                  value={contactForm.message}
                  onChange={(event) => updateContactForm("message", event.target.value)}
                />
              </label>
              <div className="terms-submit-row">
                <small>{status}</small>
                <button type="submit">Submit question</button>
              </div>
            </form>
          </section>
        </section>
      </section>
    </main>
  );
}
