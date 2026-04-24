import { Link } from "react-router-dom";
import { useFleet } from "../../data/repositories/FleetContext";
import { useAuth } from "../auth/AuthContext";
import { getOpenUsageForUser, getOpenUsageForVehicle, isVehicleAvailable } from "../../domain/rules/fleetRules";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { vehicleStatusLabels } from "../../utils/labels";
import { formatDateTime } from "../../services/date/format";

export function DashboardPage() {
  const { state } = useFleet();
  const { user } = useAuth();
  const openUsage = user ? getOpenUsageForUser(state.usages, user.id) : undefined;
  const openUsageVehicle = openUsage ? state.vehicles.find((vehicle) => vehicle.id === openUsage.vehicleId) : undefined;
  const availableVehicles = state.vehicles.filter(isVehicleAvailable);
  const todayLabel = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const visibleVehicles = (() => {
    if (user?.role === "EMPLOYEE") {
      if (state.settings.employeesCanSeeInUseVehicles) {
        return state.vehicles.filter((v) => v.active && v.status !== "INATIVO");
      }
      return availableVehicles;
    }
    return state.vehicles.filter((v) => v.active);
  })();

  const userClosedUsages = state.usages
    .filter((usage) => usage.userId === user?.id && usage.status === "FECHADO")
    .sort((a, b) => new Date(b.returnAt || b.withdrawalAt).getTime() - new Date(a.returnAt || a.withdrawalAt).getTime());

  const recentActivities = [
    ...(openUsage ? [openUsage] : []),
    ...userClosedUsages.slice(0, openUsage ? 1 : 2),
  ];

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyKm = userClosedUsages.reduce((total, usage) => {
    const returnDate = usage.returnAt ? new Date(usage.returnAt) : undefined;
    if (!returnDate || returnDate.getMonth() !== currentMonth || returnDate.getFullYear() !== currentYear) return total;
    return total + Math.max(0, (usage.returnKm || usage.withdrawalKm) - usage.withdrawalKm);
  }, 0);
  const monthlyProgress = Math.min(100, Math.round((monthlyKm / 600) * 100));

  function getInUseUserName(vehicleId: string): string | undefined {
    const usage = getOpenUsageForVehicle(state.usages, vehicleId);
    if (!usage) return undefined;
    const usageUser = state.users.find((u) => u.id === usage.userId);
    return usageUser?.name;
  }

  function getVehicleLabel(vehicleId: string) {
    const vehicle = state.vehicles.find((item) => item.id === vehicleId);
    return vehicle ? `${vehicle.model} - ${vehicle.plate}` : "Veículo não encontrado";
  }

  return (
    <div className="page-stack dashboard-page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">{user?.role === "EMPLOYEE" ? "Dashboard do Colaborador" : "Dashboard"}</span>
          <h1>Olá, {user?.name.split(" ")[0]}</h1>
        </div>
        <p className="dashboard-date">{todayLabel}</p>
      </section>

      {openUsage ? (
        <div className="alert-open-usage">
          <div className="alert-open-usage-icon">
            <span className="material-symbols-outlined" aria-hidden="true">warning</span>
          </div>
          <div className="alert-open-usage-copy">
            <h2>Você possui uma saída em aberto</h2>
            <p>
              Veículo: {openUsageVehicle ? `${openUsageVehicle.model} (${openUsageVehicle.plate})` : "Não encontrado"} • Iniciado em {formatDateTime(openUsage.withdrawalAt)}
            </p>
          </div>
          <Link to="/devolucao">
            <Button className="alert-open-usage-action">
              <span className="material-symbols-outlined" aria-hidden="true">assignment_return</span>
              Registrar devolução
            </Button>
          </Link>
        </div>
      ) : null}

      <section className="stats-grid">
        <div className="stat-card"><span>Disponíveis</span><strong>{availableVehicles.length}</strong></div>
        <div className="stat-card"><span>Em uso</span><strong>{state.vehicles.filter((v) => v.status === "EM_USO").length}</strong></div>
        <div className="stat-card"><span>Correções pendentes</span><strong>{state.correctionRequests.filter((c) => c.status === "PENDENTE").length}</strong></div>
      </section>

      <div className="dashboard-content-grid">
        <section className="dashboard-main-column">
          <div className="section-header">
            <h2>Veículos Disponíveis</h2>
            {!openUsage ? (
              <Link to="/retirada">
                <Button className="section-header-action">
                  <span className="material-symbols-outlined" aria-hidden="true">add_circle</span>
                  Retirar veículo
                </Button>
              </Link>
            ) : null}
          </div>

          <div className="grid-cards vehicle-dashboard-grid">
            {visibleVehicles.map((vehicle) => {
              const team = state.teams.find((item) => item.id === vehicle.teamId);
              const canWithdraw = isVehicleAvailable(vehicle) && !openUsage;
              const inUseByName = vehicle.status === "EM_USO" ? getInUseUserName(vehicle.id) : undefined;
              return (
                <article className="vehicle-card" key={vehicle.id}>
                  <div className="vehicle-card-top">
                    <div className="vehicle-card-title">
                      <Badge tone={vehicle.status === "DISPONIVEL" ? "success" : vehicle.status === "EM_USO" ? "warning" : "neutral"}>
                        {vehicleStatusLabels[vehicle.status]}
                      </Badge>
                      <h3>{vehicle.model}</h3>
                      <span className="vehicle-card-plate">PLACA: {vehicle.plate}</span>
                    </div>
                    <div className="vehicle-card-metrics">
                      <div>
                        <span>Odômetro</span>
                        <strong>{vehicle.currentKm.toLocaleString("pt-BR")} km</strong>
                      </div>
                      <div>
                        <span>Equipe</span>
                        <strong>{team?.name || "-"}</strong>
                      </div>
                    </div>
                  </div>

                  {inUseByName ? (
                    <div className="in-use-by">
                      <span>Em uso por:</span> <strong>{inUseByName}</strong>
                    </div>
                  ) : null}

                  <div className="vehicle-card-actions">
                    {canWithdraw ? (
                      <Link to={`/retirada/${vehicle.id}`}>
                        <Button>Retirar</Button>
                      </Link>
                    ) : (
                      <button className="btn btn-secondary" type="button" disabled>Indisponível</button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="dashboard-side-column">
          <section className="recent-activity">
            <h2>Atividade Recente</h2>
            <div className="recent-activity-list">
              {recentActivities.length ? recentActivities.map((usage) => {
                const isOpen = usage.status === "ABERTO";
                return (
                  <article className="recent-activity-item" key={usage.id}>
                    <div className="recent-activity-icon">
                      <span className="material-symbols-outlined" aria-hidden="true">
                        {isOpen ? "key" : "assignment_return"}
                      </span>
                    </div>
                    <div>
                      <h3>{isOpen ? "Retirada aprovada" : "Devolução realizada"}</h3>
                      <p>{getVehicleLabel(usage.vehicleId)} • {formatDateTime(isOpen ? usage.withdrawalAt : usage.returnAt)}</p>
                    </div>
                    <strong className={isOpen ? "activity-status-active" : "activity-status-ok"}>{isOpen ? "ATIVA" : "OK"}</strong>
                  </article>
                );
              }) : (
                <p className="recent-activity-empty">Nenhuma atividade recente registrada.</p>
              )}
              <Link to="/historico" className="recent-activity-link">Ver histórico completo</Link>
            </div>
          </section>

          <section className="stats-highlight">
            <div>
              <span>Uso este mês</span>
              <span className="material-symbols-outlined" aria-hidden="true">bar_chart</span>
            </div>
            <strong>{monthlyKm.toLocaleString("pt-BR")} km</strong>
            <p>Meta operacional mensal de 600 km</p>
            <div className="stats-progress" aria-hidden="true">
              <i style={{ width: `${monthlyProgress}%` }} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
