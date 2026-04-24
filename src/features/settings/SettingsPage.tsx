import { useFleet } from "../../data/repositories/FleetContext";
import { useAuth } from "../auth/AuthContext";

export function SettingsPage() {
  const { state, updateSettings } = useFleet();
  const { user } = useAuth();
  const { settings } = state;

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
    </div>
  );
}
