import { apiFetch, apiFetchData, setStoredToken } from "./client";
import type { ApiSuccess } from "@/types/api";

export type TokenResponse = {
  access_token: string;
  expires_in: number;
  token_type?: string;
  user?: { id: string; email: string };
  profile?: { full_name?: string };
};

export type AdminMeData = {
  admin_user_id: string;
  user_id: string;
  is_active: boolean;
  role: { id: string; name: string } | null;
  permissions: string[];
};

export async function loginWithGoogle(idToken: string): Promise<TokenResponse> {
  const data = await apiFetch<TokenResponse>("/auth/google", {
    method: "POST",
    body: { id_token: idToken },
  });
  if (data?.access_token) setStoredToken(data.access_token);
  return data;
}

export async function fetchAdminMe(token?: string | null): Promise<AdminMeData> {
  return apiFetchData<AdminMeData>("/admin/me", { auth: true, token });
}

export async function logout(): Promise<void> {
  try {
    await apiFetch("/auth/logout", { method: "POST", auth: true });
  } finally {
    setStoredToken(null);
  }
}

export async function listRoles() {
  return apiFetchData<unknown[]>("/admin/roles", { auth: true });
}

export async function createRole(body: { name: string; description?: string; permissions: string[] }) {
  return apiFetchData("/admin/roles", { method: "POST", body, auth: true });
}

export async function updateRole(
  roleId: string,
  body: { name?: string; description?: string; permissions?: string[] }
) {
  return apiFetchData(`/admin/roles/${roleId}`, { method: "PATCH", body, auth: true });
}

export async function listAdminUsers(params?: { skip?: number; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.skip != null) q.set("skip", String(params.skip));
  if (params?.limit != null) q.set("limit", String(params.limit));
  const qs = q.toString();
  return apiFetchData(`/admin/admin-users${qs ? `?${qs}` : ""}`, { auth: true });
}

export async function createAdminUser(body: { user_id: string; role_id: string }) {
  return apiFetchData("/admin/admin-users", { method: "POST", body, auth: true });
}

export async function updateAdminUser(
  adminUserId: string,
  body: { role_id?: string; is_active?: boolean }
) {
  return apiFetchData(`/admin/admin-users/${adminUserId}`, { method: "PATCH", body, auth: true });
}

// silence unused import if ApiSuccess unused
export type { ApiSuccess };
