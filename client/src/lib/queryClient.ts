import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "";

// Get the current Supabase access token
async function getSupabaseToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

// Convert snake_case keys to camelCase recursively
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function convertKeysToCamel(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamel);
  }
  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([key, value]) => [
        snakeToCamel(key),
        convertKeysToCamel(value),
      ])
    );
  }
  return obj;
}

// Unwrap Go backend response envelope { success, data } and convert keys
export function unwrapResponse<T = unknown>(json: unknown): T {
  const obj = json as Record<string, unknown>;
  const data = obj?.success !== undefined ? obj.data : json;
  return convertKeysToCamel(data) as T;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Try to parse Go error envelope: { success: false, error: { message: "..." } }
    try {
      const json = await res.json();
      const msg =
        (json.error as Record<string, unknown>)?.message ||
        json.message ||
        res.statusText;
      throw new Error(String(msg));
    } catch (e) {
      if (e instanceof Error && e.message !== res.statusText) throw e;
      throw new Error(`${res.status}: ${res.statusText}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (data) headers["Content-Type"] = "application/json";

  // Get Supabase token and include as Bearer
  const token = await getSupabaseToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export function getQueryFn<T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> {
  return async ({ queryKey }) => {
    const headers: Record<string, string> = {};
    const token = await getSupabaseToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${queryKey[0] as string}`, {
      headers,
      credentials: "include",
    });

    if (options.on401 === "returnNull" && res.status === 401) {
      return null as T;
    }

    await throwIfResNotOk(res);
    const json = await res.json();
    return unwrapResponse<T>(json);
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
