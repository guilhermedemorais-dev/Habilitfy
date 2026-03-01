# Plano de Execução por Sprint - Remediação da Auditoria HabilitFy

Data base: 2026-02-22  
Origem: `docs/audit/habilitfy-audit-2026-02-22.md`

## Abordagem

Executar em 4 sprints curtos com foco em redução de risco real antes de evolução de features. A ordem prioriza segurança operacional (P0), estabilidade de engenharia (P1), e só depois modularização estrutural (P2).

## Escopo

In:
- Remediação de riscos críticos e altos identificados na auditoria.
- Estabilização de build/testes como gate obrigatório.
- Backlog técnico com critérios de aceite verificáveis.

Out:
- Novas features de produto não relacionadas à remediação.
- Redesign funcional de UX.
- Mudança de stack (ex.: troca de banco/framework).

## Regras de Governança

- Nenhum ticket de feature entra antes de fechar Sprint 0.
- Toda PR deve passar `npm run check` e `npm run test:unit`.
- Alterações de segurança exigem evidência de rotação/revogação de credenciais.
- Toda mudança de rota deve manter contrato documentado.

## Guardrails de Produção (Obrigatório)

- Executar mudanças de risco (`SEC-*`, `PAY-*`, `ARC-*`) em janela de baixa movimentação.
- Exigir plano de rollback por ticket antes de deploy (com responsável e comando de reversão).
- Fazer backup/snapshot antes de mudanças em dados, autenticação e pagamentos.
- Validar em ambiente de homologação/staging antes de produção.
- Aplicar rollout progressivo (canário: 5% -> 25% -> 100%) quando possível.
- Monitorar logs, erros e métricas por no mínimo 60 minutos após deploy.
- Congelar mudanças se houver aumento de erro, latência ou falha de autenticação/pagamento.

## Definition of Done Global

- `npm run check` sem erros.
- `npm run test:unit` passando.
- Sem segredos versionados no Git.
- Sem dados pessoais reais em artefatos versionados.
- Logs sem payload sensível.
- Rollback testado/documentado para mudanças de produção.
- Janela de monitoramento pós-deploy concluída sem regressão crítica.

## Sprint 0 (48h) - Contenção de Risco Crítico

Meta: eliminar exposição ativa de segredos e dados pessoais.

1. `SEC-001` Rotacionar credenciais expostas
- Escopo: rotacionar `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`, credenciais de banco e chaves de provedores.
- Evidências: `.env.production` está versionado (`.env.production:15`, `.env.production:19`, `.env.production:32`).
- Aceite: credenciais antigas invalidadas; inventário de novas credenciais armazenado em vault/secret manager.
- Validação: tentativa com credencial antiga deve falhar.

2. `SEC-002` Retirar segredos do versionamento
- Escopo: remover `.env.production` do histórico ativo e garantir política de distribuição segura de env.
- Aceite: `git ls-files .env.production` não retorna arquivo.
- Validação: checklist de bootstrap de ambiente atualizada em docs.

3. `SEC-003` Sanitizar dump de produção
- Escopo: remover ou anonimizar `migrations/production_full_dump.sql` com PII real.
- Evidências: dados em `migrations/production_full_dump.sql:209`, `migrations/production_full_dump.sql:1039`.
- Aceite: dump produtivo não contém CPF/telefone/email real.
- Validação: scanner de padrões sensíveis executado e anexado na PR.

4. `SEC-004` Bloquear modo de autenticação local em produção
- Escopo: impedir `AUTH_MODE=local` em runtime de produção.
- Evidências: `.env.production:24`, lógica em `server/auth.ts:407` e `server/auth.ts:553`.
- Aceite: bootstrap aborta quando `NODE_ENV=production` + `AUTH_MODE=local`.
- Validação: teste manual de boot com combinação inválida retorna erro explícito.

## Sprint 1 (3-4 dias) - Estabilização de Engenharia

Meta: restaurar saúde de build/testes e reduzir risco de regressão.

1. `ENG-001` Corrigir TypeScript do calendário
- Escopo: alinhar `client/src/components/ui/calendar.tsx` com versão instalada de `react-day-picker`.
- Evidências: erro em `client/src/components/ui/calendar.tsx:9`.
- Aceite: arquivo compila sem `any` implícito e sem APIs inexistentes.
- Validação: `npm run check`.

2. `ENG-002` Corrigir tipagem decimal no storage
- Escopo: alinhar `InsertInstructor.pricePerHour` com contrato do schema Drizzle.
- Evidências: erros em `server/storage.ts:353` e `server/storage.ts:359`.
- Aceite: create/update de instrutor tipados corretamente (sem cast perigoso).
- Validação: `npm run check` + teste unitário do fluxo.

3. `ENG-003` Corrigir suíte unitária de integrações
- Escopo: instalar `supertest` ou refatorar teste para alternativa compatível.
- Evidências: `server/integrations.routes.test.ts:2`, `package.json:132`.
- Aceite: `server/integrations.routes.test.ts` executa.
- Validação: `npm run test:unit`.

4. `ENG-004` Padronizar pipeline local de qualidade
- Escopo: criar comando único `npm run verify` (check + unit tests).
- Aceite: comando único reproduz gate mínimo.
- Validação: execução em ambiente limpo.

## Sprint 2 (4-5 dias) - Contrato de API e Segurança Operacional

Meta: remover ambiguidades de roteamento e reduzir risco em logs/webhooks.

