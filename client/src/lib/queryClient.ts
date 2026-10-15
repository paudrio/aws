import { QueryClient, QueryFunction } from "@tanstack/react-query";

export function getCurrentUserId(): string | null {
  try {
    return localStorage.getItem("uid");
  } catch {
    return null;
  }
}

export function setCurrentUserId(id: string | null) {
  try {
    if (id) {
      localStorage.setItem("uid", id);
    } else {
      localStorage.removeItem("uid");
    }
  } catch {
    // ignore
  }
}

function buildAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const uid = getCurrentUserId();
  const headers: Record<string, string> = { ...(extra || {}) };
  if (uid) headers["x-user-id"] = uid;
  return headers;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseHeaders: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  const res = await fetch(url, {
    method,
    headers: buildAuthHeaders(baseHeaders),
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers: buildAuthHeaders(),
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
