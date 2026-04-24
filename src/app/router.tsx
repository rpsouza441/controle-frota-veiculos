import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage } from "../features/auth/LoginPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { WithdrawalPage } from "../features/usage/WithdrawalPage";
import { ReturnPage } from "../features/usage/ReturnPage";
import { HistoryPage } from "../features/usage/HistoryPage";
import { CorrectionsPage } from "../features/corrections/CorrectionsPage";
import { VehiclesPage } from "../features/vehicles/VehiclesPage";
import { UsersPage } from "../features/users/UsersPage";
import { ClientsPage } from "../features/clients/ClientsPage";
import { AuditPage } from "../features/audit/AuditPage";
import { SettingsPage } from "../features/settings/SettingsPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <DashboardPage /> },
          { path: "/retirada", element: <WithdrawalPage /> },
          { path: "/retirada/:vehicleId", element: <WithdrawalPage /> },
          { path: "/devolucao", element: <ReturnPage /> },
          {
            element: <ProtectedRoute roles={["MANAGER", "ADMIN"]} />,
            children: [
              { path: "/historico", element: <HistoryPage /> },
              { path: "/correcoes", element: <CorrectionsPage /> },
            ],
          },
          {
            element: <ProtectedRoute roles={["ADMIN"]} />,
            children: [
              { path: "/veiculos", element: <VehiclesPage /> },
              { path: "/usuarios", element: <UsersPage /> },
              { path: "/clientes", element: <ClientsPage /> },
              { path: "/auditoria", element: <AuditPage /> },
              { path: "/configuracoes", element: <SettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
