import { createContext, useContext, useState } from "react";
import { loginUser } from "../services/api";

const AuthContext = createContext(null);
const TOKEN_STORAGE_KEY = "proofflow_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_STORAGE_KEY) || ""
  );

  async function login(email, password) {
    const response = await loginUser(email, password);

    if (!response.token) {
      throw new Error("Login response did not include an authentication token.");
    }

    localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    setToken(response.token);
    return response;
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken("");
  }

  return (
    <AuthContext.Provider
      value={{ token, isAuthenticated: Boolean(token), login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}