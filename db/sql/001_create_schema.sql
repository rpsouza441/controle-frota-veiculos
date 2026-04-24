CREATE DATABASE IF NOT EXISTS fleet_control
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fleet_control;

CREATE TABLE IF NOT EXISTS teams (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  role ENUM('EMPLOYEE', 'MANAGER', 'ADMIN') NOT NULL,
  team_id VARCHAR(64) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_team FOREIGN KEY (team_id) REFERENCES teams(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehicles (
  id VARCHAR(64) PRIMARY KEY,
  plate VARCHAR(16) NOT NULL UNIQUE,
  model VARCHAR(160) NOT NULL,
  current_km INT NOT NULL,
  team_id VARCHAR(64) NOT NULL,
  status ENUM('DISPONIVEL', 'EM_USO', 'INATIVO') NOT NULL DEFAULT 'DISPONIVEL',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_vehicles_team FOREIGN KEY (team_id) REFERENCES teams(id),
  CONSTRAINT ck_vehicles_current_km CHECK (current_km >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clients (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_clients_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehicle_usages (
  id VARCHAR(64) PRIMARY KEY,
  vehicle_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  team_id VARCHAR(64) NOT NULL,
  origin VARCHAR(190) NOT NULL,
  destination VARCHAR(190) NOT NULL,
  purpose TEXT NOT NULL,
  withdrawal_km INT NOT NULL,
  withdrawal_at DATETIME NOT NULL,
  return_km INT NULL,
  return_at DATETIME NULL,
  return_note TEXT NULL,
  status ENUM('ABERTO', 'FECHADO', 'CANCELADO') NOT NULL DEFAULT 'ABERTO',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_vehicle_usages_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  CONSTRAINT fk_vehicle_usages_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_vehicle_usages_team FOREIGN KEY (team_id) REFERENCES teams(id),
  CONSTRAINT ck_vehicle_usages_withdrawal_km CHECK (withdrawal_km >= 0),
  CONSTRAINT ck_vehicle_usages_return_km CHECK (return_km IS NULL OR return_km >= withdrawal_km),
  CONSTRAINT ck_vehicle_usages_return_at CHECK (return_at IS NULL OR return_at >= withdrawal_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehicle_usage_clients (
  usage_id VARCHAR(64) NOT NULL,
  client_id VARCHAR(64) NOT NULL,
  client_name_snapshot VARCHAR(190) NOT NULL,
  PRIMARY KEY (usage_id, client_id),
  CONSTRAINT fk_usage_clients_usage FOREIGN KEY (usage_id) REFERENCES vehicle_usages(id),
  CONSTRAINT fk_usage_clients_client FOREIGN KEY (client_id) REFERENCES clients(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS odometer_correction_requests (
  id VARCHAR(64) PRIMARY KEY,
  vehicle_id VARCHAR(64) NOT NULL,
  requested_by_user_id VARCHAR(64) NOT NULL,
  informed_km INT NOT NULL,
  system_km INT NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('PENDENTE', 'APROVADA', 'REJEITADA') NOT NULL DEFAULT 'PENDENTE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by_user_id VARCHAR(64) NULL,
  reviewed_at DATETIME NULL,
  review_note TEXT NULL,
  CONSTRAINT fk_corrections_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  CONSTRAINT fk_corrections_requested_by FOREIGN KEY (requested_by_user_id) REFERENCES users(id),
  CONSTRAINT fk_corrections_reviewed_by FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id),
  CONSTRAINT ck_corrections_informed_km CHECK (informed_km >= 0),
  CONSTRAINT ck_corrections_system_km CHECK (system_km >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_log_entries (
  id VARCHAR(64) PRIMARY KEY,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actor_user_id VARCHAR(64) NULL,
  action VARCHAR(80) NOT NULL,
  entity VARCHAR(120) NOT NULL,
  summary TEXT NOT NULL,
  metadata_json JSON NULL,
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS app_settings (
  setting_key VARCHAR(120) PRIMARY KEY,
  setting_value VARCHAR(255) NOT NULL,
  updated_by_user_id VARCHAR(64) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_app_settings_updated_by FOREIGN KEY (updated_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, active);
CREATE INDEX IF NOT EXISTS idx_vehicles_status_active ON vehicles(status, active);
CREATE INDEX IF NOT EXISTS idx_vehicle_usages_vehicle_status ON vehicle_usages(vehicle_id, status);
CREATE INDEX IF NOT EXISTS idx_vehicle_usages_user_status ON vehicle_usages(user_id, status);
CREATE INDEX IF NOT EXISTS idx_vehicle_usages_withdrawal_at ON vehicle_usages(withdrawal_at);
CREATE INDEX IF NOT EXISTS idx_corrections_status_created ON odometer_correction_requests(status, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_log_entries(created_at);
