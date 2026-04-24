INSERT INTO teams (id, name, active) VALUES
  ('team-sales', 'Comercial', TRUE),
  ('team-ops', 'Operações', TRUE),
  ('team-admin', 'Administrativo', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name), active = VALUES(active);

INSERT INTO users (id, name, email, password_hash, role, team_id, active) VALUES
  ('u-employee', 'Ricardo Lima', 'ricardo@empresa.com.br', NULL, 'EMPLOYEE', 'team-sales', TRUE),
  ('u-employee-2', 'Marina Costa', 'marina@empresa.com.br', NULL, 'EMPLOYEE', 'team-ops', TRUE),
  ('u-manager', 'Patricia Rocha', 'patricia@empresa.com.br', NULL, 'MANAGER', 'team-ops', TRUE),
  ('u-admin', 'Admin Frota', 'admin@empresa.com.br', NULL, 'ADMIN', 'team-admin', TRUE),
  ('u-inactive', 'Usuario Inativo', 'inativo@empresa.com.br', NULL, 'EMPLOYEE', 'team-sales', FALSE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  role = VALUES(role),
  team_id = VALUES(team_id),
  active = VALUES(active);

INSERT INTO vehicles (id, plate, model, current_km, team_id, status, active) VALUES
  ('v-1', 'BRA2E19', 'Fiat Strada Volcano', 42810, 'team-sales', 'DISPONIVEL', TRUE),
  ('v-2', 'RJO8A44', 'Chevrolet Onix Plus', 31540, 'team-sales', 'DISPONIVEL', TRUE),
  ('v-3', 'SPQ5D72', 'Toyota Corolla XEi', 58720, 'team-ops', 'DISPONIVEL', TRUE),
  ('v-4', 'MGS1C03', 'Renault Duster', 22490, 'team-ops', 'EM_USO', TRUE),
  ('v-5', 'BHZ9F61', 'VW Saveiro Robust', 73420, 'team-admin', 'DISPONIVEL', TRUE),
  ('v-6', 'ABC1D23', 'Ford Ka', 90110, 'team-sales', 'INATIVO', FALSE)
ON DUPLICATE KEY UPDATE
  model = VALUES(model),
  current_km = VALUES(current_km),
  team_id = VALUES(team_id),
  status = VALUES(status),
  active = VALUES(active);

INSERT INTO clients (id, name, active) VALUES
  ('c-1', 'Mercado Central Matriz', TRUE),
  ('c-2', 'Clinica Sao Lucas', TRUE),
  ('c-3', 'Construtora Horizonte', TRUE),
  ('c-4', 'Distribuidora Nova Rota', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name), active = VALUES(active);

INSERT INTO vehicle_usages (
  id, vehicle_id, user_id, team_id, origin, destination, purpose,
  withdrawal_km, withdrawal_at, return_km, return_at, return_note, status
) VALUES
  ('usage-1', 'v-3', 'u-employee-2', 'team-ops', 'Sede', 'Obra Zona Sul', 'Visita tecnica', 58410, '2026-04-20 08:30:00', 58720, '2026-04-20 17:10:00', 'Sem ocorrencias.', 'FECHADO'),
  ('usage-2', 'v-4', 'u-manager', 'team-ops', 'Sede', 'CD Norte', 'Auditoria operacional', 22490, '2026-04-24 08:15:00', NULL, NULL, NULL, 'ABERTO')
ON DUPLICATE KEY UPDATE
  vehicle_id = VALUES(vehicle_id),
  user_id = VALUES(user_id),
  team_id = VALUES(team_id),
  status = VALUES(status);

INSERT INTO vehicle_usage_clients (usage_id, client_id, client_name_snapshot) VALUES
  ('usage-1', 'c-3', 'Construtora Horizonte'),
  ('usage-2', 'c-4', 'Distribuidora Nova Rota')
ON DUPLICATE KEY UPDATE client_name_snapshot = VALUES(client_name_snapshot);

INSERT INTO odometer_correction_requests (
  id, vehicle_id, requested_by_user_id, informed_km, system_km, reason, status, created_at
) VALUES
  ('corr-1', 'v-2', 'u-employee', 31582, 31540, 'Painel indica quilometragem superior apos uso anterior.', 'PENDENTE', '2026-04-23 15:35:00')
ON DUPLICATE KEY UPDATE
  informed_km = VALUES(informed_km),
  system_km = VALUES(system_km),
  reason = VALUES(reason),
  status = VALUES(status);

INSERT INTO app_settings (setting_key, setting_value, updated_by_user_id) VALUES
  ('employees_can_see_in_use_vehicles', 'false', 'u-admin'),
  ('footer_brand_label', 'Espaço para sua marca', 'u-admin')
ON DUPLICATE KEY UPDATE
  setting_value = VALUES(setting_value),
  updated_by_user_id = VALUES(updated_by_user_id);

INSERT INTO audit_log_entries (id, created_at, actor_user_id, action, entity, summary) VALUES
  ('audit-1', '2026-04-20 17:10:00', 'u-employee-2', 'VEHICLE_RETURN', 'VehicleUsage', 'Devolucao do veiculo SPQ5D72 com KM 58720.')
ON DUPLICATE KEY UPDATE summary = VALUES(summary);
