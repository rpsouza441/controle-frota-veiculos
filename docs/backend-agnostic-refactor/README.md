# Refatoracao backend-agnostic

Atualizacao iniciada em 2026-04-28 para desacoplar a UI do backend Express/MariaDB/REST e permitir troca futura de provedor de dados sem alterar paginas e componentes.

## Estrutura proposta

```txt
src/
  app/providers/dataProviderFactory.ts
  application/dto/
  application/selectors/fleetSelectors.ts
  application/usecases/auth/
  application/usecases/fleet/
  domain/errors/DomainError.ts
  domain/ports/AuthRepository.ts
  domain/ports/FleetRepository.ts
  infra/http/httpClient.ts
  infra/repositories/http/
  infra/repositories/local/
  features/
```

## Plano em 5 PRs pequenos

1. `refactor/ports-and-usecases-foundation`: portas, erros de dominio e use-cases iniciais.
2. `refactor/http-adapters-and-context-decoupling`: `HttpClient`, adapters HTTP e contextos sem `fetch`.
3. `perf/selectors-and-table-lookups`: selectors memoizados e mapas por id em telas pesadas.
4. `feat/local-data-provider-backend-agnostic`: provider local com `VITE_DATA_PROVIDER=http|local`.
5. `test/usecases-and-repository-contracts`: Vitest, testes de use-cases, contrato de adapters e smoke tests.

## Estado desta atualizacao

- Portas `AuthRepository` e `FleetRepository` criadas.
- Erros de dominio padronizados criados.
- Use-cases de auth e frota criados.
- Adapter HTTP criado e plugado no bootstrap.
- Adapter local criado atras de feature flag.
- `AuthContext` e `FleetContext` refatorados para consumir use-cases.
- Selectors com mapas por id criados.
- `HistoryPage` e `DashboardPage` passaram a usar indices derivados.
- Backend Express modularizado em `routes`, `services`, `repositories`, `middleware` e `validation`, preservando endpoints atuais.

## Trade-offs

- Os use-cases ainda sao finos e delegam quase tudo ao repository. Isso reduz risco agora e cria o ponto certo para mover regras gradualmente.
- O adapter local usa `localStorage` e fixtures de desenvolvimento. Ele serve para execucao offline/local e testes manuais, nao como banco local-first definitivo.
- O contrato ainda reflete o modelo atual de tela/API. Uma etapa futura pode separar DTOs externos de tipos de dominio com mapeadores mais rigorosos.
- `FleetContext` preserva a API publica atual para evitar refatorar todas as paginas de uma vez.

## Checklist de regressao manual

- Login com usuario ativo via provider HTTP.
- Rehydrate ao recarregar a pagina com token valido.
- Logout limpa sessao e estado de frota.
- Dashboard carrega contadores, veiculos disponiveis e atividade recente.
- Retirada de veiculo com KM correta.
- Bloqueio de retirada quando KM informada diverge.
- Solicitacao de correcao de KM.
- Revisao de correcao por gestor/admin.
- Devolucao de veiculo com KM maior ou igual a retirada.
- CRUD administrativo de veiculos, usuarios, equipes e clientes.
- Atualizacao de configuracoes.
- Exportacao CSV do historico.
- Execucao com `VITE_DATA_PROVIDER=local` sem subir backend.

## Proximos passos para multiplos backends

- Criar suite de contrato compartilhada para `FleetRepository` e `AuthRepository`.
- Adicionar mapeadores explicitos `ApiDto -> Domain` e `Domain -> ApiDto`.
- Criar adapters para BaaS ou SDK externo sem alterar `features/`.
- Evoluir provider local para local-first com fila de sincronizacao, versao de schema e resolucao de conflitos.
- Adicionar observabilidade de erros de dominio por adapter.
