import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { UserRole } from "../../domain/types";
import { roleLabels } from "../../utils/labels";
import { Button } from "../ui/Button";

const navItems: Array<{ to: string; label: string; roles: UserRole[] }> = [
  { to: "/", label: "Início", roles: ["EMPLOYEE", "MANAGER", "ADMIN"] },
  { to: "/historico", label: "Histórico", roles: ["MANAGER", "ADMIN"] },
  { to: "/correcoes", label: "Correções", roles: ["MANAGER", "ADMIN"] },
  { to: "/veiculos", label: "Veículos", roles: ["ADMIN"] },
  { to: "/usuarios", label: "Usuários", roles: ["ADMIN"] },
  { to: "/clientes", label: "Clientes", roles: ["ADMIN"] },
  { to: "/auditoria", label: "Auditoria", roles: ["ADMIN"] },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const visibleItems = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <strong className="brand">FleetManager</strong>
          <span className="topbar-subtitle">Controle de frota corporativa</span>
        </div>
        <div className="topbar-user">
          <span>{user?.name}</span>
          <small>{user ? roleLabels[user.role] : ""}</small>
          <Button variant="ghost" onClick={() => { logout(); navigate("/login"); }}>
            Sair
          </Button>
        </div>
      </header>
      <div className="shell-body">
        <nav className="sidebar">
          {visibleItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
