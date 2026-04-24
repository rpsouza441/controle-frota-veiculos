# Scripts SQL - Banco de Dados `fleet_control`

Scripts para inicializar o banco MariaDB de desenvolvimento.

## Fonte oficial

A pasta oficial de scripts e:

```text
db/sql/
```

Use estes arquivos:

```text
db/sql/000_create_database.sql
db/sql/001_create_schema.sql
db/sql/002_seed_dev.sql
```

Arquivos SQL soltos na raiz de `db/`, quando existirem, devem ser tratados como legado e nao devem ser usados como referencia principal.

## Pre-requisito

Instancia MariaDB rodando em `192.168.1.242:3307` com imagem `mariadb:11.4`.

## Ordem de execucao

```bash
# 1. Criar banco e conceder permissoes (executar como root)
mysql -h 192.168.1.242 -P 3307 -u root -p < db/sql/000_create_database.sql

# 2. Criar tabelas (executar como app_user)
mysql -h 192.168.1.242 -P 3307 -u app_user -p fleet_control < db/sql/001_create_schema.sql

# 3. Inserir dados iniciais (executar como app_user)
mysql -h 192.168.1.242 -P 3307 -u app_user -p fleet_control < db/sql/002_seed_dev.sql
```

## Verificacao rapida

```bash
mysql -h 192.168.1.242 -P 3307 -u app_user -p fleet_control -e "SHOW TABLES;"
```

Resultado esperado:

```text
Tables_in_fleet_control
app_settings
audit_log_entries
clients
odometer_correction_requests
teams
users
vehicle_usage_clients
vehicle_usages
vehicles
```

## Como executar usando Docker

Se o MariaDB estiver rodando em um conteiner local, assumindo que o nome do conteiner seja `mariadb-frota`:

```bash
# 1. Criar banco e conceder permissoes (executar como root)
docker exec -i mariadb-frota mysql -u root -p < db/sql/000_create_database.sql

# 2. Criar tabelas (executar como app_user)
docker exec -i mariadb-frota mysql -u app_user -p fleet_control < db/sql/001_create_schema.sql

# 3. Inserir dados iniciais (executar como app_user)
docker exec -i mariadb-frota mysql -u app_user -p fleet_control < db/sql/002_seed_dev.sql
```

## Observacoes

- O script `000_create_database.sql` precisa de permissao de `root` ou usuario com `CREATE DATABASE` e `GRANT`.
- Os scripts `001_create_schema.sql` e `002_seed_dev.sql` podem ser executados com `app_user`.
- Para resetar os dados de desenvolvimento, execute `002_seed_dev.sql` novamente. Os inserts usam IDs fixos e `ON DUPLICATE KEY UPDATE`.
