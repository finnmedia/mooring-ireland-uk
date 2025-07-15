import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import type { User, LoginUser, RegisterUser } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.status === 401) {
          return null; // User is not authenticated
        }
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        return response.json();
      } catch (error) {
        return null; // Default to null on any error
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes to prevent constant checking
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isPremium: user?.subscriptionStatus === "premium",
    isAdmin: user?.role === "admin",
  };
}

export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (credentials: LoginUser) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: RegisterUser) => {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });
}