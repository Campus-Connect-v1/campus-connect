import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [operator, setOperator] = useState(null);
  const [permissions, setPermissions] = useState(null);
  // "loading" until we know whether the stored token is still good, so the
  // login screen does not flash on every reload.
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!getToken()) {
      setStatus("anonymous");
      return;
    }
    api
      .get("/auth/me")
      .then(({ operator, permissions }) => {
        setOperator(operator);
        setPermissions(permissions);
        setStatus("authenticated");
      })
      .catch(() => {
        setToken(null);
        setStatus("anonymous");
      });
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.post("/auth/login", { email, password });
    setToken(data.token);
    setOperator(data.operator);
    setPermissions(data.permissions);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setOperator(null);
    setPermissions(null);
    setStatus("anonymous");
  }, []);

  // Without this, every AuthProvider render (including ones unrelated to
  // auth state) created a new context value object, re-rendering every
  // useAuth() consumer in the app.
  const value = useMemo(
    () => ({ operator, permissions, status, login, logout }),
    [operator, permissions, status, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
