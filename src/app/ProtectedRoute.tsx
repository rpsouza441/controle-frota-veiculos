import { Navigate, Outlet } from "react-router-dom";
import { UserRole } from "../domain/types";
import { useAuth } from "../features/auth/AuthContext";

export function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return <Outlet />;
}
