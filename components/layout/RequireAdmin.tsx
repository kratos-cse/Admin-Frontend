"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
    }
  }, [loading, isAuthenticated, router, pathname]);

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <div className="skeleton" style={{ width: 220, marginBottom: 12 }} />
        <div className="skeleton" style={{ width: "60%" }} />
      </div>
    );
  }

  if (!isAuthenticated) return null;
  return <>{children}</>;
}
