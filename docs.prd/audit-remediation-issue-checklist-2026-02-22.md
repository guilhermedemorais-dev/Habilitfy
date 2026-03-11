# Checklist de Issues por Sprint - Remediação Auditoria HabilitFy

Data: 2026-02-22  
Plano base: `docs.prd/audit-remediation-sprint-plan-2026-02-22.md`

## Como usar

- Crie uma issue para cada item abaixo mantendo o mesmo ID.
- Não inicie issues de sprint posterior sem fechar os bloqueadores da sprint atual.
- Marque os checkboxes apenas após evidência objetiva de aceite.
- Para itens que afetam produção, aplique o bloco "Guardrails comuns" abaixo como subtarefas obrigatórias.

Verificação local em 2026-03-11:
- `npm run check`: OK
- `npm run test:unit`: OK
- `npm run verify`: OK
- Pendências remanescentes concentram-se em evidência operacional externa e em aceites funcionais não automatizados

## Guardrails comuns (adicionar em toda issue com impacto em produção)

[ ] Definir plano de rollback técnico e operacional.  
[ ] Agendar janela de deploy de baixo risco com responsável on-call.  
[ ] Executar backup/snapshot antes da mudança.  
[ ] Validar em homologação/staging antes de produção.  
[ ] Fazer rollout progressivo (canário) quando aplicável.  
[ ] Monitorar 60 minutos pós-deploy (erros, latência, auth, pagamentos).  
[ ] Registrar evidências de validação e monitoramento na issue.  

## Runbook Operacional - Fechamento da Sprint 0

Use este bloco para encerrar a Sprint 0 sem depender de memória informal. A parte de repositório já foi saneada; o restante depende de execução fora do Git.

### 1. Estado já resolvido no repositório

- `.env.production` foi removido do versionamento ativo.
- `.gitignore` já bloqueia `.env` e `.env.*`.
- O template seguro continua em `.env.production.example`.

Validação objetiva:
- `git ls-files .env.production` deve retornar vazio.

### 2. Rotação obrigatória de credenciais (fora do Git)

Executar em secret manager, painel do provedor ou servidor de produção:

[ ] Rotacionar `GOOGLE_CLIENT_SECRET`.  
[ ] Rotacionar `SESSION_SECRET`.  
[ ] Rotacionar credenciais de banco (`DB_USER`/`DB_PASSWORD` ou `DATABASE_URL`).  
[ ] Rotacionar chaves de gateways e integrações críticas (Stripe, AbacatePay, OpenAI e similares).  
[ ] Revogar explicitamente as credenciais antigas.  

Evidência mínima para anexar na issue:
- timestamp da rotação
- sistema afetado
- responsável
- confirmação de revogação da credencial antiga

### 3. Atualização segura de configuração

[ ] Atualizar apenas o secret manager / servidor / `.env.production` local com os novos valores.  
[ ] Não reversionar nenhum arquivo `.env*` real.  
[ ] Validar que a aplicação sobe com as novas credenciais.  

Validação objetiva:
- login OAuth continua funcional
- sessão continua válida após login/logout
- conexão com banco abre normalmente
- integrações críticas respondem sem erro de autenticação

### 4. Rollback obrigatório

[ ] Documentar rollback técnico (como restaurar segredo/config anterior em caso de falha).  
[ ] Documentar rollback operacional (quem executa, onde, em quanto tempo).  
[ ] Testar o procedimento em staging/homologação ou registrar simulação controlada.  

Template mínimo de evidência:
- responsável:
- comando/passos:
- pré-condição:
- gatilho para rollback:
- resultado do teste:

### 5. Monitoramento pós-deploy

[ ] Realizar deploy em janela de baixo risco.  
[ ] Monitorar por 60 minutos: erros, latência, login, pagamentos, webhooks.  
[ ] Registrar se houve ou não regressão crítica.  

Checklist de monitoramento:
[ ] Auth/login sem regressão.  
[ ] Logout sem loop.  
[ ] Painel admin carrega sem erro crítico.  
[ ] Pagamentos e webhooks sem duplicidade/erros novos.  
[ ] Logs sem payload sensível.  

### 6. Critério objetivo para encerrar a Sprint 0

