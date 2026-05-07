# T07 - MySQL Índices e Queries

## Objetivo
Corrigir gargalos mais prováveis de banco antes do crescimento de carga.

## LLM recomendado
- Primário: `Codex CLI`
- Revisor de estratégia de índices: `Claude Code`
- Apoio opcional: `Blackbox/Minimax` para rascunho de migrations SQL

## Contexto mínimo
- `shared/schema.ts`
- `migrations/mysql-schema.sql`
- `server/storage.ts`
- `server/routes.ts`

## Escopo
- adicionar índices compostos mínimos;
- reduzir N+1 mais óbvios;
- revisar queries de bookings, transactions, reviews, messages e withdrawals;
- corrigir paginação ausente onde for simples e de alto impacto.

## Entregáveis
- alterações de schema/migration;
- queries críticas reescritas;
- nota curta de compatibilidade MySQL 8.

## Critérios de aceite
- `bookings` tem índices para listagem e conflito de agenda;
- `transactions`, `withdrawals`, `messages`, `reviews` ganham índices coerentes;
- endpoints críticos não dependem de N+1 mais óbvio;
- testes e/ou validação estática passam.

## Prompt pronto
```text
Task T07. Otimize MySQL 8 com foco em índices e queries críticas.

Escopo:
- shared/schema.ts
- migrations/mysql-schema.sql
- server/storage.ts
- server/routes.ts

Prioridade:
1. índices mínimos
2. queries de bookings/transactions/reviews/messages/withdrawals
3. remover N+1 de maior impacto

Entregue:
1. patch mínimo
2. lista de índices adicionados
3. resumo de impacto esperado

Não trate observabilidade nem deploy aqui.
```
