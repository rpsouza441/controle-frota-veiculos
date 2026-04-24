import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { DataTable } from "../../components/tables/DataTable";
import { useFleet } from "../../data/repositories/FleetContext";
import { OdometerCorrectionRequest } from "../../domain/types";
import { formatDateTime } from "../../services/date/format";
import { correctionStatusLabels } from "../../utils/labels";
import { useAuth } from "../auth/AuthContext";

export function CorrectionsPage() {
  const fleet = useFleet();
  const { user } = useAuth();

  const columns = useMemo<ColumnDef<OdometerCorrectionRequest>[]>(
    () => [
      { header: "Criada em", cell: ({ row }) => formatDateTime(row.original.createdAt) },
      { header: "Veículo", cell: ({ row }) => fleet.state.vehicles.find((vehicle) => vehicle.id === row.original.vehicleId)?.plate },
      { header: "Solicitante", cell: ({ row }) => fleet.state.users.find((item) => item.id === row.original.requestedByUserId)?.name },
      { header: "KM sistema", accessorKey: "systemKm" },
      { header: "KM informada", accessorKey: "informedKm" },
      { header: "Motivo", accessorKey: "reason" },
      {
        header: "Status",
        cell: ({ row }) => (
          <Badge tone={row.original.status === "PENDENTE" ? "warning" : row.original.status === "APROVADA" ? "success" : "danger"}>
            {correctionStatusLabels[row.original.status]}
          </Badge>
        ),
      },
      {
        header: "Ações",
        cell: ({ row }) =>
          row.original.status === "PENDENTE" ? (
            <div className="row-actions">
              <Button variant="secondary" onClick={() => user && fleet.reviewCorrectionRequest(row.original.id, "APROVADA", user.id)}>Aprovar</Button>
              <Button variant="danger" onClick={() => user && fleet.reviewCorrectionRequest(row.original.id, "REJEITADA", user.id)}>Rejeitar</Button>
            </div>
          ) : "-",
      },
    ],
    [fleet, user],
  );

  return (
    <div className="page-stack">
      <section className="page-heading"><div><span className="eyebrow">Odômetro</span><h1>Correções de KM</h1></div></section>
      <DataTable data={fleet.state.correctionRequests} columns={columns} />
    </div>
  );
}
