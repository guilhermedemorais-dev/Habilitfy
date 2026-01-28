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

- [x] Corrigir erros de TypeScript em `client/src/pages/Admin.tsx`, `client/src/pages/Booking.tsx`, `client/src/pages/Checkout.tsx` e `server/storage.ts`.
- [x] Corrigir falhas nos testes unitários de `server/integrations.routes.test.ts`.
- [x] Corrigir falhas nos testes e2e (`e2e/admin.spec.ts`, `e2e/booking-flow.spec.ts`, `e2e/home.spec.ts`).
- [x] Ajustar layout em telas grandes (UI “esticada”).
- [x] Admin/Finance: corrigir erro de SQL em `getAdminTransactionSeries` (GROUP BY em `transactions.created_at`).
- [x] E2E: evitar conflito de horário no `e2e/booking-flow.spec.ts` (gerar horário único/retry).
- [x] Login: remover referência a “login interno” na página pública; admin deve ter página separada.
- [x] Login: botão “Acessar minha conta” deve redirecionar para login do usuário e não simular sessão.
- [x] Repo hygiene: remover `factory/.venv` e `test-results/` do repositório e adicionar ignore adequado.
- [x] Navegação: ícone de usuário deve redirecionar para o perfil correto (admin/aluno/instrutor) quando logado.
- [x] Agendamento: seleção de horário não funciona no perfil do instrutor após escolher a data.
- [x] UI (desktop): botão “Agendar Horário” no perfil do instrutor estava grande demais e precisava de largura máxima.
- [x] UI (mobile): botão “Agendar Horário” ficava atrás do menu inferior; ajustar posição para não sobrepor.
- [x] Agendamento: implementar regra confirmada (instrutor define limite de aulas por aluno e duração de cada horário/slot).
- [x] Agendamento: UI de disponibilidade para o instrutor (CRUD de slots) conectada às rotas reais.
- [x] Agendamento: seleção de horários deve usar availability real (sem mocks).
- [x] Agendamento: bloquear fluxo se KYC não estiver aprovado.
- [x] Agendamento: iniciar aula com codigo de seguranca gerado no pagamento; cronometro em painel aluno/instrutor; finalizar com codigo ou QR do aluno.
- [x] Agendamento: ponto de encontro e chat pós-booking entre aluno e instrutor.
- [x] Agendamento: avaliação somente após check-out e primeira aula avaliativa com sugestão de pacote.

# Checklist 15-01-26 — Cadastros

- [x] Cadastro instrutor: bloquear avanço se etapa incompleta; exigir selfie com verificação humana (liveness) via biblioteca apropriada. (selfie manual para analise)
- [x] Cadastro instrutor: coletar dados completos do parceiro (nome, documento, endereço) e anexar documentos de instrutor + autorização do veículo.
- [x] Cadastro veículo: exigir fotos/documentos (placa visível) seguindo critérios estilo Uber.
- [x] Cadastro serviços: remover etapa do fluxo público e mover para painel interno (módulo com precificação, impostos e taxa HabilitFy).
- [ ] Cadastro instrutor: validar mensagens por campo e nao reiniciar fluxo ao avancar sem preencher.
- [ ] Cadastro instrutor: captura de selfie/documentos direto da câmera (desktop e mobile), sem upload manual.
- [ ] Cadastro instrutor: fallback sem câmera -> gerar QR para capturar no celular e enviar para o cadastro.

# Modulo IA (futuro)

- [ ] IA seed: gerar imagens de usuario para seeds internas (nao para usuario final).
- [ ] IA KYC: liveness + match facial com documento, com fallback manual.
- [ ] IA: definir provedor (Hugging Face MCP), limites/cotas e custos.
- [ ] IA: LGPD/biometria (consentimento, armazenamento, retencao, auditoria).

# Modulo taxas

- [ ] Pagamento/Carteira: liberar saque do instrutor apenas após aula concluida; criar fluxo de disputa para analise de fraude. (repasse ok; resolucao de disputa ainda sem ajuste financeiro)
- [ ] Cancelamento: aplicar taxa configuravel no admin quando aluno cancela (percentual dividido entre HabilitFy e instrutor). (config admin ok; falta aplicar no fluxo)
- [ ] Disputa: se o instrutor nao conclui a aula, abrir disputa para decidir se credito volta ao aluno ou instrutor. (endpoint criado; falta resolucao financeira)
