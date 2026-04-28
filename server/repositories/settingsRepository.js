import { pool } from "../db.js";
import { defaultCorporateEmailDomain } from "../config.js";
import { normalizeCorporateEmailDomain } from "../utils/domain.js";

export function settingsFromRows(settingsRows) {
  return {
    employeesCanSeeInUseVehicles:
      settingsRows.find((row) => row.settingKey === "employees_can_see_in_use_vehicles")?.settingValue === "true",
    corporateEmailDomain: normalizeCorporateEmailDomain(
      settingsRows.find((row) => row.settingKey === "corporate_email_domain")?.settingValue || defaultCorporateEmailDomain,
    ),
    footerBrandLabel: settingsRows.find((row) => row.settingKey === "footer_brand_label")?.settingValue || "Espaço para sua marca",
  };
}

export async function getAppSettings() {
  const [settingsRows] = await pool.query("SELECT setting_key AS settingKey, setting_value AS settingValue FROM app_settings");
  return settingsFromRows(settingsRows);
}

export async function updateSettings(connection, settings, actorUserId) {
  await connection.execute(
    `INSERT INTO app_settings (setting_key, setting_value, updated_by_user_id)
     VALUES ('employees_can_see_in_use_vehicles', ?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by_user_id = VALUES(updated_by_user_id)`,
    [settings.employeesCanSeeInUseVehicles ? "true" : "false", actorUserId],
  );
  await connection.execute(
    `INSERT INTO app_settings (setting_key, setting_value, updated_by_user_id)
     VALUES ('corporate_email_domain', ?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by_user_id = VALUES(updated_by_user_id)`,
    [settings.corporateEmailDomain, actorUserId],
  );
}
