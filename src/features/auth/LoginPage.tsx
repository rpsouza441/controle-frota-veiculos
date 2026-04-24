import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { loginSchema, LoginFormData } from "../../domain/schemas/authSchemas";
import { CORPORATE_EMAIL_DOMAIN } from "../../domain/rules/fleetRules";
import { useAuth } from "./AuthContext";
import { useFleet } from "../../data/repositories/FleetContext";
import { Field, TextInput } from "../../components/forms/FormField";
import { Button } from "../../components/ui/Button";

export function LoginPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { state } = useFleet();
  const { register, handleSubmit, formState, setError } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "ricardo@empresa.com.br", password: "123456" },
  });

  async function onSubmit(data: LoginFormData) {
    try {
      await auth.login(data.email, data.password);
      navigate("/");
    } catch (error) {
      setError("email", { message: error instanceof Error ? error.message : "Falha no login." });
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand">
        <div>
          <h1>FleetManager</h1>
          <p>Controle confiável de retirada, devolução e auditoria de veículos corporativos.</p>
        </div>
        <div className="login-metrics">
          <span>Sistema de auditoria ativo</span>
          <strong>{state.vehicles.filter((vehicle) => vehicle.active).length} veículos monitorados</strong>
        </div>
      </section>
      <section className="login-panel">
        <h2>Acessar conta</h2>
        <p>Use um usuário mockado com domínio {CORPORATE_EMAIL_DOMAIN}.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
          <Field label="E-mail corporativo" error={formState.errors.email?.message}>
            <TextInput type="email" placeholder={`nome${CORPORATE_EMAIL_DOMAIN}`} {...register("email")} />
          </Field>
          <Field label="Senha" error={formState.errors.password?.message}>
            <TextInput type="password" placeholder="Senha fake" {...register("password")} />
          </Field>
          <Button type="submit" disabled={formState.isSubmitting}>Entrar</Button>
        </form>
        <div className="mock-users">
          <strong>Usuários de desenvolvimento</strong>
          {state.users.filter((user) => user.active).map((user) => (
            <span key={user.id}>{user.email}</span>
          ))}
        </div>
      </section>
    </main>
  );
}