Só marcar `SEC-001`, `SEC-002`, `SEC-003` e o checklist da Sprint 0 como concluídos quando:

[x] `git ls-files .env.production` sem retorno.  
[ ] Credenciais antigas revogadas.  
[ ] Evidência de rotação anexada.  
[ ] Rollback documentado/testado.  
[ ] Monitoramento pós-deploy concluído sem regressão crítica.  

## Sprint 0 - Contenção de Risco Crítico (bloqueadora)

### [ ] SEC-001 - Rotacionar credenciais expostas
- Tipo: Security
- Prioridade: P0
- Dependências: nenhuma
- Arquivos/sistemas afetados: provedores OAuth, banco, sessão, gateways de pagamento
- Descrição: rotacionar todas as credenciais possivelmente comprometidas.
- Subtarefas:
[ ] Rotacionar `GOOGLE_CLIENT_SECRET`.
[ ] Rotacionar `SESSION_SECRET`.
[ ] Rotacionar credenciais de banco e chaves de integração.
[ ] Revogar credenciais antigas.
- Critérios de aceite:
- Credenciais antigas não autenticam mais.
- Inventário de credenciais atualizado em repositório seguro (vault/secret manager).
- Evidência de rotação anexada na issue.
- Validação:
- Teste com credencial antiga deve falhar.

### [ ] SEC-002 - Remover segredos do versionamento
- Tipo: Security
- Prioridade: P0
- Dependências: SEC-001
- Arquivos afetados: `.env.production`, `.gitignore`, documentação de bootstrap
- Descrição: retirar segredos do Git e formalizar processo seguro de distribuição de env.
- Subtarefas:
[x] Remover `.env.production` do controle de versão.
[ ] Garantir bloqueio por `.gitignore` e política de pre-commit.
[x] Atualizar instruções de setup sem expor segredo.
- Critérios de aceite:
- `git ls-files .env.production` sem retorno.
- Processo de provisionamento de env documentado.
- Validação:
- Execução limpa de bootstrap usando template sem segredos reais.

### [ ] SEC-003 - Sanitizar dump de produção
- Tipo: Security/Data
- Prioridade: P0
- Dependências: nenhuma
- Arquivos afetados: `migrations/production_full_dump.sql`
- Descrição: remover PII real do dump ou substituir por dataset sintético.
- Subtarefas:
[ ] Definir estratégia (remoção do dump ou anonimização completa).
[ ] Aplicar sanitização em emails, CPF, telefone, coordenadas e demais PII.
[ ] Garantir que dados sintéticos preservem formato técnico para testes.
- Critérios de aceite:
- Nenhum dado pessoal real permanece no dump versionado.
- Scanner de padrões sensíveis anexado na PR.
- Validação:
- Busca por padrões de PII não retorna dados reais.

### [ ] SEC-004 - Bloquear `AUTH_MODE=local` em produção
- Tipo: Security/Auth
- Prioridade: P0
- Dependências: nenhuma
- Arquivos afetados: `server/auth.ts`, boot de runtime, docs
- Descrição: impedir inicialização insegura em `NODE_ENV=production`.
- Subtarefas:
[x] Adicionar guarda de inicialização para combinação inválida.
[x] Expor erro explícito de configuração.
[x] Documentar comportamento esperado por ambiente.
- Critérios de aceite:
- Aplicação aborta boot quando `NODE_ENV=production` e `AUTH_MODE=local`.
- Fluxo legítimo de produção mantém autenticação correta.
- Validação:
- Teste manual automatizável do boot inválido.

## Sprint 1 - Estabilização de Engenharia

### [ ] ENG-001 - Corrigir TypeScript do calendário
- Tipo: Engineering/Frontend
- Prioridade: P1
- Dependências: Sprint 0 fechada
- Arquivos afetados: `client/src/components/ui/calendar.tsx`
- Descrição: alinhar componente com API atual de `react-day-picker`.
- Subtarefas:
[x] Remover imports e props não suportadas.
[x] Ajustar tipos de `components`, `classNames`, `formatters`.
[x] Eliminar `any` implícito.
- Critérios de aceite:
- Sem erros TS no arquivo de calendário.
- Sem regressão visual/funcional no uso do calendário.
- Validação:
- `npm run check`.

