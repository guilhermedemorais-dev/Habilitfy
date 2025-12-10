# Backlog de Desenvolvimento – HabilitaFácil

## Contexto técnico atual (resumo)
- Backend: Node/Express (`server/index.ts`), rotas em `server/routes.ts`, Drizzle + Postgres (`server/storage.ts`, `shared/schema.ts`), sessões com `express-session` + `connect-pg-simple`, OIDC (Replit) e middleware `isAuthenticated`.
- Frontend: Vite/React (`client/`), wouter para rotas, React Query (`lib/queryClient.ts`), `useAuth` para `/api/auth/user`. UI Radix/Shadcn, bottom nav. Apenas `MapPage` consome API real; demais telas usam mocks (`lib/data.ts`).
- Dados: tabelas `users`, `instructors`, `bookings`, `reviews`, `availability`, `sessions`. Availability implementada no storage, sem rotas expostas.
- Infra: dev local; sem Docker Compose ou deploy configurado. Pagamento é mock (checkout/tela de sucesso).

## Autenticação & Sessões
- [x] Backend OIDC + sessões em Postgres, rotas `/api/login`, `/api/logout`, `/api/auth/user`.
- [ ] Fluxo de login/logout no frontend (chamar `/api/login`/`/api/logout`, tratar 401 e redirecionar).
- [ ] Proteger rotas no frontend por role (student/instructor/admin) e redirecionar em 401/403.
- [ ] Endurecer checagem de owner/role nas rotas sensíveis (PATCH booking/instructor, admin).

## Módulo Instrutor
- [x] Endpoints backend: listar/detalhar/criar/atualizar instrutor, rota de pendentes admin.
- [ ] Expor rotas HTTP de availability (CRUD) e validar horários.
- [ ] Integrar `SignupInstructor.tsx` com POST `/api/instructors` (hoje mock).
- [ ] Painel instrutor consumir `/api/bookings/instructor/:id` e mostrar agenda real (hoje mock).
- [ ] UI para disponibilidade (criar/editar slots) conectada às rotas.
- [ ] Upload/links de credencial e veículo (campos reais, persistência).

## Módulo Aluno
- [x] Lista/mapa de instrutores usando `/api/instructors` em `MapPage`.
- [ ] `InstructorProfile.tsx` consumir `/api/instructors/:id` e `/api/instructors/:id/reviews` (hoje mock).
- [ ] `Booking.tsx` criar booking via POST `/api/bookings` (incluindo aluguel veículo/total) e tratar respostas.
- [ ] `StudentDashboard.tsx` consumir `/api/bookings/student` (hoje mock).
- [ ] Envio de reviews via POST `/api/reviews` e recálculo em tempo real (UI).
- [ ] Usar availability real na seleção de horários.
- [ ] Checkout/pagamento: alinhar com backend (ainda mock) e atualizar status do booking.

## Módulo de Agendamento (Booking/Availability)
- [x] Modelo de dados + endpoints GET/POST/PATCH de bookings no backend.
- [ ] Garantir ownership/permissão nas rotas de booking (aluno só vê/cria os seus; instrutor só os seus).
- [ ] Validar conflitos/horários com availability e estado do instrutor.
- [ ] Disponibilidade: expor rotas e validar criação de booking contra slots.

## Módulo de Pagamento
- [ ] Implementar checkout real (PSP) e status `paid`; hoje é mock no frontend.
- [ ] Atualizar booking/status após pagamento; gerar comprovante simples.
- [ ] Configurar comissão (admin) e armazenar no booking/fatura.

## Módulo Admin
- [x] Endpoint `GET /api/admin/instructors/pending` com checagem de role admin.
- [ ] Tela Admin consumir API real e permitir aprovar/rejeitar (rotas específicas ou uso de PATCH).
- [ ] Listar bookings para auditoria no Admin (consumir backend).
- [ ] Expor/configurar comissão (persistência e UI).

## Segurança & LGPD
- [ ] CORS/config de origem permitida para front/admin.
- [ ] Rate limiting básico em rotas sensíveis.
- [ ] Minimização e proteção de dados sensíveis (CPF, pix); revisar responses.
- [ ] Políticas LGPD/termos publicados e referenciados na UI.

## Infra & Deploy
- [ ] Docker Compose (proxy + api + web estático + postgres) para dev/prod.
- [ ] Pipeline de build (front `npm run build`, api `npm run build`) e artefatos.
- [ ] Deploy na VPS Hostinger (KVM 4 vCPU/16 GB) com Caddy/Nginx + SSL; alternativa CDN para front.
- [ ] Configurar DB gerenciado (Neon/Supabase) ou Postgres em container com backup/volume.

## QA & Testes
- [ ] Fluxo completo manual: aluno → mapa → instrutor → horário → pagamento (mock) → sucesso.
- [ ] Testar autenticação/sessão (401/403) em rotas protegidas.
- [ ] Testar bookings inválidos (horário indisponível, instrutor errado, dados faltantes).
- [ ] Testar permissões por role (student/instructor/admin) no backend e na UI.
- [ ] Testar mutations React Query (erros/loading) e integração real com API.
- [ ] Criar testes automatizados mínimos (unit/integration) para rotas críticas.

## Instrução para IA
- Ler este backlog, o MCPS (`/docs/contexto/mcps-contexto-global.md`) e o PRD (`/docs/produto/prd-habilitafacil-mvp.md`) antes de atuar.
- Conferir o código atual antes de marcar qualquer tarefa como concluída.
- Marcar com [x] apenas o que estiver pronto; manter [ ] para pendentes ou parciais (anotar o que falta).
- Implementar o que faltar seguindo stack e padrões existentes.
