import { z } from "zod";
import { CORPORATE_EMAIL_DOMAIN, isCorporateEmail } from "../rules/fleetRules";

export const loginSchema = z.object({
  email: z
    .string()
    .email("Informe um e-mail válido.")
    .refine((value) => isCorporateEmail(value), `Use um e-mail corporativo ${CORPORATE_EMAIL_DOMAIN}.`),
  password: z.string().min(1, "Informe a senha."),
});

export type LoginFormData = z.infer<typeof loginSchema>;
