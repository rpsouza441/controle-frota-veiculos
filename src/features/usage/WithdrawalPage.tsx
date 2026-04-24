import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Field, SelectInput, TextArea, TextInput } from "../../components/forms/FormField";
import { useFleet } from "../../data/repositories/FleetContext";
import { isVehicleAvailable } from "../../domain/rules/fleetRules";
import { correctionSchema, CorrectionFormData, withdrawalSchema, WithdrawalFormData } from "../../domain/schemas/usageSchemas";
import { useAuth } from "../auth/AuthContext";
import { toInputDateTime } from "../../services/date/format";

export function WithdrawalPage() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fleet = useFleet();
  const [kmMismatch, setKmMismatch] = useState<{ vehicleId: string; informedKm: number; systemKm: number } | null>(null);
  const vehicles = fleet.state.vehicles.filter(isVehicleAvailable);
  const selectedVehicle = fleet.state.vehicles.find((vehicle) => vehicle.id === vehicleId) ?? vehicles[0];
  const suggestions = useMemo(() => fleet.state.clients.filter((client) => client.active).map((client) => client.name), [fleet.state.clients]);
  const withdrawalForm = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      vehicleId: selectedVehicle?.id ?? "",
      withdrawalKm: selectedVehicle?.currentKm ?? 0,
      withdrawalAt: toInputDateTime(),
      clientsText: "",
      origin: "Sede",
      destination: "",
      purpose: "",
    },
  });
  const correctionForm = useForm<CorrectionFormData>({
    resolver: zodResolver(correctionSchema),
    defaultValues: { vehicleId: selectedVehicle?.id ?? "", informedKm: selectedVehicle?.currentKm ?? 0, systemKm: selectedVehicle?.currentKm ?? 0, reason: "" },
  });

  useEffect(() => {
    if (selectedVehicle) {
      withdrawalForm.setValue("vehicleId", selectedVehicle.id);
      withdrawalForm.setValue("withdrawalKm", selectedVehicle.currentKm);
    }
  }, [selectedVehicle, withdrawalForm]);

  function onWithdrawal(data: WithdrawalFormData) {
    const vehicle = fleet.state.vehicles.find((item) => item.id === data.vehicleId);
    if (!vehicle || !user) return;
    if (data.withdrawalKm !== vehicle.currentKm) {
      setKmMismatch({ vehicleId: vehicle.id, informedKm: data.withdrawalKm, systemKm: vehicle.currentKm });
      correctionForm.reset({ vehicleId: vehicle.id, informedKm: data.withdrawalKm, systemKm: vehicle.currentKm, reason: "" });
      return;
    }
    const clients = fleet.ensureClients(data.clientsText.split(","));
    fleet.createWithdrawal({
      vehicleId: data.vehicleId,
      userId: user.id,
      teamId: user.teamId,
      clientIds: clients.map((client) => client.id),
      clientNames: clients.map((client) => client.name),
      origin: data.origin,
      destination: data.destination,
      purpose: data.purpose,
      withdrawalKm: data.withdrawalKm,
      withdrawalAt: data.withdrawalAt,
    });
    navigate("/");
  }

  function onCorrection(data: CorrectionFormData) {
    if (!user) return;
    fleet.createCorrectionRequest({ ...data, requestedByUserId: user.id });
    navigate("/");
  }

  return (
    <div className="page-stack narrow">
      <section className="page-heading">
        <div><span className="eyebrow">Uso de veículo</span><h1>Retirada de veículo</h1></div>
        <Link to="/"><Button variant="secondary">Voltar</Button></Link>
      </section>
      <form className="panel form-grid" onSubmit={withdrawalForm.handleSubmit(onWithdrawal)}>
        <Field label="Veículo" error={withdrawalForm.formState.errors.vehicleId?.message}>
          <SelectInput {...withdrawalForm.register("vehicleId")}>
            {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} - {vehicle.model}</option>)}
          </SelectInput>
        </Field>
        <Field label="KM atual informada" error={withdrawalForm.formState.errors.withdrawalKm?.message}>
          <TextInput type="number" {...withdrawalForm.register("withdrawalKm")} />
        </Field>
        <Field label="Data/hora de retirada" error={withdrawalForm.formState.errors.withdrawalAt?.message}>
          <TextInput type="datetime-local" {...withdrawalForm.register("withdrawalAt")} />
        </Field>
        <Field label="Cliente(s)" error={withdrawalForm.formState.errors.clientsText?.message}>
          <TextInput list="client-suggestions" placeholder="Separe múltiplos clientes por vírgula" {...withdrawalForm.register("clientsText")} />
        </Field>
        <datalist id="client-suggestions">{suggestions.map((name) => <option key={name} value={name} />)}</datalist>
        <Field label="Origem" error={withdrawalForm.formState.errors.origin?.message}><TextInput {...withdrawalForm.register("origin")} /></Field>
        <Field label="Destino" error={withdrawalForm.formState.errors.destination?.message}><TextInput {...withdrawalForm.register("destination")} /></Field>
        <Field label="Finalidade do uso" error={withdrawalForm.formState.errors.purpose?.message}><TextArea {...withdrawalForm.register("purpose")} /></Field>
        <Button type="submit">Confirmar retirada</Button>
      </form>
      {kmMismatch ? (
        <form className="panel form-grid" onSubmit={correctionForm.handleSubmit(onCorrection)}>
          <div className="alert danger">A KM informada não bate com a KM atual do sistema. Solicite correção para um gestor/admin.</div>
          <Field label="Veículo"><SelectInput {...correctionForm.register("vehicleId")}><option value={kmMismatch.vehicleId}>{fleet.state.vehicles.find((v) => v.id === kmMismatch.vehicleId)?.plate}</option></SelectInput></Field>
          <Field label="KM informada"><TextInput type="number" {...correctionForm.register("informedKm")} /></Field>
          <Field label="KM atual no sistema"><TextInput type="number" readOnly {...correctionForm.register("systemKm")} /></Field>
          <Field label="Motivo" error={correctionForm.formState.errors.reason?.message}><TextArea {...correctionForm.register("reason")} /></Field>
          <Button type="submit" variant="secondary">Solicitar correção de KM</Button>
        </form>
      ) : null}
    </div>
  );
}
