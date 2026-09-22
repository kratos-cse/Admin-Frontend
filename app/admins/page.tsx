"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  createAdminUser,
  createRole,
  listAdminUsers,
  listRoles,
  updateAdminUser,
  updateRole,
} from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/context/AuthProvider";
import { PERMISSION_CATALOG, shortId } from "@/lib/permissions";
import styles from "./admins.module.css";

type RoleRow = {
  role_id: string;
  name: string;
  description?: string | null;
  permissions: string[];
};

type AdminRow = {
  admin_user_id: string;
  user_id: string;
  is_active: boolean;
  role: { id: string; name: string } | null;
};

function normalizeRoles(raw: unknown): RoleRow[] {
  const list = Array.isArray(raw) ? raw : [];
  return list.map((r) => {
    const o = r as Record<string, unknown>;
    return {
      role_id: String(o.role_id || o.id || ""),
      name: String(o.name || ""),
      description: (o.description as string | null | undefined) ?? null,
      permissions: Array.isArray(o.permissions) ? (o.permissions as string[]) : [],
    };
  });
}

function normalizeAdmins(raw: unknown): AdminRow[] {
  const ar = raw as { items?: unknown[] } | unknown[];
  const list = Array.isArray(ar)
    ? ar
    : Array.isArray((ar as { items?: unknown[] }).items)
      ? (ar as { items: unknown[] }).items
      : [];
  return list.map((a) => {
    const o = a as Record<string, unknown>;
    const role = o.role as { id?: string; name?: string } | null | undefined;
    return {
      admin_user_id: String(o.admin_user_id || o.id || ""),
      user_id: String(o.user_id || ""),
      is_active: o.is_active !== false,
      role: role?.id ? { id: String(role.id), name: String(role.name || "") } : null,
    };
  });
}

const PERM_GROUPS = Array.from(new Set(PERMISSION_CATALOG.map((p) => p.group)));

