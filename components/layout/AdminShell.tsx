"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { canReadEvents } from "@/lib/permissions";
import styles from "./AdminShell.module.css";

type IconName =
  | "dashboard"
  | "participants"
  | "registrations"
  | "events"
  | "teams"
  | "payments"
  | "notifications"
  | "attendance"
  | "exports"
  | "admins"
  | "profile";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  permission?: string;
  superOnly?: boolean;
  visible?: (ctx: { hasPermission: (k: string) => boolean; isSuperAdmin: boolean }) => boolean;
};

type NavGroup = { title: string; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [{ href: "/", label: "Dashboard", icon: "dashboard", permission: "dashboard" }],
  },
  {
    title: "Operations",
    items: [
      { href: "/participants", label: "Participants", icon: "participants", permission: "participant-read" },
      { href: "/registrations", label: "Registrations", icon: "registrations", permission: "registration-read" },
      { href: "/teams", label: "Teams", icon: "teams", permission: "team-read" },
      { href: "/payments", label: "Payments", icon: "payments", permission: "payment-read" },
      { href: "/attendance", label: "Attendance", icon: "attendance", permission: "attendance-read" },
    ],
  },
  {
    title: "Catalogue",
    items: [
      {
        href: "/events",
        label: "Events",
        icon: "events",
        visible: ({ hasPermission }) => canReadEvents(hasPermission),
      },
    ],
  },
  {
    title: "Comms & data",
    items: [
      { href: "/notifications", label: "Notifications", icon: "notifications", permission: "announcement" },
      { href: "/exports", label: "Exports", icon: "exports", permission: "export" },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/admins", label: "Admins", icon: "admins", superOnly: true },
      { href: "/profile", label: "Profile", icon: "profile" },
    ],
  },
];

const ICON_PATHS: Record<IconName, string> = {
  dashboard: "M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z",
  participants:
    "M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0ZM4 21a8 8 0 0 1 16 0",
  registrations: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5h6m-6 8 2 2 4-4",
  events: "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
  teams: "M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m18 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  payments: "M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7Zm0 3h20M6 15h4",
  notifications: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9ZM13.73 21a2 2 0 0 1-3.46 0",
  attendance: "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  exports: "M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2",
  admins: "M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4Z",
  profile: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
};

function Icon({ name }: { name: IconName }) {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

function initials(value: string) {
  const parts = value.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "A").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
}

/**
 * Phones render table rows as stacked cards; each cell needs its column label.
 * Derived from <th> text so individual pages don't have to annotate every <td>.
 */
function useTableLabels(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;

    const label = () => {
      root.querySelectorAll<HTMLTableElement>("table.data").forEach((table) => {
        const heads = Array.from(table.querySelectorAll("thead th")).map((th) => th.textContent?.trim() ?? "");
        if (heads.length === 0) return;
        table.querySelectorAll("tbody tr").forEach((row) => {
          Array.from(row.children).forEach((cell, i) => {
            if (!(cell instanceof HTMLElement)) return;
            const text = heads[i] ?? "";
            if (cell.dataset.label !== text) cell.dataset.label = text;
          });
        });
      });
    };

    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(label);
    };

    label();
    const observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [ref]);
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { admin, hasPermission, isSuperAdmin, signOut, userEmail } = useAuth();
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLElement>(null);
  useTableLabels(contentRef);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const groups = useMemo(() => {
    const allowed = (item: NavItem) => {
      if (item.superOnly) return isSuperAdmin;
      if (item.visible) return item.visible({ hasPermission, isSuperAdmin });
      if (!item.permission) return true;
      if (item.href === "/notifications") {
        return hasPermission("announcement") || hasPermission("reminder") || hasPermission("notification");
      }
      if (item.href === "/") return hasPermission("dashboard") || isSuperAdmin;
      return hasPermission(item.permission);
    };
    return GROUPS.map((g) => ({ ...g, items: g.items.filter(allowed) })).filter((g) => g.items.length > 0);
  }, [hasPermission, isSuperAdmin]);

  const displayName = userEmail || "Admin";

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <button
          type="button"
          className={styles.menuBtn}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="admin-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <Link href="/" className={styles.topbarBrand}>
          KRATOS<span>&rsquo;26</span> <em>Admin</em>
        </Link>
      </header>

      <aside id="admin-nav" className={`${styles.sidebar} ${open ? styles.open : ""}`} aria-label="Admin navigation">
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden>
            K
          </span>
          <span className={styles.brandText}>
            <strong>KRATOS&rsquo;26</strong>
            <small>Admin console</small>
          </span>
        </Link>

        <nav className={styles.nav}>
          {groups.map((group) => (
            <div key={group.title} className={styles.group}>
              <p className={styles.groupTitle}>{group.title}</p>
              {group.items.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.link} ${active ? styles.active : ""}`}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon name={item.icon} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.account}>
          <div className={styles.avatar} aria-hidden>
            {initials(displayName)}
          </div>
          <div className={styles.accountMeta}>
            <span className={styles.accountName} title={displayName}>
              {displayName}
            </span>
            <span className={styles.accountRole}>{admin?.role?.name || "Admin"}</span>
          </div>
          <button
            type="button"
            className={styles.logout}
            onClick={() => void signOut().then(() => (window.location.href = "/login"))}
          >
            Log out
          </button>
        </div>
      </aside>

      <main ref={contentRef} className={styles.content}>
        <div className={styles.contentInner}>{children}</div>
      </main>

      <button
        type="button"
        className={`${styles.scrim} ${open ? styles.scrimOpen : ""}`}
        aria-label="Close menu"
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
      />
    </div>
  );
}
