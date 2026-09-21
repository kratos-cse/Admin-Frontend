"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { createAdminUser, listAdminUsers, listRoles, updateAdminUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/context/AuthProvider";

export default function AdminsPage() {
  const { isSuperAdmin } = useAuth();
  const router = useRouter();
  const [admins, setAdmins] = useState<Record<string, unknown>[]>([]);
  const [roles, setRoles] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [a, r] = await Promise.all([listAdminUsers({ skip: 0, limit: 50 }), listRoles()]);
      const ar = a as { items?: unknown[] } | unknown[];
      const list = Array.isArray(ar)
        ? ar
        : Array.isArray((ar as { items?: unknown[] }).items)
          ? (ar as { items: unknown[] }).items
          : [];
      setAdmins(list as Record<string, unknown>[]);
      setRoles((Array.isArray(r) ? r : []) as Record<string, unknown>[]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isSuperAdmin) {
      router.replace("/");
      return;
    }
    void load();
  }, [isSuperAdmin, router]);

  if (!isSuperAdmin) return null;

  return (
    <RequireAdmin>
      <AdminShell>
        <div className="page-title">
          <h1>Admins</h1>
          <p className="muted">Super Admin RBAC — /admin/admin-users and /admin/roles</p>
        </div>
        {loading && <p className="muted">Loading…</p>}
        {error && <p className="state-error">{error}</p>}

        <div className="card" style={{ marginBottom: 16, maxWidth: 560 }}>
          <h3 style={{ marginBottom: 10 }}>Grant admin</h3>
          <div className="field">
            <label htmlFor="user_id">user_id (UUID)</label>
            <input id="user_id" value={userId} onChange={(e) => setUserId(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="role_id">role</label>
            <select id="role_id" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={String(role.role_id || role.id)} value={String(role.role_id || role.id)}>
                  {String(role.name)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!userId || !roleId}
            onClick={() =>
              void createAdminUser({ user_id: userId, role_id: roleId })
                .then(() => {
                  setUserId("");
                  return load();
                })
                .catch((e: Error) => setError(e.message))
            }
          >
            Create admin user
          </button>
        </div>

        <div className="table-wrap" style={{ marginBottom: 16 }}>
          <table className="data">
            <thead>
              <tr>
                <th>Admin ID</th>
                <th>User</th>
                <th>Role</th>
                <th>Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={String(a.id || a.admin_user_id)}>
                  <td>{String(a.id || a.admin_user_id || "—")}</td>
                  <td>{String(a.user_id || a.email || "—")}</td>
                  <td>{String((a.role as { name?: string } | undefined)?.name || a.role_name || "—")}</td>
                  <td>{String(a.is_active)}</td>
                  <td>
                    {a.is_active !== false && (
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => setDeactivateId(String(a.id || a.admin_user_id))}
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {admins.length === 0 && !loading && <p className="muted" style={{ padding: 14 }}>No admin users returned.</p>}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 10 }}>Roles</h3>
          <pre className="muted" style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
            {JSON.stringify(roles, null, 2)}
          </pre>
        </div>

        <ConfirmDialog
          open={Boolean(deactivateId)}
          title="Deactivate admin"
          message={`Set is_active=false for ${deactivateId}?`}
          confirmLabel="Deactivate"
          danger
          busy={busy}
          onCancel={() => setDeactivateId(null)}
          onConfirm={async () => {
            if (!deactivateId) return;
            setBusy(true);
            try {
              await updateAdminUser(deactivateId, { is_active: false });
              setDeactivateId(null);
              await load();
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "Failed");
            } finally {
              setBusy(false);
            }
          }}
        />
      </AdminShell>
    </RequireAdmin>
  );
}
