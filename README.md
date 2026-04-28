# Controle de Frota de Veículos

Sistema web para controle de retirada, devolução e auditoria de veículos corporativos. A arquitetura atual é backend-agnostic no frontend e modular por camadas no backend:

```text
Frontend React
  -> application/usecases
  -> domain/ports
  -> infra/repositories/http | infra/repositories/local

Backend atual HTTP:
Express routes -> services -> repositories -> MariaDB
```

O frontend React não depende diretamente de Express, MariaDB ou REST. Páginas e contextos consomem casos de uso e portas (`AuthRepository`, `FleetRepository`), e a implementação concreta é escolhida no bootstrap por `VITE_DATA_PROVIDER=http|local`. O provider padrão continua sendo HTTP para preservar o comportamento atual.

O backend HTTP atual continua sendo Node/Express com MariaDB, mas foi separado em `routes`, `services`, `repositories`, `middleware` e `validation`, preservando os endpoints `/api/*` para compatibilidade.

Este README é a fonte principal de verdade sobre a arquitetura, regras e estado atual do projeto.

## Estado Atual da Aplicação

- Aplicação full-stack funcional com frontend React, API Node/Express e banco de dados MariaDB.
- Frontend desacoplado do transporte por portas de domínio, casos de uso e adapters HTTP/local.
- Provider local opcional com `localStorage` para execução sem API, via `VITE_DATA_PROVIDER=local`.
- Backend Express modularizado em camadas (`server/routes`, `server/services`, `server/repositories`, `server/middleware`, `server/validation`).
- Login seguro com senhas criptografadas em `bcrypt` e gerenciamento de sessão via tokens `JWT`.
- Rotas sensíveis protegidas no backend por autenticação e controle de perfis (roles).
- Validação rigorosa de dados de entrada na API utilizando `Zod`.
- Auditoria de dados persistida em banco e eventos relevantes logados no terminal da API para rastreabilidade.
- Layout operacional responsivo adaptável para desktop, tablets e mobile.

## Perfis de Usuário (Roles)

Os perfis de acesso do sistema são os seguintes:

- `EMPLOYEE` (Funcionário): Pode visualizar o dashboard, retirar veículo, devolver veículo e solicitar correção de quilometragem (KM).
- `MANAGER` (Gestor): Possui as permissões de funcionário e também pode visualizar o histórico geral e aprovar ou rejeitar solicitações de correção de KM.
- `ADMIN` (Administrador): Possui acesso total. Pode realizar todas as ações de gestores e também gerenciar veículos, usuários, equipes, clientes, configurações globais e visualizar os logs de auditoria.

## Funcionalidades Principais

- Autenticação de usuários com reidratação de sessão via `/api/auth/me`.
- Dashboard em tempo real com veículos disponíveis e em uso.
- Configuração de privacidade para permitir ou bloquear que funcionários vejam carros em uso por terceiros.
- Exibição do nome do colaborador que está utilizando um veículo.
- Processo de retirada de veículo com validação de KM, cliente, origem, destino e finalidade.
- Bloqueios de concorrência:
  - Impede que um usuário abra duas retiradas simultâneas.
  - Impede que um veículo seja retirado por mais de um usuário ao mesmo tempo.
- Processo de devolução com atualização de quilometragem (não pode ser menor que a de retirada).
- Devolução forçada por administradores para carros em uso, útil para esquecimentos.
- Fluxo de correção de KM: caso o odômetro físico divirja do sistema, o usuário solicita a correção, a retirada fica bloqueada e aguarda aprovação de um gestor/admin.
- Histórico completo de uso com filtros de busca e exportação para CSV.
- Gestão (CRUD) de veículos, usuários, equipes e clientes (com suporte a autocompletar na retirada).
- Inativação lógica (soft delete) para veículos, usuários, equipes e clientes, preservando a integridade histórica.
- Configuração de domínio corporativo de e-mail e customização de marca (rodapé) via painel administrativo.
- Tratamento visual de erros e indisponibilidade de API.

## Decisões de Produto e Arquitetura

- **Ports and Adapters no Frontend**: A UI depende de casos de uso e contratos de domínio, não de `fetch` direto. A implementação HTTP fica em `src/infra/repositories/http`, e a alternativa local em `src/infra/repositories/local`.
- **Composição no Bootstrap**: `src/app/providers/dataProviderFactory.ts` decide qual provider injetar nos contextos. O default é `http`.
- **Backend Modular Compatível**: A API Express foi organizada em camadas sem alterar o contrato REST existente.
- **Exclusão Lógica**: A exclusão real de registros não é permitida no sistema. Para preservar o histórico de usos e logs de auditoria, utiliza-se a inativação de registros (`status`).
- **Reset de Senha**: O reset de senhas por e-mail (esqueci minha senha) não está implementado na fase atual. A redefinição de senha é feita manualmente por um administrador na tela de gestão de usuários.
- **Permissões Acopladas**: As roles (`EMPLOYEE`, `MANAGER`, `ADMIN`) são fixas e suas permissões estão acopladas diretamente no código da API e do frontend.

## Estrutura de Arquitetura

```text
src/
  app/providers/                 # composicao e escolha de data provider
  application/dto/                # DTOs internos de aplicacao
  application/selectors/          # estado derivado e indices por id
  application/usecases/           # casos de uso de auth e frota
  domain/errors/                  # erros padronizados
  domain/ports/                   # contratos AuthRepository e FleetRepository
  infra/http/                     # cliente HTTP base
  infra/repositories/http/        # adapters HTTP
  infra/repositories/local/       # adapters locais/mock
  features/                       # telas, contextos e componentes de fluxo

server/
  app.js                          # composicao Express
  routes/                         # endpoints HTTP
  services/                       # orquestracao transacional e regras de fluxo
  repositories/                   # queries e persistencia
  middleware/                     # auth, roles e erro
  validation/                     # schemas Zod e helper validate
  utils/                          # datas, ids, logs e normalizacoes
```

