import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { DataTable } from "../../components/tables/DataTable";
import { Field, SelectInput, TextInput } from "../../components/forms/FormField";
import { useFleet } from "../../data/repositories/FleetContext";
import { Vehicle } from "../../domain/types";
import { VehicleFormData, vehicleSchema } from "../../domain/schemas/adminSchemas";
import { vehicleStatusLabels } from "../../utils/labels";
import { useAuth } from "../auth/AuthContext";

export function VehiclesPage() {
  const fleet = useFleet();
  const { user } = useAuth();
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: { plate: "", model: "", currentKm: 0, teamId: fleet.state.teams[0]?.id, active: true },
  });
  const columns = useMemo<ColumnDef<Vehicle>[]>(
    () => [
      { header: "Placa", accessorKey: "plate" },
      { header: "Modelo", accessorKey: "model" },
      { header: "KM atual", accessorKey: "currentKm" },
      { header: "Equipe", cell: ({ row }) => fleet.state.teams.find((team) => team.id === row.original.teamId)?.name },
      { header: "Status", cell: ({ row }) => <Badge tone={row.original.status === "DISPONIVEL" ? "success" : row.original.status === "EM_USO" ? "warning" : "neutral"}>{vehicleStatusLabels[row.original.status]}</Badge> },
      { header: "Ações", cell: ({ row }) => <Button variant="secondary" onClick={() => startEdit(row.original)}>Editar</Button> },
    ],
    [fleet.state.teams],
  );

  function startEdit(vehicle: Vehicle) {
    setEditing(vehicle);
    form.reset({ id: vehicle.id, plate: vehicle.plate, model: vehicle.model, currentKm: vehicle.currentKm, teamId: vehicle.teamId, active: vehicle.active });
  }

  async function onSubmit(data: VehicleFormData) {
    await fleet.upsertVehicle({ ...data, id: data.id || "", status: editing?.status });
    if (user) await fleet.addAuditLog(user.id, "VEHICLE_UPSERT", "Vehicle", `${data.id ? "Edicao" : "Criacao"} do veiculo ${data.plate}.`);
    setEditing(null);
    form.reset({ plate: "", model: "", currentKm: 0, teamId: fleet.state.teams[0]?.id, active: true });
  }

  return (
    <div className="page-stack">
      <section className="page-heading"><div><span className="eyebrow">Admin</span><h1>Gestão de veículos</h1></div></section>
      <form className="panel form-grid admin-form" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Placa" error={form.formState.errors.plate?.message}><TextInput {...form.register("plate")} /></Field>
        <Field label="Modelo" error={form.formState.errors.model?.message}><TextInput {...form.register("model")} /></Field>
        <Field label="KM atual" error={form.formState.errors.currentKm?.message}><TextInput type="number" {...form.register("currentKm")} /></Field>
        <Field label="Equipe" error={form.formState.errors.teamId?.message}><SelectInput {...form.register("teamId")}>{fleet.state.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</SelectInput></Field>
        <label className="check-field"><input type="checkbox" {...form.register("active")} /> Ativo</label>
        <Button type="submit">{editing ? "Salvar veículo" : "Criar veículo"}</Button>
      </form>
      <DataTable data={fleet.state.vehicles} columns={columns} />
    </div>
  );
}
