import { useAuthStore } from "@/stores/auth.store";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  elevated = false
): Promise<T> {
  const { token, elevatedToken } = useAuthStore.getState();
  const authToken = elevated && elevatedToken ? elevatedToken : token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      const newToken = useAuthStore.getState().token;
      if (newToken) headers["Authorization"] = `Bearer ${newToken}`;
      const retryRes = await fetch(`${BASE_URL}${path}`, { ...options, headers });
      if (!retryRes.ok) throw new ApiError(retryRes.status, await retryRes.text());
      if (retryRes.status === 204) return undefined as T;
      return retryRes.json() as Promise<T>;
    }
    useAuthStore.getState().clearAuth();
    throw new ApiError(401, "Sitzung abgelaufen. Bitte erneut anmelden.");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "Unbekannter Fehler");
    throw new ApiError(res.status, text);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function tryRefresh(): Promise<boolean> {
  const { refreshToken, setAuth, activeProfile } = useAuthStore.getState();
  if (!refreshToken || !activeProfile) return false;
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data: { token: string; refreshToken: string } = await res.json();
    setAuth(data.token, data.refreshToken, activeProfile);
    return true;
  } catch {
    return false;
  }
}

export const apiClient = {
  get:    <T>(path: string, elevated = false) =>
    request<T>(path, { method: "GET" }, elevated),
  post:   <T>(path: string, body: unknown, elevated = false) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }, elevated),
  put:    <T>(path: string, body: unknown, elevated = false) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }, elevated),
  delete: <T>(path: string, elevated = false) =>
    request<T>(path, { method: "DELETE" }, elevated),
};
