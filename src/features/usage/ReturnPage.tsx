import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Field, TextArea, TextInput } from "../../components/forms/FormField";
import { useFleet } from "../../data/repositories/FleetContext";
import { getOpenUsageForUser } from "../../domain/rules/fleetRules";
import { returnSchema, ReturnFormData } from "../../domain/schemas/usageSchemas";
import { formatDateTime, toInputDateTime } from "../../services/date/format";
import { useAuth } from "../auth/AuthContext";

export function ReturnPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const fleet = useFleet();
  const requestedUsageId = searchParams.get("usageId");
  const requestedUsage = fleet.state.usages.find((usage) => usage.id === requestedUsageId && usage.status === "ABERTO");
  const ownOpenUsage = user ? getOpenUsageForUser(fleet.state.usages, user.id) : undefined;
  const openUsage = user?.role === "ADMIN" && requestedUsage ? requestedUsage : ownOpenUsage;
  const vehicle = fleet.state.vehicles.find((item) => item.id === openUsage?.vehicleId);
  const usageUser = fleet.state.users.find((item) => item.id === openUsage?.userId);
  const form = useForm<ReturnFormData>({
    resolver: zodResolver(returnSchema),
    defaultValues: { returnKm: openUsage?.withdrawalKm ?? vehicle?.currentKm ?? 0, returnAt: toInputDateTime(), returnNote: "" },
  });

  useEffect(() => {
    form.reset({ returnKm: openUsage?.withdrawalKm ?? vehicle?.currentKm ?? 0, returnAt: toInputDateTime(), returnNote: "" });
  }, [form, openUsage, vehicle]);

  async function onSubmit(data: ReturnFormData) {
    if (!openUsage) return;
    if (data.returnKm < openUsage.withdrawalKm) {
      form.setError("returnKm", { message: "KM de devolução não pode ser menor que a KM de retirada." });
      return;
    }
    if (new Date(data.returnAt) < new Date(openUsage.withdrawalAt)) {
      form.setError("returnAt", { message: "Data/hora de devolução não pode ser anterior à retirada." });
      return;
    }
    await fleet.closeUsage(openUsage.id, data.returnKm, data.returnAt, data.returnNote);
    navigate("/");
  }

  if (!openUsage) {
    return (
      <div className="page-stack narrow">
        <div className="alert info">Você não possui saída em aberto.</div>
        <Link to="/"><Button>Voltar ao dashboard</Button></Link>
      </div>
    );
  }

  return (
    <div className="page-stack narrow">
      <section className="page-heading">
        <div><span className="eyebrow">Uso de veículo</span><h1>Registrar devolução</h1></div>
        <Link to="/"><Button variant="secondary">Voltar</Button></Link>
      </section>
      <section className="panel usage-summary">
        <strong>{vehicle?.plate} - {vehicle?.model}</strong>
        <span>Responsável: {usageUser?.name ?? "Usuário não encontrado"}</span>
        <span>Retirado em {formatDateTime(openUsage.withdrawalAt)} com KM {openUsage.withdrawalKm.toLocaleString("pt-BR")}</span>
        <span>Cliente(s): {openUsage.clientNames.join(", ")}</span>
      </section>
      <form className="panel form-grid" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="KM de devolução" error={form.formState.errors.returnKm?.message}><TextInput type="number" {...form.register("returnKm")} /></Field>
        <Field label="Data/hora de devolução" error={form.formState.errors.returnAt?.message}><TextInput type="datetime-local" {...form.register("returnAt")} /></Field>
        <Field label="Observação opcional" error={form.formState.errors.returnNote?.message}><TextArea {...form.register("returnNote")} /></Field>
        <Button type="submit">Confirmar devolução</Button>
      </form>
    </div>
  );
}
