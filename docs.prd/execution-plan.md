# Execution Plan

1) Preparar ambiente: copie `.env.example` para `.env` e preencha `DATABASE_URL` (Neon), `SESSION_SECRET`, `ISSUER_URL`/`REPL_ID` ou defina `AUTH_MODE=local`, e chaves do AbacatePay (`ABACATEPAY_API_KEY`, `ABACATEPAY_WEBHOOK_SECRET`).
2) Banco: garanta Postgres acessível; rode `npm run db:push` para aplicar schema. Opcional: `npm run seed:auth` para usuários de teste.
3) Build: execute `npm run build` para gerar `dist/index.cjs` e `dist/public` (copiado para `public/` no build da imagem).
4) Runtime com Factory: `docker compose -f factory/docker/docker-compose.factory.yml up --build` (Docker + `.env` presentes). Serviço único em `localhost:5000`, usando Postgres externo.
5) Desenvolvimento local: `npm run dev` (Express + Vite dev server) com `.env` carregado via tsx.
6) Testes: `npm run test:unit`; `npm run test:e2e` requer banco e mock do AbacatePay (`script/e2e-start.ts` ou apontar `ABACATEPAY_BASE_URL`).
7) Deploy: seguir `docs/deploy/hostinger-neon.md` (Hostinger app Node, start `npm start`, envs no painel, webhook AbacatePay apontando para `/api/webhooks/abacatepay`).
