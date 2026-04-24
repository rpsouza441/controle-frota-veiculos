# Controle de Frota de Veículos

MVP web para controle de retirada, devolução e auditoria de veículos corporativos. A aplicação atende uma frota pequena, com perfis de funcionário, gestor e administrador, e está preparada para evoluir de dados mockados para uma API REST com MariaDB.

## Funcionalidades

- Login fake para desenvolvimento com validação de e-mail corporativo.
- Dashboard com veículos disponíveis e em uso.
- Retirada de veículo com validação de KM, cliente, origem, destino e finalidade.
- Devolução de veículo com atualização de quilometragem.
- Solicitação de correção de KM quando há divergência no odômetro.
- Aprovação ou rejeição de correções por gestor/admin.
- Histórico de uso com filtros e exportação CSV.
- Gestão de veículos, usuários e clientes sugeridos.
- Configuração admin para permitir ou bloquear que funcionários vejam carros em uso.
- Exibição do nome de quem está usando um veículo em uso.
- Log de auditoria mockado.
- Rodapé com espaço para marca da empresa.

## Stack

- React 18
- Vite
- TypeScript
- React Router
- React Hook Form
- Zod
- TanStack Table
- CSS puro com variáveis e layout responsivo

O frontend agora consome uma API Node/Express local em `/api`. A API persiste os dados no MariaDB e mantém a separação entre domínio, regras, schemas, interface e dados.

## Rodando localmente

Instale as dependências:

```bash
npm install
```

Configure a conexão com o MariaDB no `.env`, usando `.env.example` como base:

```env
DB_HOST=127.0.0.1
DB_PORT=3307
DB_NAME=fleet_control
DB_USER=app_user
DB_PASSWORD=change-me

DB_ADMIN_USER=root
DB_ADMIN_PASSWORD=
```

Prepare o banco de dados:

```bash
npm run db:apply
```

Esse comando aplica, em ordem, os scripts oficiais de banco:

```text
db/sql/000_create_database.sql
db/sql/001_create_schema.sql
db/sql/002_seed_dev.sql
```

O script `000_create_database.sql` usa `DB_ADMIN_USER` e `DB_ADMIN_PASSWORD`, pois cria o banco e concede permissões. Os scripts `001_create_schema.sql` e `002_seed_dev.sql` usam `DB_USER`, `DB_PASSWORD` e `DB_NAME`.

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Esse comando sobe dois processos:

- API local em `http://127.0.0.1:3333`
- Frontend Vite em `http://localhost:5173`

A aplicação ficará disponível em:

```text
http://localhost:5173/
```

## Usuários mockados

Qualquer senha preenchida é aceita nesta fase.

- Funcionário: `ricardo@empresa.com.br`
- Gestor: `patricia@empresa.com.br`
- Admin: `admin@empresa.com.br`

## Scripts

```bash
npm run dev
npm run dev:api
npm run dev:web
npm run build
npm run preview
npm run db:apply
npm run db:schema
npm run db:seed
```

Observação: o script `npm run lint` está reservado no `package.json`, mas a configuração ESLint ainda não foi adicionada.

## Banco MariaDB de desenvolvimento

O projeto consegue preparar e popular uma instância MariaDB já existente. A aplicação não sobe o MariaDB sozinha nesta fase, mas fornece os scripts para criar o banco, criar tabelas e inserir dados iniciais.

Configure a conexão no `.env` antes de executar os comandos. Use `.env.example` como referência e mantenha credenciais reais fora do Git.

Os scripts SQL oficiais ficam em:

```text
db/sql/
  000_create_database.sql
  001_create_schema.sql
  002_seed_dev.sql
```

Para configurar tudo pelo app/script npm:

```bash
npm run db:apply
```

Esse comando tenta executar:

- `000_create_database.sql`: cria o banco e concede permissões, usando usuário administrativo.
- `001_create_schema.sql`: cria tabelas, constraints e índices.
- `002_seed_dev.sql`: popula dados iniciais de desenvolvimento.

Se o banco já existe e o schema já foi aplicado, rode apenas uma etapa específica:

```bash
npm run db:schema
npm run db:seed
```

Para resetar os dados de desenvolvimento, execute `npm run db:seed` novamente. Os inserts usam IDs fixos e `ON DUPLICATE KEY UPDATE`.

Detalhes operacionais de ambiente ficam documentados em `docs/database-dev.md`. A pasta `docs/` está ignorada pelo Git.

## Usando Docker futuramente

Ainda não existe `Dockerfile` nem `docker-compose.yml` neste MVP. Quando a aplicação entrar na etapa de containerização, o fluxo esperado será:

1. Criar um `Dockerfile` para empacotar frontend e API Node/Express.
2. Criar um `docker-compose.yml` para subir app e MariaDB quando necessário.
3. Passar as configurações por um arquivo `.env` informado ao Docker ou pelo ambiente do host.
4. Usar as mesmas variáveis já consumidas hoje pelo app: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_ADMIN_USER`, `DB_ADMIN_PASSWORD`, `API_PORT` e `VITE_API_BASE_URL`.
5. Executar:

```bash
docker compose up -d --build
```

Exemplo conceitual de serviços futuros:

```text
app: React/Vite + API Node/Express
db: mariadb:11.4
```

O backend local atual já usa MariaDB e lê a configuração via variáveis de ambiente. No Docker, a ideia é manter esse mesmo contrato: o container recebe o `.env`, sobe a aplicação e aponta para o banco configurado.

## Documentação local

- `docs/prompt.md`: escopo original do MVP.
- `docs/status-mvp.md`: status da primeira entrega.
- `docs/status2-mvp.md`: evolução com MariaDB, configuração admin e ajustes de layout.
- `docs/layout-review-stitch.md`: revisão do layout com base no Stitch.
- `docs/database-dev.md`: dados da instância MariaDB de desenvolvimento.

## Referência visual

O layout segue os modelos gerados no Stitch em `stitch/corporate-fleet-control-system/`, com foco em interface operacional, tabelas densas, formulários claros, paleta azul/slate e experiência responsiva.
