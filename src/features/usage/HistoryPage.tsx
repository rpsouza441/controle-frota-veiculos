import { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Button } from "../../components/ui/Button";
import { DataTable } from "../../components/tables/DataTable";
import { Field, TextInput } from "../../components/forms/FormField";
import { useFleet } from "../../data/repositories/FleetContext";
import { VehicleUsage } from "../../domain/types";
import { formatDateTime } from "../../services/date/format";
import { exportCsv } from "../../services/csv/exportCsv";
import { usageStatusLabels } from "../../utils/labels";

export function HistoryPage() {
  const { state } = useFleet();
  const [filters, setFilters] = useState({ plate: "", employee: "", client: "", from: "", to: "" });

  const rows = useMemo(() => {
    return state.usages.filter((usage) => {
      const vehicle = state.vehicles.find((item) => item.id === usage.vehicleId);
      const user = state.users.find((item) => item.id === usage.userId);
      const matchesPlate = !filters.plate || vehicle?.plate.toLowerCase().includes(filters.plate.toLowerCase());
      const matchesEmployee = !filters.employee || user?.name.toLowerCase().includes(filters.employee.toLowerCase());
      const matchesClient = !filters.client || usage.clientNames.join(", ").toLowerCase().includes(filters.client.toLowerCase());
      const withdrawalDate = new Date(usage.withdrawalAt);
      const matchesFrom = !filters.from || withdrawalDate >= new Date(filters.from);
      const matchesTo = !filters.to || withdrawalDate <= new Date(filters.to);
      return matchesPlate && matchesEmployee && matchesClient && matchesFrom && matchesTo;
    });
  }, [filters, state.usages, state.users, state.vehicles]);

  const columns = useMemo<ColumnDef<VehicleUsage>[]>(
    () => [
      { header: "Placa", cell: ({ row }) => state.vehicles.find((vehicle) => vehicle.id === row.original.vehicleId)?.plate },
      { header: "Modelo", cell: ({ row }) => state.vehicles.find((vehicle) => vehicle.id === row.original.vehicleId)?.model },
      { header: "Funcionário", cell: ({ row }) => state.users.find((user) => user.id === row.original.userId)?.name },
      { header: "Equipe", cell: ({ row }) => state.teams.find((team) => team.id === row.original.teamId)?.name },
      { header: "Cliente(s)", accessorFn: (row) => row.clientNames.join(", ") },
      { header: "Origem", accessorKey: "origin" },
      { header: "Destino", accessorKey: "destination" },
      { header: "KM retirada", accessorKey: "withdrawalKm" },
      { header: "KM devolução", cell: ({ row }) => row.original.returnKm ?? "-" },
      { header: "Retirada", cell: ({ row }) => formatDateTime(row.original.withdrawalAt) },
      { header: "Devolução", cell: ({ row }) => formatDateTime(row.original.returnAt) },
      { header: "Status", cell: ({ row }) => usageStatusLabels[row.original.status] },
    ],
    [state.teams, state.users, state.vehicles],
  );

  function handleExport() {
    exportCsv(
      "historico-frota.csv",
      rows.map((usage) => {
        const vehicle = state.vehicles.find((item) => item.id === usage.vehicleId);
        const user = state.users.find((item) => item.id === usage.userId);
        const team = state.teams.find((item) => item.id === usage.teamId);
        return {
          Placa: vehicle?.plate,
          Modelo: vehicle?.model,
          Funcionario: user?.name,
          Equipe: team?.name,
          Clientes: usage.clientNames.join("; "),
          Origem: usage.origin,
          Destino: usage.destination,
          KmRetirada: usage.withdrawalKm,
          KmDevolucao: usage.returnKm,
          Retirada: formatDateTime(usage.withdrawalAt),
          Devolucao: formatDateTime(usage.returnAt),
          Status: usageStatusLabels[usage.status],
        };
      }),
    );
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div><span className="eyebrow">Gestão</span><h1>Histórico de uso</h1></div>
        <Button onClick={handleExport} disabled={!rows.length}>Exportar CSV</Button>
      </section>
      <section className="panel filters">
        <Field label="Placa"><TextInput value={filters.plate} onChange={(event) => setFilters({ ...filters, plate: event.target.value })} /></Field>
        <Field label="Funcionário"><TextInput value={filters.employee} onChange={(event) => setFilters({ ...filters, employee: event.target.value })} /></Field>
        <Field label="Cliente"><TextInput value={filters.client} onChange={(event) => setFilters({ ...filters, client: event.target.value })} /></Field>
        <Field label="De"><TextInput type="datetime-local" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} /></Field>
        <Field label="Até"><TextInput type="datetime-local" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} /></Field>
      </section>
      <DataTable data={rows} columns={columns} />
    </div>
  );
}
