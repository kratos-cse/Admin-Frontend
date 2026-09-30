"use client";

import { useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import RequireAdmin from "@/components/layout/RequireAdmin";
import PageHeader from "@/components/ui/PageHeader";
import { exportAttendance, exportPayments, exportRegistrations } from "@/lib/api/exports";
import { ApiError } from "@/lib/api/client";

export default function ExportsPage() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Export failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <RequireAdmin>
      <AdminShell>
        <PageHeader eyebrow="Data" title="Exports" description="Download Excel sheets for registrations, payments and attendance." />
        <div className="card" style={{ display: "grid", gap: 12, maxWidth: 420 }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={Boolean(busy)}
            onClick={() => void run("reg", exportRegistrations)}
          >
            {busy === "reg" ? "Downloading…" : "Export registrations"}
          </button>
          <button type="button" className="btn btn-ghost" disabled={Boolean(busy)} onClick={() => void run("pay", exportPayments)}>
            {busy === "pay" ? "Downloading…" : "Export payments"}
          </button>
          <button type="button" className="btn btn-ghost" disabled={Boolean(busy)} onClick={() => void run("att", exportAttendance)}>
            {busy === "att" ? "Downloading…" : "Export attendance"}
          </button>
          {error && <p className="state-error">{error}</p>}
        </div>
      </AdminShell>
    </RequireAdmin>
  );
}
