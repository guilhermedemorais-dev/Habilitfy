# Auditoria Completa HabilitFy (Baseline)

Data: 2026-02-22
Escopo: backend, frontend, banco/migrations, segurança operacional, qualidade de build/testes, prontidão de produção.

## 1) Resumo executivo

O projeto está funcional e com domínio de negócio claro (marketplace de aulas + KYC + pagamentos), mas o estado atual ainda não está pronto para operação corporativa segura.

Risco geral: **alto**.

Principais motivos:
- Segredos e dados sensíveis versionados no repositório.
- Configuração de autenticação local habilitada em ambiente de produção.
- Endpoints e rotas duplicadas gerando comportamento ambíguo.
- Build TypeScript quebrado e suíte unitária incompleta.
- Forte concentração de lógica em arquivos "god file".

## 2) Mapa arquitetural atual (As-Is)

### Backend
- Runtime: Node.js + Express + TypeScript (`package.json:7`, `package.json:13`).
- Entrada principal: `server/index.ts`.
- Roteamento principal monolítico: `server/routes.ts` (3642 linhas).
- Autenticação/sessão: `server/auth.ts` + `express-session` + `express-mysql-session`.
- Persistência: Drizzle ORM + MySQL (`shared/schema.ts`, `server/storage.ts`).
- Pagamentos: Stripe + AbacatePay (`server/stripe.ts`, `server/abacatepay.ts`).
- KYC: pipeline em `server/kyc.ts`.

### Frontend
- React + Vite + Tailwind (`package.json:93`, `package.json:110`, `package.json:105`).
- Página administrativa extremamente concentrada: `client/src/pages/Admin.tsx` (4070 linhas).

### Dados
- 20+ tabelas em `shared/schema.ts`.
- Dump SQL completo presente em `migrations/production_full_dump.sql`.

## 3) Achados por severidade

## CRÍTICO

1. Segredos versionados em arquivo de produção
- Evidência: `.env.production` está no Git (`git ls-files`) e contém credenciais reais.
- Referências: `.env.production:15`, `.env.production:19`, `.env.production:32`.
- Impacto: comprometimento de infraestrutura, OAuth, sessão e potencial vazamento de dados.

2. Dados pessoais/sensíveis versionados no dump
- Evidência: dump com registros reais (emails, CPF, telefone, geolocalização, hashes).
- Referências: `migrations/production_full_dump.sql:209`, `migrations/production_full_dump.sql:1039`, `migrations/production_full_dump.sql:1048`.
- Impacto: risco LGPD, exposição de dados de usuários e fraude.

3. Autenticação local habilitável em produção
- Evidência: modo local ativo no arquivo de produção.
- Referências: `.env.production:24`, `.env.production:3`.
- Código relacionado: auto-login em modo local (`server/auth.ts:407`), bypass condicional (`server/auth.ts:553`).
- Impacto: risco de configuração insegura e acesso indevido por erro operacional.

## ALTO

4. Rotas duplicadas e contrato de API ambíguo
- Duplicadas:
- `GET /api/admin/instructors` em `server/routes.ts:460` e `server/routes.ts:2381`.
- `GET /api/admin/users` em `server/routes.ts:484` e `server/routes.ts:2558`.
- `GET /api/auth/user` em `server/auth.ts:509` e `server/routes.ts:436`.
- Impacto: comportamento não determinístico, regressões silenciosas e dificuldade de manutenção.

5. Logging potencialmente excessivo de payload de resposta
- Evidência: middleware captura `res.json` completo e loga `response`.
- Referência: `server/index.ts:60`, `server/index.ts:63`, `server/index.ts:76`.
- Impacto: possível vazamento de PII/tokens em logs e custo operacional maior.

6. Webhook Stripe sem proteção de idempotência no fluxo de negócio
- Evidência: ao receber `checkout.session.completed`, sempre cria transação sem guarda explícita de duplicidade.
- Referências: `server/routes.ts:3600`, `server/routes.ts:3620`.
- Impacto: duplicidade financeira em reentregas de webhook.

## MÉDIO

