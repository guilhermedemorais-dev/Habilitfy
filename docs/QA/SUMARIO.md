# Sumário Operacional de QA

Este arquivo existe para ser lido por outra IA antes de começar o trabalho.

Objetivo:
- identificar rapidamente **qual task** deve ser executada;
- evitar abrir todos os arquivos de `docs/QA`;
- economizar tokens no `Codex CLI`, `Claude Code` e `Blackbox/Minimax`.

## Como usar

1. Leia este arquivo primeiro.
2. Identifique o problema ou objetivo.
3. Abra apenas a task indicada.
4. Use o `prompt pronto` daquela task.
5. Não carregue tasks sem relação direta.

## Regra de roteamento

Se o trabalho envolve:

- segredos, `.env`, credenciais, bootstrap seguro, rotação de secrets:
  - abrir [T01-secrets-e-env.md](./T01-secrets-e-env.md)

- autorização, permissões, acesso indevido, `403`, ownership de recurso:
  - abrir [T02-broken-access-control.md](./T02-broken-access-control.md)

- KYC, aprovação automática indevida, provider ausente, revisão manual:
  - abrir [T03-kyc-fail-safe.md](./T03-kyc-fail-safe.md)

- upload, arquivos, `/uploads`, S3, R2, storage privado, URL assinada:
  - abrir [T04-uploads-storage-externo.md](./T04-uploads-storage-externo.md)

- Redis, sessão compartilhada, rate limit distribuído, lock, idempotência:
  - abrir [T05-redis-sessoes-rate-limit-locks.md](./T05-redis-sessoes-rate-limit-locks.md)

- filas, jobs assíncronos, worker, retry, DLQ, webhook assíncrono:
  - abrir [T06-filas-e-workers.md](./T06-filas-e-workers.md)

- MySQL 8, índices, query lenta, N+1, paginação, tuning de consulta:
  - abrir [T07-mysql-indices-e-queries.md](./T07-mysql-indices-e-queries.md)

- logs, métricas, health check, readiness, monitoramento, alertas:
  - abrir [T08-observabilidade-healthchecks.md](./T08-observabilidade-healthchecks.md)

- Docker, Docker Compose, Nginx, deploy, VPS, runtime, processo web/worker:
  - abrir [T09-deploy-docker-nginx.md](./T09-deploy-docker-nginx.md)

- wallet, financeiro, transações, painel admin financeiro, repasse:
  - abrir [T10-financeiro-wallet-admin.md](./T10-financeiro-wallet-admin.md)

- CORS, CSRF, cookies, `SameSite`, headers HTTP, `helmet`, CSP:
  - abrir [T11-security-headers-csrf-cors.md](./T11-security-headers-csrf-cors.md)

## Ordem recomendada de execução

### Bloco 1 — Bloqueadores de go-live

1. [T01-secrets-e-env.md](./T01-secrets-e-env.md)
2. [T02-broken-access-control.md](./T02-broken-access-control.md)
3. [T03-kyc-fail-safe.md](./T03-kyc-fail-safe.md)
4. [T04-uploads-storage-externo.md](./T04-uploads-storage-externo.md)

### Bloco 2 — Base operacional

5. [T05-redis-sessoes-rate-limit-locks.md](./T05-redis-sessoes-rate-limit-locks.md)
6. [T08-observabilidade-healthchecks.md](./T08-observabilidade-healthchecks.md)
7. [T11-security-headers-csrf-cors.md](./T11-security-headers-csrf-cors.md)

### Bloco 3 — Escala e processamento

8. [T06-filas-e-workers.md](./T06-filas-e-workers.md)
9. [T07-mysql-indices-e-queries.md](./T07-mysql-indices-e-queries.md)
10. [T10-financeiro-wallet-admin.md](./T10-financeiro-wallet-admin.md)
11. [T09-deploy-docker-nginx.md](./T09-deploy-docker-nginx.md)

## Paralelização segura

Pode rodar em paralelo:

- `T02` com `T03`
- `T05` com `T08`
- `T07` com `T11`

Evite rodar em paralelo:

- `T04` com outra task que também mude o fluxo KYC/upload
- `T05` e `T06` se a base de Redis/lock ainda não estiver definida
- `T09` antes de estabilizar `T04`, `T05`, `T06` e `T08`

## Qual LLM usar

### Use `Codex CLI` quando

- a task pede patch direto no repositório;
- precisa rodar teste local;
- precisa editar vários arquivos com validação rápida.

Tasks mais adequadas:
- `T02`
- `T05`
- `T07`
- `T08`
- `T10`
- `T11`

### Use `Claude Code` quando

- a task pede desenho arquitetural com trade-off;
- precisa refatorar sem ampliar escopo;
- envolve fluxos sensíveis ou rollout complexo.

Tasks mais adequadas:
- `T01`
- `T03`
- `T04`
- `T06`
- `T09`

### Use `Blackbox/Minimax` quando

- você quer apoio pontual;
- precisa gerar snippet isolado, SQL, boilerplate ou lista de testes;
- não quer gastar contexto dos outros agentes.

Não usar como executor principal para mudanças sensíveis de autorização, KYC e rollout.

## Mapa rápido por sintomas

| Sintoma | Task |
|---|---|
| “Tem segredo exposto” | `T01` |
| “Usuário acessa o que não deveria” | `T02` |
| “KYC aprovou sem validação confiável” | `T03` |
| “Arquivo sensível está no disco local/publicamente acessível” | `T04` |
| “Sessão e rate limit não escalam” | `T05` |
| “Webhook ou e-mail está lento no request” | `T06` |
| “Query lenta / falta índice / N+1” | `T07` |
| “Health check é fraco / logs ruins / sem métricas” | `T08` |
| “Deploy está inconsistente” | `T09` |
| “Painel financeiro/admin está incorreto” | `T10` |
| “Cookies, CSRF, CORS ou headers estão fracos” | `T11` |

## Instrução padrão para outra IA

Use este texto antes de delegar:

```text
Leia primeiro `docs/QA/SUMARIO.md`.

Depois:
1. identifique a task correta
2. abra somente essa task
3. siga o escopo dela
4. não carregue as outras tasks
5. entregue patch mínimo, validação e resumo final
```

## Se a IA estiver em dúvida

- Se o problema é de **quem pode acessar o quê**, vá para `T02`.
- Se o problema é de **onde o arquivo fica salvo**, vá para `T04`.
- Se o problema é de **processo pesado no request**, vá para `T06`.
- Se o problema é de **lentidão no banco**, vá para `T07`.
- Se o problema é de **produção/deploy/runtime**, vá para `T09`.

## Definição de pronto para qualquer IA

Antes de encerrar qualquer task, a IA deve confirmar:

- qual task foi executada;
- quais arquivos foram alterados;
- quais testes/validações rodaram;
- quais riscos residuais ficaram;
- se outra task foi desbloqueada.
