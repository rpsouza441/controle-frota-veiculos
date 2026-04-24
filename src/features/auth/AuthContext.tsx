import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { User } from "../../domain/types";
import { authChangedEvent, clearAuthToken, getAuthToken, notifyAuthChanged, setAuthToken } from "../../services/api/authToken";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

type LoginResponse = {
  token: string;
  user: User;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

async function loginWithPassword(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || "Falha no login.");
  }
  return response.json() as Promise<LoginResponse>;
}

async function fetchCurrentUser(token: string): Promise<User> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || "Sessao invalida.");
  }
  return response.json() as Promise<User>;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const rehydrate = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const found = await fetchCurrentUser(token);
      setUser(found);
    } catch {
      clearAuthToken();
      setUser(null);
      notifyAuthChanged();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void rehydrate();
  }, [rehydrate]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(email, password) {
        const { token, user: found } = await loginWithPassword(email, password);
        setAuthToken(token);
        setUser(found);
        notifyAuthChanged();
      },
      logout() {
        clearAuthToken();
        setUser(null);
        notifyAuthChanged();
      },
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return context;
}
