import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { DataTable } from "../../components/tables/DataTable";
import { Field, TextInput } from "../../components/forms/FormField";
import { useFleet } from "../../data/repositories/FleetContext";
import { Client } from "../../domain/types";
import { ClientFormData, clientSchema } from "../../domain/schemas/adminSchemas";
import { useAuth } from "../auth/AuthContext";

export function ClientsPage() {
  const fleet = useFleet();
  const { user } = useAuth();
  const [editing, setEditing] = useState<Client | null>(null);
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", active: true },
  });
  const columns = useMemo<ColumnDef<Client>[]>(
    () => [
      { header: "Cliente sugerido", accessorKey: "name" },
      { header: "Status", cell: ({ row }) => <Badge tone={row.original.active ? "success" : "neutral"}>{row.original.active ? "Ativo" : "Inativo"}</Badge> },
      { header: "Merge futuro", cell: () => <Button variant="ghost" disabled>Estrutura visual</Button> },
      { header: "Ações", cell: ({ row }) => <Button variant="secondary" onClick={() => startEdit(row.original)}>Editar</Button> },
    ],
    [],
  );

  function startEdit(client: Client) {
    setEditing(client);
    form.reset(client);
  }

  function onSubmit(data: ClientFormData) {
    fleet.upsertClient({ ...data, id: data.id || "" });
    if (user) fleet.addAuditLog(user.id, "CLIENT_UPSERT", "Client", `${data.id ? "Edicao" : "Criacao"} do cliente sugerido ${data.name}.`);
    setEditing(null);
    form.reset({ name: "", active: true });
  }

  return (
    <div className="page-stack">
      <section className="page-heading"><div><span className="eyebrow">Admin</span><h1>Gestão de clientes</h1></div></section>
      <form className="panel form-grid admin-form" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Nome do cliente" error={form.formState.errors.name?.message}><TextInput {...form.register("name")} /></Field>
        <label className="check-field"><input type="checkbox" {...form.register("active")} /> Ativo</label>
        <Button type="submit">{editing ? "Salvar cliente" : "Criar cliente"}</Button>
      </form>
      <DataTable data={fleet.state.clients} columns={columns} />
    </div>
  );
}
