# Checklist Hoje 15-01-26 — ok

- [x] `.env` preenchido: `DATABASE_URL` (Neon, ssl), `SESSION_SECRET` forte, `ISSUER_URL`/`REPL_ID` ou `AUTH_MODE=local`, chaves `ABACATEPAY_API_KEY`/`ABACATEPAY_WEBHOOK_SECRET` (webhook secret pendente).
- [x] Postgres acessível e com schema aplicado: `npm run db:push`.
- [x] Seed opcional para testes: `npm run seed:auth` (usa hash de senha e popula instrutor/admin/aluno).
- [x] Build gerado antes de produção: `npm run build` (garante `dist/index.cjs` e `dist/public`).
- [x] Se rodar container, usar `docker compose -f factory/docker/docker-compose.factory.yml up --build` com `.env` disponível.
- [x] Confirmar endpoint do webhook AbacatePay em produção e segredo configurado no PSP.
- [x] Validar modo de auth: produção sem `AUTH_MODE=local`; cookie seguro habilitado (`SESSION_COOKIE_SECURE`).
- [x] Revisar se `public/` está presente no runtime (Dockerfile já copia, Hostinger precisa garantir). 
# Checklist 15-01-26 — QA e correções

- [ ] Corrigir erros de TypeScript em `client/src/pages/Admin.tsx`, `client/src/pages/Booking.tsx`, `client/src/pages/Checkout.tsx` e `server/storage.ts`.
- [ ] Corrigir falhas nos testes unitários de `server/integrations.routes.test.ts`.
- [ ] Corrigir falhas nos testes e2e (`e2e/admin.spec.ts`, `e2e/booking-flow.spec.ts`, `e2e/home.spec.ts`).
- [ ] Ajustar layout em telas grandes (UI “esticada”).
- [ ] Login: remover referência a “login interno” na página pública; admin deve ter página separada.
- [ ] Login: botão “Acessar minha conta” deve redirecionar para login do usuário e não simular sessão.
- [ ] Cadastro instrutor: bloquear avanço se etapa incompleta; exigir selfie com verificação humana (liveness) via biblioteca apropriada.
- [ ] Cadastro instrutor: coletar dados completos do parceiro (nome, documento, endereço) e anexar documentos de instrutor + autorização do veículo.
- [ ] Cadastro veículo: exigir fotos/documentos (placa visível) seguindo critérios estilo Uber.
- [ ] Cadastro serviços: remover etapa do fluxo público e mover para painel interno (módulo com precificação, impostos e taxa HabilitFy).
