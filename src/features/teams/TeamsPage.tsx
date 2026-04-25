import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { DataTable } from "../../components/tables/DataTable";
import { Field, TextInput } from "../../components/forms/FormField";
import { useFleet } from "../../data/repositories/FleetContext";
import { Team } from "../../domain/types";
import { TeamFormData, teamSchema } from "../../domain/schemas/adminSchemas";
import { useAuth } from "../auth/AuthContext";

export function TeamsPage() {
  const fleet = useFleet();
  const { user } = useAuth();
  const [editing, setEditing] = useState<Team | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: "", active: true },
  });

  const columns = useMemo<ColumnDef<Team>[]>(
    () => [
      { header: "Equipe", accessorKey: "name" },
      {
        header: "Status",
        cell: ({ row }) => (
          <Badge tone={row.original.active ? "success" : "neutral"}>
            {row.original.active ? "Ativa" : "Inativa"}
          </Badge>
        ),
      },
      {
        header: "Ações",
        cell: ({ row }) => (
          <Button variant="secondary" onClick={() => startEdit(row.original)}>
            Editar
          </Button>
        ),
      },
    ],
    [],
  );

  function startEdit(team: Team) {
    setEditing(team);
    setSubmitError(null);
    form.reset(team);
  }

  async function onSubmit(data: TeamFormData) {
    setSubmitError(null);
    try {
      await fleet.upsertTeam({ ...data, id: data.id || "" });
      if (user) {
        await fleet.addAuditLog(user.id, "TEAM_UPSERT", "Team", `${data.id ? "Edicao" : "Criacao"} da equipe ${data.name}.`);
      }
      setEditing(null);
      form.reset({ name: "", active: true });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Nao foi possivel salvar a equipe.");
    }
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Gestão de equipes</h1>
        </div>
      </section>
      <form className="panel form-grid admin-form" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Nome da equipe" error={form.formState.errors.name?.message}>
          <TextInput {...form.register("name")} />
        </Field>
        <label className="check-field">
          <input type="checkbox" {...form.register("active")} /> Ativa
        </label>
        {submitError ? <div className="alert danger">{submitError}</div> : null}
        <Button type="submit">{editing ? "Salvar equipe" : "Criar equipe"}</Button>
      </form>
      <DataTable data={fleet.state.teams} columns={columns} />
    </div>
  );
}
