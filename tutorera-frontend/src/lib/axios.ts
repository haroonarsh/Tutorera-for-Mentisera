import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://tutorera-backend.onrender.com/api/v1",
  withCredentials: true,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Centralized 401 handling — if any request comes back unauthorized (expired token,
// suspended account, etc.), clear local auth state and redirect to login. This prevents
// the UI from silently staying in a "logged in" state after the backend has already
// invalidated the session.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      const isAuthRoute = error.config?.url?.includes("/auth/login")
        || error.config?.url?.includes("/auth/register")
        || error.config?.url?.includes("/auth/logout");
      if (!isAuthRoute) {
        localStorage.removeItem("token");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
