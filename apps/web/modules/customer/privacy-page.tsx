"use client";

import { type FormEvent, useState } from "react";

const privacySummary = [
  {
    label: "Data we collect",
    title: "Account, delivery, orders, support",
    body: "We collect the information needed to create your account, deliver groceries, support orders, and keep the service secure."
  },
  {
    label: "How we use it",
    title: "Checkout, delivery, support, safety",
    body: "Your data helps us process orders, route riders, send order updates, handle refunds, and prevent fraud or misuse."
  },
  {
    label: "Your control",
    title: "Update, export, delete, opt out",
    body: "You can manage communication choices, request a copy of data, correct details, or ask for account deletion."
  }
];

const dataCategories = [
  { name: "Account details", examples: "Name, phone, email, login session", usage: "Sign in, verify identity, and support your account." },
  { name: "Delivery details", examples: "Address, pincode, delivery instructions", usage: "Check serviceability, assign branch stock, and route deliveries." },
  { name: "Order details", examples: "Cart, wishlist, purchases, invoices", usage: "Complete checkout, reorder, invoice, and customer care workflows." },
  { name: "Support details", examples: "Chat, email, WhatsApp/SMS tickets", usage: "Resolve delivery, payment, missing item, and refund issues." },
  { name: "Payment status", examples: "Payment mode, wallet, refund state", usage: "Reconcile payments, COD state, wallet credits, and refunds." },
  { name: "Device/session data", examples: "Browser, session, security signals", usage: "Keep accounts secure, remember preferences, and improve reliability." }
];

const usageCards = [
  "Process orders and checkout",
  "Deliver groceries and show ETA",
  "Send order, support, and account updates",
  "Handle refunds, returns, and disputes",
  "Improve search, catalog quality, and availability",
  "Prevent fraud, abuse, and unsafe activity"
];

const sharingPartners = [
  "Delivery partners",
  "Payment gateway",
  "WhatsApp/SMS/email providers",
  "Support tools",
  "Analytics and error monitoring",
  "Legal or government requests when required"
];

const securityPoints = [
  "Passwords and sessions are protected with modern application security controls.",
  "Payments are handled through payment gateway boundaries instead of storing raw card details.",
  "Sensitive admin and staff actions should use 2FA, roles, and audit logs.",
  "Fraud checks help protect customers, riders, and the store from unsafe activity."
];

const retentionRules = [
  { label: "Orders and invoices", value: "Kept for finance, tax, warranty, and customer support needs." },
  { label: "Support records", value: "Kept while issue history is needed for service quality and dispute handling." },
  { label: "Marketing choices", value: "Kept until you update preferences or opt out." },
  { label: "Deleted accounts", value: "Removed or anonymized where possible, subject to legal and finance requirements." }
];

