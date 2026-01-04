# Backlog Centralizado – HabilitFy

Este arquivo centraliza as listas de backlog (PRD e técnico) para evitar divergências.
Checklist de entregas por PRD (todos os itens começam pendentes; marcar conforme implementação real).
Fontes: `docs/produto/*.md`.

## Como ler
- Entregas por PRD: objetivos de produto e UX.
- Backlog técnico: tarefas de engenharia, integrações, segurança, infra e QA.

## Contexto técnico atual (resumo)
- Backend: Node/Express (`server/index.ts`), rotas em `server/routes.ts`, Drizzle + Postgres (`server/storage.ts`, `shared/schema.ts`), sessões com `express-session` + `connect-pg-simple`, OIDC (Replit) e middleware `isAuthenticated`.
- Frontend: Vite/React (`client/`), wouter para rotas, React Query (`lib/queryClient.ts`), `useAuth` para `/api/auth/user`. UI Radix/Shadcn, bottom nav. Apenas `MapPage` consome API real; demais telas usam mocks (`lib/data.ts`).
- Dados: tabelas `users`, `instructors`, `bookings`, `reviews`, `availability`, `sessions`. Availability implementada no storage, sem rotas expostas.
- Infra: dev local; sem Docker Compose ou deploy configurado. Pagamento é mock (checkout/tela de sucesso).

## Entregas por PRD (Produto)
### Visão Geral do Produto (`prd-habilitfy-mvp.md`)
- [ ] Fluxo completo: aluno → instrutor → booking → pagamento → aula → avaliação.
- [x] Suporte a aluguel de veículo no agendamento.
- [ ] Validação documental (KYC) integrada ao fluxo.
- [ ] Gestão financeira integrada (pagamentos, carteira, repasses).

### Página Home/Landing (`prd-pg-home.md`)
- [ ] Header com CTAs “Encontrar Instrutor” e “Quero Dar Aulas” navegando para busca/cadastros.
- [ ] Hero com busca por CEP/bairro, badge promo e CTA duplo (aluno/instrutor).
- [ ] Blocos de benefícios (aluno/instrutor), depoimentos slider e seção “Como funciona”.
- [ ] FAQ resumido e rodapé com links institucionais/redes; conteúdo editável via CMS.
- [ ] Analytics básico de cliques/CTAs e compatibilidade mobile-first.

### Página de Login Global (`prd-pg-login-global.md`)
- [ ] Tela de login com email/senha, feedback de erro e bloqueio após tentativas falhas.
- [ ] Links “Esqueci minha senha” e CTAs diretos “Cadastrar Aluno”/“Cadastrar Instrutor”.
- [ ] Redirecionar usuário autenticado direto para dashboard correto.
- [ ] LGPD/termos no rodapé e acessibilidade WCAG.

### Cadastro de Aluno (`prd-cadatro-aluno.md`)
- [ ] Fluxo step-by-step (dados pessoais → selfie/documento → comprovante teórico/CNH → revisão).
- [ ] Uploads validados, salvamento de progresso e status de etapa (pendente/análise/aprovado/rejeitado).
- [ ] Bloquear agendamento até KYC aprovado; logs e proteção LGPD.
- [ ] Notificações de status (email/app) e suporte para reenvio de documentos.

### Cadastro de Instrutor (`prd-cadastro-instrutor.md`)
- [ ] Fluxo step-by-step (dados pessoais → selfie/docs/Credencial Detran → chave Pix → veículos → serviços → revisão).
- [ ] Validação de uploads e formatos; status por etapa; consentimento LGPD.
- [ ] Cadastro de múltiplos veículos com uploads obrigatórios e status pendente até aprovação.
- [ ] Resumo final, salvamento parcial e notificação “cadastro enviado para análise”.

### Painel do Aluno (`prd-aluno.md`)
- [ ] Edição de perfil com upload de comprovante teórico e indicação de habilitado/não.
- [ ] Histórico de aulas com detalhes e avaliações pós-aula; bloqueio de agendar sem KYC.
- [ ] Check-in/out via QR Code integrando à liberação de pagamento.
- [ ] Carteira do aluno (saldo, extrato, reembolsos) e taxa mínima visível antes do agendamento.
- [ ] Guia do Aluno dinâmico (conteúdo do CMS) e notificações de lembretes/avaliações pendentes.
- [ ] Primeira aula avaliativa com exibição da recomendação de pacote de aulas.

### Painel do Instrutor (`prd-instrutor.md`)
- [ ] Dashboard de recebíveis/transações com filtros e comprovantes.
- [ ] CRUD de serviços ofertados por categoria com preço/hora e ativar/desativar.
- [ ] Cadastro/validação de veículos por categoria (status pendente/aprovado/rejeitado).
- [ ] Histórico de aulas com check-in/out via QR code (liberações 50/50) e logs.
- [ ] Chat aluno↔instrutor pós-booking (sistema interno, não WhatsApp).
- [ ] Cadastro de pontos de encontro.
- [ ] Perfil: upload de foto, chave Pix com histórico de alterações, notificações de validação/pagamento.
- [ ] Fluxo da primeira aula avaliativa e sugestão de pacote exibida ao aluno.

