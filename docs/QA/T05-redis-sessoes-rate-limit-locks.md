# T05 - Redis para Sessões, Rate Limit e Locks

## Objetivo
Usar Redis como componente operacional real, não apenas cache opcional.

## LLM recomendado
- Primário: `Codex CLI`
- Revisor de desenho operacional: `Claude Code`
- Apoio opcional: `Blackbox/Minimax` para snippets de configuração Redis

## Contexto mínimo
- `server/auth.ts`
- `server/redis.ts`
- `server/cache.ts`
- `server/index.ts`
- `docker-compose.yml`
- `docs/deploy/vps-production-requirements.md`

## Escopo
- migrar sessão compartilhada para Redis;
- preparar rate limit distribuído;
- adicionar primitives simples de lock/idempotency;
- documentar fallback aceitável.

## Entregáveis
- sessão baseada em Redis;
- rate limit não local ao processo;
- helper básico de lock com TTL;
- documentação operacional.

## Critérios de aceite
- múltiplas instâncias podem compartilhar sessão;
- rate limit não depende de memória local;
- existe base de lock para bookings/webhooks/jobs;
- compose/docs refletem a mudança.

## Prompt pronto
```text
Task T05. Converta Redis em dependência operacional real.

Objetivo:
- sessão compartilhada
- rate limit distribuído
- lock simples com TTL

Arquivos permitidos:
- server/auth.ts
- server/redis.ts
- server/cache.ts
- server/index.ts
- docker-compose.yml
- docs/deploy/vps-production-requirements.md

Entregue:
1. patch mínimo
2. env/config necessários
3. resumo de fallback e riscos residuais

Não implemente fila aqui.
```
