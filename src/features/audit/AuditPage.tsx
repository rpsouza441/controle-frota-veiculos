import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { DataTable } from "../../components/tables/DataTable";
import { useFleet } from "../../data/repositories/FleetContext";
import { AuditLogEntry } from "../../domain/types";
import { formatDateTime } from "../../services/date/format";

const actionLabels: Record<AuditLogEntry["action"], string> = {
  LOGIN: "Login",
  VEHICLE_WITHDRAWAL: "Retirada de veículo",
  VEHICLE_RETURN: "Devolução de veículo",
  VEHICLE_UPSERT: "Criação/edição de veículo",
  USER_UPSERT: "Criação/edição de usuário",
  CLIENT_UPSERT: "Criação/edição de cliente",
  ODOMETER_CORRECTION_REQUEST: "Solicitação de correção de KM",
  ODOMETER_CORRECTION_REVIEW: "Aprovação/rejeição de correção",
};

export function AuditPage() {
  const { state } = useFleet();
  const columns = useMemo<ColumnDef<AuditLogEntry>[]>(
    () => [
      { header: "Data/hora", cell: ({ row }) => formatDateTime(row.original.createdAt) },
      { header: "Usuário executor", cell: ({ row }) => state.users.find((user) => user.id === row.original.actorUserId)?.name ?? row.original.actorUserId },
      { header: "Ação", cell: ({ row }) => actionLabels[row.original.action] },
      { header: "Entidade", accessorKey: "entity" },
      { header: "Resumo", accessorKey: "summary" },
    ],
    [state.users],
  );

  return (
    <div className="page-stack">
      <section className="page-heading"><div><span className="eyebrow">Admin</span><h1>Log de auditoria</h1></div></section>
      <DataTable data={state.auditLogs} columns={columns} />
    </div>
  );
}