### [ ] ENG-002 - Corrigir tipagem decimal no storage
- Tipo: Engineering/Backend
- Prioridade: P1
- Dependências: Sprint 0 fechada
- Arquivos afetados: `server/storage.ts`, `shared/schema.ts` (se necessário)
- Descrição: alinhar `pricePerHour` ao contrato Drizzle e payload de inserção/atualização.
- Subtarefas:
[x] Corrigir `createInstructor` para tipo compatível com decimal.
[x] Corrigir `updateInstructor` para tipo compatível.
[x] Garantir consistência entre schema e zod.
- Critérios de aceite:
- Sem erro TS em `server/storage.ts`.
- Fluxo de criar/editar instrutor funcionando.
- Validação:
- `npm run check` e teste de fluxo de instrutor.

### [x] ENG-003 - Corrigir suíte unitária de integrações
- Tipo: Testing
- Prioridade: P1
- Dependências: Sprint 0 fechada
- Arquivos afetados: `server/integrations.routes.test.ts`, `package.json`
- Descrição: resolver falha por ausência de dependência/runtime de testes.
- Subtarefas:
[x] Adicionar `supertest` runtime ou ajustar abordagem de teste.
[x] Garantir import resolvido e execução da suíte.
[x] Revisar setup de testes para evitar novas quebras.
- Critérios de aceite:
- Suíte `integrations.routes.test.ts` executa com sucesso.
- `npm run test:unit` passa integralmente.
- Validação:
- `npm run test:unit`.

### [ ] ENG-004 - Criar gate local `npm run verify`
- Tipo: Engineering/DevX
- Prioridade: P1
- Dependências: ENG-001, ENG-002, ENG-003
- Arquivos afetados: `package.json`, docs de contribuição
- Descrição: consolidar check + testes unitários em comando único.
- Subtarefas:
[x] Adicionar script `verify` no `package.json`.
[x] Atualizar documentação de contribuição.
[ ] Integrar comando como padrão em PR.
- Critérios de aceite:
- `npm run verify` executa `check` e `test:unit`.
- Time adota comando como gate mínimo local.
- Validação:
- Execução do comando em ambiente limpo.

## Sprint 2 - Contrato de API e Segurança Operacional

### [ ] API-001 - Deduplicar rotas administrativas
- Tipo: API/Backend
- Prioridade: P1
- Dependências: ENG-004
- Arquivos afetados: `server/routes.ts` (e novos módulos se aplicável)
- Descrição: remover duplicidade de `GET /api/admin/instructors` e `GET /api/admin/users`.
- Subtarefas:
[x] Escolher implementação canônica por endpoint.
[x] Remover rotas duplicadas e ajustar chamadas dependentes.
[ ] Registrar contrato final em docs.
- Critérios de aceite:
- Apenas uma definição por endpoint no código.
- Resposta do endpoint estável e previsível.
- Validação:
- Testes de integração/contrato das rotas admin.

### [ ] API-002 - Unificar `GET /api/auth/user`
- Tipo: API/Auth
- Prioridade: P1
- Dependências: ENG-004
- Arquivos afetados: `server/auth.ts`, `server/routes.ts`
- Descrição: manter uma única fonte de verdade para endpoint de usuário autenticado.
- Subtarefas:
[x] Definir arquivo proprietário da rota.
[x] Remover duplicata e ajustar middlewares.
[ ] Garantir retorno consistente para frontend.
- Critérios de aceite:
- Endpoint definido uma única vez.
- Sem quebra no `useAuth` do cliente.
- Validação:
- Teste de integração do endpoint + smoke no login.

### [ ] SEC-005 - Redaction de logs de resposta
- Tipo: Security/Observability
- Prioridade: P1
- Dependências: ENG-004
- Arquivos afetados: `server/index.ts`, logger utilitário
- Descrição: eliminar logging de payload completo mantendo telemetria útil.
- Subtarefas:
[x] Remover captura de corpo completo de `res.json`.
[ ] Padronizar campos mínimos (rota, status, latência, correlation id).
[x] Criar lista de campos sensíveis para redaction.
- Critérios de aceite:
- Logs não contêm PII/tokens por padrão.
- Observabilidade operacional preservada.
- Validação:
- Teste com payload sensível e inspeção de logs.

