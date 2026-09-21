"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchAdminMe,
  loginWithGoogle,
  logout as apiLogout,
  type AdminMeData,
  type TokenResponse,
} from "@/lib/api/auth";
import { ApiError, getStoredToken, setStoredToken } from "@/lib/api/client";

type AuthContextValue = {
  token: string | null;
  admin: AdminMeData | null;
  userEmail: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  permissions: string[];
  hasPermission: (key: string) => boolean;
  signInWithGoogleCredential: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<AdminMeData | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const SUPER_ADMIN_NAME = "SUPER ADMIN";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<AdminMeData | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clear = useCallback(() => {
    setStoredToken(null);
    setToken(null);
    setAdmin(null);
    setUserEmail(null);
  }, []);

  const refresh = useCallback(async () => {
    const stored = getStoredToken();
    if (!stored) {
      clear();
      setLoading(false);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const me = await fetchAdminMe(stored);
      setToken(stored);
      setAdmin(me);
      return me;
    } catch (err) {
      clear();
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setError(err.status === 403 ? "Not authorized as admin" : "Session expired");
      } else {
        setError(err instanceof Error ? err.message : "Auth failed");
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [clear]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signInWithGoogleCredential = useCallback(
    async (idToken: string) => {
      setError(null);
      setLoading(true);
      try {
        const data: TokenResponse = await loginWithGoogle(idToken);
        setToken(data.access_token);
        setUserEmail(data.user?.email ?? null);
        const me = await fetchAdminMe(data.access_token);
        setAdmin(me);
      } catch (err) {
        clear();
        if (err instanceof ApiError && err.status === 403) {
          throw new Error("Signed in, but this account is not an active KRATOS admin.");
        }
        throw err instanceof Error ? err : new Error("Sign-in failed");
      } finally {
        setLoading(false);
      }
    },
    [clear]
  );

  const signOut = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      /* still clear */
    }
    clear();
  }, [clear]);

  const permissions = admin?.permissions ?? [];
  const isSuperAdmin = (admin?.role?.name || "").toUpperCase() === SUPER_ADMIN_NAME;

  const hasPermission = useCallback(
    (key: string) => {
      if (isSuperAdmin) return true;
      return permissions.includes(key);
    },
    [isSuperAdmin, permissions]
  );

  const value = useMemo(
    () => ({
      token,
      admin,
      userEmail,
      loading,
      error,
      isAuthenticated: Boolean(token && admin),
      isSuperAdmin,
      permissions,
      hasPermission,
      signInWithGoogleCredential,
      signOut,
      refresh,
    }),
    [
      token,
      admin,
      userEmail,
      loading,
      error,
      isSuperAdmin,
      permissions,
      hasPermission,
      signInWithGoogleCredential,
      signOut,
      refresh,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
