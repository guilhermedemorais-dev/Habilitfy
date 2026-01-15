# Deploy na Hostinger (App Node.js) + Neon Postgres

## Pré-requisitos
- Conta Hostinger com app Node.js (sem root, usa start script).
- Banco Postgres no Neon (connection string com `sslmode=require`).
- DNS apontando para a app (ex.: `api.seu-dominio.com`), TLS via painel Hostinger.

## Variáveis de ambiente (Hostinger)
Defina no painel:
- `DATABASE_URL=postgresql://user:pass@neon-host/db?sslmode=require`
- `SESSION_SECRET=<string forte>`
- `ISSUER_URL=<seu OIDC issuer>`
- `ABACATEPAY_API_KEY=<sua key>`
- `ABACATEPAY_WEBHOOK_SECRET=<secret>`
- `ABACATEPAY_DEV_MODE=true` (ou false em prod)
- `HOST=0.0.0.0`
- `PORT` (use a porta fornecida pelo painel; se não houver, 5000)

## Passos de build/deploy
1) Locally ou via pipeline, rode:
   - `npm install`
   - `DATABASE_URL=<neon-url> npm run db:push` (aplica o schema no Neon)
   - `npm run build`
2) Faça deploy do código (Git import ou upload) e garanta que o start script é o `npm start`.
3) No painel, configure as envs acima e redeploy.
4) Configure o webhook no painel AbacatePay apontando para `https://api.seu-dominio.com/api/webhooks/abacatepay` com `ABACATEPAY_WEBHOOK_SECRET`.

## Notas
- O app serve API e front juntos (Express). Certifique-se de que o build está sendo servido em produção (já previsto em `server/index.ts`).
- Banco é externo (Neon); sem necessidade de container de DB na Hostinger.
