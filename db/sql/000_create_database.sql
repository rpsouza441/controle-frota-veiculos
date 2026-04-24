-- ============================================================
-- 000_create_database.sql
-- Cria o banco fleet_control e garante permissoes ao app_user.
-- Executar com root ou usuario com permissao de CREATE/GRANT.
-- ============================================================

CREATE DATABASE IF NOT EXISTS `fleet_control`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON `fleet_control`.* TO 'app_user'@'%';
FLUSH PRIVILEGES;
