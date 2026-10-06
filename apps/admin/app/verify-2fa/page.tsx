"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, setAdminAuthToken } from "../../modules/admin-api";

type VerifyResponse = {
  token: string;
};

export default function VerifyTwoFactorPage() {
  const router = useRouter();
  const [challengeToken, setChallengeToken] = useState("");
  const [devCode, setDevCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem("freshcart-admin:2fa-challenge") || "";
    setChallengeToken(token);
    setDevCode(window.localStorage.getItem("freshcart-admin:2fa-dev-code") || "");
    if (!token) {
      setError("Login first so a two-factor challenge can be created.");
    }
  }, []);

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await authApi<VerifyResponse>("admin/verify-2fa", {
        challengeToken,
        code: String(formData.get("code") || "")
      });
      setAdminAuthToken(response.token);
      window.localStorage.removeItem("freshcart-admin:2fa-challenge");
      window.localStorage.removeItem("freshcart-admin:2fa-dev-code");
      router.push("/dashboard");
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Verification failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-shell two-factor-shell">
        <div className="admin-login-copy">
          <a className="admin-login-brand" href="/login">
            <span>FC</span>
            <div>
              <strong>FreshCart</strong>
              <small>Two-factor verification</small>
            </div>
          </a>
          <div>
            <span className="admin-login-eyebrow">Owner-grade security</span>
            <h1>Confirm the sign-in before opening store operations.</h1>
            <p>
              Verification protects owner and staff sessions with OTP checks, trusted-device review,
              session logging, and suspicious-login alerts.
            </p>
          </div>
          <div className="admin-security-grid">
            <article><strong>OTP</strong><small>6 digit verification</small></article>
            <article><strong>Device</strong><small>trust can be remembered</small></article>
            <article><strong>Audit</strong><small>security event recorded</small></article>
          </div>
        </div>

        <form className="admin-login-card" onSubmit={verify}>
          <div className="admin-login-card-head">
            <span>Verify 2FA</span>
            <h2>Enter security code</h2>
            <p>Use the code sent to the owner authenticator or registered admin phone.</p>
          </div>
          <label>
            <span>Verification code</span>
            <input autoComplete="one-time-code" defaultValue={devCode || "123456"} inputMode="numeric" name="code" placeholder="000000" required />
          </label>
          <label>
            <span>Device name</span>
            <input name="device" placeholder="Jerins MacBook" />
          </label>
          {error ? <p className="admin-login-error">{error}</p> : null}
          <div className="admin-login-options">
            <label>
              <input defaultChecked name="trustedDevice" type="checkbox" />
              <span>Trust this device</span>
            </label>
            <a href="/login">Back to login</a>
          </div>
          <button disabled={submitting || !challengeToken} type="submit">{submitting ? "Verifying..." : "Verify and continue"}</button>
          <button className="admin-google-login" type="button" onClick={() => router.push("/login")}>
            <span aria-hidden="true">R</span>
            Restart login
          </button>
        </form>
      </section>
    </main>
  );
}
