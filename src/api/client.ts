import type { AnalyticsSummary, Complaint, TokenResponse, User } from "./types";

const base = () => import.meta.env.VITE_API_URL ?? "";

export function getToken(): string | null {
  return sessionStorage.getItem("token");
}

export function setToken(t: string): void {
  sessionStorage.setItem("token", t);
}

export function clearToken(): void {
  sessionStorage.removeItem("token");
}

async function parseError(r: Response): Promise<Error> {
  let msg = "Request failed";
  try {
    const t = await r.text();
    if (t) msg = t.slice(0, 200);
  } catch {
    /* ignore */
  }
  return new Error(msg);
}

export async function apiJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const r = await fetch(`${base()}${path}`, { ...init, headers });
  if (!r.ok) {
    throw await parseError(r);
  }
  if (r.status === 204) {
    return undefined as T;
  }
  return (await r.json()) as T;
}

export async function login(
  email: string,
  password: string,
): Promise<TokenResponse> {
  return apiJson<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(
  email: string,
  password: string,
  full_name: string,
): Promise<TokenResponse> {
  return apiJson<TokenResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, full_name }),
  });
}

export async function fetchMe(): Promise<User> {
  return apiJson<User>("/auth/me");
}

export async function fetchMaintenanceStaff(): Promise<User[]> {
  return apiJson<User[]>("/auth/maintenance-staff");
}

export async function fetchComplaints(
  q: Record<string, string | undefined>,
): Promise<Complaint[]> {
  const params = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  const s = params.toString();
  return apiJson<Complaint[]>(`/complaints${s ? `?${s}` : ""}`);
}

export async function createComplaint(body: {
  category: string;
  priority: string;
  description: string;
}): Promise<Complaint> {
  return apiJson<Complaint>("/complaints", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function patchComplaint(
  publicId: string,
  body: Record<string, unknown>,
): Promise<Complaint> {
  return apiJson<Complaint>(`/complaints/${encodeURIComponent(publicId)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function fetchAnalytics(): Promise<AnalyticsSummary> {
  return apiJson<AnalyticsSummary>("/analytics/summary");
}

export async function uploadAttachment(
  publicId: string,
  file: File,
): Promise<Complaint> {
  const token = getToken();
  const fd = new FormData();
  fd.append("file", file);
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const r = await fetch(
    `${base()}/complaints/${encodeURIComponent(publicId)}/attachments`,
    { method: "POST", body: fd, headers },
  );
  if (!r.ok) {
    throw await parseError(r);
  }
  return (await r.json()) as Complaint;
}
