"use client";

import { useEffect, useState } from "react";

type Props = {
  onCredential: (idToken: string) => void;
  disabled?: boolean;
};

export default function GoogleSignInButton({ onCredential, disabled }: Props) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      setError(null);
      setReady(false);
      let clientId = "";
      try {
        const res = await fetch("/api/config");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error?.message || "GOOGLE_CLIENT_ID is not configured");
        clientId = data.googleClientId;
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load auth config");
        return;
      }
      if (!clientId || cancelled) {
        if (!cancelled) setError("GOOGLE_CLIENT_ID is not configured");
        return;
      }

      const init = () => {
        if (cancelled || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: { credential?: string }) => {
            if (response?.credential) onCredential(response.credential);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        const el = document.getElementById("google-signin-btn");
        if (el) {
          el.innerHTML = "";
          window.google.accounts.id.renderButton(el, {
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "rectangular",
            width: 280,
          });
        }
        if (!cancelled) setReady(true);
      };

      if (window.google?.accounts?.id) {
        init();
        return;
      }

      const existing = document.querySelector('script[data-google-gsi="1"]');
      if (existing) {
        existing.addEventListener("load", init);
        return () => existing.removeEventListener("load", init);
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.dataset.googleGsi = "1";
      script.onload = init;
      script.onerror = () => {
        if (!cancelled) setError("Failed to load Google Sign-In");
      };
      document.head.appendChild(script);
    }

    void setup();
    return () => {
      cancelled = true;
    };
  }, [onCredential]);

  if (error) {
    return (
      <p className="state-error" role="alert">
        {error}
      </p>
    );
  }

  return (
    <div className={`google-signin-wrap${disabled ? " is-disabled" : ""}`} aria-busy={!ready}>
      <div id="google-signin-btn" />
      {!ready && <p className="muted">Loading Google Sign-In…</p>}
    </div>
  );
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (cfg: Record<string, unknown>) => void;
          renderButton: (el: HTMLElement, cfg: Record<string, unknown>) => void;
        };
      };
    };
  }
}