1. `API-001` Deduplicar rotas administrativas
- Escopo: unificar:
- `GET /api/admin/instructors` (`server/routes.ts:460` e `server/routes.ts:2381`).
- `GET /api/admin/users` (`server/routes.ts:484` e `server/routes.ts:2558`).
- Aceite: apenas uma definição por endpoint.
- Validação: teste de contrato de rota.

2. `API-002` Unificar endpoint de sessão autenticada
- Escopo: manter uma única fonte para `GET /api/auth/user` (`server/auth.ts:509` e `server/routes.ts:436`).
- Aceite: endpoint único documentado.
- Validação: teste de integração da rota.

3. `SEC-005` Implementar redaction de logs de resposta
- Escopo: remover log de payload completo em `server/index.ts` (`server/index.ts:60`, `server/index.ts:76`).
- Aceite: logs mantêm observabilidade sem conteúdo sensível.
- Validação: teste com resposta contendo PII não aparece em logs.

4. `PAY-001` Garantir idempotência no webhook Stripe
- Escopo: bloquear processamento duplicado de `checkout.session.completed`.
- Evidências: fluxo em `server/routes.ts:3600` e `server/routes.ts:3620`.
- Aceite: mesmo evento não cria transação duplicada.
- Validação: teste de reentrega do mesmo evento.

## Sprint 3 (5-7 dias) - Modularização Estrutural

Meta: reduzir complexidade acoplada e custo de manutenção.

1. `ARC-001` Extrair módulos de rota por domínio
- Escopo: decompor `server/routes.ts` em módulos (`auth`, `admin`, `bookings`, `payments`, `kyc`, `chat`).
- Aceite: `server/routes.ts` vira orquestrador de registro de módulos.
- Validação: regressão de rotas via testes.

2. `ARC-002` Padronizar autorização administrativa
- Escopo: substituir checagens manuais por middleware único de RBAC.
- Aceite: política de acesso centralizada e auditável.
- Validação: testes de autorização por papel.

3. `ARC-003` Fatiar `Admin.tsx` por bounded context
- Escopo: quebrar `client/src/pages/Admin.tsx` em containers/componentes por domínio.
- Aceite: página principal reduzida e responsabilidades isoladas.
- Validação: build frontend + smoke test de admin.

4. `DOC-001` Corrigir documentação técnica divergente
- Escopo: atualizar `README.md` para stack real (React 18/Vite 5/MySQL).
- Evidências: divergências em `README.md:69`, `README.md:72`, `README.md:83`.
- Aceite: README reflete o estado real de runtime/dev/deploy.
- Validação: onboarding executado a partir do README atualizado.

## Dependências e Sequenciamento

- `SEC-001`, `SEC-002`, `SEC-003`, `SEC-004` bloqueiam qualquer sprint seguinte.
- `ENG-001`, `ENG-002`, `ENG-003` devem fechar antes de `API-001`/`ARC-001`.
- `API-001` e `API-002` precedem `ARC-001` para evitar mover código duplicado.

## Riscos de Execução

- Reescrever histórico para remover segredos pode impactar fluxo do time.
- Deduplicação de rota pode quebrar consumidores implícitos não documentados.
- Modularização pode causar regressão se entrar antes de estabilidade de testes.

## Checklist Atômico (Execução)

[ ] Fechar Sprint 0 com evidências de rotação e sanitização.  
[x] Restaurar `npm run check` para verde.  
[x] Restaurar `npm run test:unit` para verde.  
[x] Remover rotas duplicadas e congelar contrato de API.  
[x] Aplicar redaction de logs e idempotência de webhook.  
[x] Modularizar backend por domínio.  
[x] Modularizar `Admin.tsx` por contexto.  
[x] Atualizar README para stack real.  
[x] Criar comando `npm run verify` e adotar como gate local.  
[x] Publicar status final contra Definition of Done global.

## Status Final (2026-03-01)

Entregue neste ciclo:
- Bugfixes críticos do admin concluídos antes da expansão estrutural.
- `UserManagementSheet` implantado com lazy-load obrigatório para `finance` e `history`.
- `withdrawals` alinhado com migration corretiva e backup pré-migration.
- `server/routes.ts` modularizado por domínios administrativos (`admin-control`, `admin-config`, `admin-finance`, `admin-operations`, `admin-user-management`).
- `client/src/pages/Admin.tsx` fatiado por contexto (`dashboard`, `instructors`, `students`, `bookings`, `finance`, `settings`, `integrations`).
- Gate local `npm run verify` mantido verde durante os batches.

Status contra a Definition of Done Global:
- `npm run check` sem erros: `OK`
- `npm run test:unit` passando: `OK`
- Sem segredos versionados no Git: `PENDENTE` (depende de fechamento completo da Sprint 0)
- Sem dados pessoais reais em artefatos versionados: `PENDENTE` (depende de evidência final de sanitização)
- Logs sem payload sensível: `OK`
- Rollback testado/documentado para mudanças de produção: `PENDENTE`
- Janela de monitoramento pós-deploy concluída sem regressão crítica: `PENDENTE`

Conclusão:
- O plano técnico de estabilização e modularização foi executado.
- O bloqueio remanescente para fechamento integral da DoD global está concentrado em evidências operacionais da Sprint 0 e em validação/monitoramento de produção.

## Questões em Aberto

- Vamos reescrever histórico Git para remover segredos já com `filter-repo`, ou tratar só daqui para frente?
- O dump de produção será removido do repositório ou substituído por dataset sintético persistente?
