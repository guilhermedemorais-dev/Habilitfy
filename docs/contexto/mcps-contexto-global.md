# MCPS – Contexto Global do Produto

## Identidade do produto
- Nome: HabilitFy.
- Proposta: marketplace/app de aulas práticas de direção, conectando alunos a instrutores credenciados (foco inicial RJ).

## Objetivo do MVP
- Lançar um fluxo completo aluno → instrutor → pagamento (mock) → aula concluída até 20/12/2025.
- Validar viabilidade com 100–150 instrutores e ~100 alunos (até jan/2026), preparando base para pagamento real e endurecimento de permissões.

## Papéis do sistema
- Aluno (role student): cria bookings, envia reviews, vê seus bookings.
- Instrutor (role instructor): cadastra perfil (pending → approved), vê bookings recebidos.
- Admin (role admin): aprova/rejeita instrutores, supervisiona bookings, define comissão (config futura).
- Sistema: sessão/autenticação, cálculo de rating, armazenamento de sessões.

## Fluxo principal (macro, 5–10 passos)
1) Aluno acessa lista/mapa de instrutores aprovados.
2) Abre perfil, escolhe horário (availability).
3) Cria booking com preço/duração e opção de aluguel de veículo.
4) Realiza pagamento (mock no MVP) e recebe confirmação/dados de contato (WhatsApp).
5) Aula acontece; booking pode ir para completed/cancelled.
6) Aluno envia avaliação (review) após aula concluída.
7) Admin gerencia aprovação de instrutores e auditoria básica de bookings.

## Regras de negócio-chave
- Instrutor só aparece se status = approved.
- Preço definido pelo instrutor; aluguel de veículo opcional soma ao total.
- Comissão configurável pelo admin (campo/config futura).
- Status de aula: pending, paid, completed, cancelled.
- Avaliação só após aula concluída.
- Disponibilidade deve existir para oferecer horários válidos.
- Logs mínimos de eventos sensíveis (login, criação/atualização booking, aprovação instrutor).

## Escopo essencial do sistema (atual)
- Auth via OIDC (Replit em dev) com sessões em Postgres.
- Perfis: aluno, instrutor, admin.
- Catálogo de instrutores (pending/approved/rejected) com geolocalização básica.
- Bookings com preço, duração, veículo/aluguel, status.
- Reviews com cálculo de rating médio e reviewsCount.
- Availability por instrutor (tabela pronta; rotas ainda não expostas).
- Sessões persistentes na tabela `sessions`.

## Arquitetura técnica atual
- Backend: Node/Express (`server/index.ts`, rotas em `server/routes.ts`), Drizzle ORM + Postgres (`server/storage.ts`, `shared/schema.ts`), sessões via `express-session` + `connect-pg-simple`.
- Frontend: Vite/React (`client/`), wouter (rotas), React Query (`lib/queryClient.ts`), UI Radix/Shadcn, bottom nav.
- Compartilhado: schemas Drizzle + zod em `shared/schema.ts`.
- Infra local: API porta 5000; Vite dev porta 5173 (ou similar); envs: `DATABASE_URL`, `SESSION_SECRET`, `REPL_ID`, `ISSUER_URL`.
- Infra de produção planejada: VPS Hostinger KVM (4 vCPU/16 GB) com Docker Compose, reverse proxy (Caddy/Nginx), containers para API, web estático e Postgres (ou DB gerenciado Neon/Supabase). DNS: `api.seu-dominio.com`, `www.seu-dominio.com`, opcional `admin`. Alternativa: front em Vercel/Netlify + API em Railway/Fly + DB Neon/Supabase.

## Rotas/serviços principais (backend)
- Auth: `/api/login`, `/api/logout`, `/api/auth/user` (sessão OIDC, retorna user + instructorProfile).
- Instrutores: `GET /api/instructors?status=...`, `GET /api/instructors/:id`, `POST /api/instructors` (auth), `PATCH /api/instructors/:id`, `GET /api/admin/instructors/pending` (auth, exige role admin).
- Bookings: `GET /api/bookings/student` (auth), `GET /api/bookings/instructor/:instructorId` (auth), `POST /api/bookings` (auth, usa studentId da sessão), `PATCH /api/bookings/:id`.
- Reviews: `GET /api/instructors/:id/reviews`, `POST /api/reviews` (auth, recalcula rating/reviewsCount).
- Availability: implementado no storage; rotas HTTP ainda não expostas.

## Contexto operacional
- Região foco inicial RJ; modelo “Uber de aulas”: conexão aluno ↔ instrutor credenciado Detran.
- Pagamento: mock (Pix/checkout simulado) no MVP; integração real será via gateway escolhido AbacatePay.
- Legalidade: instrutores devem ser credenciados; perfil guarda dados de credencial e veículo.

## Integração de pagamento (AbacatePay)
- Gateway selecionado para pagamento real; API baseada em intenção com endpoints diretos (ex.: `POST /billing/create`, `GET /billing/get`), idempotente e com envelope `{ data | error }`.
- Métodos previstos: Pix e cartão no mesmo payload de cobrança, com status, URL de pagamento e flags como `devMode`.
- SDKs oficiais e modo de desenvolvimento com chaves de API separadas; adotar dev mode enquanto substituímos o mock.
- Suporte/documentação: https://docs.abacatepay.com/pages/introduction e contato em ajuda@abacatepay.com.

## Referências de UI (MCP)
- Context7: usar para docs atuais de Next/React/Tailwind/Shadcn (ex.: “use context7”).
- Nuxt UI MCP: usar como inspiração de componentes e padrões visuais, adaptando para React.
- Figma MCP: usar para importar designs e tokens quando houver arquivo de design.

## MCPs Operacionais (DevOps/Produto)
- Sentry MCP: investigação de erros e alertas (https://mcp.sentry.dev).
- Linear MCP: tarefas/roadmap via Linear (https://mcp.linear.app/sse).
- Atlassian MCP: Jira/Confluence via OAuth (https://mcp.atlassian.com/v1/sse).

## Diretrizes para qualquer IA
- Ler este MCPS antes de atuar; ele é a fonte de verdade de contexto.
- Respeitar o PRD oficial em `/docs/produto/prd-habilitfy-mvp.md`.
- Não mudar stack (Node/Express/Drizzle/Postgres/Vite/React) sem motivo técnico forte e explícito.
- Manter consistência entre código, PRD, backlog e comportamento da aplicação.
- Qualquer mudança estrutural (rotas, papéis, arquitetura) deve ser registrada aqui e no PRD/backlog.

## Próximas etapas gerais
- Conectar a UI às APIs reais (substituir mocks, criar hooks/mutações).
- Implementar availability em rotas e telas.
- Endurecer permissões/roles e ownership em rotas sensíveis.
- Integrar pagamento real (depois do MVP) e ajustar checkout.
- Criar Docker Compose para VPS e configurar deploy.
- Fortalecer testes (fluxo completo aluno → instrutor → pagamento → sucesso).
