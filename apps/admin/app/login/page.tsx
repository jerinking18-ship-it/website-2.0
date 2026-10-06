"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, setAdminAuthToken } from "../../modules/admin-api";

type AdminLoginResponse = {
  requiresTwoFactor: boolean;
  challengeToken?: string;
  token?: string;
  devCode?: string;
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await authApi<AdminLoginResponse>("admin/login", {
        email: String(formData.get("email") || ""),
        password: String(formData.get("password") || "")
      });

      if (response.requiresTwoFactor && response.challengeToken) {
        window.localStorage.setItem("freshcart-admin:2fa-challenge", response.challengeToken);
        window.localStorage.setItem("freshcart-admin:2fa-dev-code", response.devCode || "");
        router.push("/verify-2fa");
        return;
      }

      if (response.token) {
        setAdminAuthToken(response.token);
        router.push("/dashboard");
      }
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-shell">
        <div className="admin-login-copy">
          <a className="admin-login-brand" href="/dashboard">
            <span>FC</span>
            <div>
              <strong>FreshCart</strong>
              <small>Operations console</small>
            </div>
          </a>
          <div>
            <span className="admin-login-eyebrow">Secure staff access</span>
            <h1>Run orders, inventory, delivery, support, and store controls from one protected console.</h1>
            <p>
              Staff access is designed around roles, owner approval, trusted devices, audit logs, and
              two-factor verification before the operations console opens.
            </p>
          </div>
          <div className="admin-security-grid">
            <article>
              <strong>2FA</strong>
              <small>owner-grade protection</small>
            </article>
            <article>
              <strong>RBAC</strong>
              <small>role based permissions</small>
            </article>
            <article>
              <strong>Audit</strong>
              <small>every admin action tracked</small>
            </article>
          </div>
        </div>

        <form className="admin-login-card" onSubmit={login}>
          <div className="admin-login-card-head">
            <span>Admin login</span>
            <h2>Sign in to console</h2>
            <p>Use your approved staff account. The next step verifies the sign-in before console access.</p>
          </div>

          <button className="admin-google-login" type="button" onClick={() => setError("Google Workspace login will connect after OAuth credentials are added.")}>
            <span aria-hidden="true">G</span>
            Continue with Google Workspace
          </button>

          <div className="admin-login-divider"><span>or use staff credentials</span></div>

          <label>
            <span>Access role</span>
            <select defaultValue="owner" name="role">
              <option value="owner">Owner</option>
              <option value="manager">Store manager</option>
              <option value="support">Support agent</option>
              <option value="delivery">Delivery coordinator</option>
            </select>
          </label>

          <label>
            <span>Email</span>
            <input autoComplete="username" defaultValue="owner@freshcart.local" name="email" placeholder="owner@freshcart.com" required type="email" />
          </label>

          <label>
            <span>Password</span>
            <input autoComplete="current-password" defaultValue="Freshcart@12345" name="password" placeholder="Enter password" required type="password" />
          </label>

          {error ? <p className="admin-login-error">{error}</p> : null}

          <div className="admin-login-options">
            <label>
              <input defaultChecked name="trustedDevice" type="checkbox" />
              <span>Trust this device for 7 days</span>
            </label>
            <a href="/support">Need help?</a>
          </div>

          <button disabled={submitting} type="submit">{submitting ? "Checking..." : "Continue to 2FA"}</button>
          <a className="admin-login-secondary" href={process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3002"}>Open customer website</a>
        </form>
      </section>
    </main>
  );
}
