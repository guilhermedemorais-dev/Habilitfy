# Quality Gates

- Build: `npm run build` deve completar sem erros (gera server + client).
- Tipagem: `npm run check` para garantir TS sem quebras.
- Testes unitários: `npm run test:unit` deve passar antes de merge/deploy.
- Testes e2e: `npm run test:e2e` quando DB e mock AbacatePay estiverem disponíveis.
- Infra: `docker build -f factory/docker/Dockerfile.app ..` deve funcionar; compose sobe com `.env` válido.
- Segurança: confirmar `DATABASE_URL`/`SESSION_SECRET` não com valores de exemplo antes de produção.
