import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/services/api";
import type { RegisterPayload, ResetPasswordPayload } from "@/types/auth.types";

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (payload: RegisterPayload) => Promise<unknown>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/me");
      const userProfile = res?.data?.data;
      if (res?.data?.success && userProfile) {
        // Map user profile details
        setUser({
          id: userProfile.id,
          email: userProfile.email,
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          role: userProfile.role?.name || "Student",
          status: userProfile.status || "ACTIVE",
        });
      } else {
        setUser(null);
      }
    } catch (err) {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    const resData = res?.data?.data;
    if (res?.data?.success && resData?.user) {
      if (resData.accessToken) {
        localStorage.setItem("token", resData.accessToken);
      }
      const u = {
        id: resData.user.id,
        email: resData.user.email,
        firstName: resData.user.firstName,
        lastName: resData.user.lastName,
        role: resData.user.role?.name || "Student",
        status: resData.user.status || "ACTIVE",
      };
      setUser(u);
      return u;
    }
    throw new Error(res?.data?.message || "Invalid credentials received");
  };

  const register = async (payload: RegisterPayload) => {
    const res = await api.post("/auth/register", payload);
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  const resendVerification = async (email: string) => {
    await api.post("/auth/resend-verification", { email });
  };

  const forgotPassword = async (email: string) => {
    await api.post("/auth/forgot-password", { email });
  };

  const resetPassword = async (payload: ResetPasswordPayload) => {
    await api.post("/auth/reset-password", payload);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        checkAuth,
        resendVerification,
        forgotPassword,
        resetPassword,
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
