"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import styles from "./AdminShell.module.css";

type NavItem = { href: string; label: string; permission?: string; superOnly?: boolean };

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard" },
  { href: "/participants", label: "Participants", permission: "participant-read" },
  { href: "/registrations", label: "Registrations", permission: "registration-read" },
  { href: "/events", label: "Events", permission: "event-management" },
  { href: "/teams", label: "Teams", permission: "team-read" },
  { href: "/payments", label: "Payments", permission: "payment-read" },
  { href: "/notifications", label: "Notifications", permission: "announcement" },
  { href: "/attendance", label: "Attendance", permission: "attendance-read" },
  { href: "/exports", label: "Exports", permission: "export" },
  { href: "/admins", label: "Admins", superOnly: true },
  { href: "/profile", label: "Profile" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { admin, hasPermission, isSuperAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const items = useMemo(
    () =>
      NAV.filter((item) => {
        if (item.superOnly) return isSuperAdmin;
        if (!item.permission) return true;
        if (item.href === "/notifications") {
          return (
            hasPermission("announcement") ||
            hasPermission("reminder") ||
            hasPermission("notification")
          );
        }
        return hasPermission(item.permission);
      }),
    [hasPermission, isSuperAdmin]
  );

  return (
    <div className={styles.shell}>
      <aside className={`${styles.sidebar} ${open ? styles.open : ""}`}>
        <div className={styles.brand}>
          <span>KRATOS</span>
          <small>Admin</small>
        </div>
        <nav>
          {items.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? styles.active : undefined}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className={styles.main}>
        <header className={styles.header}>
          <button type="button" className={styles.menu} aria-label="Menu" onClick={() => setOpen((v) => !v)}>
            ☰
          </button>
          <div className={styles.headerMeta}>
            <span className="muted">{admin?.role?.name || "Admin"}</span>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => void signOut().then(() => (window.location.href = "/login"))}
            >
              Logout
            </button>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
      {open && (
        <button type="button" className={styles.scrim} aria-label="Close menu" onClick={() => setOpen(false)} />
      )}
    </div>
  );
}
