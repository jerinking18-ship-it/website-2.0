const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const adminTokenKey = "freshcart-admin:auth-token";

type ApiEnvelope<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export function getAdminAuthToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(adminTokenKey) || "";
}

export function setAdminAuthToken(token: string) {
  window.localStorage.setItem(adminTokenKey, token);
}

export function clearAdminAuthToken() {
  window.localStorage.removeItem(adminTokenKey);
}

export async function adminApi<T>(path: string, init: RequestInit = {}) {
  const token = getAdminAuthToken();
  const response = await fetch(`${apiBase}/admin/${path.replace(/^\//, "")}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers
    },
    cache: "no-store"
  });

  const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<T> & { error?: { message?: string } };
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      clearAdminAuthToken();
      window.location.href = "/login";
    }
    throw new Error(payload.error?.message || "Admin API request failed.");
  }

  return payload.data;
}

export async function authApi<T>(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${apiBase}/auth/${path.replace(/^\//, "")}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<T> & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(payload.error?.message || "Authentication request failed.");
  }

  return payload.data;
}
