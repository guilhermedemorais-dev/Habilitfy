# T02 - Broken Access Control

## Objetivo
Corrigir as falhas de autorização mais graves antes do go-live.

## LLM recomendado
- Primário: `Codex CLI`
- Revisor de regras e edge cases: `Claude Code`
- Apoio opcional: `Blackbox/Minimax` para gerar matriz de casos de teste

## Contexto mínimo
- `server/routes.ts`
- `server/routes/admin-operations.ts`
- `server/routes/admin-user-management.ts`
- `server/auth.ts`
- `server/storage.ts`

## Escopo
- proteger `PATCH/DELETE /api/vehicles/:id`;
- proteger `GET /api/bookings/instructor/:instructorId`;
- revisar rotas semelhantes com padrão de ownership/admin;
- adicionar testes de acesso negado/permitido.

## Entregáveis
- correção de autorização;
- testes unitários/smoke cobrindo acesso indevido;
- resposta padronizada para `403`.

## Critérios de aceite
- usuário comum não consegue alterar/excluir veículo alheio;
- usuário comum não consegue listar bookings de instrutor alheio;
- admin continua com acesso explícito onde fizer sentido;
- testes passam localmente.

## Prompt pronto
```text
Task T02. Corrija broken access control no backend.

Escopo exato:
- PATCH /api/vehicles/:id
- DELETE /api/vehicles/:id
- GET /api/bookings/instructor/:instructorId
- rotas imediatamente relacionadas que usem o mesmo padrão de ownership

Arquivos permitidos:
- server/routes.ts
- server/auth.ts
- server/storage.ts
- testes necessários

Entregue:
1. patch mínimo
2. testes de acesso autorizado e negado
3. resumo final com endpoints afetados

Não mexa em outras áreas.
```
