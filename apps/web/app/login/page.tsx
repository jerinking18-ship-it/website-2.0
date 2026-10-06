"use client";

import { type FormEvent, useEffect, useState } from "react";

export default function CustomerLoginPage() {
  const [method, setMethod] = useState<"Mobile OTP" | "Email">("Mobile OTP");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [rememberDevice, setRememberDevice] = useState(true);
  const [status, setStatus] = useState("Enter your mobile number and request an OTP.");
  const [nextPath, setNextPath] = useState("/");
  const [otpRequested, setOtpRequested] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const inputLabel = method === "Mobile OTP" ? "Mobile number" : "Email address";
  const inputPlaceholder = method === "Mobile OTP" ? "Enter mobile number" : "customer@example.com";
  const isOtpValid = /^\d{6}$/.test(otp.trim());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    if (next?.startsWith("/")) setNextPath(next);
  }, []);

  function completeLogin(data: { token?: string; expiresAt?: string; customer?: unknown }) {
    if (data.token) window.localStorage.setItem("freshcart-auth-token", data.token);
    window.localStorage.setItem("freshcart-auth-status", "signed-in");
    window.localStorage.setItem(
      "freshcart-auth-customer",
      JSON.stringify({ identifier, method, rememberDevice, signedInAt: new Date().toISOString(), expiresAt: data.expiresAt, customer: data.customer })
    );
    window.location.href = nextPath;
  }

  async function requestOtp() {
    if (!identifier.trim()) {
      setStatus(`Enter a valid ${inputLabel.toLowerCase()} before requesting OTP.`);
      return;
    }
    if (method === "Email") {
      setStatus("Email OTP is not connected yet. Use mobile OTP until the email provider is configured.");
      return;
    }
    setSubmitting(true);
    setStatus("Requesting OTP...");
    try {
      const response = await fetch("/api/auth/customer/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: identifier, purpose: "LOGIN" })
      });
      const data = await response.json();
      if (!response.ok) throw new Error("OTP request failed.");
      setOtpRequested(true);
      setStatus(data.devCode ? `OTP sent. Development code: ${data.devCode}` : "OTP sent by SMS/WhatsApp.");
    } catch {
      setStatus("Could not request OTP. Check the mobile number and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!identifier.trim()) {
      setStatus(`Enter a valid ${inputLabel.toLowerCase()} before continuing.`);
      return;
    }
    if (!otpRequested) {
      await requestOtp();
      return;
    }
    if (!isOtpValid) {
      setStatus("Enter the 6-digit OTP sent by the backend.");
      return;
    }
    setSubmitting(true);
    setStatus("Verifying OTP...");
    try {
      const response = await fetch("/api/auth/customer/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: identifier, code: otp })
      });
      const data = await response.json();
      if (!response.ok || !data.token) throw new Error("OTP verification failed.");
      completeLogin(data);
    } catch {
      setStatus("OTP verification failed. Request a new OTP or check the code.");
    } finally {
      setSubmitting(false);
    }
  }

  function continueWithGoogle() {
    setStatus("Google login needs a real OAuth provider before it can be enabled.");
  }

  return (
    <main className="customer-login-page">
      <a className="login-brand" href="/">
        <span>FC</span>
        <div>
          <strong>FreshCart</strong>
          <small>Same-day grocery market</small>
        </div>
      </a>

      <section className="customer-login-shell">
        <div className="customer-login-copy">
          <span>Fresh groceries in minutes</span>
          <h1>Sign in for faster checkout, live tracking, and saved grocery lists.</h1>
          <p>
            Continue with your mobile number or email to manage orders, addresses, wishlist, delivery slots,
            refunds, and support conversations.
          </p>
          <div className="login-benefit-grid">
            <article>
              <strong>15 min</strong>
              <small>average dispatch window</small>
            </article>
            <article>
              <strong>Live</strong>
              <small>rider tracking after pickup</small>
            </article>
            <article>
              <strong>Fresh</strong>
              <small>batch-aware grocery catalog</small>
            </article>
          </div>
        </div>

        <form className="login-card customer-login-card" onSubmit={submitLogin}>
          <div className="login-card-head">
            <span>Customer login</span>
            <h2>Welcome back</h2>
            <p>Use mobile OTP to create a real customer session. Google requires a connected OAuth provider.</p>
          </div>

          <div className="login-tab-row" aria-label="Login method">
            {(["Mobile OTP", "Email"] as const).map((tab) => (
              <button
                className={method === tab ? "active" : ""}
                key={tab}
                onClick={() => {
                  setMethod(tab);
                  setIdentifier("");
                  setOtp("");
                  setOtpRequested(false);
                  setStatus(tab === "Mobile OTP" ? "Enter your mobile number and request an OTP." : "Email OTP is not connected yet.");
                }}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>

          <button className="google-login-button" onClick={continueWithGoogle} type="button" aria-label="Continue with Google">
            <span aria-hidden="true">G</span>
            Continue with Google
          </button>

          <div className="login-divider"><span>or use OTP</span></div>

          <label>
            <span>{inputLabel}</span>
            <input
              autoComplete="username"
              name="identifier"
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder={inputPlaceholder}
              required
              type={method === "Email" ? "email" : "tel"}
              value={identifier}
            />
          </label>

          <label>
            <span>One-time password</span>
            <input
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              name="otp"
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              required
              value={otp}
            />
          </label>

          <div className="login-inline-row">
            <label className="login-check">
              <input checked={rememberDevice} name="remember" onChange={(event) => setRememberDevice(event.target.checked)} type="checkbox" />
              <span>Remember this device</span>
            </label>
            <button className="quiet-login-action" disabled={submitting || method === "Email"} onClick={requestOtp} type="button">
              {otpRequested ? "Resend OTP" : "Request OTP"}
            </button>
          </div>

          <p className="login-status" aria-live="polite">{status}</p>
          <button className="login-submit" disabled={submitting} type="submit">
            {otpRequested ? "Verify and continue" : "Send OTP"}
          </button>

          <div className="login-card-foot">
            <span>New to FreshCart?</span>
            <a href="/products">Browse products first</a>
          </div>
        </form>
      </section>
    </main>
  );
}
