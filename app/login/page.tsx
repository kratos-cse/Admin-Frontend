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
        <p className="muted" style={{ letterSpacing: "0.18em", textTransform: "uppercase", fontSize: "0.68rem", color: "var(--gold)" }}>
          KRATOS&apos;26
        </p>
        <h1 style={{ margin: "8px 0 10px", fontSize: "1.75rem" }}>Admin</h1>
        <p className="muted" style={{ marginBottom: 22, lineHeight: 1.45 }}>
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
