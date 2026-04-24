import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { User } from "../../domain/types";
import { useFleet } from "../../data/repositories/FleetContext";

type AuthContextValue = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "fleetmanager:userEmail";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export function AuthProvider({ children }: PropsWithChildren) {
  const fleet = useFleet();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const email = localStorage.getItem(STORAGE_KEY);
    if (!email) return;
    const storedUser = fleet.findUserByEmail(email);
    if (storedUser?.active) setUser(storedUser);
  }, [fleet]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      async login(email) {
        const response = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.message || "Falha no login.");
        }
        const found = (await response.json()) as User;
        localStorage.setItem(STORAGE_KEY, found.email);
        setUser(found);
        await fleet.refresh();
      },
      logout() {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      },
    }),
    [fleet, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return context;
}
