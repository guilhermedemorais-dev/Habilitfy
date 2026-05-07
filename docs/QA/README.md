# QA Tasks LLM Plan

Este diretório concentra o plano de execução do QA/Arquitetura em tarefas pequenas, independentes e pensadas para economizar tokens no `Codex CLI`, `Claude Code` e `Blackbox/Minimax`.

## Estratégia de uso de LLM

- `Codex CLI`: melhor para editar o repositório, aplicar patches, rodar testes e validar impacto local.
- `Claude Code`: melhor para tarefas com mais raciocínio arquitetural, segurança, trade-offs e desenho de rollout.
- `Blackbox/Minimax`: melhor como apoio em tarefas isoladas de boilerplate, SQL, snippets de infra e geração rápida de casos de teste.

## Arquivo de roteamento rápido

- Sumário operacional para outra IA: [SUMARIO.md](./SUMARIO.md)

## Regra de economia de tokens

- Execute **1 task por vez**.
- Envie ao LLM apenas:
  - objetivo da task;
  - arquivos listados na seção `Contexto mínimo`;
  - critérios de aceite;
  - prompt pronto da task.
- Não misture tasks sem dependência direta.

## Ordem recomendada

1. [T01 - Secrets e Env](./T01-secrets-e-env.md)
2. [T02 - Broken Access Control](./T02-broken-access-control.md)
3. [T03 - KYC Fail-Safe](./T03-kyc-fail-safe.md)
4. [T04 - Uploads e Storage Externo](./T04-uploads-storage-externo.md)
5. [T05 - Redis para Sessão, Rate Limit e Locks](./T05-redis-sessoes-rate-limit-locks.md)
6. [T06 - Filas e Workers](./T06-filas-e-workers.md)
7. [T07 - MySQL Índices e Queries](./T07-mysql-indices-e-queries.md)
8. [T08 - Observabilidade e Health Checks](./T08-observabilidade-healthchecks.md)
9. [T09 - Deploy, Docker e Nginx](./T09-deploy-docker-nginx.md)
10. [T10 - Financeiro, Wallet e Admin](./T10-financeiro-wallet-admin.md)
11. [T11 - Security Headers, CSRF e CORS](./T11-security-headers-csrf-cors.md)

## Dependências entre tasks

- `T01` desbloqueia produção com segurança mínima.
- `T02`, `T03` e `T04` são bloqueadoras de go-live.
- `T05` precisa ser definida antes de `T06`.
- `T07` pode rodar em paralelo com `T05` e `T08`.
- `T09` deve consolidar decisões de `T04`, `T05`, `T06` e `T08`.
- `T10` depende parcialmente de `T06` e `T07`.
- `T11` pode rodar em paralelo com `T08`.

## Definição de pronto global

Uma task só deve ser fechada quando entregar:

- código ou documentação aplicada no repositório;
- testes locais ou evidência objetiva de validação;
- checklist de aceite da própria task marcado;
- riscos residuais explícitos.
