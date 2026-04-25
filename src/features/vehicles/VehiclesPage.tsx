import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { DataTable } from "../../components/tables/DataTable";
import { Field, SelectInput, TextInput } from "../../components/forms/FormField";
import { useFleet } from "../../data/repositories/FleetContext";
import { Vehicle } from "../../domain/types";
import { VehicleFormData, vehicleSchema } from "../../domain/schemas/adminSchemas";
import { getOpenUsageForVehicle } from "../../domain/rules/fleetRules";
import { vehicleStatusLabels } from "../../utils/labels";
import { useAuth } from "../auth/AuthContext";

export function VehiclesPage() {
  const fleet = useFleet();
  const { user } = useAuth();
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
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
      {
        header: "Status",
        cell: ({ row }) => (
          <Badge tone={row.original.status === "DISPONIVEL" ? "success" : row.original.status === "EM_USO" ? "warning" : "neutral"}>
            {vehicleStatusLabels[row.original.status]}
          </Badge>
        ),
      },
      {
        header: "Ações",
        cell: ({ row }) => {
          const openUsage = getOpenUsageForVehicle(fleet.state.usages, row.original.id);
          const canReturn = row.original.status === "EM_USO" && Boolean(openUsage);

          return (
            <div className="vehicle-table-actions">
              <Button variant="secondary" onClick={() => startEdit(row.original)}>Editar</Button>
              {canReturn && openUsage ? (
                <Link to={`/devolucao?usageId=${openUsage.id}`} tabIndex={-1}>
                  <Button variant="primary">Devolver</Button>
                </Link>
              ) : null}
            </div>
          );
        },
      },
    ],
    [fleet.state.teams, fleet.state.usages],
  );

  function startEdit(vehicle: Vehicle) {
    setEditing(vehicle);
    setSubmitError(null);
    form.reset({ id: vehicle.id, plate: vehicle.plate, model: vehicle.model, currentKm: vehicle.currentKm, teamId: vehicle.teamId, active: vehicle.active });
  }

  async function onSubmit(data: VehicleFormData) {
    setSubmitError(null);
    const openUsage = editing ? getOpenUsageForVehicle(fleet.state.usages, editing.id) : undefined;
    if (openUsage && !data.active) {
      setSubmitError("Veículo em uso não pode ser inativado. Registre a devolução antes.");
      return;
    }
    try {
      await fleet.upsertVehicle({ ...data, id: data.id || "", status: editing?.status });
      if (user) await fleet.addAuditLog(user.id, "VEHICLE_UPSERT", "Vehicle", `${data.id ? "Edicao" : "Criacao"} do veiculo ${data.plate}.`);
      setEditing(null);
      form.reset({ plate: "", model: "", currentKm: 0, teamId: fleet.state.teams[0]?.id, active: true });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Nao foi possivel salvar o veiculo.");
    }
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
        {submitError ? <div className="alert danger">{submitError}</div> : null}
        <Button type="submit">{editing ? "Salvar veículo" : "Criar veículo"}</Button>
      </form>
      <div className="vehicles-table">
        <DataTable data={fleet.state.vehicles} columns={columns} />
      </div>
    </div>
  );
}
