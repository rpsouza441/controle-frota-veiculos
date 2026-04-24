import { z } from "zod";
import { isCorporateEmail } from "../rules/fleetRules";

export const vehicleSchema = z.object({
  id: z.string().optional(),
  plate: z.string().min(7, "Informe a placa."),
  model: z.string().min(2, "Informe o modelo."),
  currentKm: z.coerce.number().nonnegative("Informe uma KM válida."),
  teamId: z.string().min(1, "Selecione a equipe."),
  active: z.boolean(),
});

export const userSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Informe o nome."),
  email: z.string().email("E-mail inválido.").refine(isCorporateEmail, "Use o domínio corporativo."),
  role: z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]),
  teamId: z.string().min(1, "Selecione a equipe."),
  active: z.boolean(),
});

export const clientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Informe o nome do cliente."),
  active: z.boolean(),
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;
export type UserFormData = z.infer<typeof userSchema>;
export type ClientFormData = z.infer<typeof clientSchema>;
