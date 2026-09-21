const TOKEN_KEY = "kratos_admin_access_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode */
  }
}

export class ApiError extends Error {
  status: number;
  code: string;
  body: unknown;

  constructor({
    status,
    code,
    message,
    body,
  }: {
    status: number;
    code: string;
    message: string;
    body?: unknown;
  }) {
    super(message || code || `Request failed (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

type FetchOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  auth?: boolean;
};

function unwrapMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const obj = data as Record<string, unknown>;
  const err = obj.error;
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  if (typeof obj.detail === "string") return obj.detail;
  if (Array.isArray(obj.detail)) {
    return obj.detail
      .map((d) => (typeof d === "object" && d && "msg" in d ? String((d as { msg: unknown }).msg) : String(d)))
      .join(", ");
  }
  return fallback;
}

export async function apiFetch<T = unknown>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = "GET", body, token, auth = false } = options;
  const url = path.startsWith("http")
    ? path
    : `/api/v1${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const bearer = token !== undefined ? token : auth ? getStoredToken() : null;
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError({
      status: 0,
      code: "NETWORK",
      message: err instanceof Error ? err.message : "Network request failed",
    });
  }

  if (res.status === 204) return null as T;

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!res.ok) {
    throw new ApiError({
      status: res.status,
      code:
        data && typeof data === "object" && (data as { error?: { code?: string } }).error?.code
          ? String((data as { error: { code: string } }).error.code)
          : `HTTP_${res.status}`,
      message: unwrapMessage(data, res.statusText || "Request failed"),
      body: data,
    });
  }

  return data as T;
}

/** Admin ops wrap payloads as { status, data }. */
export async function apiFetchData<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const raw = await apiFetch<{ status?: string; data?: T } | T>(path, options);
  if (raw && typeof raw === "object" && "data" in raw && (raw as { status?: string }).status === "success") {
    return (raw as { data: T }).data;
  }
  return raw as T;
}

export async function apiFetchBlob(path: string, options: FetchOptions = {}): Promise<Blob> {
  const { method = "GET", token, auth = true } = options;
  const url = path.startsWith("http")
    ? path
    : `/api/v1${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = { Accept: "*/*" };
  const bearer = token !== undefined ? token : auth ? getStoredToken() : null;
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  let res: Response;
  try {
    res = await fetch(url, { method, headers });
  } catch (err) {
    throw new ApiError({
      status: 0,
      code: "NETWORK",
      message: err instanceof Error ? err.message : "Network request failed",
    });
  }

  if (!res.ok) {
    const text = await res.text();
    let data: unknown = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    throw new ApiError({
      status: res.status,
      code: `HTTP_${res.status}`,
      message: unwrapMessage(data, res.statusText || "Download failed"),
      body: data,
    });
  }

  return res.blob();
}
