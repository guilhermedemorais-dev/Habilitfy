# T10 - Financeiro, Wallet e Admin

## Objetivo
Corrigir inconsistências funcionais que prejudicam operação administrativa e trilha financeira.

## LLM recomendado
- Primário: `Codex CLI`
- Revisor de consistência e idempotência: `Claude Code`
- Apoio opcional: `Blackbox/Minimax` para casos de teste financeiros

## Contexto mínimo
- `server/storage.ts`
- `server/services/wallet.ts`
- `server/services/fees.ts`
- `server/routes/admin-finance.ts`
- `server/routes/admin-control.ts`

## Escopo
- corrigir `getAdminTransactions()` que hoje retorna vazio;
- revisar duplicidade potencial de wallet/perfil;
- reforçar idempotência financeira;
- melhorar previsibilidade dos painéis admin financeiros.

## Entregáveis
- correção funcional do endpoint admin de transações;
- revisão de invariantes de wallet;
- testes unitários/integrados onde fizer sentido.

## Critérios de aceite
- admin volta a enxergar transações reais;
- wallet não pode se duplicar logicamente;
- repasse financeiro fica mais consistente;
- testes passam.

## Prompt pronto
```text
Task T10. Corrija a camada financeira/admin com foco em consistência.

Escopo:
- server/storage.ts
- server/services/wallet.ts
- server/services/fees.ts
- server/routes/admin-finance.ts
- server/routes/admin-control.ts

Prioridade:
1. getAdminTransactions
2. invariantes de wallet
3. consistência/idempotência financeira

Entregue:
1. patch mínimo
2. testes necessários
3. resumo do risco residual
```
