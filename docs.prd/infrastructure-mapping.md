# Infrastructure Mapping

- Fonte atual: não existia `/docker`; deploy documentado em `docs/deploy/hostinger-neon.md` (Hostinger Node app + Postgres Neon externo). `.env.example` define variáveis críticas.
- Factory Docker Units:
  - `factory/docker/Dockerfile.app`: imagem Node 20 slim, roda `npm run build`, copia `dist/public` para `public` para servir estático e inicia com `npm start`.
- Factory Runtime Topology:
  - `factory/docker/docker-compose.factory.yml`: serviço único `habilitfy-app`, build a partir da raiz do repo, expõe `5000:5000` e depende de `DATABASE_URL` externo (Neon). Nenhum container de DB ou PSP foi criado porque não existe definição atual.
- Factory Environment Registry: `factory/infra/environment-registry.md` consolida todas as envs (auth, banco, payments, e2e mocks).
- Ops mapeados:
  - Migração: `npm run db:push` (Drizzle) aplicando schema no Postgres.
  - Seed: `npm run seed:auth` (detalhe em `factory/ops/seed-spec.md`).
  - Build/start: `npm run build` seguido de `npm start` (empacotado no Dockerfile).
