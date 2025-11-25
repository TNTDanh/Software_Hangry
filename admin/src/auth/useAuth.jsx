import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "admin_auth";

const AuthContext = createContext(null);

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: "", role: "admin", restaurantIds: [] };
    const parsed = JSON.parse(raw);
    return {
      token: parsed.token || "",
      role: parsed.role || "admin",
      restaurantIds: parsed.restaurantIds || [],
    };
  } catch {
    return { token: "", role: "admin", restaurantIds: [] };
  }
};

export const buildAuthHeaders = (token) =>
  token
    ? { token, Authorization: `Bearer ${token}` }
    : {};

export const AuthProvider = ({ children }) => {
  const [{ token, role, restaurantIds }, setAuth] = useState(loadFromStorage);

  const login = (payload) => {
    const data = {
      token: payload.token,
      role: payload.role || "admin",
      restaurantIds: payload.restaurantIds || [],
    };
    setAuth(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const logout = () => {
    setAuth({ token: "", role: "admin", restaurantIds: [] });
    localStorage.removeItem(STORAGE_KEY);
  };

  // sync across tabs
  useEffect(() => {
    const handler = () => setAuth(loadFromStorage());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const value = useMemo(
    () => ({ token, role, restaurantIds, login, logout }),
    [token, role, restaurantIds]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};

export default useAuth;
