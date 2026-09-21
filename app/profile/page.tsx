"use client";

import { useRouter } from "next/navigation";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import { useAuth } from "@/context/AuthProvider";

export default function ProfilePage() {
  const { admin, userEmail, permissions, isSuperAdmin, signOut } = useAuth();
  const router = useRouter();

  return (
    <RequireAdmin>
      <AdminShell>
        <div className="page-title">
          <h1>Profile</h1>
          <p className="muted">Admin identity from GET /admin/me</p>
        </div>
        <div className="card" style={{ maxWidth: 520 }}>
          <p>
            <strong>Email</strong>
            <br />
            <span className="muted">{userEmail || "—"}</span>
          </p>
          <p style={{ marginTop: 12 }}>
            <strong>Role</strong>
            <br />
            <span className="muted">
              {admin?.role?.name || "—"}
              {isSuperAdmin ? " (Super Admin)" : ""}
            </span>
          </p>
          <p style={{ marginTop: 12 }}>
            <strong>Admin user id</strong>
            <br />
            <span className="muted">{admin?.admin_user_id}</span>
          </p>
          <p style={{ marginTop: 12 }}>
            <strong>Permissions</strong>
          </p>
          <ul style={{ listStyle: "none", display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {permissions.map((p) => (
              <li key={p} className="pill">
                {p}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: 18 }}
            onClick={() => void signOut().then(() => router.replace("/login"))}
          >
            Logout
          </button>
        </div>
      </AdminShell>
    </RequireAdmin>
  );
}