Mais detalhes e plano incremental ficam em `docs/backend-agnostic-refactor/README.md`.

## Regras de Negócio Importantes

- Usuário inativo não consegue realizar login.
- Veículo inativo não pode ser retirado.
- Um veículo em uso não pode ser inativado; é necessário registrar sua devolução primeiro.
- Uma equipe que possui usuários ou veículos ativos vinculados não pode ser inativada.
- Equipes inativas não aparecem como opções para novas associações, mas continuam visíveis em registros históricos.
- É obrigatório informar o cliente na retirada, utilizando o campo de autocompletar.
- A data/hora de devolução nunca pode ser anterior à data/hora de retirada.
- Alterações administrativas sensíveis geram logs de auditoria automaticamente.
- O domínio corporativo configurado é validado para novos cadastros de usuários. Usuários antigos com domínios diferentes continuam acessando o sistema para evitar bloqueios acidentais.

## Tecnologias Utilizadas (Stack)

- **Frontend**: React 18, Vite, TypeScript, React Router, React Hook Form, Zod, TanStack Table, CSS puro com variáveis CSS.
- **Backend**: Node.js, Express, MariaDB, bcryptjs, jsonwebtoken, Zod.

## Executando o Projeto Localmente

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente baseando-se no arquivo `.env.example`. Crie o arquivo `.env`:
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3307
   DB_NAME=fleet_control
   DB_USER=app_user
   DB_PASSWORD=change-me

   API_PORT=3333
   VITE_API_BASE_URL=/api
   VITE_DATA_PROVIDER=http
   JWT_SECRET=change-this-dev-secret
   JWT_EXPIRES_IN=8h
   CORPORATE_EMAIL_DOMAIN=@empresa.com.br
   VITE_CORPORATE_EMAIL_DOMAIN=@empresa.com.br

   DB_ADMIN_USER=root
   DB_ADMIN_PASSWORD=
   ```

3. Prepare o banco de dados e popule com dados iniciais:
   ```bash
   npm run db:apply
   ```
   *Nota: O script `db:apply` executa a criação do banco, schema e seed dos dados de desenvolvimento localizados na pasta `db/sql/`.*

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   Isso iniciará simultaneamente a API em `http://127.0.0.1:3333` e o frontend em `http://localhost:5173`.

Para rodar o frontend sem backend, use `VITE_DATA_PROVIDER=local`. Esse modo usa dados locais em `localStorage` e fixtures de desenvolvimento, indicado para testes manuais e evolução de UI.

## Executando via Docker (Produção Local)

A aplicação conta com configurações completas para orquestração via Docker Compose.

1. Acesse o diretório docker:
   ```bash
   cd docker
   ```

2. Crie seu arquivo de ambiente copiando o exemplo e ajustando as credenciais (veja as instruções dentro do arquivo para gerar hashes de segurança):
   ```bash
   cp .env.example .env
   ```

3. Suba os containers da aplicação e do banco de dados:
   ```bash
   docker compose --env-file .env up -d --build
   ```

4. *Na primeira execução*, popule o banco de dados via container:
   ```bash
   docker compose exec app npm run db:apply
   ```

A API e o frontend estarão acessíveis na porta `3333` (`http://localhost:3333`).

## Usuários de Desenvolvimento

Os usuários abaixo são criados via script de seed com a senha padrão `Senha@123`:

- Funcionário: `ricardo@empresa.com.br`
- Gestor: `patricia@empresa.com.br`
- Admin: `admin@empresa.com.br`

Para testar a redefinição de senhas, entre como administrador, edite um usuário e preencha o campo "Nova senha".

## Configurações Globais da Aplicação

As configurações globais do sistema estão armazenadas na tabela `app_settings` e podem ser editadas pelo administrador:

- `employees_can_see_in_use_vehicles`: Define se funcionários podem ver os veículos que estão atualmente em uso por outras pessoas.
- `corporate_email_domain`: Domínio exigido no cadastro e exibido no login.
- `footer_brand_label`: Texto exibido no rodapé do sistema.

## Scripts Disponíveis

```bash
npm run dev        # Roda frontend e API simultaneamente
npm run dev:api    # Roda apenas a API Node
npm run dev:web    # Roda apenas o frontend Vite
npm run build      # Faz o build do frontend para producao
npm run preview    # Roda o servidor de preview do frontend
npm run db:apply   # Cria banco, schema e insere dados iniciais
npm run db:schema  # Aplica apenas o schema (tabelas)
npm run db:seed    # Insere apenas os dados de desenvolvimento (fixtures)
```

## Referência Visual

O layout foca em uma interface operacional eficiente com tabelas densas, formulários limpos, paleta de cores azul/slate e usabilidade totalmente responsiva.

## Futuras Funcionalidades (Roadmap)

Os próximos passos para evolução da arquitetura do sistema incluem:

1. **Testes Automatizados**: Implementação de Vitest para use-cases e testes de contrato dos repositories; na API, smoke tests das rotas críticas.
2. **Migrations Automatizadas**: Substituição dos scripts manuais de banco (`db/sql`) por uma ferramenta de migrations (como Knex ou Prisma) para gerenciar o esquema do banco de forma mais robusta.
3. **Múltiplos Backends**: Adicionar novos adapters para BaaS, SDK externo ou local-first sem alterar páginas/componentes.
