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

O frontend ainda usa repository mockado em memória. A estrutura de domínio, regras, schemas e dados foi separada para facilitar a troca futura por API REST.

## Rodando localmente

Instale as dependências:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

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
npm run build
npm run preview
```

Observação: o script `npm run lint` está reservado no `package.json`, mas a configuração ESLint ainda não foi adicionada.

## Banco MariaDB de desenvolvimento

Há uma instância MariaDB para desenvolvimento:

- Imagem: `mariadb:11.4`
- Host/IP: `192.168.1.242`
- Porta: `3307`
- Usuário: `app_user`
- Banco sugerido: `fleet_control`

Os scripts SQL ficam em:

```text
db/sql/
  001_create_schema.sql
  002_seed_dev.sql
```

Execução sugerida:

```bash
mysql -h 192.168.1.242 -P 3307 -u app_user -p < db/sql/001_create_schema.sql
mysql -h 192.168.1.242 -P 3307 -u app_user -p fleet_control < db/sql/002_seed_dev.sql
```

A senha e mais detalhes operacionais ficam documentados em `docs/database-dev.md`. A pasta `docs/` está ignorada pelo Git.

## Usando Docker futuramente

Ainda não existe `Dockerfile` nem `docker-compose.yml` neste MVP. Quando a aplicação entrar na etapa de containerização, o fluxo esperado será:

1. Criar um `Dockerfile` para build do frontend com Node e servir os arquivos estáticos com Nginx ou outro servidor HTTP.
2. Criar um `docker-compose.yml` para subir frontend, API futura e MariaDB quando necessário.
3. Configurar variáveis de ambiente para URL da API e conexão com banco.
4. Executar:

```bash
docker compose up -d --build
```

Exemplo conceitual de serviços futuros:

```text
frontend: React/Vite build estático
api: backend REST futuro
db: mariadb:11.4
```

Enquanto não houver backend real, o frontend continua funcionando localmente com dados mockados.

## Documentação local

- `docs/prompt.md`: escopo original do MVP.
- `docs/status-mvp.md`: status da primeira entrega.
- `docs/status2-mvp.md`: evolução com MariaDB, configuração admin e ajustes de layout.
- `docs/layout-review-stitch.md`: revisão do layout com base no Stitch.
- `docs/database-dev.md`: dados da instância MariaDB de desenvolvimento.

## Referência visual

O layout segue os modelos gerados no Stitch em `stitch/corporate-fleet-control-system/`, com foco em interface operacional, tabelas densas, formulários claros, paleta azul/slate e experiência responsiva.