export function PrivacyPageExperience() {
  const [preferences, setPreferences] = useState({
    "Order updates": true,
    "WhatsApp/SMS alerts": true,
    "Offer personalization": false,
    "Stock alerts": true
  });
  const [cookies, setCookies] = useState({
    "Essential cookies": true,
    "Cart and wishlist preferences": true,
    "Analytics cookies": false,
    "Marketing cookies": false
  });
  const [request, setRequest] = useState({
    name: "",
    email: "",
    type: "Export my data",
    message: ""
  });
  const [status, setStatus] = useState("Submit privacy questions, data export, correction, deletion, or marketing opt-out requests.");

  function updatePreference(preference: keyof typeof preferences, checked: boolean) {
    setPreferences((current) => ({ ...current, [preference]: checked }));
  }

  function updateCookie(cookie: keyof typeof cookies, checked: boolean) {
    if (cookie === "Essential cookies") return;
    setCookies((current) => ({ ...current, [cookie]: checked }));
  }

  function updateRequest(field: keyof typeof request, value: string) {
    setRequest((current) => ({ ...current, [field]: value }));
  }

  function submitPrivacyRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!request.name.trim() || !request.email.trim()) {
      setStatus("Name and email are required to submit a privacy request.");
      return;
    }
    setStatus(`${request.type} request submitted for ${request.email}. Reference PRIV-${Date.now().toString().slice(-4)}.`);
  }

  function saveChoices() {
    setStatus("Privacy and cookie choices saved in this browser session.");
  }

  return (
    <main className="customer-app">
      <section className="shopping-shell">
        <section className="main-module privacy-page-module">
          <a className="brand" href="/">
            <span className="brand-mark">FC</span>
            <div>
              <strong>FreshCart Market</strong>
              <small>Privacy center</small>
            </div>
          </a>
          <header className="module-header">
            <span className="eyebrow">Privacy policy</span>
            <h1>Your FreshCart privacy center.</h1>
            <p>
              Understand what data we collect, why we use it, how we share it, how long we keep it,
              and how you can control your privacy choices.
            </p>
          </header>

          <section className="privacy-summary-grid" aria-label="Privacy overview">
            {privacySummary.map((card) => (
              <article className="privacy-client-card" key={card.label}>
                <span>{card.label}</span>
                <strong>{card.title}</strong>
                <p>{card.body}</p>
              </article>
            ))}
          </section>

          <section className="privacy-data-table">
            <div className="module-title">
              <div>
                <span>Data we collect</span>
                <h2>Customer data categories</h2>
              </div>
            </div>
            <div className="privacy-client-table">
              {dataCategories.map((category) => (
                <article key={category.name}>
                  <strong>{category.name}</strong>
                  <span>{category.examples}</span>
                  <p>{category.usage}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="privacy-policy-grid">
            <article className="privacy-client-card">
              <span>How we use data</span>
              <div className="privacy-bullet-grid">
                {usageCards.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </article>
            <article className="privacy-client-card">
              <span>Sharing with partners</span>
              <div className="privacy-chip-list readonly">
                {sharingPartners.map((partner) => (
                  <b key={partner}>{partner}</b>
                ))}
              </div>
            </article>
          </section>

          <section className="privacy-workspace">
            <section className="privacy-preferences-card">
              <div className="checkout-card-heading">
                <span>Customer controls</span>
                <strong>Communication preferences</strong>
              </div>
              <div className="privacy-toggle-list">
                {Object.entries(preferences).map(([preference, checked]) => (
                  <label key={preference}>
                    <span>{preference}</span>
                    <input
                      checked={checked}
                      onChange={(event) => updatePreference(preference as keyof typeof preferences, event.target.checked)}
                      type="checkbox"
                    />
                  </label>
                ))}
              </div>
              <button onClick={saveChoices} type="button">Save choices</button>
            </section>

            <section className="privacy-preferences-card">
              <div className="checkout-card-heading">
                <span>Cookies</span>
                <strong>Tracking and preference choices</strong>
              </div>
              <div className="privacy-toggle-list">
                {Object.entries(cookies).map(([cookie, checked]) => (
                  <label key={cookie}>
                    <span>{cookie}</span>
                    <input
                      checked={checked}
                      disabled={cookie === "Essential cookies"}
                      onChange={(event) => updateCookie(cookie as keyof typeof cookies, event.target.checked)}
                      type="checkbox"
                    />
                  </label>
                ))}
              </div>
              <button onClick={saveChoices} type="button">Save cookie choices</button>
            </section>
          </section>

          <section className="privacy-policy-grid">
            <article className="privacy-client-card">
              <span>Security</span>
              {securityPoints.map((point) => (
                <p key={point}>{point}</p>
              ))}
            </article>
            <article className="privacy-client-card">
              <span>Retention</span>
              {retentionRules.map((rule) => (
                <p key={rule.label}>
                  <strong>{rule.label}</strong>
                  {rule.value}
                </p>
              ))}
            </article>
            <article className="privacy-client-card">
              <span>Children's privacy</span>
              <p>
                FreshCart is intended for adult account holders. Parents or guardians are responsible for household
                use of saved addresses, payment methods, and ordering activity.
              </p>
            </article>
          </section>

          <form className="privacy-request-card" onSubmit={submitPrivacyRequest}>
            <div className="checkout-card-heading">
              <span>Contact privacy team</span>
              <strong>Data export, deletion, correction, or opt-out request</strong>
            </div>
            <div className="privacy-request-grid">
              <label>
                <span>Name</span>
                <input value={request.name} onChange={(event) => updateRequest("name", event.target.value)} />
              </label>
              <label>
                <span>Email</span>
                <input value={request.email} onChange={(event) => updateRequest("email", event.target.value)} />
              </label>
              <label>
                <span>Request type</span>
                <select value={request.type} onChange={(event) => updateRequest("type", event.target.value)}>
                  <option>Export my data</option>
                  <option>Correct my data</option>
                  <option>Delete account request</option>
                  <option>Opt out of marketing</option>
                  <option>Question about delivery location</option>
                  <option>Payment or wallet data question</option>
                </select>
              </label>
              <label className="privacy-message-field">
                <span>Message</span>
                <textarea
                  placeholder="Add details for the privacy team"
                  value={request.message}
                  onChange={(event) => updateRequest("message", event.target.value)}
                />
              </label>
            </div>
            <div className="privacy-submit-row">
              <small>{status}</small>
              <button type="submit">Submit request</button>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}
