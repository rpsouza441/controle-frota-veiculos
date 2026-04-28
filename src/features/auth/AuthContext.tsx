import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getPublicSettings as getPublicSettingsUseCase } from "../../application/usecases/auth/getPublicSettings";
import { login as loginUseCase } from "../../application/usecases/auth/login";
import { logout as logoutUseCase } from "../../application/usecases/auth/logout";
import { rehydrate as rehydrateUseCase } from "../../application/usecases/auth/rehydrate";
import { AuthRepository, PublicSettings } from "../../domain/ports/AuthRepository";
import { User } from "../../domain/types";
import { clearAuthToken, getAuthToken, notifyAuthChanged, setAuthToken } from "../../services/api/authToken";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  getPublicSettings: () => Promise<PublicSettings>;
};

type AuthProviderProps = PropsWithChildren<{
  authRepository: AuthRepository;
}>;

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ authRepository, children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const getPublicSettings = useCallback(() => getPublicSettingsUseCase(authRepository), [authRepository]);

  const rehydrate = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const found = await rehydrateUseCase(authRepository, token);
      setUser(found);
    } catch {
      clearAuthToken();
      setUser(null);
      notifyAuthChanged();
    } finally {
      setLoading(false);
    }
  }, [authRepository]);

  useEffect(() => {
    void rehydrate();
  }, [rehydrate]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(email, password) {
        const { token, user: found } = await loginUseCase(authRepository, { email, password });
        setAuthToken(token);
        setUser(found);
        notifyAuthChanged();
      },
      logout() {
        logoutUseCase(clearAuthToken);
        setUser(null);
        notifyAuthChanged();
      },
      getPublicSettings,
    }),
    [authRepository, getPublicSettings, loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return context;
}
