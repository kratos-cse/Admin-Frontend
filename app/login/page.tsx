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
        <p className="muted" style={{ letterSpacing: "0.16em", textTransform: "uppercase", fontSize: "0.72rem" }}>
          KRATOS&apos;26
        </p>
        <h1 style={{ margin: "8px 0 10px" }}>Admin Sign in</h1>
        <p className="muted" style={{ marginBottom: 20 }}>
          Google Sign-In issues a JWT. Access requires an active admin row via{" "}
          <code>GET /admin/me</code>.
        </p>
        {loading ? (
          <p className="muted">Checking session…</p>
        ) : (
          <>
            <GoogleSignInButton onCredential={onCredential} disabled={busy} />
            {busy && <p className="muted">Verifying admin access…</p>}
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
