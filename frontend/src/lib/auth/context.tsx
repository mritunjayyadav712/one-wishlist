"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, LoginPayload, RegisterPayload } from "@/types/auth";
import { apiClient } from "@/lib/api/client";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const currentUser = await apiClient<User>("/users/me");
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (payload: LoginPayload) => {
    await apiClient<{ user: User }>("/auth/login", {
      body: JSON.stringify(payload),
    });
    await fetchCurrentUser();
  };

  const register = async (payload: RegisterPayload) => {
    await apiClient<{ user: User }>("/auth/register", {
      body: JSON.stringify(payload),
    });
  };

  const logout = async () => {
    try {
      await apiClient("/auth/logout", { method: "POST" });
    } catch {
      // Ignore API errors on logout and proceed with local cleanup
    } finally {
      setUser(null);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refetchUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
