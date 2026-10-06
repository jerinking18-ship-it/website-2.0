"use client";

import { type FormEvent, useState } from "react";

type EligibilityRule = {
  label: string;
  window: string;
  proof: string;
  detail: string;
};

const refundSummary = [
  {
    label: "Eligibility",
    title: "Missing, wrong, damaged, expired, or poor quality",
    body: "FreshCart reviews order details, item condition, proof notes, and reporting window before approving a refund."
  },
  {
    label: "Resolution",
    title: "Wallet, replacement, original payment, or coupon",
    body: "Eligible claims can be resolved with a wallet credit, replacement item, original payment refund, or support escalation."
  },
  {
    label: "Timeline",
    title: "Fresh grocery issues need quick reporting",
    body: "Perishable items have shorter windows, while payment issues can depend on provider confirmation and finance review."
  }
];

const eligibilityRules: EligibilityRule[] = [
  { label: "Missing item", window: "Within 24 hours", proof: "Order number and missing item name", detail: "Use when a billed item is absent from the delivered bag." },
  { label: "Wrong item", window: "Within 24 hours", proof: "Photo of delivered item and invoice", detail: "Use when another product, size, or variant was delivered." },
  { label: "Damaged item", window: "Within 12 hours", proof: "Product and delivery bag photo", detail: "Use for leaking, broken, crushed, or opened packaging." },
  { label: "Expired item", window: "Within 24 hours", proof: "Batch and expiry photo", detail: "Use when expiry, batch, or freshness label is invalid." },
  { label: "Poor quality", window: "Within 12 hours", proof: "Photo and issue description", detail: "Use for visibly spoiled, stale, or unusable fresh grocery." },
  { label: "Payment issue", window: "Within 48 hours", proof: "Payment reference or COD note", detail: "Use for duplicate charge, wallet issue, COD mismatch, or failed payment." }
];

const perishableRules = [
  { category: "Fresh produce", window: "12 hours", rule: "Report visible spoilage or poor quality before consumption with photo proof." },
  { category: "Dairy", window: "12 hours", rule: "Share batch, expiry, seal, and product condition photo." },
  { category: "Frozen", window: "6 hours", rule: "Report thawing or temperature concerns quickly after delivery." },
  { category: "Bakery", window: "12 hours", rule: "Freshness, wrong item, or damaged item claims need item photo." },
  { category: "Staples", window: "24 hours", rule: "Damaged pack, expired item, or wrong item proof may be requested." }
];

const timelineSteps = [
  { label: "Support review", value: "Usually under 2 hours for active orders" },
  { label: "Quality check", value: "Photo, batch, invoice, and delivery state reviewed" },
  { label: "Finance approval", value: "Wallet fastest, provider refund depends on gateway" },
  { label: "Replacement", value: "Scheduled in next available delivery slot" }
];

const nonRefundableCases = [
  "Customer unavailable or unreachable during delivery",
  "Wrong address or restricted access not resolved in time",
  "Consumed item without proof of issue",
  "Complaint submitted after policy window",
  "Product stored or handled incorrectly after delivery",
  "Suspicious repeated claims or abuse signals"
];

const refundModes = [
  { title: "Wallet credit", detail: "Fastest option after approval." },
  { title: "Replacement item", detail: "Best for fresh grocery availability issues." },
  { title: "Original payment refund", detail: "Timeline depends on payment provider." },
  { title: "Coupon compensation", detail: "Used for minor service recovery cases." },
  { title: "Support escalation", detail: "Used for disputes or unusual cases." }
];

