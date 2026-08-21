"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "@/lib/axios";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "student" | "tutor" | "admin" | "pending";
  avatar?: string;
  plan: string;
  isVerified: boolean;
  isApproved: boolean;
}

interface GoogleAuthResult {
  user: User;
  needsRole: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  loginWithGoogle: (idToken: string) => Promise<GoogleAuthResult>;
  selectRole: (role: "student" | "tutor") => Promise<User>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<string>;
  logout: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: "student" | "tutor";
  phone?: string;
  city?: string;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.get("/auth/me")
        .then((res) => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem("token");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (data: RegisterData) => {
    const res = await api.post("/auth/register", data);
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const loginWithGoogle = async (idToken: string): Promise<GoogleAuthResult> => {
    const res = await api.post("/auth/google", { idToken });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    return { user: res.data.user, needsRole: res.data.needsRole };
  };

  const selectRole = async (role: "student" | "tutor"): Promise<User> => {
    const res = await api.patch("/auth/select-role", { role });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const forgotPassword = async (email: string): Promise<string> => {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data.message;
  };

  const resetPassword = async (email: string, otp: string, newPassword: string): Promise<string> => {
    const res = await api.post("/auth/reset-password", { email, otp, newPassword });
    return res.data.message;
  };
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout request failed:", err);
      // Continue clearing local state even if the request fails —
      // the user should never appear "stuck" logged in on the frontend.
    } finally {
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, selectRole, forgotPassword, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);