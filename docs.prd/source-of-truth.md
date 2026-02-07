# Factory Source of Truth

- Factory está integrado em `/factory` com os artefatos originais copiados para `/factory/factory`; o código de produto continua fora dessa pasta.
- Documentação do produto permanece em `/docs` (principal referência de deploy: `docs/deploy/hostinger-neon.md`).
- Contratos de ambiente estão em `.env.example` e o pipeline de build em `script/build.cjs` (usado por `npm run build`).
- Não havia `/docker` nem compose no projeto; os artefatos do Factory mapeiam o stack atual (Node/Express + Vite/React + Drizzle/Postgres + AbacatePay) sem alterar comportamento.
- Incertezas e pendências estão registradas em `factory/docs/gaps.md` e devem ser resolvidas antes de mudanças de infra.
