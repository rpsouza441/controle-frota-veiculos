# Controle de Frota de Veiculos

MVP web para controle de retirada, devolucao e auditoria de veiculos corporativos. O fluxo da aplicacao e:

```text
Frontend React -> API Node/Express -> MariaDB
```

O React nao conecta diretamente ao MariaDB. Credenciais de banco ficam somente no backend, via variaveis de ambiente.

## Funcionalidades

- Login por usuarios da aplicacao com senha hasheada e JWT.
- Dashboard com veiculos disponiveis e em uso.
- Retirada de veiculo com validacao de KM, cliente, origem, destino e finalidade.
- Devolucao de veiculo com atualizacao de quilometragem.
- Solicitacao de correcao de KM quando ha divergencia no odometro.
- Aprovacao ou rejeicao de correcoes por gestor/admin.
- Historico de uso com filtros e exportacao CSV.
- Gestao de veiculos, usuarios e clientes sugeridos.
- Configuracao admin para permitir ou bloquear que funcionarios vejam carros em uso.
- Exibicao do nome de quem esta usando um veiculo em uso.
- Log de auditoria persistido no MariaDB.
- Rodape com espaco para marca da empresa.

## Stack

- React 18
- Vite
- TypeScript
- React Router
- React Hook Form
- Zod
- TanStack Table
- Node.js + Express
- MariaDB
- bcryptjs
- jsonwebtoken
- CSS puro com variaveis e layout responsivo

## Rodando localmente

Instale as dependencias:

```bash
npm install
```

Configure a conexao com o MariaDB e o segredo JWT no `.env`, usando `.env.example` como base:

```env
DB_HOST=127.0.0.1
DB_PORT=3307
DB_NAME=fleet_control
DB_USER=app_user
DB_PASSWORD=change-me

API_PORT=3333
VITE_API_BASE_URL=/api
JWT_SECRET=change-this-dev-secret
JWT_EXPIRES_IN=8h

DB_ADMIN_USER=root
DB_ADMIN_PASSWORD=
```

Prepare o banco de dados:

```bash
npm run db:apply
```

Esse comando aplica, em ordem:

```text
db/sql/000_create_database.sql
db/sql/001_create_schema.sql
db/sql/002_seed_dev.sql
```

O script `000_create_database.sql` usa `DB_ADMIN_USER` e `DB_ADMIN_PASSWORD`, pois cria o banco e concede permissoes. Os scripts `001_create_schema.sql` e `002_seed_dev.sql` usam `DB_USER`, `DB_PASSWORD` e `DB_NAME`.

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Esse comando sobe dois processos:

- API local em `http://127.0.0.1:3333`
- Frontend Vite em `http://localhost:5173`

## Usuarios de desenvolvimento

Os usuarios abaixo sao criados por `db/sql/002_seed_dev.sql`. Todos usam a senha de desenvolvimento:

```text
Senha@123
```

- Funcionario: `ricardo@empresa.com.br`
- Gestor: `patricia@empresa.com.br`
- Admin: `admin@empresa.com.br`

As senhas sao armazenadas no banco apenas como hash bcrypt no campo `users.password_hash`.

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

Observacao: o script `npm run lint` esta reservado no `package.json`, mas a configuracao ESLint ainda nao foi adicionada.

## Banco MariaDB de desenvolvimento

O projeto consegue preparar e popular uma instancia MariaDB ja existente. A aplicacao nao sobe o MariaDB sozinha nesta fase, mas fornece scripts para criar o banco, criar tabelas e inserir dados iniciais.

Configure a conexao no `.env` antes de executar os comandos. Use `.env.example` como referencia e mantenha credenciais reais fora do Git.

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

Se o banco ja existe e o schema ja foi aplicado, rode apenas uma etapa especifica:

```bash
npm run db:schema
npm run db:seed
```

Para resetar os dados de desenvolvimento, execute `npm run db:seed` novamente. Os inserts usam IDs fixos e `ON DUPLICATE KEY UPDATE`.

Detalhes operacionais de ambiente ficam documentados em `docs/database-dev.md`. A pasta `docs/` esta ignorada pelo Git.

## Mocks e fixtures

O runtime da aplicacao nao depende de `src/data/mock/*` nem possui fallback para dados mockados quando a API falha. Fixtures antigas de desenvolvimento devem ficar apenas em `src/dev/fixtures` ou `src/test/fixtures`, sem import em codigo de producao.

## Docker futuramente

Ainda nao existe `Dockerfile` nem `docker-compose.yml` neste MVP. Quando a aplicacao entrar na etapa de containerizacao, o fluxo esperado sera:

1. Criar um `Dockerfile` para empacotar frontend e API Node/Express.
2. Criar um `docker-compose.yml` para subir app e MariaDB quando necessario.
3. Passar configuracoes por um arquivo `.env` informado ao Docker ou pelo ambiente do host.
4. Usar variaveis de ambiente, sem senhas reais hardcoded.
5. Executar:

```bash
docker compose up -d --build
```

## Documentacao local

- `docs/prompt.md`: escopo original do MVP.
- `docs/status-mvp.md`: status da primeira entrega.
- `docs/status2-mvp.md`: evolucao com MariaDB, configuracao admin e ajustes de layout.
- `docs/layout-review-stitch.md`: revisao do layout com base no Stitch.
- `docs/database-dev.md`: dados da instancia MariaDB de desenvolvimento.
- `docs/botao-detalhes-dashboard.md`: decisao sobre o botao de detalhes no dashboard.

## Referencia visual

O layout segue os modelos gerados no Stitch em `stitch/corporate-fleet-control-system/`, com foco em interface operacional, tabelas densas, formularios claros, paleta azul/slate e experiencia responsiva.