### Mapa/Listagem (`prd-maps-lista.md`)
- [x] Alternar mapa/lista.
- [ ] Filtros (nota, preço, veículo, localidade, tipo de serviço).
- [ ] Mostrar apenas instrutores aprovados/KYC ok com dados básicos e distância. (aprovados ok; falta distância/KYC real)
- [ ] Persistir filtros/posição do mapa e botão “Atualizar resultados”.
- [ ] Perfil do instrutor inclui links Instagram/YouTube; dados sensíveis só após booking/pagamento.

### Pagamentos (`prd-pagamento.md`)
- [ ] Checkout com resumo da aula, taxa da plataforma e opções Pix/cartão (gateway).
- [ ] Implementar split (config admin) e refletir valores para instrutor/plataforma.
- [ ] Status de pagamento (pendente/pago/cancelado/expirado) com webhook e reenvio em caso de falha.
- [ ] Extrato financeiro para aluno e instrutor (ganhos, saques, reembolsos).
- [ ] Fluxo de reembolso com aprovação/admin e opção de crédito em carteira.
- [ ] Saques do instrutor via Pix e configuração de gateway/feature flag mock vs real.

### Admin – Painel Geral (`prd-admin.md`)
- [x] Dashboard com cards básicos de KPIs (instrutores, alunos, aulas, volume).
- [x] Dashboard completo com mapa Brasil, gráfico financeiro e alertas críticos.
- [x] Mapa admin: filtro por estado/cidade e localização de alunos (quando houver dados geográficos).
- [x] Listas básicas de instrutores e alunos com busca e filtro de status.
- [ ] Ações administrativas completas (editar dados, banir/bloquear, reset senha, logs por perfil).
- [x] KYC básico com fila de pendentes e aprovar/rejeitar status.
- [ ] KYC por documento com comentários, timeline e reanálise.
- [ ] Perfil detalhado com documentos, veículos, histórico de aulas/avaliações, saldo e logs de ações.
- [x] Gestão financeira: configurar gateways, status e credenciais mascaradas.
- [x] Gestão financeira: transações em tempo real com filtros e exportação CSV.
- [x] Gestão financeira: carteiras com saldo e extrato recente.
- [x] Gestão financeira: saques com aprovação manual.
- [ ] Gestão financeira: reembolsos e chargebacks (fluxo completo).
- [ ] Gestão financeira: relatórios PDF e conciliação avançada.
- [ ] Monitoramento do sistema (health, alertas), logs de eventos e incidentes.
- [ ] Permissões granulares por papel (admin/financeiro/suporte/KYC) e auditoria completa.
- [ ] Permissões granulares por papel (admin/financeiro/suporte/KYC) e auditoria completa.

### Módulo de Comunicação (Chat Interno)
- [x] Backend: tabela `messages` e rotas de envio/recebimento.
- [x] Frontend: Hook `useChat` e componente `ChatWindow` com polling.
- [x] Frontend: Página `/chat` e integração no Dashboard.
- [x] Substituir botões de WhatsApp pelo Chat Interno.

### Admin – KYC (`prd-admin-kyc.md`)
- [x] Painel de triagem com filtros por tipo/status/cidade e visualização de uploads (Implementado em Admin.tsx).
- [x] Aprovar/rejeitar com comentário obrigatório, logs e notificações (Implementado em Admin.tsx e route PATCH).
- [ ] Reprocessar análise quando documentos forem reenviados; LGPD e exportação de histórico.
- [ ] Preparar ganchos para integrações futuras (gov.br/CNH Digital/Detran).

### Admin – CMS (`prd-admin-cms.md`)
- [ ] CRUD de banners (upload, período, ordem, preview e publicar/despublicar).
- [ ] Editor de textos institucionais com histórico de versões e preview (política/termos/rodapé).
- [ ] Guia do Aluno dinâmico com ordenação drag & drop e agendamento de tópicos.
- [ ] Notificações globais (segmento, agendamento, histórico/log).
- [ ] Branding visual (logo, favicon, cores) aplicável sem deploy e com permissões.

## Backlog Técnico (Dev)
### Autenticação & Sessões
- [x] Backend OIDC + sessões em Postgres, rotas `/api/login`, `/api/logout`, `/api/auth/user`.
- [x] Fluxo de login/logout no frontend (chamar `/api/login`/`/api/logout`, tratar 401 e redirecionar).
- [ ] Proteger rotas no frontend por role (student/instructor/admin) e redirecionar em 401/403. (admin ok via AuthGuard; falta aplicar roles em aluno/instrutor e tratar 401/403 globais)
- [x] Endurecer checagem de owner/role nas rotas sensíveis (PATCH booking/instructor com validação completa).