### [ ] PAY-001 - Idempotência no webhook Stripe
- Tipo: Payments/Backend
- Prioridade: P1
- Dependências: ENG-004
- Arquivos afetados: `server/routes.ts`, camada de transação/storage
- Descrição: impedir processamento duplicado para mesmo evento de webhook.
- Subtarefas:
[x] Definir chave idempotente (`event.id`/`session.id`).
[ ] Persistir processamento com trava atômica.
[x] Ignorar reentregas já processadas.
- Critérios de aceite:
- Mesmo evento não gera transação duplicada.
- Fluxo normal de pagamento preservado.
- Validação:
- Simulação de reenvio do mesmo webhook.

## Sprint 3 - Modularização Estrutural

### [ ] ARC-001 - Modularizar rotas por domínio
- Tipo: Architecture/Backend
- Prioridade: P2
- Dependências: API-001, API-002, SEC-005, PAY-001
- Arquivos afetados: `server/routes.ts`, pasta de rotas por domínio
- Descrição: decompor arquivo monolítico em módulos coesos.
- Subtarefas:
[ ] Criar módulos: `auth`, `admin`, `bookings`, `payments`, `kyc`, `chat`.
[ ] Transformar `server/routes.ts` em registrador/orquestrador.
[ ] Garantir ordem correta de middlewares.
- Critérios de aceite:
- Redução significativa de complexidade em `server/routes.ts`.
- Rotas preservam comportamento funcional.
- Validação:
- `npm run verify` + smoke de rotas principais.

### [ ] ARC-002 - Padronizar RBAC admin
- Tipo: Architecture/Security
- Prioridade: P2
- Dependências: ARC-001
- Arquivos afetados: middlewares de auth/role, rotas admin
- Descrição: centralizar autorização em middleware único e auditável.
- Subtarefas:
[ ] Definir matriz de papéis/permissões (`master`, `manager`, `support`).
[ ] Migrar checagens manuais para middleware.
[ ] Cobrir com testes por papel.
- Critérios de aceite:
- Sem checagem manual espalhada em rotas admin.
- Política única e documentada.
- Validação:
- Testes de autorização por role.

### [ ] ARC-003 - Fatiar `Admin.tsx` por contexto
- Tipo: Architecture/Frontend
- Prioridade: P2
- Dependências: ARC-001
- Arquivos afetados: `client/src/pages/Admin.tsx` e novos módulos
- Descrição: dividir tela admin em containers/componentes por domínio.
- Subtarefas:
[x] Mapear domínios visuais (usuários, instrutores, pagamentos, settings).
[x] Extrair componentes e hooks dedicados.
[ ] Preservar comportamento e navegação.
- Critérios de aceite:
- `Admin.tsx` reduzido e com responsabilidade de composição.
- Melhor testabilidade e legibilidade.
- Validação:
- `npm run check` + smoke test de fluxo admin.

### [ ] DOC-001 - Atualizar README para stack real
- Tipo: Documentation
- Prioridade: P2
- Dependências: ENG-004
- Arquivos afetados: `README.md`
- Descrição: corrigir divergência entre documentação e stack efetiva.
- Subtarefas:
[x] Ajustar versões/frameworks declarados (React/Vite/MySQL).
[x] Atualizar seção de setup, build, teste e deploy real.
[ ] Remover instruções obsoletas.
- Critérios de aceite:
- README condiz com código atual.
- Onboarding consegue subir projeto sem instrução externa adicional.
- Validação:
- Dry run de onboarding seguindo apenas README.

## Quadro Resumido (ordem de execução)

[ ] Sprint 0 completa (`SEC-001` a `SEC-004`)  
[ ] Sprint 1 completa (`ENG-001` a `ENG-004`)  
[ ] Sprint 2 completa (`API-001`, `API-002`, `SEC-005`, `PAY-001`)  
[ ] Sprint 3 completa (`ARC-001`, `ARC-002`, `ARC-003`, `DOC-001`)  

## Gate final

- `npm run verify` em verde.
- Sem segredos em versionamento.
- Sem PII real em artefatos de migração/versionamento.
- Endpoints sem duplicidade.
- Webhook de pagamento idempotente.
