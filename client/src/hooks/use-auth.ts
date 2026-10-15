import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";
import { setCurrentUserId, getCurrentUserId } from "@/lib/queryClient";

async function fetchUser(): Promise<User | null> {
  const headers: Record<string, string> = {};
  const uid = getCurrentUserId();
  if (uid) headers["x-user-id"] = uid;

  const response = await fetch("/api/auth/user", {
    credentials: "include",
    headers,
  });

  if (response.status === 401) {
    setCurrentUserId(null);
    return null;
  }

  if (response.status === 403) {
    const data = await response.json();
    if (data.suspended) {
      setCurrentUserId(null);
      window.dispatchEvent(new CustomEvent("user-suspended"));
      return null;
    }
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  const user: User = await response.json();
  if (user?.id) setCurrentUserId(user.id);
  return user;
}

async function logout(): Promise<void> {
  setCurrentUserId(null);
  window.location.href = "/api/logout";
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      setCurrentUserId(null);
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
