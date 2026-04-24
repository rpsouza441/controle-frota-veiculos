import { z } from "zod";

export const withdrawalSchema = z.object({
  vehicleId: z.string().min(1, "Selecione um veículo."),
  withdrawalKm: z.coerce.number().nonnegative("Informe uma KM válida."),
  withdrawalAt: z.string().min(1, "Informe a data e hora."),
  clientsText: z.string().min(1, "Informe ao menos um cliente."),
  origin: z.string().min(1, "Informe a origem."),
  destination: z.string().min(1, "Informe o destino."),
  purpose: z.string().min(1, "Informe a finalidade."),
});

export const returnSchema = z.object({
  returnKm: z.coerce.number().nonnegative("Informe uma KM válida."),
  returnAt: z.string().min(1, "Informe a data e hora."),
  returnNote: z.string().optional(),
});

export const correctionSchema = z.object({
  vehicleId: z.string().min(1, "Selecione um veículo."),
  informedKm: z.coerce.number().nonnegative("Informe uma KM válida."),
  systemKm: z.coerce.number().nonnegative(),
  reason: z.string().min(10, "Descreva o motivo com pelo menos 10 caracteres."),
});

export type WithdrawalFormData = z.infer<typeof withdrawalSchema>;
export type ReturnFormData = z.infer<typeof returnSchema>;
export type CorrectionFormData = z.infer<typeof correctionSchema>;
