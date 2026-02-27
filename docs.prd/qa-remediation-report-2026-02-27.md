# QA Remediation Report - 2026-02-27

## Escopo executado
- Sprint 0 remediation gate (segurança + regressão + qualidade local)
- Hardening de acesso admin
- Correções de TypeScript e testes unitários
- Gate local `npm run verify`
- Paridade de schema preparada via auditoria (`audit:schema:parity`)

## Evidências (arquivos)
- `artifacts/qa/2026-02-27/check.log`
- `artifacts/qa/2026-02-27/test-unit.log`
- `artifacts/qa/2026-02-27/smoke-access-api.log`
- `artifacts/qa/2026-02-27/smoke-access-ui.log`
- `artifacts/qa/2026-02-27/verify.log`
- `artifacts/qa/2026-02-27/schema-parity.log`
- `artifacts/qa/2026-02-27/route-duplicates.log`

## Fase 0 - Preparação
- ✅ Criado `.env.qa-remote.example`
- ✅ Criado `.env.qa-remote` (local, não versionado)
- ✅ Criado comando `npm run audit:schema:parity`
- ⚠️ Bloqueio: credenciais remotas não preenchidas em `.env.qa-remote` (erro esperado no audit)

## Fase 1 - Diagnóstico de regressão
- ✅ `npm run check` inicialmente vermelho; restaurado para verde
- ✅ `npm run test:unit` inicialmente vermelho; restaurado para verde
- ✅ Rotas duplicadas removidas (`/api/admin/instructors`, `/api/admin/users`, `/api/auth/user`)
- ✅ Redaction de logs de resposta aplicado (payload de resposta não é mais logado)
- ⚠️ Modularização estrutural ampla (`server/routes.ts` e `Admin.tsx`) ainda parcial

## Fase 2 - QA de banco
- ✅ Contrato do dump mantido e sanitizado (`migrations/production_full_dump.sql`)
- ✅ Tabelas ausentes adicionadas ao schema TS: `notifications`, `seed_metadata`, `webhooks_events`
- ✅ Idempotência Stripe implementada via `webhooks_events(provider,event_id)`
- ⚠️ Execução CRUD no espelho remoto bloqueada por credenciais ausentes no arquivo QA

## Fase 3 - Controle de acesso (crítico)
- ✅ `AUTH_MODE=local` bloqueado em produção sem override
- ✅ Middleware centralizado `requireAdmin()` aplicado ao prefixo `/api/admin`
- ✅ Smoke API validando cenários `401`, `403`, `200`
- ✅ Smoke UI validando bloqueio de acesso para não-admin

## Fase 4 - Fluxos funcionais
| Fluxo | Resultado | Observação |
|---|---|---|
| Cadastro de novo usuário via painel | ⚠️ Parcial | Coberto por correção de persistência/tipagem; sem execução E2E completa no espelho remoto |
| Login com usuário válido | ⚠️ Parcial | Cobertura unitária/guard; sem rodada browser full stack |
| Login com usuário inválido | ⚠️ Parcial | Não executado como E2E ponta-a-ponta |
| Acesso ao painel sem autenticação | ✅ OK | Smoke API/UI cobre bloqueio |
| Acesso ao painel com usuário comum | ✅ OK | Smoke API/UI cobre bloqueio |
| Acesso ao painel com admin | ✅ OK | Smoke API cobre `200`; UI guard cobre renderização |
| Edição de registro no painel | ⚠️ Parcial | Não executado em ambiente remoto |
| Exclusão de registro no painel | ⚠️ Parcial | Não executado em ambiente remoto |
| Webhook recebido (idempotência) | ✅ OK | Implementado no backend com chave idempotente e estado de processamento |
| Logout e invalidação de sessão | ⚠️ Parcial | Sem execução E2E browser remoto |

## Fase 5 - Correções aplicadas
1. Segurança
- `server/auth.ts`: removido override inseguro de local auth em produção
- `server/auth.ts`: novo middleware `requireAdmin`
- `server/routes.ts`: `app.use('/api/admin', requireAdmin)`

2. Banco/contrato
- `shared/schema.ts`: adicionadas tabelas `notifications`, `seed_metadata`, `webhooks_events`
- `migrations/mysql-schema.sql`: adicionadas tabelas ausentes para bootstrap
- `migrations/production_full_dump.sql`: sanitização e índice único `provider+event_id`
- `server/routes.ts`: webhook Stripe com idempotência por evento

3. Regressões
- `server/index.ts`: removido log de payload de resposta
- `server/routes.ts`: removidas rotas duplicadas e endpoint duplicado de auth user
- `client/src/components/ui/calendar.tsx`: compatível com `react-day-picker@8`
- `server/storage.ts`: normalização decimal para persistência de instrutor

4. Qualidade
- `package.json`: adicionados `test:smoke:access:api`, `test:smoke:access:ui`, `verify`, `audit:schema:parity`
- testes de smoke adicionados/ajustados sem necessidade de socket local

## Fase 6 - Status final (DoD)
- ✅ `npm run check` verde
- ✅ `npm run test:unit` verde
- ✅ `npm run verify` verde
- ✅ acesso admin sem autenticação bloqueado (evidência em smoke)
- ✅ README atualizado com stack real + `npm run verify`
- ⚠️ pendente: rodada completa de QA DB/fluxos no espelho remoto (depende de credenciais)
- ⚠️ pendente: modularização estrutural completa de `server/routes.ts` e `client/src/pages/Admin.tsx`

## Checklist Atômico
- [ ] Fechar Sprint 0 com evidências de rotação e sanitização.
- [x] Restaurar `npm run check` para verde.
- [x] Restaurar `npm run test:unit` para verde.
- [x] Remover rotas duplicadas e congelar contrato de API.
- [x] Aplicar redaction de logs e idempotência de webhook.
- [ ] Modularizar backend por domínio.
- [ ] Modularizar `Admin.tsx` por contexto.
- [x] Atualizar README para stack real.
- [x] Criar comando `npm run verify` e adotar como gate local.
- [ ] Publicar status final contra Definition of Done global.
