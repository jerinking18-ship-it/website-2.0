"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";

type Props = {
  orderNumber: string;
};

type ConfirmedOrder = {
  id: string;
  customer: string;
  status: string;
  payment: string;
  slot: string;
  total: number;
  canCancel?: boolean;
  itemDetails?: Array<{
    productId?: string | null;
    name: string;
    unit: string;
    quantity: number;
    price: number;
  }>;
};

type TrackingResponse = {
  order?: ConfirmedOrder;
  tracking?: {
    branch?: { name: string } | null;
    rider?: { name: string; phone?: string } | null;
    timeline?: Array<{ status: string; note?: string | null; at: string }>;
  };
};

function customerFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = typeof window !== "undefined" ? window.localStorage.getItem("freshcart-auth-token") : "";
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
}

export function OrderConfirmationPage({ orderNumber }: Props) {
  const [deliveryInstruction, setDeliveryInstruction] = useState("Call before arriving. Leave at security if unavailable.");
  const [instructionDraft, setInstructionDraft] = useState(deliveryInstruction);
  const [orderStatus, setOrderStatus] = useState("Preparing order");
  const [supportMessage, setSupportMessage] = useState("Order confirmed. Branch team has started preparing your groceries.");
  const [invoiceSent, setInvoiceSent] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [order, setOrder] = useState<ConfirmedOrder | null>(null);
  const [tracking, setTracking] = useState<TrackingResponse["tracking"] | null>(null);
  const orderItems = order?.itemDetails ?? [];
  const receiptRows = useMemo(
    () => [
      ["Subtotal", `Rs. ${order?.total ?? 0}`],
      ["Coupon discount", "Synced on order"],
      ["Delivery fee", "Included"],
      [order?.payment ?? "Amount payable", `Rs. ${order?.total ?? 0}`]
    ],
    [order]
  );
  const timeline =
    tracking?.timeline && tracking.timeline.length > 0
      ? tracking.timeline.map((event, index) => ({
          label: event.status,
          detail: event.note ?? event.at,
          active: index <= tracking.timeline!.length - 1
        }))
      : [
          { label: order?.status ?? "Order placed", detail: supportMessage, active: true },
          { label: "Rider assigned", detail: "Starts after packing", active: false },
          { label: "Delivered", detail: "ETA appears when rider is assigned", active: false }
        ];

  useEffect(() => {
    let active = true;
    customerFetch(`/api/customer/orders/${orderNumber}/tracking`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: TrackingResponse | null) => {
        if (!active || !data?.order) return;
        setOrder(data.order);
        setTracking(data.tracking);
        setOrderStatus(data.order.status);
        setSupportMessage("Order loaded from the database. Branch, items, payment, and status are synced.");
      })
      .catch(() => setSupportMessage("Could not load this order from the API."));
    return () => {
      active = false;
    };
  }, [orderNumber]);

  function updateInstructions(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextInstruction = instructionDraft.trim();
    if (!nextInstruction) {
      setSupportMessage("Add delivery instructions before saving.");
      return;
    }
    setDeliveryInstruction(nextInstruction);
    window.localStorage.setItem(`freshcart-${orderNumber}-delivery-instruction`, nextInstruction);
    setSupportMessage("Delivery instructions updated before dispatch.");
  }

  async function downloadInvoice() {
    try {
      const data = (await customerFetch(`/api/customer/orders/${orderNumber}/invoice`, { cache: "no-store" }).then((response) =>
        response.json()
      )) as { text?: string; invoice?: { invoiceNumber?: string } };
      if (!data.text) throw new Error("Invoice missing");
      const blob = new Blob([data.text], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${data.invoice?.invoiceNumber ?? orderNumber}-invoice.txt`;
      link.click();
      window.URL.revokeObjectURL(url);
      window.localStorage.setItem(`freshcart-${orderNumber}-invoice-downloaded`, "true");
      setSupportMessage("Invoice downloaded from the database.");
    } catch {
      setSupportMessage("Could not download this invoice from the API.");
    }
  }

  function emailInvoice() {
    setInvoiceSent(true);
    setSupportMessage(`Invoice email queued for ${order?.customer ?? "this customer"}.`);
  }

  function shareReceipt() {
    const siteUrl = (process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3002").replace(/\/$/, "");
    const message = encodeURIComponent(`FreshCart order ${orderNumber} confirmed. Amount payable Rs. ${order?.total ?? 0}. Track: ${siteUrl}/orders/${orderNumber}`);
    const opened = window.open(`https://wa.me/?text=${message}`, "_blank", "noopener,noreferrer");
    window.localStorage.setItem(`freshcart-${orderNumber}-whatsapp-shared`, "true");
    setSupportMessage(opened ? "WhatsApp receipt opened." : "WhatsApp popup was blocked. Receipt share was prepared.");
  }

  async function cancelOrder() {
    if (cancelled) return;
    if (order?.canCancel === false) {
      setSupportMessage("This order can no longer be cancelled.");
      return;
    }
    try {
      const data = (await customerFetch(`/api/customer/orders/${orderNumber}/cancel`, { method: "PATCH" }).then((response) =>
        response.json()
      )) as { order?: ConfirmedOrder };
      if (data.order) setOrder(data.order);
      setCancelled(true);
      setOrderStatus(data.order?.status ?? "Cancellation requested");
      setSupportMessage("Cancellation saved to the database.");
    } catch {
      setSupportMessage("Could not cancel this order from the API.");
    }
  }

  async function createSupportTicket() {
    await customerFetch("/api/customer/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `Need help with confirmed order ${orderNumber}` })
    }).catch(() => undefined);
    setSupportMessage(`Support ticket saved for ${orderNumber}. The team will reply in the support inbox.`);
  }

  function reorderItems() {
    const reorderCart = orderItems.reduce<Record<string, number>>((cart, item) => {
      if (item.productId) cart[item.productId] = item.quantity;
      return cart;
    }, {});
    window.localStorage.setItem("freshcart-reorder-source", orderNumber);
    window.localStorage.setItem("freshcart-reorder-cart", JSON.stringify(reorderCart));
    setSupportMessage("Reorder basket prepared. Opening products with these items in cart.");
    window.location.href = "/products";
  }

  return (
    <main className="order-confirmed-page">
      <header className="order-confirmed-header">
        <a className="brand" href="/">
          <span className="brand-mark">FC</span>
          <div>
            <strong>FreshCart Market</strong>
            <small>Grocery delivery</small>
          </div>
        </a>
        <nav aria-label="Order confirmed actions">
          <a href="/products">Continue shopping</a>
          <a href={`/orders/${orderNumber}`}>Track order</a>
        </nav>
      </header>

      <section className="order-confirmed-hero">
        <div className="order-confirmed-copy">
          <span>Order confirmed</span>
          <h1>{orderNumber} is {orderStatus.toLowerCase()}.</h1>
          <p>
            Your grocery order is locked, inventory is reserved, and Bandra West branch is preparing the bags for
            same-day delivery.
          </p>
          <div className="order-status-strip">
            <b>{orderStatus}</b>
            <small>ETA 24-32 min after dispatch</small>
          </div>
          <div className="order-confirmed-actions">
            <a className="primary-link" href={`/orders/${orderNumber}`}>Track live order</a>
            <button onClick={reorderItems} type="button">Reorder items</button>
            <button disabled={cancelled} onClick={cancelOrder} type="button">
              {cancelled ? "Cancel requested" : "Cancel order"}
            </button>
          </div>
        </div>
        <aside className="order-confirmed-card" aria-label="Order receipt summary">
          <span>Amount payable</span>
          <strong>Rs. {order?.total ?? 0}</strong>
          <small>{order?.payment ?? "Payment pending"}</small>
          <div>
            <p><b>Slot</b> {order?.slot ?? "Slot not selected"}</p>
            <p><b>Branch</b> {tracking?.branch?.name ?? "Assigning branch"}</p>
            <p><b>Payment</b> {order?.payment ?? "Pending"}</p>
          </div>
        </aside>
      </section>

      <section className="order-confirmed-grid">
        <article className="confirmed-panel delivery-panel">
          <div className="confirmed-panel-head">
            <span>Delivery status</span>
            <strong>Preparing your order</strong>
          </div>
          <div className="confirmed-timeline">
            {timeline.map((step) => (
              <div className={step.active ? "active" : ""} key={step.label}>
                <i aria-hidden="true" />
                <span>
                  <b>{step.label}</b>
                  <small>{step.detail}</small>
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="confirmed-panel receipt-panel">
          <div className="confirmed-panel-head">
            <span>Receipt</span>
            <strong>Payment summary</strong>
          </div>
          <div className="confirmed-receipt-list">
            {receiptRows.map(([label, value]) => (
              <p key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </p>
            ))}
          </div>
          <div className="invoice-actions">
            <button onClick={downloadInvoice} type="button">Download invoice</button>
            <button onClick={emailInvoice} type="button">{invoiceSent ? "Invoice emailed" : "Email invoice"}</button>
            <button onClick={shareReceipt} type="button">WhatsApp receipt</button>
          </div>
        </article>

        <article className="confirmed-panel">
          <div className="confirmed-panel-head">
            <span>Items</span>
            <strong>{orderItems.length} grocery items</strong>
          </div>
          <div className="confirmed-items">
            {orderItems.map((item) => (
              <p key={item.name}>
                <span>
                  <b>{item.name}</b>
                  <small>{item.quantity} x {item.unit}</small>
                </span>
                <strong>Rs. {item.price}</strong>
              </p>
            ))}
          </div>
        </article>

        <article className="confirmed-panel address-panel">
          <div className="confirmed-panel-head">
            <span>Delivery address</span>
            <strong>{order?.customer ?? "FreshCart customer"}</strong>
          </div>
          <p>Flat 1204, Palm Grove Apartments, Linking Road, Bandra West, Mumbai 400050</p>
          <small>{order?.slot ?? "Delivery slot will appear from the order record"}</small>
          <form className="instruction-form" onSubmit={updateInstructions}>
            <label>
              <span>Instructions before dispatch</span>
              <input
                onChange={(event) => setInstructionDraft(event.target.value)}
                value={instructionDraft}
              />
            </label>
            <button type="submit">Save instruction</button>
          </form>
          <em>{deliveryInstruction}</em>
        </article>

        <article className="confirmed-panel partner-panel">
          <div className="confirmed-panel-head">
            <span>Delivery partner</span>
            <strong>{tracking?.rider?.name ?? "Assigning after packing"}</strong>
          </div>
          <p>{tracking?.rider?.phone ?? "Rider details, phone masking, and live location will appear once the order is out for delivery."}</p>
          <a href={`/orders/${orderNumber}`}>Open live tracking</a>
        </article>

        <article className="confirmed-panel support-panel">
          <div className="confirmed-panel-head">
            <span>Need help?</span>
            <strong>Support is ready</strong>
          </div>
          <p>{supportMessage}</p>
          <div className="confirmed-support-actions">
            <button onClick={createSupportTicket} type="button">Create ticket</button>
            <a href="/support">Open support</a>
            <a href="/refund-policy">Refund policy</a>
          </div>
        </article>
      </section>

      <section className="confirmed-trust-row" aria-label="Order trust details">
        <span>Freshness guarantee</span>
        <span>Cold-chain packed items</span>
        <span>Refund support available</span>
        <span>Nearest branch fulfillment</span>
      </section>
    </main>
  );
}
