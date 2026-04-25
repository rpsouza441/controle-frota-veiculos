import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { loginSchema, LoginFormData } from "../../domain/schemas/authSchemas";
import { CORPORATE_EMAIL_DOMAIN, normalizeCorporateEmailDomain } from "../../domain/rules/fleetRules";
import { useAuth } from "./AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

async function fetchPublicSettings() {
  const response = await fetch(`${API_BASE}/public-settings`);
  if (!response.ok) return { corporateEmailDomain: CORPORATE_EMAIL_DOMAIN };
  return response.json() as Promise<{ corporateEmailDomain: string }>;
}

function MailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 6h16v12H4z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14v2" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m3 3 18 18" />
      <path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-1.2" />
      <path d="M7.5 7.8C4.4 9.5 2.5 12 2.5 12s3.5 6 9.5 6c1.6 0 3-.4 4.2-1" />
      <path d="M10 6.2A9.8 9.8 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.2 2.8" />
    </svg>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [corporateEmailDomain, setCorporateEmailDomain] = useState(CORPORATE_EMAIL_DOMAIN);
  const { register, handleSubmit, formState, setError } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    let active = true;
    fetchPublicSettings()
      .then((settings) => {
        if (active) setCorporateEmailDomain(normalizeCorporateEmailDomain(settings.corporateEmailDomain));
      })
      .catch(() => {
        if (active) setCorporateEmailDomain(CORPORATE_EMAIL_DOMAIN);
      });
    return () => {
      active = false;
    };
  }, []);

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
      <div className="login-blob login-blob-primary" aria-hidden="true" />
      <div className="login-blob login-blob-secondary" aria-hidden="true" />

      <div className="login-shell">
      <section className="login-brand">
        <div className="login-inner-blob login-inner-blob-bottom" aria-hidden="true" />
        <div className="login-inner-blob login-inner-blob-left" aria-hidden="true" />

        <div>
          <div className="login-brand-logo">
            <span className="material-symbols-outlined" aria-hidden="true">local_shipping</span>
            <h1>FleetManager</h1>
          </div>
          <div className="login-brand-copy">
            <h2>Gestão inteligente para frotas corporativas de alto desempenho.</h2>
            <p>Painel administrativo centralizado para controle de veículos, usuários e auditoria em tempo real.</p>
          </div>
        </div>

        <div className="login-status">
          <span>SISTEMA DE AUDITORIA ATIVO</span>
          <strong>
            <i aria-hidden="true" />
            Versão 1.0.0 • Servidor Seguro
          </strong>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-panel-heading">
          <div className="login-mobile-logo">
            <span className="material-symbols-outlined" aria-hidden="true">local_shipping</span>
            <strong>FleetManager</strong>
          </div>
          <h2>Acessar Conta</h2>
          <p>Insira suas credenciais corporativas para continuar.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <label className="field login-field">
            <span>E-MAIL CORPORATIVO</span>
            <span className="input-icon-wrap">
              <span className="input-icon input-icon-svg">
                <MailIcon />
              </span>
              <input
                id="login-email"
                className="input login-input"
                type="email"
                placeholder={`nome${corporateEmailDomain}`}
                autoComplete="username"
                {...register("email")}
              />
            </span>
            {formState.errors.email?.message ? <small className="field-error">{formState.errors.email.message}</small> : null}
          </label>

          <label className="field login-field">
            <span className="login-label-row">
              <span>SENHA</span>
            </span>
            <span className="input-icon-wrap">
              <span className="input-icon input-icon-svg">
                <LockIcon />
              </span>
              <input
                id="login-password"
                className="input login-input login-password-input"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                {...register("password")}
              />
              <button
                className="login-password-toggle"
                type="button"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </span>
            {formState.errors.password?.message ? <small className="field-error">{formState.errors.password.message}</small> : null}
          </label>

          <div className="login-notice">
            <span className="material-symbols-outlined" aria-hidden="true">info</span>
            <p>Acesso permitido apenas para e-mails corporativos {corporateEmailDomain}.</p>
          </div>

          <button id="login-submit" className="btn btn-primary login-submit" type="submit" disabled={formState.isSubmitting}>
            Entrar no Sistema
            <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
          </button>
        </form>

        <footer className="login-footer">
          <p>© FleetManager Corporate Operations. Todos os direitos reservados.</p>
          <nav aria-label="Links de suporte">
            <a href="#" onClick={(event) => event.preventDefault()}>POLÍTICA DE PRIVACIDADE</a>
            <a href="#" onClick={(event) => event.preventDefault()}>SUPORTE TÉCNICO</a>
          </nav>
        </footer>
      </section>
      </div>
    </main>
  );
}
