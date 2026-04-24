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
        const found = fleet.findUserByEmail(email);
        if (!found) throw new Error("Usuario mockado nao encontrado.");
        if (!found.active) throw new Error("Usuario inativo nao pode acessar.");
        localStorage.setItem(STORAGE_KEY, found.email);
        setUser(found);
        fleet.addAuditLog(found.id, "LOGIN", "Auth", `Login fake realizado por ${found.email}.`);
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