7. Build TypeScript quebrado
- Evidência:
- incompatibilidade de API em calendário (`react-day-picker`): `client/src/components/ui/calendar.tsx:9`.
- incompatibilidade de tipos `decimal`/`number` no storage: `server/storage.ts:353`, `server/storage.ts:359`.
- Impacto: bloqueia qualidade contínua e aumenta risco de regressão.

8. Testes unitários incompletos por dependência ausente
- Evidência: `supertest` importado em teste mas não instalado (apenas `@types`).
- Referências: `server/integrations.routes.test.ts:2`, `package.json:132`.
- Impacto: falsa sensação de cobertura e queda de confiança nos testes.

9. Divergência documentação vs realidade técnica
- README cita React 19 / Vite 7 / PostgreSQL.
- Referências: `README.md:69`, `README.md:72`, `README.md:83`.
- Stack real no projeto: React 18 / Vite 5 / MySQL.
- Referências: `package.json:93`, `package.json:110`, `package.json:83`.
- Impacto: onboarding ruim, decisões erradas de operação/dev.

10. Concentração excessiva de complexidade
- Evidência:
- `server/routes.ts`: 3642 linhas.
- `server/storage.ts`: 1751 linhas.
- `client/src/pages/Admin.tsx`: 4070 linhas.
- Impacto: baixa velocidade de evolução, alto custo de revisão e maior incidência de bugs.

## BAIXO

11. Inconsistência no controle de acesso administrativo
- Parte das rotas usa `requireAdminRole`, parte usa checagem manual `user?.role !== 'admin'`.
- Referências: `server/routes.ts:570`, `server/routes.ts:460`, `server/routes.ts:2396`.
- Impacto: políticas difíceis de auditar e risco de drift de autorização.

12. Uso amplo de `console.*` em backend
- Evidência: muitos pontos de log ad-hoc em vez de logger estruturado único.
- Referências exemplares: `server/routes.ts:378`, `server/routes.ts:3574`, `server/auth.ts:327`.
- Impacto: observabilidade inconsistente e ruído em produção.

## 4) Saúde de engenharia (execução real)

Comandos executados:
- `npm run check` -> **falhou** (erros TS em calendário e storage).
- `npm run test:unit` -> **falhou** (suite `integrations.routes.test.ts` sem `supertest`).

## 5) Forças do projeto

- Domínio de produto já materializado (fluxo aluno/instrutor/admin, KYC, pagamentos).
- Uso de ORM type-safe e schemas centralizados.
- Existem endpoints de health (`/api/health`) e rate limiting básico.
- Base com testes iniciais já presente.

## 6) Backlog recomendado para próximo ciclo (priorizado)

## P0 (imediato)
- Remover segredos do Git e rotacionar todas as credenciais comprometidas.
- Remover/sanitizar `migrations/production_full_dump.sql` (ou mover para storage seguro fora do repo).
- Forçar `AUTH_MODE` seguro em produção e revisar política de sessão/cookie.
- Introduzir redaction e política de logging (sem payload completo de resposta).
- Implementar idempotência em webhooks de pagamento.

## P1 (curto prazo)
- Eliminar rotas duplicadas e definir contrato único por endpoint.
- Quebrar `server/routes.ts` em módulos por domínio (auth, admin, bookings, payments, kyc, chat).
- Corrigir typecheck (`calendar.tsx` + tipos de `pricePerHour`).
- Corrigir stack de testes (`supertest` ou refatorar teste para alternativa).

## P2 (estrutura)
- Quebrar `Admin.tsx` em módulos/containers por feature.
- Consolidar autorização via middleware único de RBAC.
- Atualizar README para refletir stack real e processo real de deploy/ops.
- Adicionar CI mínima (check + unit tests) com gate obrigatório.

## 7) Memória operacional para planejamento

Use este arquivo como **baseline oficial do estado atual** para qualquer planning futuro:
- Arquivo de referência: `docs/audit/habilitfy-audit-2026-02-22.md`.
- Regra de planejamento: tratar os itens P0 como bloqueadores de produção.
- Regra de execução: nenhum novo feature crítico antes de estabilizar P0/P1.

