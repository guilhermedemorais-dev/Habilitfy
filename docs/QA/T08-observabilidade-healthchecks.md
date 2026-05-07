# T08 - Observabilidade e Health Checks

## Objetivo
Colocar o mínimo operacional de logs, métricas e readiness para produção.

## LLM recomendado
- Primário: `Codex CLI`
- Revisor de desenho operacional: `Claude Code`
- Apoio opcional: `Blackbox/Minimax` para exemplos Prometheus/Grafana

## Contexto mínimo
- `server/utils/logger.ts`
- `server/index.ts`
- `server/routes.ts`
- `server/routes/admin-control.ts`
- `server/db.ts`
- `server/redis.ts`
- `Dockerfile`

## Escopo
- health/readiness real com DB/Redis;
- remover métricas aleatórias do admin health;
- padronizar logs estruturados;
- reduzir dependência de log em arquivo local.

## Entregáveis
- health/readiness úteis;
- logger ajustado para produção;
- métricas básicas coerentes;
- documentação mínima de monitoramento.

## Critérios de aceite
- `/api/health` ou equivalente valida dependências críticas;
- painel admin não retorna números fake;
- logs saem de forma estruturada para stdout;
- risco de I/O síncrono local reduzido.

## Prompt pronto
```text
Task T08. Implemente o mínimo de observabilidade e health checks reais.

Arquivos permitidos:
- server/utils/logger.ts
- server/index.ts
- server/routes.ts
- server/routes/admin-control.ts
- server/db.ts
- server/redis.ts
- Dockerfile

Entregue:
1. patch mínimo
2. endpoints/semântica de health e readiness
3. resumo do que monitorar em produção

Não tratar filas nem storage externo aqui.
```
