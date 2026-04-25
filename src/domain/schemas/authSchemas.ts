import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail valido."),
  password: z.string().min(1, "Informe a senha."),
});

export type LoginFormData = z.infer<typeof loginSchema>;
