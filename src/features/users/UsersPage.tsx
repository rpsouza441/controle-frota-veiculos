import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { DataTable } from "../../components/tables/DataTable";
import { Field, SelectInput, TextInput } from "../../components/forms/FormField";
import { useFleet } from "../../data/repositories/FleetContext";
import { User } from "../../domain/types";
import { UserFormData, userSchema } from "../../domain/schemas/adminSchemas";
import { isCorporateEmail } from "../../domain/rules/fleetRules";
import { roleLabels } from "../../utils/labels";
import { useAuth } from "../auth/AuthContext";

export function UsersPage() {
  const fleet = useFleet();
  const { user: actor } = useAuth();
  const [editing, setEditing] = useState<User | null>(null);
  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: "", email: "", password: "", role: "EMPLOYEE", teamId: fleet.state.teams[0]?.id, active: true },
  });
  const selectableTeams = useMemo(() => {
    const currentTeamId = editing?.teamId;
    return fleet.state.teams.filter((team) => team.active || team.id === currentTeamId);
  }, [editing?.teamId, fleet.state.teams]);
  const defaultTeamId = selectableTeams.find((team) => team.active)?.id ?? selectableTeams[0]?.id;

  useEffect(() => {
    if (!form.getValues("teamId") && defaultTeamId) {
      form.setValue("teamId", defaultTeamId);
    }
  }, [defaultTeamId, form]);

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      { header: "Nome", accessorKey: "name" },
      { header: "E-mail", accessorKey: "email" },
      { header: "Role", cell: ({ row }) => roleLabels[row.original.role] },
      { header: "Equipe", cell: ({ row }) => fleet.state.teams.find((team) => team.id === row.original.teamId)?.name },
      { header: "Status", cell: ({ row }) => <Badge tone={row.original.active ? "success" : "neutral"}>{row.original.active ? "Ativo" : "Inativo"}</Badge> },
      { header: "Acoes", cell: ({ row }) => <Button variant="secondary" onClick={() => startEdit(row.original)}>Editar</Button> },
    ],
    [fleet.state.teams],
  );

  function startEdit(item: User) {
    setEditing(item);
    form.reset({ ...item, password: "" });
  }

  async function onSubmit(data: UserFormData) {
    if (!isCorporateEmail(data.email, fleet.state.settings.corporateEmailDomain)) {
      form.setError("email", { message: `Use o dominio corporativo ${fleet.state.settings.corporateEmailDomain}.` });
      return;
    }
    await fleet.upsertUser({ ...data, id: data.id || "" });
    if (actor) await fleet.addAuditLog(actor.id, "USER_UPSERT", "User", `${data.id ? "Edicao" : "Criacao"} do usuario ${data.email}.`);
    setEditing(null);
    form.reset({ name: "", email: "", password: "", role: "EMPLOYEE", teamId: defaultTeamId, active: true });
  }

  return (
    <div className="page-stack">
      <section className="page-heading"><div><span className="eyebrow">Admin</span><h1>Gestao de usuarios</h1></div></section>
      <form className="panel form-grid admin-form" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Nome" error={form.formState.errors.name?.message}><TextInput {...form.register("name")} /></Field>
        <Field label="E-mail" error={form.formState.errors.email?.message}><TextInput type="email" {...form.register("email")} /></Field>
        <Field label={editing ? "Nova senha" : "Senha"} error={form.formState.errors.password?.message}>
          <TextInput type="password" placeholder={editing ? "Deixe em branco para manter" : ""} {...form.register("password")} />
        </Field>
        <Field label="Role" error={form.formState.errors.role?.message}>
          <SelectInput {...form.register("role")}>
            <option value="EMPLOYEE">Funcionario</option>
            <option value="MANAGER">Gestor</option>
            <option value="ADMIN">Admin</option>
          </SelectInput>
        </Field>
        <Field label="Equipe" error={form.formState.errors.teamId?.message}>
          <SelectInput {...form.register("teamId")}>
            {selectableTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
          </SelectInput>
        </Field>
        <label className="check-field"><input type="checkbox" {...form.register("active")} /> Ativo</label>
        <Button type="submit">{editing ? "Salvar usuario" : "Criar usuario"}</Button>
      </form>
      <DataTable data={fleet.state.users} columns={columns} />
    </div>
  );
}
