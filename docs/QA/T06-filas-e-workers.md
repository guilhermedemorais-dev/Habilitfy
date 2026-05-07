# T06 - Filas e Workers

## Objetivo
Mover processamento pesado e integrações externas para jobs assíncronos com retry e idempotência.

## LLM recomendado
- Primário: `Claude Code`
- Executor de código e testes: `Codex CLI`
- Apoio opcional: `Blackbox/Minimax` para DLQ/retry patterns

## Contexto mínimo
- `server/routes.ts`
- `server/email.ts`
- `server/services/fees.ts`
- `server/services/wallet.ts`
- `server/redis.ts`
- arquivos criados na `T05`, se existirem

## Escopo
- e-mail de verificação;
- KYC assíncrono;
- processamento de webhooks;
- repasse financeiro e jobs recorrentes simples.

## Entregáveis
- infraestrutura mínima de queue worker;
- jobs separados por responsabilidade;
- retry, idempotência e DLQ básica;
- instrução de execução dos workers.

## Critérios de aceite
- requests web não executam lógica pesada síncrona;
- webhook responde rápido e enfileira trabalho;
- jobs financeiros têm idempotência explícita;
- documentação operacional existe.

## Prompt pronto
```text
Task T06. Introduza fila e workers para processos assíncronos críticos.

Escopo:
- email
- KYC
- webhooks
- repasse financeiro

Arquivos permitidos:
- server/routes.ts
- server/email.ts
- server/services/fees.ts
- server/services/wallet.ts
- infraestrutura Redis/queue relacionada

Entregue:
1. arquitetura mínima de queue
2. jobs e workers essenciais
3. instruções de execução
4. testes possíveis

Não reescreva áreas não relacionadas.
```
