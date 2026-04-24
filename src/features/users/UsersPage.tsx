import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { DataTable } from "../../components/tables/DataTable";
import { Field, SelectInput, TextInput } from "../../components/forms/FormField";
import { useFleet } from "../../data/repositories/FleetContext";
import { User } from "../../domain/types";
import { UserFormData, userSchema } from "../../domain/schemas/adminSchemas";
import { roleLabels } from "../../utils/labels";
import { useAuth } from "../auth/AuthContext";

export function UsersPage() {
  const fleet = useFleet();
  const { user: actor } = useAuth();
  const [editing, setEditing] = useState<User | null>(null);
  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: "", email: "", role: "EMPLOYEE", teamId: fleet.state.teams[0]?.id, active: true },
  });
  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      { header: "Nome", accessorKey: "name" },
      { header: "E-mail", accessorKey: "email" },
      { header: "Role", cell: ({ row }) => roleLabels[row.original.role] },
      { header: "Equipe", cell: ({ row }) => fleet.state.teams.find((team) => team.id === row.original.teamId)?.name },
      { header: "Status", cell: ({ row }) => <Badge tone={row.original.active ? "success" : "neutral"}>{row.original.active ? "Ativo" : "Inativo"}</Badge> },
      { header: "Ações", cell: ({ row }) => <Button variant="secondary" onClick={() => startEdit(row.original)}>Editar</Button> },
    ],
    [fleet.state.teams],
  );

  function startEdit(item: User) {
    setEditing(item);
    form.reset(item);
  }

  function onSubmit(data: UserFormData) {
    fleet.upsertUser({ ...data, id: data.id || "" });
    if (actor) fleet.addAuditLog(actor.id, "USER_UPSERT", "User", `${data.id ? "Edicao" : "Criacao"} do usuario ${data.email}.`);
    setEditing(null);
    form.reset({ name: "", email: "", role: "EMPLOYEE", teamId: fleet.state.teams[0]?.id, active: true });
  }

  return (
    <div className="page-stack">
      <section className="page-heading"><div><span className="eyebrow">Admin</span><h1>Gestão de usuários</h1></div></section>
      <form className="panel form-grid admin-form" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Nome" error={form.formState.errors.name?.message}><TextInput {...form.register("name")} /></Field>
        <Field label="E-mail" error={form.formState.errors.email?.message}><TextInput type="email" {...form.register("email")} /></Field>
        <Field label="Role" error={form.formState.errors.role?.message}><SelectInput {...form.register("role")}><option value="EMPLOYEE">Funcionário</option><option value="MANAGER">Gestor</option><option value="ADMIN">Admin</option></SelectInput></Field>
        <Field label="Equipe" error={form.formState.errors.teamId?.message}><SelectInput {...form.register("teamId")}>{fleet.state.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</SelectInput></Field>
        <label className="check-field"><input type="checkbox" {...form.register("active")} /> Ativo</label>
        <Button type="submit">{editing ? "Salvar usuário" : "Criar usuário"}</Button>
      </form>
      <DataTable data={fleet.state.users} columns={columns} />
    </div>
  );
}