export default function AdminsPage() {
  const { isSuperAdmin } = useAuth();
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [userId, setUserId] = useState("");
  const [grantRoleId, setGrantRoleId] = useState("");
  const [grantBusy, setGrantBusy] = useState(false);

  const [roleEdits, setRoleEdits] = useState<Record<string, string>>({});
  const [savingAdminId, setSavingAdminId] = useState<string | null>(null);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newPerms, setNewPerms] = useState<string[]>([]);
  const [creatingRole, setCreatingRole] = useState(false);

  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editPerms, setEditPerms] = useState<string[]>([]);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [savingRole, setSavingRole] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, r] = await Promise.all([listAdminUsers({ skip: 0, limit: 100 }), listRoles()]);
      const nextAdmins = normalizeAdmins(a);
      const nextRoles = normalizeRoles(r);
      setAdmins(nextAdmins);
      setRoles(nextRoles);
      setRoleEdits(
        Object.fromEntries(nextAdmins.map((admin) => [admin.admin_user_id, admin.role?.id || ""]))
      );
      setGrantRoleId((prev) => prev || nextRoles[0]?.role_id || "");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) {
      router.replace("/");
      return;
    }
    void load();
  }, [isSuperAdmin, router, load]);

  const assignableRoles = useMemo(() => roles, [roles]);

  function flash(msg: string) {
    setSuccess(msg);
    window.setTimeout(() => setSuccess(null), 2800);
  }

  function togglePerm(list: string[], key: string, setter: (v: string[]) => void) {
    setter(list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);
  }

  if (!isSuperAdmin) return null;

  return (
    <RequireAdmin>
      <AdminShell>
        <PageHeader
          eyebrow="Super Admin"
          title="Admins & roles"
          description="Grant access, assign roles, and define permission sets. Backend RBAC remains authoritative."
        />

        {error && (
          <p className="state-error" role="alert" style={{ marginBottom: 12 }}>
            {error}
          </p>
        )}
        {success && <p className={styles.banner}>{success}</p>}

        <div className={styles.layout}>
          <div className={styles.gridTwo}>
            <section className={`card ${styles.card}`}>
              <div className={styles.cardTitle}>
                <h2>Grant admin access</h2>
                <p>User must already exist (Google sign-in once)</p>
              </div>
              <div className={styles.formRow}>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label htmlFor="user_id">User ID</label>
                  <input
                    id="user_id"
                    placeholder="UUID from users table"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value.trim())}
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label htmlFor="grant_role">Role</label>
                  <select
                    id="grant_role"
                    value={grantRoleId}
                    onChange={(e) => setGrantRoleId(e.target.value)}
                  >
                    {assignableRoles.map((role) => (
                      <option key={role.role_id} value={role.role_id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!userId || !grantRoleId || grantBusy}
                  onClick={() => {
                    setGrantBusy(true);
                    setError(null);
                    void createAdminUser({ user_id: userId, role_id: grantRoleId })
                      .then(() => {
                        setUserId("");
                        flash("Admin access granted");
                        return load();
                      })
                      .catch((e: Error) => setError(e.message))
                      .finally(() => setGrantBusy(false));
                  }}
                >
                  {grantBusy ? "Granting…" : "Grant"}
                </button>
              </div>
            </section>

            <section className={`card ${styles.card}`}>
              <div className={styles.cardTitle}>
                <h2>Create role</h2>
                <p>Pick permissions, then assign to admins</p>
              </div>
              <div className={styles.formStack}>
                <div className="field">
                  <label htmlFor="role_name">Name</label>
                  <input
                    id="role_name"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="e.g. Event Ops"
                  />
                </div>
                <div className="field">
                  <label htmlFor="role_desc">Description</label>
                  <input
                    id="role_desc"
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <PermissionPicker selected={newPerms} onToggle={(key) => togglePerm(newPerms, key, setNewPerms)} />
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!newRoleName.trim() || newPerms.length === 0 || creatingRole}
                  onClick={() => {
                    setCreatingRole(true);
                    setError(null);
                    void createRole({
                      name: newRoleName.trim(),
                      description: newRoleDesc.trim() || undefined,
                      permissions: newPerms,
                    })
                      .then(() => {
                        setNewRoleName("");
                        setNewRoleDesc("");
                        setNewPerms([]);
                        flash("Role created");
                        return load();
                      })
                      .catch((e: Error) => setError(e.message))
                      .finally(() => setCreatingRole(false));
                  }}
                >
                  {creatingRole ? "Creating…" : "Create role"}
                </button>
              </div>
            </section>
          </div>

          <section className={`card ${styles.tableCard}`}>
            <div className={styles.tableHead}>
              <h2>Admin users</h2>
              <span className="muted">{loading ? "Loading…" : `${admins.length} accounts`}</span>
            </div>
            {admins.length === 0 && !loading ? (
              <p className="muted" style={{ padding: 18 }}>
                No admin users yet. Grant access above after the user has signed in once.
              </p>
            ) : (
              admins.map((admin) => {
                const selectedRole = roleEdits[admin.admin_user_id] || admin.role?.id || "";
                const dirty = selectedRole !== (admin.role?.id || "");
                return (
                  <div className={styles.adminRow} key={admin.admin_user_id}>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>User {shortId(admin.user_id, 12)}</div>
                      <div className={styles.mono}>{admin.user_id}</div>
                      <div className={styles.mono} style={{ marginTop: 4 }}>
                        admin {shortId(admin.admin_user_id, 12)}
                      </div>
                    </div>
                    <div>
                      <label className="muted" style={{ display: "block", marginBottom: 6, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        Assign role
                      </label>
                      <select
                        className={styles.roleSelect}
                        value={selectedRole}
                        disabled={!admin.is_active}
                        onChange={(e) =>
                          setRoleEdits((prev) => ({ ...prev, [admin.admin_user_id]: e.target.value }))
                        }
                      >
                        {assignableRoles.map((role) => (
                          <option key={role.role_id} value={role.role_id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <StatusBadge status={admin.is_active ? "active" : "inactive"} />
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={!dirty || !admin.is_active || savingAdminId === admin.admin_user_id}
                        onClick={() => {
                          setSavingAdminId(admin.admin_user_id);
                          setError(null);
                          void updateAdminUser(admin.admin_user_id, { role_id: selectedRole })
                            .then(() => {
                              flash(`Role updated for ${shortId(admin.user_id)}`);
                              return load();
                            })
                            .catch((e: Error) => setError(e.message))
                            .finally(() => setSavingAdminId(null));
                        }}
                      >
                        {savingAdminId === admin.admin_user_id ? "Saving…" : "Save role"}
                      </button>
                      {admin.is_active && (
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => setDeactivateId(admin.admin_user_id)}
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </section>

          <section className={`card ${styles.card}`}>
            <div className={styles.cardTitle}>
              <h2>Roles</h2>
              <p>Edit permissions on an existing role</p>
            </div>
            <div className={styles.roleGrid}>
              {roles.map((role) => {
                const isEditing = editingRoleId === role.role_id;
                const locked = role.name.toUpperCase() === "SUPER ADMIN";
                return (
                  <div className={styles.roleCard} key={role.role_id}>
                    <div className={styles.roleCardHead}>
                      <div>
                        <h3 className={styles.roleName}>{role.name}</h3>
                        <p className={styles.roleDesc}>{role.description || "No description"}</p>
                      </div>
                      {!locked && (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: "6px 10px" }}
                          onClick={() => {
                            if (isEditing) {
                              setEditingRoleId(null);
                              return;
                            }
                            setEditingRoleId(role.role_id);
                            setEditName(role.name);
                            setEditDesc(role.description || "");
                            setEditPerms([...role.permissions]);
                          }}
                        >
                          {isEditing ? "Close" : "Edit"}
                        </button>
                      )}
                    </div>

                    {!isEditing && (
                      <div className={styles.permChips}>
                        {role.permissions.length === 0 ? (
                          <span className="muted">No permissions listed</span>
                        ) : (
                          role.permissions.map((p) => (
                            <span className={styles.chip} key={p}>
                              {p}
                            </span>
                          ))
                        )}
                      </div>
                    )}

                    {isEditing && (
                      <>
                        <div className="field">
                          <label htmlFor={`edit-name-${role.role_id}`}>Name</label>
                          <input
                            id={`edit-name-${role.role_id}`}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        </div>
                        <div className="field">
                          <label htmlFor={`edit-desc-${role.role_id}`}>Description</label>
                          <input
                            id={`edit-desc-${role.role_id}`}
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                          />
                        </div>
                        <PermissionPicker
                          selected={editPerms}
                          onToggle={(key) => togglePerm(editPerms, key, setEditPerms)}
                        />
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={savingRole || !editName.trim() || editPerms.length === 0}
                          onClick={() => {
                            setSavingRole(true);
                            setError(null);
                            void updateRole(role.role_id, {
                              name: editName.trim(),
                              description: editDesc.trim() || undefined,
                              permissions: editPerms,
                            })
                              .then(() => {
                                setEditingRoleId(null);
                                flash("Role updated");
                                return load();
                              })
                              .catch((e: Error) => setError(e.message))
                              .finally(() => setSavingRole(false));
                          }}
                        >
                          {savingRole ? "Saving…" : "Save role"}
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
              {roles.length === 0 && !loading && <p className="muted">No roles returned from the API.</p>}
            </div>
          </section>
        </div>

        <ConfirmDialog
          open={Boolean(deactivateId)}
          title="Deactivate admin"
          message={`This removes active admin access for ${shortId(deactivateId)}. They can be reactivated later via PATCH.`}
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
              flash("Admin deactivated");
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

function PermissionPicker({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (key: string) => void;
}) {
  return (
    <div className={styles.permGroups}>
      {PERM_GROUPS.map((group) => (
        <div className={styles.group} key={group}>
          <h4>{group}</h4>
          <div className={styles.checkGrid}>
            {PERMISSION_CATALOG.filter((p) => p.group === group).map((p) => (
              <label className={styles.check} key={p.key}>
                <input
                  type="checkbox"
                  checked={selected.includes(p.key)}
                  onChange={() => onToggle(p.key)}
                />
                {p.label}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