export function RefundPolicyPageExperience() {
  const [activeEligibility, setActiveEligibility] = useState(eligibilityRules[0].label);
  const [refundForm, setRefundForm] = useState({
    name: "",
    contact: "",
    orderNumber: "",
    item: "",
    issueType: eligibilityRules[0].label,
    preference: "Wallet credit",
    proofNote: "",
    notes: ""
  });
  const [lookup, setLookup] = useState("");
  const [lookupStatus, setLookupStatus] = useState("Enter an order or refund reference to check request status.");
  const [formStatus, setFormStatus] = useState("Submit a request with item details, issue type, proof note, and preferred resolution.");

  const activeRule = eligibilityRules.find((rule) => rule.label === activeEligibility) ?? eligibilityRules[0];

  function updateRefundForm(field: keyof typeof refundForm, value: string) {
    setRefundForm((current) => ({ ...current, [field]: value }));
  }

  function chooseEligibility(rule: EligibilityRule) {
    setActiveEligibility(rule.label);
    updateRefundForm("issueType", rule.label);
    setFormStatus(`${rule.label} selected. ${rule.proof}. Report window: ${rule.window}.`);
  }

  function submitRefund(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!refundForm.name.trim() || !refundForm.contact.trim() || !refundForm.orderNumber.trim() || !refundForm.item.trim()) {
      setFormStatus("Name, contact, order number, and item are required.");
      return;
    }
    if (!refundForm.proofNote.trim() || !refundForm.notes.trim()) {
      setFormStatus("Add proof details and issue notes before submitting.");
      return;
    }
    setFormStatus(`Refund request created for ${refundForm.item}. Reference RF-${Date.now().toString().slice(-4)}.`);
  }

  function checkRefundStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reference = lookup.trim().toUpperCase();
    if (!reference) {
      setLookupStatus("Add an order or refund reference first.");
      return;
    }
    if (reference.includes("10482")) {
      setLookupStatus(`${reference}: support review pending. Proof required for selected item.`);
      return;
    }
    if (reference.startsWith("RF-")) {
      setLookupStatus(`${reference}: finance approval queue. Wallet credit is fastest once approved.`);
      return;
    }
    setLookupStatus(`${reference}: no live request found yet. Check order history or contact support.`);
  }

  return (
    <main className="customer-app">
      <section className="shopping-shell">
        <section className="main-module refund-page-module">
          <a className="brand" href="/">
            <span className="brand-mark">FC</span>
            <div>
              <strong>FreshCart Market</strong>
              <small>Refund center</small>
            </div>
          </a>
          <header className="module-header">
            <span className="eyebrow">Refund and return policy</span>
            <h1>Refunds, replacements, and returns for grocery orders.</h1>
            <p>
              Check eligibility, understand perishable windows, submit a refund request, look up request status,
              and contact support when an order needs review.
            </p>
          </header>

          <section className="refund-summary-grid" aria-label="Refund summary">
            {refundSummary.map((card) => (
              <article className="refund-client-card" key={card.label}>
                <span>{card.label}</span>
                <strong>{card.title}</strong>
                <p>{card.body}</p>
              </article>
            ))}
          </section>

          <section className="refund-eligibility-grid" aria-label="Refund eligibility rules">
            {eligibilityRules.map((rule) => (
              <button
                aria-pressed={activeEligibility === rule.label}
                className={activeEligibility === rule.label ? "active" : ""}
                key={rule.label}
                onClick={() => chooseEligibility(rule)}
                type="button"
              >
                <span>{rule.label}</span>
                <strong>{rule.window}</strong>
                <small>{rule.proof}</small>
              </button>
            ))}
          </section>

          <section className="refund-active-rule">
            <div>
              <span>Selected issue</span>
              <strong>{activeRule.label}</strong>
              <p>{activeRule.detail}</p>
            </div>
            <small>{activeRule.proof} | {activeRule.window}</small>
          </section>

          <section className="refund-workspace">
            <form className="refund-request-card" onSubmit={submitRefund}>
              <div className="checkout-card-heading">
                <span>Refund request</span>
                <strong>Create request</strong>
              </div>
              <div className="refund-form-grid">
                <label>
                  <span>Name</span>
                  <input value={refundForm.name} onChange={(event) => updateRefundForm("name", event.target.value)} />
                </label>
                <label>
                  <span>Phone or email</span>
                  <input value={refundForm.contact} onChange={(event) => updateRefundForm("contact", event.target.value)} />
                </label>
                <label>
                  <span>Order number</span>
                  <input value={refundForm.orderNumber} onChange={(event) => updateRefundForm("orderNumber", event.target.value)} />
                </label>
                <label>
                  <span>Item</span>
                  <input value={refundForm.item} onChange={(event) => updateRefundForm("item", event.target.value)} />
                </label>
                <label>
                  <span>Issue type</span>
                  <select
                    value={refundForm.issueType}
                    onChange={(event) => {
                      const selected = eligibilityRules.find((rule) => rule.label === event.target.value);
                      if (selected) chooseEligibility(selected);
                    }}
                  >
                    {eligibilityRules.map((rule) => (
                      <option key={rule.label}>{rule.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Preferred resolution</span>
                  <select value={refundForm.preference} onChange={(event) => updateRefundForm("preference", event.target.value)}>
                    {refundModes.map((mode) => (
                      <option key={mode.title}>{mode.title}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Photo/proof note</span>
                  <input
                    placeholder="Example: Added batch and product photo"
                    value={refundForm.proofNote}
                    onChange={(event) => updateRefundForm("proofNote", event.target.value)}
                  />
                </label>
                <label className="refund-notes-field">
                  <span>Issue notes</span>
                  <textarea
                    placeholder="Describe the issue, item condition, and delivery context"
                    value={refundForm.notes}
                    onChange={(event) => updateRefundForm("notes", event.target.value)}
                  />
                </label>
              </div>
              <div className="refund-submit-row">
                <small>{formStatus}</small>
                <button type="submit">Submit refund request</button>
              </div>
            </form>

            <aside className="refund-side-panel">
              <form className="refund-status-card" onSubmit={checkRefundStatus}>
                <label>
                  <span>Status lookup</span>
                  <input value={lookup} onChange={(event) => setLookup(event.target.value)} />
                </label>
                <button type="submit">Check status</button>
                <small>{lookupStatus}</small>
              </form>
              <section className="refund-timeline-card">
                <div className="refund-panel-heading">
                  <span>Refund timeline</span>
                </div>
                {timelineSteps.map((step) => (
                  <p key={step.label}>
                    <strong>{step.label}</strong>
                    {step.value}
                  </p>
                ))}
              </section>
            </aside>
          </section>

          <section className="perishable-rules-table refund-client-table">
            <div className="module-title">
              <div>
                <span>Perishable grocery windows</span>
                <h2>Report fresh issues quickly</h2>
              </div>
              <a href="/orders">Open order history</a>
            </div>
            {perishableRules.map((rule) => (
              <article key={rule.category}>
                <strong>{rule.category}</strong>
                <span>{rule.window}</span>
                <p>{rule.rule}</p>
              </article>
            ))}
          </section>

          <section className="refund-policy-grid">
            <article className="refund-client-card">
              <span>Refund modes</span>
              {refundModes.map((mode) => (
                <p key={mode.title}>
                  <strong>{mode.title}</strong>
                  {mode.detail}
                </p>
              ))}
            </article>
            <article className="refund-client-card">
              <span>Non-refundable cases</span>
              <ul>
                {nonRefundableCases.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="refund-client-card">
              <span>Need help?</span>
              <p>For active grocery issues, keep product photos, order number, delivery bag photo, and payment reference ready.</p>
              <div className="refund-support-actions">
                <a href="/orders">Open orders</a>
                <a href="/contact">Contact support</a>
                <a href="/shipping-policy">Delivery policy</a>
              </div>
            </article>
          </section>
        </section>
      </section>
    </main>
  );
}
