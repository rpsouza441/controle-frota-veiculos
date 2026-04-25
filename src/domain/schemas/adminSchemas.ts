import { z } from "zod";

export const vehicleSchema = z.object({
  id: z.string().optional(),
  plate: z.string().min(7, "Informe a placa."),
  model: z.string().min(2, "Informe o modelo."),
  currentKm: z.coerce.number().nonnegative("Informe uma KM valida."),
  teamId: z.string().min(1, "Selecione a equipe."),
  active: z.boolean(),
});

export const userSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Informe o nome."),
  email: z.string().email("E-mail invalido."),
  password: z.string().optional(),
  role: z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]),
  teamId: z.string().min(1, "Selecione a equipe."),
  active: z.boolean(),
}).superRefine((data, ctx) => {
  if (!data.id && (!data.password || data.password.length < 8)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["password"],
      message: "Informe uma senha com pelo menos 8 caracteres.",
    });
  }
  if (data.password && data.password.length < 8) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["password"],
      message: "A senha deve ter pelo menos 8 caracteres.",
    });
  }
});

export const clientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Informe o nome do cliente."),
  active: z.boolean(),
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;
export type UserFormData = z.infer<typeof userSchema>;
export type ClientFormData = z.infer<typeof clientSchema>;
