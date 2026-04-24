import { Link } from "react-router-dom";
import { useFleet } from "../../data/repositories/FleetContext";
import { useAuth } from "../auth/AuthContext";
import { getOpenUsageForUser, isVehicleAvailable } from "../../domain/rules/fleetRules";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { vehicleStatusLabels } from "../../utils/labels";

export function DashboardPage() {
  const { state } = useFleet();
  const { user } = useAuth();
  const openUsage = user ? getOpenUsageForUser(state.usages, user.id) : undefined;
  const availableVehicles = state.vehicles.filter(isVehicleAvailable);
  const visibleVehicles = user?.role === "EMPLOYEE" ? availableVehicles : state.vehicles.filter((vehicle) => vehicle.active);

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h1>Olá, {user?.name.split(" ")[0]}</h1>
        </div>
        {openUsage ? (
          <Link to="/devolucao"><Button>Registrar devolução</Button></Link>
        ) : (
          <Link to="/retirada"><Button>Retirar veículo</Button></Link>
        )}
      </section>

      {openUsage ? (
        <div className="alert warning">
          Você possui uma saída em aberto. Registre a devolução do veículo.
        </div>
      ) : null}

      <section className="stats-grid">
        <div className="stat-card"><span>Disponíveis</span><strong>{availableVehicles.length}</strong></div>
        <div className="stat-card"><span>Em uso</span><strong>{state.vehicles.filter((v) => v.status === "EM_USO").length}</strong></div>
        <div className="stat-card"><span>Correções pendentes</span><strong>{state.correctionRequests.filter((c) => c.status === "PENDENTE").length}</strong></div>
      </section>

      <section className="grid-cards">
        {visibleVehicles.map((vehicle) => {
          const team = state.teams.find((item) => item.id === vehicle.teamId);
          const canWithdraw = isVehicleAvailable(vehicle) && !openUsage;
          return (
            <article className="vehicle-card" key={vehicle.id}>
              <div className="vehicle-card-head">
                <strong>{vehicle.plate}</strong>
                <Badge tone={vehicle.status === "DISPONIVEL" ? "success" : vehicle.status === "EM_USO" ? "warning" : "neutral"}>
                  {vehicleStatusLabels[vehicle.status]}
                </Badge>
              </div>
              <p>{vehicle.model}</p>
              <dl>
                <div><dt>KM atual</dt><dd>{vehicle.currentKm.toLocaleString("pt-BR")}</dd></div>
                <div><dt>Equipe</dt><dd>{team?.name}</dd></div>
              </dl>
              {canWithdraw ? (
                <Link to={`/retirada/${vehicle.id}`}><Button className="full-width">Retirar veículo</Button></Link>
              ) : null}
            </article>
          );
        })}
      </section>
    </div>
  );
}
