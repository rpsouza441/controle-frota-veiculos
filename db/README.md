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

Instancia MariaDB rodando com imagem `mariadb:11.4`.

Configure os dados de conexao por variaveis de ambiente ou substitua os placeholders nos comandos:

```bash
DB_HOST=<host-do-mariadb>
DB_PORT=<porta-do-mariadb>
DB_NAME=fleet_control
DB_USER=app_user
```

## Ordem de execucao

```bash
# 1. Criar banco e conceder permissoes (executar como root)
mysql -h "$DB_HOST" -P "$DB_PORT" -u root -p < db/sql/000_create_database.sql

# 2. Criar tabelas (executar como app_user)
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p "$DB_NAME" < db/sql/001_create_schema.sql

# 3. Inserir dados iniciais (executar como app_user)
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p "$DB_NAME" < db/sql/002_seed_dev.sql
```

## Verificacao rapida

```bash
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p "$DB_NAME" -e "SHOW TABLES;"
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

Se o MariaDB estiver rodando em um conteiner local com imagem `mariadb:11.4`, use o cliente `mariadb` dentro do conteiner.

Exemplo para um compose com:

```yaml
services:
  mariadb:
    image: mariadb:11.4
    container_name: mariadb
    restart: unless-stopped
```

Execute os comandos a partir da raiz do projeto:

```bash
# 1. Criar banco e conceder permissoes (executar como root)
docker exec -i mariadb mariadb -u root -p < db/sql/000_create_database.sql

# 2. Criar tabelas (executar como app_user)
docker exec -i mariadb mariadb -u app_user -p fleet_control < db/sql/001_create_schema.sql

# 3. Inserir dados iniciais (executar como app_user)
docker exec -i mariadb mariadb -u app_user -p fleet_control < db/sql/002_seed_dev.sql
```

Se preferir usar o ID do conteiner no lugar do nome, substitua `mariadb` pelo ID, por exemplo:

```bash
docker exec -i a585bbd0630c mariadb -u root -p < db/sql/000_create_database.sql
```

## Observacoes

- O script `000_create_database.sql` precisa de permissao de `root` ou usuario com `CREATE DATABASE` e `GRANT`.
- Os scripts `001_create_schema.sql` e `002_seed_dev.sql` podem ser executados com `app_user`.
- Para resetar os dados de desenvolvimento, execute `002_seed_dev.sql` novamente. Os inserts usam IDs fixos e `ON DUPLICATE KEY UPDATE`.
