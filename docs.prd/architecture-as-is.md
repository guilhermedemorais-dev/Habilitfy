# Architecture As-Is

## Aplicação
- Serviço único em Node/Express (`server/index.ts`) expõe API e entrega o build do cliente; usa HTTP server próprio.
- Frontend em Vite/React (raiz `client/`), build em `dist/public`; em produção o servidor lê de `public/` (precisa copiar o build para essa pasta antes do start).
- Em desenvolvimento o Vite Dev Server é acoplado dinamicamente (`server/vite.ts`).

## Dados
- Postgres via Drizzle ORM (`server/db.ts`, `drizzle.config.ts`); `DATABASE_URL` é obrigatório e inclui `sslmode=require` (Neon).
- Sessions de autenticação usam `connect-pg-simple` na tabela `sessions` (schema em `shared/schema.ts`).

## Autenticação
- OIDC configurável (`ISSUER_URL`, `REPL_ID`), padrão Replit; sessões persistem no Postgres.
- Modo local opcional via `AUTH_MODE=local` com overrides `LOCAL_USER_*`; flag `SESSION_COOKIE_SECURE` controla cookies em produção.

## Pagamentos
- Integração AbacatePay (`server/abacatepay.ts` + rotas) exige `ABACATEPAY_API_KEY` e opcional `ABACATEPAY_BASE_URL`/`ABACATEPAY_DEV_MODE`.
- Webhook exposto em `/api/webhooks/abacatepay`; validação de assinatura com `ABACATEPAY_WEBHOOK_SECRET` ainda é TODO (ver backlog).
- Mock para e2e em `script/e2e-start.ts` (`ABACATEPAY_MOCK_PORT`).

## Build e Runtime
- `npm run build` (script/build.cjs) remove `dist/`, roda `vite build` e bundle do server para `dist/index.cjs`.
- Produção inicia com `npm start` (`node dist/index.cjs`); host/porta via `HOST`/`PORT`, flags `REUSE_PORT` e `SKIP_STATIC` para ajuste fino.
