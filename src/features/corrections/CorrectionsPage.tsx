import { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
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
  const [processingId, setProcessingId] = useState<{ id: string; action: "APROVADA" | "REJEITADA" } | null>(null);

  const handleReview = async (id: string, action: "APROVADA" | "REJEITADA", userId: string) => {
    try {
      setProcessingId({ id, action });
      await fleet.reviewCorrectionRequest(id, action, userId);
    } catch (error: any) {
      alert(error instanceof Error ? error.message : "Esta solicitação já foi processada ou não está mais pendente.");
    } finally {
      setProcessingId(null);
    }
  };

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
        cell: ({ row }) => {
          if (row.original.status !== "PENDENTE") return "-";
          
          const isProcessingThisRow = processingId?.id === row.original.id;

          return (
            <div className="row-actions">
              <Button 
                variant="secondary" 
                disabled={isProcessingThisRow}
                onClick={() => user && handleReview(row.original.id, "APROVADA", user.id)}
              >
                {isProcessingThisRow && processingId.action === "APROVADA" ? "Salvando..." : "Aprovar"}
              </Button>
              <Button 
                variant="danger" 
                disabled={isProcessingThisRow}
                onClick={() => user && handleReview(row.original.id, "REJEITADA", user.id)}
              >
                {isProcessingThisRow && processingId.action === "REJEITADA" ? "Salvando..." : "Rejeitar"}
              </Button>
            </div>
          );
        },
      },
    ],
    [fleet, user, processingId],
  );

  return (
    <div className="page-stack">
      <section className="page-heading"><div><span className="eyebrow">Odômetro</span><h1>Correções de KM</h1></div></section>
      <DataTable data={fleet.state.correctionRequests} columns={columns} />
    </div>
  );
}