### Módulo Instrutor
- [x] Endpoints backend: listar/detalhar/criar/atualizar instrutor, rota de pendentes admin.
- [ ] Expor rotas HTTP de availability (CRUD) e validar horários.
- [ ] Integrar `SignupInstructor.tsx` com POST `/api/instructors` (hoje mock).
- [x] Painel instrutor consumir `/api/bookings/instructor/:id` e mostrar agenda real (integrado com dados reais).
- [ ] UI para disponibilidade (criar/editar slots) conectada às rotas.
- [ ] Upload/links de credencial e veículo (campos reais, persistência).

### Módulo Aluno
- [x] Lista/mapa de instrutores usando `/api/instructors` em `MapPage`.
- [x] `InstructorProfile.tsx` consumir `/api/instructors/:id` e `/api/instructors/:id/reviews` (hoje mock).
- [x] `Booking.tsx` criar booking via POST `/api/bookings` (incluindo aluguel veículo/total) e tratar respostas.
- [x] `StudentDashboard.tsx` consumir `/api/bookings/student` (integrado com dados reais).
- [ ] Envio de reviews via POST `/api/reviews` e recálculo em tempo real (UI).
- [ ] Usar availability real na seleção de horários.
- [ ] Checkout/pagamento: alinhar com backend (ainda mock) e atualizar status do booking. (UI chama `/api/payments/abacatepay`, mas sem polling/status)

### Módulo de Agendamento (Booking/Availability)
- [x] Modelo de dados + endpoints GET/POST/PATCH de bookings no backend.
- [x] Garantir ownership/permissão nas rotas de booking (validação completa implementada).
- [x] Validar conflitos/horários com availability e estado do instrutor (validação de double-booking e availability).
- [x] Disponibilidade: expor rotas e validar criação de booking contra slots (rotas GET/POST criadas com ownership).
- [x] Rate limiting em rotas sensíveis (bookings, pagamentos).
- [x] Toast notifications para feedback ao usuário.

### Módulo de Pagamento
- [x] Backend: criação de cobrança AbacatePay (`/api/payments/abacatepay`), persistência de `paymentId/paymentUrl/paymentStatus/methods/devMode`, e webhook inicial para status.
- [ ] Validar assinatura do webhook (`ABACATEPAY_WEBHOOK_SECRET`), reconciliação completa e migração aplicada em DB (novas colunas/status enum).
- [ ] Integrar frontend ao checkout real (usar `paymentUrl`, polling/webhook) e refletir status `paid`/`cancelled`.
- [ ] Gerar comprovante simples pós-pagamento.
- [ ] Configurar comissão (admin) e armazenar no booking/fatura.

### Módulo Admin
- [x] Endpoint `GET /api/admin/instructors/pending` com checagem de role admin.
- [x] Tela Admin consumir API real e permitir aprovar/rejeitar (rotas específicas ou uso de PATCH).
- [x] Listar bookings para auditoria no Admin (consumir backend).
- [ ] Expor/configurar comissão (persistência e UI).

### Segurança & LGPD
- [ ] CORS/config de origem permitida para front/admin.
- [ ] Rate limiting básico em rotas sensíveis.
- [ ] Minimização e proteção de dados sensíveis (CPF, pix); revisar responses.
- [ ] Políticas LGPD/termos publicados e referenciados na UI.

### Infra & Deploy
- [ ] Pipeline de build (front `npm run build`, api `npm run build`) e artefatos.
- [x] Deploy alvo: Hostinger app Node.js + Neon Postgres (ver `docs/deploy/hostinger-neon.md`).
- [ ] Automatizar deploy (import Git Hostinger ou pipeline) e checar `npm start`.
- [ ] TLS/DNS configurados no painel Hostinger (ex.: `api.seu-dominio.com`).

### QA & Testes
- [ ] Fluxo completo manual: aluno → mapa → instrutor → horário → pagamento (mock) → sucesso.
- [ ] Testar autenticação/sessão (401/403) em rotas protegidas.
- [ ] Testar bookings inválidos (horário indisponível, instrutor errado, dados faltantes).
- [ ] Testar permissões por role (student/instructor/admin) no backend e na UI.
- [ ] Testar mutations React Query (erros/loading) e integração real com API.
- [ ] Criar testes automatizados mínimos (unit/integration) para rotas críticas.

## Instrução para IA
- Ler este backlog, o MCPS (`/docs/contexto/mcps-contexto-global.md`) e o PRD (`/docs/produto/prd-habilitfy-mvp.md`) antes de atuar.
- Conferir o código atual antes de marcar qualquer tarefa como concluída.
- Marcar com [x] apenas o que estiver pronto; manter [ ] para pendentes ou parciais (anotar o que falta).
- Implementar o que faltar seguindo stack e padrões existentes.
