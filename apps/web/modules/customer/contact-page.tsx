"use client";

import { type FormEvent, useEffect, useState } from "react";

const supportChannels = [
  { name: "Live chat", detail: "Best for active orders, rider ETA, missing items", eta: "Under 5 min" },
  { name: "WhatsApp/SMS", detail: "Delivery alerts, refund updates, account reminders", eta: "10-15 min" },
  { name: "Email support", detail: "Invoices, policy questions, account and wallet issues", eta: "4 business hours" },
  { name: "Phone escalation", detail: "Priority delivery and payment escalation path", eta: "Critical orders" }
];

const quickTopics = [
  "Track my order",
  "Refund or return",
  "Missing item",
  "Payment issue",
  "Change address or slot",
  "Wallet and loyalty"
];

const escalationSteps = [
  { label: "First response", value: "5 min chat / 15 min WhatsApp" },
  { label: "Delivery team", value: "Active order escalations" },
  { label: "Refund review", value: "Same day for fresh grocery issues" },
  { label: "Manager review", value: "Unresolved tickets after SLA" }
];

type BranchContact = {
  branch: string;
  area: string;
  timing: string;
  lead: string;
};

export function ContactPageExperience() {
  const [branchContacts, setBranchContacts] = useState<BranchContact[]>([]);
  const [activeChannel, setActiveChannel] = useState(supportChannels[0].name);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [serviceAreaMessage, setServiceAreaMessage] = useState("Enter a pincode to check serviceability from live branch data.");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    orderNumber: "",
    issueType: quickTopics[0],
    channel: supportChannels[0].name,
    branch: "",
    message: "",
    attachment: ""
  });
  const [statusLookup, setStatusLookup] = useState("");
  const [formMessage, setFormMessage] = useState("Tell us what happened and the support team will route it.");
  const [ticketStatus, setTicketStatus] = useState("Enter an order or ticket number to check support status.");

  function updateForm(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  useEffect(() => {
    let mounted = true;
    fetch("/api/customer/branches", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { branches: [] }))
      .then((data: { branches?: Array<{ label?: string; detail?: string; phone?: string; city?: string }> }) => {
        if (!mounted) return;
        const liveBranches = (data.branches ?? [])
          .filter((branch) => branch.label)
          .map((branch) => ({
            branch: String(branch.label),
            area: String(branch.detail ?? branch.city ?? "Service area configured in admin"),
            timing: "Slots managed in admin",
            lead: branch.phone ? `Call ${branch.phone}` : "Admin branch team"
          }));
        setBranchContacts(liveBranches);
        if (liveBranches[0]) {
          setSelectedBranch(liveBranches[0].branch);
          setForm((current) => ({ ...current, branch: liveBranches[0].branch }));
        }
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  function chooseChannel(channel: (typeof supportChannels)[number]) {
    setActiveChannel(channel.name);
    updateForm("channel", channel.name);
    setFormMessage(`${channel.name} selected. Expected response: ${channel.eta}.`);
  }

  function chooseBranch(branch: (typeof branchContacts)[number]) {
    setSelectedBranch(branch.branch);
    updateForm("branch", branch.branch);
    setFormMessage(`${branch.branch} selected for local delivery support.`);
  }

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.message.trim()) {
      setFormMessage("Name, phone, and message are required before creating a support request.");
      return;
    }
    setFormMessage("Saving support request...");
    try {
      const response = await fetch("/api/customer/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, topic: form.issueType })
      });
      const data = (await response.json()) as { message?: { reference?: string; status?: string } };
      if (!response.ok || !data.message?.reference) throw new Error("Contact save failed.");
      setFormMessage(`Support request saved. Reference ${data.message.reference}. Status: ${data.message.status}.`);
    } catch {
      setFormMessage("Could not save support request. Please try again.");
    }
  }

  function lookupTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reference = statusLookup.trim().toUpperCase();
    if (!reference) {
      setTicketStatus("Add a ticket or order number first.");
      return;
    }
    setTicketStatus(`${reference} status lookup will be loaded from the orders/support API.`);
  }

  async function checkServiceArea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = serviceArea.trim();
    if (!/^\d{6}$/.test(normalized)) {
      setServiceAreaMessage("Enter a valid 6-digit pincode.");
      return;
    }
    setServiceAreaMessage("Checking live serviceability...");
    try {
      const response = await fetch("/api/customer/serviceability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode: normalized })
      });
      const data = (await response.json()) as { serviceable?: boolean; branches?: Array<{ name?: string }> };
      const branch = data.branches?.[0]?.name ?? "";
      if (!response.ok || !data.serviceable || !branch) {
        setServiceAreaMessage(`Pincode ${normalized} is outside the current live delivery radius.`);
        return;
      }
      setSelectedBranch(branch);
      updateForm("branch", branch);
      setServiceAreaMessage(`Pincode ${normalized} is serviceable through ${branch}.`);
    } catch {
      setServiceAreaMessage("Could not check serviceability right now.");
    }
  }

  function resetContactForm() {
    setForm({
      name: "",
      phone: "",
      email: "",
      orderNumber: "",
      issueType: quickTopics[0],
      channel: activeChannel,
      branch: selectedBranch,
      message: "",
      attachment: ""
    });
    setFormMessage("Form cleared. Add details to create a new support request.");
  }

  return (
    <main className="customer-app">
      <section className="shopping-shell">
        <section className="main-module contact-page-module">
          <a className="brand" href="/">
            <span className="brand-mark">FC</span>
            <div>
              <strong>FreshCart Market</strong>
              <small>Customer support</small>
            </div>
          </a>
          <header className="module-header">
            <span className="eyebrow">Contact support</span>
            <h1>Get help with orders, refunds, payments, and delivery.</h1>
            <p>
              Choose a support channel, create a request, check ticket status, or contact the nearest branch for
              delivery-area support.
            </p>
          </header>

          <section className="contact-channel-grid" aria-label="Support channels">
            {supportChannels.map((channel) => (
              <button
                aria-pressed={activeChannel === channel.name}
                className={activeChannel === channel.name ? "active" : ""}
                key={channel.name}
                onClick={() => chooseChannel(channel)}
                type="button"
              >
                <span>{channel.name}</span>
                <strong>{channel.eta}</strong>
                <p>{channel.detail}</p>
              </button>
            ))}
          </section>

          <section className="contact-workspace">
            <form className="contact-form-card" onSubmit={submitContact}>
              <div className="checkout-card-heading">
                <span>Contact form</span>
                <strong>Create support request</strong>
              </div>
              <div className="contact-form-grid">
                <label>
                  <span>Name</span>
                  <input value={form.name} onChange={(event) => updateForm("name", event.target.value)} />
                </label>
                <label>
                  <span>Phone</span>
                  <input value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} />
                </label>
                <label>
                  <span>Email</span>
                  <input value={form.email} onChange={(event) => updateForm("email", event.target.value)} />
                </label>
                <label>
                  <span>Order number</span>
                  <input
                    value={form.orderNumber}
                    onChange={(event) => updateForm("orderNumber", event.target.value)}
                  />
                </label>
                <label>
                  <span>Issue type</span>
                  <select value={form.issueType} onChange={(event) => updateForm("issueType", event.target.value)}>
                    {quickTopics.map((topic) => (
                      <option key={topic}>{topic}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Support channel</span>
                  <select
                    value={form.channel}
                    onChange={(event) => {
                      updateForm("channel", event.target.value);
                      setActiveChannel(event.target.value);
                    }}
                  >
                    {supportChannels.map((channel) => (
                      <option key={channel.name}>{channel.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Nearest branch</span>
                  <select
                    disabled={branchContacts.length === 0}
                    value={form.branch}
                    onChange={(event) => {
                      updateForm("branch", event.target.value);
                      setSelectedBranch(event.target.value);
                    }}
                  >
                    {branchContacts.length === 0 ? <option>No active branches configured</option> : null}
                    {branchContacts.map((branch) => (
                      <option key={branch.branch}>{branch.branch}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Photo/attachment note</span>
                  <input
                    placeholder="Example: Added damaged item photo"
                    value={form.attachment}
                    onChange={(event) => updateForm("attachment", event.target.value)}
                  />
                </label>
                <label className="contact-message-field">
                  <span>Message</span>
                  <textarea
                    placeholder="Tell us what happened"
                    value={form.message}
                    onChange={(event) => updateForm("message", event.target.value)}
                  />
                </label>
              </div>
              <div className="contact-submit-row">
                <small>{formMessage}</small>
                <div>
                  <button className="ghost-contact-button" onClick={resetContactForm} type="button">
                    Clear
                  </button>
                  <button type="submit">Submit request</button>
                </div>
              </div>
            </form>

            <aside className="contact-side-panel">
              <section>
                <div className="checkout-card-heading">
                  <span>Quick help</span>
                  <strong>Common topics</strong>
                </div>
                <div className="quick-topic-list">
                  {quickTopics.map((topic) => (
                    <button
                      className={form.issueType === topic ? "active" : ""}
                      key={topic}
                      onClick={() => {
                        updateForm("issueType", topic);
                        setFormMessage(`${topic} selected. Add details and submit the support request.`);
                      }}
                      type="button"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </section>

              <form className="ticket-lookup-card" onSubmit={lookupTicket}>
                <label>
                  <span>Ticket or order number</span>
                  <input value={statusLookup} onChange={(event) => setStatusLookup(event.target.value)} />
                </label>
                <button type="submit">Check status</button>
                <small>{ticketStatus}</small>
              </form>
            </aside>
          </section>

          <section className="branch-contact-grid">
            <div className="module-title">
              <div>
                <span>Branch contacts</span>
                <h2>Local delivery support</h2>
              </div>
              <a href="/orders">Track active order</a>
            </div>
            {branchContacts.length > 0 ? (
              branchContacts.map((branch) => (
                <button
                  aria-pressed={selectedBranch === branch.branch}
                  className={selectedBranch === branch.branch ? "active" : ""}
                  key={branch.branch}
                  onClick={() => chooseBranch(branch)}
                  type="button"
                >
                  <span>{branch.branch}</span>
                  <strong>{branch.area}</strong>
                  <small>{branch.timing}</small>
                  <em>{branch.lead}</em>
                </button>
              ))
            ) : (
              <p className="empty-copy">No active branches are configured in the database yet.</p>
            )}
          </section>

          <section className="contact-support-grid">
            <article>
              <span>Escalation path</span>
              {escalationSteps.map((step) => (
                <p key={step.label}>
                  <strong>{step.label}</strong>
                  {step.value}
                </p>
              ))}
            </article>
            <article className="contact-map-card">
              <span>Service area</span>
              <strong>Live pincode check</strong>
              <p>Coverage is read from branch service areas configured in the admin panel.</p>
              <form className="contact-service-form" onSubmit={checkServiceArea}>
                <label>
                  <span>Pincode</span>
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    value={serviceArea}
                    onChange={(event) => setServiceArea(event.target.value)}
                  />
                </label>
                <button type="submit">Check area</button>
                <small>{serviceAreaMessage}</small>
              </form>
              <div>
                {branchContacts.map((branch) => (
                  <button
                    className={selectedBranch === branch.branch ? "active" : ""}
                    key={branch.branch}
                    onClick={() => chooseBranch(branch)}
                    type="button"
                  >
                    {branch.branch.replace(" Hub", "")}
                  </button>
                ))}
              </div>
            </article>
          </section>
        </section>
      </section>
    </main>
  );
}
