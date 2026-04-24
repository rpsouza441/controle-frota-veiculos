import { Navigate, Outlet } from "react-router-dom";
import { UserRole } from "../domain/types";
import { useAuth } from "../features/auth/AuthContext";

export function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { user, loading } = useAuth();

  // Aguarda a re-hidratação da sessão via API antes de redirecionar.
  // Sem isso, o usuário autenticado seria enviado para /login enquanto
  // o AuthContext ainda está consultando /api/auth/login para validar a sessão.
  if (loading) return null;

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return <Outlet />;
}
