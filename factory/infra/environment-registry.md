# Environment Registry

| Variável | Obrigatória | Uso | Notas |
| --- | --- | --- | --- |
| DATABASE_URL | Sim | Postgres/Drizzle e sessão | Usar `sslmode=require` (Neon). |
| SESSION_SECRET | Sim | `express-session` | Chave forte e única por ambiente. |
| ISSUER_URL | Dev/Prod | OIDC issuer | Ex.: `https://accounts.google.com`. |
| OIDC_CLIENT_ID | Dev/Prod | OIDC client id | Substitui `REPL_ID` quando não usar Replit. |
| OIDC_CLIENT_SECRET | Dev/Prod | OIDC client secret | Necessário para fluxo OIDC confidencial. |
| REPL_ID | Legado | OIDC client id (Replit) | Usado apenas em ambientes Replit. |
| AUTH_MODE | Dev | `local` para bypass OIDC | Produção deve manter padrão OIDC. |
| LOCAL_USER_ID/ROLE/EMAIL/FIRSTNAME/LASTNAME | Dev | Mock user para `AUTH_MODE=local` | Permite login automático em `/api/login`. |
| SESSION_COOKIE_SECURE | Prod | Cookies de sessão | `true` em HTTPS; default ativa em `NODE_ENV=production`. |
| NODE_ENV | Todos | Comportamento Express/Vite | `production` em runtime da app. |
| HOST | Todos | Bind address | Default `0.0.0.0`. |
| PORT | Todos | Porta HTTP | Default `5000`. |
| REUSE_PORT | Opcional | Reuse socket | `true/false`. |
| SKIP_STATIC | Opcional | Pular static serve | `true` evita servir `public/`. |
| ABACATEPAY_API_KEY | Prod | Integração PSP | Obrigatório para billing real. |
| ABACATEPAY_BASE_URL | Dev/Test | Endpoint PSP | Default `https://api.abacatepay.com`; mock ajusta. |
| ABACATEPAY_DEV_MODE | Dev/Test | Modo sandbox do PSP | Default `true`. |
| ABACATEPAY_WEBHOOK_SECRET | Prod | Verificação webhook | Usado para validar `/api/webhooks/abacatepay` (TODO). |
| ABACATEPAY_MOCK_PORT | Teste | Porta mock | Default `5555` para `script/e2e-start.ts`. |
| E2E_PAYMENT_REDIRECT_URL | Teste | URL de redirect do mock | Default `/sucesso?paymentId=e2e`. |
| PLATFORM_FEE_PERCENT | Opcional | Script `backfill-finance.ts` | Default `0`. |
| REPLIT_INTERNAL_APP_DOMAIN | Dev | Meta tags | Constrói URLs OG em build. |
| REPLIT_DEV_DOMAIN | Dev | Meta tags | Alternativa para OG. |
