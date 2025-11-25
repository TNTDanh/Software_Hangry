import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "useradmin_auth";

export const buildAuthHeaders = (token) =>
  token ? { Authorization: `Bearer ${token}`, token } : {};

const loadAuth = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: "", role: "" };
    const parsed = JSON.parse(raw);
    return {
      token: parsed.token || "",
      role: parsed.role || "",
    };
  } catch {
    return { token: "", role: "" };
  }
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState(loadAuth);

  const login = (payload) => {
    const data = {
      token: payload.token,
      role: payload.role || "",
    };
    setState(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const logout = () => {
    setState({ token: "", role: "" });
    localStorage.removeItem(STORAGE_KEY);
  };

  useEffect(() => {
    const handler = () => setState(loadAuth());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const value = useMemo(
    () => ({ ...state, login, logout }),
    [state.token, state.role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default useAuth;
