import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { TextInput } from "../../components/forms/FormField";
import { normalizeCorporateEmailDomain } from "../../domain/rules/fleetRules";
import { useFleet } from "../../data/repositories/FleetContext";
import { useAuth } from "../auth/AuthContext";

export function SettingsPage() {
  const { state, updateSettings } = useFleet();
  const { user } = useAuth();
  const { settings } = state;
  const [corporateEmailDomain, setCorporateEmailDomain] = useState(settings.corporateEmailDomain);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [domainSaved, setDomainSaved] = useState(false);

  useEffect(() => {
    setCorporateEmailDomain(settings.corporateEmailDomain);
  }, [settings.corporateEmailDomain]);

  async function saveCorporateEmailDomain() {
    if (!user) return;
    const normalizedDomain = normalizeCorporateEmailDomain(corporateEmailDomain);
    if (!normalizedDomain.includes(".") || normalizedDomain.length < 4) {
      setDomainError("Informe um dominio valido, como @empresa.com.br.");
      setDomainSaved(false);
      return;
    }

    setDomainError(null);
    setDomainSaved(false);
    try {
      const savedSettings = await updateSettings(
        {
          ...settings,
          corporateEmailDomain: normalizedDomain,
        },
        user.id,
      );
      if (savedSettings.corporateEmailDomain !== normalizedDomain) {
        setDomainError("A API nao confirmou o novo dominio. Reinicie o servidor da API e tente novamente.");
        return;
      }
      setCorporateEmailDomain(normalizedDomain);
      setDomainSaved(true);
    } catch (error) {
      setDomainError(error instanceof Error ? error.message : "Nao foi possivel salvar o dominio.");
    }
  }

  return (
    <div className="page-stack narrow">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Administração</span>
          <h1>Configurações</h1>
        </div>
      </section>

      <section className="panel">
        <h2 className="settings-section-title">Dashboard dos funcionários</h2>
        <p className="settings-description">
          Controle o que os funcionários podem visualizar no painel principal.
        </p>

        <label className="toggle-field" id="toggle-employees-see-in-use">
          <span className="toggle-wrap">
            <input
              type="checkbox"
              checked={settings.employeesCanSeeInUseVehicles}
              onChange={(e) =>
                user &&
                updateSettings(
                  {
                    ...settings,
                    employeesCanSeeInUseVehicles: e.target.checked,
                  },
                  user.id,
                )
              }
            />
            <span className="toggle-slider" />
          </span>
          <span className="toggle-label">
            Permitir que funcionários vejam veículos em uso
          </span>
        </label>

        <p className="settings-hint">
          Quando ativado, os funcionários visualizam os veículos em uso no
          dashboard, incluindo o nome de quem está utilizando. Quando
          desativado, apenas veículos disponíveis são exibidos.
        </p>
      </section>

      <section className="panel">
        <h2 className="settings-section-title">Domínio corporativo</h2>
        <p className="settings-description">
          Defina o domínio aceito no cadastro de usuários e exibido no login.
        </p>

        <div className="settings-inline-form">
          <label className="field">
            <span>Domínio de e-mail</span>
            <TextInput
              value={corporateEmailDomain}
              onChange={(event) => setCorporateEmailDomain(event.target.value)}
              placeholder="@empresa.com.br"
            />
            {domainError ? <small className="field-error">{domainError}</small> : null}
            {domainSaved ? <small className="settings-success">Domínio salvo em app_settings.</small> : null}
          </label>
          <Button type="button" onClick={() => void saveCorporateEmailDomain()}>
            Salvar domínio
          </Button>
        </div>

        <p className="settings-hint">
          O valor é normalizado automaticamente com @ no início. Novos
          cadastros precisam usar este domínio. Usuários já cadastrados
          continuam conseguindo entrar, para evitar bloqueio acidental durante a
          transição.
        </p>
      </section>
    </div>
  );
}
