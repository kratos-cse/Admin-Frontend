"use client";

import { useRouter } from "next/navigation";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import PageHeader from "@/components/ui/PageHeader";
import { useAuth } from "@/context/AuthProvider";

export default function ProfilePage() {
  const { admin, userEmail, permissions, isSuperAdmin, signOut } = useAuth();
  const router = useRouter();

  return (
    <RequireAdmin>
      <AdminShell>
        <PageHeader eyebrow="Account" title="Profile" description="Your admin identity and granted permissions." />
        <div className="card" style={{ maxWidth: 560 }}>
          <p>
            <strong>Email</strong>
            <br />
            <span style={{ color: "var(--text-secondary)" }}>{userEmail || "—"}</span>
          </p>
          <p style={{ marginTop: 14 }}>
            <strong>Role</strong>
            <br />
            <span style={{ color: "var(--text-secondary)" }}>
              {admin?.role?.name || "—"}
              {isSuperAdmin ? " (Super Admin)" : ""}
            </span>
          </p>
          <p style={{ marginTop: 14 }}>
            <strong>Admin user id</strong>
            <br />
            <code style={{ overflowWrap: "anywhere" }}>{admin?.admin_user_id}</code>
          </p>
          <p style={{ marginTop: 14 }}>
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
