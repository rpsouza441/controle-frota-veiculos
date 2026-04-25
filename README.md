# Controle de Frota de Veículos

Sistema web para controle de retirada, devolução e auditoria de veículos corporativos. A arquitetura da aplicação é baseada em:

```text
Frontend React -> API Node/Express -> MariaDB
```

O frontend React não conecta diretamente ao MariaDB. As credenciais de banco de dados e regras de negócio ficam centralizadas no backend, garantindo segurança e integridade das operações.

Este README é a fonte principal de verdade sobre a arquitetura, regras e estado atual do projeto.

## Estado Atual da Aplicação

- Aplicação full-stack funcional com frontend React, API Node/Express e banco de dados MariaDB.
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

- **Exclusão Lógica**: A exclusão real de registros não é permitida no sistema. Para preservar o histórico de usos e logs de auditoria, utiliza-se a inativação de registros (`status`).
- **Reset de Senha**: O reset de senhas por e-mail (esqueci minha senha) não está implementado na fase atual. A redefinição de senha é feita manualmente por um administrador na tela de gestão de usuários.
- **Permissões Acopladas**: As roles (`EMPLOYEE`, `MANAGER`, `ADMIN`) são fixas e suas permissões estão acopladas diretamente no código da API e do frontend.

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

1. **Testes Automatizados**: Implementação de testes automatizados na API utilizando Jest/Supertest, cobrindo as rotas principais, autenticação e regras de negócio de retirada/devolução.
2. **Containerização (Docker)**:
   - Criação de `Dockerfile` para o frontend e API.
   - Orquestração com `docker-compose.yml` para facilitar a inicialização do ambiente local (App + MariaDB) através de containers.
3. **Migrations Automatizadas**: Substituição dos scripts manuais de banco (`db/sql`) por uma ferramenta de migrations (como Knex ou Prisma) para gerenciar o esquema do banco de forma mais robusta.
