export async function ensureVehicleCanBeInactivated(connection, vehicle) {
  if (vehicle.active) return;
  const [rows] = await connection.execute(
    "SELECT id FROM vehicle_usages WHERE vehicle_id = ? AND status = 'ABERTO' LIMIT 1",
    [vehicle.id],
  );
  if (rows[0]) {
    const error = new Error("Veiculo em uso nao pode ser inativado. Registre a devolucao antes.");
    error.status = 409;
    throw error;
  }
}

export async function ensureTeamCanBeInactivated(connection, team) {
  if (team.active) return;
  const [activeUsers] = await connection.execute("SELECT id FROM users WHERE team_id = ? AND active = TRUE LIMIT 1", [team.id]);
  const [activeVehicles] = await connection.execute("SELECT id FROM vehicles WHERE team_id = ? AND active = TRUE LIMIT 1", [team.id]);
  if (activeUsers[0] || activeVehicles[0]) {
    const error = new Error("Equipe com usuarios ou veiculos ativos nao pode ser inativada.");
    error.status = 409;
    throw error;
  }
}

export async function upsertVehicle(connection, vehicle, status) {
  await connection.execute(
    `INSERT INTO vehicles (id, plate, model, current_km, team_id, status, active)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE plate = VALUES(plate), model = VALUES(model), current_km = VALUES(current_km),
      team_id = VALUES(team_id), status = VALUES(status), active = VALUES(active)`,
    [vehicle.id, vehicle.plate, vehicle.model, vehicle.currentKm, vehicle.teamId, status, vehicle.active],
  );
}

export async function upsertTeam(connection, team) {
  await connection.execute(
    `INSERT INTO teams (id, name, active)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), active = VALUES(active)`,
    [team.id, team.name, team.active],
  );
}

export async function upsertClient(pool, client) {
  await pool.execute(
    `INSERT INTO clients (id, name, active)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), active = VALUES(active)`,
    [client.id, client.name, client.active],
  );
}
