"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { useAuth } from "@/context/AuthProvider";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const { isAuthenticated, loading, signInWithGoogleCredential } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && isAuthenticated) router.replace(next);
  }, [loading, isAuthenticated, next, router]);

  const onCredential = useCallback(
    async (idToken: string) => {
      setBusy(true);
      setError(null);
      try {
        await signInWithGoogleCredential(idToken);
        router.replace(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sign-in failed");
      } finally {
        setBusy(false);
      }
    },
    [next, router, signInWithGoogleCredential]
  );

  return (
    <div className="login-page">
      <div className="card login-card">
        <div
          aria-hidden
          style={{
            display: "grid",
            placeItems: "center",
            width: 48,
            height: 48,
            marginBottom: 18,
            borderRadius: 14,
            background: "linear-gradient(145deg, #ff6a33, #c62828)",
            color: "#fff",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "1.3rem",
            boxShadow: "0 8px 20px rgba(214, 58, 9, 0.3)",
          }}
        >
          K
        </div>
        <p style={{ letterSpacing: "0.14em", textTransform: "uppercase", fontSize: "0.72rem", fontWeight: 700, color: "var(--accent-ink)" }}>
          KRATOS&apos;26
        </p>
        <h1 style={{ margin: "6px 0 10px", fontSize: "1.75rem" }}>Admin console</h1>
        <p className="muted" style={{ marginBottom: 24, lineHeight: 1.5 }}>
          Sign in with Google. Access requires an active row in <code>admin_users</code>.
        </p>
        {loading ? (
          <p className="muted">Checking session…</p>
        ) : (
          <>
            <GoogleSignInButton onCredential={onCredential} disabled={busy} />
            {busy && <p className="muted" style={{ marginTop: 12 }}>Verifying admin access…</p>}
            {error && (
              <p className="state-error" role="alert" style={{ marginTop: 14 }}>
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="login-page muted">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}
